-- Storage for the profile photo that replaces the logo in the navbar, footer and project pages.
-- The dashboard's "Profile Photo" page uploads to this bucket as avatar.webp (replacing the previous photo).
-- Until a photo is uploaded the site keeps showing the 侍 seal, so nothing breaks.
-- Run once in Supabase → SQL Editor. Safe to re-run. Needs public.is_admin() from gallery.sql or visitors.sql.
-- (Not the `profile-images` bucket: that one takes uploads from visitors who leave a guestbook comment.)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatar', 'avatar', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatar is public" on storage.objects;
create policy "avatar is public" on storage.objects
  for select using (bucket_id = 'avatar');

drop policy if exists "admins upload avatar" on storage.objects;
create policy "admins upload avatar" on storage.objects
  for insert to authenticated with check (bucket_id = 'avatar' and public.is_admin());

drop policy if exists "admins replace avatar" on storage.objects;
create policy "admins replace avatar" on storage.objects
  for update to authenticated using (bucket_id = 'avatar' and public.is_admin()) with check (bucket_id = 'avatar' and public.is_admin());

drop policy if exists "admins delete avatar" on storage.objects;
create policy "admins delete avatar" on storage.objects
  for delete to authenticated using (bucket_id = 'avatar' and public.is_admin());
