-- Additions driven by real field-reporting evidence (whiteboard photos + a
-- supplier lighting/feed program PDF) shared by the user:
--   1) mortality cause/reason, noted on the whiteboard next to the death count
--   2) age-based feed/lighting target reference (from the supplier PDF)
--   3) non-feed supply (medicine/supplement) stock, tracked on a separate
--      physical "Stock Harian" sheet using the same Masuk/Keluar/Jumlah pattern
--      as feed -- kept as its own tables so the already-verified feed pipeline
--      (KPIs, alerts, negative-stock guard) is untouched.

-- 1) Mortality cause
alter table public.daily_reports add column mortality_note text;

-- 2) Age-based feed/lighting targets, keyed by bird age in days since hatch
-- (arrival_age_weeks*7 + days since arrival_date), not since arrival at this
-- farm -- the supplier program is indexed by bird age.
create table public.flock_targets (
  id uuid primary key default gen_random_uuid(),
  flock_id uuid not null references public.flocks(id),
  day_number int not null check (day_number >= 1),
  light_schedule text,
  target_feed_kg_per_day numeric(8,2),
  target_feed_morning_kg numeric(8,2),
  target_feed_evening_kg numeric(8,2),
  created_at timestamptz not null default now(),
  unique (flock_id, day_number)
);
create index idx_flock_targets_flock_day on public.flock_targets (flock_id, day_number);

alter table public.flock_targets enable row level security;

create policy flock_targets_select on public.flock_targets for select to authenticated
using (exists (
  select 1 from public.flocks fl where fl.id = flock_id
  and fl.farm_id = (select farm_id from public.auth_profile())
));

create policy flock_targets_insert on public.flock_targets for insert to authenticated
with check (exists (
  select 1 from public.flocks fl where fl.id = flock_id
  and fl.farm_id = (select farm_id from public.auth_profile())
  and (select role from public.auth_profile()) in ('owner','admin')
));

create policy flock_targets_update on public.flock_targets for update to authenticated
using (exists (
  select 1 from public.flocks fl where fl.id = flock_id
  and fl.farm_id = (select farm_id from public.auth_profile())
  and (select role from public.auth_profile()) in ('owner','admin')
));

create policy flock_targets_delete on public.flock_targets for delete to authenticated
using (exists (
  select 1 from public.flocks fl where fl.id = flock_id
  and fl.farm_id = (select farm_id from public.auth_profile())
  and (select role from public.auth_profile()) in ('owner','admin')
));

-- 3) Non-feed supply inventory (medicine, supplements, disinfectants)
create table public.supply_items (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id),
  name text not null,
  category text not null check (category in ('medicine','supplement','disinfectant','other')),
  unit text not null default 'unit',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (farm_id, name)
);

create table public.supply_transactions (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id),
  supply_item_id uuid not null references public.supply_items(id),
  occurred_at timestamptz not null default now(),
  type text not null check (type in ('IN','USAGE','ADJUSTMENT')),
  qty numeric(10,2) not null,
  reference text,
  reason text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint supply_adjustment_negative_requires_reason
    check (not (type = 'ADJUSTMENT' and qty < 0 and reason is null))
);
create index idx_supply_tx_farm_item_time on public.supply_transactions (farm_id, supply_item_id, occurred_at);

create or replace function public.block_negative_supply()
returns trigger language plpgsql set search_path = public as $$
declare
  bal numeric;
  new_bal numeric;
begin
  select coalesce(sum(qty),0) into bal
  from public.supply_transactions where supply_item_id = new.supply_item_id;

  new_bal := bal + new.qty;

  if new_bal < 0 and new.type <> 'ADJUSTMENT' then
    raise exception 'Insufficient stock for supply item %: balance would be %. Owner must record an adjustment first.',
      new.supply_item_id, new_bal;
  end if;

  if new.type = 'ADJUSTMENT' and new.qty < 0 and new.reason is null then
    raise exception 'Negative adjustments require a reason';
  end if;

  return new;
end;
$$;

create trigger trg_block_negative_supply
  before insert on public.supply_transactions
  for each row execute function public.block_negative_supply();

create view public.supply_balances as
select si.id as supply_item_id, si.farm_id, si.name, si.category, si.unit,
       coalesce(sum(st.qty), 0) as balance
from public.supply_items si
left join public.supply_transactions st on st.supply_item_id = si.id
group by si.id;

alter view public.supply_balances set (security_invoker = true);

alter table public.supply_items enable row level security;
alter table public.supply_transactions enable row level security;

create policy supply_items_select on public.supply_items for select to authenticated
using (farm_id = (select farm_id from public.auth_profile()));

create policy supply_items_insert on public.supply_items for insert to authenticated
with check (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner','admin'));

create policy supply_items_update on public.supply_items for update to authenticated
using (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner','admin'));

create policy supply_tx_select on public.supply_transactions for select to authenticated
using (farm_id = (select farm_id from public.auth_profile()));

create policy supply_tx_insert on public.supply_transactions for insert to authenticated
with check (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner','admin'));
