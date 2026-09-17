import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink, ArrowRight, Sparkles } from "lucide-react";
import { toSlug } from "../utils/slug";
import { useLanguage } from "../context/LanguageContext";

const CardProject = ({ Img, Title, Description, Link: ProjectLink, id, featured = false }) => {
  const { t } = useLanguage();

  const handleLiveDemo = (e) => {
    if (!ProjectLink) {
      e.preventDefault();
      alert("Live demo link is not available");
    }
  };

  const handleDetails = (e) => {
    if (!id) {
      e.preventDefault();
      alert("Project details are not available");
    }
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  return (
    <div className="group relative w-full h-full" onMouseMove={handleMouseMove}>
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-900/90 to-stone-800/90 backdrop-blur-lg border border-white/10 shadow-2xl transition-all duration-300 hover:shadow-orange-500/20 h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-500/10 opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
          style={{
            background:
              "radial-gradient(280px circle at var(--x, 50%) var(--y, 50%), rgba(224, 35, 28,0.12), transparent 70%)",
          }}
        />

        {featured && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-medium backdrop-blur-sm">
            <Sparkles className="w-3 h-3" />
            {t.card.featured}
          </div>
        )}

        <div className="relative p-5 z-10 flex flex-col h-full">
          <div className="relative overflow-hidden rounded-lg">
            <img
              src={Img}
              alt={Title}
              className={`w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ${
                featured ? "aspect-[16/9]" : "aspect-[16/8]"
              }`}
            />
          </div>

          <div className="mt-4 space-y-3 flex-1 flex flex-col">
            <h3
              className={`font-semibold bg-gradient-to-r from-amber-200 via-orange-200 to-white bg-clip-text text-transparent ${
                featured ? "text-2xl" : "text-xl"
              }`}
            >
              {Title}
            </h3>

            <p className={`text-gray-300/80 text-sm leading-relaxed ${featured ? "line-clamp-3" : "line-clamp-2"}`}>
              {Description}
            </p>

            <div className="pt-4 mt-auto flex items-center justify-between">
              {ProjectLink ? (
                <a
                  href={ProjectLink || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLiveDemo}
                  className="inline-flex items-center space-x-2 text-orange-400 hover:text-orange-300 transition-colors duration-200"
                >
                  <span className="text-sm font-medium">{t.card.liveDemo}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <span className="text-gray-500 text-sm">
                  {t.card.demoUnavailable}
                </span>
              )}

              {id ? (
                <Link
                  to={`/project/${toSlug(Title)}`}
                  onClick={handleDetails}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/90 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  <span className="text-sm font-medium">{t.card.details}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <span className="text-gray-500 text-sm">
                  {t.card.detailsUnavailable}
                </span>
              )}
            </div>
          </div>

          <div className="absolute inset-0 border border-white/0 group-hover:border-orange-500/50 rounded-xl transition-colors duration-300 -z-50"></div>
        </div>
      </div>
    </div>
  );
};

export default CardProject;
