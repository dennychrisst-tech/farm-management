import { NextResponse } from "next/server"

import { getAppContext } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"

const COLUMNS = [
  "Tanggal",
  "Status",
  "Populasi Awal",
  "Populasi Akhir",
  "Mortalitas",
  "Afkir",
  "Total Telur",
  "Telur Normal",
  "Telur Cacat",
  "HDP (%)",
  "Telur Cacat (%)",
  "Mortalitas (%)",
  "Pakan Aktual (kg)",
  "Target Pakan (kg)",
  "Pakan/Ekor (g)",
  "FCR",
] as const

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(request: Request) {
  const { farm } = await getAppContext()
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  let query = supabase
    .from("daily_report_kpis")
    .select("*")
    .eq("farm_id", farm.id)
    .order("report_date", { ascending: true })

  if (start) query = query.gte("report_date", start)
  if (end) query = query.lte("report_date", end)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []).map((r) =>
    [
      r.report_date,
      r.status,
      r.opening_population,
      r.closing_population,
      r.mortality,
      r.cull,
      r.total_eggs,
      r.normal_eggs,
      r.abnormal_eggs,
      r.hdp_pct,
      r.abnormal_egg_pct,
      r.mortality_pct,
      r.actual_feed_kg,
      r.feed_target_kg,
      r.feed_intake_g_per_bird,
      r.fcr,
    ]
      .map(csvEscape)
      .join(",")
  )

  const csv = ["﻿" + COLUMNS.join(","), ...rows].join("\n")
  const filename = `laporan-${start ?? "semua"}_${end ?? "semua"}.csv`

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
