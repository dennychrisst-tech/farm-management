import { requireOwnerContext } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"
import { InventoryTxForm } from "@/components/inventory/inventory-tx-form"

export default async function NewInventoryTxPage() {
  const { farm } = await requireOwnerContext()
  const supabase = await createClient()

  const { data: feedProducts } = await supabase
    .from("feed_products")
    .select("*")
    .eq("farm_id", farm.id)
    .eq("active", true)
    .order("sequence_order")

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Transaksi Stok Pakan</h1>
      <InventoryTxForm farmId={farm.id} feedProducts={feedProducts ?? []} />
    </div>
  )
}
