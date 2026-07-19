// ═══════════════════════════════════════════════════════════════
//  SSR render publikovanej stránky (Fáza 4)
//  GET /p/<slug>  (rewrite → /api/p?slug=<slug>)
//  Číta cb_pages cez Supabase REST a renderuje HTML cez api/_ssr.mjs
//  (bundle vzniká pri `npm run build` — scripts/build-ssr.mjs).
// ═══════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  const slug = String(req.query.slug || "").slice(0, 64);
  if (!slug) return res.status(400).send("Chýba slug");

  const base = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !key) return res.status(500).send("Chýba Supabase konfigurácia");

  try {
    const r = await fetch(
      base + "/rest/v1/cb_pages?id=eq." + encodeURIComponent(slug) + "&select=id,name,data,published",
      { headers: { apikey: key, authorization: "Bearer " + key } }
    );
    const rows = await r.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return res.status(404).send("Stránka neexistuje");
    if (!row.published) return res.status(404).send("Stránka nie je publikovaná");

    const { renderPage, CSS } = await import("./_ssr.mjs");
    const { html, title } = renderPage(row.data, { title: row.name });

    res.setHeader("content-type", "text/html; charset=utf-8");
    // CDN cache 60 s + SWR — ďalšie požiadavky idú z edge cache
    res.setHeader("cache-control", "public, s-maxage=60, stale-while-revalidate=300");
    return res.send(
`<!DOCTYPE html>
<html lang="sk">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
<style>${CSS}</style>
</head>
<body style="margin:0">${html}</body>
</html>`);
  } catch (e) {
    return res.status(500).send("SSR chyba: " + String(e?.message || e));
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
