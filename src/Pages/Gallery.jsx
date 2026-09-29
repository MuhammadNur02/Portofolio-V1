import { memo, useMemo, useState } from "react";
import { Images } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useCollection } from "../lib/useCollection";
import { withDevPreview } from "../lib/devPreview";
import AnimatedMarqueeHero from "../components/ui/AnimatedMarqueeHero";
import Lightbox from "../components/ui/Lightbox";
import PreviewBadge from "../components/ui/PreviewBadge";

// Activity photos come from the dashboard (Dashboard → Gallery, backed by the `gallery` table —
// see supabase/gallery.sql). With no photos yet the section stays hidden.
const Gallery = () => {
  const { t } = useLanguage();
  const { data, loading } = useCollection("gallery");
  const { items, isPreview } = withDevPreview("gallery", data);
  const [viewer, setViewer] = useState(null);

  const images = useMemo(
    () => items.filter((p) => p.image_url).map((p) => ({ src: p.image_url, caption: p.caption || "" })),
    [items]
  );

  if (loading || images.length === 0) return null;

  return (
    <section id="Gallery" className="section-y relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 select-none font-kanji text-[10rem] leading-none text-white/[0.03] sm:text-[14rem]"
      >
        写
      </span>
      <AnimatedMarqueeHero
        tagline={`04 — ${t.gallery.eyebrow}`}
        title={t.gallery.title}
        description={t.gallery.lead}
        images={images}
        onOpen={setViewer}
        openLabel={t.gallery.openPhoto}
        cta={
          <button type="button" onClick={() => setViewer(0)} className="btn-ghost">
            <Images aria-hidden="true" className="h-4 w-4" />
            {t.gallery.cta}
          </button>
        }
      >
        {isPreview && <PreviewBadge />}
      </AnimatedMarqueeHero>

      <Lightbox items={images} index={viewer} onClose={() => setViewer(null)} onIndexChange={setViewer} labels={t.lightbox} />
    </section>
  );
};

export default memo(Gallery);
