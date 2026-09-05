-- The farm actually prices sales per tray (e.g. Rp45.000/piring of 30 eggs),
-- not per individual egg. Switch the input field to match so the owner
-- enters the number they actually think in, instead of doing the division
-- themselves; loose eggs are priced at price_per_tray / farm.tray_size.
alter table public.egg_sales rename column price_per_egg to price_per_tray;

create or replace function public.calc_egg_sale_totals()
returns trigger language plpgsql set search_path = public as $$
declare
  v_tray_size int;
begin
  select tray_size into v_tray_size from public.farms where id = new.farm_id;
  new.total_eggs := new.trays * v_tray_size + new.loose;
  new.total_amount := round(
    (new.trays * coalesce(new.price_per_tray, 0))
    + (new.loose * coalesce(new.price_per_tray, 0) / nullif(v_tray_size, 0)),
    2
  );
  return new;
end;
$$;
