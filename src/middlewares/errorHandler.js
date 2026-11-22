export const notFound = (req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} tidak ditemukan` });
};

export const errorHandler = (err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Format JSON tidak valid' });
    }

    if (err.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Ukuran request terlalu besar' });
    }

    if (err.code === '23503') {
        return res.status(409).json({
            message: 'Data tidak bisa dihapus karena masih digunakan oleh data lain',
        });
    }

    const status = err.statusCode || 500;
    if (status === 500) console.error(err);

    res.status(status).json({
        message: status === 500 ? 'Terjadi kesalahan pada server' : err.message,
    });
};