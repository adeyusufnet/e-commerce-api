import z from "zod";

export const createProductSchema = z.object({
    name: z.string().trim().min(3, 'Nama Produk Minimal 3 Karakter'),
    price: z.number().int('Harga harus bilangan bulat').positive('Harga harus lebih dari 0'),
    stock: z.number().int('Stok harus bilangan bulat').min(0, 'Stok tidak boleh negatif').optional(),
    category: z.string().trim().toLowerCase().optional()
})

export const updateProductSchema = createProductSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'Minimal satu field harus di isi'
    });

export const listProductQuerySchema = z
    .object({
        page: z.coerce.number().int().min(1, 'Page minimal 1').default(1),
        limit: z.coerce.number().int().min(1).max(100, "Limit maksimal 100").default(10),
        sort: z.enum(['Created_at', 'price', 'name', 'stock']).default('Created_at'),
        order: z.enum(['asc', 'desc']).default('desc'),
        category: z.string().trim().toLowerCase().optional(),
        search: z.string().trim().optional(),
        minPrice: z.coerce.number().int().min(0).optional(),
        maxPrice: z.coerce.number().int().min(0).optional(),
    })
    .refine(
        (q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice,
        { message: 'Min Price tidak boleh lebih besar dari Max Price', path: ['minPrice'] }
    )