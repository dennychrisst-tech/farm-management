import { requireOwnerContext } from "@/lib/data/app-context"
import { FarmSettingsForm } from "@/components/settings/farm-settings-form"

export default async function FarmSettingsPage() {
  const { farm } = await requireOwnerContext()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Data Farm</h1>
      <FarmSettingsForm farm={farm} />
    </div>
  )
}
