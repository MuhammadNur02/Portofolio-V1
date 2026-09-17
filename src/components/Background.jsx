import React, { useEffect, useRef } from "react";

const AnimatedBackground = () => {
  const spaceRef = useRef(null);

  // Parallax scroll effect for background image
  useEffect(() => {
    let currentScroll = 0;
    let ticking = false;

    const handleScroll = () => {
      const newScroll = window.pageYOffset;
      currentScroll = newScroll;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Gentle parallax drift for the background image on scroll
          if (spaceRef.current) {
            const maxScroll = Math.max(
              document.documentElement.scrollHeight - window.innerHeight,
              1
            );
            const progress = Math.min(currentScroll / maxScroll, 1);
            const translateY = progress * 20;
            spaceRef.current.style.transform = `translate3d(0, ${translateY}px, 0) scale(1)`;
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background Image (bottom layer) with parallax float — fallback shown before/without WebGL */}
      <img
        ref={spaceRef}
        src="/Black.jpg"
        alt="Background"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover object-center select-none will-change-transform"
        style={{
          transform: "translate3d(0, 0, 0) scale(1)",
          zIndex: -1,
        }}
      />

      {/* Dark overlay for readability */}
      <div
        className="absolute inset-0 bg-[#0a0705]/55 pointer-events-none"
        style={{ zIndex: 0 }}
      />
    </div>
  );
};

export default AnimatedBackground;
