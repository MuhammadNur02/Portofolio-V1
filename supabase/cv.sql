-- Storage for the CV PDF that the "Download CV" buttons link to.
-- The dashboard's "CV" page uploads to this bucket as cv.pdf (replacing the previous file).
-- Run once in Supabase → SQL Editor. Safe to re-run. Needs public.is_admin() from gallery.sql or visitors.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cv', 'cv', true, 5242880, array['application/pdf'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cv is public" on storage.objects;
create policy "cv is public" on storage.objects
  for select using (bucket_id = 'cv');

drop policy if exists "admins upload cv" on storage.objects;
create policy "admins upload cv" on storage.objects
  for insert to authenticated with check (bucket_id = 'cv' and public.is_admin());

drop policy if exists "admins replace cv" on storage.objects;
create policy "admins replace cv" on storage.objects
  for update to authenticated using (bucket_id = 'cv' and public.is_admin()) with check (bucket_id = 'cv' and public.is_admin());

drop policy if exists "admins delete cv" on storage.objects;
create policy "admins delete cv" on storage.objects
  for delete to authenticated using (bucket_id = 'cv' and public.is_admin());
