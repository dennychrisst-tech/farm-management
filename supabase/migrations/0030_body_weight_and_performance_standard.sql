-- Body weight uniformity drives peak production and persistency -- farms
-- that sample regularly catch nutrition problems weeks before HDP% would
-- show it. Also adds a standard performance curve (HDP% and body weight
-- by age) to flock_targets so actual results can be benchmarked against
-- expectation, not just against their own past trend.

create table public.body_weight_samples (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id),
  flock_id uuid not null references public.flocks(id),
  sample_date date not null default current_date,
  age_days int not null check (age_days >= 0),
  sample_count int not null check (sample_count > 0),
  avg_weight_grams numeric(8,2) not null check (avg_weight_grams > 0),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index idx_body_weight_flock_date on public.body_weight_samples (flock_id, sample_date desc);

alter table public.body_weight_samples enable row level security;

create policy body_weight_samples_select on public.body_weight_samples for select to authenticated
using (farm_id = (select farm_id from public.auth_profile()));

create policy body_weight_samples_insert on public.body_weight_samples for insert to authenticated
with check (
  farm_id = (select farm_id from public.auth_profile())
  and (select active from public.auth_profile())
);

-- Standard curve, appended so the existing seeded feed/light columns keep their positions.
alter table public.flock_targets
  add column target_hdp_pct numeric(5,2),
  add column target_body_weight_g numeric(8,2);

-- Generic commercial brown-egg-layer benchmark by age in weeks -- NOT this
-- flock's specific breed/manufacturer curve (we don't have that document,
-- unlike the feed schedule which came from the customer's actual supplier
-- PDF). Meant as a reasonable industry reference point; the UI must label
-- it as an estimate.
update public.flock_targets set
  target_hdp_pct = case
    when day_number < 112 then 0
    when day_number < 126 then 2
    when day_number < 133 then 5
    when day_number < 140 then 20
    when day_number < 147 then 50
    when day_number < 154 then 75
    when day_number < 161 then 85
    when day_number < 168 then 90
    when day_number < 182 then 92
    when day_number < 315 then 94
    when day_number < 420 then 92
    when day_number < 490 then 88
    when day_number < 560 then 83
    when day_number < 630 then 76
    when day_number < 700 then 68
    else 60
  end,
  target_body_weight_g = case
    when day_number < 112 then 1300
    when day_number < 126 then 1450
    when day_number < 140 then 1520
    when day_number < 154 then 1600
    when day_number < 168 then 1680
    when day_number < 182 then 1750
    when day_number < 315 then 1850
    when day_number < 420 then 1900
    when day_number < 560 then 1950
    else 2000
  end;
