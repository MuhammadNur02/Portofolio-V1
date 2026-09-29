import { memo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useCollection } from "../lib/useCollection";
import { withDevPreview } from "../lib/devPreview";
import SectionHeading from "../components/ui/SectionHeading";
import ExperienceTimeline from "../components/ui/ExperienceTimeline";
import PreviewBadge from "../components/ui/PreviewBadge";

// Entries come from the dashboard (Dashboard → Experience). With none yet, the section stays hidden.
const Experience = () => {
  const { t } = useLanguage();
  const { data, loading } = useCollection("experience");
  const { items, isPreview } = withDevPreview("experience", data);

  if (loading || items.length === 0) return null;

  return (
    <section id="Experience" className="section-y relative">
      <div className="container-site grid gap-14 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            {isPreview && <PreviewBadge />}
            <SectionHeading index="02" eyebrow={t.experience.eyebrow} title={t.experience.title} lead={t.experience.lead} kanji="歩" />
          </div>
        </div>
        <div className="lg:col-span-7 lg:pt-4">
          <ExperienceTimeline items={items} typeLabels={t.experience.types} />
        </div>
      </div>
    </section>
  );
};

export default memo(Experience);
