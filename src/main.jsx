import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

// Lazy chunky — publikovaná stránka nikdy nesťahuje editor (Puck)
const Admin  = lazy(() => import("./Admin.jsx"));
const Editor = lazy(() => import("./Editor.jsx"));
const Viewer = lazy(() => import("./Viewer.jsx"));

// Routing cez query parametre (ako WebQuote):
//   /            → admin zoznam stránok
//   /?page=slug  → editor
//   /?view=slug  → publikovaný render
const q = new URLSearchParams(location.search);
const page = q.get("page");
const view = q.get("view");

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Suspense fallback={null}>
      {view ? <Viewer pageId={view} /> : page ? <Editor pageId={page} /> : <Admin />}
    </Suspense>
  </React.StrictMode>
);
