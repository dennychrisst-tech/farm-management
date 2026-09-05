-- Egg sales/distribution to the third-party buyer. The app tracked
-- production but stopped there -- there was no record of what left the
-- farm, so nobody could see how many eggs were still sitting on-site
-- awaiting pickup, or reconcile revenue against production.

create table public.egg_sales (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id),
  sale_date date not null default current_date,
  buyer_name text not null,
  trays int not null default 0 check (trays >= 0),
  loose int not null default 0 check (loose >= 0),
  total_eggs int,       -- trigger-computed (tray_size varies by farm)
  price_per_egg numeric(10,2),
  total_amount numeric(12,2),  -- trigger-computed
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid')),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index idx_egg_sales_farm_date on public.egg_sales (farm_id, sale_date desc);

create or replace function public.calc_egg_sale_totals()
returns trigger language plpgsql as $$
declare
  v_tray_size int;
begin
  select tray_size into v_tray_size from public.farms where id = new.farm_id;
  new.total_eggs := new.trays * v_tray_size + new.loose;
  new.total_amount := round(new.total_eggs * coalesce(new.price_per_egg, 0), 2);
  return new;
end;
$$;

create trigger trg_calc_egg_sale_totals
  before insert or update on public.egg_sales
  for each row execute function public.calc_egg_sale_totals();

-- Eggs on hand = cumulative production (submitted/verified reports only) minus cumulative sales.
create view public.egg_stock_balance as
with produced as (
  select dr.farm_id, coalesce(sum(ep.total_eggs), 0) as total_produced
  from public.daily_reports dr
  join public.egg_production ep on ep.daily_report_id = dr.id
  where dr.status in ('submitted', 'verified')
  group by dr.farm_id
),
sold as (
  select farm_id, coalesce(sum(total_eggs), 0) as total_sold
  from public.egg_sales
  group by farm_id
)
select
  f.id as farm_id,
  coalesce(p.total_produced, 0) as total_produced,
  coalesce(s.total_sold, 0) as total_sold,
  coalesce(p.total_produced, 0) - coalesce(s.total_sold, 0) as eggs_on_hand
from public.farms f
left join produced p on p.farm_id = f.id
left join sold s on s.farm_id = f.id;

alter view public.egg_stock_balance set (security_invoker = true);

alter table public.egg_sales enable row level security;

create policy egg_sales_select on public.egg_sales for select to authenticated
using (farm_id = (select farm_id from public.auth_profile()));

create policy egg_sales_insert on public.egg_sales for insert to authenticated
with check (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner', 'admin'));

create policy egg_sales_update on public.egg_sales for update to authenticated
using (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner', 'admin'));
