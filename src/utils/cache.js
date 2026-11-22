import { redis } from '../config/redis.js';

const DEFAULT_TTL = 60; // detik
const PRODUCTS_VERSION_KEY = 'products:version';

// Cache-aside: cek rak dulu, kalau kosong ambil dari gudang
export const getOrSetCache = async (key, fetchFn, ttl = DEFAULT_TTL) => {
    if (redis.isReady) {
        const cached = await redis.get(key);
        if (cached) return { value: JSON.parse(cached), hit: true };
    }

    const value = await fetchFn();

    if (redis.isReady) {
        await redis.setEx(key, ttl, JSON.stringify(value));
    }

    return { value, hit: false };
};

// Semua key produk menyertakan "nomor edisi"
export const buildProductKey = async (suffix) => {
    const version = redis.isReady ? (await redis.get(PRODUCTS_VERSION_KEY)) ?? '0' : '0';
    return `products:v${version}:${suffix}`;
};

// Naikkan edisi → semua cache produk lama otomatis tidak terpakai
export const invalidateProducts = async () => {
    try {
        if (redis.isReady) await redis.incr(PRODUCTS_VERSION_KEY);
    } catch (err) {
        console.error('Gagal invalidasi cache:', err.message);
    }
};