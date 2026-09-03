-- Daily report and its child records (egg production, feed usage, evidence)

create table public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id),
  flock_id uuid not null references public.flocks(id),
  report_date date not null,
  opening_population int not null default 0,   -- set by trigger from flock, never client-supplied
  mortality int not null default 0 check (mortality >= 0),
  cull int not null default 0 check (cull >= 0),
  population_adjustment int not null default 0,
  closing_population int generated always as
    (opening_population - mortality - cull + population_adjustment) stored,
  status text not null default 'draft' check (status in ('draft','submitted','verified')),
  notes text,
  reporter_id uuid not null references public.profiles(id),
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (flock_id, report_date),
  constraint closing_population_nonneg check (closing_population >= 0)
);
create index idx_daily_reports_farm_date on public.daily_reports (farm_id, report_date desc);
create index idx_daily_reports_reporter on public.daily_reports (reporter_id);

-- Live population must come from the system, not be retyped by the worker.
create or replace function public.set_opening_population()
returns trigger language plpgsql as $$
begin
  select current_population into new.opening_population
  from public.flocks where id = new.flock_id;
  return new;
end;
$$;

create trigger trg_set_opening_population
  before insert on public.daily_reports
  for each row execute function public.set_opening_population();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_daily_reports_touch
  before update on public.daily_reports
  for each row execute function public.touch_updated_at();

create table public.egg_production (
  id uuid primary key default gen_random_uuid(),
  daily_report_id uuid not null unique references public.daily_reports(id) on delete cascade,
  normal_trays int not null default 0 check (normal_trays >= 0),
  normal_loose int not null default 0 check (normal_loose >= 0),
  abnormal_trays int not null default 0 check (abnormal_trays >= 0),
  abnormal_loose int not null default 0 check (abnormal_loose >= 0),
  egg_weight_kg numeric(8,2),
  normal_eggs int,      -- trigger-computed (tray_size varies by farm)
  abnormal_eggs int,    -- trigger-computed
  total_eggs int,       -- trigger-computed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- total_eggs needs farms.tray_size (a different table) so it can't be a generated column.
create or replace function public.calc_egg_totals()
returns trigger language plpgsql as $$
declare
  v_tray_size int;
begin
  select f.tray_size into v_tray_size
  from public.farms f
  join public.daily_reports dr on dr.farm_id = f.id
  where dr.id = new.daily_report_id;

  new.normal_eggs := new.normal_trays * v_tray_size + new.normal_loose;
  new.abnormal_eggs := new.abnormal_trays * v_tray_size + new.abnormal_loose;
  new.total_eggs := new.normal_eggs + new.abnormal_eggs;
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_calc_egg_totals
  before insert or update on public.egg_production
  for each row execute function public.calc_egg_totals();

create table public.feed_usage (
  id uuid primary key default gen_random_uuid(),
  daily_report_id uuid not null references public.daily_reports(id) on delete cascade,
  session text not null check (session in ('morning','evening')),
  feed_product_id uuid not null references public.feed_products(id),
  sacks numeric(8,2) not null default 0 check (sacks >= 0),
  loose_kg numeric(8,2) not null default 0 check (loose_kg >= 0),
  total_kg numeric(10,2),   -- trigger-computed (sack_weight_kg varies by product)
  created_at timestamptz not null default now(),
  unique (daily_report_id, session, feed_product_id)
);

create or replace function public.calc_feed_usage_total()
returns trigger language plpgsql as $$
declare
  v_sack_kg numeric;
begin
  select sack_weight_kg into v_sack_kg
  from public.feed_products where id = new.feed_product_id;

  new.total_kg := new.sacks * v_sack_kg + new.loose_kg;
  return new;
end;
$$;

create trigger trg_calc_feed_usage_total
  before insert or update on public.feed_usage
  for each row execute function public.calc_feed_usage_total();

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  daily_report_id uuid not null references public.daily_reports(id) on delete cascade,
  storage_path text not null,       -- bucket 'evidence', path farm_id/report_id/uuid.ext
  captured_at timestamptz,
  uploaded_by uuid references public.profiles(id),
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz not null default now()
);
