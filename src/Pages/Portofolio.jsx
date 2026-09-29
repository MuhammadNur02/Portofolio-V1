import { memo, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Award, ChevronDown, Code2, Maximize2 } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { useLanguage } from "../context/LanguageContext";
import { useCollection } from "../lib/useCollection";
import { toSlug } from "../utils/slug";
import { cn } from "../lib/utils";
import SectionHeading from "../components/ui/SectionHeading";
import Reveal, { RevealGroup, RevealItem } from "../components/ui/Reveal";
import BrowserFrame from "../components/ui/BrowserFrame";
import TechBadge from "../components/ui/TechBadge";
import Lightbox from "../components/ui/Lightbox";

const INITIAL_PROJECTS = 6;
const INITIAL_CERTIFICATES = 8;
const MAX_BADGES = 6;

const isPublicRepo = (github) => typeof github === "string" && /^https?:\/\//.test(github);

function ProjectRow({ project, index, total, t }) {
  const flipped = index % 2 === 1;
  const slug = toSlug(project.Title);
  const tech = Array.isArray(project.TechStack) ? project.TechStack : [];
  const extra = tech.length - MAX_BADGES;

  return (
    <Reveal as="article" className="grid items-center gap-8 lg:grid-cols-12 lg:gap-14" amount={0.25}>
      <Link
        to={`/project/${slug}`}
        aria-label={`${t.portfolio.caseStudy}: ${project.Title}`}
        className={cn("group relative block lg:col-span-7", flipped && "lg:order-2")}
      >
        <div
          aria-hidden="true"
          className="absolute -inset-6 rounded-[36px] bg-[radial-gradient(ellipse_at_center,rgba(232,71,47,0.18),transparent_70%)] opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100"
        />
        <BrowserFrame
          src={project.Img}
          alt={project.Title}
          url={project.Link}
          className="relative transition-transform duration-700 ease-out group-hover:-translate-y-1.5"
          imgClassName="transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
        />
      </Link>

      <div className={cn("lg:col-span-5", flipped && "lg:order-1")}>
        <p className="flex items-center gap-3 font-display text-sm font-semibold tabular-nums text-shu-400">
          {String(index + 1).padStart(2, "0")}
          <span aria-hidden="true" className="h-px w-8 bg-white/15" />
          <span className="text-washi-subtle">{String(total).padStart(2, "0")}</span>
        </p>
        <h3 className="mt-4 font-display text-2xl font-bold leading-tight tracking-tight text-washi text-balance font-semiwide sm:text-3xl">
          <Link to={`/project/${slug}`} className="transition-colors hover:text-shu-300">
            {project.Title}
          </Link>
        </h3>
        {project.Description && (
          <p className="mt-4 line-clamp-4 leading-relaxed text-washi-muted text-pretty">{project.Description}</p>
        )}

        {tech.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {tech.slice(0, MAX_BADGES).map((name, i) => (
              <li key={`${i}-${name}`}>
                <TechBadge tech={name} />
              </li>
            ))}
            {extra > 0 && (
              <li className="inline-flex items-center rounded-full border border-dashed border-white/15 px-3 py-1 text-xs text-washi-subtle">
                +{extra}
              </li>
            )}
          </ul>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium">
          <Link to={`/project/${slug}`} className="group inline-flex items-center gap-2 text-washi hover:text-shu-300">
            {t.portfolio.caseStudy}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          {project.Link && (
            <a
              href={project.Link}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-washi-muted hover:text-washi"
            >
              {t.portfolio.liveDemo}
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          )}
          {isPublicRepo(project.Github) && (
            <a
              href={project.Github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-washi-muted hover:text-washi"
            >
              <FaGithub className="h-4 w-4" />
              {t.portfolio.source}
            </a>
          )}
        </div>
      </div>
    </Reveal>
  );
}

function ToggleMore({ expanded, onClick, t }) {
  return (
    <div className="mt-14 flex justify-center">
      <button type="button" onClick={onClick} aria-expanded={expanded} className="btn-ghost group">
        {expanded ? t.portfolio.seeLess : t.portfolio.seeMore}
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", expanded && "rotate-180")} />
      </button>
    </div>
  );
}

const Portfolio = () => {
  const { t } = useLanguage();
  const { data: projects, loading } = useCollection("projects");
  const { data: certificates } = useCollection("certificates");
  const [tab, setTab] = useState("projects");
  const [allProjects, setAllProjects] = useState(false);
  const [allCertificates, setAllCertificates] = useState(false);
  const [viewer, setViewer] = useState(null);

  const tabs = [
    { id: "projects", label: t.portfolio.tabProjects, icon: Code2, count: projects.length },
    { id: "certificates", label: t.portfolio.tabCertificates, icon: Award, count: certificates.length },
  ];

  // WAI-ARIA tabs: ←/→ (and Home/End) move between tabs; only the selected tab is in the Tab order.
  const onTabKeyDown = (e) => {
    const ids = tabs.map((x) => x.id);
    const current = ids.indexOf(tab);
    const next = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: ids.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const id = ids[(next + ids.length) % ids.length];
    setTab(id);
    document.getElementById(`tab-${id}`)?.focus();
  };

  const shownProjects = allProjects ? projects : projects.slice(0, INITIAL_PROJECTS);
  const shownCertificates = allCertificates ? certificates : certificates.slice(0, INITIAL_CERTIFICATES);
  const viewerItems = useMemo(
    () => certificates.map((c, i) => ({ src: c.Img || c.img, caption: `${t.portfolio.certificate} ${i + 1}` })),
    [certificates, t]
  );

  return (
    <section id="Portofolio" className="section-y relative scroll-mt-20">
      <div className="container-site">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading index="03" eyebrow={t.portfolio.eyebrow} title={t.portfolio.title} lead={t.portfolio.lead} kanji="作" />

          <Reveal delay={0.2}>
            <div
              role="tablist"
              aria-label={t.portfolio.eyebrow}
              onKeyDown={onTabKeyDown}
              className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1"
            >
              {tabs.map(({ id, label, icon: Icon, count }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={tab === id}
                  aria-controls={tab === id ? `panel-${id}` : undefined}
                  tabIndex={tab === id ? 0 : -1}
                  onClick={() => setTab(id)}
                  className={cn(
                    "relative flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition-colors duration-300",
                    tab === id ? "text-white" : "text-washi-muted hover:text-washi"
                  )}
                >
                  {tab === id && (
                    <motion.span
                      layoutId="portfolio-tab"
                      className="absolute inset-0 -z-10 rounded-full bg-shu-600"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {label}
                  <span className={cn("text-xs tabular-nums", tab === id ? "text-white/70" : "text-washi-subtle")}>{count}</span>
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            id={`panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-20"
          >
            {tab === "projects" ? (
              <>
                {loading && projects.length === 0 ? (
                  <div className="grid animate-pulse gap-8 lg:grid-cols-12">
                    <div className="aspect-[16/10] rounded-2xl bg-white/[0.04] lg:col-span-7" />
                    <div className="space-y-4 lg:col-span-5">
                      <div className="h-8 w-2/3 rounded bg-white/[0.04]" />
                      <div className="h-24 rounded bg-white/[0.04]" />
                    </div>
                  </div>
                ) : projects.length === 0 ? (
                  <p className="surface px-6 py-16 text-center text-washi-muted">{t.portfolio.empty}</p>
                ) : (
                  <div className="space-y-24 sm:space-y-32">
                    {shownProjects.map((project, i) => (
                      <ProjectRow key={project.id} project={project} index={i} total={projects.length} t={t} />
                    ))}
                  </div>
                )}
                {projects.length > INITIAL_PROJECTS && (
                  <ToggleMore expanded={allProjects} onClick={() => setAllProjects((v) => !v)} t={t} />
                )}
              </>
            ) : (
              <>
                <RevealGroup as="ul" className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" stagger={0.06}>
                  {shownCertificates.map((cert, i) => (
                    <RevealItem as="li" key={cert.id}>
                      <button
                        type="button"
                        onClick={() => setViewer(i)}
                        aria-label={`${t.portfolio.viewCertificate} ${i + 1}`}
                        className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 bg-ink-800"
                      >
                        <img
                          src={cert.Img || cert.img}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        <span className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/90 via-ink/20 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                          <span className="flex items-center gap-2 text-sm font-medium text-washi">
                            <Maximize2 aria-hidden="true" className="h-4 w-4 text-shu-400" />
                            {t.portfolio.viewCertificate}
                          </span>
                        </span>
                      </button>
                    </RevealItem>
                  ))}
                </RevealGroup>
                {certificates.length > INITIAL_CERTIFICATES && (
                  <ToggleMore expanded={allCertificates} onClick={() => setAllCertificates((v) => !v)} t={t} />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <Lightbox items={viewerItems} index={viewer} onClose={() => setViewer(null)} onIndexChange={setViewer} labels={t.lightbox} />
    </section>
  );
};

export default memo(Portfolio);
