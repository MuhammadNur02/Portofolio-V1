import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Check, ChevronRight, Code2, Compass, Layers, Lock, Target, TrendingUp, User } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { supabase } from "../supabase";
import { toSlug } from "../utils/slug";
import { useLanguage } from "../context/LanguageContext";
import { SITE } from "../config/site";
import { Hanko, LanguageToggle } from "./Navbar";
import BrowserFrame from "./ui/BrowserFrame";
import TechBadge from "./ui/TechBadge";
import Reveal, { RevealGroup, RevealItem } from "./ui/Reveal";

const EASE = [0.22, 1, 0.36, 1];
const isPublicRepo = (github) => typeof github === "string" && /^https?:\/\//.test(github);

const normalize = (p) => ({
  ...p,
  Features: Array.isArray(p.Features) ? p.Features.filter(Boolean) : [],
  TechStack: Array.isArray(p.TechStack) ? p.TechStack.filter(Boolean) : [],
});

function TopBar({ t, title }) {
  const navigate = useNavigate();
  const location = useLocation();
  // "default" = this is the first page of the visit (opened from a shared link or a search result):
  // going "back" would leave the site, so go to the projects section instead.
  const goBack = () => (location.key === "default" ? navigate("/#Portofolio") : navigate(-1));

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={goBack} className="btn-ghost group h-11 shrink-0 px-4">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          {t.projectDetail.back}
        </button>
        {title && (
          <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-2 text-sm text-washi-subtle md:flex">
            <Link to="/#Portofolio" className="hover:text-washi">
              {t.projectDetail.projects}
            </Link>
            <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="truncate text-washi-muted">{title}</span>
          </nav>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <LanguageToggle />
        <Link to="/" title={SITE.name} className="hidden items-center gap-2.5 sm:flex">
          <Hanko />
          <span className="font-display text-lg font-bold text-washi font-semiwide">
            {SITE.shortName}
            <span className="text-shu-500">.</span>
          </span>
        </Link>
      </div>
    </div>
  );
}

const ProjectDetails = () => {
  const { t } = useLanguage();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setNotFound(false);
    const findBySlug = (list) => list.find((p) => toSlug(p.Title) === slug);

    let cached = [];
    try {
      cached = JSON.parse(localStorage.getItem("projects")) || [];
    } catch {
      cached = [];
    }
    const cachedProject = findBySlug(cached);
    if (cachedProject) {
      setProject(normalize(cachedProject));
      return;
    }

    // Nothing cached yet (link opened directly, e.g. a shared URL) — ask the database.
    let cancelled = false;
    supabase
      .from("projects")
      .select("*")
      .then(({ data }) => {
        if (cancelled) return;
        const found = findBySlug(data || []);
        if (found) setProject(normalize(found));
        else setNotFound(true);
      }, () => !cancelled && setNotFound(true));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!project) {
    return (
      <div className="container-site flex min-h-screen items-center justify-center">
        {notFound ? (
          <div className="text-center">
            <p className="font-display text-7xl font-extrabold text-shu-500 font-wide">404</p>
            <h1 className="mt-4 font-display text-3xl font-bold text-washi">{t.projectDetail.notFoundTitle}</h1>
            <p className="mt-3 text-washi-muted">{t.projectDetail.notFoundText}</p>
            <button type="button" onClick={() => navigate("/")} className="btn-primary mt-8">
              <ArrowLeft className="h-4 w-4" />
              {t.notFound.backHome}
            </button>
          </div>
        ) : (
          <div role="status" className="flex flex-col items-center gap-5 text-washi-muted">
            <span className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-shu-500" />
            {t.projectDetail.loading}
          </div>
        )}
      </div>
    );
  }

  const projectUrl = `${SITE.url}/project/${toSlug(project.Title)}`;
  const description = project.Description?.slice(0, 155) || `${project.Title} — ${SITE.name}, ${SITE.role}.`;
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.Title,
    description: project.Description || "",
    url: projectUrl,
    image: project.Img || undefined,
    author: { "@type": "Person", name: SITE.name, url: `${SITE.url}/` },
  }).replace(/</g, String.fromCharCode(92) + "u003c"); // "<" as a JSON escape, so a description containing "</script>" can not close the tag early

  const stats = [
    { icon: Code2, value: project.TechStack.length, label: t.projectDetail.totalTech },
    { icon: Layers, value: project.Features.length, label: t.projectDetail.totalFeatures },
  ].filter((s) => s.value > 0);
  const hasTech = project.TechStack.length > 0;
  const hasFeatures = project.Features.length > 0;
  const caseStudyItems = [
    { key: "challenge", icon: Target, label: t.projectDetail.challenge, text: project.Challenge },
    { key: "approach", icon: Compass, label: t.projectDetail.approach, text: project.Approach },
    { key: "role", icon: User, label: t.projectDetail.role, text: project.Role },
    { key: "results", icon: TrendingUp, label: t.projectDetail.results, text: project.Results },
  ].filter((item) => item.text?.trim());

  return (
    <>
      <Helmet>
        <title>{`${project.Title} — ${SITE.name}`}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={projectUrl} />
        <meta property="og:title" content={`${project.Title} — ${SITE.name}`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={projectUrl} />
        <meta property="og:type" content="website" />
        {project.Img && <meta property="og:image" content={project.Img} />}
        <script type="application/ld+json">{jsonLd}</script>
      </Helmet>

      <div className="relative min-h-screen bg-ink/80">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(ellipse_at_50%_0%,rgba(232,71,47,0.14),transparent_65%)]" />

        <div className="container-site relative pb-24 pt-8 sm:pt-10">
          <TopBar t={t} title={project.Title} />

          <div className="mt-16 grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-shu-400"
              >
                <span aria-hidden="true" className="h-px w-8 bg-shu-500/70" />
                {t.projectDetail.overview}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.05, ease: EASE }}
                className="mt-5 font-display text-4xl font-bold leading-[1.02] tracking-tight text-washi text-balance font-semiwide sm:text-5xl lg:text-6xl"
              >
                {project.Title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.12, ease: EASE }}
                className="mt-6 text-base leading-relaxed text-washi-muted text-pretty sm:text-lg"
              >
                {project.Description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
                className="mt-8 flex flex-wrap gap-3"
              >
                {project.Link && (
                  <a href={project.Link} target="_blank" rel="noopener noreferrer" className="btn-primary group">
                    {t.projectDetail.liveDemo}
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </a>
                )}
                {isPublicRepo(project.Github) ? (
                  <a href={project.Github} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                    <FaGithub className="h-4 w-4" />
                    {t.projectDetail.github}
                  </a>
                ) : (
                  <button type="button" onClick={() => setShowPrivate((v) => !v)} aria-expanded={showPrivate} className="btn-ghost">
                    <Lock className="h-4 w-4" />
                    {t.projectDetail.github}
                  </button>
                )}
              </motion.div>
              {showPrivate && (
                <p role="status" className="mt-3 flex items-center gap-2 text-sm text-washi-subtle">
                  <Lock aria-hidden="true" className="h-3.5 w-3.5" />
                  {t.projectDetail.privateText}
                </p>
              )}

              {stats.length > 0 && (
              <dl className={`mt-10 grid gap-3 ${stats.length > 1 ? "grid-cols-2" : "max-w-[15rem] grid-cols-1"}`}>
                {stats.map(({ icon: Icon, value, label }) => (
                  <div key={label} className="surface flex items-center gap-4 p-4">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-shu-500/15 text-shu-400">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div className="flex flex-col-reverse">
                      <dt className="text-xs text-washi-subtle">{label}</dt>
                      <dd className="font-display text-2xl font-bold text-washi">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
              )}
            </div>

            <motion.div
              className="lg:col-span-7"
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.15, ease: EASE }}
            >
              <BrowserFrame key={project.id} src={project.Img} alt={project.Title} url={project.Link} eager />
            </motion.div>
          </div>

          {caseStudyItems.length > 0 && (
            <div className="mt-20">
              <Reveal>
                <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-shu-400">
                  <span aria-hidden="true" className="h-px w-8 bg-shu-500/70" />
                  {t.projectDetail.caseStudy}
                </p>
              </Reveal>
              <RevealGroup as="div" className="mt-6 grid gap-6 sm:grid-cols-2" stagger={0.08}>
                {caseStudyItems.map(({ key, icon: Icon, label, text }) => (
                  <RevealItem as="div" key={key} className="surface p-6 sm:p-8">
                    <h2 className="flex items-center gap-3 font-display text-lg font-bold text-washi font-semiwide">
                      <Icon aria-hidden="true" className="h-5 w-5 text-shu-400" />
                      {label}
                    </h2>
                    <p className="mt-4 text-washi-muted leading-relaxed text-pretty">{text}</p>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          )}

          {(hasTech || hasFeatures) && (
            <div className={`mt-20 grid gap-10 ${hasTech && hasFeatures ? "lg:grid-cols-2" : ""}`}>
              {hasTech && (
                <Reveal className="surface p-6 sm:p-8">
                  <h2 className="flex items-center gap-3 font-display text-xl font-bold text-washi font-semiwide">
                    <Code2 aria-hidden="true" className="h-5 w-5 text-shu-400" />
                    {t.projectDetail.technologiesUsed}
                  </h2>
                  <ul className="mt-6 flex flex-wrap gap-2.5">
                    {project.TechStack.map((tech, i) => (
                      <li key={`${i}-${tech}`}>
                        <TechBadge tech={tech} size="md" />
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}

              {hasFeatures && (
                <Reveal className="surface p-6 sm:p-8" delay={0.08}>
                  <h2 className="flex items-center gap-3 font-display text-xl font-bold text-washi font-semiwide">
                    <Layers aria-hidden="true" className="h-5 w-5 text-shu-400" />
                    {t.projectDetail.keyFeatures}
                  </h2>
                  <RevealGroup as="ul" className="mt-6 space-y-3" stagger={0.05}>
                    {project.Features.map((feature, i) => (
                      <RevealItem as="li" key={`${i}-${feature}`} className="flex items-start gap-3 text-washi-muted">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-shu-500/15 text-shu-400">
                          <Check aria-hidden="true" className="h-3 w-3" />
                        </span>
                        {feature}
                      </RevealItem>
                    ))}
                  </RevealGroup>
                </Reveal>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProjectDetails;
