// ═══════════════════════════════════════════════════════════════
//  Šablóny stránok (MD §5 — Presets/Blocks knižnica).
//  Šablóna = hotový JSON strom; komponenty sa inštancujú
//  z defaultProps registry + overrides.
// ═══════════════════════════════════════════════════════════════
import { config } from "./puck.config.jsx";

const uid = () => Math.random().toString(36).slice(2, 8);
const item = (type, overrides = {}) => ({
  type,
  props: { ...config.components[type].defaultProps, ...overrides, id: type + "-" + uid() },
});

export const presets = {
  blank: {
    label: "Prázdna stránka",
    desc: "Začni od nuly — komponenty potiahneš z ľavého panelu.",
    build: (title) => ({ content: [], root: { props: { ...config.root.defaultProps, title } }, zones: {} }),
  },

  firma: {
    label: "Firemný web",
    desc: "Hero · služby · čísla · referencie · cenník · FAQ · kontakt",
    build: (title) => ({
      root: { props: { ...config.root.defaultProps, title } },
      zones: {},
      content: [
        item("Navbar"),
        item("Hero", { variant: "aurora" }),
        item("LogoMarquee"),
        item("BentoGrid"),
        item("Stats"),
        item("Testimonials"),
        item("Pricing"),
        item("FAQ"),
        item("CTABanner"),
        item("ContactForm"),
        item("Footer"),
      ],
    }),
  },

  landing: {
    label: "Produktový landing",
    desc: "Spotlight hero · benefity · čísla · CTA · kontakt",
    build: (title) => ({
      root: { props: { ...config.root.defaultProps, title } },
      zones: {},
      content: [
        item("Navbar", { links: [
          { label: "Výhody", href: "#sluzby" },
          { label: "Čísla", href: "#cisla" },
          { label: "Kontakt", href: "#kontakt" },
        ]}),
        item("Hero", {
          variant: "spotlight", align: "center", kicker: "🚀 Early access",
          heading: "Jeden nástroj,", headingAccent: "nula chaosu",
          subheading: "Landing page šablóna pre produkt alebo službu — uprav texty a publikuj do pár minút.",
          ghostLabel: "", ghostHref: "",
        }),
        item("BentoGrid", { heading: "Prečo práve my", columns: 3 }),
        item("Stats", { sectionId: "cisla" }),
        item("CTABanner"),
        item("ContactForm"),
        item("Footer", { columns: [
          { title: "Právne", links: "GDPR|/gdpr\nVOP|/vop" },
          { title: "Sociálne", links: "Instagram|#\nLinkedIn|#" },
        ]}),
      ],
    }),
  },

  portfolio: {
    label: "Portfólio",
    desc: "Mesh hero · galéria prác · tím · referencie · kontakt",
    build: (title) => ({
      root: { props: { ...config.root.defaultProps, title } },
      zones: {},
      content: [
        item("Navbar", { links: [
          { label: "Práce", href: "#galeria" },
          { label: "Tím", href: "#tim" },
          { label: "Kontakt", href: "#kontakt" },
        ]}),
        item("Hero", {
          variant: "mesh", align: "left", kicker: "Portfólio 2026",
          heading: "Tvoríme veci, ktoré", headingAccent: "vidno",
          subheading: "Výber z našich projektov — dizajn, weby, kampane.",
          primaryLabel: "Pozrieť práce", primaryHref: "#galeria", ghostLabel: "Kontakt", ghostHref: "#kontakt",
        }),
        item("Gallery"),
        item("TeamCards"),
        item("Testimonials"),
        item("CTABanner", { heading: "Máte projekt?", text: "Povedzte nám o ňom — radi sa pridáme.", ctaLabel: "Napísať", ctaHref: "#kontakt" }),
        item("ContactForm"),
        item("Footer"),
      ],
    }),
  },
};
