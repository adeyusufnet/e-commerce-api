import { verifyToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';

// Autentikasi: cek datanya asli atau tidak
export const authenticate = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
        throw new AppError('Token tidak ditemukan, silahkan login', 401)
    }

    const token = header.split(' ')[1];

    try {
        const payload = verifyToken(token);
        req.user = { id: payload.id, role: payload.role };
        next();
    } catch (error) {
        const message = error.name === 'TokenExpiredError' ? 'Token sudah kadaluarsa' : 'Token tidak valid';
        throw new AppError(message, 401);
    }
}

// Autorisasi: cek role akun user
export const authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        throw new AppError('Kamu tidak memiliki akses', 403);
    }
    next();
}