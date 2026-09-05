-- p_feed_product_id/p_supply_item_id are genuinely optional (only one applies
-- per item_kind) but had no SQL default, so the generated TS Args type
-- required both unconditionally. Add defaults so the client can omit
-- whichever doesn't apply.
create or replace function public.record_stock_count(
  p_item_kind text,
  p_feed_product_id uuid default null,
  p_supply_item_id uuid default null,
  p_counted_qty numeric default null,
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
  if p_counted_qty is null then
    raise exception 'p_counted_qty is required';
  end if;

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
revoke execute on function public.record_stock_count(text, uuid, uuid, numeric, text) from public, anon;
grant execute on function public.record_stock_count(text, uuid, uuid, numeric, text) to authenticated;
