import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { PenLine } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useCollection } from "../lib/useCollection";
import { withDevPreview } from "../lib/devPreview";
import { testimonialDesignation, testimonialPhoto } from "../lib/testimonials";
import { toSlug } from "../utils/slug";
import SectionHeading from "../components/ui/SectionHeading";
import CircularTestimonials from "../components/ui/CircularTestimonials";
import Reveal from "../components/ui/Reveal";
import PreviewBadge from "../components/ui/PreviewBadge";

// Testimonials come from the public form (/testimoni) and the dashboard. With none yet, the section stays hidden.
const Testimonials = () => {
  const { t } = useLanguage();
  const { data, loading } = useCollection("testimonials");
  const { data: projects } = useCollection("projects");
  const { items, isPreview } = withDevPreview("testimonials", data);

  const testimonials = useMemo(() => {
    const projectById = new Map(projects.map((p) => [p.id, p]));
    return items.map((item) => {
      const project = projectById.get(item.project_id);
      return {
        id: item.id,
        quote: item.quote || "",
        name: item.name || "",
        designation: testimonialDesignation(item, t.testimonialForm.relations),
        src: testimonialPhoto(item),
        rating: item.rating || null,
        ratingLabel: item.rating ? t.testimonialForm.ratingOutOf.replace("{value}", item.rating) : undefined,
        project: project ? { title: project.Title, href: `/project/${toSlug(project.Title)}#testimoni` } : null,
      };
    });
  }, [items, projects, t]);

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
          <CircularTestimonials testimonials={testimonials} projectLabel={t.testimonials.project} />
        </Reveal>
        <Reveal delay={0.15} className="mt-14 flex justify-center md:justify-start">
          <Link to="/testimoni" className="btn-ghost group">
            <PenLine aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12" />
            {t.testimonials.cta}
          </Link>
        </Reveal>
      </div>
    </section>
  );
};

export default memo(Testimonials);
