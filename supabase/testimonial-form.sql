-- Public testimonial form (/testimoni): lecturers, students, clients — anyone who worked with Julian —
-- leave a testimonial for one of the projects, with a star rating and their own photo. It appears on the
-- site straight away; remove one in Dashboard → Testimonials. One project can collect many testimonials.
-- Run once in Supabase → SQL Editor. Safe to re-run.

-- Admin check, same definition as in gallery.sql (repeated so this file can be run on its own).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- New columns. Rows added in the dashboard keep working as before (these stay empty for them).
--   relation:   'lecturer' | 'student' | 'client' | 'colleague', or the visitor's own words ("Mentor")
--   role:       for form rows, the optional institution / company
--   photo_path: the photo in the testimonial-photos bucket (dashboard rows use `avatar`, a full URL)
alter table public.testimonials add column if not exists relation   text;
alter table public.testimonials add column if not exists project_id bigint references public.projects (id) on delete set null;
alter table public.testimonials add column if not exists rating     smallint check (rating between 1 and 5);
alter table public.testimonials add column if not exists photo_path text;
alter table public.testimonials add column if not exists source     text not null default 'admin';
create unique index if not exists testimonials_photo_path_key on public.testimonials (photo_path) where photo_path is not null;
create index if not exists testimonials_project_id_idx on public.testimonials (project_id);

-- Photos sent with the form. Anyone may add one — only as form/<uuid>.webp|.jpg, small, images only —
-- nobody can overwrite one (there is no update policy), and only the admin may delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('testimonial-photos', 'testimonial-photos', true, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "testimonial photos are public" on storage.objects;
create policy "testimonial photos are public" on storage.objects
  for select using (bucket_id = 'testimonial-photos');

drop policy if exists "anyone adds a testimonial photo" on storage.objects;
create policy "anyone adds a testimonial photo" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'testimonial-photos'
    and name ~ '^form/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$'
  );

drop policy if exists "admins delete testimonial photos" on storage.objects;
create policy "admins delete testimonial photos" on storage.objects
  for delete to authenticated using (bucket_id = 'testimonial-photos' and public.is_admin());

-- Rate limiting: one row per accepted testimonial, keyed by a salted hash of the sender's network.
-- RLS on with no policies — only submit_testimonial() reads or writes it.
create table if not exists public.testimonial_submissions (
  network    text not null,
  created_at timestamptz not null default now()
);
create index if not exists testimonial_submissions_network_idx on public.testimonial_submissions (network, created_at);
alter table public.testimonial_submissions enable row level security;

-- Secret salt, shared with the visitor counter (same definition as in visitors.sql).
create table if not exists public.site_visit_salt (
  id   boolean primary key default true check (id), -- a single row
  salt uuid not null default gen_random_uuid()
);
insert into public.site_visit_salt default values on conflict do nothing;
alter table public.site_visit_salt enable row level security;

-- The form's only way in. Everything is checked here, so the browser cannot skip a rule:
-- the photo must really have been uploaded and not be used yet, the project must exist, the rating is
-- 1–5, the text 20–600 characters without links, and one network may send at most 5 a day.
create or replace function public.submit_testimonial(
  p_name        text,
  p_relation    text,
  p_institution text,
  p_project_id  bigint,
  p_rating      int,
  p_quote       text,
  p_photo_path  text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name        text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_relation    text := regexp_replace(btrim(coalesce(p_relation, '')), '\s+', ' ', 'g');
  v_institution text := regexp_replace(btrim(coalesce(p_institution, '')), '\s+', ' ', 'g');
  v_quote       text := btrim(coalesce(p_quote, ''));
  v_headers     json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  -- cf-connecting-ip is set by Cloudflare and cannot be forged by the caller (see visitors.sql).
  v_ip          text := nullif(btrim(coalesce(
                    v_headers->>'cf-connecting-ip',
                    split_part(v_headers->>'x-forwarded-for', ',', 1))), '');
  v_network     text;
  v_id          bigint;
begin
  if char_length(v_name) not between 2 and 60 then raise exception 'invalid_name'; end if;
  if char_length(v_relation) not between 2 and 40 then raise exception 'invalid_relation'; end if;
  if char_length(v_institution) > 80 then raise exception 'invalid_institution'; end if;
  if p_rating is null or p_rating not between 1 and 5 then raise exception 'invalid_rating'; end if;
  if char_length(v_quote) not between 20 and 600 then raise exception 'invalid_quote'; end if;
  if v_quote ~* '(https?://|www\.)' then raise exception 'no_links'; end if;
  if p_project_id is null or not exists (select 1 from projects where id = p_project_id) then
    raise exception 'invalid_project';
  end if;
  if p_photo_path is null
     or p_photo_path !~ '^form/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$'
     or not exists (select 1 from storage.objects where bucket_id = 'testimonial-photos' and name = p_photo_path)
     or exists (select 1 from testimonials where photo_path = p_photo_path)
  then
    raise exception 'invalid_photo';
  end if;

  if v_ip is not null then
    v_network := encode(sha256(convert_to((select salt::text from site_visit_salt) || v_ip, 'UTF8')), 'hex');
    if (select count(*) from testimonial_submissions
        where network = v_network and created_at > now() - interval '1 day') >= 5 then
      raise exception 'rate_limited';
    end if;
    insert into testimonial_submissions (network) values (v_network);
  end if;

  insert into testimonials (name, role, quote, relation, project_id, rating, photo_path, source, order_index)
  values (v_name, v_institution, v_quote, v_relation, p_project_id, p_rating, p_photo_path, 'form', 0)
  returning id into v_id;

  return v_id;
end;
$$;
