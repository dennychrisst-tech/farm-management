-- Stock opname: physical count reconciliation. Recording still happens
-- through one worker at end-of-day, so this is the safety net that catches
-- a forgotten/mistyped transaction before stock runs out unexpectedly --
-- owner/admin enters what's actually on the shelf, system diffs it against
-- the running ledger balance and self-corrects with an audited adjustment.

alter table public.alerts drop constraint alerts_type_check;
alter table public.alerts add constraint alerts_type_check check (
  type in (
    'feed_variance', 'low_feed_stock', 'mortality_spike', 'production_decline',
    'missing_report', 'milestone', 'stock_discrepancy', 'low_supply_stock'
  )
);

create table public.stock_counts (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id),
  item_kind text not null check (item_kind in ('feed', 'supply')),
  feed_product_id uuid references public.feed_products(id),
  supply_item_id uuid references public.supply_items(id),
  system_qty numeric(12,2) not null,
  counted_qty numeric(12,2) not null check (counted_qty >= 0),
  variance numeric(12,2) generated always as (counted_qty - system_qty) stored,
  note text,
  counted_by uuid references public.profiles(id),
  counted_at timestamptz not null default now(),
  constraint stock_counts_item_matches_kind check (
    (item_kind = 'feed' and feed_product_id is not null and supply_item_id is null) or
    (item_kind = 'supply' and supply_item_id is not null and feed_product_id is null)
  )
);
create index idx_stock_counts_farm_time on public.stock_counts (farm_id, counted_at desc);

-- Single entry point for recording a count: snapshots the current ledger
-- balance, stores the count + variance, and if they don't match, posts a
-- compensating ADJUSTMENT so the ledger balance matches the physical count
-- from this point forward (never rewrites prior transactions).
create or replace function public.record_stock_count(
  p_item_kind text,
  p_feed_product_id uuid,
  p_supply_item_id uuid,
  p_counted_qty numeric,
  p_note text default null
)
returns public.stock_counts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
  v_system_qty numeric;
  v_result public.stock_counts;
  v_variance numeric;
  v_pct numeric;
  v_reason text;
begin
  select * into v_profile from public.auth_profile();
  if v_profile.role not in ('owner', 'admin') then
    raise exception 'Only owner/admin can record a stock count';
  end if;

  if p_item_kind = 'feed' then
    select coalesce(sum(qty_kg), 0) into v_system_qty
    from public.inventory_transactions where feed_product_id = p_feed_product_id;
  elsif p_item_kind = 'supply' then
    select coalesce(sum(qty), 0) into v_system_qty
    from public.supply_transactions where supply_item_id = p_supply_item_id;
  else
    raise exception 'Invalid item_kind %', p_item_kind;
  end if;

  insert into public.stock_counts (
    farm_id, item_kind, feed_product_id, supply_item_id, system_qty, counted_qty, note, counted_by
  ) values (
    v_profile.farm_id, p_item_kind, p_feed_product_id, p_supply_item_id, v_system_qty, p_counted_qty, p_note, v_profile.id
  ) returning * into v_result;

  v_variance := p_counted_qty - v_system_qty;

  if v_variance <> 0 then
    v_reason := 'Stock opname ' || to_char(now(), 'YYYY-MM-DD') || ': ' || v_system_qty || ' -> ' || p_counted_qty;
    if p_item_kind = 'feed' then
      insert into public.inventory_transactions
        (farm_id, feed_product_id, type, qty_sacks, qty_kg, reference, reason, created_by)
      values
        (v_profile.farm_id, p_feed_product_id, 'ADJUSTMENT', 0, v_variance, 'stock_opname:' || v_result.id, v_reason, v_profile.id);
    else
      insert into public.supply_transactions
        (farm_id, supply_item_id, type, qty, reference, reason, created_by)
      values
        (v_profile.farm_id, p_supply_item_id, 'ADJUSTMENT', v_variance, 'stock_opname:' || v_result.id, v_reason, v_profile.id);
    end if;
  end if;

  v_pct := case
    when v_system_qty <> 0 then abs(v_variance) / abs(v_system_qty) * 100
    when v_variance <> 0 then 100
    else 0
  end;

  if v_pct > 5 then
    insert into public.alerts (farm_id, type, severity, message, metadata)
    values (
      v_profile.farm_id,
      'stock_discrepancy',
      case when v_pct > 15 then 'red' else 'yellow' end,
      format('Selisih stock opname %s%%: sistem %s, hasil hitung fisik %s', round(v_pct, 1), v_system_qty, p_counted_qty),
      jsonb_build_object('stock_count_id', v_result.id, 'item_kind', p_item_kind)
    );
  end if;

  return v_result;
end;
$$;
grant execute on function public.record_stock_count(text, uuid, uuid, numeric, text) to authenticated;

alter table public.stock_counts enable row level security;

create policy stock_counts_select on public.stock_counts for select to authenticated
using (farm_id = (select farm_id from public.auth_profile()));

-- Inserts only through record_stock_count() (security definer) -- direct
-- client inserts would skip the reconciling adjustment and alert.
create policy stock_counts_insert on public.stock_counts for insert to authenticated
with check (false);
