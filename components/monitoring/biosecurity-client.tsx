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
import { Checkbox } from "@/components/ui/checkbox"

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function BiosecurityClient({
  farmId,
  logs,
}: {
  farmId: string
  logs: Tables<"biosecurity_log">[]
}) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [visitDate, setVisitDate] = useState(todayISO())
  const [visitorName, setVisitorName] = useState("")
  const [purpose, setPurpose] = useState("")
  const [vehicleDisinfected, setVehicleDisinfected] = useState(false)
  const [footDipUsed, setFootDipUsed] = useState(false)
  const [notes, setNotes] = useState("")

  async function addLog() {
    if (!visitorName.trim()) {
      toast.error("Nama tamu wajib diisi")
      return
    }
    setAdding(true)
    const supabase = createClient()
    const { error } = await supabase.from("biosecurity_log").insert({
      farm_id: farmId,
      visit_date: visitDate,
      visitor_name: visitorName.trim(),
      purpose: purpose || null,
      vehicle_disinfected: vehicleDisinfected,
      foot_dip_used: footDipUsed,
      notes: notes || null,
    })
    setAdding(false)
    if (error) {
      toast.error("Gagal mencatat kunjungan", { description: error.message })
      return
    }
    setVisitorName("")
    setPurpose("")
    setVehicleDisinfected(false)
    setFootDipUsed(false)
    setNotes("")
    toast.success("Kunjungan dicatat")
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {logs.map((l) => (
          <Card key={l.id}>
            <CardContent className="space-y-1 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{l.visitor_name}</p>
                <div className="flex gap-1">
                  {l.vehicle_disinfected && <Badge variant="outline">Kendaraan disemprot</Badge>}
                  {l.foot_dip_used && <Badge variant="outline">Foot dip</Badge>}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(l.visit_date).toLocaleDateString("id-ID")}
                {l.purpose ? ` · ${l.purpose}` : ""}
              </p>
              {l.notes && <p className="text-xs text-muted-foreground">{l.notes}</p>}
            </CardContent>
          </Card>
        ))}
        {logs.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada catatan kunjungan.</p>
        )}
      </div>

      <Card>
        <CardContent className="space-y-2 py-3">
          <p className="text-sm font-medium">Catat Kunjungan</p>
          <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
          <Input placeholder="Nama tamu" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} />
          <Input placeholder="Keperluan (opsional)" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={vehicleDisinfected} onCheckedChange={(v) => setVehicleDisinfected(!!v)} />
              Kendaraan disemprot
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={footDipUsed} onCheckedChange={(v) => setFootDipUsed(!!v)} />
              Foot dip dipakai
            </label>
          </div>
          <Textarea rows={2} placeholder="Catatan (opsional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button size="sm" onClick={addLog} disabled={adding} className="w-full">
            <Plus className="size-4" /> Catat Kunjungan
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
