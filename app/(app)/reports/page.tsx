import Link from "next/link"

import { getAppContext } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const STATUS_LABEL: Record<string, { label: string; variant: "outline" | "secondary" | "default" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Sudah Dikirim", variant: "default" },
  verified: { label: "Diverifikasi", variant: "default" },
}

export default async function ReportsPage() {
  const { profile, farm } = await getAppContext()
  const supabase = await createClient()

  const isOwner = profile.role === "owner" || profile.role === "admin"

  const query = supabase
    .from("daily_reports")
    .select("id, report_date, status, mortality, closing_population")
    .eq("farm_id", farm.id)
    .order("report_date", { ascending: false })
    .limit(30)

  const { data: reports } = isOwner ? await query : await query.eq("reporter_id", profile.id)

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Riwayat Laporan</h1>
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
    </div>
  )
}
