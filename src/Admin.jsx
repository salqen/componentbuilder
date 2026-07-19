import { useEffect, useState } from "react";
import { hasSupabase, listPages, deletePage, slugify, supabase } from "./lib/supabase.js";
import { presets } from "./presets.js";
import "./app.css";

const PASS = import.meta.env.VITE_ADMIN_PASSWORD || "";

export default function Admin() {
  const [ok, setOk] = useState(!PASS || sessionStorage.getItem("cb_admin") === "1");
  const [pages, setPages] = useState(null);
  const [name, setName] = useState("");
  const [tpl, setTpl] = useState("firma");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!ok || !hasSupabase) return;
    listPages().then(setPages).catch((e) => setErr(String(e.message || e)));
  }, [ok]);

  if (!hasSupabase) return (
    <div className="adm"><div className="adm-err">
      Chýba konfigurácia Supabase. Doplň <b>VITE_SUPABASE_URL</b> a <b>VITE_SUPABASE_ANON_KEY</b> do <b>.env</b> a spusti <b>supabase-setup.sql</b> (viď README).
    </div></div>
  );

  if (!ok) return (
    <div className="gate">
      <form onSubmit={(e) => { e.preventDefault();
        if (new FormData(e.target).get("p") === PASS) { sessionStorage.setItem("cb_admin", "1"); setOk(true); }
      }}>
        <div className="adm-brand"><div className="adm-mark">⬡</div><h1>Component <b>Builder</b></h1></div>
        <input className="adm-new-input" name="p" type="password" placeholder="Admin heslo"
          style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", padding: "12px 15px" }} autoFocus />
        <button className="btn btn-volt">Vstúpiť</button>
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
      <div className="adm-brand"><div className="adm-mark">⬡</div><h1>Component <b>Builder</b></h1></div>
      <p className="adm-sub">Drag &amp; drop editor stránok — MediaVolt komponenty · Puck · Supabase</p>
      {err && <div className="adm-err">{err}</div>}
      <form className="adm-new" onSubmit={create}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Názov novej stránky (napr. Kvetinárstvo Flora)" />
        <select className="adm-tpl" value={tpl} onChange={(e) => setTpl(e.target.value)}
          title={presets[tpl].desc}>
          {Object.entries(presets).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
        </select>
        <button className="btn btn-volt">+ Vytvoriť</button>
      </form>
      <p className="adm-tpl-desc">{presets[tpl].desc}</p>
      <div className="pg-list">
        {pages === null && <div className="adm-empty">Načítavam…</div>}
        {pages && pages.length === 0 && <div className="adm-empty">Zatiaľ žiadne stránky — vytvor prvú hore.</div>}
        {pages && pages.map((p) => (
          <div className="pg" key={p.id}>
            <div className="pg-info">
              <div className="pg-name">{p.name || p.id}</div>
              <div className="pg-meta">{p.id} · {new Date(p.updated_at).toLocaleString("sk")}</div>
            </div>
            <span className={"pg-badge " + (p.published ? "pub" : "draft")}>{p.published ? "PUBLIKOVANÉ" : "DRAFT"}</span>
            <a className="btn btn-ghost" href={"/?page=" + p.id}>✏️ Editor</a>
            <a className="btn btn-ghost" href={"/?view=" + p.id} target="_blank" rel="noreferrer">👁 Náhľad</a>
            <button className="btn btn-danger" title="Zmazať" onClick={async () => {
              if (!confirm("Zmazať „" + (p.name || p.id) + "“?")) return;
              await deletePage(p.id); setPages(pages.filter((x) => x.id !== p.id));
            }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
