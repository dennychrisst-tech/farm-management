import { z } from "zod"

export const inventoryTxSchema = z
  .object({
    type: z.enum(["IN", "ADJUSTMENT"]),
    direction: z.enum(["add", "subtract"]),
    feedProductId: z.string().min(1, "Pilih produk pakan"),
    sacks: z.number().min(0, "Tidak boleh negatif"),
    looseKg: z.number().min(0, "Tidak boleh negatif"),
    reason: z.string().optional(),
    reference: z.string().optional(),
  })
  .refine((v) => v.sacks > 0 || v.looseKg > 0, {
    message: "Isi jumlah sak atau kg",
    path: ["sacks"],
  })
  .refine((v) => !(v.type === "ADJUSTMENT" && v.direction === "subtract" && !v.reason?.trim()), {
    message: "Alasan wajib diisi untuk pengurangan stok",
    path: ["reason"],
  })

export type InventoryTxInput = z.infer<typeof inventoryTxSchema>
