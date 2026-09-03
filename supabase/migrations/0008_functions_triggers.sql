-- Business logic core: finalize/correct a daily report, evaluate alert rules,
-- block negative inventory, and the missing-report scheduled check.
-- All SECURITY DEFINER functions run as the owning (migration) role, which bypasses
-- RLS on Supabase-managed projects -- this is the intentional, single choke point
-- through which inventory USAGE rows and alerts get written.

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
      (r.farm_id, fu.feed_product_id, 'USAGE', -fu.sacks, -fu.total_kg,
       'daily_report:' || r.id, r.id, r.reporter_id);
  end loop;

  update public.daily_reports set status = 'submitted', submitted_at = now() where id = r.id;
  update public.flocks set current_population = r.closing_population where id = r.flock_id;

  perform public.evaluate_feed_variance_alert(r.id);
  perform public.evaluate_mortality_spike_alert(r.id);
  perform public.evaluate_low_stock_alert(r.farm_id);
  perform public.evaluate_production_decline_alert(r.flock_id, r.id);
  perform public.evaluate_milestone_alert(r.id);
end;
$$;
grant execute on function public.finalize_daily_report(uuid) to authenticated;

create or replace function public.evaluate_feed_variance_alert(p_report_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  k record;
  t record;
  variance_pct numeric;
  sev text;
begin
  select * into k from public.daily_report_kpis where daily_report_id = p_report_id;
  select * into t from public.alert_thresholds where farm_id = k.farm_id;
  if k.feed_target_kg is null or k.feed_target_kg = 0 then return; end if;

  variance_pct := abs(k.actual_feed_kg - k.feed_target_kg) / k.feed_target_kg * 100;

  if variance_pct > t.feed_variance_red_pct then
    sev := 'red';
  elsif variance_pct > t.feed_variance_yellow_pct then
    sev := 'yellow';
  else
    return;
  end if;

  if not exists (
    select 1 from public.alerts
    where farm_id = k.farm_id and type = 'feed_variance' and related_daily_report_id = p_report_id
  ) then
    insert into public.alerts (farm_id, type, severity, message, related_daily_report_id, metadata)
    values (k.farm_id, 'feed_variance', sev,
      format('Feed usage on %s differs from target by %s%% (actual %s kg vs target %s kg)',
             k.report_date, round(variance_pct,1), k.actual_feed_kg, k.feed_target_kg),
      p_report_id, jsonb_build_object('variance_pct', variance_pct));
  end if;
end;
$$;

create or replace function public.evaluate_mortality_spike_alert(p_report_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  k record;
  t record;
begin
  select * into k from public.daily_report_kpis where daily_report_id = p_report_id;
  select * into t from public.alert_thresholds where farm_id = k.farm_id;
  if k.mortality_pct is null then return; end if;

  if k.mortality_pct > t.mortality_spike_pct then
    if not exists (
      select 1 from public.alerts
      where farm_id = k.farm_id and type = 'mortality_spike' and related_daily_report_id = p_report_id
    ) then
      insert into public.alerts (farm_id, type, severity, message, related_daily_report_id, metadata)
      values (k.farm_id, 'mortality_spike', 'red',
        format('Mortality on %s is %s%% of opening population (threshold %s%%)',
               k.report_date, k.mortality_pct, t.mortality_spike_pct),
        p_report_id, jsonb_build_object('mortality_pct', k.mortality_pct));
    end if;
  end if;
end;
$$;

create or replace function public.evaluate_low_stock_alert(p_farm_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  c record;
  t record;
  sev text;
  cov numeric;
begin
  select * into t from public.alert_thresholds where farm_id = p_farm_id;

  for c in select * from public.feed_stock_coverage where farm_id = p_farm_id loop
    cov := coalesce(c.coverage_days_actual, c.coverage_days_target);
    if cov is null then continue; end if;

    if cov <= t.low_stock_lead_time_days then
      sev := 'red';
    elsif cov <= (t.low_stock_lead_time_days + t.low_stock_safety_buffer_days) then
      sev := 'yellow';
    else
      continue;
    end if;

    if not exists (
      select 1 from public.alerts
      where farm_id = p_farm_id and type = 'low_feed_stock'
        and related_feed_product_id = c.feed_product_id
        and status = 'open' and created_at::date = current_date
    ) then
      insert into public.alerts (farm_id, type, severity, message, related_feed_product_id, metadata)
      values (p_farm_id, 'low_feed_stock', sev,
        format('%s stock covers ~%s days (%s sacks left)', c.name, cov, round(c.balance_sacks,1)),
        c.feed_product_id, jsonb_build_object('coverage_days', cov));
    end if;
  end loop;
end;
$$;

create or replace function public.evaluate_production_decline_alert(p_flock_id uuid, p_report_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  t record;
  v_farm_id uuid;
  n int;
  is_declining boolean := true;
  prev numeric := null;
  rec record;
  cnt int := 0;
begin
  select farm_id into v_farm_id from public.flocks where id = p_flock_id;
  select * into t from public.alert_thresholds where farm_id = v_farm_id;
  n := t.production_decline_days;

  -- newest first; a declining trend means each older day's HDP is higher than the
  -- next newer day's, i.e. rec.hdp_pct strictly increases as we walk backward in time.
  for rec in
    select hdp_pct from public.daily_report_kpis
    where flock_id = p_flock_id and status in ('submitted','verified')
    order by report_date desc
    limit n
  loop
    cnt := cnt + 1;
    if prev is not null and rec.hdp_pct <= prev then
      is_declining := false;
      exit;
    end if;
    prev := rec.hdp_pct;
  end loop;

  if cnt < n then
    return; -- not enough reporting history yet
  end if;

  if is_declining then
    if not exists (
      select 1 from public.alerts
      where farm_id = v_farm_id and type = 'production_decline'
        and status = 'open' and created_at::date = current_date
    ) then
      insert into public.alerts (farm_id, type, severity, message, related_daily_report_id)
      values (v_farm_id, 'production_decline', 'yellow',
        format('HDP has declined for %s consecutive reporting days', n), p_report_id);
    end if;
  end if;
end;
$$;

create or replace function public.evaluate_milestone_alert(p_report_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  k record;
  m int;
  milestones int[] := array[5,10,25,50,75,90];
begin
  select * into k from public.daily_report_kpis where daily_report_id = p_report_id;
  if k.hdp_pct is null then return; end if;

  foreach m in array milestones loop
    if k.hdp_pct >= m then
      insert into public.milestones_reached (flock_id, milestone_pct, reached_date, daily_report_id)
      values (k.flock_id, m, k.report_date, p_report_id)
      on conflict (flock_id, milestone_pct) do nothing;

      if found then
        insert into public.alerts (farm_id, type, severity, message, related_daily_report_id)
        values (k.farm_id, 'milestone', 'info',
          format('Flock reached %s%% HDP for the first time on %s', m, k.report_date), p_report_id);
      end if;
    end if;
  end loop;
end;
$$;

-- Only Owner/Admin may correct a submitted/verified report. Never mutates history silently:
-- writes a revision snapshot and reverses/redoes inventory via compensating entries.
create or replace function public.correct_daily_report(
  p_report_id uuid,
  p_mortality int,
  p_cull int,
  p_population_adjustment int,
  p_egg jsonb,          -- {normal_trays, normal_loose, abnormal_trays, abnormal_loose, egg_weight_kg}
  p_feed jsonb,          -- array of {session, feed_product_id, sacks, loose_kg}
  p_reason text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller record;
  r public.daily_reports%rowtype;
  next_rev int;
  item jsonb;
  v_closing int;
begin
  select * into caller from public.auth_profile();
  if caller.role not in ('owner','admin') then
    raise exception 'Not authorized';
  end if;

  select * into r from public.daily_reports where id = p_report_id for update;
  if not found then raise exception 'Report not found'; end if;
  if r.status = 'draft' then raise exception 'Use submit for a draft report, not correction'; end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A reason is required for corrections';
  end if;

  select coalesce(max(revision_number),0) + 1 into next_rev
  from public.daily_report_revisions where daily_report_id = r.id;

  insert into public.daily_report_revisions (daily_report_id, revision_number, snapshot, changed_by, change_reason)
  values (r.id, next_rev, jsonb_build_object(
      'report', to_jsonb(r),
      'egg_production', (select to_jsonb(e) from public.egg_production e where daily_report_id = r.id),
      'feed_usage', (select coalesce(jsonb_agg(to_jsonb(u)), '[]'::jsonb) from public.feed_usage u where daily_report_id = r.id)
    ), caller.id, p_reason);

  -- reverse prior USAGE transactions for this report via compensating ADJUSTMENT
  insert into public.inventory_transactions
    (farm_id, feed_product_id, type, qty_sacks, qty_kg, reference, daily_report_id, reason, created_by)
  select r.farm_id, feed_product_id, 'ADJUSTMENT', -qty_sacks, -qty_kg,
         'reversal:' || r.id, r.id, 'Correction reversal: ' || p_reason, caller.id
  from public.inventory_transactions
  where daily_report_id = r.id and type = 'USAGE';

  update public.daily_reports set
    mortality = p_mortality,
    cull = p_cull,
    population_adjustment = p_population_adjustment,
    verified_by = caller.id,
    verified_at = now(),
    status = 'verified'
  where id = r.id;

  update public.egg_production set
    normal_trays = (p_egg->>'normal_trays')::int,
    normal_loose = (p_egg->>'normal_loose')::int,
    abnormal_trays = (p_egg->>'abnormal_trays')::int,
    abnormal_loose = (p_egg->>'abnormal_loose')::int,
    egg_weight_kg = nullif(p_egg->>'egg_weight_kg','')::numeric
  where daily_report_id = r.id;

  delete from public.feed_usage where daily_report_id = r.id;
  for item in select * from jsonb_array_elements(p_feed) loop
    insert into public.feed_usage (daily_report_id, session, feed_product_id, sacks, loose_kg)
    values (r.id, item->>'session', (item->>'feed_product_id')::uuid,
            (item->>'sacks')::numeric, coalesce((item->>'loose_kg')::numeric,0));
  end loop;

  -- re-deduct inventory with the corrected values
  insert into public.inventory_transactions
    (farm_id, feed_product_id, type, qty_sacks, qty_kg, reference, daily_report_id, created_by)
  select r.farm_id, feed_product_id, 'USAGE', -sacks, -total_kg,
         'daily_report:' || r.id || ':rev' || next_rev, r.id, caller.id
  from public.feed_usage where daily_report_id = r.id;

  select closing_population into v_closing from public.daily_reports where id = r.id;
  update public.flocks set current_population = v_closing where id = r.flock_id;

  perform public.evaluate_feed_variance_alert(r.id);
  perform public.evaluate_mortality_spike_alert(r.id);
  perform public.evaluate_production_decline_alert(r.flock_id, r.id);
  perform public.evaluate_milestone_alert(r.id);
end;
$$;
grant execute on function public.correct_daily_report(uuid,int,int,int,jsonb,jsonb,text) to authenticated;

-- Negative-inventory guard: a non-adjustment insert that would drive balance negative fails;
-- Owner must post an explicit ADJUSTMENT with a reason first.
create or replace function public.block_negative_inventory()
returns trigger language plpgsql as $$
declare
  bal numeric;
  new_bal numeric;
begin
  select coalesce(sum(qty_kg),0) into bal
  from public.inventory_transactions where feed_product_id = new.feed_product_id;

  new_bal := bal + new.qty_kg;

  if new_bal < 0 and new.type <> 'ADJUSTMENT' then
    raise exception 'Insufficient stock for product %: balance would be % kg. Owner must record an adjustment first.',
      new.feed_product_id, new_bal;
  end if;

  if new.type = 'ADJUSTMENT' and new.qty_kg < 0 and new.reason is null then
    raise exception 'Negative adjustments require a reason';
  end if;

  return new;
end;
$$;

create trigger trg_block_negative_inventory
  before insert on public.inventory_transactions
  for each row execute function public.block_negative_inventory();

-- Missing-report check: cron-driven (not a submit-time trigger) since it fires on absence, not action.
create or replace function public.check_missing_reports()
returns void language plpgsql security definer set search_path = public as $$
declare
  f record;
  local_now timestamp;
  today date;
begin
  for f in
    select fa.id, fa.timezone, t.missing_report_cutoff_time
    from public.farms fa
    join public.alert_thresholds t on t.farm_id = fa.id
  loop
    local_now := now() at time zone f.timezone;
    today := local_now::date;

    if local_now::time >= f.missing_report_cutoff_time
       and not exists (
         select 1 from public.daily_reports
         where farm_id = f.id and report_date = today and status in ('submitted','verified')
       )
       and not exists (
         select 1 from public.alerts
         where farm_id = f.id and type = 'missing_report' and created_at::date = today
       )
    then
      insert into public.alerts (farm_id, type, severity, message)
      values (f.id, 'missing_report', 'yellow',
        format('No finalized daily report for %s as of cutoff time %s', today, f.missing_report_cutoff_time));
    end if;
  end loop;
end;
$$;

select cron.schedule('check-missing-reports', '*/15 * * * *', $$select public.check_missing_reports();$$);
