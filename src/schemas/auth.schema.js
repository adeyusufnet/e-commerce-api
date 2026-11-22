import z from "zod";

export const registerSchema = z.object({
    name: z.string().trim().min(3, 'Nama minimal 3 karakter'),
    email: z.string().trim().toLowerCase().email('Format email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
});

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email('Format email tidak valid'),
    password: z.string().min(1, 'Password wajib di isi')
})

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh Token wajib di isi')
})