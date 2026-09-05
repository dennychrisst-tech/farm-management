import { z } from "zod"

export const dailyReportSchema = z.object({
  mortality: z.number().int().min(0, "Tidak boleh negatif"),
  mortalityNote: z.string().max(500).optional(),
  cull: z.number().int().min(0, "Tidak boleh negatif"),

  morningFeedProductId: z.string().min(1, "Pilih produk pakan"),
  morningSacks: z.number().min(0, "Tidak boleh negatif"),
  morningLooseKg: z.number().min(0, "Tidak boleh negatif"),

  eveningFeedProductId: z.string().min(1, "Pilih produk pakan"),
  eveningSacks: z.number().min(0, "Tidak boleh negatif"),
  eveningLooseKg: z.number().min(0, "Tidak boleh negatif"),

  normalTrays: z.number().int().min(0, "Tidak boleh negatif"),
  normalLoose: z.number().int().min(0, "Tidak boleh negatif"),
  defectCracked: z.number().int().min(0, "Tidak boleh negatif"),
  defectDirty: z.number().int().min(0, "Tidak boleh negatif"),
  defectThinShell: z.number().int().min(0, "Tidak boleh negatif"),
  defectDoubleYolk: z.number().int().min(0, "Tidak boleh negatif"),
  defectUndersized: z.number().int().min(0, "Tidak boleh negatif"),
  defectOther: z.number().int().min(0, "Tidak boleh negatif"),
  eggWeightKg: z.number().min(0).optional(),

  notes: z.string().max(2000).optional(),
})

export type DailyReportInput = z.infer<typeof dailyReportSchema>
