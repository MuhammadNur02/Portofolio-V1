import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Star, UserRound } from "lucide-react";
import { cn } from "../../lib/utils";

// An ema: the small wooden plaque visitors write a wish on and hang at a Japanese shrine. The testimonial
// form previews the visitor's words on one, and stamps and "hangs" it when the testimonial is sent.

// The roof is a fixed height, so a long testimonial makes the plaque taller, not its roof steeper.
const ROOF = "polygon(50% 0, 100% 4rem, 100% 100%, 0 100%, 0 4rem)";

// Pale hinoki wood: light from above, warmer at the foot, and two layers of fine grain.
const BOARD = [
  "radial-gradient(130% 70% at 50% 0%, rgba(255,247,228,0.6), transparent 62%)",
  "radial-gradient(120% 80% at 50% 115%, rgba(112,64,26,0.38), transparent 60%)",
  "repeating-linear-gradient(91deg, rgba(122,74,34,0.10) 0 1px, transparent 1px 7px, rgba(122,74,34,0.05) 7px 9px, transparent 9px 19px)",
  "repeating-linear-gradient(88deg, transparent 0 31px, rgba(140,88,40,0.09) 31px 33px, transparent 33px 61px)",
  "linear-gradient(180deg, #efcf9c 0%, #dfb57d 46%, #cb995e 100%)",
].join(",");
const FRAME = "linear-gradient(180deg, #a1703f 0%, #7f5431 58%, #5d3b20 100%)";

const INK = "#2b1a0e";

function Rope() {
  return (
    <svg aria-hidden="true" viewBox="0 0 80 96" className="absolute left-1/2 top-0 z-10 h-24 w-20 -translate-x-1/2 overflow-visible">
      {/* the peg it hangs from */}
      <circle cx="40" cy="7" r="6" fill="#1e1916" stroke="#3a2f29" strokeWidth="2" />
      {/* a twisted vermilion cord through the plaque's hole */}
      <path d="M36 9 C 26 40, 28 70, 35 92" fill="none" stroke="#b02d18" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M44 9 C 54 40, 52 70, 45 92" fill="none" stroke="#e8472f" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M36 9 C 26 40, 28 70, 35 92" fill="none" stroke="#ffc2b3" strokeOpacity=".35" strokeWidth="1" strokeDasharray="2 4" />
      <path d="M44 9 C 54 40, 52 70, 45 92" fill="none" stroke="#ffc2b3" strokeOpacity=".35" strokeWidth="1" strokeDasharray="2 4" />
    </svg>
  );
}

function Seal({ reduce }) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute right-[1.6rem] top-[5.2rem] z-20 grid h-16 w-16 place-items-center rounded-[11px] border-[3px] font-kanji text-[2.1rem] leading-none"
      style={{ borderColor: "rgba(198,48,26,0.9)", color: "rgba(198,48,26,0.92)", background: "rgba(214,58,34,0.07)", mixBlendMode: "multiply" }}
      initial={reduce ? { opacity: 0, rotate: -10 } : { opacity: 0, scale: 2.8, rotate: -32 }}
      animate={{ opacity: 1, scale: 1, rotate: -10 }}
      transition={reduce ? { duration: 0.3 } : { type: "spring", stiffness: 520, damping: 19, delay: 0.35 }}
    >
      侍
    </motion.div>
  );
}

/**
 * @param {{ name?: string, designation?: string, rating?: number, quote?: string, photo?: string | null,
 *           project?: string, date?: string, placeholders: { name: string, quote: string, project: string },
 *           projectLabel: string, ratingLabel?: string, stamped?: boolean, className?: string }} props
 */
