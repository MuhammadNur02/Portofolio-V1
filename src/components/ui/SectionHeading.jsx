import Reveal from "./Reveal";
import { cn } from "../../lib/utils";

/**
 * The one heading pattern every section uses:  01 — ABOUT  /  big title  /  optional lead.
 * A large faint kanji sits behind it as a quiet Japanese signature.
 */
export default function SectionHeading({ index, eyebrow, title, lead, kanji, align = "left", className, children }) {
  const centered = align === "center";
  return (
    <div className={cn("relative", centered && "text-center", className)}>
      {kanji && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-10 select-none font-kanji text-[7rem] leading-none text-white/[0.035] sm:-top-14 sm:text-[10rem]",
            centered ? "left-1/2 -translate-x-1/2" : "-left-2 sm:-left-6"
          )}
        >
          {kanji}
        </span>
      )}

      <Reveal>
        <p
          className={cn(
            "relative flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-shu-400",
            centered && "justify-center"
          )}
        >
          <span className="tabular-nums text-washi-subtle">{index}</span>
          <span aria-hidden="true" className="h-px w-8 bg-shu-500/70" />
          {eyebrow}
        </p>
      </Reveal>

      <Reveal delay={0.08}>
        <h2
          className={cn(
            "relative mt-5 font-display text-4xl font-bold leading-[1.02] tracking-tight text-washi text-balance font-semiwide sm:text-5xl lg:text-6xl",
            centered && "mx-auto max-w-4xl"
          )}
        >
          {title}
        </h2>
      </Reveal>

      {lead && (
        <Reveal delay={0.16}>
          <p
            className={cn(
              "relative mt-5 max-w-2xl text-base leading-relaxed text-washi-muted text-pretty sm:text-lg",
              centered && "mx-auto"
            )}
          >
            {lead}
          </p>
        </Reveal>
      )}
      {children}
    </div>
  );
}
