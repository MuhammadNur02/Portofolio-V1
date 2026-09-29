import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";
import LogoMarquee from "./LogoMarquee";

// Port of ravikatiyar162/hero-3 ("Animated Marquee Hero"): a tagline pill, a headline that reveals
// word by word, a description and CTA — above an endless marquee of slightly tilted photo cards.
// Adapted as a section (not a full-screen hero) with two rows drifting in opposite directions.

// A soft pulse until the photo arrives, then a fade — never an empty dark card on a slow connection.
function FadeInImage({ src }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <span aria-hidden="true" className="absolute inset-0 animate-pulse bg-white/[0.04]" />}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={cn("h-full w-full object-cover transition-opacity duration-700", loaded ? "opacity-100" : "opacity-0")}
      />
    </>
  );
}

const FADE_UP = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
};

export default function AnimatedMarqueeHero({ tagline, title, description, cta, images, onOpen, openLabel = "Open photo", className, children }) {
  const reduce = useReducedMotion();
  const words = title.split(" ");
  const rows = images.length >= 8 ? [images.filter((_, i) => i % 2 === 0), images.filter((_, i) => i % 2 === 1)] : [images, [...images].reverse()];

  const card = (image, i, clone, row) => (
    <button
      type="button"
      tabIndex={clone ? -1 : undefined}
      onClick={() => onOpen(images.indexOf(image))}
      aria-label={image.caption || `${openLabel} ${images.indexOf(image) + 1}`}
      className="group relative block aspect-[3/4] h-52 overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.9)] transition-[rotate,transform] duration-500 [rotate:var(--tilt)] hover:z-10 hover:scale-[1.04] hover:[rotate:0deg] md:h-72"
      style={{ "--tilt": `${(i + row) % 2 === 0 ? -2 : 5}deg` }}
    >
      <FadeInImage src={image.src} />
      {image.caption && (
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent p-4 pt-10 text-left text-xs font-medium text-washi opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {image.caption}
        </span>
      )}
    </button>
  );

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <motion.div
        className="container-site relative z-10 flex flex-col items-center text-center"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      >
        {children}
        <motion.p
          variants={FADE_UP}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-washi-muted backdrop-blur-sm"
        >
          {tagline}
        </motion.p>

        <h2 className="max-w-4xl font-display text-4xl font-bold tracking-tight text-washi text-balance font-semiwide sm:text-5xl lg:text-7xl">
          {words.map((word, i) => (
            <motion.span
              key={i}
              variants={
                reduce
                  ? FADE_UP
                  : {
                      hidden: { opacity: 0, y: "0.4em", filter: "blur(8px)" },
                      show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
                    }
              }
              className="inline-block"
            >
              {word}&nbsp;
            </motion.span>
          ))}
        </h2>

        <motion.p variants={FADE_UP} className="mt-6 max-w-xl text-base leading-relaxed text-washi-muted sm:text-lg">
          {description}
        </motion.p>

        {cta && (
          <motion.div variants={FADE_UP} className="mt-8">
            {cta}
          </motion.div>
        )}
      </motion.div>

      <div className="mask-fade-y relative mt-16 space-y-6 py-6">
        {rows.map((row, r) => (
          <LogoMarquee
            key={r}
            items={row}
            speed={r === 0 ? 34 : 28}
            hoverSpeed={0}
            direction={r === 0 ? "left" : "right"}
            gap="1.5rem"
            trackClassName="py-6"
            renderItem={(image, i, clone) => card(image, i, clone, r)}
          />
        ))}
      </div>
    </div>
  );
}
