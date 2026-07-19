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
