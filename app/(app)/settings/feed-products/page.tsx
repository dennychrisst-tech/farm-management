import { requireOwnerContext } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"
import { FeedProductsClient } from "@/components/settings/feed-products-client"

export default async function FeedProductsSettingsPage() {
  const { farm } = await requireOwnerContext()
  const supabase = await createClient()

  const { data: products } = await supabase
    .from("feed_products")
    .select("*")
    .eq("farm_id", farm.id)
    .order("sequence_order")

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Produk Pakan</h1>
      <FeedProductsClient farmId={farm.id} initialProducts={products ?? []} />
    </div>
  )
}
