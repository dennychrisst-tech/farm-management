"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type Control } from "react-hook-form"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { dailyReportSchema, type DailyReportInput } from "@/lib/validation/daily-report"
import { calcEggs, calcFeedKg, calcHdpPct } from "@/lib/kpi"
import type { Tables } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PhotoUploader, type PhotoItem } from "@/components/report/photo-uploader"

type FeedProduct = Tables<"feed_products">

export function ReportForm({
  reportId,
  farmId,
  liveBirds,
  traySize,
  feedProducts,
}: {
  reportId: string
  farmId: string
  liveBirds: number
  traySize: number
  feedProducts: FeedProduct[]
}) {
  const router = useRouter()
  const [step, setStep] = useState<"form" | "confirm">("form")
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<DailyReportInput>({
    resolver: zodResolver(dailyReportSchema),
    defaultValues: {
      mortality: 0,
      mortalityNote: "",
      cull: 0,
      morningFeedProductId: feedProducts[0]?.id ?? "",
      morningSacks: 0,
      morningLooseKg: 0,
      eveningFeedProductId: feedProducts[0]?.id ?? "",
      eveningSacks: 0,
      eveningLooseKg: 0,
      normalTrays: 0,
      normalLoose: 0,
      defectCracked: 0,
      defectDirty: 0,
      defectThinShell: 0,
      defectDoubleYolk: 0,
      defectUndersized: 0,
      defectOther: 0,
      notes: "",
    },
  })

  const values = form.watch()

  const totalNormal = calcEggs(values.normalTrays || 0, values.normalLoose || 0, traySize)
  const totalAbnormal =
    (values.defectCracked || 0) +
    (values.defectDirty || 0) +
    (values.defectThinShell || 0) +
    (values.defectDoubleYolk || 0) +
    (values.defectUndersized || 0) +
    (values.defectOther || 0)
  const totalEggs = totalNormal + totalAbnormal
  const hdpPct = calcHdpPct(totalEggs, liveBirds)

  const morningProduct = feedProducts.find((p) => p.id === values.morningFeedProductId)
  const eveningProduct = feedProducts.find((p) => p.id === values.eveningFeedProductId)
  const morningKg = calcFeedKg(
    values.morningSacks || 0,
    values.morningLooseKg || 0,
    morningProduct?.sack_weight_kg ?? 50
  )
  const eveningKg = calcFeedKg(
    values.eveningSacks || 0,
    values.eveningLooseKg || 0,
    eveningProduct?.sack_weight_kg ?? 50
  )
  const closingPopulation = liveBirds - (values.mortality || 0) - (values.cull || 0)

  function goToConfirm(v: DailyReportInput) {
    void v
    setStep("confirm")
  }

  async function handleFinalSubmit() {
    setSubmitting(true)
    const supabase = createClient()
    const v = form.getValues()

    try {
      const { error: eggError } = await supabase
        .from("egg_production")
        .upsert(
          {
            daily_report_id: reportId,
            normal_trays: v.normalTrays,
            normal_loose: v.normalLoose,
            defect_cracked: v.defectCracked,
            defect_dirty: v.defectDirty,
            defect_thin_shell: v.defectThinShell,
            defect_double_yolk: v.defectDoubleYolk,
            defect_undersized: v.defectUndersized,
            defect_other: v.defectOther,
            egg_weight_kg: v.eggWeightKg ?? null,
          },
          { onConflict: "daily_report_id" }
        )
      if (eggError) throw eggError

      await supabase.from("feed_usage").delete().eq("daily_report_id", reportId)
      const { error: feedError } = await supabase.from("feed_usage").insert([
        {
          daily_report_id: reportId,
          session: "morning",
          feed_product_id: v.morningFeedProductId,
          sacks: v.morningSacks,
          loose_kg: v.morningLooseKg,
        },
        {
          daily_report_id: reportId,
          session: "evening",
          feed_product_id: v.eveningFeedProductId,
          sacks: v.eveningSacks,
          loose_kg: v.eveningLooseKg,
        },
      ])
      if (feedError) throw feedError

      await supabase
        .from("daily_reports")
        .update({
          mortality: v.mortality,
          mortality_note: v.mortalityNote || null,
          cull: v.cull,
          notes: v.notes || null,
        })
        .eq("id", reportId)

      if (photos.length > 0) {
        for (const item of photos) {
          const ext = item.file.name.split(".").pop() || "jpg"
          const path = `${farmId}/${reportId}/${crypto.randomUUID()}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from("evidence")
            .upload(path, item.file, { upsert: false })
          if (uploadError) throw uploadError

          await supabase.from("evidence").insert({
            daily_report_id: reportId,
            storage_path: path,
            captured_at: item.capturedAt,
            latitude: item.latitude,
            longitude: item.longitude,
          })
        }
      }

      const { error: finalizeError } = await supabase.rpc("finalize_daily_report", {
        p_report_id: reportId,
      })
      if (finalizeError) throw finalizeError

      toast.success("Laporan berhasil dikirim")
      router.replace("/home")
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan"
      toast.error("Gagal mengirim laporan", { description: message })
      setSubmitting(false)
    }
  }

  if (step === "confirm") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setStep("form")} disabled={submitting}>
          <ArrowLeft className="size-4" /> Kembali
        </Button>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Konfirmasi Laporan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Populasi awal" value={`${liveBirds.toLocaleString("id-ID")} ekor`} />
            <Row label="Mortalitas" value={`${values.mortality} ekor`} />
            {values.mortalityNote && <Row label="Sebab kematian" value={values.mortalityNote} />}
            <Row label="Afkir (cull)" value={`${values.cull} ekor`} />
            <Row
              label="Populasi akhir"
              value={`${closingPopulation.toLocaleString("id-ID")} ekor`}
              strong
            />
            <Separator />
            <Row
              label="Pakan pagi"
              value={`${morningProduct?.name ?? "-"} — ${values.morningSacks} sak (${morningKg.toFixed(1)} kg)`}
            />
            <Row
              label="Pakan sore"
              value={`${eveningProduct?.name ?? "-"} — ${values.eveningSacks} sak (${eveningKg.toFixed(1)} kg)`}
            />
            <Row label="Total pakan" value={`${(morningKg + eveningKg).toFixed(1)} kg`} strong />
            <Separator />
            <Row label="Telur normal" value={`${totalNormal} butir`} />
            <Row label="Telur cacat" value={`${totalAbnormal} butir`} />
            {totalAbnormal > 0 && (
              <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {[
                  ["Pecah", values.defectCracked],
                  ["Kotor", values.defectDirty],
                  ["Kerabang tipis", values.defectThinShell],
                  ["Double yolk", values.defectDoubleYolk],
                  ["Ukuran kecil", values.defectUndersized],
                  ["Lainnya", values.defectOther],
                ]
                  .filter(([, n]) => (n as number) > 0)
                  .map(([label, n]) => `${label}: ${n}`)
                  .join(" · ")}
              </div>
            )}
            <Row label="Total telur" value={`${totalEggs} butir`} strong />
            <Row label="Perkiraan HDP" value={`${hdpPct.toFixed(2)}%`} strong />
            <Separator />
            <Row label="Foto evidence" value={`${photos.length} foto`} />
            {values.notes && <Row label="Catatan" value={values.notes} />}
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="h-14 w-full text-base"
          onClick={handleFinalSubmit}
          disabled={submitting}
        >
          {submitting ? "Mengirim..." : "Kirim Laporan"}
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(goToConfirm)} className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Populasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Populasi awal hari ini: <strong>{liveBirds.toLocaleString("id-ID")}</strong> ekor
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="mortality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mortalitas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        {...field}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cull"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Afkir (opsional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        {...field}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {(values.mortality || 0) > 0 && (
              <FormField
                control={form.control}
                name="mortalityNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sebab kematian (opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="mis. terjepit, sakit, predator" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pakan Pagi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField
              control={form.control}
              name="morningFeedProductId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produk</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih produk pakan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {feedProducts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.code} — {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="morningSacks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sak</FormLabel>
                    <FormControl>
                      <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.5}
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="morningLooseKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kg tambahan (opsional)</FormLabel>
                    <FormControl>
                      <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.1}
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pakan Sore</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField
              control={form.control}
              name="eveningFeedProductId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produk</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih produk pakan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {feedProducts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.code} — {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="eveningSacks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sak</FormLabel>
                    <FormControl>
                      <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.5}
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="eveningLooseKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kg tambahan (opsional)</FormLabel>
                    <FormControl>
                      <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.1}
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Telur Normal</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="normalTrays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Piring (30 butir)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="normalLoose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Butir lepas</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Telur Cacat (per jenis)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <DefectField control={form.control} name="defectCracked" label="Pecah" />
            <DefectField control={form.control} name="defectDirty" label="Kotor" />
            <DefectField control={form.control} name="defectThinShell" label="Kerabang tipis" />
            <DefectField control={form.control} name="defectDoubleYolk" label="Double yolk" />
            <DefectField control={form.control} name="defectUndersized" label="Ukuran kecil" />
            <DefectField control={form.control} name="defectOther" label="Lainnya" />
            <div className="col-span-2">
              <FormField
                control={form.control}
                name="eggWeightKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total berat telur kg (opsional)</FormLabel>
                    <FormControl>
                      <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.1}
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Catatan &amp; Foto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (opsional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <PhotoUploader photos={photos} onChange={setPhotos} />
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="h-14 w-full text-base">
          Lihat Ringkasan
        </Button>
      </form>
    </Form>
  )
}

type DefectFieldName =
  | "defectCracked"
  | "defectDirty"
  | "defectThinShell"
  | "defectDoubleYolk"
  | "defectUndersized"
  | "defectOther"

function DefectField({
  control,
  name,
  label,
}: {
  control: Control<DailyReportInput>
  name: DefectFieldName
  label: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              {...field}
              value={field.value}
              onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold" : undefined}>{value}</span>
    </div>
  )
}
