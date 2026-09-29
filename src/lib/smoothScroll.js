import { useEffect } from "react";
import Lenis from "lenis";
import { prefersReducedMotion } from "./utils";

// Lenis gives the page inertia-smoothed wheel scrolling (the feel of the Osmo parallax demo).
// It still scrolls the real window, so framer-motion's useScroll and the 3D background keep working.
let lenis = null;
let locks = 0;

export function useSmoothScroll() {
  useEffect(() => {
    if (lenis || prefersReducedMotion()) return;
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    if (locks > 0) lenis.stop();

    let raf = requestAnimationFrame(function loop(time) {
      lenis?.raf(time);
      raf = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
      lenis = null;
    };
  }, []);
}

/** Smoothly scrolls to a "#section" selector, an element, or 0 (the top). */
export function scrollToTarget(target, { offset = -72 } = {}) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (target !== 0 && !el) return;

  if (lenis) {
    lenis.scrollTo(target === 0 ? 0 : el, { offset: target === 0 ? 0 : offset, duration: 1.4 });
    return;
  }
  const top = target === 0 ? 0 : el.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

/** Freezes page scrolling while an overlay (welcome screen, mobile menu, lightbox) is open. */
export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return;
    locks += 1;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    return () => {
      locks -= 1;
      if (locks === 0) {
        lenis?.start();
        document.documentElement.style.overflow = "";
      }
    };
  }, [locked]);
}
