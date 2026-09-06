"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function BodyWeightClient({
  farmId,
  flockId,
  arrivalAgeWeeks,
  arrivalDate,
  samples,
  standardByAgeDays,
}: {
  farmId: string
  flockId: string
  arrivalAgeWeeks: number
  arrivalDate: string
  samples: Tables<"body_weight_samples">[]
  standardByAgeDays: Map<number, number>
}) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [sampleDate, setSampleDate] = useState(todayISO())
  const [sampleCount, setSampleCount] = useState("10")
  const [avgWeight, setAvgWeight] = useState("")
  const [notes, setNotes] = useState("")

  function ageDaysFor(dateStr: string) {
    const diffDays = Math.floor(
      (new Date(dateStr).getTime() - new Date(arrivalDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    return arrivalAgeWeeks * 7 + diffDays
  }

  async function addSample() {
    if (!avgWeight || Number(avgWeight) <= 0) {
      toast.error("Berat rata-rata wajib diisi")
      return
    }
    setAdding(true)
    const supabase = createClient()
    const { error } = await supabase.from("body_weight_samples").insert({
      farm_id: farmId,
      flock_id: flockId,
      sample_date: sampleDate,
      age_days: ageDaysFor(sampleDate),
      sample_count: Number(sampleCount) || 1,
      avg_weight_grams: Number(avgWeight),
      notes: notes || null,
    })
    setAdding(false)

    if (error) {
      toast.error("Gagal mencatat sampel", { description: error.message })
      return
    }
    setAvgWeight("")
    setNotes("")
    toast.success("Sampel berat badan dicatat")
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {samples.map((s) => {
          const target = standardByAgeDays.get(s.age_days)
          const diffPct = target ? ((s.avg_weight_grams - target) / target) * 100 : null
          return (
            <Card key={s.id}>
              <CardContent className="space-y-1 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {new Date(s.sample_date).toLocaleDateString("id-ID")} · umur {s.age_days} hari
                  </p>
                  {diffPct !== null && (
                    <Badge variant={Math.abs(diffPct) > 10 ? "destructive" : "outline"}>
                      {diffPct > 0 ? "+" : ""}
                      {diffPct.toFixed(1)}% vs standar
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {s.sample_count} ekor sampel · rata-rata {s.avg_weight_grams} g
                  {target ? ` (standar ${target} g)` : ""}
                </p>
                {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
              </CardContent>
            </Card>
          )
        })}
        {samples.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada sampel berat badan tercatat.</p>
        )}
      </div>

      <Card>
        <CardContent className="space-y-2 py-3">
          <p className="text-sm font-medium">Catat Sampel Berat Badan</p>
          <Input type="date" value={sampleDate} onChange={(e) => setSampleDate(e.target.value)} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="Jumlah sampel (ekor)"
              value={sampleCount}
              onChange={(e) => setSampleCount(e.target.value)}
            />
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              placeholder="Rata-rata berat (gram)"
              value={avgWeight}
              onChange={(e) => setAvgWeight(e.target.value)}
            />
          </div>
          <Textarea rows={2} placeholder="Catatan (opsional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button size="sm" onClick={addSample} disabled={adding} className="w-full">
            <Plus className="size-4" /> Catat Sampel
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
