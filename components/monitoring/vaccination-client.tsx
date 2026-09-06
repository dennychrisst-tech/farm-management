"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Check } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function VaccinationClient({
  farmId,
  flockId,
  currentAgeDays,
  plans,
  records,
}: {
  farmId: string
  flockId: string
  currentAgeDays: number
  plans: Tables<"vaccination_plan">[]
  records: Tables<"vaccination_records">[]
}) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [dayNumber, setDayNumber] = useState(String(currentAgeDays))
  const [vaccineName, setVaccineName] = useState("")
  const [method, setMethod] = useState("")
  const [recordingId, setRecordingId] = useState<string | null>(null)
  const [batchNo, setBatchNo] = useState<Record<string, string>>({})

  const recordedPlanIds = new Set(records.map((r) => r.plan_id).filter(Boolean))

  async function addPlan() {
    if (!vaccineName.trim()) {
      toast.error("Nama vaksin wajib diisi")
      return
    }
    setAdding(true)
    const supabase = createClient()
    const { error } = await supabase.from("vaccination_plan").insert({
      farm_id: farmId,
      flock_id: flockId,
      day_number: Number(dayNumber) || 0,
      vaccine_name: vaccineName.trim(),
      method: method || null,
    })
    setAdding(false)
    if (error) {
      toast.error("Gagal menambah jadwal", { description: error.message })
      return
    }
    setVaccineName("")
    setMethod("")
    toast.success("Jadwal vaksin ditambahkan")
    router.refresh()
  }

  async function markAdministered(plan: Tables<"vaccination_plan">) {
    setRecordingId(plan.id)
    const supabase = createClient()
    const { error } = await supabase.from("vaccination_records").insert({
      farm_id: farmId,
      flock_id: flockId,
      plan_id: plan.id,
      vaccine_name: plan.vaccine_name,
      administered_date: todayISO(),
      batch_no: batchNo[plan.id] || null,
    })
    setRecordingId(null)
    if (error) {
      toast.error("Gagal mencatat vaksinasi", { description: error.message })
      return
    }
    toast.success(`${plan.vaccine_name} dicatat sudah diberikan`)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {plans
          .sort((a, b) => a.day_number - b.day_number)
          .map((p) => {
            const done = recordedPlanIds.has(p.id)
            const due = currentAgeDays >= p.day_number
            return (
              <Card key={p.id}>
                <CardContent className="space-y-2 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{p.vaccine_name}</p>
                    {done ? (
                      <Badge>Sudah diberikan</Badge>
                    ) : due ? (
                      <Badge variant="destructive">Jatuh tempo</Badge>
                    ) : (
                      <Badge variant="outline">Terjadwal</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Umur {p.day_number} hari{p.method ? ` · ${p.method}` : ""}
                  </p>
                  {!done && (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="No. batch (opsional)"
                        className="h-8 flex-1"
                        value={batchNo[p.id] ?? ""}
                        onChange={(e) => setBatchNo((c) => ({ ...c, [p.id]: e.target.value }))}
                      />
                      <Button size="sm" onClick={() => markAdministered(p)} disabled={recordingId === p.id}>
                        <Check className="size-4" /> Sudah diberikan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        {plans.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada jadwal vaksinasi.</p>
        )}
      </div>

      <Card>
        <CardContent className="space-y-2 py-3">
          <p className="text-sm font-medium">Tambah Jadwal Vaksin</p>
          <Input placeholder="Nama vaksin (mis. ND-IB)" value={vaccineName} onChange={(e) => setVaccineName(e.target.value)} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Umur (hari)"
              value={dayNumber}
              onChange={(e) => setDayNumber(e.target.value)}
            />
            <Input placeholder="Metode (mis. tetes mata)" value={method} onChange={(e) => setMethod(e.target.value)} />
          </div>
          <Button size="sm" onClick={addPlan} disabled={adding} className="w-full">
            <Plus className="size-4" /> Tambah Jadwal
          </Button>
        </CardContent>
      </Card>

      {records.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Riwayat Vaksinasi</p>
          {records
            .slice()
            .sort((a, b) => (a.administered_date < b.administered_date ? 1 : -1))
            .map((r) => (
              <Card key={r.id}>
                <CardContent className="py-2.5 text-sm">
                  <p className="font-medium">{r.vaccine_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.administered_date).toLocaleDateString("id-ID")}
                    {r.batch_no ? ` · Batch ${r.batch_no}` : ""}
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}
