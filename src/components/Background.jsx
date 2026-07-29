import React, { useEffect, useRef, useMemo } from "react";

const AnimatedBackground = () => {
  const blobRefs = useRef([]);
  const canvasRef = useRef(null);
  const initialPositions = [
    { x: -4, y: 0 },
    { x: -4, y: 0 },
    { x: 20, y: -8 },
    { x: 20, y: -8 },
  ];

  // Galaxy stars effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let stars = [];
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    const createStars = () => {
      stars = [];
      const count = Math.floor((window.innerWidth * window.innerHeight) / 4000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2.5 + 0.5,
          alpha: Math.random() * 0.8 + 0.2,
          baseAlpha: Math.random() * 0.8 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinklePhase: Math.random() * Math.PI * 2,
          // For blackhole suction effect
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
        });
      }
    };

    // Profile photo center position (default center if not found)
    let blackholeX = window.innerWidth / 2;
    let blackholeY = window.innerHeight / 2;

    const findProfilePhoto = () => {
      const profileImgs = document.querySelectorAll('img[alt="Profile"]');
      if (profileImgs.length > 0) {
        const rect = profileImgs[0].getBoundingClientRect();
        blackholeX = rect.left + rect.width / 2;
        blackholeY = rect.top + rect.height / 2;
      }
    };

    resize();
    createStars();
    
    let time = 0;
    
    const draw = () => {
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Find blackhole center periodically
      if (time % 30 === 0) {
        findProfilePhoto();
      }

      // Draw subtle galaxy background
      const gradient = ctx.createRadialGradient(
        blackholeX, blackholeY, 0,
        blackholeX, blackholeY, Math.max(canvas.width, canvas.height) * 0.8
      );
      gradient.addColorStop(0, "rgba(6, 182, 212, 0.03)");
      gradient.addColorStop(0.3, "rgba(59, 130, 246, 0.02)");
      gradient.addColorStop(0.6, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw and update stars
      stars.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
        star.alpha = star.baseAlpha + twinkle * 0.3;
        
        // Suction effect toward blackhole
        const dx = blackholeX - star.x;
        const dy = blackholeY - star.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.max(canvas.width, canvas.height) * 0.6;
        
        if (dist < maxDist && dist > 10) {
          const force = (1 - dist / maxDist) * 0.3;
          star.vx += (dx / dist) * force * 0.02;
          star.vy += (dy / dist) * force * 0.02;
          
          // Damping
          star.vx *= 0.998;
          star.vy *= 0.998;
        } else {
          // Random wander for distant stars
          star.vx += (Math.random() - 0.5) * 0.01;
          star.vy += (Math.random() - 0.5) * 0.01;
          star.vx *= 0.99;
          star.vy *= 0.99;
        }

        // Clamp velocity
        const speed = Math.sqrt(star.vx * star.vx + star.vy * star.vy);
        if (speed > 1) {
          star.vx = (star.vx / speed) * 1;
          star.vy = (star.vy / speed) * 1;
        }

        star.x += star.vx;
        star.y += star.vy;

        // Wrap around edges
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        // Draw star with glow
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        
        // Star color - white/blue tint
        const blueTint = Math.min(1, dist / maxDist);
        ctx.fillStyle = `rgba(${200 + 55 * (1 - blueTint)}, ${220 + 35 * (1 - blueTint)}, 255, ${star.alpha})`;
        ctx.fill();

        // Glow for larger/bright stars
        if (star.size > 1.5 && star.alpha > 0.5) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(6, 182, 212, ${star.alpha * 0.15})`;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      resize();
      createStars();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    let currentScroll = 0;
    let ticking = false;

    const handleScroll = () => {
      const newScroll = window.pageYOffset;
      currentScroll = newScroll;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          blobRefs.current.forEach((blob, index) => {
            const initialPos = initialPositions[index];

            const xOffset = Math.sin(currentScroll / 100 + index * 0.5) * 340;
            const yOffset = Math.cos(currentScroll / 100 + index * 0.5) * 40;

            const x = initialPos.x + xOffset;
            const y = initialPos.y + yOffset;

            blob.style.transform = `translate(${x}px, ${y}px)`;
            blob.style.transition = "transform 1.4s ease-out";
          });
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
      {/* Galaxy Stars Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none", zIndex: 0 }}
      />
      
      {/* Blob effects */}
      <div className="absolute inset-0">
        <div
          ref={(ref) => (blobRefs.current[0] = ref)}
          className="absolute top-0 -left-4 md:w-96 md:h-96 w-72 h-72 bg-cyan-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 md:opacity-15"
        ></div>
        <div
          ref={(ref) => (blobRefs.current[1] = ref)}
          className="absolute top-0 -right-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 md:opacity-15 hidden sm:block"
        ></div>
        <div
          ref={(ref) => (blobRefs.current[2] = ref)}
          className="absolute -bottom-8 left-[-40%] md:left-20 w-96 h-96 bg-sky-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 md:opacity-15"
        ></div>
        <div
          ref={(ref) => (blobRefs.current[3] = ref)}
          className="absolute -bottom-10 right-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-15 md:opacity-8 hidden sm:block"
        ></div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f10_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f10_1px,transparent_1px)] bg-[size:24px_24px]"></div>
    </div>
  );
};

export default AnimatedBackground;

