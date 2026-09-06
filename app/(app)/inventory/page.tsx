import { requireOwnerContext } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"
import { FeedList } from "@/components/inventory/feed-list"
import { SupplyList } from "@/components/inventory/supply-list"
import { StockOpnameClient } from "@/components/inventory/stock-opname-client"
import { EggSalesClient } from "@/components/inventory/egg-sales-client"
import { PurchaseOrdersClient } from "@/components/inventory/purchase-orders-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function InventoryPage() {
  const { farm } = await requireOwnerContext()
  const supabase = await createClient()

  const [
    { data: feedStock },
    { data: supplyStock },
    { data: recentCounts },
    { data: eggSales },
    { data: eggStockBalance },
    { data: purchaseOrders },
    { data: feedProducts },
    { data: supplyItems },
  ] = await Promise.all([
    supabase.from("feed_stock_coverage").select("*").eq("farm_id", farm.id).order("code"),
    supabase.from("supply_balances").select("*").eq("farm_id", farm.id).order("name"),
    supabase
      .from("stock_counts")
      .select("*")
      .eq("farm_id", farm.id)
      .order("counted_at", { ascending: false })
      .limit(20),
    supabase.from("egg_sales").select("*").eq("farm_id", farm.id).order("sale_date", { ascending: false }),
    supabase.from("egg_stock_balance").select("*").eq("farm_id", farm.id).maybeSingle(),
    supabase
      .from("purchase_orders")
      .select("*")
      .eq("farm_id", farm.id)
      .order("created_at", { ascending: false }),
    supabase.from("feed_products").select("*").eq("farm_id", farm.id).eq("active", true).order("sequence_order"),
    supabase.from("supply_items").select("*").eq("farm_id", farm.id).eq("active", true).order("name"),
  ])

  const feedById = new Map((feedProducts ?? []).map((f) => [f.id, f]))
  const supplyById = new Map((supplyItems ?? []).map((s) => [s.id, s]))
  const countsWithNames = (recentCounts ?? []).map((c) => ({
    ...c,
    item_name:
      c.item_kind === "feed"
        ? (feedById.get(c.feed_product_id ?? "")?.name ?? "Pakan")
        : (supplyById.get(c.supply_item_id ?? "")?.name ?? "Obat/Suplemen"),
  }))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>

      <Tabs defaultValue="feed">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
          <TabsList className="w-max sm:w-fit">
            <TabsTrigger value="feed">Pakan</TabsTrigger>
            <TabsTrigger value="supplies">Obat &amp; Suplemen</TabsTrigger>
            <TabsTrigger value="eggsales">Jual Telur</TabsTrigger>
            <TabsTrigger value="opname">Stock Opname</TabsTrigger>
            <TabsTrigger value="po">Pesanan (PO)</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="feed" className="mt-4">
          <FeedList items={feedStock ?? []} />
        </TabsContent>
        <TabsContent value="supplies" className="mt-4">
          <SupplyList items={supplyStock ?? []} />
        </TabsContent>
        <TabsContent value="eggsales" className="mt-4">
          <EggSalesClient farmId={farm.id} sales={eggSales ?? []} stockBalance={eggStockBalance ?? null} />
        </TabsContent>
        <TabsContent value="opname" className="mt-4">
          <StockOpnameClient
            feedItems={feedStock ?? []}
            supplyItems={supplyStock ?? []}
            recentCounts={countsWithNames}
          />
        </TabsContent>
        <TabsContent value="po" className="mt-4">
          <PurchaseOrdersClient
            farmId={farm.id}
            orders={purchaseOrders ?? []}
            feedProducts={feedProducts ?? []}
            supplyItems={supplyItems ?? []}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
