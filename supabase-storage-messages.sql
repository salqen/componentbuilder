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
