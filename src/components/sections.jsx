// ═══════════════════════════════════════════════════════════════
//  Sekčné komponenty — render vrstva Component Registry.
//  Efekty (aurora, spotlight, counter-up, marquee…) sú odľahčené
//  verzie komponentov z MediaVolt Component Library (COMPONENTS/),
//  zdieľajú tokeny s theme-bridge.css (--primary, --accent, …).
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from "react";
import "./sections.css";

const Sec = ({ id, children, head, sub }) => (
  <section className="mv-sec" id={id || undefined}>
    <div className="mv-container">
      {(head || sub) && (
        <div className="mv-sec__head">
          {head && <h2 className="mv-h">{head}</h2>}
          {sub && <p>{sub}</p>}
        </div>
      )}
      {children}
    </div>
  </section>
);

const Btn = ({ label, href, kind = "primary" }) =>
  label ? <a className={"mv-btn mv-btn--" + kind} href={href || "#"}>{label}</a> : null;

// ── 01 Navbar ───────────────────────────────────────────────────
export function Navbar({ logoText, logoAccent, links = [], ctaLabel, ctaHref }) {
  return (
    <nav className="mv-nav">
      <div className="mv-container mv-nav__in">
        <a className="mv-nav__logo" href="#">{logoText}<b>{logoAccent}</b></a>
        <div className="mv-nav__links">
          {links.map((l, i) => <a key={i} href={l.href || "#"}>{l.label}</a>)}
        </div>
        <Btn label={ctaLabel} href={ctaHref} />
      </div>
    </nav>
  );
}

// ── 02 Hero (aurora / mesh / spotlight) ────────────────────────
export function Hero({ variant = "aurora", bgImage, kicker, heading, headingAccent, subheading,
                       align = "center", primaryLabel, primaryHref, ghostLabel, ghostHref }) {
  const ref = useRef(null);
  useEffect(() => {
    if (variant !== "spotlight") return;
    const el = ref.current;
    const mv = (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    };
    el.addEventListener("pointermove", mv);
    return () => el.removeEventListener("pointermove", mv);
  }, [variant]);
  return (
    <header ref={ref} className={"mv-hero mv-hero--" + variant} data-align={align}>
      {bgImage && <img className="mv-hero__img" src={bgImage} alt="" />}
      {bgImage && <div className="mv-hero__shade" />}
      <div className="mv-hero__bg" />
      {variant === "spotlight" && <div className="mv-hero__grid" />}
      <div className="mv-container mv-hero__content">
        {kicker && <span className="mv-hero__kicker">{kicker}</span>}
        <h1 className="mv-h">{heading} {headingAccent && <span className="grad">{headingAccent}</span>}</h1>
        {subheading && <p className="mv-hero__sub">{subheading}</p>}
        <div className="mv-hero__actions">
          <Btn label={primaryLabel} href={primaryHref} />
          <Btn label={ghostLabel} href={ghostHref} kind="ghost" />
        </div>
      </div>
    </header>
  );
}

// ── 03 Logo marquee ────────────────────────────────────────────
export function LogoMarquee({ items = [], duration = 28 }) {
  const list = [...items, ...items]; // 2× pre plynulú slučku (translateX -50 %)
  return (
    <div className="mv-marquee" style={{ "--mq-dur": duration + "s" }}>
      <div className="mv-marquee__track">
        {list.map((it, i) => <span className="mv-marquee__item" key={i}>{it.label}</span>)}
      </div>
    </div>
  );
}

// ── 04 Bento grid ──────────────────────────────────────────────
export function BentoGrid({ sectionId, heading, subheading, columns = 3, items = [] }) {
  return (
    <Sec id={sectionId} head={heading} sub={subheading}>
      <div className="mv-bento" style={{ "--bento-cols": columns }}>
        {items.map((it, i) => (
          <div className="mv-bento__card" key={i}>
            <div className="mv-bento__icon">{it.icon}</div>
            <h3>{it.title}</h3>
            <p>{it.desc}</p>
          </div>
        ))}
      </div>
    </Sec>
  );
}

