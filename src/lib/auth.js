// ═══════════════════════════════════════════════════════════════
//  Fáza 4 — Roly a práva (MD §7). App-level RBAC.
//  Konzistentné s existujúcim modelom: master admin cez
//  VITE_ADMIN_PASSWORD, ďalší používatelia cez cb_login RPC
//  (kódy nie sú v klientskom bundli). Nie je to hard bezpečnostná
//  hranica — rovnaký trust model ako doterajšia admin brána;
//  upgrade cesta: Supabase Auth + per-row RLS.
// ═══════════════════════════════════════════════════════════════
import { supabase, hasSupabase } from "./supabase.js";

export const ROLES = {
  admin:  "Administrátor",
  editor: "Editor",
  viewer: "Prehliadač",
};

// Matica práv: akcia → ktoré roly ju smú.
const MATRIX = {
  view:     ["admin", "editor", "viewer"], // vidieť zoznam / náhľady
  edit:     ["admin", "editor"],           // editor + ukladanie
  publish:  ["admin", "editor"],           // publikovanie
  ab:       ["admin", "editor"],           // A/B testy
  messages: ["admin", "editor"],           // schránka správ
  delete:   ["admin"],                     // mazanie stránok
  users:    ["admin"],                     // správa používateľov
};

export function can(role, action) {
  return !!role && (MATRIX[action] || []).includes(role);
}

// ── Session (sessionStorage) ────────────────────────────────────
const KEY = "cb_session";

export function getSession() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); }
  catch { return null; }
}
function setSession(s) {
  if (s) sessionStorage.setItem(KEY, JSON.stringify(s));
  else sessionStorage.removeItem(KEY);
}
export function logout() { setSession(null); }

const MASTER = import.meta.env.VITE_ADMIN_PASSWORD || "";

// Ak nie je nastavené heslo ani Supabase, dev režim = admin.
export function noAuthConfigured() { return !MASTER; }

/**
 * Prihlásenie kódom/heslom → session { name, role } alebo null.
 * 1) zhoda s master heslom → admin (bootstrap, funguje aj bez používateľov)
 * 2) inak cb_login RPC (SECURITY DEFINER) → { name, role }
 */
export async function login(code) {
  if (!MASTER && !hasSupabase) {
    const s = { name: "Admin", role: "admin" }; setSession(s); return s;
  }
  if (MASTER && code === MASTER) {
    const s = { name: "Admin", role: "admin" }; setSession(s); return s;
  }
  if (hasSupabase && code) {
    const { data, error } = await supabase.rpc("cb_login", { p_code: code });
    if (!error && data && data.length) {
      const u = data[0];
      const s = { name: u.name || "Používateľ", role: u.role };
      setSession(s); return s;
    }
  }
  return null;
}
