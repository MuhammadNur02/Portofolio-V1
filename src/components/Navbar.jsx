import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowUpRight, Eye } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { scrollToTarget, useScrollLock } from "../lib/smoothScroll";
import { useVisitorCount } from "../lib/useVisitorCount";
import { cn } from "../lib/utils";
import { SITE, SOCIALS, waLink } from "../config/site";
import MenuToggleIcon from "./ui/MenuToggleIcon";
import BrandMark from "./ui/BrandMark";

const SECTIONS = ["About", "Experience", "Portofolio", "Gallery", "Testimonials", "Contact"];
const LABEL_KEY = {
  About: "about",
  Experience: "experience",
  Portofolio: "portfolio",
  Gallery: "gallery",
  Testimonials: "testimonials",
  Contact: "contact",
};

// Sections appear only once their data exists, so the menu lists just the ones currently on the page.
function usePresentSections(ids) {
  const [present, setPresent] = useState([]);
  useEffect(() => {
    let frame;
    const check = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = ids.filter((id) => document.getElementById(id));
        setPresent((prev) => (prev.join() === next.join() ? prev : next));
      });
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [ids]);
  return present;
}

// The section crossing the middle of the viewport is the active one.
function useActiveSection(ids) {
  const [active, setActive] = useState(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    ["Home", ...ids].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

export function LanguageToggle({ className }) {
  const { lang, setLang, t } = useLanguage();
  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className={cn("relative flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1 text-xs font-semibold", className)}
    >
      {["id", "en"].map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          lang={code}
          className={cn(
            "relative z-10 grid h-8 min-w-[2.25rem] place-items-center rounded-full px-2.5 uppercase transition-colors duration-300",
            lang === code ? "text-white" : "text-washi-subtle hover:text-washi"
          )}
        >
          {lang === code && (
            <motion.span
              layoutId="lang-pill"
              className="absolute inset-0 -z-10 rounded-full bg-shu-600"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          {code}
        </button>
      ))}
    </div>
  );
}

// How many devices have opened the site. Rendering it is also what records this visit.
export function VisitorCount({ className }) {
  const { lang, t } = useLanguage();
  const count = useVisitorCount();
  if (count == null) return null;
  return (
    <span
      title={t.nav.visitors}
      className={cn("flex items-center gap-1.5 text-xs font-semibold tabular-nums text-washi-muted", className)}
    >
      <Eye aria-hidden="true" className="h-4 w-4 text-shu-400" />
      <span className="sr-only">{t.nav.visitors}:</span>
      {count.toLocaleString(lang)}
    </span>
  );
}

export default function Navbar() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const present = usePresentSections(SECTIONS);
  const active = useActiveSection(present);
  const toggleRef = useRef(null);
  const menuRef = useRef(null);
  useScrollLock(open);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The menu behaves like a dialog: Esc closes it, Tab stays inside it (the toggle button included),
  // and focus returns to the toggle when it closes.
  useEffect(() => {
    if (!open) return;
    const toggle = toggleRef.current;
    menuRef.current?.querySelector("a")?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "Tab" || !menuRef.current) return;
      const focusables = [toggle, ...menuRef.current.querySelectorAll("a, button")];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      toggle?.focus();
    };
  }, [open]);

  // Close the menu if the window grows past the breakpoint where the desktop links appear.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e) => e.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open]);

  const go = (e, target) => {
    e.preventDefault();
    setOpen(false);
    // Let the menu start closing (and scrolling unlock) before the page glides away.
    requestAnimationFrame(() => scrollToTarget(target));
  };

  const items = present.map((id) => ({ id, href: `#${id}`, label: t.nav[LABEL_KEY[id]] }));

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <div
          className={cn(
            "mx-auto flex items-center justify-between transition-all duration-500 ease-out",
            scrolled || open
              ? "mt-3 w-[calc(100%-1.5rem)] max-w-5xl rounded-full border border-white/10 bg-ink/75 py-2 pl-3 pr-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
              : "w-full max-w-site border border-transparent px-5 py-5 sm:px-8 lg:px-12"
          )}
        >
          <a href="#Home" onClick={(e) => go(e, 0)} className="flex items-center gap-2.5 rounded-full pr-2" title={SITE.name}>
            <BrandMark />
            <span className="font-display text-lg font-bold tracking-tight text-washi font-semiwide">
              {SITE.shortName}
              <span className="text-shu-500">.</span>
            </span>
          </a>

          <LayoutGroup id="nav">
            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {items.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      onClick={(e) => go(e, item.href)}
                      aria-current={active === item.id ? "true" : undefined}
                      className={cn(
                        "relative block rounded-full px-3 py-2 text-sm font-medium transition-colors duration-300 xl:px-4",
                        active === item.id ? "text-washi" : "text-washi-muted hover:text-washi"
                      )}
                    >
                      {active === item.id && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 -z-10 rounded-full border border-white/10 bg-white/[0.07]"
                          transition={{ type: "spring", stiffness: 400, damping: 34 }}
                        />
                      )}
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </LayoutGroup>

          <div className="flex items-center gap-2">
            <VisitorCount className="hidden min-[360px]:flex sm:mr-1" />
            <LanguageToggle />
            <a
              href={waLink(t.nav.hireMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary hidden h-10 px-5 md:inline-flex"
            >
              {t.nav.hire}
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-washi transition-colors hover:border-white/25 lg:hidden"
            >
              <MenuToggleIcon open={open} className="h-6 w-6" duration={500} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            data-lenis-prevent
            className="fixed inset-0 z-40 flex flex-col overflow-y-auto overscroll-contain bg-ink/95 px-6 pb-10 pt-28 backdrop-blur-2xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}
          >
            <span aria-hidden="true" className="pointer-events-none absolute -right-6 bottom-24 font-kanji text-[14rem] leading-none text-white/[0.03]">
              道
            </span>
            <nav aria-label="Mobile" className="flex-1">
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.05 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                    exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
                  >
                    <a
                      href={item.href}
                      onClick={(e) => go(e, item.href)}
                      className={cn(
                        "flex items-baseline gap-4 py-2 font-display text-4xl font-bold tracking-tight font-semiwide sm:text-5xl",
                        active === item.id ? "text-shu-400" : "text-washi"
                      )}
                    >
                      <span className="text-xs font-medium tabular-nums text-washi-subtle">{String(i + 1).padStart(2, "0")}</span>
                      {item.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </nav>

            <motion.div
              className="space-y-4 border-t border-white/10 pt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.35 } }}
              exit={{ opacity: 0 }}
            >
              <a href={`mailto:${SITE.email}`} className="block break-all text-sm text-washi-muted hover:text-washi">
                {SITE.email}
              </a>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {SOCIALS.map((s) => (
                  <li key={s.id}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-washi hover:text-shu-400">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
