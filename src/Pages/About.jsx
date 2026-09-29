import { memo, useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, Bot, Layout, Server } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useCollection } from "../lib/useCollection";
import { scrollToTarget } from "../lib/smoothScroll";
import { SITE, yearsOfExperience } from "../config/site";
import CvLink from "../components/ui/CvLink";
import SectionHeading from "../components/ui/SectionHeading";
import Reveal, { RevealGroup, RevealItem } from "../components/ui/Reveal";
import CountUp from "../components/ui/CountUp";

const PILLAR_ICONS = [Layout, Server, Bot];

function PortraitCard({ alt, since }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // The photo drifts slightly inside its frame while the page scrolls.
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-5%", "5%"]);

  return (
    <Reveal className="relative mx-auto w-full max-w-md lg:mx-0">
      <div ref={ref} className="relative">
        {/* Offset vermilion frame behind the photo */}
        <div aria-hidden="true" className="absolute inset-0 translate-x-4 translate-y-4 rounded-[28px] border border-shu-500/50" />
        <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] border border-white/10 bg-ink-800">
          <motion.img
            src="/Portrait.webp"
            alt={alt}
            loading="lazy"
            decoding="async"
            className="absolute inset-x-0 top-[-7%] h-[114%] w-full object-cover object-top"
            style={{ y }}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
            <div>
              <p className="font-display text-lg font-bold text-washi font-semiwide">{SITE.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-washi-muted">{since}</p>
            </div>
          </div>
        </div>
        {/* Hanko seal */}
        <span
          aria-hidden="true"
          className="absolute -right-3 -top-3 grid h-16 w-16 rotate-6 place-items-center rounded-lg bg-shu-500 font-kanji text-3xl font-extrabold text-white shadow-[0_12px_30px_-8px_rgba(232,71,47,0.8)] sm:-right-5"
        >
          侍
        </span>
      </div>
    </Reveal>
  );
}

const AboutPage = () => {
  const { t } = useLanguage();
  const { data: projects } = useCollection("projects");
  const { data: certificates } = useCollection("certificates");

  const stats = [
    { value: projects.length, label: t.about.statProjects },
    { value: certificates.length, label: t.about.statCertificates },
    { value: yearsOfExperience(), label: t.about.statYears, suffix: "+" },
  ];

  return (
    <section id="About" className="section-y relative" itemScope itemType="https://schema.org/Person">
      <meta itemProp="name" content={SITE.name} />
      <meta itemProp="jobTitle" content={SITE.role} />
      <div className="container-site grid items-start gap-16 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <PortraitCard alt={t.about.photoAlt} since={t.about.since} />
        </div>

        <div className="lg:col-span-7">
          <SectionHeading index="01" eyebrow={t.about.eyebrow} title={t.about.title} kanji="私" />

          <Reveal delay={0.1}>
            <p className="mt-8 max-w-2xl text-base leading-relaxed text-washi-muted text-pretty sm:text-lg">{t.about.bio}</p>
          </Reveal>

          <RevealGroup as="ul" className="mt-12 grid gap-4 sm:grid-cols-3" stagger={0.1}>
            {t.about.pillars.map((pillar, i) => {
              const Icon = PILLAR_ICONS[i];
              return (
                <RevealItem
                  as="li"
                  key={pillar.title}
                  className="surface group p-6 transition-colors duration-500 hover:border-shu-500/40"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-shu-400 transition-colors duration-500 group-hover:bg-shu-500 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-base font-semibold leading-snug text-washi font-semiwide">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-washi-muted">{pillar.text}</p>
                </RevealItem>
              );
            })}
          </RevealGroup>

          <Reveal delay={0.1}>
            <dl className="mt-12 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col-reverse gap-2 px-4 py-6 sm:px-8">
                  <dt className="text-[11px] uppercase leading-snug tracking-[0.16em] text-washi-subtle sm:text-xs">{s.label}</dt>
                  <dd className="font-display text-3xl font-bold text-washi font-semiwide sm:text-5xl">
                    <CountUp value={s.value} suffix={s.suffix} />
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.15} className="mt-10 flex flex-wrap gap-3">
            <CvLink className="btn-primary group">{t.about.downloadCV}</CvLink>
            <a
              href="#Contact"
              onClick={(e) => {
                e.preventDefault();
                scrollToTarget("#Contact");
              }}
              className="btn-ghost group"
            >
              {t.about.contact}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default memo(AboutPage);
