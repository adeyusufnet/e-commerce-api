import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createUser, createProduct } from './helpers.js';

const newProduct = { name: 'Kaos Test', price: 75000, stock: 10 };

describe('GET /products', () => {
    it('bisa diakses tanpa login dan mengembalikan meta pagination', async () => {
        await createProduct({ name: 'A' });
        await createProduct({ name: 'B' });
        await createProduct({ name: 'C' });

        const res = await request(app).get('/products?page=1&limit=2');

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.meta).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });
    });

    it('menolak kolom sort yang tidak diizinkan (400)', async () => {
        const res = await request(app).get('/products?sort=password');
        expect(res.status).toBe(400);
    });
});

describe('POST /products', () => {
    it('menolak request tanpa token (401)', async () => {
        const res = await request(app).post('/products').send(newProduct);
        expect(res.status).toBe(401);
    });

    it('menolak customer (403)', async () => {
        const { accessToken } = await createUser({ role: 'customer' });

        const res = await request(app)
            .post('/products')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(newProduct);

        expect(res.status).toBe(403);
    });

    it('mengizinkan admin menambah produk (201)', async () => {
        const { accessToken } = await createUser({ role: 'admin' });

        const res = await request(app)
            .post('/products')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(newProduct);

        expect(res.status).toBe(201);
        expect(res.body.data).toMatchObject(newProduct);
    });
});