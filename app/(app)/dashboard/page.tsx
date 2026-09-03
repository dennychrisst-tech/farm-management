import { requireOwnerContext, flockAgeWeeks } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"
import { KpiTile } from "@/components/dashboard/kpi-tile"
import { TrendChart } from "@/components/dashboard/trend-chart"
import { AlertList } from "@/components/dashboard/alert-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const MILESTONES = [5, 10, 25, 50, 75, 90]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default async function DashboardPage() {
  const { farm, flock } = await requireOwnerContext()
  const supabase = await createClient()

  if (!flock) {
    return <p className="text-sm text-muted-foreground">Belum ada flock aktif.</p>
  }

  const today = todayISO()

  const [{ data: todayKpi }, { data: trend }, { data: stock }, { data: reachedMilestones }, { data: alerts }] =
    await Promise.all([
      supabase
        .from("daily_report_kpis")
        .select("*")
        .eq("flock_id", flock.id)
        .eq("report_date", today)
        .maybeSingle(),
      supabase
        .from("daily_report_kpis")
        .select("report_date, hdp_pct, total_eggs")
        .eq("flock_id", flock.id)
        .order("report_date", { ascending: true })
        .limit(30),
      supabase.from("feed_stock_coverage").select("*").eq("farm_id", farm.id),
      supabase.from("milestones_reached").select("milestone_pct").eq("flock_id", flock.id),
      supabase
        .from("alerts")
        .select("id, type, severity, message, status, created_at")
        .eq("farm_id", farm.id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  const minCoverageDays = stock?.length
    ? Math.min(
        ...stock.map((s) => s.coverage_days_actual ?? s.coverage_days_target ?? Infinity)
      )
    : null

  const reachedSet = new Set((reachedMilestones ?? []).map((m) => m.milestone_pct))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Dashboard Produksi</h1>
        <p className="text-sm text-muted-foreground">{farm.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Populasi hidup" value={flock.current_population.toLocaleString("id-ID")} />
        <KpiTile label="Umur flock" value={`${flockAgeWeeks(flock)} mgg`} />
        <KpiTile label="Telur hari ini" value={`${todayKpi?.total_eggs ?? 0}`} />
        <KpiTile label="HDP hari ini" value={`${todayKpi?.hdp_pct ?? 0}%`} />
        <KpiTile label="Pakan hari ini" value={`${todayKpi?.actual_feed_kg ?? 0} kg`} />
        <KpiTile label="Pakan/ekor" value={`${todayKpi?.feed_intake_g_per_bird ?? 0} g`} />
        <KpiTile label="Mortalitas" value={`${todayKpi?.mortality ?? 0} ekor`} />
        <KpiTile
          label="Stok pakan tersisa"
          value={minCoverageDays === null || minCoverageDays === Infinity ? "-" : `${minCoverageDays.toFixed(1)} hr`}
          tone={minCoverageDays !== null && minCoverageDays < 10 ? "danger" : "default"}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tren Produksi (HDP)</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart
            data={(trend ?? []).filter(
              (t): t is typeof t & { report_date: string } => t.report_date !== null
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Target vs Aktual Pakan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Target</span>
            <span>{todayKpi?.feed_target_kg ?? 0} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Aktual</span>
            <span className="font-medium">{todayKpi?.actual_feed_kg ?? 0} kg</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Milestone HDP</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {MILESTONES.map((m) => (
            <Badge key={m} variant={reachedSet.has(m) ? "default" : "outline"}>
              {m}%
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Alert Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertList alerts={alerts ?? []} />
        </CardContent>
      </Card>
    </div>
  )
}
