-- Periodic sales reporting + profit/loss estimate. Egg sales already
-- tracked revenue; this adds a cost side (feed/supply consumed, priced at
-- their weighted-average purchase cost) so revenue - cost can be shown as
-- an estimated profit, plus a daily sales summary for the trend view.

alter table public.inventory_transactions add column unit_price numeric(12,2);
alter table public.supply_transactions add column unit_price numeric(12,2);

-- Receiving a PO now carries its price onto the ledger row it posts.
create or replace function public.receive_purchase_order(
  p_po_id uuid,
  p_qty_received numeric,
  p_reference text default null
)
returns public.purchase_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
  v_po public.purchase_orders%rowtype;
  v_new_total_received numeric;
  v_new_status text;
begin
  select * into v_profile from public.auth_profile();
  if v_profile.role not in ('owner', 'admin') then
    raise exception 'Only owner/admin can receive a purchase order';
  end if;

  select * into v_po from public.purchase_orders where id = p_po_id for update;
  if not found then
    raise exception 'Purchase order not found';
  end if;
  if v_po.status = 'cancelled' then
    raise exception 'Purchase order is cancelled';
  end if;
  if p_qty_received <= 0 then
    raise exception 'Received quantity must be positive';
  end if;

  v_new_total_received := v_po.qty_received + p_qty_received;
  v_new_status := case when v_new_total_received >= v_po.qty_ordered then 'received' else 'partial' end;

  if v_po.item_kind = 'feed' then
    insert into public.inventory_transactions
      (farm_id, feed_product_id, type, qty_sacks, qty_kg, reference, unit_price, created_by)
    values
      (v_po.farm_id, v_po.feed_product_id, 'IN', 0, p_qty_received, coalesce(p_reference, 'PO:' || v_po.id), v_po.unit_price, v_profile.id);
  else
    insert into public.supply_transactions
      (farm_id, supply_item_id, type, qty, reference, unit_price, created_by)
    values
      (v_po.farm_id, v_po.supply_item_id, 'IN', p_qty_received, coalesce(p_reference, 'PO:' || v_po.id), v_po.unit_price, v_profile.id);
  end if;

  update public.purchase_orders
  set qty_received = v_new_total_received, status = v_new_status
  where id = p_po_id
  returning * into v_po;

  return v_po;
end;
$$;

-- Weighted-average purchase cost per product/item, from every priced IN transaction.
create view public.feed_avg_cost as
select feed_product_id, farm_id,
  case when sum(qty_kg) > 0 then sum(qty_kg * unit_price) / sum(qty_kg) else null end as avg_cost_per_kg
from public.inventory_transactions
where type = 'IN' and unit_price is not null
group by feed_product_id, farm_id;
alter view public.feed_avg_cost set (security_invoker = true);

create view public.supply_avg_cost as
select supply_item_id, farm_id,
  case when sum(qty) > 0 then sum(qty * unit_price) / sum(qty) else null end as avg_cost_per_unit
from public.supply_transactions
where type = 'IN' and unit_price is not null
group by supply_item_id, farm_id;
alter view public.supply_avg_cost set (security_invoker = true);

-- Feed cost per day, priced at the product's average cost. has_unpriced flags
-- days where some usage has no price history, so the UI can caveat the total.
create view public.feed_cost_daily as
select dr.farm_id, dr.report_date,
  sum(fu.total_kg * coalesce(fc.avg_cost_per_kg, 0)) as feed_cost,
  bool_or(fc.avg_cost_per_kg is null) as has_unpriced
from public.feed_usage fu
join public.daily_reports dr on dr.id = fu.daily_report_id
left join public.feed_avg_cost fc on fc.feed_product_id = fu.feed_product_id and fc.farm_id = dr.farm_id
where dr.status in ('submitted', 'verified')
group by dr.farm_id, dr.report_date;
alter view public.feed_cost_daily set (security_invoker = true);

create view public.supply_cost_daily as
select st.farm_id, (st.occurred_at at time zone 'UTC')::date as usage_date,
  sum(abs(st.qty) * coalesce(sc.avg_cost_per_unit, 0)) as supply_cost,
  bool_or(sc.avg_cost_per_unit is null) as has_unpriced
from public.supply_transactions st
left join public.supply_avg_cost sc on sc.supply_item_id = st.supply_item_id and sc.farm_id = st.farm_id
where st.type = 'USAGE'
group by st.farm_id, (st.occurred_at at time zone 'UTC')::date;
alter view public.supply_cost_daily set (security_invoker = true);

-- Daily sales rollup for the periodic report / trend chart.
create view public.sales_daily_summary as
select farm_id, sale_date,
  sum(trays) as trays, sum(loose) as loose, sum(total_eggs) as total_eggs,
  sum(total_amount) as total_amount, sum(amount_paid) as amount_paid,
  count(*) as tx_count
from public.egg_sales
group by farm_id, sale_date;
alter view public.sales_daily_summary set (security_invoker = true);
