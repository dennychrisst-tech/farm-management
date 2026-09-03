-- Private evidence-photo bucket. Path convention: farm_id/report_id/uuid.ext

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

create policy "evidence_insert_own_farm"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'evidence'
  and (storage.foldername(name))[1] = (select farm_id::text from public.auth_profile())
);

create policy "evidence_select_own_farm"
on storage.objects for select to authenticated
using (
  bucket_id = 'evidence'
  and (storage.foldername(name))[1] = (select farm_id::text from public.auth_profile())
);

create policy "evidence_delete_owner_admin"
on storage.objects for delete to authenticated
using (
  bucket_id = 'evidence'
  and (storage.foldername(name))[1] = (select farm_id::text from public.auth_profile())
  and (select role from public.auth_profile()) in ('owner','admin')
);
