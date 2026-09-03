-- Read-side KPI views. Plain views (not materialized) are fine at pilot (single-farm) scale --
-- upgrade path if this ever gets slow is a materialized view refreshed by pg_cron.

create view public.daily_report_kpis as
select
  dr.id as daily_report_id, dr.farm_id, dr.flock_id, dr.report_date, dr.status,
  dr.opening_population, dr.closing_population, dr.mortality, dr.cull,
  ep.total_eggs, ep.abnormal_eggs, ep.normal_eggs,
  round(ep.total_eggs::numeric / nullif(dr.opening_population,0) * 100, 2) as hdp_pct,
  round(ep.abnormal_eggs::numeric / nullif(ep.total_eggs,0) * 100, 2) as abnormal_egg_pct,
  round(dr.mortality::numeric / nullif(dr.opening_population,0) * 100, 2) as mortality_pct,
  fu.actual_feed_kg,
  round(dr.opening_population * t.feed_target_g_per_bird / 1000.0, 2) as feed_target_kg,
  round((dr.opening_population * t.feed_target_g_per_bird / 1000.0) / fa.sack_weight_kg, 2) as feed_target_sacks,
  round(fu.actual_feed_kg * 1000.0 / nullif(dr.opening_population,0), 1) as feed_intake_g_per_bird
from public.daily_reports dr
join public.egg_production ep on ep.daily_report_id = dr.id
join public.farms fa on fa.id = dr.farm_id
join public.alert_thresholds t on t.farm_id = dr.farm_id
join lateral (
  select coalesce(sum(total_kg),0) as actual_feed_kg
  from public.feed_usage where daily_report_id = dr.id
) fu on true;

create view public.feed_stock_balances as
select fp.id as feed_product_id, fp.farm_id, fp.code, fp.name,
       coalesce(sum(it.qty_kg),0) as balance_kg,
       coalesce(sum(it.qty_kg),0) / fp.sack_weight_kg as balance_sacks
from public.feed_products fp
left join public.inventory_transactions it on it.feed_product_id = fp.id
group by fp.id;

create view public.feed_stock_coverage as
select b.*, t.feed_target_g_per_bird, t.low_stock_lead_time_days, t.low_stock_safety_buffer_days,
       fl.current_population,
       round(fl.current_population * t.feed_target_g_per_bird / 1000.0, 2) as target_daily_kg,
       round(b.balance_kg / nullif(fl.current_population * t.feed_target_g_per_bird / 1000.0,0), 1) as coverage_days_target,
       -- rolling actual: avg daily total_kg over last 7 days, only meaningful once >=7 days of history exist
       ra.avg_daily_actual_kg,
       case when ra.days_of_history >= 7
         then round(b.balance_kg / nullif(ra.avg_daily_actual_kg,0), 1) end as coverage_days_actual
from public.feed_stock_balances b
join public.flocks fl on fl.farm_id = b.farm_id and fl.status = 'active'
join public.alert_thresholds t on t.farm_id = b.farm_id
join lateral (
  select avg(fu.total_kg) as avg_daily_actual_kg, count(distinct dr.report_date) as days_of_history
  from public.feed_usage fu
  join public.daily_reports dr on dr.id = fu.daily_report_id
  where fu.feed_product_id = b.feed_product_id
    and dr.status in ('submitted','verified')
    and dr.report_date >= current_date - 7
) ra on true;
