import { useEffect, useRef, useState } from "react";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from "framer-motion";
import { cn, wrap } from "../../lib/utils";

/**
 * Port of grootstudio/logo-marquee: an endless horizontal track with mask-faded edges whose speed
 * eases down while hovered (instead of stopping dead), so logos stay readable without feeling frozen.
 * Generic over its items, so the gallery reuses it for rows of photos.
 */
export default function LogoMarquee({
  items,
  renderItem,
  speed = 42, // px per second
  hoverSpeed = 10,
  direction = "left",
  gap = "3rem",
  className,
  trackClassName,
  label,
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const setRef = useRef(null);
  const [setWidth, setSetWidth] = useState(0);
  const [rootWidth, setRootWidth] = useState(0);
  const currentSpeed = useRef(speed);
  const targetSpeed = useRef(speed);
  const visible = useRef(true);
  const rootRef = useRef(null);

  // Width of one copy of the items (the track loops back by exactly this much) and of the viewport strip.
  useEffect(() => {
    const set = setRef.current;
    const root = rootRef.current;
    if (!set || !root) return;
    const observer = new ResizeObserver(() => {
      setSetWidth(set.offsetWidth);
      setRootWidth(root.offsetWidth);
    });
    observer.observe(set);
    observer.observe(root);
    return () => observer.disconnect();
  }, [items]);

  // Don't spend frames on a marquee that is scrolled out of view.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => (visible.current = entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (reduce || !setWidth || !visible.current) return;
    const dt = Math.min(delta, 64) / 1000;
    currentSpeed.current += (targetSpeed.current - currentSpeed.current) * Math.min(1, dt * 4);
    const step = currentSpeed.current * dt * (direction === "left" ? -1 : 1);
    x.set(wrap(-setWidth, 0, x.get() + step));
  });

  // Enough copies to cover the strip even at the far end of a loop — a few photos on a wide screen
  // would otherwise leave a gap trailing behind the last one.
  const copies = reduce ? 1 : setWidth ? Math.max(2, Math.ceil(rootWidth / setWidth) + 1) : 2;

  return (
    <div
      ref={rootRef}
      aria-label={label}
      role={label ? "region" : undefined}
      className={cn("relative overflow-hidden", !reduce && "mask-fade-x", className)}
      onMouseEnter={() => (targetSpeed.current = hoverSpeed)}
      onMouseLeave={() => (targetSpeed.current = speed)}
      onFocus={() => (targetSpeed.current = 0)}
      onBlur={() => (targetSpeed.current = speed)}
    >
      <motion.div className={cn("flex w-max", reduce && "w-full flex-wrap justify-center")} style={{ x }}>
        {Array.from({ length: copies }).map((_, copy) => (
          <ul
            key={copy}
            ref={copy === 0 ? setRef : undefined}
            aria-hidden={copy > 0 || undefined}
            className={cn("flex shrink-0 items-center", reduce && "flex-wrap justify-center", trackClassName)}
            style={{ gap, paddingRight: reduce ? 0 : gap }}
          >
            {items.map((item, i) => (
              <li key={i} className="shrink-0">
                {renderItem(item, i, copy > 0)}
              </li>
            ))}
          </ul>
        ))}
      </motion.div>
    </div>
  );
}
