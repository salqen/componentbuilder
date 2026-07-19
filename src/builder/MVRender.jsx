// ═══════════════════════════════════════════════════════════════
//  MV Builder — RENDER VRSTVA (vrstva 2 z MD §2.1)
//  Číta JSON strom a renderuje cez zdieľaný Component Registry.
//  Nič z editor UI. Použiteľná v canvase editora aj v produkcii.
// ═══════════════════════════════════════════════════════════════

export function MVNode({ config, node }) {
  const def = config.components[node?.type];
  if (!def) return null; // neznámy typ — migrácia ho aj tak odfiltruje
  return def.render({ ...node.props });
}

import { Fragment } from "react";

export function MVRender({ config, data, wrapItem }) {
  const RootRender = config.root.render;
  const children = (data.content || []).map((node, i) => {
    const key = node.props?.id || i;
    const el = <MVNode config={config} node={node} />;
    return <Fragment key={key}>{wrapItem ? wrapItem(el, node, i) : el}</Fragment>;
  });
  return RootRender({ ...(data.root?.props || {}), children });
}
