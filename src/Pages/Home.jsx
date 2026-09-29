import { memo } from "react";
import { Helmet } from "react-helmet-async";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { FaGithub, FaLinkedinIn, FaInstagram } from "react-icons/fa6";
import { useLanguage } from "../context/LanguageContext";
import { useCollection } from "../lib/useCollection";
import { scrollToTarget } from "../lib/smoothScroll";
import { MARQUEE_STACK } from "../lib/tech";
import { SITE, SOCIALS, yearsOfExperience } from "../config/site";
import LogoMarquee from "../components/ui/LogoMarquee";
import CountUp from "../components/ui/CountUp";
import CvLink from "../components/ui/CvLink";

const EASE = [0.22, 1, 0.36, 1];
const SOCIAL_ICONS = { github: FaGithub, linkedin: FaLinkedinIn, instagram: FaInstagram };

// Everything in the hero waits for `ready` (the welcome screen has gone) before animating in.
const enter = (ready, delay, reduce) => ({
  initial: reduce ? { opacity: 0 } : { opacity: 0, y: 24, filter: "blur(8px)" },
  animate: ready ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined,
  transition: { duration: 0.9, delay, ease: EASE },
});

function HeadlineLine({ children, ready, delay, reduce, className }) {
  return (
    <span className="block overflow-hidden pb-[0.04em]">
      <motion.span
        className={`block ${className || ""}`}
        initial={reduce ? { opacity: 0 } : { y: "105%", rotate: 2 }}
        animate={ready ? { y: "0%", rotate: 0, opacity: 1 } : undefined}
        transition={{ duration: 1.1, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function TrustAvatars({ testimonials, label }) {
  const people = testimonials.slice(0, 4);
  return (
    <div className="flex items-center gap-4">
      <div className="flex -space-x-3">
        {people.map((p) =>
          p.avatar ? (
            <img key={p.id} src={p.avatar} alt="" className="h-10 w-10 rounded-full border-2 border-ink object-cover" />
          ) : (
            <span
              key={p.id}
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-ink-600 text-sm font-semibold text-washi"
            >
              {(p.name || "?").trim().charAt(0).toUpperCase()}
            </span>
          )
        )}
      </div>
      <div>
        <div className="flex gap-0.5" aria-label="5/5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} aria-hidden="true" className="h-4 w-4 fill-kin-400 text-kin-400" />
          ))}
        </div>
        <p className="mt-1 text-xs text-washi-muted">{label}</p>
      </div>
    </div>
  );
}

const Home = ({ ready = true }) => {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const { data: projects } = useCollection("projects");
  const { data: certificates } = useCollection("certificates");
  const { data: testimonials } = useCollection("testimonials");

  const stats = [
    { value: projects.length, label: t.hero.statProjects },
    { value: certificates.length, label: t.hero.statCertificates },
    { value: yearsOfExperience(), label: t.hero.statYears, suffix: "+" },
  ];
  const socials = SOCIALS.filter((s) => SOCIAL_ICONS[s.id]);

  return (
    <>
      <Helmet>
        <title>{`${SITE.name} — ${SITE.role}`}</title>
        <meta
          name="description"
          content="Portofolio Muhammad Nurrahman Juliansyah, AI-Assisted Fullstack Developer — aplikasi web cepat dan rapi dengan React, Next.js, dan Supabase."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE.url}/`} />
        <meta property="og:title" content={`${SITE.name} — ${SITE.role}`} />
        <meta property="og:url" content={`${SITE.url}/`} />
        <meta property="og:type" content="website" />
      </Helmet>

      <section id="Home" className="relative flex min-h-[100svh] flex-col overflow-hidden">
        {/* Legibility shading over the 3D artwork — confined to the hero */}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/45 to-transparent" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink via-ink/60 to-transparent" />

        <div className="container-site relative flex flex-1 flex-col justify-center pb-12 pt-32 sm:pt-36">
          <div className="max-w-4xl">
            {SITE.availableForWork && (
              <motion.p
                {...enter(ready, 0.1, reduce)}
                className="inline-flex items-center gap-2.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3.5 py-1.5 text-xs font-medium text-emerald-200 backdrop-blur-sm sm:text-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                {t.hero.available}
              </motion.p>
            )}

            <motion.p {...enter(ready, 0.2, reduce)} className="mt-7 flex items-center gap-3 text-sm text-washi-muted sm:text-base">
              <span aria-hidden="true" className="h-px w-10 bg-shu-500" />
              {t.hero.greeting}
            </motion.p>

            <h1 className="mt-5 font-display text-[11.5vw] font-extrabold uppercase leading-[0.88] tracking-tight text-washi font-semiwide sm:text-[8.2vw] sm:font-wide lg:text-[7vw] 2xl:text-[7.5rem]">
              <span className="sr-only">{SITE.name} — </span>
              <HeadlineLine ready={ready} delay={0.3} reduce={reduce}>
                {t.hero.titleA}
              </HeadlineLine>
              <HeadlineLine ready={ready} delay={0.42} reduce={reduce} className="text-shu-500">
                {t.hero.titleB}
              </HeadlineLine>
            </h1>

            <motion.p
              {...enter(ready, 0.6, reduce)}
              className="mt-7 max-w-xl text-base leading-relaxed text-washi-muted text-pretty sm:text-lg"
            >
              {t.hero.sub}
            </motion.p>

            <motion.div {...enter(ready, 0.72, reduce)} className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#Portofolio"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToTarget("#Portofolio");
                }}
                className="btn-primary group"
              >
                {t.hero.ctaWork}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <CvLink className="btn-ghost group">{t.hero.ctaCv}</CvLink>
              <ul className="ml-1 flex items-center gap-1">
                {socials.map((s) => {
                  const Icon = SOCIAL_ICONS[s.id];
                  return (
                    <li key={s.id}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        className="grid h-11 w-11 place-items-center rounded-full text-washi-muted transition-colors duration-300 hover:bg-white/[0.06] hover:text-washi"
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </motion.div>

            <motion.div
              {...enter(ready, 0.85, reduce)}
              className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-6 border-t border-white/10 pt-8"
            >
              <dl className="flex gap-8 sm:gap-10">
                {stats.map((s) => (
                  <div key={s.label} className="flex flex-col-reverse gap-1">
                    <dt className="text-xs uppercase tracking-[0.16em] text-washi-subtle">{s.label}</dt>
                    <dd className="font-display text-3xl font-bold text-washi font-semiwide sm:text-4xl">
                      <CountUp value={s.value} start={ready} suffix={s.suffix} />
                    </dd>
                  </div>
                ))}
              </dl>
              {testimonials.length > 0 && <TrustAvatars testimonials={testimonials} label={t.hero.trustedBy} />}
            </motion.div>
          </div>
        </div>

        <motion.div {...enter(ready, 1, reduce)} className="relative border-t border-white/[0.06] bg-ink/40 py-6 backdrop-blur-sm">
          <p className="container-site mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-washi-subtle">{t.hero.stackLabel}</p>
          <LogoMarquee
            label={t.hero.stackLabel}
            items={MARQUEE_STACK}
            speed={36}
            hoverSpeed={8}
            gap="3.25rem"
            renderItem={(tech) => (
              <span
                className="group flex items-center gap-2.5 text-washi-subtle transition-colors duration-300 hover:text-washi"
                style={{ "--brand": tech.color }}
              >
                <tech.icon aria-hidden="true" className="h-6 w-6 transition-colors duration-300 group-hover:text-[color:var(--brand)]" />
                <span className="whitespace-nowrap text-sm font-medium">{tech.name}</span>
              </span>
            )}
          />
        </motion.div>

        <div aria-hidden="true" className="absolute bottom-40 right-6 hidden flex-col items-center gap-3 lg:flex xl:right-10">
          <span className="text-[10px] uppercase tracking-[0.3em] text-washi-subtle [writing-mode:vertical-rl]">{t.hero.scroll}</span>
          <span className="relative h-16 w-px overflow-hidden bg-white/10">
            <span className="absolute inset-0 animate-scroll-cue bg-shu-500" />
          </span>
        </div>
      </section>
    </>
  );
};

export default memo(Home);
