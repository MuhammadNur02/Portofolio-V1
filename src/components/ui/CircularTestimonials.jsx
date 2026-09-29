import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import { cn } from "../../lib/utils";

// Port of maxim.bort.devel/circular-testimonials (Namer UI) to JSX + Tailwind.
// Changes from the original: themed to the site, cards without a photo get a monogram portrait,
// autoplay pauses on hover/focus and respects reduced motion, and the arrows are labelled.

function calculateGap(width) {
  const minWidth = 1024;
  const maxWidth = 1456;
  const minGap = 60;
  const maxGap = 86;
  if (width <= minWidth) return minGap;
  if (width >= maxWidth) return Math.max(minGap, maxGap + 0.06018 * (width - maxWidth));
  return minGap + (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth));
}

const initials = (name = "?") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

function Portrait({ testimonial, style }) {
  const base = "absolute inset-0 h-full w-full rounded-3xl object-cover shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]";
  if (testimonial.src) {
    return <img src={testimonial.src} alt={testimonial.name} loading="lazy" className={base} style={style} />;
  }
  return (
    <div
      role="img"
      aria-label={testimonial.name}
      className={cn(base, "flex items-center justify-center overflow-hidden border border-white/10 bg-ink-800")}
      style={style}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(232,71,47,0.45),transparent_60%),radial-gradient(circle_at_80%_90%,rgba(224,185,100,0.18),transparent_55%)]" />
      <span aria-hidden="true" className="absolute -bottom-6 -right-2 font-kanji text-[9rem] leading-none text-white/[0.05]">
        声
      </span>
      <span className="relative font-display text-7xl font-bold text-washi font-wide">{initials(testimonial.name)}</span>
    </div>
  );
}

export default function CircularTestimonials({ testimonials, autoplay = true, interval = 6000 }) {
  const reduce = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [paused, setPaused] = useState(false);
  const imageContainerRef = useRef(null);
  const length = testimonials.length;
  const active = useMemo(() => testimonials[activeIndex % length], [activeIndex, testimonials, length]);

  useEffect(() => {
    const el = imageContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setContainerWidth(el.offsetWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleNext = useCallback(() => setActiveIndex((prev) => (prev + 1) % length), [length]);
  const handlePrev = useCallback(() => setActiveIndex((prev) => (prev - 1 + length) % length), [length]);

  useEffect(() => {
    if (!autoplay || reduce || paused || length < 2) return;
    const id = setInterval(handleNext, interval);
    return () => clearInterval(id);
  }, [autoplay, reduce, paused, length, interval, handleNext, activeIndex]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "ArrowRight") handleNext();
  };

  function getImageStyle(index) {
    const gap = calculateGap(containerWidth);
    const maxStickUp = gap * 0.8;
    const isActive = index === activeIndex;
    const isLeft = (activeIndex - 1 + length) % length === index;
    const isRight = (activeIndex + 1) % length === index;
    const transition = "all 0.8s cubic-bezier(.4,2,.3,1)";
    if (isActive) {
      return { zIndex: 3, opacity: 1, pointerEvents: "auto", transform: "translateX(0px) translateY(0px) scale(1) rotateY(0deg)", transition };
    }
    if (isLeft) {
      return {
        zIndex: 2,
        opacity: 1,
        pointerEvents: "auto",
        transform: `translateX(-${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(15deg)`,
        filter: "brightness(0.55)",
        transition,
      };
    }
    if (isRight) {
      return {
        zIndex: 2,
        opacity: 1,
        pointerEvents: "auto",
        transform: `translateX(${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(-15deg)`,
        filter: "brightness(0.55)",
        transition,
      };
    }
    return { zIndex: 1, opacity: 0, pointerEvents: "none", transition };
  }

  return (
    <div
      className="w-full"
      role="region"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="grid gap-16 md:grid-cols-2 md:gap-20">
        <div ref={imageContainerRef} className="relative mx-auto h-80 w-full max-w-sm [perspective:1000px] sm:h-96 md:max-w-none">
          {testimonials.map((testimonial, index) => (
            <Portrait key={testimonial.id ?? index} testimonial={testimonial} style={getImageStyle(index)} />
          ))}
        </div>

        <div className="flex flex-col justify-between">
          <div aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <Quote aria-hidden="true" className="mb-6 h-8 w-8 text-shu-500" />
                <h3 className="font-display text-2xl font-bold text-washi font-semiwide">{active.name}</h3>
                <p className="mt-1 text-sm text-washi-subtle">{active.designation}</p>
                <blockquote className="mt-8 text-lg leading-relaxed text-washi-muted sm:text-xl">
                  {active.quote.split(" ").map((word, i) => (
                    <motion.span
                      key={i}
                      initial={reduce ? false : { filter: "blur(10px)", opacity: 0, y: 5 }}
                      animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut", delay: 0.025 * i }}
                      className="inline-block"
                    >
                      {word}&nbsp;
                    </motion.span>
                  ))}
                </blockquote>
              </motion.div>
            </AnimatePresence>
          </div>

          {length > 1 && (
            <div className="flex items-center gap-4 pt-12 md:pt-8">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous testimonial"
                className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/[0.03] text-washi transition-colors duration-300 hover:border-shu-500 hover:bg-shu-500"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next testimonial"
                className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/[0.03] text-washi transition-colors duration-300 hover:border-shu-500 hover:bg-shu-500"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
              <span className="ml-2 text-sm tabular-nums text-washi-subtle">
                {String(activeIndex + 1).padStart(2, "0")} / {String(length).padStart(2, "0")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
