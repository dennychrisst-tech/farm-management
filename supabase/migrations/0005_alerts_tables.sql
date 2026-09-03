-- Configurable thresholds, alerts, and one-time milestone tracking

create table public.alert_thresholds (
  farm_id uuid primary key references public.farms(id),
  feed_target_g_per_bird numeric not null default 100,
  feed_variance_yellow_pct numeric not null default 10,
  feed_variance_red_pct numeric not null default 20,
  low_stock_lead_time_days numeric not null default 7,
  low_stock_safety_buffer_days numeric not null default 3,
  mortality_spike_pct numeric not null default 2,
  production_decline_days int not null default 3,
  missing_report_cutoff_time time not null default '20:00',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id),
  occurred_at timestamptz not null default now(),
  type text not null check (type in
    ('feed_variance','low_feed_stock','mortality_spike','production_decline','missing_report','milestone')),
  severity text not null check (severity in ('info','yellow','red')),
  message text not null,
  status text not null default 'open' check (status in ('open','acknowledged','resolved')),
  related_daily_report_id uuid references public.daily_reports(id),
  related_feed_product_id uuid references public.feed_products(id),
  metadata jsonb,
  created_at timestamptz not null default now(),
  acknowledged_by uuid references public.profiles(id),
  acknowledged_at timestamptz
);
create index idx_alerts_farm_status on public.alerts (farm_id, status, created_at desc);

-- unique(flock_id, milestone_pct) is what makes "first time crossed" fire exactly once
create table public.milestones_reached (
  id uuid primary key default gen_random_uuid(),
  flock_id uuid not null references public.flocks(id),
  milestone_pct int not null check (milestone_pct in (5,10,25,50,75,90)),
  reached_date date not null,
  daily_report_id uuid references public.daily_reports(id),
  created_at timestamptz not null default now(),
  unique (flock_id, milestone_pct)
);
