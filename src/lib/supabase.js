// ═══════════════════════════════════════════════════════════════
//  Supabase vrstva — rovnaký pattern ako WebQuote (wq_sessions)
//  Tabuľka: cb_pages  (viď supabase-setup.sql)
// ═══════════════════════════════════════════════════════════════
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || "";
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const hasSupabase = !!(SUPABASE_URL && SUPABASE_ANON);
export const supabase = hasSupabase ? createClient(SUPABASE_URL, SUPABASE_ANON) : null;

export async function listPages() {
  const { data, error } = await supabase
    .from("cb_pages")
    .select("id,name,updated_at,published,ab_enabled,ab_variant,ab_split")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function loadPage(id) {
  const { data, error } = await supabase
    .from("cb_pages").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data; // null ak neexistuje
}

export async function createPage(id, name) {
  const empty = { content: [], root: { props: { title: name } }, zones: {} };
  const { error } = await supabase
    .from("cb_pages")
    .insert({ id, name, data: empty, published: false });
  if (error) throw error;
  return empty;
}

export async function savePage(id, data, { publish } = {}) {
  const patch = { data, updated_at: new Date().toISOString() };
  if (publish !== undefined) patch.published = publish;
  const { error } = await supabase.from("cb_pages").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deletePage(id) {
  const { error } = await supabase.from("cb_pages").delete().eq("id", id);
  if (error) throw error;
}

// Debounce autosave (800 ms — ako WebQuote)
export function makeAutosaver(id, delay = 800) {
  let t = null;
  const status = { cb: null }; // "saving" | "saved" | "error"
  const fire = (s) => status.cb && status.cb(s);
  return {
    onStatus(cb) { status.cb = cb; },
    push(data) {
      fire("saving");
      clearTimeout(t);
      t = setTimeout(async () => {
        try { await savePage(id, data); fire("saved"); }
        catch (e) { console.error(e); fire("error"); }
      }, delay);
    },
    async flush(data) {
      clearTimeout(t);
      try { await savePage(id, data); fire("saved"); }
      catch (e) { console.error(e); fire("error"); }
    },
  };
}

export function slugify(s) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 48) || "stranka";
}

// ── Verzovanie (Fáza 3 z MD — história save-ov) ─────────────────
const KEEP_VERSIONS = 20;

export async function saveVersion(pageId, data, label = "") {
  const { error } = await supabase.from("cb_page_versions")
    .insert({ page_id: pageId, data, label });
  if (error) throw error;
  // udrž len posledných KEEP_VERSIONS
  const { data: rows } = await supabase.from("cb_page_versions")
    .select("id").eq("page_id", pageId).order("created_at", { ascending: false });
  if (rows && rows.length > KEEP_VERSIONS) {
    const old = rows.slice(KEEP_VERSIONS).map((r) => r.id);
    await supabase.from("cb_page_versions").delete().in("id", old);
  }
}

export async function listVersions(pageId) {
  const { data, error } = await supabase.from("cb_page_versions")
    .select("id,label,created_at").eq("page_id", pageId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function loadVersion(versionId) {
  const { data, error } = await supabase.from("cb_page_versions")
    .select("data").eq("id", versionId).single();
  if (error) throw error;
  return data.data;
}

// ── Fáza 3: Supabase Storage — upload obrázkov (bucket cb-assets) ──
const BUCKET = "cb-assets";
const MAX_UPLOAD = 5 * 1024 * 1024; // musí sedieť s limitom bucketu (SQL)

export async function uploadImage(file) {
  if (!hasSupabase) throw new Error("Supabase nie je nakonfigurované");
  if (!file.type.startsWith("image/")) throw new Error("Súbor nie je obrázok");
  if (file.size > MAX_UPLOAD) throw new Error("Obrázok je väčší než 5 MB");
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = new Date().toISOString().slice(0, 10) + "/" +
    Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36) + "." + ext;
  const { error } = await supabase.storage.from(BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ── Fáza 3: správy z kontaktného formulára (cb_messages) ───────────
export async function submitMessage({ pageId, name, email, message }) {
  const { error } = await supabase.from("cb_messages")
    .insert({ page_id: pageId || null, name, email, message });
  if (error) throw error;
}

export async function listMessages() {
  const { data, error } = await supabase.from("cb_messages")
    .select("*").order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return data;
}

export async function markMessageRead(id, read = true) {
  const { error } = await supabase.from("cb_messages").update({ read }).eq("id", id);
  if (error) throw error;
}

export async function deleteMessage(id) {
  const { error } = await supabase.from("cb_messages").delete().eq("id", id);
  if (error) throw error;
}

// ── Fáza 4: A/B varianty (model „linked page") ─────────────────
//  Stránka A drží konfiguráciu; variant B je samostatná cb_pages stránka.
export async function setAb(id, { enabled, variant, split }) {
  const patch = {};
  if (enabled !== undefined) patch.ab_enabled = !!enabled;
  if (variant !== undefined) patch.ab_variant = variant || null;
  if (split !== undefined) patch.ab_split = Math.max(0, Math.min(100, Number(split) || 0));
  const { error } = await supabase.from("cb_pages").update(patch).eq("id", id);
  if (error) throw error;
}

// Sticky výber variantu pre návštevníka (localStorage), split = % na A.
export function pickAbVariant(row) {
  if (!row || !row.ab_enabled || !row.ab_variant) return "a";
  if (typeof window === "undefined") return "a";
  const key = "cb_ab_" + row.id;
  let v = localStorage.getItem(key);
  if (v !== "a" && v !== "b") {
    const sp = Number(row.ab_split);
    const pctA = Number.isFinite(sp) ? sp : 50; // pozor: split 0 = 100 % B (0 je falsy!)
    v = Math.random() * 100 < pctA ? "a" : "b";
    try { localStorage.setItem(key, v); } catch {}
  }
  return v;
}

// Aktívny variant zobrazenej stránky — na napojenie konverzií (formuláre).
export function setActiveVariant(pageId, variant) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem("cb_ab_active_" + pageId, variant); } catch {}
}
export function getActiveVariant(pageId) {
  if (typeof window === "undefined") return "a";
  return localStorage.getItem("cb_ab_active_" + pageId) || "a";
}

export async function logAbEvent(pageId, variant, kind) {
  if (!hasSupabase || !pageId) return;
  try {
    await supabase.from("cb_ab_events").insert({ page_id: pageId, variant, kind });
  } catch (e) { /* tichý fail — meranie nesmie rozbiť stránku */ }
}

// ── Fáza 4: Roly a práva — správa používateľov cez RPC ─────────
export async function listUsers() {
  const { data, error } = await supabase.rpc("cb_users_list");
  if (error) throw error;
  return data || [];
}
export async function upsertUser({ id, name, code, role, active }) {
  const { error } = await supabase.rpc("cb_user_upsert", {
    p_id: id, p_name: name, p_code: code || "", p_role: role, p_active: active !== false,
  });
  if (error) throw error;
}
export async function deleteUser(id) {
  const { error } = await supabase.rpc("cb_user_delete", { p_id: id });
  if (error) throw error;
}

// Agregované počty pre admin panel: { a:{view,convert}, b:{view,convert} }.
export async function abStats(pageId) {
  const out = { a: { view: 0, convert: 0 }, b: { view: 0, convert: 0 } };
  const { data, error } = await supabase.from("cb_ab_events")
    .select("variant,kind").eq("page_id", pageId).limit(10000);
  if (error) throw error;
  for (const r of data || []) {
    if (out[r.variant] && r.kind in out[r.variant]) out[r.variant][r.kind]++;
  }
  return out;
}