export default function EmaCard({ name, designation, rating = 0, quote, photo, project, date, placeholders, projectLabel, ratingLabel, stamped = false, className }) {
  const reduce = useReducedMotion();

  // Hanging from the peg: a slow breeze while it is being written, a real swing once it is hung.
  const sway = reduce
    ? {}
    : stamped
      ? { rotate: [0, -7, 5.5, -3.5, 2, -0.8, 0], transition: { duration: 2.6, ease: "easeOut", delay: 0.55 } }
      : { rotate: [-1.4, 1.4], transition: { duration: 3.8, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" } };

  return (
    <div className={cn("relative mx-auto w-full max-w-[22rem] pt-12", className)}>
      <Rope />
      <motion.div animate={sway} style={{ transformOrigin: "50% -2.6rem" }}>
        <motion.div
          className="relative [filter:drop-shadow(0_28px_36px_rgba(0,0,0,0.55))_drop-shadow(0_0_70px_rgba(232,71,47,0.22))]"
          animate={stamped && !reduce ? { scale: [1, 0.975, 1.01, 1], y: [0, 5, -1, 0] } : {}}
          transition={{ duration: 0.45, delay: 0.42, ease: "easeOut" }}
        >
          <div className="relative p-[7px]" style={{ clipPath: ROOF, background: FRAME }}>
            <div className="relative overflow-hidden px-7 pb-8 pt-12 text-center" style={{ clipPath: ROOF, background: BOARD, color: INK }}>
              {/* the hole the cord runs through */}
              <span aria-hidden="true" className="absolute left-1/2 top-[1.15rem] h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-[#3a2414] shadow-[inset_0_2px_3px_rgba(0,0,0,0.6),0_1px_0_rgba(255,240,210,0.5)]" />
              <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 -right-6 select-none font-kanji text-[11rem] leading-none" style={{ color: "rgba(80,44,16,0.07)" }}>
                声
              </span>

              <div className="relative mx-auto mt-2 h-[4.75rem] w-[4.75rem]">
                <AnimatePresence mode="popLayout" initial={false}>
                  {photo ? (
                    <motion.img
                      key={photo}
                      src={photo}
                      alt=""
                      className="absolute inset-0 h-full w-full rounded-full object-cover shadow-[0_6px_16px_-6px_rgba(60,30,10,0.7)] ring-[3px] ring-[#7f5431]/60"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: -8 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 380, damping: 22 }}
                    />
                  ) : (
                    <motion.span
                      key="empty"
                      className="absolute inset-0 grid place-items-center rounded-full border-2 border-dashed"
                      style={{ borderColor: "rgba(80,44,16,0.35)", color: "rgba(80,44,16,0.45)" }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <UserRound aria-hidden="true" className="h-8 w-8" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <p className={cn("relative mt-4 break-words font-display text-xl font-bold leading-tight font-semiwide", !name && "opacity-45")}>
                {name || placeholders.name}
              </p>
              {designation && <p className="relative mt-1 text-xs font-medium" style={{ color: "#6e4a29" }}>{designation}</p>}

              <div className="relative mt-3 flex justify-center gap-1" role={rating ? "img" : undefined} aria-label={rating ? ratingLabel : undefined}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <motion.span
                    key={rating >= n ? `on-${rating}` : `off-${n}`}
                    initial={rating >= n && !reduce ? { scale: 0.4, rotate: -30 } : false}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 600, damping: 14, delay: (n - 1) * 0.045 }}
                  >
                    <Star
                      aria-hidden="true"
                      className="h-5 w-5"
                      style={rating >= n ? { fill: "#d63a22", color: "#b02d18" } : { color: "rgba(80,44,16,0.28)" }}
                    />
                  </motion.span>
                ))}
              </div>

              <div className="relative mx-auto mt-4 h-px w-16" style={{ background: "rgba(80,44,16,0.25)" }} />

              {quote ? (
                <p className="relative mt-4 whitespace-pre-line break-words text-[0.95rem] leading-relaxed">“{quote}”</p>
              ) : (
                <div aria-hidden="true" className="relative mt-5 space-y-2.5">
                  {["w-11/12", "w-full", "w-3/4"].map((w) => (
                    <span key={w} className={cn("mx-auto block h-2 rounded-full", w)} style={{ background: "rgba(80,44,16,0.12)" }} />
                  ))}
                  <span className="sr-only">{placeholders.quote}</span>
                </div>
              )}

              <div className="relative mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "#6b4526" }}>
                <span>{projectLabel}</span>
                <p className={cn("mt-1 font-display text-[0.8rem] normal-case tracking-normal", !project && "opacity-45")} style={{ color: INK }}>
                  {project || placeholders.project}
                </p>
              </div>
              {date && <p className="relative mt-3 text-[0.7rem] font-medium" style={{ color: "#6b4526" }}>{date}</p>}
            </div>
          </div>
          {stamped && <Seal reduce={reduce} />}
        </motion.div>
      </motion.div>
    </div>
  );
}
