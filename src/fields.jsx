// Zdieľané custom fieldy pre Component Registry (MD §4)
export const colorField = (label) => ({
  type: "custom",
  label,
  render: ({ value, onChange }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)}
        style={{ width: 34, height: 28, padding: 0, border: "1px solid #ccc", borderRadius: 6, cursor: "pointer" }} />
      <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, fontSize: 13, padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }} />
    </div>
  ),
});

// Image field — URL alebo upload do Supabase Storage (Fáza 3) + živý náhľad
import { useRef, useState } from "react";
import { hasSupabase, uploadImage } from "./lib/supabase.js";

function ImageFieldUI({ value, onChange }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    setErr(""); setBusy(true);
    try { onChange(await uploadImage(file)); }
    catch (e) { setErr(String(e.message || e)); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <input type="text" value={value || ""} placeholder="https://… (URL obrázka)"
        onChange={(e) => onChange(e.target.value)}
        style={{ fontSize: 13, padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }} />
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files?.[0]); }}
      >
        {value ? (
          <img src={value} alt="" style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8,
            border: drag ? "2px dashed #4f46e5" : "1px solid #ddd", display: "block" }}
            onError={(e) => { e.target.style.opacity = 0.25; }} />
        ) : (
          <div style={{ height: 54, borderRadius: 8, border: drag ? "2px dashed #4f46e5" : "1px dashed #ccc",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 12 }}>
            {drag ? "pusti obrázok sem" : "bez obrázka"}
          </div>
        )}
      </div>
      {hasSupabase && (
        <>
          <button type="button" disabled={busy} onClick={() => fileRef.current?.click()}
            style={{ fontSize: 12, padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6,
              background: "#fafafa", cursor: busy ? "wait" : "pointer" }}>
            {busy ? "⏳ Nahrávam…" : "📤 Nahrať obrázok (alebo pretiahni na náhľad)"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
        </>
      )}
      {err && <div style={{ color: "#c00", fontSize: 11 }}>{err}</div>}
    </div>
  );
}

export const imageField = (label) => ({
  type: "custom",
  label,
  render: ({ value, onChange }) => <ImageFieldUI value={value} onChange={onChange} />,
});

export const idField = { type: "text", label: "ID sekcie (kotva pre menu)" };

// ── Code field (Fáza 4 — advanced code režim, MD §5) ────────────
// Odľahčený mono editor (Tab = 2 medzery). Upgrade cesta: Monaco/Sandpack
// je možné doplniť neskôr bez zmeny kontraktu — hodnota je stále string.
function CodeFieldUI({ value, onChange, lang, rows }) {
  const onKey = (e) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = e.target, s = el.selectionStart, en = el.selectionEnd;
    const next = (value || "").slice(0, s) + "  " + (value || "").slice(en);
    onChange(next);
    requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
  };
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} onKeyDown={onKey}
        spellCheck={false} rows={rows || 8}
        style={{ fontFamily: "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace", fontSize: 12.5,
          lineHeight: 1.5, padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6,
          background: "#0d0d0f", color: "#e8e8ea", whiteSpace: "pre", overflowX: "auto", tabSize: 2, resize: "vertical" }} />
      {lang && <span style={{ fontSize: 10.5, color: "#999", justifySelf: "end" }}>{lang} · Tab = odsadenie</span>}
    </div>
  );
}

export const codeField = (label, lang = "", rows = 8) => ({
  type: "custom",
  label,
  render: ({ value, onChange }) => <CodeFieldUI value={value} onChange={onChange} lang={lang} rows={rows} />,
});
