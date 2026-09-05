-- Self-service registration. New accounts are created via Supabase Auth
-- signUp() on the client, which only ever produces an auth.users row --
-- the matching public.profiles row is created here, server-side, by a
-- trigger on auth.users so it happens regardless of email-confirmation
-- timing and can never be influenced by client-supplied role/active values.
--
-- role is hardcoded to 'worker' and active to false: a self-registered
-- account can never become admin/owner by itself, and can't act on the
-- farm (RLS on daily_reports_insert already requires active=true) until
-- an existing owner/admin flips it on in Settings -> Pengguna.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_farm_id uuid;
begin
  select id into v_farm_id from public.farms order by created_at limit 1;

  insert into public.profiles (id, farm_id, name, role, phone, active)
  values (
    new.id,
    v_farm_id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    'worker',
    new.raw_user_meta_data ->> 'phone',
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