// ── 05 Stats (counter-up, IntersectionObserver) ────────────────
function CountUp({ value = 0, suffix = "" }) {
  const ref = useRef(null);
  // SSR: bez okna renderuj rovno cieľovú hodnotu (animácia beží len v prehliadači)
  const [n, setN] = useState(typeof window === "undefined" ? value : 0);
  useEffect(() => {
    const el = ref.current;
    let raf;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1600;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        setN(Math.round(value * (1 - Math.pow(1 - p, 3)))); // easeOutCubic
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);
  return <div ref={ref} className="mv-stats__num">{n.toLocaleString("sk")}{suffix}</div>;
}

export function Stats({ sectionId, heading, subheading, items = [] }) {
  return (
    <Sec id={sectionId} head={heading} sub={subheading}>
      <div className="mv-stats">
        {items.map((it, i) => (
          <div key={i}>
            <CountUp value={Number(it.value) || 0} suffix={it.suffix} />
            <div className="mv-stats__label">{it.label}</div>
          </div>
        ))}
      </div>
    </Sec>
  );
}

// ── 06 Pricing ─────────────────────────────────────────────────
export function Pricing({ sectionId, heading, subheading, plans = [] }) {
  return (
    <Sec id={sectionId} head={heading} sub={subheading}>
      <div className="mv-pricing">
        {plans.map((p, i) => (
          <div className={"mv-price" + (p.highlighted ? " mv-price--hot" : "")} key={i}>
            {p.highlighted && <span className="mv-price__badge">Najobľúbenejší</span>}
            <h3>{p.name}</h3>
            <div className="mv-price__amount">{p.price}<small> {p.period}</small></div>
            <ul>{(p.features || "").split("\n").filter(Boolean).map((f, j) => <li key={j}>{f}</li>)}</ul>
            <Btn label={p.ctaLabel || "Vybrať"} href={p.ctaHref} kind={p.highlighted ? "primary" : "ghost"} />
          </div>
        ))}
      </div>
    </Sec>
  );
}

// ── 07 Testimonials (auto-rotate slider) ───────────────────────
export function Testimonials({ sectionId, heading, subheading, items = [], interval = 6 }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), Math.max(interval, 2) * 1000);
    return () => clearInterval(t);
  }, [items.length, interval]);
  const cur = items[i] || {};
  return (
    <Sec id={sectionId} head={heading} sub={subheading}>
      <div className="mv-testi">
        <div className="mv-testi__slide" key={i}>
          <p className="mv-testi__quote">„{cur.quote}“</p>
          <div className="mv-testi__who"><b>{cur.name}</b> · {cur.role}</div>
        </div>
        <div className="mv-testi__dots">
          {items.map((_, j) => (
            <button key={j} className={"mv-testi__dot" + (j === i ? " on" : "")} onClick={() => setI(j)} aria-label={"Referencia " + (j + 1)} />
          ))}
        </div>
      </div>
    </Sec>
  );
}

// ── 08 FAQ accordion ───────────────────────────────────────────
export function FAQ({ sectionId, heading, subheading, items = [] }) {
  const [open, setOpen] = useState(0);
  return (
    <Sec id={sectionId} head={heading} sub={subheading}>
      <div className="mv-faq">
        {items.map((it, i) => (
          <div className={"mv-faq__item" + (open === i ? " open" : "")} key={i}>
            <button className="mv-faq__q" onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{it.q}</span><span>+</span>
            </button>
            <div className="mv-faq__a" style={{ maxHeight: open === i ? "220px" : 0 }}>
              <p>{it.a}</p>
            </div>
          </div>
        ))}
      </div>
    </Sec>
  );
}

// ── 09 CTA banner ──────────────────────────────────────────────
export function CTABanner({ sectionId, heading, text, ctaLabel, ctaHref }) {
  return (
    <Sec id={sectionId}>
      <div className="mv-cta">
        <h2 className="mv-h">{heading}</h2>
        {text && <p>{text}</p>}
        <Btn label={ctaLabel} href={ctaHref} />
      </div>
    </Sec>
  );
}

// ── 10 Contact form (Fáza 3: ukladá do cb_messages, mailto fallback) ──
import { hasSupabase, submitMessage } from "../lib/supabase.js";

function currentPageId() {
  const q = new URLSearchParams(window.location.search);
  return q.get("view") || q.get("page") || "";
}

