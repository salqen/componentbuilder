-- ═══════════════════════════════════════════════════════════════
--  Component Builder — verzovanie stránok (migrácia č. 2)
--  Spusti v Supabase → SQL Editor (po supabase-setup.sql)
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.cb_page_versions (
  id         uuid primary key default gen_random_uuid(),
  page_id    text not null references public.cb_pages(id) on delete cascade,
  data       jsonb not null,
  label      text default '',
  created_at timestamptz not null default now()
);

create index if not exists cb_page_versions_page_idx
  on public.cb_page_versions (page_id, created_at desc);

alter table public.cb_page_versions enable row level security;

drop policy if exists "cb_versions_anon_select" on public.cb_page_versions;
drop policy if exists "cb_versions_anon_insert" on public.cb_page_versions;
drop policy if exists "cb_versions_anon_delete" on public.cb_page_versions;

create policy "cb_versions_anon_select" on public.cb_page_versions for select to anon using (true);
create policy "cb_versions_anon_insert" on public.cb_page_versions for insert to anon with check (true);
create policy "cb_versions_anon_delete" on public.cb_page_versions for delete to anon using (true);
