import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, Camera, Check, Loader2, PenLine, RotateCcw, Star } from "lucide-react";
import { supabase } from "../supabase";
import { useLanguage } from "../context/LanguageContext";
import { refreshCollection, useCollection } from "../lib/useCollection";
import { cropToSquare } from "../lib/avatarCrop";
import { scrollToTarget } from "../lib/smoothScroll";
import { LIMITS, PHOTO_BUCKET, RELATIONS, serverErrorKey, testimonialDesignation, toSubmission, validateTestimonial } from "../lib/testimonials";
import { toSlug } from "../utils/slug";
import { cn } from "../lib/utils";
import { SITE } from "../config/site";
import { LanguageToggle } from "../components/Navbar";
import BrandMark from "../components/ui/BrandMark";
import EmaCard from "../components/ui/EmaCard";

const EASE = [0.22, 1, 0.36, 1];
const COOLDOWN_MS = 30_000;
const LAST_SENT_KEY = "testimonialLastSentAt";
const REDIRECT_SECONDS = 7;
const EMPTY = { name: "", relation: "", relationOther: "", institution: "", projectId: "", rating: 0, quote: "", consent: false, honey: "" };

// The element to move focus to for each kind of error, in the order the form asks for them.
const FIELD_FOCUS = [
  ["name", "tf-name"],
  ["relation", "tf-relation"],
  ["institution", "tf-institution"],
  ["project", "tf-project"],
  ["rating", "tf-rating"],
  ["quote", "tf-quote"],
  ["photo", "tf-photo"],
  ["consent", "tf-consent"],
];

const readLastSent = () => {
  try {
    return Number(localStorage.getItem(LAST_SENT_KEY)) || 0;
  } catch {
    return 0;
  }
};
const writeLastSent = () => {
  try {
    localStorage.setItem(LAST_SENT_KEY, String(Date.now()));
  } catch {
    /* storage unavailable — the server's own limit still applies */
  }
};
const fill = (text, vars) => Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), text);

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-washi placeholder:text-washi-subtle/70 transition-[border-color,box-shadow,background-color] duration-300 hover:border-white/20 focus:border-shu-500 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-shu-500/15 aria-[invalid=true]:border-shu-500/70";

