import Link from "next/link"
import { Download } from "lucide-react"

import { getAppContext } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ReportsFilterBar } from "@/components/reports/reports-filter-bar"

const STATUS_LABEL: Record<string, { label: string; variant: "outline" | "secondary" | "default" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Sudah Dikirim", variant: "default" },
  verified: { label: "Diverifikasi", variant: "default" },
}

const PAGE_SIZE = 20

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const start = typeof params.start === "string" ? params.start : undefined
  const end = typeof params.end === "string" ? params.end : undefined
  const page = Math.max(1, Number(params.page) || 1)

  const { profile, farm } = await getAppContext()
  const supabase = await createClient()

  const isOwner = profile.role === "owner" || profile.role === "admin"
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from("daily_reports")
    .select("id, report_date, status, mortality, closing_population", { count: "exact" })
    .eq("farm_id", farm.id)
    .order("report_date", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (!isOwner) query = query.eq("reporter_id", profile.id)
  if (start) query = query.gte("report_date", start)
  if (end) query = query.lte("report_date", end)

  const { data: reports, count } = await query

  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1
  const exportParams = new URLSearchParams()
  if (start) exportParams.set("start", start)
  if (end) exportParams.set("end", end)

  function pageHref(p: number) {
    const sp = new URLSearchParams(exportParams)
    if (p > 1) sp.set("page", String(p))
    const qs = sp.toString()
    return `/reports${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Laporan</h1>
        {isOwner && (
          <Button asChild size="sm" variant="outline">
            <a href={`/api/reports/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`}>
              <Download className="size-4" /> Ekspor CSV
            </a>
          </Button>
        )}
      </div>

      <ReportsFilterBar />

      {!reports || reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada laporan.</p>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => {
            const status = STATUS_LABEL[r.status] ?? { label: r.status, variant: "outline" as const }
            return (
              <Link key={r.id} href={`/report/${r.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{r.report_date}</p>
                      <p className="text-xs text-muted-foreground">
                        Mortalitas {r.mortality} · Populasi {r.closing_population ?? "-"}
                      </p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          {page <= 1 ? (
            <Button size="sm" variant="outline" disabled>
              Sebelumnya
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href={pageHref(page - 1)}>Sebelumnya</Link>
            </Button>
          )}
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </p>
          {page >= totalPages ? (
            <Button size="sm" variant="outline" disabled>
              Berikutnya
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href={pageHref(page + 1)}>Berikutnya</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
