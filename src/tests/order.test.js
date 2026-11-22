import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createUser, createProduct } from './helpers.js';

const checkout = (token, items) =>
    request(app).post('/orders').set('Authorization', `Bearer ${token}`).send({ items });

describe('POST /orders (checkout)', () => {
    it('membuat pesanan dan mengurangi stok', async () => {
        const product = await createProduct({ price: 50000, stock: 10 });
        const { accessToken } = await createUser();

        const res = await checkout(accessToken, [{ productId: product.id, quantity: 3 }]);

        expect(res.status).toBe(201);
        expect(res.body.data.total_amount).toBe(150000);

        // Verifikasi: stok benar-benar berkurang
        const after = await request(app).get(`/products/${product.id}`);
        expect(after.body.data.stock).toBe(7);
    });

    it('menolak stok kurang tanpa mengubah stok produk lain', async () => {
        const enough = await createProduct({ name: 'Cukup', stock: 10 });
        const scarce = await createProduct({ name: 'Langka', stock: 1 });
        const { accessToken } = await createUser();

        const res = await checkout(accessToken, [
            { productId: enough.id, quantity: 2 },
            { productId: scarce.id, quantity: 5 },
        ]);

        expect(res.status).toBe(400);

        // Verifikasi: tidak ada perubahan sama sekali
        const after = await request(app).get(`/products/${enough.id}`);
        expect(after.body.data.stock).toBe(10);

        const orders = await request(app).get('/orders').set('Authorization', `Bearer ${accessToken}`);
        expect(orders.body.data).toHaveLength(0);
    });

    it('memakai harga dari database, bukan dari request', async () => {
        const product = await createProduct({ price: 100000, stock: 5 });
        const { accessToken } = await createUser();

        const res = await checkout(accessToken, [
            { productId: product.id, quantity: 1, price: 1 }, // user iseng mencoba harga Rp1
        ]);

        expect(res.status).toBe(201);
        expect(res.body.data.total_amount).toBe(100000);
    });
});

describe('GET /orders/:id', () => {
    it('menampilkan detail pesanan ke pemiliknya', async () => {
        const product = await createProduct();
        const { accessToken } = await createUser();
        const order = await checkout(accessToken, [{ productId: product.id, quantity: 2 }]);

        const res = await request(app)
            .get(`/orders/${order.body.data.id}`)
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.items).toHaveLength(1);
    });

    it('menyembunyikan pesanan milik orang lain (404, anti IDOR)', async () => {
        const product = await createProduct();
        const customerA = await createUser({ email: 'a@test.com' });
        const customerB = await createUser({ email: 'b@test.com' });
        const order = await checkout(customerA.accessToken, [{ productId: product.id, quantity: 1 }]);

        const res = await request(app)
            .get(`/orders/${order.body.data.id}`)
            .set('Authorization', `Bearer ${customerB.accessToken}`);

        expect(res.status).toBe(404);
    });
});

describe('DELETE /products/:id', () => {
    it('menolak menghapus produk yang sudah pernah dibeli (409)', async () => {
        const product = await createProduct();
        const customer = await createUser();
        const admin = await createUser({ role: 'admin' });
        await checkout(customer.accessToken, [{ productId: product.id, quantity: 1 }]);

        const res = await request(app)
            .delete(`/products/${product.id}`)
            .set('Authorization', `Bearer ${admin.accessToken}`);

        expect(res.status).toBe(409);
    });
});