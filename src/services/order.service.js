import { pool } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { invalidateProducts } from "../utils/cache.js";

export const createOrder = async (userId, items) => {
    const client = await pool.connect(); // pinjam 1 koneksi khusus

    try {
        await client.query('BEGIN');

        // 1. Ambil produk + kunci barisnya
        const productIds = items.map((i) => i.productId);
        const { rows: products } = await client.query(
            'SELECT id, name, price, stock FROM products WHERE id = ANY($1) FOR UPDATE',
            [productIds]
        )

        // 2. Valdiasi stok & hitung total (harga dari DB!)
        let totalAmount = 0;
        const orderLines = items.map((item) => {
            const product = products.find((p) => p.id === item.productId);

            if (!product) {
                throw new AppError(`Produk dengan id ${item.productId} tidak ditemukan`, 404);
            }

            if (product.stock < item.quantity) {
                throw new AppError(`Stock ${product.name} tidak cukup (sisa ${product.stock})`, 400)
            }

            totalAmount += product.price * item.quantity;
            return {
                productId: product.id,
                name: product.name,
                quantity: item.quantity,
                price: product.price
            }
        })

        // 3. Buat kepala struk
        const { rows: [order] } = await client.query(
            'INSERT INTO orders (user_id, total_amount) VALUES ($1, $2) RETURNING *',
            [userId, totalAmount]
        )

        // 4. Simpan item + kurangi stok
        for (const line of orderLines) {
            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [order.id, line.productId, line.quantity, line.price]
            );

            await client.query(
                'UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2',
                [line.quantity, line.productId]
            )
        }

        await client.query('COMMIT'); // semua sukses -> simpan permanen
        await invalidateProducts(); // SETELAH commit, bukan sebelumnya
        return { ...order, items: orderLines }
    } catch (error) {
        await client.query('ROLLBACK'); // ada yang gagal -> batalkan semua
        throw error;
    } finally {
        client.release(); // wajib: kembalikan ke pool
    }
}

export const findAll = async (user) => {
    const isAdmin = user.role === 'admin';
    const { rows } = await pool.query(
        `SELECT * FROM orders
        ${isAdmin ? '' : 'WHERE user_id = $1'}
        ORDER BY created_at DESC`,
        isAdmin ? [] : [user.id]
    );
    return rows;
}

export const findById = async (id, user) => {
    const { rows: [order] } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);

    const isOwner = order?.user_id === user.id;
    if (!order || (!isOwner && user.role !== 'admin')) {
        throw new AppError('Pesanan tidak ditemukan', 404);
    }

    const { rows: items } = await pool.query(
        `SELECT oi.product_id, p.name, oi.quantity, oi.price,
                oi.quantity * oi.price AS subtotal
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = $1`,
        [id]
    );

    return { ...order, items }
}