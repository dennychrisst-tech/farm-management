"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const schema = z.object({
  feedTargetGPerBird: z.number().min(1),
  feedVarianceYellowPct: z.number().min(0),
  feedVarianceRedPct: z.number().min(0),
  lowStockLeadTimeDays: z.number().min(0),
  lowStockSafetyBufferDays: z.number().min(0),
  mortalitySpikePct: z.number().min(0),
  productionDeclineDays: z.number().int().min(1),
  missingReportCutoffTime: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

export function ThresholdsForm({ thresholds }: { thresholds: Tables<"alert_thresholds"> }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      feedTargetGPerBird: thresholds.feed_target_g_per_bird,
      feedVarianceYellowPct: thresholds.feed_variance_yellow_pct,
      feedVarianceRedPct: thresholds.feed_variance_red_pct,
      lowStockLeadTimeDays: thresholds.low_stock_lead_time_days,
      lowStockSafetyBufferDays: thresholds.low_stock_safety_buffer_days,
      mortalitySpikePct: thresholds.mortality_spike_pct,
      productionDeclineDays: thresholds.production_decline_days,
      missingReportCutoffTime: thresholds.missing_report_cutoff_time.slice(0, 5),
    },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("alert_thresholds")
      .update({
        feed_target_g_per_bird: values.feedTargetGPerBird,
        feed_variance_yellow_pct: values.feedVarianceYellowPct,
        feed_variance_red_pct: values.feedVarianceRedPct,
        low_stock_lead_time_days: values.lowStockLeadTimeDays,
        low_stock_safety_buffer_days: values.lowStockSafetyBufferDays,
        mortality_spike_pct: values.mortalitySpikePct,
        production_decline_days: values.productionDeclineDays,
        missing_report_cutoff_time: values.missingReportCutoffTime,
      })
      .eq("farm_id", thresholds.farm_id)
    setSubmitting(false)

    if (error) {
      toast.error("Gagal menyimpan", { description: error.message })
      return
    }
    toast.success("Ambang batas tersimpan")
    router.refresh()
  }

  const numField = (name: keyof FormValues, label: string, step = 1) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step={step}
              value={field.value as number}
              onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {numField("feedTargetGPerBird", "Target Pakan (g/ekor/hari)")}
        <div className="grid grid-cols-2 gap-3">
          {numField("feedVarianceYellowPct", "Variansi Pakan Kuning (%)")}
          {numField("feedVarianceRedPct", "Variansi Pakan Merah (%)")}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {numField("lowStockLeadTimeDays", "Lead Time Supplier (hari)")}
          {numField("lowStockSafetyBufferDays", "Safety Buffer (hari)")}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {numField("mortalitySpikePct", "Ambang Mortalitas (%)")}
          {numField("productionDeclineDays", "Hari Penurunan HDP Beruntun")}
        </div>
        <FormField
          control={form.control}
          name="missingReportCutoffTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batas Waktu Lapor Harian</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </form>
    </Form>
  )
}
