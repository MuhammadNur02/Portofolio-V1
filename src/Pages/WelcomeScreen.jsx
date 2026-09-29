import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useTransform, animate } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { markWelcomeSeen } from "../utils/welcomeSession";
import { useScrollLock } from "../lib/smoothScroll";
import { SITE } from "../config/site";

// ─── TIMING ─────────────────────────────────────────────────────────────────
// The counter tracks REAL loading of the images the site needs first, but never finishes faster
// than MIN_DURATION_MS (so the intro can play) nor waits longer than MAX_WAIT_MS on a slow network.
const MIN_DURATION_MS = 2800;
const MAX_WAIT_MS = 7000;
const HOLD_AT_100_MS = 380;
const EXIT_MS = 1250;
// ────────────────────────────────────────────────────────────────────────────

const EASE = [0.76, 0, 0.24, 1];
const NAME_LINES = ["Muhammad Nurrahman", "Juliansyah"];

const assetsToPreload = () => [
  window.innerWidth < 640 ? "/Samurai-mobile.webp" : "/Samurai-desktop.webp",
  "/Portrait.webp",
  "/Kane.webp",
  "/Torii-Gate.webp",
];

function preload(urls, onEach) {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = img.onerror = () => {
            onEach();
            resolve();
          };
          img.src = url;
        })
    )
  );
}

