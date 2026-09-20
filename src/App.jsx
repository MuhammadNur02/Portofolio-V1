import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useState, useEffect, lazy, Suspense } from "react";
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

import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

const SceneBackground = lazy(() => import("./components/SceneBackground"));
const Portofolio = lazy(() => import("./Pages/Portofolio"));
const Testimonials = lazy(() => import("./Pages/Testimonials"));
const ContactPage = lazy(() => import("./Pages/Contact"));
const ProjectDetails = lazy(() => import("./components/ProjectDetail"));
const WelcomeScreen = lazy(() => import("./Pages/WelcomeScreen"));
const NotFoundPage = lazy(() => import("./Pages/404"));
const SeedCertificates = lazy(() => import("./Pages/SeedCertificates"));

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
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    
<HelmetProvider>
    <LanguageProvider>
      <div>
  <AnimatedBackground />
  <Analytics />
  <CursorTrail />
      <BrowserRouter>
        <Suspense fallback={null}>
          <SceneBackground />
        </Suspense>
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
          <Route path="/login" element={<Login />} />

          {/* ADMIN (PROTECTED) */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* SEED */}
          <Route
            path="/seed"
            element={
              <Suspense fallback={null}>
                <SeedCertificates />
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
      </BrowserRouter>
      </div>
    </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;