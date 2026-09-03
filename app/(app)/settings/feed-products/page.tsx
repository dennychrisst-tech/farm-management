import { requireOwnerContext } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"
import { FeedProductsClient } from "@/components/settings/feed-products-client"
import { SupplyItemsClient } from "@/components/settings/supply-items-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function FeedProductsSettingsPage() {
  const { farm } = await requireOwnerContext()
  const supabase = await createClient()

  const [{ data: products }, { data: supplyItems }] = await Promise.all([
    supabase.from("feed_products").select("*").eq("farm_id", farm.id).order("sequence_order"),
    supabase.from("supply_items").select("*").eq("farm_id", farm.id).order("name"),
  ])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Produk &amp; Suplai</h1>

      <Tabs defaultValue="feed">
        <TabsList>
          <TabsTrigger value="feed">Pakan</TabsTrigger>
          <TabsTrigger value="supplies">Obat &amp; Suplemen</TabsTrigger>
        </TabsList>
        <TabsContent value="feed" className="mt-4">
          <FeedProductsClient farmId={farm.id} initialProducts={products ?? []} />
        </TabsContent>
        <TabsContent value="supplies" className="mt-4">
          <SupplyItemsClient farmId={farm.id} initialItems={supplyItems ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
