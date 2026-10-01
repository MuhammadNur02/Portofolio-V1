import { useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useCollection } from "../lib/useCollection";
import { scrollToTarget } from "../lib/smoothScroll";
import { averageRating, testimonialDesignation, testimonialPhoto } from "../lib/testimonials";
import { toSlug } from "../utils/slug";
import { cn } from "../lib/utils";
import Stars from "./ui/Stars";
import Reveal from "./ui/Reveal";

const EASE = [0.22, 1, 0.36, 1];
const fill = (text, vars) => Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), text);
const initials = (name = "?") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

function Card({ item, isNew, t, lang, index }) {
  const reduce = useReducedMotion();
  const photo = testimonialPhoto(item);
  const date = item.created_at ? new Intl.DateTimeFormat(lang, { month: "long", year: "numeric" }).format(new Date(item.created_at)) : null;
  return (
    <motion.article
      className={cn(
        "surface relative flex h-full flex-col p-6 sm:p-7",
        isNew && "border-shu-500/60 bg-shu-500/[0.06]"
      )}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, filter: "blur(6px)", scale: isNew ? 0.94 : 1 }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, delay: isNew ? 0.5 : index * 0.06, ease: EASE }}
    >
      {isNew && (
        <>
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-px rounded-2xl ring-2 ring-shu-500"
            animate={reduce ? {} : { boxShadow: ["0 0 0 0 rgba(232,71,47,0)", "0 0 46px 4px rgba(232,71,47,0.45)", "0 0 18px 0 rgba(232,71,47,0.25)"] }}
            transition={{ duration: 2.2, delay: 0.9, ease: "easeOut" }}
          />
          <span className="absolute -top-3 left-6 rounded-full bg-shu-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-[0_8px_24px_-8px_rgba(232,71,47,0.9)]">
            {t.projectDetail.newBadge}
          </span>
        </>
      )}
      <div className="flex items-center gap-4">
        {photo ? (
          <img src={photo} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-white/15" />
        ) : (
          <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink-700 font-display text-lg font-bold text-washi">
            {initials(item.name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold text-washi font-semiwide">{item.name}</p>
          <p className="text-sm text-washi-subtle">{testimonialDesignation(item, t.testimonialForm.relations)}</p>
        </div>
      </div>
      {item.rating && (
        <Stars value={item.rating} label={fill(t.testimonialForm.ratingOutOf, { value: item.rating })} className="mt-5" />
      )}
      <blockquote className="mt-4 flex-1 whitespace-pre-line break-words text-base leading-relaxed text-washi-muted">“{item.quote}”</blockquote>
      {date && <time dateTime={item.created_at} className="mt-5 block text-xs text-washi-subtle">{date}</time>}
    </motion.article>
  );
}

/** Testimonials written for one project, newest first. Hidden while there are none. */
export default function ProjectTestimonials({ project }) {
  const { t, lang } = useLanguage();
  const location = useLocation();
  const { data } = useCollection("testimonials");
  const scrolled = useRef(false);
  const newId = location.state?.newTestimonialId;

  const items = useMemo(
    () =>
      data
        .filter((item) => item.project_id === project.id)
        .sort((a, b) => (b.id === newId) - (a.id === newId) || new Date(b.created_at) - new Date(a.created_at)),
    [data, project.id, newId]
  );

  // Arriving from the form (/project/…#testimoni): glide down to the new testimonial once it has loaded.
  useEffect(() => {
    if (scrolled.current || location.hash !== "#testimoni" || items.length === 0) return;
    scrolled.current = true;
    const id = setTimeout(() => scrollToTarget("#testimoni", { offset: -96 }), 500);
    return () => clearTimeout(id);
  }, [location.hash, items.length]);

  if (items.length === 0) return null;
  const average = averageRating(items);

  return (
    <section id="testimoni" aria-labelledby="testimoni-title" className="mt-24">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Reveal>
            <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-shu-400">
              <span aria-hidden="true" className="h-px w-8 bg-shu-500/70" />
              {t.projectDetail.reviewsEyebrow}
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 id="testimoni-title" className="mt-4 font-display text-3xl font-bold leading-tight text-washi font-semiwide sm:text-4xl">
              {t.projectDetail.reviewsTitle}
            </h2>
          </Reveal>
        </div>
        <Reveal delay={0.1} className="flex flex-wrap items-center gap-x-6 gap-y-4">
          {average && (
            <div className="flex items-center gap-3">
              <span className="font-display text-4xl font-bold text-washi">{average.value.toFixed(1)}</span>
              <div>
                <Stars value={average.value} label={fill(t.testimonialForm.ratingOutOf, { value: average.value.toFixed(1) })} />
                <p className="mt-1 text-xs text-washi-subtle">
                  {items.length === 1 ? t.projectDetail.reviewsCountOne : fill(t.projectDetail.reviewsCount, { n: items.length })}
                </p>
              </div>
            </div>
          )}
          <Link to={`/testimoni?project=${toSlug(project.Title)}`} className="btn-ghost group h-11 px-5 text-sm">
            {t.projectDetail.reviewsCta}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {items.map((item, i) => (
          <Card key={item.id} item={item} isNew={item.id === newId} t={t} lang={lang} index={i} />
        ))}
      </div>
    </section>
  );
}
