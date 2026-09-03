import { requireOwnerContext } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"
import { FeedList } from "@/components/inventory/feed-list"
import { SupplyList } from "@/components/inventory/supply-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function InventoryPage() {
  const { farm } = await requireOwnerContext()
  const supabase = await createClient()

  const [{ data: feedStock }, { data: supplyStock }] = await Promise.all([
    supabase.from("feed_stock_coverage").select("*").eq("farm_id", farm.id).order("code"),
    supabase.from("supply_balances").select("*").eq("farm_id", farm.id).order("name"),
  ])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>

      <Tabs defaultValue="feed">
        <TabsList>
          <TabsTrigger value="feed">Pakan</TabsTrigger>
          <TabsTrigger value="supplies">Obat &amp; Suplemen</TabsTrigger>
        </TabsList>
        <TabsContent value="feed" className="mt-4">
          <FeedList items={feedStock ?? []} />
        </TabsContent>
        <TabsContent value="supplies" className="mt-4">
          <SupplyList items={supplyStock ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
