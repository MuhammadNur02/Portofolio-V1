import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useCvUrl } from "../../lib/useCvUrl";

/**
 * The CV button. A PDF (uploaded from the dashboard) opens directly (↓); an external fallback link
 * (e.g. Google Drive) opens in a new tab (↗), so the icon never promises something else.
 */
export default function CvLink({ className, children }) {
  const { url, isPdf } = useCvUrl();
  const Icon = isPdf ? ArrowDown : ArrowUpRight;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <Icon
        aria-hidden="true"
        className={
          isPdf
            ? "h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5"
            : "h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        }
      />
    </a>
  );
}
