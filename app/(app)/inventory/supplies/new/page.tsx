import { requireOwnerContext } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"
import { SupplyTxForm } from "@/components/inventory/supply-tx-form"

export default async function NewSupplyTxPage() {
  const { farm } = await requireOwnerContext()
  const supabase = await createClient()

  const { data: items } = await supabase
    .from("supply_items")
    .select("*")
    .eq("farm_id", farm.id)
    .eq("active", true)
    .order("name")

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Transaksi Obat &amp; Suplemen</h1>
      {items && items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Belum ada item. Tambahkan dulu lewat Pengaturan → Produk & Suplai.
        </p>
      )}
      <SupplyTxForm farmId={farm.id} items={items ?? []} />
    </div>
  )
}
