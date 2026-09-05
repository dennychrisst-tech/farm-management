-- Low-stock alerting for medicine/supplements, mirroring what feed already
-- has. Usage is sporadic (not a daily rate like feed), so this uses a flat
-- minimum threshold per item instead of a coverage-days projection.

alter table public.supply_items
  add column min_stock_qty numeric(10,2) not null default 0 check (min_stock_qty >= 0);

create or replace function public.evaluate_low_supply_stock_alerts()
returns void language plpgsql security definer set search_path = public as $$
declare
  r record;
  sev text;
begin
  for r in
    select sb.farm_id, sb.supply_item_id, sb.name, sb.unit, sb.balance, si.min_stock_qty
    from public.supply_balances sb
    join public.supply_items si on si.id = sb.supply_item_id
    where si.active and si.min_stock_qty > 0
  loop
    if r.balance <= 0 then
      sev := 'red';
    elsif r.balance <= r.min_stock_qty then
      sev := 'yellow';
    else
      continue;
    end if;

    if not exists (
      select 1 from public.alerts
      where farm_id = r.farm_id and type = 'low_supply_stock' and status = 'open'
        and metadata ->> 'supply_item_id' = r.supply_item_id::text
    ) then
      insert into public.alerts (farm_id, type, severity, message, metadata)
      values (
        r.farm_id,
        'low_supply_stock',
        sev,
        format('Stok %s tinggal %s %s (minimum %s %s)', r.name, r.balance, r.unit, r.min_stock_qty, r.unit),
        jsonb_build_object('supply_item_id', r.supply_item_id)
      );
    end if;
  end loop;
end;
$$;

select cron.schedule('check-low-supply-stock', '0 * * * *', $$select public.evaluate_low_supply_stock_alerts();$$);
