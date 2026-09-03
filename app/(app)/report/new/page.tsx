import { redirect } from "next/navigation"

import { getAppContext } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default async function NewReportPage() {
  const { userId, farm, flock } = await getAppContext()

  if (!flock) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada flock aktif untuk farm ini. Hubungi Owner/Admin.
      </p>
    )
  }

  const supabase = await createClient()
  const today = todayISO()

  const { data: existing } = await supabase
    .from("daily_reports")
    .select("id")
    .eq("flock_id", flock.id)
    .eq("report_date", today)
    .maybeSingle()

  if (existing) {
    redirect(`/report/${existing.id}`)
  }

  const { data: created, error } = await supabase
    .from("daily_reports")
    .insert({
      farm_id: farm.id,
      flock_id: flock.id,
      report_date: today,
      reporter_id: userId,
    })
    .select("id")
    .single()

  if (error || !created) {
    // 23505 = unique_violation on (flock_id, report_date): another worker
    // already created/submitted today's report. RLS hides that row from
    // this worker (PRD: workers see only their own submitted report), so
    // the earlier existence check can't catch this -- surface a clear
    // message instead of the raw constraint error.
    if (error?.code === "23505") {
      return (
        <p className="text-sm text-muted-foreground">
          Laporan hari ini sudah diisi oleh pekerja lain. Hubungi Owner/Admin jika perlu melihat
          detailnya.
        </p>
      )
    }
    return (
      <p className="text-sm text-destructive">
        Gagal membuat laporan: {error?.message ?? "unknown error"}
      </p>
    )
  }

  redirect(`/report/${created.id}`)
}
