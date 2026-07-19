// ═══════════════════════════════════════════════════════════════
//  Fáza 4 — AI sekcie: klientská vrstva
//  Schéma sa buduje z registry (jediný zdroj pravdy) a posiela sa
//  na /api/generate — server drží ANTHROPIC_API_KEY.
// ═══════════════════════════════════════════════════════════════
import { config } from "../puck.config.jsx";

// Kompaktná JSON-safe schéma pre AI: typ + label + tvar props (z defaultov)
// + povolené hodnoty select/radio fieldov.
export function buildSchema() {
  return Object.entries(config.components).map(([type, def]) => {
    const options = {};
    for (const [k, f] of Object.entries(def.fields || {})) {
      if ((f.type === "select" || f.type === "radio") && f.options)
        options[k] = f.options.map((o) => o.value);
    }
    return {
      type,
      label: def.label || type,
      props: def.defaultProps || {},
      ...(Object.keys(options).length ? { allowed: options } : {}),
    };
  });
}

export async function generateSections(prompt, mode = "add") {
  const r = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-cb-key": import.meta.env.VITE_ADMIN_PASSWORD || "",
    },
    body: JSON.stringify({ prompt, mode, schema: buildSchema() }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Generovanie zlyhalo (" + r.status + ")");
  return j.content || [];
}
