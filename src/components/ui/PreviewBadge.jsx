import { FlaskConical } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

/** Marks a section that is showing dev-only sample data (see lib/devPreview.js). */
export default function PreviewBadge() {
  const { t } = useLanguage();
  return (
    <p className="mb-8 inline-flex items-center gap-2 rounded-full border border-kin-400/30 bg-kin-400/10 px-3 py-1 text-xs font-medium text-kin-300">
      <FlaskConical aria-hidden="true" className="h-3.5 w-3.5" />
      {t.preview}
    </p>
  );
}
