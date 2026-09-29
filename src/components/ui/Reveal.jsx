import { motion, useReducedMotion } from "framer-motion";

const EASE_OUT = [0.22, 1, 0.36, 1];

/**
 * Fades + lifts its children into place the first time they scroll into view.
 * Replaces AOS: no global init, no stale measurements when content above loads late.
 */
export default function Reveal({ as = "div", children, delay = 0, y = 28, className, once = true, amount = 0.2, ...props }) {
  const reduce = useReducedMotion();
  const Component = motion[as];

  return (
    <Component
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, amount }}
      transition={{ duration: reduce ? 0.3 : 0.9, delay, ease: EASE_OUT }}
      {...props}
    >
      {children}
    </Component>
  );
}

/** Staggers direct <RevealItem> children as the group enters the viewport. */
export function RevealGroup({ as = "div", children, className, stagger = 0.08, delay = 0, amount = 0.15, ...props }) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      {...props}
    >
      {children}
    </Component>
  );
}

export function RevealItem({ as = "div", children, className, y = 24, ...props }) {
  const reduce = useReducedMotion();
  const Component = motion[as];
  return (
    <Component
      className={className}
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y, filter: "blur(6px)" },
        show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE_OUT } },
      }}
      {...props}
    >
      {children}
    </Component>
  );
}