function FieldError({ id, message }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          id={id}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-1.5 overflow-hidden pt-2 text-sm text-shu-300"
        >
          <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/** A numbered step whose number turns into a check once everything in it is filled in. */
function Step({ index, title, done, last, children }) {
  const reduce = useReducedMotion();
  return (
    <motion.fieldset
      className="relative grid grid-cols-[2.5rem_1fr] gap-x-4 sm:gap-x-6"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <div className="relative flex flex-col items-center">
        <span
          className={cn(
            "relative z-10 grid h-10 w-10 place-items-center rounded-full border text-sm font-semibold tabular-nums transition-colors duration-500",
            done ? "border-shu-500 bg-shu-600 text-white shadow-[0_0_24px_-4px_rgba(232,71,47,0.8)]" : "border-white/15 bg-ink-800 text-washi-subtle"
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {done ? (
              <motion.span key="done" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                <Check aria-hidden="true" className="h-5 w-5" />
              </motion.span>
            ) : (
              <motion.span key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {String(index).padStart(2, "0")}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        {!last && (
          <span aria-hidden="true" className="relative mt-2 w-px flex-1 overflow-hidden bg-white/10">
            <motion.span className="absolute inset-0 origin-top bg-gradient-to-b from-shu-500 to-shu-500/20" initial={false} animate={{ scaleY: done ? 1 : 0 }} transition={{ duration: 0.7, ease: EASE }} />
          </span>
        )}
      </div>
      <div className={cn("min-w-0", last ? "pb-2" : "pb-14")}>
        <legend className="float-left w-full pt-2 font-display text-xl font-bold text-washi font-semiwide sm:text-2xl">
          {title}
          {done && <span className="sr-only"> ✓</span>}
        </legend>
        <div className="clear-left pt-6">{children}</div>
      </div>
    </motion.fieldset>
  );
}

function RelationPicker({ value, other, onChange, onOtherChange, t, error }) {
  const options = [...RELATIONS, "other"];
  return (
    <div>
      <p id="tf-relation-label" className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-washi-subtle">
        {t.relationLabel}
      </p>
      <LayoutGroup id="relation">
        <div role="radiogroup" aria-labelledby="tf-relation-label" aria-describedby={error ? "tf-relation-error" : undefined} className="flex flex-wrap gap-2">
          {options.map((key, i) => {
            const active = value === key;
            return (
              <label key={key} className="relative cursor-pointer">
                <input
                  id={i === 0 ? "tf-relation" : undefined}
                  type="radio"
                  name="relation"
                  value={key}
                  checked={active}
                  onChange={() => onChange(key)}
                  aria-invalid={Boolean(error) && !value}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "relative z-10 flex h-11 items-center rounded-full border px-5 text-sm font-medium transition-colors duration-300",
                    "peer-focus-visible:ring-2 peer-focus-visible:ring-shu-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ink",
                    active ? "border-transparent text-white" : "border-white/12 text-washi-muted hover:border-white/30 hover:text-washi"
                  )}
                >
                  {active && (
                    <motion.span layoutId="relation-pill" className="absolute inset-0 -z-10 rounded-full bg-shu-600 shadow-[0_8px_30px_-8px_rgba(232,71,47,0.8)]" transition={{ type: "spring", stiffness: 450, damping: 34 }} />
                  )}
                  {t.relations[key]}
                </span>
              </label>
            );
          })}
        </div>
      </LayoutGroup>
      <AnimatePresence initial={false}>
        {value === "other" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <label htmlFor="tf-relation-other" className="mb-2 mt-5 block text-xs font-medium uppercase tracking-[0.16em] text-washi-subtle">
              {t.otherLabel}
            </label>
            <input
              id="tf-relation-other"
              value={other}
              onChange={(e) => onOtherChange(e.target.value)}
              placeholder={t.otherPlaceholder}
              maxLength={LIMITS.relation[1]}
              aria-invalid={error === "relationOther"}
              className={cn(inputClass, "h-12")}
              autoFocus
            />
          </motion.div>
        )}
      </AnimatePresence>
      <FieldError id="tf-relation-error" message={error && t.errors[error]} />
    </div>
  );
}

function ProjectPicker({ projects, value, onChange, t, error }) {
  return (
    <div>
      <div role="radiogroup" aria-label={t.steps.project} aria-describedby={error ? "tf-project-error" : "tf-project-hint"} className="grid gap-3 sm:grid-cols-2">
        {projects.map((p, i) => {
          const active = String(p.id) === String(value);
          return (
            <label key={p.id} className="group relative cursor-pointer">
              <input
                id={i === 0 ? "tf-project" : undefined}
                type="radio"
                name="project"
                value={p.id}
                checked={active}
                onChange={() => onChange(String(p.id))}
                aria-invalid={Boolean(error)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white/[0.02] transition-all duration-300",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-shu-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ink",
                  active
                    ? "border-shu-500 shadow-[0_18px_50px_-18px_rgba(232,71,47,0.75)]"
                    : "border-white/10 hover:-translate-y-0.5 hover:border-white/25"
                )}
              >
                <span className="relative block aspect-[16/9] overflow-hidden bg-ink-800">
                  {p.Img && (
                    <img
                      src={p.Img}
                      alt=""
                      loading="lazy"
                      className={cn("h-full w-full object-cover object-top transition-transform duration-700", active ? "scale-105" : "group-hover:scale-105")}
                    />
                  )}
                  <span className={cn("absolute inset-0 transition-colors duration-300", active ? "bg-shu-600/10" : "bg-ink/35 group-hover:bg-ink/15")} />
                  <AnimatePresence>
                    {active && (
                      <motion.span
                        className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-shu-600 text-white shadow-lg"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      >
                        <Check aria-hidden="true" className="h-4 w-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className={cn("block px-4 py-3.5 text-sm font-medium leading-snug transition-colors", active ? "text-washi" : "text-washi-muted")}>{p.Title}</span>
              </span>
            </label>
          );
        })}
      </div>
      <p id="tf-project-hint" className="mt-3 text-sm text-washi-subtle">
        {t.projectHint}
      </p>
      <FieldError id="tf-project-error" message={error && t.errors[error]} />
    </div>
  );
}

function StarRating({ value, onChange, t, error }) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div>
      <p id="tf-rating-label" className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-washi-subtle">
        {t.ratingLabel}
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div role="radiogroup" aria-labelledby="tf-rating-label" aria-describedby={error ? "tf-rating-error" : undefined} className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="relative cursor-pointer p-1" onMouseEnter={() => setHover(n)}>
              <input
                id={n === 1 ? "tf-rating" : undefined}
                type="radio"
                name="rating"
                value={n}
                checked={value === n}
                onChange={() => onChange(n)}
                aria-label={fill(t.starLabel, { n })}
                aria-invalid={Boolean(error)}
                className="peer sr-only"
              />
              <motion.span
                key={value >= n ? `on-${value}` : "off"}
                className="block rounded-lg peer-focus-visible:ring-2 peer-focus-visible:ring-shu-400"
                initial={value >= n && !reduce ? { scale: 0.5, rotate: -25 } : false}
                animate={{ scale: 1, rotate: 0 }}
                whileHover={reduce ? undefined : { scale: 1.15 }}
                whileTap={reduce ? undefined : { scale: 0.9 }}
                transition={{ type: "spring", stiffness: 600, damping: 14, delay: value >= n ? (n - 1) * 0.05 : 0 }}
              >
                <Star
                  aria-hidden="true"
                  className={cn(
                    "h-9 w-9 transition-colors duration-200 sm:h-10 sm:w-10",
                    shown >= n ? "fill-kin-400 text-kin-400 drop-shadow-[0_0_12px_rgba(224,185,100,0.55)]" : "text-white/20"
                  )}
                />
              </motion.span>
            </label>
          ))}
        </div>
        <div aria-live="polite" className="min-w-[9rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={shown}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className={cn("font-display text-lg font-semibold font-semiwide", shown ? "text-kin-300" : "text-washi-subtle")}
            >
              {shown ? t.ratingWords[shown - 1] : t.ratingPrompt}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
      <FieldError id="tf-rating-error" message={error && t.errors[error]} />
    </div>
  );
}

