import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/jwt.js';
import { generateRefreshToken, hashToken } from '../utils/token.js';

// cetak sepasang token baru
const issueTokens = async (user, db = pool) => {
    const accessToken = signToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken();

    await db.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES ($1, $2, NOW() + $3::int * INTERVAL '1 day')`,
        [user.id, hashToken(refreshToken), Number(process.env.REFRESH_TOKEN_DAYS || 7)]
    );

    return { accessToken, refreshToken }
}

export const refresh = async (refreshToken) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows: [stored] } = await client.query(
            `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked_at, u.role
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1
       FOR UPDATE OF rt`,
            [hashToken(refreshToken)]
        );

        if (!stored) {
            throw new AppError('Refresh token tidak valid', 401);
        }

        // 🚨 Token lama dipakai lagi → kemungkinan dicuri → cabut SEMUA sesi user ini
        if (stored.revoked_at) {
            await client.query(
                'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
                [stored.user_id]
            );
            await client.query('COMMIT');
            throw new AppError('Sesi tidak valid, silakan login ulang', 401);
        }

        if (new Date(stored.expires_at) < new Date()) {
            throw new AppError('Refresh token sudah kedaluwarsa, silakan login ulang', 401);
        }

        // Rotation: hancurkan kartu lama, cetak yang baru (dengan role TERKINI dari DB)
        await client.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [stored.id]);
        const tokens = await issueTokens({ id: stored.user_id, role: stored.role }, client);

        await client.query('COMMIT');
        return tokens;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

export const register = async ({ name, email, password }) => {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) throw new AppError('Email sudah terdaftar', 409);

    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
        `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, role, created_at`,
        [name, email, passwordHash]
    );
    return rows[0];
};

export const login = async ({ email, password }) => {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    const isValid = user && (await bcrypt.compare(password, user.password_hash));
    if (!isValid) throw new AppError('Email atau password salah', 401);

    const tokens = await issueTokens(user);
    const { password_hash, ...safeUser } = user; // buang hash sebelum dikirim

    return { ...tokens, user: safeUser };
};

export const getProfile = async (id) => {
    const { rows } = await pool.query(
        'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
        [id]
    );
    if (!rows[0]) throw new AppError('User tidak ditemukan', 404);
    return rows[0];
};

export const logout = async (refreshToken) => {
    await pool.query(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL',
        [hashToken(refreshToken)]
    )
}

export const logoutAll = async (userId) => {
    await pool.query(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
        [userId]
    )
}