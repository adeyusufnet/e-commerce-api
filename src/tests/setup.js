import { beforeEach, afterAll } from 'vitest';
import { pool } from '../config/db.js';
import { resetDb } from './helpers.js';

beforeEach(resetDb);          // database bersih sebelum SETIAP test
afterAll(() => pool.end());   // tutup koneksi setelah semua test di file selesai