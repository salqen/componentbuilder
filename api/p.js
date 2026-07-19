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
    const rest = (q) => fetch(base + "/rest/v1/cb_pages?" + q,
      { headers: { apikey: key, authorization: "Bearer " + key } }).then((x) => x.json());

    const rows = await rest("id=eq." + encodeURIComponent(slug) +
      "&select=id,name,data,published,ab_enabled,ab_variant,ab_split");
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return res.status(404).send("Stránka neexistuje");
    if (!row.published) return res.status(404).send("Stránka nie je publikovaná");

    // ── A/B (Fáza 4): sticky cez cookie; split = % návštev na variant A ──
    const abOn = row.ab_enabled && row.ab_variant;
    let variant = "a", renderData = row.data;
    if (abOn) {
      const cookies = String(req.headers.cookie || "");
      const m = cookies.match(new RegExp("cb_ab_" + slug.replace(/[^a-z0-9_-]/gi, "") + "=(a|b)"));
      const sp = Number(row.ab_split);
      const pctA = Number.isFinite(sp) ? sp : 50; // split 0 = 100 % B (0 je falsy)
      variant = m ? m[1] : (Math.random() * 100 < pctA ? "a" : "b");
      if (variant === "b") {
        const bRows = await rest("id=eq." + encodeURIComponent(row.ab_variant) + "&select=data,published");
        const b = Array.isArray(bRows) ? bRows[0] : null;
        if (b && b.published !== false && b.data) renderData = b.data;
        else variant = "a"; // B chýba/nepublikované → padni na A
      }
      // sticky cookie na 30 dní
      res.setHeader("set-cookie",
        "cb_ab_" + slug + "=" + variant + "; Path=/p/" + slug + "; Max-Age=2592000; SameSite=Lax");
      // fire-and-forget meranie zobrazenia
      fetch(base + "/rest/v1/cb_ab_events", {
        method: "POST",
        headers: { apikey: key, authorization: "Bearer " + key, "content-type": "application/json", prefer: "return=minimal" },
        body: JSON.stringify({ page_id: slug, variant, kind: "view" }),
      }).catch(() => {});
    }

    const { renderPage, CSS } = await import("./_ssr.mjs");
    const { html, title } = renderPage(renderData, { title: row.name });

    res.setHeader("content-type", "text/html; charset=utf-8");
    // Bez A/B: CDN cache 60 s + SWR. S A/B: nekešuj na CDN (variant je per-návštevník).
    res.setHeader("cache-control", abOn
      ? "private, no-store"
      : "public, s-maxage=60, stale-while-revalidate=300");
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