function QuoteField({ value, onChange, t, error }) {
  const length = value.trim().length;
  const missing = Math.max(0, LIMITS.quote[0] - length);
  const progress = Math.min(1, length / LIMITS.quote[0]);
  return (
    <div className="mt-10">
      <label htmlFor="tf-quote" className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-washi-subtle">
        {t.quoteLabel}
      </label>
      <textarea
        id="tf-quote"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.quotePlaceholder}
        maxLength={LIMITS.quote[1]}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "tf-quote-error tf-quote-count" : "tf-quote-count"}
        className={cn(inputClass, "min-h-[170px] resize-y py-3.5 leading-relaxed")}
      />
      <div className="mt-2.5 flex items-center gap-3">
        <span aria-hidden="true" className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <motion.span
            className={cn("absolute inset-y-0 left-0 rounded-full", missing ? "bg-shu-500" : "bg-kin-400")}
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          />
        </span>
        <span id="tf-quote-count" className={cn("text-xs tabular-nums transition-colors", missing ? "text-washi-subtle" : "text-kin-300")}>
          {missing ? fill(t.quoteMin, { n: missing }) : t.quoteOk} · {value.length}/{LIMITS.quote[1]}
        </span>
      </div>
      <FieldError id="tf-quote-error" message={error && t.errors[error]} />
    </div>
  );
}

