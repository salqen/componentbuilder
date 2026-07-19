// Produkčný render — ten istý JSON + registry ako editor (MD §2.1)
import { useEffect, useState } from "react";
import { Render } from "@puckeditor/core";
import { config } from "./puck.config.jsx";
import { loadPage } from "./lib/supabase.js";
import { migratePageData } from "./lib/schema.js";
import "./app.css";

export default function Viewer({ pageId }) {
  const [row, setRow] = useState(undefined);
  useEffect(() => { loadPage(pageId).then(setRow).catch(() => setRow(null)); }, [pageId]);

  useEffect(() => {
    if (row?.data?.root?.props?.title) document.title = row.data.root.props.title;
  }, [row]);

  if (row === undefined) return <div className="adm"><div className="adm-empty">Načítavam…</div></div>;
  if (!row || !row.data) return <div className="adm"><div className="adm-err">Stránka neexistuje.</div></div>;
  return <Render config={config} data={migratePageData(row.data, { title: row.name })} />;
}
