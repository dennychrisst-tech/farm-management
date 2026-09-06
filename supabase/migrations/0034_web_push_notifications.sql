-- Web push notifications for yellow/red alerts, so an Owner who isn't
-- actively looking at the app still learns about a critical alert (low
-- stock, mortality spike, etc.) instead of only seeing it next time they
-- open the Alert tab.
create extension if not exists pg_net;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy push_subscriptions_select on public.push_subscriptions
  for select using (user_id = (select auth.uid()));

create policy push_subscriptions_insert on public.push_subscriptions
  for insert with check (user_id = (select auth.uid()));

create policy push_subscriptions_delete on public.push_subscriptions
  for delete using (user_id = (select auth.uid()));

-- Secrets (VAPID keypair for signing push requests, and a shared secret the
-- alert trigger attaches to its webhook call so the edge function can
-- reject requests that didn't come from this database) live in Supabase
-- Vault rather than in code. Only service_role can read them back, via this
-- wrapper function -- the edge function calls it with the service-role key.
create or replace function public.get_push_secrets()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_object_agg(name, decrypted_secret)
  from vault.decrypted_secrets
  where name in ('vapid_public_key', 'vapid_private_key', 'push_webhook_secret');
$$;

revoke all on function public.get_push_secrets() from public, anon, authenticated;
grant execute on function public.get_push_secrets() to service_role;

create or replace function public.notify_alert_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
begin
  if new.severity not in ('yellow', 'red') then
    return new;
  end if;

  select decrypted_secret into v_secret
  from vault.decrypted_secrets where name = 'push_webhook_secret';

  if v_secret is null then
    return new;
  end if;

  perform net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'push_webhook_url'),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    body := jsonb_build_object(
      'alert_id', new.id,
      'farm_id', new.farm_id,
      'severity', new.severity,
      'type', new.type,
      'message', new.message
    )
  );

  return new;
end;
$$;

create trigger trg_notify_alert_push
  after insert on public.alerts
  for each row execute function public.notify_alert_push();
