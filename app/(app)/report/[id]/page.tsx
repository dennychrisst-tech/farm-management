import { notFound } from "next/navigation"

import { getAppContext } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"
import { calcEggGrade } from "@/lib/kpi"
import { ReportForm } from "@/components/report/report-form"
import { ReportVerifyActions, type CorrectionFeedRow } from "@/components/report/report-verify-actions"
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
  const { farm, flock, userId, profile } = await getAppContext()
  const isOwner = profile.role === "owner" || profile.role === "admin"
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
        <h1 className="text-2xl font-bold tracking-tight">Laporan Harian — {report.report_date}</h1>
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

  const reportAgeDays = flock
    ? flock.arrival_age_weeks * 7 +
      Math.floor(
        (new Date(report.report_date).getTime() - new Date(flock.arrival_date).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  const [
    { data: kpi },
    { data: eggProduction },
    { data: evidence },
    { data: target },
    { data: feedUsage },
    { data: feedProducts },
    { data: verifiedByProfile },
  ] = await Promise.all([
    supabase.from("daily_report_kpis").select("*").eq("daily_report_id", report.id).maybeSingle(),
    supabase.from("egg_production").select("*").eq("daily_report_id", report.id).maybeSingle(),
    supabase.from("evidence").select("*").eq("daily_report_id", report.id).order("created_at"),
    reportAgeDays !== null
      ? supabase
          .from("flock_targets")
          .select("target_hdp_pct")
          .eq("flock_id", report.flock_id)
          .eq("day_number", reportAgeDays)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    isOwner
      ? supabase.from("feed_usage").select("*").eq("daily_report_id", report.id)
      : Promise.resolve({ data: null }),
    isOwner
      ? supabase.from("feed_products").select("*").eq("farm_id", farm.id).eq("active", true).order("sequence_order")
      : Promise.resolve({ data: null }),
    report.verified_by
      ? supabase.from("profiles").select("name").eq("id", report.verified_by).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const avgWeightGrams =
    eggProduction?.egg_weight_kg && eggProduction.total_eggs
      ? (Number(eggProduction.egg_weight_kg) * 1000) / eggProduction.total_eggs
      : 0

  const evidenceWithUrls = await Promise.all(
    (evidence ?? []).map(async (e) => {
      const { data } = await supabase.storage.from("evidence").createSignedUrl(e.storage_path, 3600)
      return { ...e, url: data?.signedUrl ?? null }
    })
  )

  const feedRows: CorrectionFeedRow[] = (feedUsage ?? []).map((f) => ({
    session: f.session === "evening" ? "evening" : "morning",
    feedProductId: f.feed_product_id ?? "",
    sacks: Number(f.sacks ?? 0),
    looseKg: Number(f.loose_kg ?? 0),
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Laporan Harian — {report.report_date}</h1>
        <Badge>{STATUS_LABEL[report.status] ?? report.status}</Badge>
      </div>
      {report.status === "verified" && report.verified_at && (
        <p className="text-xs text-muted-foreground">
          Diverifikasi oleh {verifiedByProfile?.name ?? "Owner/Admin"} pada{" "}
          {new Date(report.verified_at).toLocaleString("id-ID")}
        </p>
      )}
      {isOwner && (
        <ReportVerifyActions
          reportId={report.id}
          status={report.status}
          currentUserId={userId}
          mortality={report.mortality}
          cull={report.cull}
          populationAdjustment={report.population_adjustment}
          normalTrays={eggProduction?.normal_trays ?? 0}
          normalLoose={eggProduction?.normal_loose ?? 0}
          defectCracked={eggProduction?.defect_cracked ?? 0}
          defectDirty={eggProduction?.defect_dirty ?? 0}
          defectThinShell={eggProduction?.defect_thin_shell ?? 0}
          defectDoubleYolk={eggProduction?.defect_double_yolk ?? 0}
          defectUndersized={eggProduction?.defect_undersized ?? 0}
          defectOther={eggProduction?.defect_other ?? 0}
          eggWeightKg={eggProduction?.egg_weight_kg !== undefined && eggProduction?.egg_weight_kg !== null ? Number(eggProduction.egg_weight_kg) : null}
          feedRows={feedRows}
          feedProducts={feedProducts ?? []}
        />
      )}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Ringkasan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Populasi awal" value={`${report.opening_population} ekor`} />
          <Row label="Mortalitas" value={`${report.mortality} ekor`} />
          {report.mortality_note && <Row label="Sebab kematian" value={report.mortality_note} />}
          <Row label="Populasi akhir" value={`${report.closing_population} ekor`} />
          <Separator />
          {report.water_liters !== null && (
            <Row label="Konsumsi air" value={`${report.water_liters} liter`} />
          )}
          <Row label="Total telur" value={`${kpi?.total_eggs ?? "-"} butir`} />
          <Row
            label="HDP"
            value={`${kpi?.hdp_pct ?? "-"}%${target?.target_hdp_pct ? ` (standar ${target.target_hdp_pct}%)` : ""}`}
          />
          <Row label="Total pakan" value={`${kpi?.actual_feed_kg ?? "-"} kg`} />
          <Row label="Pakan/ekor/hari" value={`${kpi?.feed_intake_g_per_bird ?? "-"} g`} />
          {kpi?.fcr !== null && kpi?.fcr !== undefined && <Row label="FCR" value={`${kpi.fcr}`} />}
          {report.notes && <Row label="Catatan" value={report.notes} />}
        </CardContent>
      </Card>

      {eggProduction && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kualitas Telur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Telur normal" value={`${eggProduction.normal_eggs ?? 0} butir`} />
            <Row label="Telur cacat" value={`${eggProduction.abnormal_eggs ?? 0} butir`} />
            {(eggProduction.abnormal_eggs ?? 0) > 0 && (
              <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {[
                  ["Pecah", eggProduction.defect_cracked],
                  ["Kotor", eggProduction.defect_dirty],
                  ["Kerabang tipis", eggProduction.defect_thin_shell],
                  ["Double yolk", eggProduction.defect_double_yolk],
                  ["Ukuran kecil", eggProduction.defect_undersized],
                  ["Lainnya", eggProduction.defect_other],
                ]
                  .filter(([, n]) => (n as number) > 0)
                  .map(([label, n]) => `${label}: ${n}`)
                  .join(" · ")}
              </div>
            )}
            {avgWeightGrams > 0 && (
              <Row
                label="Grade ukuran"
                value={`${calcEggGrade(avgWeightGrams)} (${avgWeightGrams.toFixed(1)} g/butir)`}
              />
            )}
          </CardContent>
        </Card>
      )}

      {evidenceWithUrls.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Foto Evidence</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {evidenceWithUrls.map((e) => (
              <div key={e.id} className="relative aspect-square overflow-hidden rounded-md border">
                {e.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.url} alt="Evidence" className="h-full w-full object-cover" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[10px] text-white">
                  {e.captured_at &&
                    new Date(e.captured_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  {e.latitude !== null && ` · ${e.latitude?.toFixed(4)},${e.longitude?.toFixed(4)}`}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
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
