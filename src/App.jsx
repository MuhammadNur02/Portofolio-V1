import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from "react-router-dom";
import { useState, useEffect, lazy, Suspense, startTransition } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Analytics } from "@vercel/analytics/react";
import { motion, useScroll, useTransform } from "framer-motion";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { hasSeenWelcome } from "./utils/welcomeSession";
import { useSmoothScroll, scrollToTarget } from "./lib/smoothScroll";
import "./index.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AnimatedBackground from "./components/Background";
import ScrollProgress from "./components/ui/ScrollProgress";
import ErrorBoundary, { SectionBoundary } from "./components/ErrorBoundary";
import Home from "./Pages/Home";
import About from "./Pages/About";

// Below-the-fold sections, the welcome screen and the admin pages load on demand.
const SceneBackground = lazy(() => import("./components/SceneBackground"));
const WelcomeScreen = lazy(() => import("./Pages/WelcomeScreen"));
const Experience = lazy(() => import("./Pages/Experience"));
const WorksParallax = lazy(() => import("./Pages/WorksParallax"));
const Portofolio = lazy(() => import("./Pages/Portofolio"));
const Gallery = lazy(() => import("./Pages/Gallery"));
const Testimonials = lazy(() => import("./Pages/Testimonials"));
const ContactPage = lazy(() => import("./Pages/Contact"));
const ProjectDetails = lazy(() => import("./components/ProjectDetail"));
const TestimonialForm = lazy(() => import("./Pages/TestimonialForm"));
const NotFoundPage = lazy(() => import("./Pages/404"));
const Login = lazy(() => import("./Pages/Login"));
const Dashboard = lazy(() => import("./Pages/Dashboard"));
// Lazy as well: it imports the Supabase client, which visitors of the public pages should not wait for.
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));

// Mounts its children only once the browser has had a moment to breathe, so the heavy 3D scene
// never competes with the first paint and the welcome screen for bandwidth and CPU.
const WhenIdle = ({ delay = 1200, children }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let idleId;
    const timer = setTimeout(() => {
      if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(() => setReady(true), { timeout: 2000 });
      else setReady(true);
    }, delay);
    return () => {
      clearTimeout(timer);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
    };
  }, [delay]);
  return ready ? children : null;
};

const SkipLink = () => {
  const { t } = useLanguage();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10000] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-washi"
    >
      {t.a11y.skipToContent}
    </a>
  );
};

// Past the hero, the 3D artwork dims so long-form content sits on a calm, readable field
// (the scene itself keeps rendering in 3D underneath — only a DOM shade is added on top).
const BackgroundDim = () => {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, (y) => Math.min(y / (window.innerHeight * 0.9), 1) * 0.78);
  return <motion.div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] bg-ink" style={{ opacity }} />;
};

// Opening a project and pressing Back should land the visitor where they left off, not at the top.
// The position is saved when the landing page unmounts (an in-app navigation) and read on the next
// Back/Forward ("POP") mount — a fresh visit or reload never has one, because unloading skips React cleanup.
const SCROLL_KEY = "landingScrollY";
const readSavedScroll = () => {
  try {
    return Number(sessionStorage.getItem(SCROLL_KEY)) || 0;
  } catch {
    return 0;
  }
};

function useRestoreScrollOnBack(savedY) {
  useEffect(() => {
    try {
      sessionStorage.removeItem(SCROLL_KEY);
    } catch {
      /* storage blocked — nothing to restore */
    }

    let frame;
    if (savedY > 0) {
      const deadline = performance.now() + 4000;
      const restore = () => {
        const reachable = document.documentElement.scrollHeight - window.innerHeight >= savedY;
        if (reachable || performance.now() > deadline) window.scrollTo(0, savedY);
        else frame = requestAnimationFrame(restore);
      };
      restore();
    }

    return () => {
      cancelAnimationFrame(frame);
      try {
        sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY)));
      } catch {
        /* ignore */
      }
    };
    // Mount/unmount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// The sections below About are rendered after the first paint, as a low-priority transition: React
