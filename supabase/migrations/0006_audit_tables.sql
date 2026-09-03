-- Append-only correction history: a finalized report is never silently overwritten.

create table public.daily_report_revisions (
  id uuid primary key default gen_random_uuid(),
  daily_report_id uuid not null references public.daily_reports(id),
  revision_number int not null,
  snapshot jsonb not null,     -- {report:{...}, egg_production:{...}, feed_usage:[...]}
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now(),
  change_reason text,
  unique (daily_report_id, revision_number)
);
