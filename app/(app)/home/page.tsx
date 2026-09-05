import Link from "next/link"
import { CalendarDays, Users, ChevronRight, Lightbulb, Wheat } from "lucide-react"

import { getAppContext, flockAgeWeeks, flockAgeDays } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DailyChecklist, type ChecklistItem } from "@/components/home/daily-checklist"

const STATUS_LABEL: Record<string, { label: string; variant: "outline" | "secondary" | "default" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Sudah Dikirim", variant: "default" },
  verified: { label: "Diverifikasi", variant: "default" },
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default async function HomePage() {
  const { farm, flock } = await getAppContext()
  const supabase = await createClient()

  const today = todayISO()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const [
    { data: todayReport },
    { data: recentReports },
    { data: target },
    { data: checklistItems },
    { data: completions },
  ] = flock
    ? await Promise.all([
        supabase
          .from("daily_reports")
          .select("id, status")
          .eq("flock_id", flock.id)
          .eq("report_date", today)
          .maybeSingle(),
        supabase
          .from("daily_reports")
          .select("report_date, status")
          .eq("flock_id", flock.id)
          .gte("report_date", sevenDaysAgo.toISOString().slice(0, 10)),
        supabase
          .from("flock_targets")
          .select("*")
          .eq("flock_id", flock.id)
          .eq("day_number", flockAgeDays(flock))
          .maybeSingle(),
        supabase
          .from("daily_checklist_items")
          .select("id, label")
          .eq("farm_id", farm.id)
          .eq("active", true)
          .order("sort_order"),
        supabase
          .from("daily_checklist_completions")
          .select("item_id")
          .eq("farm_id", farm.id)
          .eq("completion_date", today),
      ])
    : [{ data: null }, { data: [] }, { data: null }, { data: [] }, { data: [] }]

  const doneItemIds = new Set((completions ?? []).map((c) => c.item_id))
  const checklist: ChecklistItem[] = (checklistItems ?? []).map((item) => ({
    id: item.id,
    label: item.label,
    done: doneItemIds.has(item.id),
  }))

  const completedCount = (recentReports ?? []).filter(
    (r) => r.status === "submitted" || r.status === "verified"
  ).length

  const status = todayReport ? STATUS_LABEL[todayReport.status] : { label: "Belum Diisi", variant: "outline" as const }
  const ctaHref = todayReport ? `/report/${todayReport.id}` : "/report/new"
  const ctaLabel = todayReport && todayReport.status === "draft" ? "Lanjutkan Laporan" : "Isi Laporan Hari Ini"

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{farm.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="size-4" /> Umur flock
            </span>
            <span className="font-medium">
              {flock ? `${flockAgeWeeks(flock)} minggu` : "Belum ada flock"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-4" /> Populasi hidup
            </span>
            <span className="font-medium">
              {flock ? flock.current_population.toLocaleString("id-ID") : "-"} ekor
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status laporan hari ini</span>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </CardContent>
      </Card>

      {target && (target.target_feed_kg_per_day !== null || target.light_schedule) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Target Hari Ini (Program Supplier)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {target.target_feed_kg_per_day !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Wheat className="size-4" /> Target pakan
                </span>
                <span className="font-medium">
                  {target.target_feed_morning_kg} kg pagi + {target.target_feed_evening_kg} kg sore
                  {" "}({target.target_feed_kg_per_day} kg)
                </span>
              </div>
            )}
            {target.light_schedule && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Lightbulb className="size-4" /> Jadwal lampu
                </span>
                <span className="font-medium">{target.light_schedule}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button asChild size="lg" className="h-14 w-full text-base">
        <Link href={ctaHref}>
          {ctaLabel}
          <ChevronRight className="size-5" />
        </Link>
      </Button>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Checklist Harian</CardTitle>
        </CardHeader>
        <CardContent>
          <DailyChecklist farmId={farm.id} items={checklist} todayISO={today} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Kelengkapan 7 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(completedCount / 7) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium tabular-nums">{completedCount}/7</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
