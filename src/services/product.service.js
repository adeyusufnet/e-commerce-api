// import { products } from "../data/products.js";
import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { getOrSetCache, buildProductKey, invalidateProducts } from '../utils/cache.js';

const queryProducts = async ({ page, limit, sort, order, category, search, minPrice, maxPrice }) => {
    const conditions = [];
    const values = [];

    const addFilter = (column, operator, value) => {
        values.push(value);
        conditions.push(`${column} ${operator} $${values.length}`);
    };

    if (category) addFilter('category', '=', category);
    if (search) addFilter('name', 'ILIKE', `%${search}%`);
    if (minPrice !== undefined) addFilter('price', '>=', minPrice);
    if (maxPrice !== undefined) addFilter('price', '<=', maxPrice);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const [countResult, dataResult] = await Promise.all([
        pool.query(`SELECT COUNT(*) FROM products ${where}`, values),
        pool.query(
            `SELECT * FROM products ${where}
       ORDER BY ${sort} ${order}, id ${order}
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
            [...values, limit, offset]
        ),
    ]);

    const total = Number(countResult.rows[0].count);

    return {
        data: dataResult.rows,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
};

export const findAll = async (query) => {
    const key = await buildProductKey(`list:${JSON.stringify(query)}`);
    return getOrSetCache(key, () => queryProducts(query));
};

export const findById = async (id) => {
    const key = await buildProductKey(`detail:${id}`);
    return getOrSetCache(key, async () => {
        const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (!rows[0]) throw new AppError('Produk tidak ditemukan', 404);
        return rows[0];
    });
};

export const create = async ({ name, price, stock, category }) => {
    const { rows } = await pool.query(
        `INSERT INTO products (name, price, stock, category)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
        [name, price, stock ?? 0, category ?? null]
    );
    await invalidateProducts();
    return rows[0]
}

export const update = async (id, payload) => {
    const fields = Object.keys(payload);
    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

    const { rows } = await pool.query(
        `UPDATE products
        SET ${setClause}, updated_at = NOW()
        WHERE id = $${fields.length + 1}
        RETURNING *`,
        [...Object.values(payload), id]
    );

    if (!rows[0]) throw new AppError('Produk tidak ditemukan', 404);
    await invalidateProducts()
    return rows[0];
}

export const remove = async (id) => {
    const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [id]);
    await invalidateProducts()
    if (rowCount === 0) throw new AppError('Produk tidak ditemukan', 404)
}