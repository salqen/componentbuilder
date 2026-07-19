// ═══════════════════════════════════════════════════════════════
//  MV Builder — EDITOR VRSTVA (vrstva 1 z MD §2.1)
//  Vlastný drag & drop editor na princípe Puck: číta ten istý
//  Component Registry (puck.config.jsx) a ten istý JSON kontrakt.
//  Editor / render (MVRender) / model (model.js) držíme oddelene.
//  Dizajn: volt téma (app.css tokeny).
// ═══════════════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from "react";
import { config } from "../puck.config.jsx";
import { MVRender } from "./MVRender.jsx";
import { newNode, ops, createHistory, commit, undo, redo } from "./model.js";
import { loadPage, savePage, makeAutosaver, saveVersion } from "../lib/supabase.js";
import { migratePageData } from "../lib/schema.js";
import "../app.css";
import "./builder.css";

const DND_NEW = "application/x-mv-new";     // z palety
const DND_MOVE = "application/x-mv-move";   // presun v canvase

// ── Auto-generované fieldy z registry definícií (MD §4) ────────
function Field({ def, value, onChange }) {
  const t = def?.type;
  if (t === "text")
    return <input className="mvb-in" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  if (t === "textarea")
    return <textarea className="mvb-in" rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  if (t === "number")
    return <input className="mvb-in" type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />;
  if (t === "select")
    return (
      <select className="mvb-in" value={JSON.stringify(value)} onChange={(e) => onChange(JSON.parse(e.target.value))}>
        {(def.options || []).map((o) => <option key={o.label} value={JSON.stringify(o.value)}>{o.label}</option>)}
      </select>
    );
  if (t === "radio")
    return (
      <div className="mvb-radio">
        {(def.options || []).map((o) => (
          <label key={o.label} className={JSON.stringify(o.value) === JSON.stringify(value) ? "on" : ""}>
            <input type="radio" checked={JSON.stringify(o.value) === JSON.stringify(value)} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    );
  if (t === "custom" && def.render) return def.render({ value, onChange, field: def });
  if (t === "array") return <ArrayField def={def} value={value} onChange={onChange} />;
  return null;
}

function ArrayField({ def, value, onChange }) {
  const items = Array.isArray(value) ? value : [];
  const [open, setOpen] = useState(-1);
  const summary = (it, i) => (def.getItemSummary ? def.getItemSummary(it, i) : "Položka " + (i + 1));
  const set = (i, patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const move = (i, d) => {
    const j = i + d; if (j < 0 || j >= items.length) return;
    const a = [...items]; [a[i], a[j]] = [a[j], a[i]]; onChange(a); setOpen(j);
  };
  return (
    <div className="mvb-arr">
      {items.map((it, i) => (
        <div className="mvb-arr__item" key={i}>
          <div className="mvb-arr__head" onClick={() => setOpen(open === i ? -1 : i)}>
            <span className="mvb-arr__sum">{summary(it, i)}</span>
            <span className="mvb-arr__btns" onClick={(e) => e.stopPropagation()}>
              <button title="Hore" onClick={() => move(i, -1)}>↑</button>
              <button title="Dole" onClick={() => move(i, 1)}>↓</button>
              <button title="Zmazať" onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
            </span>
          </div>
          {open === i && (
            <div className="mvb-arr__body">
              {Object.entries(def.arrayFields || {}).map(([k, fd]) => (
                <div className="mvb-field" key={k}>
                  <label>{fd.label || k}</label>
                  <Field def={fd} value={it[k]} onChange={(v) => set(i, { [k]: v })} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <button className="mvb-arr__add" onClick={() => { onChange([...items, {}]); setOpen(items.length); }}>+ Pridať</button>
    </div>
  );
}

function FieldsPanel({ title, fields, values, onPatch }) {
  return (
    <>
      <div className="mvb-panel__title">{title}</div>
      {Object.entries(fields || {}).map(([k, fd]) => (
        <div className="mvb-field" key={k}>
          <label>{fd.label || k}</label>
          <Field def={fd} value={values?.[k]} onChange={(v) => onPatch({ [k]: v })} />
        </div>
      ))}
    </>
  );
}

// ── Editor ─────────────────────────────────────────────────────
const VIEWPORTS = { desktop: "100%", tablet: "768px", mobil: "390px" };

export default function MVBuilder({ pageId }) {
  const [hist, setHist] = useState(null);
  const [missing, setMissing] = useState(false);
  const [sel, setSel] = useState(null);        // index | "root" | null
  const [dropAt, setDropAt] = useState(null);  // insert indikátor
  const [vp, setVp] = useState("desktop");
  const [status, setStatus] = useState("saved");
  const saver = useRef(null);
  const histRef = useRef(null);
  histRef.current = hist;

  const data = hist?.present;

  useEffect(() => {
    loadPage(pageId).then((row) => {
      if (!row) { setMissing(true); return; }
      setHist(createHistory(migratePageData(row.data, { title: row.name })));
      saver.current = makeAutosaver(pageId);
      saver.current.onStatus(setStatus);
    });
  }, [pageId]);

  const lastCommit = useRef(0);
  const apply = (next, opts = {}) => {
    // coalesce: rýchle po sebe idúce zmeny (písanie do fieldu) = 1 undo krok
    const co = !!opts.coalesce && Date.now() - lastCommit.current < 900;
    lastCommit.current = Date.now();
    setHist((h) => {
      const nh = commit(h, next, { coalesce: co });
      saver.current?.push(nh.present);
      return nh;
    });
  };

  // Klávesy: undo/redo, save, delete
  useEffect(() => {
    const h = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z" && !e.shiftKey) { e.preventDefault(); setHist((x) => { const n = undo(x); saver.current?.push(n.present); return n; }); }
      else if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); setHist((x) => { const n = redo(x); saver.current?.push(n.present); return n; }); }
      else if (mod && e.key === "s") { e.preventDefault(); if (histRef.current) saver.current?.flush(histRef.current.present); }
      else if ((e.key === "Delete" || e.key === "Backspace") && typeof sel === "number" &&
               !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) {
        e.preventDefault(); apply(ops.remove(histRef.current.present, sel)); setSel(null);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [sel]);

  const categories = useMemo(() => {
    if (config.categories) return Object.values(config.categories).map((c) => ({ title: c.title, comps: c.components }));
    return [{ title: "Komponenty", comps: Object.keys(config.components) }];
  }, []);

  if (missing) return <div className="adm"><div className="adm-err">Stránka „{pageId}" neexistuje. <a href="/" style={{ color: "var(--volt-2)" }}>← Späť</a></div></div>;
  if (!data) return <div className="adm"><div className="adm-empty">Načítavam MV Builder…</div></div>;

  // drop pozícia podľa Y myši voči sekciám
  const calcDropIndex = (e, wrap) => {
    const secs = [...wrap.querySelectorAll(":scope > .mvb-sec")];
    for (let i = 0; i < secs.length; i++) {
      const r = secs[i].getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) return i;
    }
    return secs.length;
  };

  const onCanvasDrop = (e) => {
    e.preventDefault();
    const at = dropAt ?? data.content.length;
    const newType = e.dataTransfer.getData(DND_NEW);
    const moveFrom = e.dataTransfer.getData(DND_MOVE);
    if (newType) { apply(ops.insert(data, newNode(config, newType), at)); setSel(at); }
    else if (moveFrom !== "") {
      const from = Number(moveFrom);
      const to = at > from ? at - 1 : at;
      apply(ops.move(data, from, to)); setSel(to);
    }
    setDropAt(null);
  };

  const statusLabel = { saving: "● Ukladám…", saved: "✓ Uložené", error: "✕ Chyba" }[status];

  return (
    <div className="mvb">
      {/* ── Horná lišta ── */}
      <header className="mvb-top">
        <a className="mvb-logo" href="/">⬡ MV <b>Builder</b></a>
        <span className="mvb-page">{data.root?.props?.title || pageId}</span>
        <div className="mvb-top__mid">
          {Object.keys(VIEWPORTS).map((k) => (
            <button key={k} className={"mvb-vp" + (vp === k ? " on" : "")} onClick={() => setVp(k)}>
              {{ desktop: "🖥", tablet: "📱↔", mobil: "📱" }[k]}
            </button>
          ))}
        </div>
        <div className="mvb-top__right">
          <span className={"save-badge " + status}>{statusLabel}</span>
          <button className="btn btn-ghost mvb-sm" disabled={!hist.past.length}
            onClick={() => setHist((x) => { const n = undo(x); saver.current?.push(n.present); return n; })}>↶</button>
          <button className="btn btn-ghost mvb-sm" disabled={!hist.future.length}
            onClick={() => setHist((x) => { const n = redo(x); saver.current?.push(n.present); return n; })}>↷</button>
          <a className="btn btn-ghost mvb-sm" href={"/?view=" + pageId} target="_blank" rel="noreferrer">Náhľad</a>
          <button className="btn btn-volt mvb-sm" onClick={async () => {
            await savePage(pageId, data, { publish: true });
            await saveVersion(pageId, data, "publish (MV Builder)");
            window.open("/?view=" + pageId, "_blank");
          }}>Publikovať</button>
        </div>
      </header>

      <div className="mvb-body">
        {/* ── Ľavý panel: paleta + vrstvy ── */}
        <aside className="mvb-left">
          {categories.map((cat) => (
            <div key={cat.title}>
              <div className="mvb-panel__title">{cat.title}</div>
              <div className="mvb-pal">
                {cat.comps.map((t) => (
                  <div key={t} className="mvb-pal__item" draggable
                    onDragStart={(e) => { e.dataTransfer.setData(DND_NEW, t); e.dataTransfer.effectAllowed = "copy"; }}
                    onDragEnd={() => setDropAt(null)}
                    onDoubleClick={() => { apply(ops.insert(data, newNode(config, t), data.content.length)); setSel(data.content.length); }}
                    title="Potiahni na plátno (alebo dvojklik = pridať na koniec)">
                    ⠿ {config.components[t]?.label || t}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="mvb-panel__title">Vrstvy</div>
          <div className="mvb-layers">
            {data.content.length === 0 && <div className="mvb-dim">prázdna stránka</div>}
            {data.content.map((n, i) => (
              <div key={n.props?.id || i} className={"mvb-layer" + (sel === i ? " on" : "")} onClick={() => setSel(i)}>
                <span>{config.components[n.type]?.label || n.type}</span>
                <span className="mvb-layer__btns">
                  <button onClick={(e) => { e.stopPropagation(); apply(ops.move(data, i, i - 1)); setSel(Math.max(0, i - 1)); }}>↑</button>
                  <button onClick={(e) => { e.stopPropagation(); apply(ops.move(data, i, i + 1)); setSel(Math.min(data.content.length - 1, i + 1)); }}>↓</button>
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Canvas ── */}
        <main className="mvb-canvas" onClick={() => setSel("root")}>
          <div className="mvb-frame" style={{ width: VIEWPORTS[vp] }}
            onDragOver={(e) => { e.preventDefault(); setDropAt(calcDropIndex(e, e.currentTarget.querySelector(".mvb-frame__in"))); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDropAt(null); }}
            onDrop={onCanvasDrop}>
            <div className="mvb-frame__in">
              {data.content.length === 0 && dropAt === null && (
                <div className="mvb-empty">Potiahni sem komponent z ľavého panela</div>
              )}
              <MVRender config={config} data={data} wrapItem={(el, node, i) => (
                <div className={"mvb-sec" + (sel === i ? " on" : "") + (dropAt === i ? " drop-before" : "")}>
                  <div className="mvb-sec__overlay" onClick={(e) => { e.stopPropagation(); setSel(i); }} />
                  <div className="mvb-sec__bar" onClick={(e) => e.stopPropagation()}>
                    <span className="mvb-sec__drag" draggable title="Presunúť"
                      onDragStart={(e) => { e.dataTransfer.setData(DND_MOVE, String(i)); e.dataTransfer.effectAllowed = "move"; }}
                      onDragEnd={() => setDropAt(null)}>⠿</span>
                    <span className="mvb-sec__name">{config.components[node.type]?.label || node.type}</span>
                    <button title="Duplikovať" onClick={() => { apply(ops.duplicate(data, i)); setSel(i + 1); }}>⧉</button>
                    <button title="Zmazať" onClick={() => { apply(ops.remove(data, i)); setSel(null); }}>✕</button>
                  </div>
                  {el}
                </div>
              )} />
              {dropAt === data.content.length && <div className="mvb-dropline" />}
            </div>
          </div>
        </main>

        {/* ── Pravý panel: vlastnosti ── */}
        <aside className="mvb-right" onClick={(e) => e.stopPropagation()}>
          {typeof sel === "number" && data.content[sel] ? (
            <FieldsPanel
              title={config.components[data.content[sel].type]?.label || data.content[sel].type}
              fields={config.components[data.content[sel].type]?.fields}
              values={data.content[sel].props}
              onPatch={(patch) => apply(ops.updateItemProps(data, sel, patch), { coalesce: true })}
            />
          ) : (
            <FieldsPanel
              title="Stránka a téma"
              fields={config.root.fields}
              values={data.root?.props}
              onPatch={(patch) => apply(ops.updateRootProps(data, patch), { coalesce: true })}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
