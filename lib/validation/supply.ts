import { z } from "zod"

export const supplyTxSchema = z
  .object({
    type: z.enum(["IN", "USAGE", "ADJUSTMENT"]),
    direction: z.enum(["add", "subtract"]),
    supplyItemId: z.string().min(1, "Pilih item"),
    qty: z.number().min(0.01, "Jumlah harus lebih dari 0"),
    unitPrice: z.number().min(0).optional(),
    reason: z.string().optional(),
    reference: z.string().optional(),
  })
  .refine((v) => !(v.direction === "subtract" && !v.reason?.trim()), {
    message: "Alasan wajib diisi saat mengurangi stok",
    path: ["reason"],
  })

export type SupplyTxInput = z.infer<typeof supplyTxSchema>
