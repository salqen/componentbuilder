// ═══════════════════════════════════════════════════════════════
//  Component Registry — jediný zdroj pravdy (MD §4).
//  Používa ho editor (property panel) aj runtime render (<Render/>).
// ═══════════════════════════════════════════════════════════════
import {
  Navbar, Hero, LogoMarquee, BentoGrid, Stats, Pricing,
  Testimonials, FAQ, CTABanner, ContactForm, Footer, TextBlock, Gallery, TeamCards,
  AnnouncementBar, FeatureTabs, Timeline, Steps, PortfolioGrid, BeforeAfter,
  LogoCloud, ComparisonTable, Newsletter, Embed, CodeBlock,
} from "./components/sections.jsx";
import "./theme.css";

import { colorField, imageField, idField, codeField } from "./fields.jsx";

export const config = {
  categories: {
    zaklad: { title: "Základ", components: ["AnnouncementBar", "Navbar", "Hero", "Footer"] },
    sekcie: { title: "Sekcie", components: ["BentoGrid", "FeatureTabs", "Stats", "Steps", "Timeline", "Pricing", "ComparisonTable", "Testimonials", "FAQ", "Gallery", "PortfolioGrid", "BeforeAfter", "TeamCards", "TextBlock"] },
    konverzie: { title: "Konverzie", components: ["CTABanner", "ContactForm", "Newsletter", "LogoMarquee", "LogoCloud"] },
    pokrocile: { title: "Pokročilé (code)", components: ["Embed", "CodeBlock"] },
  },

  root: {
    fields: {
      title:   { type: "text", label: "Názov stránky" },
      primary: colorField("Primárna farba"),
      accent:  colorField("Akcent"),
      bg:      colorField("Pozadie"),
      surface: colorField("Karty / povrch"),
      text:    colorField("Text"),
      muted:   colorField("Tlmený text"),
      // Fáza 4 — advanced code režim: vlastné CSS pre celú stránku.
      // Cieli sa cez #id-sekcie (kotva) → override ktoréhokoľvek komponentu.
      customCss: codeField("Vlastné CSS (advanced — cieľ cez #id-sekcie)", "CSS", 10),
    },
    defaultProps: {
      title: "Nová stránka",
      primary: "#ff6a00", accent: "#ff9540", bg: "#0a0604",
      surface: "#160d08", text: "#f4ece6", muted: "#8f8378",
      customCss: "",
    },
    render: ({ children, primary, accent, bg, surface, text, muted, customCss }) => (
      <div className="mv-page" style={{
        "--primary": primary, "--accent": accent, "--bg": bg,
        "--surface": surface, "--text": text, "--muted": muted,
      }}>
        {customCss ? <style dangerouslySetInnerHTML={{ __html: customCss }} /> : null}
        {children}
      </div>
    ),
  },

  components: {
    Navbar: {
      label: "Navigácia",
      fields: {
        logoText:   { type: "text", label: "Logo — text" },
        logoAccent: { type: "text", label: "Logo — zvýraznená časť" },
        links: {
          type: "array", label: "Odkazy",
          arrayFields: { label: { type: "text" }, href: { type: "text" } },
          getItemSummary: (it) => it.label || "Odkaz",
        },
        ctaLabel: { type: "text", label: "CTA tlačidlo" },
        ctaHref:  { type: "text", label: "CTA odkaz" },
      },
      defaultProps: {
        logoText: "Media", logoAccent: "Volt",
        links: [
          { label: "Služby", href: "#sluzby" },
          { label: "Cenník", href: "#cennik" },
          { label: "Referencie", href: "#referencie" },
          { label: "Kontakt", href: "#kontakt" },
        ],
        ctaLabel: "Začať projekt", ctaHref: "#kontakt",
      },
      render: (p) => <Navbar {...p} />,
    },

    Hero: {
      label: "Hero sekcia",
      fields: {
        variant: { type: "select", label: "Štýl pozadia", options: [
          { label: "Aurora (01-hero-aurora)", value: "aurora" },
          { label: "Mesh gradient (07-mesh-gradient)", value: "mesh" },
          { label: "Spotlight + grid (10-spotlight-hero)", value: "spotlight" },
        ]},
        bgImage: imageField("Obrázok pozadia (voliteľný)"),
        kicker:        { type: "text", label: "Kicker (badge nad nadpisom)" },
        heading:       { type: "text", label: "Nadpis", contentEditable: true },
        headingAccent: { type: "text", label: "Nadpis — gradientová časť", contentEditable: true },
        subheading:    { type: "textarea", label: "Podnadpis", contentEditable: true },
        align: { type: "radio", label: "Zarovnanie", options: [
          { label: "Vľavo", value: "left" }, { label: "Na stred", value: "center" },
        ]},
        primaryLabel: { type: "text", label: "Hlavné tlačidlo" },
        primaryHref:  { type: "text", label: "Hlavné tlačidlo — odkaz" },
        ghostLabel:   { type: "text", label: "Sekundárne tlačidlo" },
        ghostHref:    { type: "text", label: "Sekundárne — odkaz" },
      },
      defaultProps: {
        variant: "aurora", bgImage: "", kicker: "⚡ Nové v 2026",
        heading: "Weby, ktoré", headingAccent: "predávajú",
        subheading: "Moderný web s animáciami a čistým dizajnom — postavený z overených komponentov MediaVolt.",
        align: "center",
        primaryLabel: "Chcem ponuku", primaryHref: "#kontakt",
        ghostLabel: "Pozrieť práce", ghostHref: "#referencie",
      },
      render: (p) => <Hero {...p} />,
    },

    LogoMarquee: {
      label: "Logo marquee (16)",
      fields: {
        items: { type: "array", label: "Položky",
          arrayFields: { label: { type: "text" } },
          getItemSummary: (it) => it.label || "Logo" },
        duration: { type: "number", label: "Trvanie slučky (s)" },
      },
      defaultProps: {
        items: [{ label: "ACME" }, { label: "Nordix" }, { label: "Kvant" }, { label: "Helios" }, { label: "Brixel" }, { label: "Datura" }],
        duration: 28,
      },
      render: (p) => <LogoMarquee {...p} />,
    },

    BentoGrid: {
      label: "Bento grid (36)",
      fields: {
        sectionId: idField,
        heading:    { type: "text", label: "Nadpis", contentEditable: true },
        subheading: { type: "textarea", label: "Popis", contentEditable: true },
        columns: { type: "select", label: "Stĺpce", options: [
          { label: "2", value: 2 }, { label: "3", value: 3 }, { label: "4", value: 4 },
        ]},
        items: { type: "array", label: "Karty",
          arrayFields: {
            icon:  { type: "text", label: "Ikona (emoji)" },
            title: { type: "text", label: "Titulok" },
            desc:  { type: "textarea", label: "Popis" },
          },
          getItemSummary: (it) => it.title || "Karta" },
      },
      defaultProps: {
        sectionId: "sluzby", heading: "Čo robíme", subheading: "Kompletné riešenia od návrhu po spustenie.",
        columns: 3,
        items: [
          { icon: "🎨", title: "Web dizajn", desc: "Moderné UI podľa trendov 2026 — dark mode, glassmorphism, mikrointerakcie." },
          { icon: "⚡", title: "Vývoj", desc: "Rýchle weby bez zbytočností. React, Vite, statický export." },
          { icon: "📈", title: "SEO & výkon", desc: "Core Web Vitals v zelenom, štruktúrované dáta, analytika." },
        ],
      },
      render: (p) => <BentoGrid {...p} />,
    },

    Stats: {
      label: "Štatistiky (26-counter-up)",
      fields: {
        sectionId: idField,
        heading:    { type: "text", label: "Nadpis", contentEditable: true },
        subheading: { type: "textarea", label: "Popis", contentEditable: true },
        items: { type: "array", label: "Čísla",
          arrayFields: {
            value:  { type: "number", label: "Hodnota" },
            suffix: { type: "text", label: "Prípona (+, %, ×…)" },
            label:  { type: "text", label: "Popisok" },
          },
          getItemSummary: (it) => (it.label || "Číslo") },
      },
      defaultProps: {
        sectionId: "", heading: "", subheading: "",
        items: [
          { value: 120, suffix: "+", label: "Projektov" },
          { value: 98, suffix: "%", label: "Spokojnosť klientov" },
          { value: 6, suffix: "×", label: "Rýchlejší vývoj" },
        ],
      },
      render: (p) => <Stats {...p} />,
    },

    Pricing: {
      label: "Cenník (30)",
      fields: {
        sectionId: idField,
        heading:    { type: "text", label: "Nadpis", contentEditable: true },
        subheading: { type: "textarea", label: "Popis", contentEditable: true },
        plans: { type: "array", label: "Balíky",
          arrayFields: {
            name:        { type: "text", label: "Názov" },
            price:       { type: "text", label: "Cena (napr. 490 €)" },
            period:      { type: "text", label: "Obdobie (jednorazovo / mesačne)" },
            features:    { type: "textarea", label: "Funkcie (1 na riadok)" },
            highlighted: { type: "radio", label: "Zvýrazniť", options: [
              { label: "Áno", value: true }, { label: "Nie", value: false },
            ]},
            ctaLabel: { type: "text", label: "Tlačidlo" },
            ctaHref:  { type: "text", label: "Odkaz" },
          },
          getItemSummary: (it) => it.name || "Balík" },
      },
      defaultProps: {
        sectionId: "cennik", heading: "Cenník", subheading: "Transparentné ceny bez prekvapení.",
        plans: [
          { name: "Štart", price: "490 €", period: "jednorazovo", features: "One-page web\nResponzívny dizajn\nKontaktný formulár", highlighted: false, ctaLabel: "Vybrať", ctaHref: "#kontakt" },
          { name: "Biznis", price: "990 €", period: "jednorazovo", features: "Do 6 podstránok\nAnimácie a efekty\nSEO základ\nNapojenie analytiky", highlighted: true, ctaLabel: "Vybrať", ctaHref: "#kontakt" },
          { name: "Na mieru", price: "od 1 990 €", period: "", features: "Neobmedzený rozsah\nE-shop / rezervácie\nPrioritná podpora", highlighted: false, ctaLabel: "Konzultácia", ctaHref: "#kontakt" },
        ],
      },
      render: (p) => <Pricing {...p} />,
    },

    Testimonials: {
      label: "Referencie (31)",
      fields: {
        sectionId: idField,
        heading:    { type: "text", label: "Nadpis", contentEditable: true },
        subheading: { type: "textarea", label: "Popis", contentEditable: true },
        interval:   { type: "number", label: "Interval rotácie (s)" },
        items: { type: "array", label: "Referencie",
          arrayFields: {
            quote: { type: "textarea", label: "Citát" },
            name:  { type: "text", label: "Meno" },
            role:  { type: "text", label: "Rola / firma" },
          },
          getItemSummary: (it) => it.name || "Referencia" },
      },
      defaultProps: {
        sectionId: "referencie", heading: "Čo hovoria klienti", subheading: "", interval: 6,
        items: [
          { quote: "Nový web nám za prvý mesiac priniesol viac dopytov než starý za rok.", name: "Jana K.", role: "konateľka, Kvetinárstvo Flora" },
          { quote: "Rýchla komunikácia, čistý dizajn a všetko odovzdané načas.", name: "Peter M.", role: "CEO, Nordix s.r.o." },
        ],
      },
      render: (p) => <Testimonials {...p} />,
    },

    FAQ: {
      label: "FAQ (32-accordion)",
      fields: {
        sectionId: idField,
        heading:    { type: "text", label: "Nadpis", contentEditable: true },
        subheading: { type: "textarea", label: "Popis", contentEditable: true },
        items: { type: "array", label: "Otázky",
          arrayFields: {
            q: { type: "text", label: "Otázka" },
            a: { type: "textarea", label: "Odpoveď" },
          },
          getItemSummary: (it) => it.q || "Otázka" },
      },
      defaultProps: {
        sectionId: "faq", heading: "Časté otázky", subheading: "",
        items: [
          { q: "Ako dlho trvá výroba webu?", a: "Bežný firemný web dodávame do 2–4 týždňov od schválenia zadania." },
          { q: "Čo potrebujem dodať?", a: "Logo, texty a fotky ak máte. Ak nie, pomôžeme s tvorbou obsahu." },
          { q: "Je v cene aj hosting?", a: "Prvý rok hostingu a domény je v cene každého balíka." },
        ],
      },
      render: (p) => <FAQ {...p} />,
    },

    CTABanner: {
      label: "CTA banner (63)",
      fields: {
        sectionId: idField,
        heading:  { type: "text", label: "Nadpis" },
        text:     { type: "textarea", label: "Text" },
        ctaLabel: { type: "text", label: "Tlačidlo" },
        ctaHref:  { type: "text", label: "Odkaz" },
      },
      defaultProps: {
        sectionId: "", heading: "Pripravení začať?",
        text: "Napíšte nám o vašom projekte — ozveme sa do 24 hodín s návrhom riešenia.",
        ctaLabel: "Nezáväzná konzultácia", ctaHref: "#kontakt",
      },
      render: (p) => <CTABanner {...p} />,
    },

    ContactForm: {
      label: "Kontaktný formulár (49)",
      fields: {
        sectionId:   idField,
        heading:     { type: "text", label: "Nadpis" },
        subheading:  { type: "textarea", label: "Popis" },
        buttonLabel: { type: "text", label: "Tlačidlo" },
        email:       { type: "text", label: "E-mail príjemcu" },
      },
      defaultProps: {
        sectionId: "kontakt", heading: "Napíšte nám",
        subheading: "Odpovedáme do 24 hodín.", buttonLabel: "Odoslať správu",
        email: "mediavoltteam@gmail.com",
      },
      render: (p) => <ContactForm {...p} />,
    },

    Footer: {
      label: "Pätička (66-footer-mega)",
      fields: {
        logoText:   { type: "text", label: "Logo — text" },
        logoAccent: { type: "text", label: "Logo — zvýraznená časť" },
        tagline:    { type: "textarea", label: "Tagline" },
        columns: { type: "array", label: "Stĺpce",
          arrayFields: {
            title: { type: "text", label: "Titulok" },
            links: { type: "textarea", label: "Odkazy (Label|url, 1 na riadok)" },
          },
          getItemSummary: (it) => it.title || "Stĺpec" },
        copyright: { type: "text", label: "Copyright" },
      },
      defaultProps: {
        logoText: "Media", logoAccent: "Volt",
        tagline: "Weby a digitálne nástroje, ktoré posúvajú biznis dopredu.",
        columns: [
          { title: "Navigácia", links: "Služby|#sluzby\nCenník|#cennik\nKontakt|#kontakt" },
          { title: "Právne", links: "GDPR|/gdpr\nObchodné podmienky|/vop" },
          { title: "Sociálne", links: "Instagram|#\nLinkedIn|#" },
        ],
        copyright: "© 2026 MediaVolt. Všetky práva vyhradené.",
      },
      render: (p) => <Footer {...p} />,
    },


    Gallery: {
      label: "Galéria (75-masonry)",
      fields: {
        sectionId: idField,
        heading:    { type: "text", label: "Nadpis", contentEditable: true },
        subheading: { type: "textarea", label: "Popis", contentEditable: true },
        columns: { type: "select", label: "Stĺpce", options: [
          { label: "2", value: 2 }, { label: "3", value: 3 }, { label: "4", value: 4 },
        ]},
        items: { type: "array", label: "Obrázky",
          arrayFields: {
            src:     imageField("Obrázok"),
            caption: { type: "text", label: "Popisok (voliteľný)" },
          },
          getItemSummary: (it) => it.caption || (it.src ? it.src.split("/").pop() : "Obrázok") },
      },
      defaultProps: {
        sectionId: "galeria", heading: "Naše práce", subheading: "", columns: 3,
        items: [
          { src: "https://picsum.photos/seed/mv1/640/460", caption: "Projekt Alfa" },
          { src: "https://picsum.photos/seed/mv2/640/820", caption: "Projekt Beta" },
          { src: "https://picsum.photos/seed/mv3/640/500", caption: "Projekt Gama" },
          { src: "https://picsum.photos/seed/mv4/640/700", caption: "Projekt Delta" },
          { src: "https://picsum.photos/seed/mv5/640/440", caption: "Projekt Epsilon" },
          { src: "https://picsum.photos/seed/mv6/640/620", caption: "Projekt Zeta" },
        ],
      },
      render: (p) => <Gallery {...p} />,
    },

    TeamCards: {
      label: "Tím (35-team-cards)",
      fields: {
        sectionId: idField,
        heading:    { type: "text", label: "Nadpis", contentEditable: true },
        subheading: { type: "textarea", label: "Popis", contentEditable: true },
        items: { type: "array", label: "Členovia",
          arrayFields: {
            photo: imageField("Fotka"),
            name:  { type: "text", label: "Meno" },
            role:  { type: "text", label: "Rola" },
          },
          getItemSummary: (it) => it.name || "Člen" },
      },
      defaultProps: {
        sectionId: "tim", heading: "Náš tím", subheading: "",
        items: [
          { photo: "", name: "Mária V.", role: "Dizajn & stratégia" },
          { photo: "", name: "Tomáš R.", role: "Vývoj" },
          { photo: "", name: "Lucia B.", role: "Obsah & SEO" },
        ],
      },
      render: (p) => <TeamCards {...p} />,
    },

    TextBlock: {
      label: "Textový blok",
      fields: {
        sectionId: idField,
        content: { type: "textarea", label: "Text (odseky oddeľ prázdnym riadkom)", contentEditable: true },
        muted: { type: "radio", label: "Tlmená farba", options: [
          { label: "Áno", value: true }, { label: "Nie", value: false },
        ]},
      },
      defaultProps: { sectionId: "", content: "Váš text…", muted: false },
      render: (p) => <TextBlock {...p} />,
    },

    AnnouncementBar: {
      label: "Oznamovacia lišta (70)",
      fields: {
        text:        { type: "text", label: "Text" },
        linkLabel:   { type: "text", label: "Odkaz — text (voliteľné)" },
        linkHref:    { type: "text", label: "Odkaz — URL" },
        dismissible: { type: "radio", label: "Dá sa zavrieť", options: [
          { label: "Áno", value: true }, { label: "Nie", value: false },
        ]},
      },
      defaultProps: {
        text: "🎉 Nová akcia: prvý mesiac hostingu zdarma pri každom webe.",
        linkLabel: "Zistiť viac", linkHref: "#cennik", dismissible: true,
      },
      render: (p) => <AnnouncementBar {...p} />,
    },

    FeatureTabs: {
      label: "Funkcie v taboch (33)",
      fields: {
        sectionId: idField,
        heading:    { type: "text", label: "Nadpis", contentEditable: true },
        subheading: { type: "textarea", label: "Popis", contentEditable: true },
        tabs: { type: "array", label: "Taby",
          arrayFields: {
            label: { type: "text", label: "Názov tabu" },
            title: { type: "text", label: "Titulok" },
            text:  { type: "textarea", label: "Text" },
            image: imageField("Obrázok (voliteľný)"),
          },
          getItemSummary: (it) => it.label || "Tab" },
      },
      defaultProps: {
        sectionId: "funkcie", heading: "Ako to funguje", subheading: "",
        tabs: [
          { label: "Návrh", title: "Najprv stratégia", text: "Prejdeme si ciele, cieľovku a konkurenciu. Pripravíme wireframe a obsahovú kostru.", image: "https://picsum.photos/seed/tab1/640/440" },
          { label: "Dizajn", title: "Vizuálna identita", text: "Moderný dizajn na mieru značke — farby, typografia, mikrointerakcie.", image: "https://picsum.photos/seed/tab2/640/440" },
          { label: "Spustenie", title: "Vývoj a launch", text: "Rýchly, responzívny web nasadený na produkcii vrátane SEO a analytiky.", image: "https://picsum.photos/seed/tab3/640/440" },
        ],
      },
      render: (p) => <FeatureTabs {...p} />,
    },

    Steps: {
      label: "Kroky / proces (57)",
      fields: {
        sectionId: idField,
        heading:    { type: "text", label: "Nadpis", contentEditable: true },
        subheading: { type: "textarea", label: "Popis", contentEditable: true },
        items: { type: "array", label: "Kroky",
          arrayFields: {
            icon:  { type: "text", label: "Ikona / číslo (voliteľné)" },
            title: { type: "text", label: "Titulok" },
            text:  { type: "textarea", label: "Text" },
          },
          getItemSummary: (it) => it.title || "Krok" },
      },
      defaultProps: {
        sectionId: "postup", heading: "3 kroky k novému webu", subheading: "",
        items: [
          { icon: "", title: "Konzultácia", text: "Bezplatný hovor, kde si ujasníme ciele a rozsah projektu." },
          { icon: "", title: "Návrh a dizajn", text: "Pripravíme dizajn na mieru a odsúhlasíme smerovanie." },
          { icon: "", title: "Spustenie", text: "Web nasadíme, otestujeme a odovzdáme aj s podporou." },
        ],
      },
      render: (p) => <Steps {...p} />,
    },

    Timeline: {
      label: "Časová os (34)",
      fields: {
        sectionId: idField,
        heading:    { type: "text", label: "Nadpis", contentEditable: true },
        subheading: { type: "textarea", label: "Popis", contentEditable: true },
        items: { type: "array", label: "Míľniky",
          arrayFields: {
            date:  { type: "text", label: "Dátum / obdobie" },
            title: { type: "text", label: "Titulok" },
            text:  { type: "textarea", label: "Text" },
          },
          getItemSummary: (it) => it.title || "Míľnik" },
      },
      defaultProps: {
        sectionId: "historia", heading: "Naša cesta", subheading: "",
        items: [
          { date: "2021", title: "Založenie", text: "Začali sme ako dvojčlenné štúdio s dôrazom na kvalitný dizajn." },
          { date: "2023", title: "Prvých 50 projektov", text: "Rozšírili sme tím a portfólio o e-shopy a webové aplikácie." },
          { date: "2026", title: "MediaVolt dnes", text: "Kompletné digitálne riešenia od stratégie po nasadenie a rast." },
        ],
      },
      render: (p) => <Timeline {...p} />,
    },

    ComparisonTable: {
      label: "Porovnávacia tabuľka (68)",
      fields: {
        sectionId: idField,
        heading:    { type: "text", label: "Nadpis", contentEditable: true },
        subheading: { type: "textarea", label: "Popis", contentEditable: true },
        cols: { type: "array", label: "Stĺpce (balíky)",
          arrayFields: {
            label:       { type: "text", label: "Názov" },
            highlighted: { type: "radio", label: "Zvýrazniť", options: [
              { label: "Áno", value: true }, { label: "Nie", value: false },
            ]},
          },
          getItemSummary: (it) => it.label || "Stĺpec" },
        rows: { type: "array", label: "Riadky (funkcie)",
          arrayFields: {
            feature: { type: "text", label: "Funkcia" },
            values:  { type: "text", label: "Hodnoty (oddeľ |, napr. ✓|✓|✕)" },
          },
          getItemSummary: (it) => it.feature || "Riadok" },
      },
      defaultProps: {
        sectionId: "", heading: "Porovnanie balíkov", subheading: "",
        cols: [
          { label: "Štart", highlighted: false },
          { label: "Biznis", highlighted: true },
          { label: "Na mieru", highlighted: false },
        ],
        rows: [
          { feature: "Počet podstránok", values: "1|6|∞" },
          { feature: "Animácie a efekty", values: "✕|✓|✓" },
          { feature: "SEO optimalizácia", values: "základ|✓|✓" },
          { feature: "E-shop / rezervácie", values: "✕|✕|✓" },
          { feature: "Prioritná podpora", values: "✕|✓|✓" },
        ],
      },
      render: (p) => <ComparisonTable {...p} />,
    },

    PortfolioGrid: {
      label: "Portfólio mriežka (37)",
      fields: {
        sectionId: idField,
        heading:    { type: "text", label: "Nadpis", contentEditable: true },
        subheading: { type: "textarea", label: "Popis", contentEditable: true },
        columns: { type: "select", label: "Stĺpce", options: [
          { label: "2", value: 2 }, { label: "3", value: 3 }, { label: "4", value: 4 },
        ]},
        items: { type: "array", label: "Projekty",
          arrayFields: {
            image: imageField("Obrázok"),
            title: { type: "text", label: "Názov" },
            tag:   { type: "text", label: "Štítok (napr. Web, E-shop)" },
            href:  { type: "text", label: "Odkaz" },
          },
          getItemSummary: (it) => it.title || "Projekt" },
      },
      defaultProps: {
        sectionId: "portfolio", heading: "Vybrané práce", subheading: "", columns: 3,
        items: [
          { image: "https://picsum.photos/seed/pf1/640/480", title: "Kvetinárstvo Flora", tag: "Web", href: "#" },
          { image: "https://picsum.photos/seed/pf2/640/480", title: "Nordix s.r.o.", tag: "E-shop", href: "#" },
          { image: "https://picsum.photos/seed/pf3/640/480", title: "Helios Fitness", tag: "Rezervácie", href: "#" },
          { image: "https://picsum.photos/seed/pf4/640/480", title: "Brixel Studio", tag: "Portfólio", href: "#" },
          { image: "https://picsum.photos/seed/pf5/640/480", title: "Datura App", tag: "Web app", href: "#" },
          { image: "https://picsum.photos/seed/pf6/640/480", title: "Kvant Consulting", tag: "Web", href: "#" },
        ],
      },
      render: (p) => <PortfolioGrid {...p} />,
    },

    BeforeAfter: {
      label: "Pred / Po (38)",
      fields: {
        sectionId: idField,
        heading:     { type: "text", label: "Nadpis", contentEditable: true },
        subheading:  { type: "textarea", label: "Popis", contentEditable: true },
        before:      imageField("Obrázok „Pred“"),
        after:       imageField("Obrázok „Po“"),
        labelBefore: { type: "text", label: "Popisok — Pred" },
        labelAfter:  { type: "text", label: "Popisok — Po" },
      },
      defaultProps: {
        sectionId: "", heading: "Redizajn, ktorý vidno", subheading: "Potiahnite posuvník.",
        before: "https://picsum.photos/seed/before/900/506?grayscale",
        after: "https://picsum.photos/seed/after/900/506",
        labelBefore: "Pred", labelAfter: "Po",
      },
      render: (p) => <BeforeAfter {...p} />,
    },

    LogoCloud: {
      label: "Logo mriežka (67)",
      fields: {
        sectionId: idField,
        heading: { type: "text", label: "Nadpis (voliteľný)", contentEditable: true },
        items: { type: "array", label: "Logá",
          arrayFields: {
            label: { type: "text", label: "Text (ak bez obrázka)" },
            image: imageField("Logo (voliteľné)"),
          },
          getItemSummary: (it) => it.label || (it.image ? "Logo" : "Položka") },
      },
      defaultProps: {
        sectionId: "", heading: "Dôverujú nám",
        items: [
          { label: "ACME", image: "" }, { label: "Nordix", image: "" },
          { label: "Kvant", image: "" }, { label: "Helios", image: "" },
          { label: "Brixel", image: "" }, { label: "Datura", image: "" },
        ],
      },
      render: (p) => <LogoCloud {...p} />,
    },

    Newsletter: {
      label: "Newsletter (81)",
      fields: {
        sectionId:   idField,
        heading:     { type: "text", label: "Nadpis", contentEditable: true },
        subheading:  { type: "textarea", label: "Popis", contentEditable: true },
        buttonLabel: { type: "text", label: "Tlačidlo" },
        note:        { type: "text", label: "Poznámka pod formulárom" },
      },
      defaultProps: {
        sectionId: "", heading: "Zostaňte v obraze",
        subheading: "Tipy k webu a digitálnemu marketingu raz mesačne. Žiadny spam.",
        buttonLabel: "Prihlásiť sa", note: "Odhlásiť sa môžete kedykoľvek.",
      },
      render: (p) => <Newsletter {...p} />,
    },

    Embed: {
      label: "Embed HTML (advanced)",
      fields: {
        sectionId: idField,
        html:      codeField("HTML kód (mapy, video, widgety…)", "HTML", 10),
        contained: { type: "radio", label: "Rámček / odsadenie", options: [
          { label: "Áno", value: true }, { label: "Nie (na celú šírku)", value: false },
        ]},
      },
      defaultProps: {
        sectionId: "",
        html: '<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=17.10%2C48.14%2C17.12%2C48.15" width="100%" height="320" style="border:0;border-radius:10px" loading="lazy"></iframe>',
        contained: true,
      },
      render: (p) => <Embed {...p} />,
    },

    CodeBlock: {
      label: "Code blok / terminál (98)",
      fields: {
        sectionId: idField,
        title: { type: "text", label: "Titulok okna" },
        lang:  { type: "text", label: "Jazyk (badge, voliteľné)" },
        code:  codeField("Kód", "", 10),
      },
      defaultProps: {
        sectionId: "", title: "app.sh", lang: "bash",
        code: "$ npm create mediavolt@latest\n✓ Projekt pripravený\n$ npm run dev\n➜  http://localhost:5173",
      },
      render: (p) => <CodeBlock {...p} />,
    },
  },
};
