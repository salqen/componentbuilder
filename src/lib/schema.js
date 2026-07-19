// ═══════════════════════════════════════════════════════════════
//  Fáza 3 — validácia a migrácia JSON schémy stránky (MD §3, §8)
//  Staré stránky musia ostať funkčné aj po zmene komponentov.
// ═══════════════════════════════════════════════════════════════
import { config } from "../puck.config.jsx";

export const SCHEMA_VERSION = 1;

// Postupné migrácie: kľúč = verzia, z ktorej sa migruje na +1.
// Pri zmene schémy pridaj funkciu a zvýš SCHEMA_VERSION.
const MIGRATIONS = {
  // 1: (data) => { ...transformácia...; return data; },
};

/**
 * Zvaliduje a zmigruje dáta stránky pri načítaní (editor aj viewer):
 *  - doplní chýbajúcu kostru { content, root, zones }
 *  - odfiltruje uzly s neznámym typom (komponent bol odstránený z registry)
 *  - doplní defaultProps pre chýbajúce props (komponent pribral nové polia)
 *  - spustí verzijné migrácie po SCHEMA_VERSION
 */
export function migratePageData(raw, { title = "" } = {}) {
  let data = raw && typeof raw === "object" ? { ...raw } : {};
  data.content = Array.isArray(data.content) ? data.content : [];
  data.root = data.root && typeof data.root === "object" ? { ...data.root } : {};
  data.root.props = { ...(config.root?.defaultProps || {}), ...(data.root.props || {}) };
  if (!data.root.props.title && title) data.root.props.title = title;
  data.zones = data.zones && typeof data.zones === "object" ? data.zones : {};

  const fixNode = (node) => {
    if (!node || typeof node !== "object" || typeof node.type !== "string") return null;
    const def = config.components[node.type];
    if (!def) {
      console.warn("[schema] Neznámy komponent vynechaný:", node.type);
      return null;
    }
    return { ...node, props: { ...(def.defaultProps || {}), ...(node.props || {}) } };
  };
  data.content = data.content.map(fixNode).filter(Boolean);
  for (const z of Object.keys(data.zones)) {
    data.zones[z] = (Array.isArray(data.zones[z]) ? data.zones[z] : []).map(fixNode).filter(Boolean);
  }

  // verzijné migrácie
  let v = Number(data.root.props._schema) || SCHEMA_VERSION;
  while (v < SCHEMA_VERSION && MIGRATIONS[v]) { data = MIGRATIONS[v](data); v++; }
  data.root.props._schema = SCHEMA_VERSION;

  return data;
}
