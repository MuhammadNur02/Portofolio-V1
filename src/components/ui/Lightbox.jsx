import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useScrollLock } from "../../lib/smoothScroll";

// Certificates and photos can be large files: show a spinner until the image has fully decoded,
// instead of letting it paint in half-loaded strips.
function LightboxImage({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative grid min-h-[40vh] min-w-[min(80vw,480px)] place-items-center">
      {!loaded && (
        <span
          role="status"
          aria-label="Loading"
          className="absolute h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-shu-500"
        />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

/**
 * Full-screen image viewer. `index` is the open item (null = closed).
 * Esc closes, ←/→ navigate, focus returns to whatever opened it.
 */
export default function Lightbox({ items, index, onClose, onIndexChange, labels }) {
  const item = index !== null && index !== undefined ? items[index] : null;
  const isOpen = Boolean(item);
  const closeRef = useRef(null);
  useScrollLock(isOpen);

  const go = useCallback(
    (step) => onIndexChange((index + step + items.length) % items.length),
    [index, items.length, onIndexChange]
  );

  // Move focus into the viewer when it opens, and hand it back to the opener when it closes.
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement;
    closeRef.current?.focus();
    return () => opener?.focus?.();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && items.length > 1) go(1);
      if (e.key === "ArrowLeft" && items.length > 1) go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, go, onClose, items.length]);

  return createPortal(
    <AnimatePresence>
      {item && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={item.caption || labels?.dialog || "Image viewer"}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-ink-950/95 p-4 backdrop-blur-md sm:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          data-lenis-prevent
        >
          <motion.figure
            key={index}
            className="relative flex max-h-full max-w-6xl flex-col items-center"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <LightboxImage src={item.src} alt={item.caption || ""} />
            {(item.caption || items.length > 1) && (
              <figcaption className="mt-4 flex w-full items-center justify-between gap-6 text-sm text-washi-muted">
                <span>{item.caption}</span>
                {items.length > 1 && (
                  <span className="tabular-nums text-washi-subtle">
                    {index + 1} / {items.length}
                  </span>
                )}
              </figcaption>
            )}
          </motion.figure>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={labels?.close || "Close"}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-ink-800/80 text-washi transition-colors hover:border-shu-500 hover:bg-shu-500"
          >
            <X className="h-5 w-5" />
          </button>

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label={labels?.prev || "Previous"}
                className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-ink-800/80 text-washi transition-colors hover:border-shu-500 hover:bg-shu-500 sm:left-6"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label={labels?.next || "Next"}
                className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-ink-800/80 text-washi transition-colors hover:border-shu-500 hover:bg-shu-500 sm:right-6"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
