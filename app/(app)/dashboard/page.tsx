import Link from "next/link"
import Image from "next/image"
import { Egg, Users, TrendingUp, Package, Plus, Sun } from "lucide-react"

import { requireOwnerContext, flockAgeWeeks } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"
import { KpiTile } from "@/components/dashboard/kpi-tile"
import { TrendChart } from "@/components/dashboard/trend-chart"
import { EggCompositionChart } from "@/components/dashboard/egg-composition-chart"
import { AlertList } from "@/components/dashboard/alert-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const MILESTONES = [5, 10, 25, 50, 75, 90]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function greeting() {
  const h = new Date().getHours()
  if (h < 11) return "Selamat pagi"
  if (h < 15) return "Selamat siang"
  if (h < 18) return "Selamat sore"
  return "Selamat malam"
}

export default async function DashboardPage() {
  const { farm, flock, profile } = await requireOwnerContext()
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
    ? Math.min(...stock.map((s) => s.coverage_days_actual ?? s.coverage_days_target ?? Infinity))
    : null

  const reachedSet = new Set((reachedMilestones ?? []).map((m) => m.milestone_pct))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ringkasan Peternakan</h1>
          <p className="text-sm text-muted-foreground">Pantau peternakan Anda, tumbuh lebih baik.</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden text-sm text-muted-foreground sm:block">
            {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <Button asChild>
            <Link href="/report/new">
              <Plus className="size-4" /> Catat Produksi
            </Link>
          </Button>
        </div>
      </div>

      <Card className="flex-row gap-0 overflow-hidden border-none bg-primary py-0 text-primary-foreground">
        <CardContent className="flex flex-1 items-center gap-4 px-6 py-6">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
            <Sun className="size-6" />
          </span>
          <div>
            <p className="text-xl font-bold tracking-tight">
              {greeting()}, {profile.name}
            </p>
            <p className="text-sm text-primary-foreground/80">
              Semoga hari ini penuh berkah dan panen telur berkualitas.
            </p>
          </div>
        </CardContent>
        <div className="relative hidden w-64 shrink-0 sm:block">
          <Image
            src="/images/dashboard-hero.jpg"
            alt="Ayam petelur di kandang"
            fill
            sizes="256px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-primary/40" />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile
          icon={Egg}
          label="Produksi Telur Hari Ini"
          value={`${(todayKpi?.total_eggs ?? 0).toLocaleString("id-ID")} butir`}
        />
        <KpiTile
          icon={Users}
          label="Populasi Ayam"
          value={`${flock.current_population.toLocaleString("id-ID")} ekor`}
          sub={`Umur ${flockAgeWeeks(flock)} minggu`}
        />
        <KpiTile icon={TrendingUp} label="Hen Day Production" value={`${todayKpi?.hdp_pct ?? 0}%`} />
        <KpiTile
          icon={Package}
          label="Stok Pakan"
          value={
            minCoverageDays === null || minCoverageDays === Infinity
              ? "-"
              : `${minCoverageDays.toFixed(1)} hari`
          }
          sub="estimasi coverage"
          tone={minCoverageDays !== null && minCoverageDays < 10 ? "danger" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tren Produksi Telur</CardTitle>
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
          <CardHeader>
            <CardTitle className="text-base">Komposisi Telur</CardTitle>
          </CardHeader>
          <CardContent>
            <EggCompositionChart
              normalEggs={todayKpi?.normal_eggs ?? 0}
              abnormalEggs={todayKpi?.abnormal_eggs ?? 0}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Target vs Aktual Pakan</CardTitle>
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
          <CardHeader>
            <CardTitle className="text-base">Milestone HDP</CardTitle>
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
          <CardHeader>
            <CardTitle className="text-base">Alert Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertList alerts={alerts ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
