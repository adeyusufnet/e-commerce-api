import 'dotenv/config';
import app from './app.js';
import { pool } from './config/db.js';
import { redis } from './config/redis.js';

const PORT = process.env.PORT || 3000;

try {
    await pool.query('SELECT 1');
    console.log('✅ Database terhubung');

    await redis.connect();
    console.log('✅ Redis terhubung');

    app.listen(PORT, () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);
    });
} catch (err) {
    console.error('❌ Gagal start server:', err.message);
    process.exit(1);
}