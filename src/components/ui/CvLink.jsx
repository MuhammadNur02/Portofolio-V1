import { ArrowDown, ArrowUpRight } from "lucide-react";
import { SITE, isExternalCv } from "../../config/site";

/**
 * The CV button. A local PDF downloads (↓); an external link (e.g. Google Drive) opens in a new tab (↗),
 * so the icon never promises a download that isn't one.
 */
export default function CvLink({ className, children }) {
  const Icon = isExternalCv ? ArrowUpRight : ArrowDown;
  return (
    <a
      href={SITE.cvUrl}
      {...(isExternalCv ? { target: "_blank", rel: "noopener noreferrer" } : { download: true })}
      className={className}
    >
      {children}
      <Icon
        aria-hidden="true"
        className={
          isExternalCv
            ? "h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            : "h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5"
        }
      />
    </a>
  );
}
