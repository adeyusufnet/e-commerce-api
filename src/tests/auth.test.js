import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createUser } from './helpers.js';

describe('POST /auth/register', () => {
    it('mendaftarkan user baru tanpa membocorkan password_hash', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ name: 'Ade', email: 'ade@test.com', password: 'rahasia123' });

        expect(res.status).toBe(201);
        expect(res.body.data).toMatchObject({ email: 'ade@test.com', role: 'customer' });
        expect(res.body.data).not.toHaveProperty('password_hash');
    });

    it('menolak email yang sudah terdaftar (409)', async () => {
        await createUser({ email: 'ade@test.com' }); // Arrange

        const res = await request(app) // Act
            .post('/auth/register')
            .send({ name: 'Ade Lagi', email: 'ade@test.com', password: 'rahasia123' });

        expect(res.status).toBe(409); // Assert
    });

    it('mengembalikan semua error validasi sekaligus (400)', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ name: 'ab', email: 'bukan-email', password: '123' });

        expect(res.status).toBe(400);
        expect(res.body.errors).toHaveLength(3);
    });

    it('mengabaikan field role yang dikirim user (anti privilege escalation)', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ name: 'Hacker', email: 'hacker@test.com', password: 'rahasia123', role: 'admin' });

        expect(res.status).toBe(201);
        expect(res.body.data.role).toBe('customer');
    });
});

describe('POST /auth/login', () => {
    it('menolak password salah dengan pesan umum (401)', async () => {
        await createUser({ email: 'ade@test.com' });

        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'ade@test.com', password: 'passwordsalah' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Email atau password salah');
    });

    it('mengembalikan accessToken dan refreshToken', async () => {
        const data = await createUser();

        expect(data.accessToken).toBeDefined();
        expect(data.refreshToken).toBeDefined();
    });
});

describe('POST /auth/refresh', () => {
    it('menukar refresh token dengan pasangan token baru (rotation)', async () => {
        const { refreshToken } = await createUser();

        const res = await request(app).post('/auth/refresh').send({ refreshToken });

        expect(res.status).toBe(200);
        expect(res.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('mencabut semua sesi saat refresh token lama dipakai ulang', async () => {
        const { refreshToken: oldToken } = await createUser();
        const first = await request(app).post('/auth/refresh').send({ refreshToken: oldToken });
        const newestToken = first.body.data.refreshToken;

        const reuse = await request(app).post('/auth/refresh').send({ refreshToken: oldToken });
        const afterReuse = await request(app).post('/auth/refresh').send({ refreshToken: newestToken });

        expect(reuse.status).toBe(401);
        expect(afterReuse.status).toBe(401); // token terbaru ikut dicabut
    });
});