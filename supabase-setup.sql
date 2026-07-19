-- ═══════════════════════════════════════════════════════════════
--  Component Builder — Supabase setup
--  Spusti raz v Supabase → SQL Editor → New query → Run
--  (rovnaký pattern ako WebQuote wq_sessions)
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.cb_pages (
  id         text primary key,                      -- slug z URL (?page=...)
  name       text,                                  -- názov pre admin zoznam
  data       jsonb not null default '{}'::jsonb,    -- JSON strom stránky (Puck)
  published  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cb_pages_updated_at_idx
  on public.cb_pages (updated_at desc);

alter table public.cb_pages enable row level security;

-- Anon prístup — ochrana neuhádnuteľným slugom + admin heslom (ako WebQuote).
drop policy if exists "cb_pages_anon_select" on public.cb_pages;
drop policy if exists "cb_pages_anon_insert" on public.cb_pages;
drop policy if exists "cb_pages_anon_update" on public.cb_pages;
drop policy if exists "cb_pages_anon_delete" on public.cb_pages;

create policy "cb_pages_anon_select" on public.cb_pages for select to anon using (true);
create policy "cb_pages_anon_insert" on public.cb_pages for insert to anon with check (true);
create policy "cb_pages_anon_update" on public.cb_pages for update to anon using (true) with check (true);
create policy "cb_pages_anon_delete" on public.cb_pages for delete to anon using (true);
