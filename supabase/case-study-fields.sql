-- Adds case-study fields to the projects table: what problem the project solved, how it was
-- approached, what the author's role was, and what came out of it. All optional — a project
-- with none of these filled in just shows the existing overview/tech/features as before.
-- Run once in Supabase → SQL Editor. Safe to re-run.

alter table public.projects add column if not exists "Challenge" text;
alter table public.projects add column if not exists "Approach" text;
alter table public.projects add column if not exists "Role" text;
alter table public.projects add column if not exists "Results" text;
