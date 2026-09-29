-- Security check for the portfolio's Supabase project.
-- Paste into Supabase → SQL Editor and run. Parts 1–2 only READ; part 3 changes bucket limits.

-- 1) Every table in `public` must have Row Level Security ON (rls_enabled = true).
--    The anon key ships to every visitor's browser, so RLS is what protects the data.
select tablename, rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
order by tablename;

-- 2) Who may do what. Look at rows where cmd is INSERT / UPDATE / DELETE / ALL:
--    - `roles` = {authenticated} with qual/with_check = true  → ANY signed-in account can write.
--      That is only safe while sign-ups are disabled (Authentication → Sign In / Providers → Email →
--      turn off "Allow new users to sign up"). Safer still: use public.is_admin() (created by gallery.sql),
--      e.g.  using (public.is_admin()) with check (public.is_admin()).
--    - portfolio_comments is the one table where anonymous INSERT is intended (the public guestbook);
--      UPDATE / DELETE there should be admin-only.
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, cmd;

-- 3) Visitors can upload a profile photo with a comment, so cap that bucket to small images only.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'profile-images';
