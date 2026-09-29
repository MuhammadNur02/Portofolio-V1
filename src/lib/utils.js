import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Joins class names and lets later Tailwind classes override earlier ones (shadcn's `cn`).
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Wraps n into [min, max) — used by the infinite marquees.
export const wrap = (min, max, n) => {
  const range = max - min;
  return ((((n - min) % range) + range) % range) + min;
};

export const hostOf = (url) => {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return "";
  }
};