export function ContactForm({ sectionId, heading, subheading, buttonLabel = "Odoslať", email }) {
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const submit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = { name: f.get("name") || "", from: f.get("from") || "", message: f.get("message") || "" };
    if (hasSupabase) {
      setState("sending");
      try {
        await submitMessage({ pageId: currentPageId(), name: payload.name, email: payload.from, message: payload.message });
        setState("sent");
        return;
      } catch (err) {
        console.error(err);
        setState("error"); // spadne na mailto nižšie, ak je email
      }
    }
    // fallback bez Supabase (alebo pri chybe): mailto
    if (email) {
      window.location.href = "mailto:" + email +
        "?subject=" + encodeURIComponent("Správa z webu — " + payload.name) +
        "&body=" + encodeURIComponent(payload.message + "\n\n" + payload.from);
      setState("sent");
    }
  };
  return (
    <Sec id={sectionId} head={heading} sub={subheading}>
      {state === "sent" ? (
        <div className="mv-form__ok">✓ Ďakujeme, správa je na ceste.</div>
      ) : (
        <form className="mv-form" onSubmit={submit}>
          <input name="name" placeholder="Meno" required />
          <input name="from" type="email" placeholder="E-mail" required />
          <textarea name="message" placeholder="Správa" required />
          <button className="mv-btn mv-btn--primary" disabled={state === "sending"}
            style={{ justifyContent: "center" }}>
            {state === "sending" ? "Odosielam…" : buttonLabel}
          </button>
          {state === "error" && <div style={{ color: "#e66", fontSize: 13 }}>Odoslanie zlyhalo — skúste znova alebo napíšte na {email}.</div>}
        </form>
      )}
    </Sec>
  );
}

// ── 11 Footer ──────────────────────────────────────────────────
export function Footer({ logoText, logoAccent, tagline, columns = [], copyright }) {
  return (
    <footer className="mv-footer">
      <div className="mv-container">
        <div className="mv-footer__grid" style={{ "--f-cols": Math.max(columns.length, 1) }}>
          <div>
            <div className="mv-footer__brand">{logoText}<b>{logoAccent}</b></div>
            {tagline && <p className="mv-footer__tag">{tagline}</p>}
          </div>
          {columns.map((c, i) => (
            <div key={i}>
              <h4>{c.title}</h4>
              <ul>{(c.links || "").split("\n").filter(Boolean).map((l, j) => {
                const [label, href] = l.split("|");
                return <li key={j}><a href={(href || "#").trim()}>{label.trim()}</a></li>;
              })}</ul>
            </div>
          ))}
        </div>
        <div className="mv-footer__bottom">
          <span>{copyright}</span>
          <span>Powered by <b style={{ color: "var(--primary)" }}>MediaVolt</b></span>
        </div>
      </div>
    </footer>
  );
}

// ── 12 Text block ──────────────────────────────────────────────
export function TextBlock({ sectionId, content, muted }) {
  return (
    <Sec id={sectionId}>
      <div className={"mv-text" + (muted ? " mv-text--muted" : "")}>
        {(content || "").split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </Sec>
  );
}

// ── 13 Gallery (75-masonry + lightbox) ─────────────────────────
export function Gallery({ sectionId, heading, subheading, columns = 3, items = [] }) {
  const [zoom, setZoom] = useState(null);
  return (
    <Sec id={sectionId} head={heading} sub={subheading}>
      <div className="mv-gal" style={{ "--gal-cols": columns }}>
        {items.map((it, i) => (
          <figure key={i} onClick={() => setZoom(it.src)}>
            <img src={it.src} alt={it.caption || ""} loading="lazy" />
            {it.caption && <figcaption>{it.caption}</figcaption>}
          </figure>
        ))}
      </div>
      {zoom && (
        <div className="mv-lightbox" onClick={() => setZoom(null)}>
          <img src={zoom} alt="" />
        </div>
      )}
    </Sec>
  );
}

// ── 14 Team cards (35) ─────────────────────────────────────────
export function TeamCards({ sectionId, heading, subheading, items = [] }) {
  return (
    <Sec id={sectionId} head={heading} sub={subheading}>
      <div className="mv-team">
        {items.map((it, i) => (
          <div className="mv-team__card" key={i}>
            {it.photo
              ? <img className="mv-team__photo" src={it.photo} alt={it.name} loading="lazy" />
              : <div className="mv-team__ph">{(it.name || "?").trim()[0]}</div>}
            <div className="mv-team__body">
              <h3>{it.name}</h3>
              <p>{it.role}</p>
            </div>
          </div>
        ))}
      </div>
    </Sec>
  );
}
