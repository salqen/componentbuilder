-- Component Builder — kompletný Supabase setup (spusti raz v SQL Editore)

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

-- ═══════════════════════════════════════════════════════════════
--  Component Builder — Fáza 3: Storage (obrázky) + správy z formulára
--  Spusti raz v Supabase → SQL Editor → New query → Run
--  (po supabase-setup.sql a supabase-versions.sql)
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Storage bucket pre nahrané obrázky ──────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cb-assets', 'cb-assets', true, 5242880,  -- 5 MB limit
        array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml','image/avif'])
on conflict (id) do nothing;

-- Anon môže nahrávať a čítať (rovnaký model ako cb_pages — anon kľúč beží v prehliadači)
drop policy if exists "cb_assets_anon_select" on storage.objects;
drop policy if exists "cb_assets_anon_insert" on storage.objects;
drop policy if exists "cb_assets_anon_delete" on storage.objects;

create policy "cb_assets_anon_select" on storage.objects
  for select to anon using (bucket_id = 'cb-assets');
create policy "cb_assets_anon_insert" on storage.objects
  for insert to anon with check (bucket_id = 'cb-assets');
create policy "cb_assets_anon_delete" on storage.objects
  for delete to anon using (bucket_id = 'cb-assets');

-- ── 2. Správy z kontaktného formulára ──────────────────────────
create table if not exists public.cb_messages (
  id         bigint generated always as identity primary key,
  page_id    text,                                   -- slug stránky, z ktorej správa prišla
  name       text not null default '',
  email      text not null default '',
  message    text not null default '',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists cb_messages_page_idx
  on public.cb_messages (page_id, created_at desc);

alter table public.cb_messages enable row level security;

drop policy if exists "cb_messages_anon_insert" on public.cb_messages;
drop policy if exists "cb_messages_anon_select" on public.cb_messages;
drop policy if exists "cb_messages_anon_update" on public.cb_messages;
drop policy if exists "cb_messages_anon_delete" on public.cb_messages;

-- návštevník smie len vkladať; čítanie/mazanie robí admin (tiež anon kľúč — chráni admin heslo v UI)
create policy "cb_messages_anon_insert" on public.cb_messages
  for insert to anon with check (true);
create policy "cb_messages_anon_select" on public.cb_messages
  for select to anon using (true);
create policy "cb_messages_anon_update" on public.cb_messages
  for update to anon using (true) with check (true);
create policy "cb_messages_anon_delete" on public.cb_messages
  for delete to anon using (true);

-- Hotovo.
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
-- ═══════════════════════════════════════════════════════════════
--  Component Builder — Fáza 4: Roly a práva (MD §7)
--  App-level RBAC. Kódy sa NEexponujú anon SELECT-om — prihlásenie
--  aj správa idú cez SECURITY DEFINER RPC (kódy ostávajú na serveri).
--  Master admin funguje aj bez záznamov (VITE_ADMIN_PASSWORD v app).
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.cb_users (
  id         text primary key,
  name       text not null,
  code       text not null,                 -- prihlasovací kód (app-level tajomstvo)
  role       text not null default 'editor' check (role in ('admin','editor','viewer')),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS zapnutá, ŽIADNA anon policy → priamy prístup k tabuľke (a kódom) je zakázaný.
alter table public.cb_users enable row level security;

-- ── Prihlásenie: vráti len name+role pri zhode aktívneho kódu ────
create or replace function public.cb_login(p_code text)
returns table (name text, role text)
language sql security definer set search_path = public as $$
  select u.name, u.role from public.cb_users u
  where u.code = p_code and u.active = true
  limit 1;
$$;

-- ── Zoznam používateľov pre admin (BEZ kódov) ──────────────────
create or replace function public.cb_users_list()
returns table (id text, name text, role text, active boolean, created_at timestamptz)
language sql security definer set search_path = public as $$
  select u.id, u.name, u.role, u.active, u.created_at
  from public.cb_users u order by u.created_at desc;
$$;

-- ── Upsert používateľa (prázdny p_code = nemeniť existujúci kód) ─
create or replace function public.cb_user_upsert(p_id text, p_name text, p_code text, p_role text, p_active boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.cb_users (id, name, code, role, active)
  values (p_id, p_name, coalesce(nullif(p_code,''),'x'), p_role, coalesce(p_active,true))
  on conflict (id) do update set
    name = excluded.name,
    role = excluded.role,
    active = excluded.active,
    code = case when nullif(p_code,'') is null then public.cb_users.code else p_code end;
end;
$$;

-- ── Zmazanie používateľa ───────────────────────────────────────
create or replace function public.cb_user_delete(p_id text)
returns void
language sql security definer set search_path = public as $$
  delete from public.cb_users where id = p_id;
$$;

-- Sprístupni RPC anon roli (gating, KTO ich smie volať, je app-level).
grant execute on function public.cb_login(text)          to anon;
grant execute on function public.cb_users_list()          to anon;
grant execute on function public.cb_user_upsert(text,text,text,text,boolean) to anon;
grant execute on function public.cb_user_delete(text)     to anon;
