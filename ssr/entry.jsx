// ═══════════════════════════════════════════════════════════════
//  SSR entry (Fáza 4) — server render toho istého JSON kontraktu
//  cez MV render vrstvu a zdieľaný registry. Bunduje sa skriptom
//  scripts/build-ssr.mjs do api/_ssr.mjs (spúšťa `npm run build`).
// ═══════════════════════════════════════════════════════════════
import { renderToString } from "react-dom/server";
import { config } from "../src/puck.config.jsx";
import { migratePageData } from "../src/lib/schema.js";
import { MVRender } from "../src/builder/MVRender.jsx";

export function renderPage(rawData, { title = "" } = {}) {
  const data = migratePageData(rawData, { title });
  const html = renderToString(<MVRender config={config} data={data} />);
  return { html, title: data.root?.props?.title || title || "Stránka" };
}
