-- Core reference tables: farms, profiles (users), flocks, feed products

create table public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Jakarta',
  tray_size int not null default 30,
  sack_weight_kg numeric(6,2) not null default 50,
  container_sacks int not null default 160,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  farm_id uuid not null references public.farms(id),
  name text not null,
  role text not null check (role in ('worker','owner','admin')),
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index idx_profiles_farm_id on public.profiles (farm_id);

create table public.flocks (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id),
  arrival_date date not null,
  arrival_age_weeks int not null check (arrival_age_weeks >= 0),
  initial_population int not null check (initial_population >= 0),
  current_population int not null check (current_population >= 0),
  status text not null default 'active' check (status in ('active','closed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index idx_flocks_farm_status on public.flocks (farm_id, status);

create table public.feed_products (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id),
  code text not null,               -- '521','522','524'
  name text not null,               -- 'Starter','Grower','Layer'
  phase text,
  sequence_order int not null default 0,
  sack_weight_kg numeric(6,2) not null default 50,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (farm_id, code)
);

-- Helper to avoid RLS recursion on profiles; used by every policy in 0010.
-- SECURITY DEFINER runs as the migration role (bypasses RLS on Supabase-managed projects).
create or replace function public.auth_profile()
returns table(id uuid, farm_id uuid, role text, active boolean)
language sql stable security definer set search_path = public as $$
  select id, farm_id, role, active from public.profiles where id = auth.uid();
$$;
