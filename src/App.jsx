import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import AOS from "aos";
import { HelmetProvider } from "react-helmet-async";
import { Analytics } from "@vercel/analytics/react";
import { LanguageProvider } from "./context/LanguageContext";
import "./index.css";
import Navbar from "./components/Navbar";
import Home from "./Pages/Home";
import About from "./Pages/About";
import AnimatedBackground from "./components/Background";
import CursorTrail from "./components/CursorTrail";
import { AnimatePresence } from "framer-motion";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { useLanguage } from "./context/LanguageContext";
import { hasSeenWelcome } from "./utils/welcomeSession";

// Admin pages are lazy: regular visitors never download the dashboard code.
const Login = lazy(() => import("./Pages/Login"));
const Dashboard = lazy(() => import("./Pages/Dashboard"));
const SceneBackground = lazy(() => import("./components/SceneBackground"));
const Portofolio = lazy(() => import("./Pages/Portofolio"));
const Testimonials = lazy(() => import("./Pages/Testimonials"));
const ContactPage = lazy(() => import("./Pages/Contact"));
const ProjectDetails = lazy(() => import("./components/ProjectDetail"));
const WelcomeScreen = lazy(() => import("./Pages/WelcomeScreen"));
const NotFoundPage = lazy(() => import("./Pages/404"));

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
      href="#Home"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10000] focus:rounded-lg
                 focus:bg-[#0a0705] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-amber-200
                 focus:outline focus:outline-2 focus:outline-amber-300"
    >
      {t.a11y.skipToContent}
    </a>
  );
};

const LandingPage = ({ showWelcome, setShowWelcome }) => {
  // AOS measures every element's position once. Sections that fill in afterwards (project data,
  // images) push everything below them down, so AOS keeps stale positions and the scroll
  // animations fire late or never. Re-measure whenever the page height changes.
  useEffect(() => {
    if (showWelcome) return;
    let timer;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => AOS.refreshHard(), 120);
    });
    observer.observe(document.body);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [showWelcome]);

  return (
    <>
      <AnimatePresence mode="wait">
        {showWelcome && (
          <Suspense fallback={null}>
            <WelcomeScreen onLoadingComplete={() => setShowWelcome(false)} />
          </Suspense>
        )}
      </AnimatePresence>

      {!showWelcome && (
        <>
          <SkipLink />
          <Navbar />
      
          <Home />
          <About />
          <Suspense fallback={<div className="h-20" />}>
            <Portofolio />
            <Testimonials />
            <ContactPage />
          </Suspense>
          <Footer />
        </>
      )}
    </>
  );
};

const ProjectPageLayout = () => (
  <>
    <Suspense fallback={<div className="min-h-screen" />}>
      <ProjectDetails />
    </Suspense>
    <Footer />
  </>
);

function App() {
  // Shown once per session: returning visitors and reloads go straight to the site.
  const [showWelcome, setShowWelcome] = useState(() => !hasSeenWelcome());

  return (
    
<HelmetProvider>
    <LanguageProvider>
      <div>
  <AnimatedBackground />
  <Analytics />
  <CursorTrail />
      <BrowserRouter>
        <WhenIdle>
          <Suspense fallback={null}>
            <SceneBackground />
          </Suspense>
        </WhenIdle>
        <Routes>
          {/* PUBLIC */}
          <Route
            path="/"
            element={
              <LandingPage
                showWelcome={showWelcome}
                setShowWelcome={setShowWelcome}
              />
            }
          />

          <Route path="/project/:slug" element={<ProjectPageLayout />} />

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
              <ProtectedRoute>
                <Suspense fallback={null}>
                  <Dashboard />
                </Suspense>
              </ProtectedRoute>
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
      </BrowserRouter>
      </div>
    </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;