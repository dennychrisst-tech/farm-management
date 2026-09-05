-- Egg quality: replace the coarse abnormal trays/loose count with a defect
-- breakdown so a report points at *why* eggs were rejected (shell, dirt,
-- size...) instead of just "abnormal". Normal eggs stay tray+loose since
-- they're counted in bulk; defects are counted individually during sorting.

alter table public.egg_production
  add column defect_cracked int not null default 0 check (defect_cracked >= 0),
  add column defect_dirty int not null default 0 check (defect_dirty >= 0),
  add column defect_thin_shell int not null default 0 check (defect_thin_shell >= 0),
  add column defect_double_yolk int not null default 0 check (defect_double_yolk >= 0),
  add column defect_undersized int not null default 0 check (defect_undersized >= 0),
  add column defect_other int not null default 0 check (defect_other >= 0);

-- Preserve historical totals: fold any existing abnormal count into defect_other.
update public.egg_production
set defect_other = abnormal_eggs
where coalesce(abnormal_eggs, 0) > 0;

alter table public.egg_production
  drop column abnormal_trays,
  drop column abnormal_loose;

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
  new.abnormal_eggs := new.defect_cracked + new.defect_dirty + new.defect_thin_shell
                        + new.defect_double_yolk + new.defect_undersized + new.defect_other;
  new.total_eggs := new.normal_eggs + new.abnormal_eggs;
  new.updated_at := now();
  return new;
end;
$$;
