import { requireOwnerContext } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"
import { AlertsClient } from "@/components/alerts/alerts-client"

export default async function AlertsPage() {
  const { farm } = await requireOwnerContext()
  const supabase = await createClient()

  const { data: alerts } = await supabase
    .from("alerts")
    .select("*")
    .eq("farm_id", farm.id)
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Alert</h1>
      <AlertsClient initialAlerts={alerts ?? []} />
    </div>
  )
}
