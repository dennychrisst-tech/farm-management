-- Water intake is the earliest warning sign in layer flocks -- a drop in
-- water consumption typically precedes a drop in feed intake and egg
-- production by 24-48 hours. Track it daily and alert on a sudden drop
-- vs. the recent rolling average, same pattern as feed_variance.

alter table public.daily_reports add column water_liters numeric(10,2);

alter table public.alert_thresholds
  add column water_drop_alert_pct numeric not null default 20;

alter table public.alerts drop constraint alerts_type_check;
alter table public.alerts add constraint alerts_type_check check (
  type in (
    'feed_variance', 'low_feed_stock', 'mortality_spike', 'production_decline',
    'missing_report', 'milestone', 'stock_discrepancy', 'low_supply_stock',
    'water_drop', 'vaccination_due'
  )
);

create or replace function public.evaluate_water_intake_alert(p_report_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  r record;
  t record;
  v_avg numeric;
  v_drop_pct numeric;
begin
  select * into r from public.daily_reports where id = p_report_id;
  if r.water_liters is null then
    return;
  end if;

  select avg(dr.water_liters) into v_avg
  from public.daily_reports dr
  where dr.flock_id = r.flock_id
    and dr.status in ('submitted', 'verified')
    and dr.water_liters is not null
    and dr.report_date < r.report_date
    and dr.report_date >= r.report_date - 3;

  if v_avg is null or v_avg = 0 then
    return;
  end if;

  v_drop_pct := (v_avg - r.water_liters) / v_avg * 100;

  select * into t from public.alert_thresholds where farm_id = r.farm_id;
  if v_drop_pct <= t.water_drop_alert_pct then
    return;
  end if;

  if not exists (
    select 1 from public.alerts
    where farm_id = r.farm_id and type = 'water_drop' and related_daily_report_id = r.id
  ) then
    insert into public.alerts (farm_id, type, severity, message, related_daily_report_id)
    values (
      r.farm_id,
      'water_drop',
      case when v_drop_pct > t.water_drop_alert_pct * 1.5 then 'red' else 'yellow' end,
      format('Konsumsi air turun %s%% (rata-rata 3 hari: %s L, hari ini: %s L) -- periksa kesehatan ayam',
        round(v_drop_pct, 1), round(v_avg, 1), r.water_liters),
      r.id
    );
  end if;
end;
$$;
revoke execute on function public.evaluate_water_intake_alert(uuid) from public, anon, authenticated;

create or replace function public.finalize_daily_report(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.daily_reports%rowtype;
  fu record;
begin
  select * into r from public.daily_reports where id = p_report_id for update;
  if not found then
    raise exception 'Report not found';
  end if;
  if r.status <> 'draft' then
    raise exception 'Report already finalized';
  end if;
  if not exists (select 1 from public.egg_production where daily_report_id = r.id) then
    raise exception 'Egg production must be recorded before submitting';
  end if;
  if r.mortality > r.opening_population then
    raise exception 'Mortality (%) cannot exceed opening population (%)', r.mortality, r.opening_population;
  end if;

  for fu in select * from public.feed_usage where daily_report_id = r.id loop
    insert into public.inventory_transactions
      (farm_id, feed_product_id, type, qty_sacks, qty_kg, reference, daily_report_id, created_by)
    values
      (r.farm_id, fu.feed_product_id, 'USAGE', -fu.sacks, -fu.total_kg, 'daily_report:' || r.id, r.id, r.reporter_id);
  end loop;

  update public.daily_reports set status = 'submitted', submitted_at = now() where id = r.id;
  update public.flocks set current_population = r.closing_population where id = r.flock_id;

  perform public.evaluate_feed_variance_alert(r.id);
  perform public.evaluate_mortality_spike_alert(r.id);
  perform public.evaluate_low_stock_alert(r.farm_id);
  perform public.evaluate_production_decline_alert(r.flock_id, r.id);
  perform public.evaluate_milestone_alert(r.id);
  perform public.evaluate_water_intake_alert(r.id);
end;
$$;
grant execute on function public.finalize_daily_report(uuid) to authenticated;
