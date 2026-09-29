import { useState } from "react";
import { Lock } from "lucide-react";
import { cn, hostOf } from "../../lib/utils";

/** A project screenshot presented inside minimal browser chrome. */
export default function BrowserFrame({ src, alt, url, className, imgClassName, eager = false }) {
  const host = hostOf(url);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const showImage = src && !failed;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/[0.06] bg-ink-900/80 px-4 py-3">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
        </span>
        {host && (
          <span className="mx-auto flex min-w-0 max-w-[70%] items-center gap-1.5 truncate rounded-md bg-white/[0.05] px-3 py-1 text-[11px] text-washi-subtle">
            <Lock aria-hidden="true" className="h-3 w-3 shrink-0" />
            <span className="truncate">{host}</span>
          </span>
        )}
      </div>
      <div className={cn("relative aspect-[16/10] overflow-hidden", showImage && !loaded && "animate-pulse bg-white/[0.03]")}>
        {showImage ? (
          <img
            src={src}
            alt={alt}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn(
              "h-full w-full object-cover object-top transition-opacity duration-500",
              loaded ? "opacity-100" : "opacity-0",
              imgClassName
            )}
          />
        ) : (
          // No screenshot (or it failed to load): a quiet branded placeholder instead of a broken-image icon.
          <div
            role="img"
            aria-label={alt}
            className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_30%_20%,rgba(232,71,47,0.25),transparent_60%)]"
          >
            <span className="font-display text-6xl font-extrabold text-washi/15 font-wide">
              {(alt || "?").trim().charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
