import { Star } from "lucide-react";
import { cn } from "../../lib/utils";

/** Read-only star rating. Averages are shown to the nearest half star. */
export default function Stars({ value, label, className, starClassName = "h-4 w-4", emptyClassName = "text-white/20" }) {
  return (
    <span role="img" aria-label={label} className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.round(Math.max(0, Math.min(1, value - n + 1)) * 2) / 2; // 0, 0.5 or 1
        return (
          <span key={n} className={cn("relative inline-block shrink-0", starClassName)}>
            <Star aria-hidden="true" className={cn("absolute inset-0 h-full w-full", emptyClassName)} />
            {fill > 0 && (
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star aria-hidden="true" className={cn("fill-kin-400 text-kin-400", starClassName)} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
