import { memo } from "react";
import { ArrowDown } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import ParallaxScrolling from "../components/ui/ParallaxScrolling";

// The cinematic interlude before the projects: the Osmo parallax, rebuilt as a Japanese shrine.
// Back → front: shrine with blood moon · drifting fog · the title · a torii gate and hill in the foreground.
// Every image here is a normal <img> clipped to this section — the global 3D background is untouched.

const PETALS = Array.from({ length: 12 }, (_, i) => ({
  left: `${(i * 37 + 7) % 100}%`,
  delay: `${(i * 0.9) % 8}s`,
  duration: `${9 + ((i * 1.3) % 6)}s`,
  size: 6 + (i % 4) * 2,
}));

function WorksParallax() {
  const { t } = useLanguage();

  const layers = [
    {
      yPercent: 70,
      children: (
        <>
          <img
            src="/Kane.webp"
            alt=""
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute left-0 top-[-17.5%] h-[117.5%] w-full object-cover object-[50%_30%] brightness-[0.72] saturate-[1.1]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-transparent to-ink/30" />
        </>
      ),
    },
    {
      yPercent: 45,
      children: (
        <div className="absolute inset-x-0 top-[38%] h-[40%]">
          <div className="absolute -left-[10%] top-0 h-full w-[70%] animate-fog-drift rounded-[50%] bg-white/[0.07] blur-3xl" />
          <div className="absolute -right-[10%] top-[20%] h-[80%] w-[65%] animate-fog-drift rounded-[50%] bg-shu-200/[0.06] blur-3xl [animation-direction:alternate-reverse]" />
        </div>
      ),
    },
    {
      yPercent: 32,
      children: (
        // On phones the title sits above the gate; from tablet up it sits inside the gate, below the lower beam.
        <div className="absolute left-0 top-0 flex h-[100svh] w-full items-center justify-center pb-[22svh] sm:pb-0 sm:pt-[14svh]">
          <div className="text-center">
            <p className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.35em] text-washi/80 sm:text-xs">
              <span className="tabular-nums text-shu-400">03</span>
              <span aria-hidden="true" className="h-px w-8 bg-shu-500/80" />
              <span className="font-kanji text-sm tracking-[0.2em]">作品</span>
              <span aria-hidden="true" className="h-px w-8 bg-shu-500/80" />
              {t.works.kicker}
            </p>
            <h2 className="mt-4 font-display text-[19vw] font-extrabold uppercase leading-[0.85] tracking-tight text-washi drop-shadow-[0_6px_40px_rgba(0,0,0,0.65)] font-semiwide sm:text-[14vw] sm:font-wide lg:text-[11.5vw]">
              {t.works.word}
            </h2>
            <p className="mt-6 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.3em] text-washi/70">
              <ArrowDown aria-hidden="true" className="h-3.5 w-3.5 animate-bounce" />
              {t.works.hint}
            </p>
          </div>
        </div>
      ),
    },
    {
      yPercent: 22,
      className: "pointer-events-none",
      children: PETALS.map((p, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute top-[-5%] rounded-[60%_0] bg-shu-400/70"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animation: `petal-fall ${p.duration} ${p.delay} linear infinite`,
          }}
        />
      )),
    },
    {
      yPercent: 8,
      className: "pointer-events-none",
      children: (
        <>
          <img
            src="/Torii-Gate.webp"
            srcSet="/Torii-Gate-sm.webp 1000w, /Torii-Gate.webp 2000w"
            sizes="(max-width: 640px) 150vw, 115vh"
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute bottom-[13%] left-1/2 w-[min(115svh,150vw)] max-w-none -translate-x-1/2 brightness-[0.55] drop-shadow-[0_0_40px_rgba(232,71,47,0.25)]"
          />
          {/* Foreground hill the gate stands on */}
          <svg
            aria-hidden="true"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            className="absolute bottom-0 left-0 h-[24%] w-full"
          >
            <path
              fill="#060504"
              d="M0 150 C 180 110, 320 118, 470 132 S 760 92, 940 104 S 1250 140, 1440 118 L 1440 320 L 0 320 Z"
            />
          </svg>
        </>
      ),
    },
  ];

  return (
    <>
      <style>{`
        @keyframes petal-fall {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translate3d(-120px, 105vh, 0) rotate(540deg); opacity: 0; }
        }
      `}</style>
      <ParallaxScrolling layers={layers} label={t.works.kicker} />
    </>
  );
}

export default memo(WorksParallax);
