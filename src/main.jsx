import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

// Lazy chunky — publikovaná stránka nikdy nesťahuje editor (Puck)
const Admin     = lazy(() => import("./Admin.jsx"));
const Editor    = lazy(() => import("./Editor.jsx"));
const Viewer    = lazy(() => import("./Viewer.jsx"));
const MVBuilder = lazy(() => import("./builder/MVBuilder.jsx"));

// Routing cez query parametre (ako WebQuote):
//   /               → admin zoznam stránok
//   /?page=slug     → editor (Puck)
//   /?builder=slug  → MV Builder (vlastný engine, rovnaký JSON kontrakt)
//   /?view=slug     → publikovaný render
const q = new URLSearchParams(location.search);
const page = q.get("page");
const view = q.get("view");
const builder = q.get("builder");

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Suspense fallback={null}>
      {view ? <Viewer pageId={view} />
        : builder ? <MVBuilder pageId={builder} />
        : page ? <Editor pageId={page} /> : <Admin />}
    </Suspense>
  </React.StrictMode>
);
