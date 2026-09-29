import { memo, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useCollection } from "../lib/useCollection";
import { withDevPreview } from "../lib/devPreview";
import SectionHeading from "../components/ui/SectionHeading";
import CircularTestimonials from "../components/ui/CircularTestimonials";
import Reveal from "../components/ui/Reveal";
import PreviewBadge from "../components/ui/PreviewBadge";

// Testimonials come from the dashboard (Dashboard → Testimonials). With none yet, the section stays hidden.
const Testimonials = () => {
  const { t } = useLanguage();
  const { data, loading } = useCollection("testimonials");
  const { items, isPreview } = withDevPreview("testimonials", data);

  const testimonials = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        quote: item.quote || "",
        name: item.name || "",
        designation: item.role || "",
        src: item.avatar || null,
      })),
    [items]
  );

  if (loading || testimonials.length === 0) return null;

  return (
    <section id="Testimonials" className="section-y relative overflow-hidden">
      {/* Section-scoped backdrop: the shrine artwork, heavily shaded, confined to this section's box
          and masked at the top and bottom so it melts into its neighbours instead of ending on a hard line */}
      <div aria-hidden="true" className="mask-fade-y absolute inset-0">
        <img src="/Kane.webp" alt="" loading="lazy" decoding="async" className="h-full w-full object-cover opacity-25 blur-[2px]" />
        <div className="absolute inset-0 bg-ink/55" />
      </div>

      <div className="container-site relative">
        {isPreview && <PreviewBadge />}
        <SectionHeading index="05" eyebrow={t.testimonials.eyebrow} title={t.testimonials.title} kanji="声" />
        <Reveal delay={0.1} className="mt-16 sm:mt-20">
          <CircularTestimonials testimonials={testimonials} />
        </Reveal>
      </div>
    </section>
  );
};

export default memo(Testimonials);
