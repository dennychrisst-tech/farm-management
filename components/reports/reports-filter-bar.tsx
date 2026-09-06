"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ReportsFilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [start, setStart] = useState(searchParams.get("start") ?? "")
  const [end, setEnd] = useState(searchParams.get("end") ?? "")

  function apply() {
    const params = new URLSearchParams()
    if (start) params.set("start", start)
    if (end) params.set("end", end)
    router.push(`/reports${params.toString() ? `?${params.toString()}` : ""}`)
  }

  function reset() {
    setStart("")
    setEnd("")
    router.push("/reports")
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label>Dari tanggal</Label>
        <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-auto" />
      </div>
      <div className="space-y-1.5">
        <Label>Sampai tanggal</Label>
        <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-auto" />
      </div>
      <Button size="sm" onClick={apply}>
        Terapkan
      </Button>
      {(searchParams.get("start") || searchParams.get("end")) && (
        <Button size="sm" variant="outline" onClick={reset}>
          Reset
        </Button>
      )}
    </div>
  )
}
