-- Trigger-only function, same as the 0012/0022 pattern: Postgres already
-- refuses to call a `returns trigger` function outside trigger context, but
-- revoke EXECUTE too so it doesn't show up as a public RPC endpoint.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