function PhotoPicker({ photo, busy, onPick, t, error }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
      <div className="relative h-32 w-32 shrink-0">
        <AnimatePresence mode="popLayout" initial={false}>
          {photo ? (
            <motion.img
              key={photo.url}
              src={photo.url}
              alt=""
              className="absolute inset-0 h-full w-full rounded-full object-cover ring-2 ring-shu-500/60 ring-offset-4 ring-offset-ink"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 340, damping: 22 }}
            />
          ) : (
            <motion.span
              key="empty"
              className={cn("absolute inset-0 grid place-items-center rounded-full border-2 border-dashed", error ? "border-shu-500/70 text-shu-300" : "border-white/20 text-washi-subtle")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {busy ? <Loader2 aria-hidden="true" className="h-8 w-8 animate-spin" /> : <Camera aria-hidden="true" className="h-9 w-9" />}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="min-w-0">
        <input
          id="tf-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            onPick(e.target.files[0]);
            e.target.value = "";
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "tf-photo-error tf-photo-hint" : "tf-photo-hint"}
          className="peer sr-only"
        />
        <label
          htmlFor="tf-photo"
          className="btn-ghost cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-shu-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ink"
        >
          {busy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Camera aria-hidden="true" className="h-4 w-4" />}
          {busy ? t.photoProcessing : photo ? t.photoChange : t.photoChoose}
        </label>
        <p id="tf-photo-hint" className="mt-3 max-w-sm text-sm text-washi-subtle">
          {t.photoHint}
        </p>
        <FieldError id="tf-photo-error" message={error && t.errors[error]} />
      </div>
    </div>
  );
}

function Countdown({ seconds, total }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 -rotate-90">
      <circle cx="12" cy="12" r={r} fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="2.5" />
      <motion.circle
        cx="12"
        cy="12"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: c }}
        transition={{ duration: total, ease: "linear" }}
      />
      <title>{seconds}</title>
    </svg>
  );
}

function Success({ result, ema, t, onAnother }) {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const headingRef = useRef(null);
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);
  const [redirecting, setRedirecting] = useState(true);
  const target = `/project/${result.slug}#testimoni`;
  const go = () => navigate(target, { state: { newTestimonialId: result.id } });

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    // Fetch the project page's code during the countdown, so the move there is instant even on a slow phone network.
    import("../components/ProjectDetail");
  }, []);

  useEffect(() => {
    if (!redirecting) return;
    if (seconds <= 0) {
      navigate(target, { state: { newTestimonialId: result.id } });
      return;
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [redirecting, seconds, navigate, target, result.id]);

  const title = fill(t.success.title, { name: result.firstName });
  // Phones: heading, then the plaque being stamped, then the buttons. Desktop: words left, plaque right.
  return (
    <div className="grid gap-x-20 gap-y-10 lg:grid-cols-2 lg:grid-rows-[1fr_auto_auto_1fr] lg:gap-y-0">
      <div className="lg:col-start-1 lg:row-start-2">
        <motion.p
          className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-shu-400"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9, ease: EASE }}
        >
          <span aria-hidden="true" className="h-px w-8 bg-shu-500/70" />
          {t.success.eyebrow}
        </motion.p>
        <h1 ref={headingRef} tabIndex={-1} className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-washi outline-none font-semiwide sm:text-5xl">
          {title.split(" ").map((word, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, delay: 1 + i * 0.07, ease: EASE }}
            >
              {word}&nbsp;
            </motion.span>
          ))}
        </h1>
      </div>
      <div className="lg:col-start-1 lg:row-start-3 lg:pt-5">
        <motion.p
          className="max-w-md text-lg leading-relaxed text-washi-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.5 }}
        >
          {t.success.text}
        </motion.p>
        <motion.div
          className="mt-9 flex flex-wrap items-center gap-3"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.7, ease: EASE }}
        >
          <button type="button" onClick={go} className="btn-primary group">
            {t.success.cta}
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button type="button" onClick={onAnother} className="btn-ghost">
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            {t.success.another}
          </button>
        </motion.div>
        <AnimatePresence>
          {redirecting && (
            <motion.p
              className="mt-6 flex items-center gap-3 text-sm text-washi-subtle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 1.9 } }}
              exit={{ opacity: 0 }}
            >
              <span className="text-shu-400">
                <Countdown seconds={seconds} total={REDIRECT_SECONDS} />
              </span>
              <span aria-live="off">{fill(t.success.redirecting, { s: seconds })}</span>
              <button type="button" onClick={() => setRedirecting(false)} className="underline decoration-white/30 underline-offset-4 hover:text-washi">
                {t.success.stay}
              </button>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <motion.div
        className="row-start-2 lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:self-center"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: -60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0.3 } : { type: "spring", stiffness: 120, damping: 14 }}
      >
        <EmaCard {...ema} stamped />
      </motion.div>
    </div>
  );
}

