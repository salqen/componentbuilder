import { useEffect, useState } from "react";
import { hasSupabase, listPages, deletePage, slugify, supabase,
         listMessages, markMessageRead, deleteMessage,
         setAb, abStats, listUsers, upsertUser, deleteUser } from "./lib/supabase.js";
import { presets } from "./presets.js";
import { login, logout, getSession, can, ROLES } from "./lib/auth.js";
import "./app.css";

// ── Fáza 4: Správa používateľov a rolí (admin) ─────────────────
function UsersTab() {
  const [users, setUsers] = useState(null);
  const [form, setForm] = useState({ id: "", name: "", code: "", role: "editor" });
  const [err, setErr] = useState("");
  const load = () => listUsers().then(setUsers).catch((e) => setErr(String(e.message || e)));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setErr("");
    const id = form.id || slugify(form.name) + "-" + Math.random().toString(36).slice(2, 6);
    try {
      await upsertUser({ id, name: form.name.trim(), code: form.code, role: form.role, active: true });
      setForm({ id: "", name: "", code: "", role: "editor" });
      load();
    } catch (e2) { setErr(String(e2.message || e2)); }
  };

  return (
    <div className="pg-list" style={{ marginTop: 10 }}>
      <form className="adm-new" onSubmit={save}>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={form.id ? "Meno" : "Meno nového používateľa"} />
        <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder={form.id ? "Nový kód (prázdne = nemeniť)" : "Prihlasovací kód"} />
        <select className="adm-tpl" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {Object.entries(ROLES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <button className="btn btn-volt">{form.id ? "Uložiť" : "+ Pridať"}</button>
        {form.id && <button type="button" className="btn btn-ghost" onClick={() => setForm({ id: "", name: "", code: "", role: "editor" })}>Zrušiť</button>}
      </form>
      {err && <div className="adm-err">{err}</div>}
      <div className="ab-hint" style={{ margin: "2px 2px 10px" }}>
        Master admin sa prihlasuje heslom z <b>VITE_ADMIN_PASSWORD</b> (funguje vždy). Tu pridané roly rozširujú prístup pre tím. Kódy sa neukladajú do klienta.
      </div>
      {users === null && <div className="adm-empty">Načítavam…</div>}
      {users && users.length === 0 && <div className="adm-empty">Zatiaľ žiadni ďalší používatelia — pridaj prvého hore.</div>}
      {users && users.map((u) => (
        <div className="pg" key={u.id}>
          <div className="pg-info">
            <div className="pg-name">{u.name} <span className="pg-badge ab">{ROLES[u.role] || u.role}</span>{!u.active && <span className="pg-badge draft">neaktívny</span>}</div>
            <div className="pg-meta">{u.id} · {new Date(u.created_at).toLocaleString("sk")}</div>
          </div>
          <button className="btn btn-ghost" onClick={() => setForm({ id: u.id, name: u.name, code: "", role: u.role })}>✏️ Upraviť</button>
          <button className="btn btn-danger" title="Zmazať" onClick={async () => {
            if (!confirm("Zmazať používateľa „" + u.name + "“?")) return;
            await deleteUser(u.id); load();
          }}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ── Fáza 4: A/B panel pre jednu stránku (model „linked page") ──
function AbPanel({ page, pages, onSaved }) {
  const others = (pages || []).filter((x) => x.id !== page.id);
  const [enabled, setEnabled] = useState(!!page.ab_enabled);
  const [variant, setVariant] = useState(page.ab_variant || "");
  const [split, setSplit] = useState(page.ab_split ?? 50);
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => { abStats(page.id).then(setStats).catch(() => setStats(null)); }, [page.id]);

  const rate = (s) => (s && s.view ? Math.round((s.convert / s.view) * 100) : 0);
  const save = async () => {
    setMsg("Ukladám…");
    try { await setAb(page.id, { enabled, variant, split }); setMsg("✓ Uložené"); onSaved && onSaved(); }
    catch (e) { setMsg("✕ " + (e.message || e)); }
  };

  return (
    <div className="ab-panel">
      <div className="ab-row">
        <label className="ab-check">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Zapnúť A/B test
        </label>
        <label className="ab-field">Variant B (stránka):
          <select value={variant} onChange={(e) => setVariant(e.target.value)}>
            <option value="">— vyber stránku —</option>
            {others.map((o) => <option key={o.id} value={o.id}>{o.name || o.id}</option>)}
          </select>
        </label>
        <label className="ab-field">Split A: <b>{split}%</b> / B: {100 - split}%
          <input type="range" min="0" max="100" value={split} onChange={(e) => setSplit(Number(e.target.value))} />
        </label>
        <button className="btn btn-volt" style={{ padding: "8px 14px" }} onClick={save}>Uložiť A/B</button>
        {msg && <span className="ab-msg">{msg}</span>}
      </div>
      {!others.length && <div className="ab-hint">Najprv vytvor druhú stránku ako variant B (kľudne kópiu tejto).</div>}
      <div className="ab-stats">
        {stats ? (
          <>
            <div className="ab-stat"><span className="ab-tag ab-a">A</span> {stats.a.view} zobrazení · {stats.a.convert} konverzií · <b>{rate(stats.a)}%</b></div>
            <div className="ab-stat"><span className="ab-tag ab-b">B</span> {stats.b.view} zobrazení · {stats.b.convert} konverzií · <b>{rate(stats.b)}%</b></div>
          </>
        ) : <span className="ab-hint">Štatistiky sa načítajú po zapnutí testu a prvých návštevách.</span>}
      </div>
    </div>
  );
}

// ── Fáza 3: schránka správ z kontaktných formulárov ────────────
function Inbox({ pages }) {
  const [msgs, setMsgs] = useState(null);
  const pageName = (id) => pages?.find((p) => p.id === id)?.name || id || "—";
  useEffect(() => { listMessages().then(setMsgs).catch(() => setMsgs([])); }, []);
  return (
    <div className="pg-list" style={{ marginTop: 10 }}>
      {msgs === null && <div className="adm-empty">Načítavam správy…</div>}
      {msgs && msgs.length === 0 && <div className="adm-empty">Zatiaľ žiadne správy z formulárov.</div>}
      {msgs && msgs.map((m) => (
        <div className="pg" key={m.id} style={{ opacity: m.read ? 0.55 : 1, alignItems: "flex-start" }}>
          <div className="pg-info">
            <div className="pg-name">{m.name || "Bez mena"} · <a href={"mailto:" + m.email} style={{ color: "var(--volt-2)" }}>{m.email}</a></div>
            <div className="pg-meta">{pageName(m.page_id)} · {new Date(m.created_at).toLocaleString("sk")}</div>
            <div style={{ marginTop: 6, fontSize: 14, whiteSpace: "pre-wrap" }}>{m.message}</div>
          </div>
          <button className="btn btn-ghost" onClick={async () => {
            await markMessageRead(m.id, !m.read);
            setMsgs(msgs.map((x) => x.id === m.id ? { ...x, read: !m.read } : x));
          }}>{m.read ? "↩ Neprečítané" : "✓ Prečítané"}</button>
          <button className="btn btn-danger" title="Zmazať" onClick={async () => {
            if (!confirm("Zmazať správu?")) return;
            await deleteMessage(m.id); setMsgs(msgs.filter((x) => x.id !== m.id));
          }}>✕</button>
        </div>
      ))}
    </div>
  );
}

export default function Admin() {
  const [session, setSession] = useState(getSession());
  const [pages, setPages] = useState(null);
  const [name, setName] = useState("");
  const [tpl, setTpl] = useState("firma");
  const [err, setErr] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [tab, setTab] = useState("pages"); // pages | inbox | users
  const [abOpen, setAbOpen] = useState(null); // id stránky s otvoreným A/B panelom

  const role = session?.role;

  useEffect(() => {
    if (!session || !hasSupabase) return;
    listPages().then(setPages).catch((e) => setErr(String(e.message || e)));
  }, [session]);

  if (!hasSupabase) return (
    <div className="adm"><div className="adm-err">
      Chýba konfigurácia Supabase. Doplň <b>VITE_SUPABASE_URL</b> a <b>VITE_SUPABASE_ANON_KEY</b> do <b>.env</b> a spusti <b>supabase-setup.sql</b> (viď README).
    </div></div>
  );

  if (!session) return (
    <div className="gate">
      <form onSubmit={async (e) => { e.preventDefault(); setLoginErr("");
        const s = await login(new FormData(e.target).get("p"));
        if (s) setSession(s); else setLoginErr("Nesprávne heslo alebo kód.");
      }}>
        <div className="adm-brand"><div className="adm-mark">⬡</div><h1>Component <b>Builder</b></h1></div>
        <input className="adm-new-input" name="p" type="password" placeholder="Heslo alebo prihlasovací kód"
          style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", padding: "12px 15px" }} autoFocus />
        <button className="btn btn-volt">Vstúpiť</button>
        {loginErr && <div className="adm-err" style={{ marginTop: 10 }}>{loginErr}</div>}
      </form>
    </div>
  );

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const id = slugify(name) + "-" + Math.random().toString(36).slice(2, 7);
    try {
      const data = presets[tpl].build(name.trim());
      const { error } = await supabase.from("cb_pages")
        .insert({ id, name: name.trim(), data, published: false });
      if (error) throw error;
      location.href = "/?page=" + id;
    }
    catch (e2) { setErr(String(e2.message || e2)); }
  };

  return (
    <div className="adm">
      <div className="adm-topbar">
        <div className="adm-brand"><div className="adm-mark">⬡</div><h1>Component <b>Builder</b></h1></div>
        <div className="adm-user">
          <span className="pg-badge ab">{ROLES[role] || role}</span>
          <span className="adm-user__name">{session.name}</span>
          <button className="btn btn-ghost" style={{ padding: "6px 12px" }}
            onClick={() => { logout(); setSession(null); }}>Odhlásiť</button>
        </div>
      </div>
      <p className="adm-sub">Drag &amp; drop editor stránok — MediaVolt komponenty · Puck · Supabase</p>
      {err && <div className="adm-err">{err}</div>}
      <div style={{ display: "flex", gap: 8, margin: "14px 0 4px" }}>
        <button className={"btn " + (tab === "pages" ? "btn-volt" : "btn-ghost")} onClick={() => setTab("pages")}>📄 Stránky</button>
        {can(role, "messages") && <button className={"btn " + (tab === "inbox" ? "btn-volt" : "btn-ghost")} onClick={() => setTab("inbox")}>📬 Správy</button>}
        {can(role, "users") && <button className={"btn " + (tab === "users" ? "btn-volt" : "btn-ghost")} onClick={() => setTab("users")}>👤 Používatelia</button>}
      </div>
      {tab === "inbox" && can(role, "messages") && <Inbox pages={pages} />}
      {tab === "users" && can(role, "users") && <UsersTab />}
      {tab === "pages" && <>
      {can(role, "edit") ? (
        <>
        <form className="adm-new" onSubmit={create}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Názov novej stránky (napr. Kvetinárstvo Flora)" />
          <select className="adm-tpl" value={tpl} onChange={(e) => setTpl(e.target.value)}
            title={presets[tpl].desc}>
            {Object.entries(presets).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
          </select>
          <button className="btn btn-volt">+ Vytvoriť</button>
        </form>
        <p className="adm-tpl-desc">{presets[tpl].desc}</p>
        </>
      ) : (
        <p className="adm-tpl-desc">Prihlásený ako <b>{ROLES[role] || role}</b> — máš prístup na čítanie a náhľady.</p>
      )}
      <div className="pg-list">
        {pages === null && <div className="adm-empty">Načítavam…</div>}
        {pages && pages.length === 0 && <div className="adm-empty">Zatiaľ žiadne stránky{can(role, "edit") ? " — vytvor prvú hore." : "."}</div>}
        {pages && pages.map((p) => (
          <div key={p.id}>
            <div className="pg">
              <div className="pg-info">
                <div className="pg-name">{p.name || p.id}{p.ab_enabled && <span className="pg-badge ab" title="Beží A/B test">⚗️ A/B</span>}</div>
                <div className="pg-meta">{p.id} · {new Date(p.updated_at).toLocaleString("sk")}</div>
              </div>
              <span className={"pg-badge " + (p.published ? "pub" : "draft")}>{p.published ? "PUBLIKOVANÉ" : "DRAFT"}</span>
              {can(role, "edit") && <a className="btn btn-ghost" href={"/?page=" + p.id}>✏️ Editor</a>}
              {can(role, "edit") && <a className="btn btn-ghost" href={"/?builder=" + p.id} title="Vlastný MV Builder engine (rovnaký JSON)">🧱 Builder</a>}
              <a className="btn btn-ghost" href={"/?view=" + p.id} target="_blank" rel="noreferrer">👁 Náhľad</a>
              {p.published && <a className="btn btn-ghost" href={"/p/" + p.id} target="_blank" rel="noreferrer" title="Serverom renderovaná verzia (SEO, rýchly prvý paint)">⚡ SSR</a>}
              {can(role, "ab") && <button className={"btn " + (abOpen === p.id ? "btn-volt" : "btn-ghost")} title="A/B test"
                onClick={() => setAbOpen(abOpen === p.id ? null : p.id)}>⚗️ A/B</button>}
              {can(role, "delete") && <button className="btn btn-danger" title="Zmazať" onClick={async () => {
                if (!confirm("Zmazať „" + (p.name || p.id) + "“?")) return;
                await deletePage(p.id); setPages(pages.filter((x) => x.id !== p.id));
              }}>✕</button>}
            </div>
            {abOpen === p.id && can(role, "ab") && <AbPanel page={p} pages={pages}
              onSaved={() => listPages().then(setPages).catch(() => {})} />}
          </div>
        ))}
      </div>
      </>}
    </div>
  );
}
