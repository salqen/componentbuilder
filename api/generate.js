// ═══════════════════════════════════════════════════════════════
//  Fáza 4 — AI sekcie: Vercel serverless funkcia
//  POST /api/generate  { prompt, schema, mode }
//  → { content: [ { type, props }, ... ] }
//
//  Env (Vercel → Settings → Environment Variables):
//    ANTHROPIC_API_KEY   — kľúč z console.anthropic.com (server-only!)
//    ANTHROPIC_MODEL     — voliteľné, default claude-haiku-4-5-20251001
//    VITE_ADMIN_PASSWORD — už existuje; slúži ako ľahká brána endpointu
// ═══════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const gate = process.env.VITE_ADMIN_PASSWORD;
  if (!gate || req.headers["x-cb-key"] !== gate)
    return res.status(401).json({ error: "unauthorized" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Chýba ANTHROPIC_API_KEY v env" });

  const { prompt, schema, mode = "add" } = req.body || {};
  if (!prompt || !Array.isArray(schema))
    return res.status(400).json({ error: "Chýba prompt alebo schema" });

  const system = [
    "Si generátor sekcií pre web builder. Odpovedáš VÝHRADNE platným JSON poľom uzlov, bez markdownu a bez komentárov.",
    "Každý uzol má tvar {\"type\": \"...\", \"props\": {...}}. Povolené typy a ich props (s defaultmi ako vzor tvaru):",
    JSON.stringify(schema),
    "Pravidlá:",
    "- Používaj IBA uvedené typy a IBA uvedené props kľúče; hodnoty v rovnakom tvare ako defaulty (string/number/pole objektov...).",
    "- Texty píš v slovenčine, konkrétne pre zadanie používateľa (žiadne lorem ipsum).",
    "- Poradie sekcií nech dáva zmysel pre web (navigácia hore, footer dole, ak ich generuješ).",
    mode === "replace"
      ? "- Generuješ CELÚ stránku: začni Navbar, skonči Footer, 6–12 sekcií."
      : "- Generuješ len požadované sekcie (1–5), bez Navbar/Footer, pokiaľ ich používateľ výslovne nechce.",
    "- Emoji ikony používaj striedmo a k téme.",
    "- props.id vynechaj — doplní ho systém.",
  ].join("\n");

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 8000,
        system,
        messages: [{ role: "user", content: String(prompt).slice(0, 2000) }],
      }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: j?.error?.message || "AI request zlyhal" });

    let text = (j.content || []).map((b) => b.text || "").join("").trim();
    // odstráň prípadné ```json ploty a text okolo
    const m = text.match(/\[[\s\S]*\]/);
    if (!m) return res.status(502).json({ error: "AI nevrátila JSON pole" });
    let nodes;
    try { nodes = JSON.parse(m[0]); }
    catch { return res.status(502).json({ error: "Nepodarilo sa sparsovať JSON od AI" }); }
    if (!Array.isArray(nodes)) return res.status(502).json({ error: "Výstup nie je pole" });

    // základná sanitizácia tvaru (hĺbkovú robí klient cez schema migráciu)
    nodes = nodes
      .filter((n) => n && typeof n.type === "string")
      .map((n) => ({ type: n.type, props: (n.props && typeof n.props === "object") ? n.props : {} }))
      .slice(0, 20);

    return res.status(200).json({ content: nodes });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
