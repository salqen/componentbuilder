// Produkčný render — ten istý JSON + registry ako editor (MD §2.1)
import { useEffect, useState } from "react";
import { Render } from "@puckeditor/core";
import { config } from "./puck.config.jsx";
import { loadPage, pickAbVariant, setActiveVariant, logAbEvent } from "./lib/supabase.js";
import { joinPage } from "./lib/realtime.js";
import { migratePageData } from "./lib/schema.js";
import "./app.css";

export default function Viewer({ pageId }) {
  const [row, setRow] = useState(undefined);   // stránka A (nositeľ testu / obsah)
  const [data, setData] = useState(undefined); // reálne renderované dáta (A alebo B)

  // 1) Načítaj stránku A + rozhodni A/B (Fáza 4)
  useEffect(() => {
    let live = true;
    (async () => {
      const a = await loadPage(pageId).catch(() => null);
      if (!live) return;
      setRow(a);
      if (!a) { setData(null); return; }

      const variant = pickAbVariant(a);           // 'a' | 'b' (sticky)
      setActiveVariant(pageId, variant);           // pre napojenie konverzií
      logAbEvent(pageId, variant, "view");         // meranie zobrazenia (tichý fail)

      if (variant === "b" && a.ab_variant) {
        const b = await loadPage(a.ab_variant).catch(() => null);
        if (!live) return;
        setData(b?.data || a.data);                // fallback na A, ak B chýba
      } else {
        setData(a.data);
      }
    })();
    return () => { live = false; };
  }, [pageId]);

  // 2) Realtime živý náhľad — mení variant A (editovaný v editore)
  useEffect(() => {
    const rt = joinPage(pageId, { onData: (d) => setData(d) });
    return () => rt.leave();
  }, [pageId]);

  useEffect(() => {
    const t = data?.root?.props?.title;
    if (t) document.title = t;
  }, [data]);

  if (row === undefined || data === undefined) return <div className="adm"><div className="adm-empty">Načítavam…</div></div>;
  if (!row || !data) return <div className="adm"><div className="adm-err">Stránka neexistuje.</div></div>;
  return <Render config={config} data={migratePageData(data, { title: row.name })} />;
}
