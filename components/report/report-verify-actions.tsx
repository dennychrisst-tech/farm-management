"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2, Pencil } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

type FeedProduct = Tables<"feed_products">

export type CorrectionFeedRow = {
  session: "morning" | "evening"
  feedProductId: string
  sacks: number
  looseKg: number
}

export function ReportVerifyActions({
  reportId,
  status,
  currentUserId,
  mortality,
  cull,
  populationAdjustment,
  normalTrays,
  normalLoose,
  defectCracked,
  defectDirty,
  defectThinShell,
  defectDoubleYolk,
  defectUndersized,
  defectOther,
  eggWeightKg,
  feedRows,
  feedProducts,
}: {
  reportId: string
  status: string
  currentUserId: string
  mortality: number
  cull: number
  populationAdjustment: number
  normalTrays: number
  normalLoose: number
  defectCracked: number
  defectDirty: number
  defectThinShell: number
  defectDoubleYolk: number
  defectUndersized: number
  defectOther: number
  eggWeightKg: number | null
  feedRows: CorrectionFeedRow[]
  feedProducts: FeedProduct[]
}) {
  const router = useRouter()
  const [verifying, setVerifying] = useState(false)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    mortality: String(mortality),
    cull: String(cull),
    populationAdjustment: String(populationAdjustment),
    normalTrays: String(normalTrays),
    normalLoose: String(normalLoose),
    defectCracked: String(defectCracked),
    defectDirty: String(defectDirty),
    defectThinShell: String(defectThinShell),
    defectDoubleYolk: String(defectDoubleYolk),
    defectUndersized: String(defectUndersized),
    defectOther: String(defectOther),
    eggWeightKg: eggWeightKg !== null ? String(eggWeightKg) : "",
    reason: "",
  })
  const [feed, setFeed] = useState<CorrectionFeedRow[]>(
    feedRows.length > 0
      ? feedRows
      : [
          { session: "morning", feedProductId: feedProducts[0]?.id ?? "", sacks: 0, looseKg: 0 },
          { session: "evening", feedProductId: feedProducts[0]?.id ?? "", sacks: 0, looseKg: 0 },
        ]
  )

  function updateFeedRow(index: number, patch: Partial<CorrectionFeedRow>) {
    setFeed((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  async function handleVerify() {
    setVerifying(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("daily_reports")
      .update({ status: "verified", verified_by: currentUserId, verified_at: new Date().toISOString() })
      .eq("id", reportId)
    setVerifying(false)

    if (error) {
      toast.error("Gagal memverifikasi laporan", { description: error.message })
      return
    }
    toast.success("Laporan diverifikasi")
    router.refresh()
  }

  async function handleSaveCorrection() {
    if (!form.reason.trim()) {
      toast.error("Alasan koreksi wajib diisi")
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.rpc("correct_daily_report", {
      p_report_id: reportId,
      p_mortality: Number(form.mortality) || 0,
      p_cull: Number(form.cull) || 0,
      p_population_adjustment: Number(form.populationAdjustment) || 0,
      p_egg: {
        normal_trays: Number(form.normalTrays) || 0,
        normal_loose: Number(form.normalLoose) || 0,
        defect_cracked: Number(form.defectCracked) || 0,
        defect_dirty: Number(form.defectDirty) || 0,
        defect_thin_shell: Number(form.defectThinShell) || 0,
        defect_double_yolk: Number(form.defectDoubleYolk) || 0,
        defect_undersized: Number(form.defectUndersized) || 0,
        defect_other: Number(form.defectOther) || 0,
        egg_weight_kg: form.eggWeightKg,
      },
      p_feed: feed.map((r) => ({
        session: r.session,
        feed_product_id: r.feedProductId,
        sacks: r.sacks,
        loose_kg: r.looseKg,
      })),
      p_reason: form.reason.trim(),
    })
    setSaving(false)

    if (error) {
      toast.error("Gagal menyimpan koreksi", { description: error.message })
      return
    }
    toast.success("Koreksi tersimpan, laporan diverifikasi")
    setOpen(false)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "submitted" && (
        <Button size="sm" onClick={handleVerify} disabled={verifying}>
          <CheckCircle2 className="size-4" /> {verifying ? "Memproses..." : "Verifikasi"}
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="size-4" /> Koreksi Data
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Koreksi Laporan</DialogTitle>
            <DialogDescription>
              Perubahan akan tercatat sebagai revisi (bukan menimpa data lama) dan laporan otomatis
              ditandai terverifikasi setelah disimpan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Mortalitas</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.mortality}
                  onChange={(e) => setForm((f) => ({ ...f, mortality: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Afkir</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.cull}
                  onChange={(e) => setForm((f) => ({ ...f, cull: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Penyesuaian Populasi</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.populationAdjustment}
                  onChange={(e) => setForm((f) => ({ ...f, populationAdjustment: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Telur Normal</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Piring (30 butir)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.normalTrays}
                    onChange={(e) => setForm((f) => ({ ...f, normalTrays: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Butir lepas</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.normalLoose}
                    onChange={(e) => setForm((f) => ({ ...f, normalLoose: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Telur Cacat (per jenis)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Pecah</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.defectCracked}
                    onChange={(e) => setForm((f) => ({ ...f, defectCracked: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Kotor</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.defectDirty}
                    onChange={(e) => setForm((f) => ({ ...f, defectDirty: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Kerabang tipis</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.defectThinShell}
                    onChange={(e) => setForm((f) => ({ ...f, defectThinShell: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Double yolk</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.defectDoubleYolk}
                    onChange={(e) => setForm((f) => ({ ...f, defectDoubleYolk: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Ukuran kecil</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.defectUndersized}
                    onChange={(e) => setForm((f) => ({ ...f, defectUndersized: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Lainnya</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.defectOther}
                    onChange={(e) => setForm((f) => ({ ...f, defectOther: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Total berat telur (kg, opsional)</Label>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step={0.1}
                value={form.eggWeightKg}
                onChange={(e) => setForm((f) => ({ ...f, eggWeightKg: e.target.value }))}
              />
            </div>

            {feed.map((row, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm font-medium">
                  Pakan {row.session === "morning" ? "Pagi" : "Sore"}
                </p>
                <Select
                  value={row.feedProductId}
                  onValueChange={(v) => updateFeedRow(i, { feedProductId: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih produk pakan" />
                  </SelectTrigger>
                  <SelectContent>
                    {feedProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Sak</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={row.sacks}
                      onChange={(e) => updateFeedRow(i, { sacks: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Kg tambahan</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={row.looseKg}
                      onChange={(e) => updateFeedRow(i, { looseKg: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="space-y-1.5">
              <Label>Alasan Koreksi (wajib)</Label>
              <Textarea
                rows={2}
                placeholder="mis. Salah hitung mortalitas pagi"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSaveCorrection} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Koreksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
