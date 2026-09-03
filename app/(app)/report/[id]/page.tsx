import { notFound } from "next/navigation"

import { getAppContext } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"
import { ReportForm } from "@/components/report/report-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Sudah Dikirim",
  verified: "Diverifikasi",
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { farm } = await getAppContext()
  const supabase = await createClient()

  const { data: report } = await supabase
    .from("daily_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (!report) {
    notFound()
  }

  if (report.status === "draft") {
    const { data: feedProducts } = await supabase
      .from("feed_products")
      .select("*")
      .eq("farm_id", farm.id)
      .eq("active", true)
      .order("sequence_order")

    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold">Laporan Harian — {report.report_date}</h1>
        <ReportForm
          reportId={report.id}
          farmId={farm.id}
          liveBirds={report.opening_population}
          traySize={farm.tray_size}
          feedProducts={feedProducts ?? []}
        />
      </div>
    )
  }

  const { data: kpi } = await supabase
    .from("daily_report_kpis")
    .select("*")
    .eq("daily_report_id", report.id)
    .maybeSingle()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Laporan Harian — {report.report_date}</h1>
        <Badge>{STATUS_LABEL[report.status] ?? report.status}</Badge>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Ringkasan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Populasi awal" value={`${report.opening_population} ekor`} />
          <Row label="Mortalitas" value={`${report.mortality} ekor`} />
          <Row label="Populasi akhir" value={`${report.closing_population} ekor`} />
          <Separator />
          <Row label="Total telur" value={`${kpi?.total_eggs ?? "-"} butir`} />
          <Row label="HDP" value={`${kpi?.hdp_pct ?? "-"}%`} />
          <Row label="Total pakan" value={`${kpi?.actual_feed_kg ?? "-"} kg`} />
          <Row label="Pakan/ekor/hari" value={`${kpi?.feed_intake_g_per_bird ?? "-"} g`} />
          {report.notes && <Row label="Catatan" value={report.notes} />}
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
