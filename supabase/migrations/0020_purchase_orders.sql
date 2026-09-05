-- Purchase orders to the third-party feed/supply vendor. Inventory
-- previously only recorded "stock arrived" with no order trail, so there
-- was nothing to reconcile a delivery against or to chase a shortfall with.

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id),
  supplier_name text not null,
  item_kind text not null check (item_kind in ('feed', 'supply')),
  feed_product_id uuid references public.feed_products(id),
  supply_item_id uuid references public.supply_items(id),
  qty_ordered numeric(12,2) not null check (qty_ordered > 0),
  qty_received numeric(12,2) not null default 0 check (qty_received >= 0),
  unit_price numeric(12,2),
  total_amount numeric(12,2),  -- trigger-computed
  order_date date not null default current_date,
  expected_date date,
  status text not null default 'ordered' check (status in ('ordered', 'partial', 'received', 'cancelled')),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint po_item_matches_kind check (
    (item_kind = 'feed' and feed_product_id is not null and supply_item_id is null) or
    (item_kind = 'supply' and supply_item_id is not null and feed_product_id is null)
  )
);
create index idx_po_farm_status on public.purchase_orders (farm_id, status);

create or replace function public.calc_po_total()
returns trigger language plpgsql as $$
begin
  new.total_amount := round(new.qty_ordered * coalesce(new.unit_price, 0), 2);
  return new;
end;
$$;

create trigger trg_calc_po_total
  before insert or update on public.purchase_orders
  for each row execute function public.calc_po_total();

-- Receiving a delivery goes only through this function so qty_received/status
-- always agree with the inventory_transactions IN row it posts -- a direct
-- table UPDATE could desync the two.
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
    insert into public.inventory_transactions (farm_id, feed_product_id, type, qty_sacks, qty_kg, reference, created_by)
    values (v_po.farm_id, v_po.feed_product_id, 'IN', 0, p_qty_received, coalesce(p_reference, 'PO:' || v_po.id), v_profile.id);
  else
    insert into public.supply_transactions (farm_id, supply_item_id, type, qty, reference, created_by)
    values (v_po.farm_id, v_po.supply_item_id, 'IN', p_qty_received, coalesce(p_reference, 'PO:' || v_po.id), v_profile.id);
  end if;

  update public.purchase_orders
  set qty_received = v_new_total_received, status = v_new_status
  where id = p_po_id
  returning * into v_po;

  return v_po;
end;
$$;
grant execute on function public.receive_purchase_order(uuid, numeric, text) to authenticated;

create or replace function public.cancel_purchase_order(p_po_id uuid)
returns public.purchase_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
  v_po public.purchase_orders%rowtype;
begin
  select * into v_profile from public.auth_profile();
  if v_profile.role not in ('owner', 'admin') then
    raise exception 'Only owner/admin can cancel a purchase order';
  end if;

  update public.purchase_orders
  set status = 'cancelled'
  where id = p_po_id and farm_id = v_profile.farm_id and status in ('ordered', 'partial')
  returning * into v_po;

  if not found then
    raise exception 'Purchase order not found or cannot be cancelled';
  end if;

  return v_po;
end;
$$;
grant execute on function public.cancel_purchase_order(uuid) to authenticated;

alter table public.purchase_orders enable row level security;

create policy purchase_orders_select on public.purchase_orders for select to authenticated
using (farm_id = (select farm_id from public.auth_profile()));

create policy purchase_orders_insert on public.purchase_orders for insert to authenticated
with check (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner', 'admin'));

-- Status/qty_received changes only via receive_purchase_order/cancel_purchase_order (security definer).
create policy purchase_orders_update on public.purchase_orders for update to authenticated
using (false);
