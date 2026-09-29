import { Link, useLocation } from "react-router-dom";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { scrollToTarget } from "../lib/smoothScroll";
import { SITE, SOCIALS } from "../config/site";
import { Hanko } from "./Navbar";

const NAV = [
  ["#About", "about"],
  ["#Portofolio", "portfolio"],
  ["#Contact", "contact"],
];

const Footer = () => {
  const { t } = useLanguage();
  const onHome = useLocation().pathname === "/";
  const year = new Date().getFullYear();

  const jump = (e, href) => {
    if (!onHome) return; // on other pages the link just navigates home
    e.preventDefault();
    scrollToTarget(href);
  };

  return (
    <footer className="relative z-10 overflow-hidden border-t border-white/[0.06] bg-ink">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 right-0 select-none font-kanji text-[18rem] leading-none text-white/[0.025] sm:text-[26rem]"
      >
        侍
      </span>

      <div className="container-site relative py-20 sm:py-24">
        <div className="flex flex-col gap-10 border-b border-white/[0.06] pb-16 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-shu-400">{t.footer.cta}</p>
            <a
              href={`mailto:${SITE.email}`}
              className="group mt-4 inline-flex items-center gap-4 font-display text-4xl font-bold tracking-tight text-washi font-semiwide sm:text-6xl"
            >
              {t.footer.ctaButton}
              <span className="grid h-12 w-12 place-items-center rounded-full bg-shu-500 text-white transition-transform duration-500 group-hover:rotate-45 sm:h-16 sm:w-16">
                <ArrowUpRight className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:gap-16">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-washi-subtle">{t.footer.navTitle}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {NAV.map(([href, key]) => (
                  <li key={href}>
                    <Link to={`/${href}`} onClick={(e) => jump(e, href)} className="text-washi-muted transition-colors hover:text-washi">
                      {t.nav[key]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-washi-subtle">{t.footer.connectTitle}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {SOCIALS.slice(0, 4).map((s) => (
                  <li key={s.id}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-washi-muted transition-colors hover:text-washi">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 pt-8 text-sm text-washi-subtle sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Hanko className="h-7 w-7 text-sm" />
            <p>
              © {year} {SITE.name}. {t.footer.rights}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <p className="hidden md:block">{t.footer.builtWith}</p>
            <button
              type="button"
              onClick={() => scrollToTarget(0)}
              className="group inline-flex items-center gap-2 text-washi-muted transition-colors hover:text-washi"
            >
              {t.footer.backToTop}
              <span className="grid h-9 w-9 place-items-center rounded-full border border-white/15 transition-colors group-hover:border-shu-500 group-hover:bg-shu-500 group-hover:text-white">
                <ArrowUp className="h-4 w-4" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
