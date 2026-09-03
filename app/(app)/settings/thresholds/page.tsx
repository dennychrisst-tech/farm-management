import { requireOwnerContext } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"
import { ThresholdsForm } from "@/components/settings/thresholds-form"

export default async function ThresholdsSettingsPage() {
  const { farm } = await requireOwnerContext()
  const supabase = await createClient()

  const { data: thresholds } = await supabase
    .from("alert_thresholds")
    .select("*")
    .eq("farm_id", farm.id)
    .single()

  if (!thresholds) {
    return <p className="text-sm text-destructive">Konfigurasi ambang batas tidak ditemukan.</p>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Ambang Batas Alert</h1>
      <p className="text-sm text-muted-foreground">
        Nilai default adalah asumsi awal pilot, bukan standar veteriner. Sesuaikan bersama operator farm.
      </p>
      <ThresholdsForm thresholds={thresholds} />
    </div>
  )
}
