-- ═══════════════════════════════════════════════════════════════
--  Component Builder — Fáza 4: A/B varianty (MD §7)
--  Model „linked page": variant B je samostatná cb_pages stránka.
--  Stránka A drží A/B konfiguráciu + jednoduché počítadlo eventov.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. A/B konfigurácia na stránke A ───────────────────────────
alter table public.cb_pages add column if not exists ab_enabled boolean not null default false;
alter table public.cb_pages add column if not exists ab_variant text;            -- slug B stránky
alter table public.cb_pages add column if not exists ab_split   int  not null default 50; -- % návštev na variant A

-- ── 2. Eventy (view / convert) pre vyhodnotenie ────────────────
create table if not exists public.cb_ab_events (
  id         bigint generated always as identity primary key,
  page_id    text not null,                 -- stránka A (nositeľ testu)
  variant    text not null check (variant in ('a','b')),
  kind       text not null check (kind in ('view','convert')),
  created_at timestamptz not null default now()
);

create index if not exists cb_ab_events_page_idx
  on public.cb_ab_events (page_id, variant, kind);

alter table public.cb_ab_events enable row level security;

-- anon smie zapisovať eventy a čítať agregáty (bránené admin heslom na app úrovni)
drop policy if exists "cb_ab_events_anon_insert" on public.cb_ab_events;
drop policy if exists "cb_ab_events_anon_select" on public.cb_ab_events;
create policy "cb_ab_events_anon_insert" on public.cb_ab_events
  for insert to anon with check (true);
create policy "cb_ab_events_anon_select" on public.cb_ab_events
  for select to anon using (true);
