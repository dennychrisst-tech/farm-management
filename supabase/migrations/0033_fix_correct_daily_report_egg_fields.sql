-- correct_daily_report was written against an earlier egg_production shape
-- (abnormal_trays/abnormal_loose columns) that was later replaced by
-- per-defect-type counts (defect_cracked, defect_dirty, ...). The function
-- was never updated to match and was never exercised by any UI, so it would
-- have failed at runtime with "column abnormal_trays does not exist" the
-- first time it was actually called. Fix it to write the real columns.
create or replace function public.correct_daily_report(
  p_report_id uuid,
  p_mortality int,
  p_cull int,
  p_population_adjustment int,
  p_egg jsonb,
  p_feed jsonb,
  p_reason text
)
returns void
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
    defect_cracked = coalesce((p_egg->>'defect_cracked')::int, 0),
    defect_dirty = coalesce((p_egg->>'defect_dirty')::int, 0),
    defect_thin_shell = coalesce((p_egg->>'defect_thin_shell')::int, 0),
    defect_double_yolk = coalesce((p_egg->>'defect_double_yolk')::int, 0),
    defect_undersized = coalesce((p_egg->>'defect_undersized')::int, 0),
    defect_other = coalesce((p_egg->>'defect_other')::int, 0),
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
