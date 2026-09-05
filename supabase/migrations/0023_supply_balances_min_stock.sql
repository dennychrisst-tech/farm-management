-- Surface min_stock_qty on the balances view so the UI can show a low-stock
-- badge without a second query. New column must be appended last -- Postgres
-- won't let CREATE OR REPLACE VIEW reorder/rename existing output columns.
create or replace view public.supply_balances as
select si.id as supply_item_id, si.farm_id, si.name, si.category, si.unit,
       coalesce(sum(st.qty), 0) as balance,
       si.min_stock_qty
from public.supply_items si
left join public.supply_transactions st on st.supply_item_id = si.id
group by si.id;

alter view public.supply_balances set (security_invoker = true);
