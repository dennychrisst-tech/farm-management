import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    name: z.string().min(1, "Nama wajib diisi").max(200),
    phone: z.string().max(30).optional(),
    email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Ulangi password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Password tidak sama",
    path: ["confirmPassword"],
  })

export type RegisterInput = z.infer<typeof registerSchema>
