-- Pilot baseline seed data (PRD "Pilot Baseline" table). Fixed farm id so app-side
-- user-seeding scripts (Phase 3) can reference it directly.

insert into public.farms (id, name, timezone, tray_size, sack_weight_kg, container_sacks)
values ('00000000-0000-0000-0000-000000000001', 'Dylan Chicken Farm', 'Asia/Jakarta', 30, 50, 160);

-- Arrival age 16 weeks, age at discovery 20 weeks -> arrival was 4 weeks (28 days) ago.
insert into public.flocks (farm_id, arrival_date, arrival_age_weeks, initial_population, current_population, status)
values ('00000000-0000-0000-0000-000000000001', current_date - 28, 16, 3007, 3007, 'active');

insert into public.feed_products (farm_id, code, name, phase, sequence_order, sack_weight_kg, active) values
('00000000-0000-0000-0000-000000000001', '521', 'Starter', 'starter', 1, 50, true),
('00000000-0000-0000-0000-000000000001', '522', 'Grower',  'grower',  2, 50, true),
('00000000-0000-0000-0000-000000000001', '524', 'Layer',   'layer',   3, 50, true);

insert into public.alert_thresholds
  (farm_id, feed_target_g_per_bird, feed_variance_yellow_pct, feed_variance_red_pct,
   low_stock_lead_time_days, low_stock_safety_buffer_days, mortality_spike_pct,
   production_decline_days, missing_report_cutoff_time)
values
  ('00000000-0000-0000-0000-000000000001', 100, 10, 20, 7, 3, 2, 3, '20:00');
