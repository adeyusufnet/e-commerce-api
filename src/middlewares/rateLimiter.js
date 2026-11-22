import rateLimit from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Bata umum untuk semua endpoint
export const globalLimiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Terlalu banyak request, coba lagi beberapa saat' },
});

// Batas ketat khusus login
export const loginLimiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 5,
    skipSuccessfulRequests: true, // hanya login gagal yang dihitung
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Terlalu banyak percobaan login, Coba kembali dalam 15 menit' },
    skip: () => process.env.NODE_ENV === 'test'
})