// splits that work into small slices, so it never blocks the intro animation or the first scroll
// (one long render of every section at start-up was the site's biggest main-thread task).
// They mount at once if the visitor scrolls, taps or types — or when a #section link/Back needs them.
function useDeferredMount(immediate) {
  const [ready, setReady] = useState(immediate);
  useEffect(() => {
    if (ready) return;
    const events = ["scroll", "pointerdown", "keydown", "touchstart"];
    const go = () => startTransition(() => setReady(true));
    const idle = "requestIdleCallback" in window ? window.requestIdleCallback(go, { timeout: 1500 }) : setTimeout(go, 300);
    events.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }));
    return () => {
      if ("requestIdleCallback" in window) window.cancelIdleCallback(idle);
      else clearTimeout(idle);
      events.forEach((e) => window.removeEventListener(e, go));
    };
  }, [ready]);
  return ready;
}

const LandingPage = () => {
  // Shown once per session: returning visitors and reloads go straight to the site.
  const [showWelcome, setShowWelcome] = useState(() => !hasSeenWelcome());
  const [revealed, setRevealed] = useState(!showWelcome);
  const { hash } = useLocation();
  const navigationType = useNavigationType();
  const [savedY] = useState(() => (navigationType === "POP" && !hash ? readSavedScroll() : 0));
  const sectionsReady = useDeferredMount(Boolean(hash) || savedY > 0);
  useSmoothScroll();
  useRestoreScrollOnBack(savedY);

  // Arriving from another page with a #section (e.g. the footer links on a project page):
  // wait until that lazily loaded section exists, then glide to it.
  useEffect(() => {
    if (!hash || showWelcome) return;
    let frame;
    const deadline = performance.now() + 4000;
    const tryScroll = () => {
      if (document.querySelector(hash)) setTimeout(() => scrollToTarget(hash), 150);
      else if (performance.now() < deadline) frame = requestAnimationFrame(tryScroll);
    };
    tryScroll();
    return () => cancelAnimationFrame(frame);
  }, [hash, showWelcome]);

  return (
    <>
      {showWelcome && (
        <Suspense fallback={<div className="fixed inset-0 z-[100] bg-[#050404]" />}>
          <WelcomeScreen onReveal={() => setRevealed(true)} onLoadingComplete={() => setShowWelcome(false)} />
        </Suspense>
      )}

      {/* While the intro covers the screen, the page behind it can't be tabbed into or read out. */}
      <div {...(showWelcome ? { inert: "" } : {})}>
        <SkipLink />
        <ScrollProgress />
        <BackgroundDim />
        <Navbar />

        <main id="main" className="relative z-10">
          <Home ready={revealed} />
          <About />
          {sectionsReady ? (
            <SectionBoundary>
              <Suspense fallback={<div className="h-screen" />}>
                <Experience />
                <WorksParallax />
                <Portofolio />
                <Gallery />
                <Testimonials />
                <ContactPage />
              </Suspense>
            </SectionBoundary>
          ) : (
            <div className="h-screen" />
          )}
        </main>
        <Footer />
      </div>
    </>
  );
};

const ProjectPageLayout = () => {
  useSmoothScroll();
  return (
    <>
      <ScrollProgress />
      <main className="relative z-10">
        <ErrorBoundary>
          <Suspense fallback={<div className="min-h-screen" />}>
            <ProjectDetails />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  );
};

const TestimonialPageLayout = () => {
  useSmoothScroll();
  return (
    <>
      <ScrollProgress />
      <main className="relative z-10">
        <ErrorBoundary>
          <Suspense fallback={<div className="min-h-screen" />}>
            <TestimonialForm />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  );
};

function App() {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <AnimatedBackground />
        <Analytics />
        <div className="grain" aria-hidden="true" />
        <BrowserRouter>
          {/* If the 3D chunk ever fails to load, the site simply keeps its static fallback background */}
          <ErrorBoundary silent>
            <WhenIdle>
              <Suspense fallback={null}>
                <SceneBackground />
              </Suspense>
            </WhenIdle>
          </ErrorBoundary>
          <ErrorBoundary>
            <Routes>
              {/* PUBLIC */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/project/:slug" element={<ProjectPageLayout />} />
              <Route path="/testimoni" element={<TestimonialPageLayout />} />

              {/* AUTH */}
              <Route
                path="/login"
                element={
                  <Suspense fallback={null}>
                    <Login />
                  </Suspense>
                }
              />

              {/* ADMIN (PROTECTED) */}
              <Route
                path="/dashboard/*"
                element={
                  <Suspense fallback={null}>
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  </Suspense>
                }
              />

              {/* 404 */}
              <Route
                path="*"
                element={
                  <Suspense fallback={null}>
                    <NotFoundPage />
                  </Suspense>
                }
              />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;
