// Bunduje SSR render do api/_ssr.mjs (súčasť `npm run build`).
// esbuild je k dispozícii ako dependencia Vite.
import esbuild from "esbuild";
import { appendFileSync } from "node:fs";

// 1) JS: registry + render vrstva → jeden Node ESM súbor (React vrátane)
await esbuild.build({
  entryPoints: ["ssr/entry.jsx"],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node18",
  outfile: "api/_ssr.mjs",
  jsx: "automatic",
  loader: { ".css": "empty" }, // CSS importy v komponentoch server nepotrebuje
  // CJS balíky (react-dom/server) volajú require("stream") — shim pre ESM výstup
  banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": '""',
    "import.meta.env.VITE_SUPABASE_ANON_KEY": '""',
    "import.meta.env.VITE_ADMIN_PASSWORD": '""',
  },
  minify: true,
});

// 2) CSS: tokeny + sekcie → string export v tom istom súbore
const css = await esbuild.build({
  entryPoints: ["ssr/styles.css"],
  bundle: true,
  write: false,
  minify: true,
});
appendFileSync("api/_ssr.mjs",
  "\nexport const CSS = " + JSON.stringify(css.outputFiles[0].text) + ";\n");

console.log("✓ SSR bundle: api/_ssr.mjs");
