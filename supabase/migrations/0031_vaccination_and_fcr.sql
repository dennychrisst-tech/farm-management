-- Vaccination schedule (owner-defined, since the actual program depends on
-- the farm's vet/hatchery and regional disease pressure -- we don't assume
-- specific vaccines/ages) with due-date alerting, plus Feed Conversion
-- Ratio added to the KPI view (kg feed per kg egg mass produced).

create table public.vaccination_plan (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id),
  flock_id uuid not null references public.flocks(id),
  day_number int not null check (day_number >= 0),
  vaccine_name text not null,
  method text,
  notes text,
  created_at timestamptz not null default now(),
  unique (flock_id, day_number, vaccine_name)
);

create table public.vaccination_records (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id),
  flock_id uuid not null references public.flocks(id),
  plan_id uuid references public.vaccination_plan(id),
  vaccine_name text not null,
  administered_date date not null default current_date,
  administered_by uuid references public.profiles(id),
  batch_no text,
  notes text,
  created_at timestamptz not null default now()
);
create index idx_vaccination_records_flock on public.vaccination_records (flock_id, administered_date desc);

alter table public.vaccination_plan enable row level security;
alter table public.vaccination_records enable row level security;

create policy vaccination_plan_select on public.vaccination_plan for select to authenticated
using (farm_id = (select farm_id from public.auth_profile()));

create policy vaccination_plan_insert on public.vaccination_plan for insert to authenticated
with check (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner', 'admin'));

create policy vaccination_plan_delete on public.vaccination_plan for delete to authenticated
using (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner', 'admin'));

create policy vaccination_records_select on public.vaccination_records for select to authenticated
using (farm_id = (select farm_id from public.auth_profile()));

create policy vaccination_records_insert on public.vaccination_records for insert to authenticated
with check (farm_id = (select farm_id from public.auth_profile())
       and (select active from public.auth_profile()));

create or replace function public.evaluate_vaccination_due_alerts()
returns void language plpgsql security definer set search_path = public as $$
declare
  p record;
  v_age_days int;
begin
  for p in
    select vp.*, f.arrival_age_weeks, f.arrival_date, f.status as flock_status
    from public.vaccination_plan vp
    join public.flocks f on f.id = vp.flock_id
    where f.status = 'active'
  loop
    v_age_days := p.arrival_age_weeks * 7 + (current_date - p.arrival_date);

    if v_age_days < p.day_number then
      continue;
    end if;

    if exists (select 1 from public.vaccination_records where plan_id = p.id) then
      continue;
    end if;

    if exists (
      select 1 from public.alerts
      where farm_id = p.farm_id and type = 'vaccination_due' and status = 'open'
        and metadata ->> 'plan_id' = p.id::text
    ) then
      continue;
    end if;

    insert into public.alerts (farm_id, type, severity, message, metadata)
    values (
      p.farm_id,
      'vaccination_due',
      case when v_age_days > p.day_number + 3 then 'red' else 'yellow' end,
      format('Vaksin %s untuk flock terjadwal pada umur %s hari (sekarang %s hari) belum dicatat',
        p.vaccine_name, p.day_number, v_age_days),
      jsonb_build_object('plan_id', p.id, 'flock_id', p.flock_id)
    );
  end loop;
end;
$$;
revoke execute on function public.evaluate_vaccination_due_alerts() from public, anon, authenticated;

select cron.schedule('check-vaccination-due', '0 1 * * *', $$select public.evaluate_vaccination_due_alerts();$$);

-- Feed Conversion Ratio: kg feed per kg egg mass. Falls back to an assumed
-- 60g/egg when the report didn't record a total egg weight.
create or replace view public.daily_report_kpis as
 SELECT dr.id AS daily_report_id,
    dr.farm_id,
    dr.flock_id,
    dr.report_date,
    dr.status,
    dr.opening_population,
    dr.closing_population,
    dr.mortality,
    dr.cull,
    ep.total_eggs,
    ep.abnormal_eggs,
    ep.normal_eggs,
    round((((ep.total_eggs)::numeric / (NULLIF(dr.opening_population, 0))::numeric) * (100)::numeric), 2) AS hdp_pct,
    round((((ep.abnormal_eggs)::numeric / (NULLIF(ep.total_eggs, 0))::numeric) * (100)::numeric), 2) AS abnormal_egg_pct,
    round((((dr.mortality)::numeric / (NULLIF(dr.opening_population, 0))::numeric) * (100)::numeric), 2) AS mortality_pct,
    fu.actual_feed_kg,
    round((((dr.opening_population)::numeric * t.feed_target_g_per_bird) / 1000.0), 2) AS feed_target_kg,
    round(((((dr.opening_population)::numeric * t.feed_target_g_per_bird) / 1000.0) / fa.sack_weight_kg), 2) AS feed_target_sacks,
    round(((fu.actual_feed_kg * 1000.0) / (NULLIF(dr.opening_population, 0))::numeric), 1) AS feed_intake_g_per_bird,
    round(fu.actual_feed_kg / nullif(coalesce(ep.egg_weight_kg, ep.total_eggs * 0.06), 0), 3) AS fcr
   FROM ((((daily_reports dr
     JOIN egg_production ep ON ((ep.daily_report_id = dr.id)))
     JOIN farms fa ON ((fa.id = dr.farm_id)))
     JOIN alert_thresholds t ON ((t.farm_id = dr.farm_id)))
     JOIN LATERAL ( SELECT COALESCE(sum(feed_usage.total_kg), (0)::numeric) AS actual_feed_kg
           FROM feed_usage
          WHERE (feed_usage.daily_report_id = dr.id)) fu ON (true));

alter view public.daily_report_kpis set (security_invoker = true);
