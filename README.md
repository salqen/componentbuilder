# ⬡ Component Builder — by MediaVolt

Drag & drop editor stránok postavený podľa `komponentovy-editor-architektura.md`.
Netechnický používateľ skladá stránku ťahaním komponentov na plátno; editor
**negeneruje HTML** — produkuje **JSON strom**, ktorý je jediným kontraktom medzi
editorom a renderom (MD §2–3). Rovnaký JSON renderuje editor náhľad aj publikovanú stránku.

**Stack:** Vite + React + [Puck](https://puckeditor.com) (`@puckeditor/core`) + Supabase
— rovnaký ekosystém ako WebQuote (`zTOOLS/WEBQUOTE`): rovnaké env premenné,
debounce autosave 800 ms, anon-key + slug ochrana, deploy na Vercel/Cloudflare Pages.

## Ako to funguje

| URL | Obrazovka |
|---|---|
| `/` | Admin — zoznam stránok, vytváranie, mazanie (heslo `VITE_ADMIN_PASSWORD`) |
| `/?page=slug` | Editor (Puck) — autosave do Supabase, Ctrl/Cmd+S = okamžité uloženie |
| `/?builder=slug` | **MV Builder** — vlastný drag & drop engine (rovnaký JSON kontrakt ako Puck) |
| `/?view=slug` | Publikovaný render — lazy chunk **bez** editora |

## MV Builder (vlastný engine, `src/builder/`)

Samostatný editor na princípe Puck — tri oddelené vrstvy (MD §2.1), každá v
samostatnom module:

| Vrstva | Súbor | Obsah |
|---|---|---|
| Dátový model | `builder/model.js` | čisté operácie nad JSON stromom (insert/move/duplicate/update/remove) + undo/redo história s coalesce |
| Render | `builder/MVRender.jsx` | číta JSON, renderuje cez zdieľaný registry; nič z editor UI |
| Editor | `builder/MVBuilder.jsx` + `builder.css` | paleta (drag alebo dvojklik), vrstvy, canvas s drop indikátormi, auto-generovaný property panel z registry fieldov, viewport prepínač, klávesy (Ctrl+Z/Y/S, Delete), volt dizajn |

Obe rozhrania (Puck aj MV Builder) čítajú **ten istý** `puck.config.jsx` a ukladajú
**ten istý** JSON do `cb_pages` — stránku môžeš striedavo upravovať v oboch.

Tlačidlo **Publish** v editore uloží JSON, označí stránku `published` a otvorí náhľad.

## Component Registry (MD §4)

`src/puck.config.jsx` — jediný zdroj pravdy o komponentoch a ich fieldoch.
12 sekcií mapovaných na MediaVolt Component Library (čísla = zložky v `COMPONENTS/`):

Navbar (39) · Hero — aurora/mesh/spotlight (01/07/10), voliteľný bg obrázok · LogoMarquee (16) ·
BentoGrid (36) · Stats (26) · Pricing (30) · Testimonials (31) · FAQ (32) ·
Gallery (75) · TeamCards (35) · CTABanner (63) · ContactForm (49) · Footer (66) · TextBlock

Kľúčové texty (nadpisy, podnadpisy) majú **inline editáciu** — dvojklik priamo na plátne.
Pri vytváraní stránky v admine si vyberieš **šablónu** (`src/presets.js`):
Prázdna · Firemný web · Produktový landing · Portfólio.

Render vrstva je v `src/components/sections.jsx` — odľahčené self-contained verzie
efektov z knižnice. Design tokeny (`--primary`, `--accent`, `--bg`, `--surface`,
`--text`, `--muted`) sú rovnaké ako v `COMPONENTS/theme-bridge.css`; globálnu tému
nastavuje root komponentu v editore (farby stránky = props root uzla, MD §3).

## Setup

1. **Supabase** — v existujúcom WebQuote projekte spusti `supabase-setup.sql`
   (tabuľka `cb_pages`), `supabase-versions.sql` (tabuľka `cb_page_versions`)
   a `supabase-storage-messages.sql` (Storage bucket `cb-assets` + tabuľka
   `cb_messages`; nekolidujú s `wq_sessions`).
2. **.env** — skopíruj `.env.example` a doplň (rovnaké hodnoty ako WebQuote):
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_ADMIN_PASSWORD=silne-heslo
   ```
3. **Spustenie**
   ```
   npm install
   npm run dev        # http://localhost:3100
   npm run build      # produkčný build do dist/
   ```

## Nasadenie

Pripravené pre Vercel (`vercel.json`) aj Cloudflare Pages (`_redirects`).
Nastav tri `VITE_*` premenné v hostingu a redeployni.

## Stav voči fázam z MD

- [x] **Fáza 0** — skeleton, JSON schéma (Puck data model), registry overený
- [x] **Fáza 1 (MVP)** — drag & drop, 12 komponentov, auto-generovaný property panel, save/load
- [x] **Fáza 2** — šablóny stránok (presets), image field, inline text edit, 14 komponentov
- [x] **Fáza 3** — verzovanie (snapshot/publish → história → restore, drží 20 verzií),
  upload obrázkov do Supabase Storage (bucket `cb-assets`, tlačidlo/drag & drop v image
  fielde), kontaktný formulár ukladá do `cb_messages` (schránka 📬 v admine, `mailto:`
  fallback bez Supabase), validácia + migrácia JSON schémy pri načítaní (`src/lib/schema.js`)
- [~] **Fáza 4** — Realtime kolaborácia hotová (`src/lib/realtime.js`, broadcast kanál
  `cb-page-<id>` ako WebQuote): editory Puck ↔ MV Builder sa synchronizujú naživo,
  `?view=` funguje ako živý náhľad, presence badge 👥; **AI sekcie** hotové
  (✨ tlačidlo v MV Builderi → prompt → sekcie/celá stránka; serverless
  `api/generate.js`, vyžaduje `ANTHROPIC_API_KEY` vo Vercel env — server-only,
  nikdy nie `VITE_*`); zostáva: SSR render

Poznámky:
- Undo/redo, iframe canvas, responsive prepínač a strom komponentov má Puck vstavané.
- Ďalšie komponenty z knižnice (100 ks) sa pridávajú do `puck.config.jsx` podľa
  mapovania v `COMPONENTS/WEBQUOTE-PROMPT-APPENDIX.md`.

---
*Powered by [MediaVolt](https://mediavolt.org)*
