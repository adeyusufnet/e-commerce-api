import z from 'zod';

export const createOrderSchema = z.object({
    items: z
        .array(
            z.object({
                productId: z.number().int().positive('productId tidak valid'),
                quantity: z.number().int('Jumlah harus bilangan bulat').positive('Jumlah minimal 1'),
            })
        )
        .min(1, 'Keranjang tidak boleh kosong')
        .refine(
            (items) => new Set(items.map((i) => i.productId)).size === items.length,
            'Produk yang sama tidak boleh muncul dua kali'
        ),
});