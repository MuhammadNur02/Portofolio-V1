import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { cn } from "../../lib/utils";

// Port of osmosupply/parallax-scrolling (Osmo "Parallax Layers") from GSAP ScrollTrigger to framer-motion.
// Same mechanics: while the header scrolls from "top at top" to "bottom at top", every layer is
// pushed down by its own yPercent — far layers a lot, near layers barely — so they drift apart in depth.
// One change: instead of fading into solid black (Osmo's page is black), the scene is masked out at
// both ends, so it dissolves into whatever sits behind the section — here, the site's 3D backdrop.

const EDGE_MASK = "linear-gradient(to bottom, transparent 0%, #000 10%, #000 74%, transparent 96%)";

function Layer({ progress, yPercent, reduce, className, children }) {
  const y = useTransform(progress, [0, 1], ["0%", `${reduce ? 0 : yPercent}%`]);
  return (
    <motion.div className={cn("absolute inset-0 will-change-transform", className)} style={{ y }}>
      {children}
    </motion.div>
  );
}

/**
 * @param {{ yPercent: number, className?: string, children: React.ReactNode }[]} layers  back → front
 */
export default function ParallaxScrolling({ layers, className, label, children }) {
  const headerRef = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: headerRef, offset: ["start start", "end start"] });

  return (
    <section aria-label={label} className={cn("relative isolate", className)}>
      <div ref={headerRef} className="relative z-[2] flex min-h-[100svh] items-center justify-center">
        <div
          className="absolute left-0 top-0 h-[120%] w-full overflow-hidden"
          style={{ WebkitMaskImage: EDGE_MASK, maskImage: EDGE_MASK }}
        >
          {layers.map((layer, i) => (
            <Layer key={i} progress={scrollYProgress} yPercent={layer.yPercent} reduce={reduce} className={layer.className}>
              {layer.children}
            </Layer>
          ))}
        </div>
      </div>
      {/* Room for the 20% the visuals hang below the header, so they never overlap the next section */}
      <div className="relative z-[1] h-[20svh]">{children}</div>
    </section>
  );
}