export default function TestimonialForm() {
  const { t: all, lang } = useLanguage();
  const t = all.testimonialForm;
  const reduce = useReducedMotion();
  const [params] = useSearchParams();
  const { data: projects } = useCollection("projects");

  const [values, setValues] = useState(EMPTY);
  const [photo, setPhoto] = useState(null); // { blob, url }
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [phase, setPhase] = useState("form"); // form | uploading | saving | success
  const [serverError, setServerError] = useState("");
  const [result, setResult] = useState(null);
  const [shake, setShake] = useState(0);
  const photoUrlRef = useRef(null);

  const set = (key) => (value) => setValues((v) => ({ ...v, [key]: value }));

  useEffect(() => () => photoUrlRef.current && URL.revokeObjectURL(photoUrlRef.current), []);

  // A link like /testimoni?project=web-kampus-prodi-informatika-unisvet arrives with that project chosen.
  useEffect(() => {
    const slug = params.get("project");
    if (!slug || values.projectId) return;
    const match = projects.find((p) => toSlug(p.Title) === slug);
    if (match) setValues((v) => ({ ...v, projectId: String(match.id) }));
  }, [projects, params, values.projectId]);

  const pickPhoto = async (file) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setPhotoError("photoType");
    if (file.size > LIMITS.photoBytes) return setPhotoError("photoSize");
    setPhotoError("");
    setPhotoBusy(true);
    try {
      const blob = await cropToSquare(file, 512);
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
      photoUrlRef.current = URL.createObjectURL(blob);
      setPhoto({ blob, url: photoUrlRef.current });
    } catch {
      setPhotoError("photoType");
    } finally {
      setPhotoBusy(false);
    }
  };

  const errors = useMemo(() => validateTestimonial({ ...values, photo: photo?.blob }), [values, photo]);
  const visible = (key) => (showErrors ? errors[key] : undefined);
  const stepsDone = {
    you: !errors.name && !errors.relation && !errors.institution,
    project: !errors.project,
    review: !errors.rating && !errors.quote,
    photo: !errors.photo,
  };

  const project = projects.find((p) => String(p.id) === String(values.projectId));
  const relationForDisplay = values.relation === "other" ? values.relationOther.trim() : values.relation;
  const ema = {
    name: values.name.trim(),
    designation: relationForDisplay ? testimonialDesignation({ relation: relationForDisplay, role: values.institution.trim() }, t.relations) : values.institution.trim(),
    rating: values.rating,
    quote: values.quote.trim(),
    photo: photo?.url,
    project: project?.Title,
    date: new Intl.DateTimeFormat(lang, { month: "long", year: "numeric" }).format(new Date()),
    placeholders: { name: t.previewName, quote: t.previewQuote, project: t.previewProject },
    projectLabel: all.testimonials.project,
    ratingLabel: values.rating ? fill(t.ratingOutOf, { value: values.rating }) : undefined,
  };

  const busy = phase === "uploading" || phase === "saving";

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (values.honey) return; // filled by a bot: send nothing
    setShowErrors(true);
    setServerError("");
    const first = FIELD_FOCUS.find(([key]) => errors[key]);
    if (first) {
      setShake((n) => n + 1);
      const el = document.getElementById(first[1]);
      if (el) {
        scrollToTarget(el.closest("fieldset") || el, { offset: -110 });
        setTimeout(() => el.focus({ preventScroll: true }), 450);
      }
      return;
    }
    if (Date.now() - readLastSent() < COOLDOWN_MS) return setServerError("cooldown");

    try {
      setPhase("uploading");
      const ext = photo.blob.type === "image/webp" ? "webp" : "jpg";
      const path = `form/${crypto.randomUUID()}.${ext}`;
      const upload = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, photo.blob, { contentType: photo.blob.type, cacheControl: "31536000", upsert: false });
      if (upload.error) throw new Error("invalid_photo");

      setPhase("saving");
      const { data: id, error } = await supabase.rpc("submit_testimonial", toSubmission(values, path));
      if (error) throw error;

      writeLastSent();
      refreshCollection("testimonials");
      setResult({ id, slug: toSlug(project.Title), firstName: values.name.trim().split(/\s+/)[0] });
      setPhase("success");
      scrollToTarget(0);
    } catch (err) {
      setPhase("form");
      setServerError(serverErrorKey(err));
    }
  };

  // Reviewing another project: who you are and your photo stay, the review itself starts fresh.
  const another = () => {
    setValues((v) => ({ ...v, projectId: "", rating: 0, quote: "", consent: false }));
    setShowErrors(false);
    setServerError("");
    setResult(null);
    setPhase("form");
    scrollToTarget(0);
  };

  const errorCount = showErrors ? Object.keys(errors).length : 0;

  return (
    <>
      <Helmet>
        <title>{`${t.metaTitle} — ${SITE.name}`}</title>
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={`${SITE.url}/testimoni`} />
      </Helmet>

      <div className="relative min-h-screen overflow-hidden bg-ink/80">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(ellipse_at_50%_0%,rgba(232,71,47,0.16),transparent_65%)]" />
        <span aria-hidden="true" className="pointer-events-none absolute -right-10 top-24 select-none font-kanji text-[16rem] leading-none text-white/[0.025] sm:text-[24rem]">
          声
        </span>

        <div className="container-site relative pb-24 pt-8 sm:pt-10">
          <div className="flex items-center justify-between gap-4">
            <Link to="/#Testimonials" className="btn-ghost group h-11 shrink-0 px-4">
              <ArrowLeft aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              {t.back}
            </Link>
            <div className="flex shrink-0 items-center gap-3">
              <LanguageToggle />
              <Link to="/" title={SITE.name} className="hidden items-center gap-2.5 sm:flex">
                <BrandMark />
                <span className="font-display text-lg font-bold text-washi font-semiwide">
                  {SITE.shortName}
                  <span className="text-shu-500">.</span>
                </span>
              </Link>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {phase === "success" && result ? (
              <motion.section key="success" className="mt-16 sm:mt-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Success result={result} ema={ema} t={t} onAnother={another} />
              </motion.section>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20, transition: { duration: 0.35 } }}>
                <header className="mt-16 max-w-3xl sm:mt-20">
                  <motion.p
                    className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-shu-400"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: EASE }}
                  >
                    <PenLine aria-hidden="true" className="h-4 w-4" />
                    {t.eyebrow}
                  </motion.p>
                  <h1 className="mt-5 font-display text-[9.5vw] font-extrabold uppercase leading-[0.92] tracking-tight font-semiwide sm:text-6xl lg:text-7xl">
                    <span className="block overflow-hidden pb-[0.08em]">
                      <motion.span
                        className="text-shine block"
                        initial={reduce ? { opacity: 0 } : { y: "105%", rotate: 2 }}
                        animate={{ y: "0%", rotate: 0, opacity: 1 }}
                        transition={{ duration: 1.05, delay: 0.1, ease: EASE }}
                      >
                        {t.title}
                      </motion.span>
                    </span>
                  </h1>
                  <motion.p
                    className="mt-7 max-w-2xl text-base leading-relaxed text-washi-muted text-pretty sm:text-lg"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
                  >
                    {t.lead}
                  </motion.p>
                </header>

                <div className="mt-16 grid gap-14 lg:grid-cols-12 lg:gap-16">
                  <form onSubmit={submit} noValidate className="relative lg:col-span-7">
                    <input
                      type="text"
                      name="website"
                      value={values.honey}
                      onChange={(e) => set("honey")(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      className="absolute -left-[9999px] h-px w-px opacity-0"
                    />

                    <Step index={1} title={t.steps.you} done={stepsDone.you}>
                      <div className="space-y-8">
                        <div>
                          <label htmlFor="tf-name" className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-washi-subtle">
                            {t.nameLabel}
                          </label>
                          <input
                            id="tf-name"
                            value={values.name}
                            onChange={(e) => set("name")(e.target.value)}
                            placeholder={t.namePlaceholder}
                            autoComplete="name"
                            maxLength={LIMITS.name[1]}
                            aria-invalid={Boolean(visible("name"))}
                            aria-describedby={visible("name") ? "tf-name-error" : undefined}
                            className={cn(inputClass, "h-12")}
                          />
                          <FieldError id="tf-name-error" message={visible("name") && t.errors[visible("name")]} />
                        </div>
                        <RelationPicker
                          value={values.relation}
                          other={values.relationOther}
                          onChange={set("relation")}
                          onOtherChange={set("relationOther")}
                          t={t}
                          error={visible("relation")}
                        />
                        <div>
                          <label htmlFor="tf-institution" className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-washi-subtle">
                            {t.institutionLabel} <span className="normal-case tracking-normal text-washi-subtle/70">({t.optional})</span>
                          </label>
                          <input
                            id="tf-institution"
                            value={values.institution}
                            onChange={(e) => set("institution")(e.target.value)}
                            placeholder={t.institutionPlaceholder}
                            autoComplete="organization"
                            maxLength={LIMITS.institution}
                            aria-invalid={Boolean(visible("institution"))}
                            className={cn(inputClass, "h-12")}
                          />
                          <FieldError id="tf-institution-error" message={visible("institution") && t.errors[visible("institution")]} />
                        </div>
                      </div>
                    </Step>

                    <Step index={2} title={t.steps.project} done={stepsDone.project}>
                      <ProjectPicker projects={projects} value={values.projectId} onChange={set("projectId")} t={t} error={visible("project")} />
                    </Step>

                    <Step index={3} title={t.steps.review} done={stepsDone.review}>
                      <StarRating value={values.rating} onChange={set("rating")} t={t} error={visible("rating")} />
                      <QuoteField value={values.quote} onChange={set("quote")} t={t} error={visible("quote")} />
                    </Step>

                    <Step index={4} title={t.steps.photo} done={stepsDone.photo} last>
                      <PhotoPicker photo={photo} busy={photoBusy} onPick={pickPhoto} t={t} error={photoError || visible("photo")} />

                      <div className="mt-12 lg:hidden">
                        <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-washi-subtle">{t.previewLabel}</p>
                        <EmaCard {...ema} />
                      </div>

                      <label htmlFor="tf-consent" className="group mt-12 flex cursor-pointer items-start gap-3.5">
                        <input
                          id="tf-consent"
                          type="checkbox"
                          checked={values.consent}
                          onChange={(e) => set("consent")(e.target.checked)}
                          aria-invalid={Boolean(visible("consent"))}
                          aria-describedby={visible("consent") ? "tf-consent-error" : undefined}
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={cn(
                            "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors duration-200",
                            "peer-focus-visible:ring-2 peer-focus-visible:ring-shu-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ink",
                            values.consent ? "border-shu-500 bg-shu-600" : visible("consent") ? "border-shu-500/70" : "border-white/25 group-hover:border-white/45"
                          )}
                        >
                          <AnimatePresence>
                            {values.consent && (
                              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 600, damping: 22 }}>
                                <Check className="h-4 w-4 text-white" />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </span>
                        <span className="text-sm leading-relaxed text-washi-muted">{t.consent}</span>
                      </label>
                      <FieldError id="tf-consent-error" message={visible("consent") && t.errors[visible("consent")]} />

                      <div aria-live="polite" className="mt-8 space-y-3">
                        <AnimatePresence>
                          {(errorCount > 0 || serverError) && (
                            <motion.p
                              key={serverError || "summary"}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="flex items-start gap-3 rounded-xl border border-shu-500/30 bg-shu-500/10 p-4 text-sm text-shu-200"
                            >
                              <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
                              {serverError ? t.errors[serverError] : fill(t.errorSummary, { n: errorCount })}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <motion.div
                        key={shake}
                        className="mt-6"
                        animate={shake && !reduce ? { x: [0, -10, 9, -6, 4, 0] } : {}}
                        transition={{ duration: 0.45 }}
                      >
                        <button type="submit" disabled={busy} className="btn-primary group h-14 w-full px-8 text-base sm:w-auto">
                          {busy ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : <PenLine aria-hidden="true" className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-12" />}
                          {phase === "uploading" ? t.uploading : phase === "saving" ? t.saving : t.submit}
                        </button>
                      </motion.div>
                    </Step>
                  </form>

                  <aside className="hidden lg:col-span-5 lg:block">
                    <div className="sticky top-24">
                      <p className="mb-1 text-center text-xs font-medium uppercase tracking-[0.2em] text-washi-subtle">{t.previewLabel}</p>
                      <EmaCard {...ema} />
                    </div>
                  </aside>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