// Slow drifting embers — pure CSS, cheap.
const EMBERS = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 61) % 100}%`,
  delay: `${(i * 0.37) % 5}s`,
  duration: `${6 + ((i * 1.7) % 5)}s`,
  size: 2 + (i % 3),
}));

function Scene({ progress, reduce }) {
  const moonOpacity = useTransform(progress, [0, 55], [0.35, 1]);
  const moonScale = useTransform(progress, [0, 100], [0.9, 1]);
  const shadowX = useTransform(progress, [0, 100], ["0%", reduce ? "0%" : "-118%"]);
  const glow = useTransform(progress, [0, 100], [0.25, 0.8]);
  const gateY = useTransform(progress, [0, 100], ["6%", "0%"]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#050404]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,#2a0d08_0%,#0b0605_45%,#050404_75%)]" />

      {/* Blood moon, unveiled by a sliding eclipse shadow as loading progresses */}
      <div className="absolute left-1/2 top-[42%] aspect-square w-[min(66vmin,560px)] -translate-x-1/2 -translate-y-1/2">
        <motion.div
          aria-hidden="true"
          className="absolute -inset-[30%] rounded-full bg-[radial-gradient(circle,rgba(232,71,47,0.55)_0%,rgba(232,71,47,0.12)_40%,transparent_68%)]"
          style={{ opacity: glow }}
        />
        <motion.img
          src="/Blood-Moon.webp"
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full select-none rounded-full"
          style={{ opacity: moonOpacity, scale: moonScale }}
        />
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <motion.div className="absolute inset-[-2%] rounded-full bg-[#050404] blur-[10px]" style={{ x: shadowX }} />
        </div>
      </div>

      {/* Torii silhouette standing in front of the moon */}
      {/* x lives in `style`: framer-motion owns this element's transform, so a Tailwind translate would be dropped */}
      <motion.img
        src="/Torii-Gate-sm.webp"
        alt=""
        draggable={false}
        className="absolute bottom-[30%] left-1/2 w-[min(100vmin,92vw)] max-w-[980px] select-none brightness-0 sm:bottom-0"
        style={{ x: "-50%", y: gateY }}
      />
      <div className="absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-t from-black via-black/70 to-transparent" />

      {!reduce &&
        EMBERS.map((e, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="absolute bottom-[-10px] rounded-full bg-shu-400 opacity-0 shadow-[0_0_8px_2px_rgba(255,109,82,0.6)]"
            style={{
              left: e.left,
              width: e.size,
              height: e.size,
              animation: `ember-rise ${e.duration} ${e.delay} linear infinite`,
            }}
          />
        ))}
    </div>
  );
}

function Counter({ progress }) {
  const [value, setValue] = useState(0);
  useEffect(() => progress.on("change", (v) => setValue(Math.floor(v))), [progress]);
  return <span className="tabular-nums">{String(value).padStart(3, "0")}</span>;
}

// `clone` marks the copy inside the second half: visible, but hidden from screen readers and the tab order.
function Overlay({ progress, t, onSkip, clone = false }) {
  const lineScale = useTransform(progress, [0, 100], [0, 1]);
  return (
    <div
      aria-hidden={clone || undefined}
      className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 sm:p-8 lg:p-10"
    >
      <div className="flex items-start justify-between">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
        >
          <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-[6px] bg-shu-500 font-kanji text-lg font-extrabold text-white">侍</span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-[0.25em] text-washi">{SITE.shortName.toUpperCase()}</span>
            <span className="block text-[11px] tracking-[0.2em] text-washi-subtle">
              {t.welcome.tagline.toUpperCase()} © {new Date().getFullYear()}
            </span>
          </span>
        </motion.div>

        <button
          type="button"
          onClick={onSkip}
          tabIndex={clone ? -1 : undefined}
          className="pointer-events-auto rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-medium tracking-[0.25em] text-washi/90 backdrop-blur-sm transition-colors hover:border-white/50 hover:text-white"
        >
          {t.welcome.skip.toUpperCase()}
        </button>
      </div>

      <div>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-display text-[clamp(1.9rem,6.2vw,5.6rem)] font-extrabold uppercase leading-[0.92] tracking-tight text-washi font-wide">
              {NAME_LINES.map((line, li) => (
                <span key={line} className="block overflow-hidden pb-[0.06em]">
                  <motion.span
                    className="block"
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 1.1, delay: 0.35 + li * 0.14, ease: EASE }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </p>
            <motion.p
              className="mt-4 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-washi-muted sm:text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.9 }}
            >
              <span className="h-px w-10 bg-shu-500" />
              {SITE.role}
            </motion.p>
          </div>

          <div className="flex items-end justify-between gap-6 lg:flex-col lg:items-end lg:gap-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-washi-subtle lg:order-2">{t.welcome.loading}</p>
            <p className="font-display text-[clamp(3rem,11vw,8.5rem)] font-bold leading-[0.8] text-washi font-semiwide lg:order-1">
              <Counter progress={progress} />
              <span className="ml-1 align-top text-[0.3em] text-shu-400">%</span>
            </p>
          </div>
        </div>

        <div className="mt-6 h-[2px] w-full overflow-hidden bg-white/10">
          <motion.div className="h-full origin-left bg-gradient-to-r from-shu-600 via-shu-400 to-kin-400" style={{ scaleX: lineScale }} />
        </div>
        <p className="mt-3 hidden text-center text-[11px] tracking-[0.2em] text-washi-subtle sm:block">{t.welcome.hint}</p>
      </div>
    </div>
  );
}

// onReveal: the cut has started (the site underneath begins to show) · onLoadingComplete: fully gone.
const WelcomeScreen = ({ onReveal, onLoadingComplete }) => {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const progress = useMotionValue(0);
  const [phase, setPhase] = useState("loading"); // loading → exit → (unmounted by parent)
  const [slashAngle, setSlashAngle] = useState(-9);
  const callbacks = useRef({ onReveal, onLoadingComplete });
  const leavingRef = useRef(false);
  const timers = useRef([]);
  useScrollLock(true);

  useEffect(() => {
    callbacks.current = { onReveal, onLoadingComplete };
  }, [onReveal, onLoadingComplete]);

  const leave = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    markWelcomeSeen();
    callbacks.current.onReveal?.();
    // Angle of the diagonal cut for this screen's aspect ratio (it runs from 58% height on the left to 42% on the right).
    setSlashAngle((-Math.atan2(window.innerHeight * 0.16, window.innerWidth) * 180) / Math.PI);
    setPhase("exit");
    timers.current.push(setTimeout(() => callbacks.current.onLoadingComplete?.(), reduce ? 500 : EXIT_MS));
  }, [reduce]);

  const skip = useCallback(() => {
    animate(progress, 100, { duration: 0.25 });
    leave();
  }, [leave, progress]);

  // Real loading progress, eased so it never jumps.
  useEffect(() => {
    window.scrollTo(0, 0);
    const urls = assetsToPreload();
    let loaded = 0;
    let allLoaded = false;
    preload(urls, () => (loaded += 1)).then(() => (allLoaded = true));

    const start = performance.now();
    const minDuration = reduce ? 1000 : MIN_DURATION_MS;
    let raf;
    const tick = (now) => {
      if (leavingRef.current) return; // skipped: the skip animation owns the counter now
      // A frame's timestamp can predate `start` by a few ms, so clamp at 0 (else the counter shows "0-1").
      const elapsed = Math.max(0, now - start);
      const timeShare = Math.min(1, elapsed / minDuration);
      const easedTime = 1 - Math.pow(1 - timeShare, 2.2);
      const loadShare = allLoaded || elapsed > MAX_WAIT_MS ? 1 : Math.min(0.97, loaded / urls.length);
      const target = Math.min(easedTime, loadShare) * 100;
      const current = progress.get();
      const next = current + (target - current) * 0.12;
      progress.set(next > 99.6 ? 100 : next);

      if (progress.get() >= 100) {
        timers.current.push(setTimeout(leave, HOLD_AT_100_MS));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Any real key skips — but not Tab, lone modifiers, or shortcuts like Alt+Tab / Ctrl+R.
    const onKey = (e) => {
      if (e.key === "Tab" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) return;
      skip();
    };
    window.addEventListener("keydown", onKey);

    const pending = timers.current;
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      pending.forEach(clearTimeout);
    };
  }, [progress, leave, skip, reduce]);

  const exiting = phase === "exit";
  // The halves stay opaque until they are nearly off-screen, so the site never ghosts through them.
  const halfTransition = { duration: 1.0, delay: 0.28, ease: EASE, opacity: { duration: 1.0, delay: 0.28, times: [0, 0.75, 1] } };

  return (
    <div className="fixed inset-0 z-[100]" aria-busy={!exiting}>
      <style>{`
        @keyframes ember-rise {
          0% { transform: translate3d(0, 0, 0); opacity: 0; }
          10% { opacity: 0.9; }
          100% { transform: translate3d(30px, -85vh, 0); opacity: 0; }
        }
      `}</style>

      {reduce ? (
        <motion.div className="absolute inset-0" animate={{ opacity: exiting ? 0 : 1 }} transition={{ duration: 0.45 }}>
          <Scene progress={progress} reduce />
          <Overlay progress={progress} t={t} onSkip={skip} />
        </motion.div>
      ) : (
        <>
          {/* The same scene twice, clipped into two halves along a diagonal, so it can be "cut" open */}
          {[
            { clip: "polygon(0 0, 100% 0, 100% calc(42% + 1px), 0 calc(58% + 1px))", to: { y: "-62%", x: "-3%", rotate: -2 } },
            { clip: "polygon(0 58%, 100% 42%, 100% 100%, 0 100%)", to: { y: "62%", x: "3%", rotate: 2 } },
          ].map((half, i) => (
            <motion.div
              key={i}
              className="absolute inset-0"
              style={{ clipPath: half.clip }}
              animate={exiting ? { ...half.to, opacity: [1, 1, 0] } : { y: 0, x: 0, rotate: 0, opacity: 1 }}
              transition={halfTransition}
            >
              <Scene progress={progress} reduce={false} />
              <Overlay progress={progress} t={t} onSkip={skip} clone={i === 1} />
            </motion.div>
          ))}

          {/* The katana slash along the cut: rotated around the screen centre, drawn from its left end */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-[140vmax]" style={{ transform: `rotate(${slashAngle}deg)` }}>
              <motion.div
                className="h-[2px] w-full origin-left bg-white shadow-[0_0_18px_4px_rgba(255,109,82,0.9),0_0_60px_12px_rgba(232,71,47,0.5)]"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={exiting ? { scaleX: [0, 1, 1], opacity: [1, 1, 0] } : { scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.7, times: [0, 0.45, 1], ease: "easeOut" }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WelcomeScreen;
