// Editor — Puck plátno + autosave (debounce 800 ms) + história verzií
import { useEffect, useRef, useState } from "react";
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { config } from "./puck.config.jsx";
import { loadPage, savePage, makeAutosaver, saveVersion, listVersions, loadVersion } from "./lib/supabase.js";
import { migratePageData } from "./lib/schema.js";
import "./app.css";

function VersionHistory({ pageId, onClose, onRestore }) {
  const [versions, setVersions] = useState(null);
  useEffect(() => { listVersions(pageId).then(setVersions).catch(() => setVersions([])); }, [pageId]);
  return (
    <div className="vh-pop">
      <h3>🕘 História verzií <button className="btn btn-danger" style={{ float: "right", padding: "0 6px" }} onClick={onClose}>✕</button></h3>
      {versions === null && <div className="vh-empty">Načítavam…</div>}
      {versions && versions.length === 0 && <div className="vh-empty">Zatiaľ žiadne verzie — vzniknú pri publikovaní alebo tlačidlom „Snapshot".</div>}
      {versions && versions.map((v) => (
        <div className="vh-item" key={v.id}>
          <div className="vh-meta">
            <div className="vh-date">{new Date(v.created_at).toLocaleString("sk")}</div>
            <div className="vh-label">{v.label || "—"}</div>
          </div>
          <button className="btn btn-ghost" style={{ padding: "6px 12px" }} onClick={async () => {
            if (!confirm("Obnoviť túto verziu? Aktuálny stav sa najprv uloží ako verzia.")) return;
            onRestore(v.id);
          }}>Obnoviť</button>
        </div>
      ))}
    </div>
  );
}

export default function Editor({ pageId }) {
  const [initial, setInitial] = useState(null);
  const [status, setStatus] = useState("saved");
  const [missing, setMissing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const saver = useRef(null);
  const latest = useRef(null);

  useEffect(() => {
    loadPage(pageId).then((row) => {
      if (!row) { setMissing(true); return; }
      const data = migratePageData(row.data, { title: row.name }); // validácia + migrácia schémy (Fáza 3)
      latest.current = data;
      setInitial(data);
      saver.current = makeAutosaver(pageId);
      saver.current.onStatus(setStatus);
    });
  }, [pageId]);

  // Ctrl/Cmd+S — okamžité uloženie
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (latest.current) saver.current?.flush(latest.current);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const restore = async (versionId) => {
    // aktuálny stav → verzia (aby sa nič nestratilo), potom obnov a reloadni
    await saveVersion(pageId, latest.current, "pred obnovením");
    const data = await loadVersion(versionId);
    await savePage(pageId, data);
    location.reload();
  };

  if (missing) return <div className="adm"><div className="adm-err">Stránka „{pageId}“ neexistuje. <a href="/" style={{ color: "var(--volt-2)" }}>← Späť na zoznam</a></div></div>;
  if (!initial) return <div className="adm"><div className="adm-empty">Načítavam editor…</div></div>;

  const statusLabel = { saving: "● Ukladám…", saved: "✓ Uložené", error: "✕ Chyba ukladania" }[status];

  return (
    <>
      <Puck
        config={config}
        data={initial}
        onChange={(data) => { latest.current = data; saver.current?.push(data); }}
        onPublish={async (data) => {
          await savePage(pageId, data, { publish: true });
          await saveVersion(pageId, data, "publish");
          setStatus("saved");
          window.open("/?view=" + pageId, "_blank");
        }}
        overrides={{
          headerActions: ({ children }) => (
            <>
              <span className={"save-badge " + status}>{statusLabel}</span>
              <a className="btn btn-ghost" href="/" style={{ padding: "8px 14px" }}>Zoznam</a>
              <button className="btn btn-ghost" style={{ padding: "8px 14px" }} onClick={async () => {
                await saveVersion(pageId, latest.current, "snapshot");
                setShowHistory(true);
              }}>📸 Snapshot</button>
              <button className="btn btn-ghost" style={{ padding: "8px 14px" }} onClick={() => setShowHistory((v) => !v)}>🕘 História</button>
              <a className="btn btn-ghost" href={"/?view=" + pageId} target="_blank" rel="noreferrer" style={{ padding: "8px 14px" }}>Náhľad</a>
              {children}
            </>
          ),
        }}
      />
      {showHistory && <VersionHistory pageId={pageId} onClose={() => setShowHistory(false)} onRestore={restore} />}
    </>
  );
}
