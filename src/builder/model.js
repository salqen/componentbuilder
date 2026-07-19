// ═══════════════════════════════════════════════════════════════
//  MV Builder — DÁTOVÝ MODEL (vrstva 3 z MD §2.1)
//  Čisté funkcie nad JSON stromom stránky. Žiadne UI, žiadny render.
//  Rovnaký kontrakt ako Puck: { content: [...], root: {props}, zones: {} }
//  → stránky sú prenosné medzi Puck editorom a MV Builderom.
// ═══════════════════════════════════════════════════════════════

const uid = () => Math.random().toString(36).slice(2, 8);

// Nový uzol z registry defaultov
export function newNode(config, type) {
  const def = config.components[type];
  if (!def) throw new Error("Neznámy komponent: " + type);
  return { type, props: { ...(def.defaultProps || {}), id: type + "-" + uid() } };
}

// ── Operácie (všetky vracajú NOVÝ objekt dát — immutable) ──────
export const ops = {
  insert(data, node, index) {
    const content = [...data.content];
    content.splice(Math.max(0, Math.min(index, content.length)), 0, node);
    return { ...data, content };
  },
  remove(data, index) {
    const content = data.content.filter((_, i) => i !== index);
    return { ...data, content };
  },
  move(data, from, to) {
    if (from === to || from < 0 || from >= data.content.length) return data;
    const content = [...data.content];
    const [n] = content.splice(from, 1);
    content.splice(Math.max(0, Math.min(to, content.length)), 0, n);
    return { ...data, content };
  },
  duplicate(data, index) {
    const src = data.content[index];
    if (!src) return data;
    const copy = JSON.parse(JSON.stringify(src));
    copy.props.id = src.type + "-" + uid();
    return ops.insert(data, copy, index + 1);
  },
  updateItemProps(data, index, patch) {
    const content = data.content.map((n, i) =>
      i === index ? { ...n, props: { ...n.props, ...patch } } : n);
    return { ...data, content };
  },
  updateRootProps(data, patch) {
    return { ...data, root: { ...data.root, props: { ...(data.root?.props || {}), ...patch } } };
  },
};

// ── História (undo/redo) ───────────────────────────────────────
const MAX_HISTORY = 100;

export function createHistory(initial) {
  return { past: [], present: initial, future: [] };
}

// commit s coalesce: rýchle zmeny toho istého fieldu (písanie) sa zlúčia do 1 kroku
export function commit(h, next, { coalesce = false } = {}) {
  if (next === h.present) return h;
  if (coalesce && h.past.length) {
    return { ...h, present: next, future: [] }; // prepíš present bez nového kroku
  }
  const past = [...h.past, h.present].slice(-MAX_HISTORY);
  return { past, present: next, future: [] };
}

export function undo(h) {
  if (!h.past.length) return h;
  const past = [...h.past];
  const prev = past.pop();
  return { past, present: prev, future: [h.present, ...h.future] };
}

export function redo(h) {
  if (!h.future.length) return h;
  const [next, ...future] = h.future;
  return { past: [...h.past, h.present], present: next, future };
}
