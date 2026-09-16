import React, { useEffect, useRef } from "react";

/**
 * AnimatedBackground — "game engine viewport" backdrop.
 * Layers: deep nebula gradient -> perspective grid floor -> drifting particle
 * field -> HUD scanline -> vignette. All layers respect prefers-reduced-motion.
 */
const AnimatedBackground = () => {
  const gridRef = useRef(null);
  const particlesRef = useRef(null);
  const canvasRef = useRef(null);

  // Gentle parallax drift for the grid/particle layers on scroll
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const maxScroll = Math.max(
          document.documentElement.scrollHeight - window.innerHeight,
          1
        );
        const progress = Math.min(window.pageYOffset / maxScroll, 1);
        const drift = progress * 40;

        if (gridRef.current) {
          gridRef.current.style.transform = `translate3d(0, ${drift * 0.6}px, 0)`;
        }
        if (particlesRef.current) {
          particlesRef.current.style.transform = `translate3d(0, ${-drift}px, 0)`;
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lightweight canvas particle field (rising data-motes)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let animationFrameId;

    const COUNT = width < 768 ? 26 : 55;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.6 + 0.4,
      speed: Math.random() * 0.35 + 0.08,
      drift: (Math.random() - 0.5) * 0.15,
      hue: 190 + Math.random() * 40,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 75%, ${p.alpha})`;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, 0.8)`;
        ctx.shadowBlur = 4;
        ctx.fill();
      }
    };

    const step = () => {
      for (const p of particles) {
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -4) {
          p.y = height + 4;
          p.x = Math.random() * width;
        }
        if (p.x < -4) p.x = width + 4;
        if (p.x > width + 4) p.x = -4;
      }
      drawFrame();
      animationFrameId = window.requestAnimationFrame(step);
    };

    drawFrame();
    if (!prefersReducedMotion) {
      step();
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: -1 }}>
      {/* Deep nebula base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 15%, rgba(6,182,212,0.16), transparent 55%)," +
            "radial-gradient(ellipse 70% 55% at 85% 80%, rgba(59,130,246,0.14), transparent 55%)," +
            "#030014",
        }}
      />

      {/* Perspective grid floor */}
      <div
        ref={gridRef}
        className="absolute inset-x-0 bottom-0 h-[75%] animate-grid-scroll"
        style={{
          backgroundImage:
            "linear-gradient(rgba(6,182,212,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.22) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          transform: "perspective(500px) rotateX(60deg)",
          transformOrigin: "bottom",
          maskImage: "linear-gradient(to top, black 0%, transparent 80%)",
          WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 80%)",
          opacity: 0.5,
        }}
      />

      {/* Drifting particle field */}
      <div ref={particlesRef} className="absolute inset-0">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.8 }}
        />
      </div>

      {/* HUD scanline sweep */}
      <div
        className="absolute inset-x-0 top-0 h-32 animate-scanline pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(103,232,249,0.06), transparent)",
          mixBlendMode: "screen",
        }}
      />

      {/* Vignette / readability overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(3,0,20,0.65) 100%)",
        }}
      />
      <div className="absolute inset-0 bg-[#030014]/45 pointer-events-none" />
    </div>
  );
};

export default AnimatedBackground;
