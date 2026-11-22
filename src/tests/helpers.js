import request from 'supertest';
import app from '../app.js';
import { pool } from '../config/db.js';

export const resetDb = () =>
    pool.query(
        'TRUNCATE order_items, orders, refresh_tokens, products, users RESTART IDENTITY CASCADE'
    );

export const createUser = async ({ role = 'customer', email, password = 'rahasia123' } = {}) => {
    const userEmail = email ?? `${role}@test.com`;

    await request(app).post('/auth/register').send({ name: 'Test User', email: userEmail, password });

    if (role === 'admin') {
        await pool.query("UPDATE users SET role = 'admin' WHERE email = $1", [userEmail]);
    }

    const res = await request(app).post('/auth/login').send({ email: userEmail, password });
    return res.body.data; // { accessToken, refreshToken, user }
};

export const createProduct = async ({ name = 'Produk Test', price = 50000, stock = 10, category = 'test' } = {}) => {
    const { rows } = await pool.query(
        'INSERT INTO products (name, price, stock, category) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, price, stock, category]
    );
    return rows[0];
};