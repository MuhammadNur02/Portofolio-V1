-- Visitor counter: the eye in the navbar (every device that has ever opened the site, counted once)
-- and "visitors today" in the dashboard.
-- Run once in Supabase → SQL Editor. Safe to re-run.
--
-- The browser never reports a number. It only calls record_visit(), and the database decides whether
-- this device is new. A device is recognised by two things, and counts only if BOTH are new:
--   1. a random id the browser keeps in localStorage, and
--   2. a fingerprint built here: the network address and browser the request arrived with, plus the
--      screen size and device model, which tell apart phones sharing one Wi-Fi.
-- So refreshing, clearing site data or opening a private window adds nothing, and a phone whose IP
-- address changes is still the same device. Only salted hashes are stored — never an IP address,
-- a user-agent or a device model.

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

-- Random secret mixed into every hash, so the stored values cannot be turned back into IP addresses.
create table if not exists public.site_visit_salt (
  id   boolean primary key default true check (id), -- a single row
  salt uuid not null default gen_random_uuid()
);
insert into public.site_visit_salt default values on conflict do nothing;

-- One row per device, ever → the public total.
create table if not exists public.site_visitors (
  device_id   text primary key,
  fingerprint text not null unique,
  first_seen  timestamptz not null default now()
);

-- One row per device per day → the dashboard's daily traffic.
create table if not exists public.site_visits (
  visit_date  date not null,
  device_id   text not null,
  fingerprint text not null,
  network     text not null,
  primary key (visit_date, device_id),
  unique (visit_date, fingerprint)
);
create index if not exists site_visits_network_idx on public.site_visits (visit_date, network);

-- RLS on with no policies, on purpose: nothing reads or writes these tables through the API.
-- The functions below are the only way in.
alter table public.site_visit_salt enable row level security;
alter table public.site_visitors   enable row level security;
alter table public.site_visits     enable row level security;

-- A "day" of traffic is a day in Indonesia (WIB), wherever the visitor is.
create or replace function public.visit_today()
returns date
language sql
stable
set search_path = public
as $$
  select (now() at time zone 'Asia/Jakarta')::date;
$$;

-- Called by the site on every page load. Records the device if it is new and returns the total.
create or replace function public.record_visit(p_device_id uuid default null, p_traits text default '')
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_headers     json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  -- cf-connecting-ip is set by Cloudflare and cannot be forged by the caller; x-forwarded-for is
  -- the fallback Supabase documents.
  v_ip          inet := nullif(trim(coalesce(
                    v_headers->>'cf-connecting-ip',
                    split_part(v_headers->>'x-forwarded-for', ',', 1))), '')::inet;
  v_agent       text := coalesce(v_headers->>'user-agent', '');
  v_salt        text;
  v_network     text;
  v_fingerprint text;
  v_device      text;
begin
  -- Count people, not crawlers, link previews or scripts.
  if v_ip is not null
     and v_agent <> ''
     and v_agent !~* 'bot|crawl|spider|slurp|headless|lighthouse|inspect|preview|curl|wget|python|http'
  then
    select salt::text into v_salt from site_visit_salt;

    -- An IPv6 device keeps changing the second half of its address; the first half is its network.
    if family(v_ip) = 6 then
      v_ip := network(set_masklen(v_ip, 64));
    end if;

    v_network     := encode(sha256(convert_to(v_salt || host(v_ip), 'UTF8')), 'hex');
    v_fingerprint := encode(sha256(convert_to(
                       concat_ws(E'\n', v_salt, host(v_ip), v_agent, left(coalesce(p_traits, ''), 100)), 'UTF8')), 'hex');
    v_device      := coalesce(p_device_id::text, v_fingerprint);

    -- One network can add at most 40 devices a day (a full classroom on the same Wi-Fi), so a script
    -- that pretends to be a new device on every request cannot run the number up.
    if (select count(*) from site_visits where visit_date = visit_today() and network = v_network) < 40 then
      -- "on conflict do nothing" skips the row when either the id or the fingerprint is already known.
      insert into site_visitors (device_id, fingerprint)
      values (v_device, v_fingerprint)
      on conflict do nothing;

      insert into site_visits (visit_date, device_id, fingerprint, network)
      values (visit_today(), v_device, v_fingerprint, v_network)
      on conflict do nothing;
    end if;
  end if;

  return (select count(*) from site_visitors);
end;
$$;

-- For the dashboard: { "today": n, "total": n }. Returns null to anyone who is not the admin.
create or replace function public.visitor_stats()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'today', (select count(*) from site_visits where visit_date = public.visit_today()),
    'total', (select count(*) from site_visitors)
  )
  where public.is_admin();
$$;
