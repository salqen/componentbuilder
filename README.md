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
| `/?view=slug` | Publikovaný render — lazy chunk **bez** editora |

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
   (tabuľka `cb_pages`) a `supabase-versions.sql` (tabuľka `cb_page_versions`;
   nekolidujú s `wq_sessions`).
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
- [~] **Fáza 3** — verzovanie hotové (snapshot/publish → história → restore, drží 20 verzií);
  zostáva: asset upload cez Supabase Storage, SSR render
- [ ] **Fáza 4** — kolaborácia (Realtime broadcast ako WebQuote), AI generovanie sekcií

Poznámky:
- Undo/redo, iframe canvas, responsive prepínač a strom komponentov má Puck vstavané.
- Kontaktný formulár je zatiaľ `mailto:` fallback — produkčné odoslanie príde vo Fáze 3.
- Ďalšie komponenty z knižnice (100 ks) sa pridávajú do `puck.config.jsx` podľa
  mapovania v `COMPONENTS/WEBQUOTE-PROMPT-APPENDIX.md`.

---
*Powered by [MediaVolt](https://mediavolt.org)*
