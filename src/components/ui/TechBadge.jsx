import { Package } from "lucide-react";
import { resolveTech } from "../../lib/tech";
import { cn } from "../../lib/utils";

/** A technology pill with its brand icon; typos in the stored name are shown corrected. */
export default function TechBadge({ tech, size = "sm", className }) {
  const { name, icon: Icon, color } = resolveTech(tech);
  const Glyph = Icon || Package;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] text-washi-muted",
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm",
        className
      )}
    >
      <Glyph aria-hidden="true" className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} style={{ color: color || undefined }} />
      {name}
    </span>
  );
}
