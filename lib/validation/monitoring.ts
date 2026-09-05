import { z } from "zod"

export const bodyWeightSchema = z.object({
  sampleDate: z.string().min(1, "Tanggal wajib diisi"),
  sampleCount: z.number().int().min(1, "Minimal 1 ekor"),
  avgWeightGrams: z.number().min(1, "Berat harus lebih dari 0"),
  notes: z.string().optional(),
})
export type BodyWeightInput = z.infer<typeof bodyWeightSchema>

export const vaccinationPlanSchema = z.object({
  dayNumber: z.number().int().min(0, "Tidak boleh negatif"),
  vaccineName: z.string().min(1, "Nama vaksin wajib diisi"),
  method: z.string().optional(),
  notes: z.string().optional(),
})
export type VaccinationPlanInput = z.infer<typeof vaccinationPlanSchema>

export const vaccinationRecordSchema = z.object({
  vaccineName: z.string().min(1, "Nama vaksin wajib diisi"),
  administeredDate: z.string().min(1, "Tanggal wajib diisi"),
  batchNo: z.string().optional(),
  notes: z.string().optional(),
})
export type VaccinationRecordInput = z.infer<typeof vaccinationRecordSchema>

export const biosecurityLogSchema = z.object({
  visitDate: z.string().min(1, "Tanggal wajib diisi"),
  visitorName: z.string().min(1, "Nama tamu wajib diisi"),
  purpose: z.string().optional(),
  vehicleDisinfected: z.boolean(),
  footDipUsed: z.boolean(),
  notes: z.string().optional(),
})
export type BiosecurityLogInput = z.infer<typeof biosecurityLogSchema>
