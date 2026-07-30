import React, { useEffect, useRef } from "react";

const DragonCanvas = ({ isGamePlaying = false, showWelcome = false }) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const headRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });

  // Status Idle Kursor
  const isMouseIdleRef = useRef(true);
  const mouseIdleTimeoutRef = useRef(null);

  // Status Game
  const isGamePlayingRef = useRef(isGamePlaying);

  // Status WelcomeScreen & Mobile Detection
  const showWelcomeRef = useRef(showWelcome);
  const isMobileRef = useRef(window.innerWidth < 768);
  const sizeScaleRef = useRef(isMobileRef.current ? 0.5 : 1.0);
  const segmentDistRef = useRef(9.5 * sizeScaleRef.current);

  // --- ANTI-RESIZE-RESET: Track previous dimensions to detect address-bar toggling vs real resize ---
  const lastWidthRef = useRef(window.innerWidth);
  const lastHeightRef = useRef(window.innerHeight);
  const resizeTimeoutRef = useRef(null);

  useEffect(() => {
    isGamePlayingRef.current = isGamePlaying;
  }, [isGamePlaying]);

  useEffect(() => {
    showWelcomeRef.current = showWelcome;
    if (showWelcome) {
      targetOpacityRef.current = 0;
    }
  }, [showWelcome]);

  // --- AI Wandering (Gaya Terbang Halus & Estetik) ---
  const wanderAngleRef = useRef(Math.random() * Math.PI * 2);
  const wanderSpeedRef = useRef(1.2);
  const targetWanderSpeedRef = useRef(1.2);
  const wanderStateTimeRef = useRef(0);
  const wanderStateRef = useRef("cruising");

  const animationFrameRef = useRef(null);
  const timeRef = useRef(0);
  const targetOpacityRef = useRef(showWelcome ? 0 : 1);

  // --- KONFIGURASI SKELETAL & FAIRY DUST ---
  const N = 55;
  const bodyRef = useRef([]);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width, height;

    const resize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      const prevWidth = lastWidthRef.current;
      const prevHeight = lastHeightRef.current;
      const widthDelta = Math.abs(newWidth - prevWidth);
      const heightDelta = Math.abs(newHeight - prevHeight);

      // Detect address-bar toggle on mobile: height change < 100px, width unchanged
      const isAddressBarToggle = widthDelta <= 2 && heightDelta > 0 && heightDelta < 100;

      // Always update canvas dimensions and scale
      width = newWidth;
      height = newHeight;
      canvas.width = width;
      canvas.height = height;

      // Update mobile detection & size scale
      isMobileRef.current = width < 768;
      sizeScaleRef.current = isMobileRef.current ? 0.5 : 1.0;
      segmentDistRef.current = 9.5 * sizeScaleRef.current;

      // Store for next comparison
      lastWidthRef.current = width;
      lastHeightRef.current = height;

      // ONLY reset dragon position + body on REAL resizes (orientation change, window drag, etc.)
      // SKIP reset for address-bar toggling to prevent glitch/jump
      if (!isAddressBarToggle) {
        const cx = width / 2;
        const cy = height / 2;
        headRef.current = { x: cx, y: cy };
        mouseRef.current = { x: cx, y: cy };
        targetRef.current = { x: cx, y: cy };
        velocityRef.current = { x: 0, y: 0 };
        initBody(cx, cy);
      }
    };

    const initBody = (cx, cy) => {
      const body = [];
      for (let i = 0; i < N; i++) {
        body.push({
          x: cx - i * segmentDistRef.current,
          y: cy,
          angle: 0,
        });
      }
      bodyRef.current = body;
    };

    const updateDragon = (headX, headY) => {
      const body = bodyRef.current;
      if (body.length === 0) return;

      body[0].x = headX;
      body[0].y = headY;

      for (let i = 1; i < body.length; i++) {
        const prev = body[i - 1];
        const current = body[i];

        const dx = prev.x - current.x;
        const dy = prev.y - current.y;
        const angle = Math.atan2(dy, dx);

        current.angle = angle;
        current.x = prev.x - Math.cos(angle) * segmentDistRef.current;
        current.y = prev.y - Math.sin(angle) * segmentDistRef.current;
      }
    };

    // IntersectionObserver untuk deteksi visibilitas scroll (lebih ringan, tanpa layout thrashing)
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // isIntersecting = section terlihat → naga tetap muncul
          // tidak intersecting = section tersembunyi → fade out naga
          targetOpacityRef.current = entry.isIntersecting ? 1 : 0;
        }
      },
      {
        root: null,
        rootMargin: "0px 0px -100px 0px",
        threshold: 0,
      }
    );

    const checkScrollVisibility = () => {
      const portfolioSection = document.querySelector("#Portofolio");
      if (portfolioSection) {
        visibilityObserver.observe(portfolioSection);
      }
    };

    // ---- RENDER VISUAL NAGA (DENGAN SIZE SCALE) ----
    const draw = (moveAngle) => {
      ctx.clearRect(0, 0, width, height);

      const currentOpacity = parseFloat(ctx.globalAlpha) || 1;
      const targetOpacity = targetOpacityRef.current;
      const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * 0.06;
      ctx.globalAlpha = Math.max(0, Math.min(1, newOpacity));

      const body = bodyRef.current;
      const time = timeRef.current;
      const scale = sizeScaleRef.current;

      if (body.length === 0) return;

      // 1. PARTIKEL DEBU PERI (FAIRY DUST) - Scaled
      if (Math.random() < 0.95) {
        const randomSeg = body[Math.floor(Math.random() * body.length)];
        particlesRef.current.push({
          x: randomSeg.x + (Math.random() - 0.5) * 20 * scale,
          y: randomSeg.y + (Math.random() - 0.5) * 20 * scale,
          size: (Math.random() * 2.5 + 0.6) * scale,
          alpha: 0.9,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5 - 0.2,
          color: Math.random() < 0.2 ? "220, 245, 255" : "255, 255, 255",
        });
      }

      for (let p = particlesRef.current.length - 1; p >= 0; p--) {
        const pt = particlesRef.current[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.007;

        if (pt.alpha <= 0) {
          particlesRef.current.splice(p, 1);
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${pt.color}, ${pt.alpha})`;
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 8 * scale;
          ctx.fill();
        }
      }

      // 2. TULANG BELAKANG ORGANIK - Scaled
      for (let i = 0; i < body.length - 1; i++) {
        const p1 = body[i];
        const p2 = body[i + 1];

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = "rgba(240, 245, 250, 0.85)";
        ctx.lineWidth = Math.max(1.2, (N - i) * 0.1) * scale;
        ctx.shadowColor = "#79D7BE";
        ctx.shadowBlur = 6 * scale;
        ctx.stroke();
      }

      // 3. SAYAP & BULU AKSEN ESTETIK - Scaled
      for (let i = 1; i < body.length; i++) {
        const seg = body[i];
        const angle = seg.angle;

        const isBigWing = i === 6 || i === 15;
        const wingFlex = Math.sin(time * 3.5 - i * 0.25) * 0.4 + Math.cos(time * 1.8) * 0.1;

        ctx.save();
        ctx.translate(seg.x, seg.y);
        ctx.rotate(angle);

        [-1, 1].forEach((side) => {
          ctx.save();
          ctx.scale(1, side);

          if (isBigWing) {
            const wingSpan = (150 - i * 1.3) * scale;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-wingSpan * 0.4, wingSpan * 0.85 * (1 + wingFlex), -wingSpan * 0.95, wingSpan * 0.5);
            ctx.quadraticCurveTo(-wingSpan * 0.65, wingSpan * 0.2, -wingSpan * 0.35, 0);
            ctx.closePath();

            const wingGrad = ctx.createLinearGradient(0, 0, -wingSpan, wingSpan * 0.3);
            wingGrad.addColorStop(0, "#1A1025");
            wingGrad.addColorStop(0.45, "#2E5077");
            wingGrad.addColorStop(1, "#79D7BE");

            ctx.fillStyle = wingGrad;
            ctx.shadowColor = "rgba(121, 215, 190, 0.5)";
            ctx.shadowBlur = 12 * scale;
            ctx.fill();

            ctx.strokeStyle = "rgba(220, 245, 250, 0.6)";
            ctx.lineWidth = 1.4 * scale;
            ctx.stroke();

            if (Math.random() < 0.4) {
              const tipX = seg.x + Math.cos(angle) * (-wingSpan * 0.95) - Math.sin(angle) * (wingSpan * 0.5 * side);
              const tipY = seg.y + Math.sin(angle) * (-wingSpan * 0.95) + Math.cos(angle) * (wingSpan * 0.5 * side);
              particlesRef.current.push({
                x: tipX,
                y: tipY,
                size: (Math.random() * 2 + 1) * scale,
                alpha: 0.85,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                color: "255, 255, 255",
              });
            }
          } else if (i < 45 && i % 2 === 0) {
            const featherLen = Math.max(0, (45 - i) * 1.2) * scale;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-featherLen * 0.5, featherLen * 0.6, -featherLen * 0.8, featherLen * (0.7 + wingFlex * 0.2));
            ctx.strokeStyle = i % 4 === 0 ? "rgba(121, 215, 190, 0.6)" : "rgba(180, 150, 220, 0.6)";
            ctx.lineWidth = 1.2 * scale;
            ctx.shadowBlur = 0;
            ctx.stroke();
          }

          ctx.restore();
        });

        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0.7, (N - i) * 0.08) * scale, 0, Math.PI * 2);
        ctx.fillStyle = "#F0F5FA";
        ctx.shadowColor = "#79D7BE";
        ctx.shadowBlur = 5 * scale;
        ctx.fill();

        ctx.restore();
      }

      // 4. KEPALA NAGA ESTETIK - Scaled
      const head = body[0];
      const jawAngle = Math.sin(time * 5) * 0.12 + 0.05;

      ctx.save();
      ctx.translate(head.x, head.y);
      ctx.rotate(moveAngle);

      [-1, 1].forEach((side) => {
        ctx.save();
        ctx.scale(1, side);
        
        ctx.beginPath();
        ctx.moveTo(-2 * scale, 4 * scale);
        ctx.quadraticCurveTo(-15 * scale, 18 * scale, -28 * scale, 14 * scale);
        ctx.quadraticCurveTo(-18 * scale, 8 * scale, -6 * scale, 2 * scale);
        ctx.fillStyle = "#1A1025";
        ctx.strokeStyle = "rgba(220, 245, 250, 0.8)";
        ctx.lineWidth = 1.2 * scale;
        ctx.shadowColor = "#79D7BE";
        ctx.shadowBlur = 8 * scale;
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      });

      ctx.beginPath();
      ctx.moveTo(24 * scale, 0);
      ctx.quadraticCurveTo(12 * scale, -8 * scale, -6 * scale, -10 * scale);
      ctx.quadraticCurveTo(-14 * scale, -8 * scale, -12 * scale, 0);
      ctx.quadraticCurveTo(-14 * scale, 8 * scale, -6 * scale, 10 * scale);
      ctx.quadraticCurveTo(12 * scale, 8 * scale, 24 * scale, 0);
      ctx.closePath();

      ctx.fillStyle = "#0D0E15";
      ctx.strokeStyle = "rgba(240, 245, 250, 0.9)";
      ctx.lineWidth = 1.6 * scale;
      ctx.shadowColor = "#79D7BE";
      ctx.shadowBlur = 12 * scale;
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.rotate(jawAngle);
      ctx.beginPath();
      ctx.moveTo(20 * scale, 1 * scale);
      ctx.quadraticCurveTo(8 * scale, 7 * scale, -8 * scale, 6 * scale);
      ctx.lineTo(-4 * scale, 1 * scale);
      ctx.closePath();
      ctx.fillStyle = "#08090D";
      ctx.strokeStyle = "rgba(240, 245, 250, 0.7)";
      ctx.lineWidth = 1.2 * scale;
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(4 * scale, 0);
      ctx.lineTo(-2 * scale, -5 * scale);
      ctx.lineTo(-6 * scale, 0);
      ctx.lineTo(-2 * scale, 5 * scale);
      ctx.closePath();
      ctx.fillStyle = "#79D7BE";
      ctx.shadowColor = "#79D7BE";
      ctx.shadowBlur = 10 * scale;
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#79D7BE";
      ctx.shadowBlur = 15 * scale;
      ctx.beginPath();
      ctx.arc(8 * scale, -3.5 * scale, 1.8 * scale, 0, Math.PI * 2);
      ctx.arc(8 * scale, 3.5 * scale, 1.8 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.shadowBlur = 0;
    };

    // ---- MAIN LOOP (MOBILE: ALWAYS WANDER | DESKTOP: FOLLOW MOUSE THEN WANDER ON IDLE) ----
    let lastMoveAngle = 0;

    const update = () => {
      timeRef.current += 0.016;

      // Mobile: always wandering (ignore touch)
      // Desktop: wander when mouse idle or game playing
      const isMobile = isMobileRef.current;
      const shouldWander = isMobile || isGamePlayingRef.current || isMouseIdleRef.current;

      if (shouldWander) {
        // --- LOGIKA AI WANDERING (HALUS & ELEGAN) ---
        wanderStateTimeRef.current -= 0.016;

        if (wanderStateTimeRef.current <= 0) {
          const r = Math.random();
          if (r < 0.5) {
            // Mode Kalem / Santai
            wanderStateRef.current = "cruising";
            targetWanderSpeedRef.current = 1.0 + Math.random() * 0.8; 
            wanderStateTimeRef.current = 4.0 + Math.random() * 4.0;
          } else if (r < 0.8) {
            // Mode Belok Ringan
            wanderStateRef.current = "relaxed_turn";
            targetWanderSpeedRef.current = 1.5 + Math.random() * 1.0; 
            wanderStateTimeRef.current = 3.0 + Math.random() * 3.0;
          } else {
            // Mode Agresif Estetik (Bermanuver Cepat Tapi Mulus)
            wanderStateRef.current = "agile_dash";
            targetWanderSpeedRef.current = 2.4 + Math.random() * 1.2; 
            wanderStateTimeRef.current = 1.8 + Math.random() * 2.0;
          }
        }

        // Transisi Kecepatan Bertahap (Mencegah Gerakan Patah)
        wanderSpeedRef.current += (targetWanderSpeedRef.current - wanderSpeedRef.current) * 0.025;

        // Perubahan Sudut Rotasi Sesuai Mode
        let rotationChange = 0;
        if (wanderStateRef.current === "cruising") {
          rotationChange = (Math.random() - 0.5) * 0.012;
        } else if (wanderStateRef.current === "relaxed_turn") {
          rotationChange = (Math.random() - 0.48) * 0.035;
        } else {
          rotationChange = (Math.random() - 0.45) * 0.065; 
        }

        // Kunci Batas Belok Per Frame (Mencegah Gerakan Ugal-ugalan)
        const maxRotationPerFrame = 0.045;
        const cappedRotation = Math.max(-maxRotationPerFrame, Math.min(maxRotationPerFrame, rotationChange));
        wanderAngleRef.current += cappedRotation;

        // Batas Layar Lembut (Smooth Bounce - membelok bertahap saat mendekati pinggir)
        const padding = 120;
        let edgeInfluence = 0;
        if (targetRef.current.x < padding) edgeInfluence = (padding - targetRef.current.x) / padding * 0.04;
        else if (targetRef.current.x > width - padding) edgeInfluence = -(targetRef.current.x - (width - padding)) / padding * 0.04;
        if (targetRef.current.y < padding) edgeInfluence += (padding - targetRef.current.y) / padding * 0.04;
        else if (targetRef.current.y > height - padding) edgeInfluence -= (targetRef.current.y - (height - padding)) / padding * 0.04;
        wanderAngleRef.current += edgeInfluence;

        targetRef.current.x += Math.cos(wanderAngleRef.current) * wanderSpeedRef.current;
        targetRef.current.y += Math.sin(wanderAngleRef.current) * wanderSpeedRef.current;
      } 
      else {
        // --- KURSUS AKTIF: NAGA MENGIKUTI POINTER MOUSE ---
        targetRef.current.x = mouseRef.current.x;
        targetRef.current.y = mouseRef.current.y;
        
        // Menyelaraskan Sudut AI Terbang Dengan Gerakan Terakhir Mouse
        wanderAngleRef.current = lastMoveAngle;
      }

      // --- FISIKA PERGERAKAN KEPALA ---
      const dx = targetRef.current.x - headRef.current.x;
      const dy = targetRef.current.y - headRef.current.y;
      const dist = Math.hypot(dx, dy);

      let accelFactor = shouldWander ? 0.0022 : 0.0038;
      let damping = 0.91;

      // Pendaratan Halus Saat Mendekati Pointer
      if (!shouldWander && dist < 150) {
        const slowRatio = dist / 150;
        damping = 0.80 + slowRatio * 0.11;
      }

      velocityRef.current.x = (velocityRef.current.x + dx * accelFactor) * damping;
      velocityRef.current.y = (velocityRef.current.y + dy * accelFactor) * damping;

      headRef.current.x += velocityRef.current.x;
      headRef.current.y += velocityRef.current.y;

      const currentSpeed = Math.hypot(velocityRef.current.x, velocityRef.current.y);

      if (currentSpeed > 0.1) {
        lastMoveAngle = Math.atan2(velocityRef.current.y, velocityRef.current.x);
      }

      updateDragon(headRef.current.x, headRef.current.y);
      draw(lastMoveAngle);

      animationFrameRef.current = requestAnimationFrame(update);
    };

    resize();
    update();
    checkScrollVisibility();

    // Deteksi Aktivitas Mouse / Touch dengan Timer Idle
    const activatePointer = (x, y) => {
      mouseRef.current.x = x;
      mouseRef.current.y = y;

      // Saat mouse bergerak -> Matikan mode wandering
      isMouseIdleRef.current = false;

      if (mouseIdleTimeoutRef.current) {
        clearTimeout(mouseIdleTimeoutRef.current);
      }

      // Setelah 1.8 detik mouse diam -> Naga kembali jalan-jalan acak
      mouseIdleTimeoutRef.current = setTimeout(() => {
        isMouseIdleRef.current = true;
      }, 1800);
    };

    const handleMouseMove = (e) => {
      // Ignore mouse events on mobile (touch-only devices)
      if (isMobileRef.current) return;
      activatePointer(e.clientX, e.clientY);
    };
    const handleTouchMove = (e) => {
      // Ignore touch events on mobile (always wandering)
      if (isMobileRef.current) return;
      if (e.touches[0]) activatePointer(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchstart", handleTouchMove, { passive: true });
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      visibilityObserver.disconnect();
      if (mouseIdleTimeoutRef.current) clearTimeout(mouseIdleTimeoutRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchstart", handleTouchMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
};

export default DragonCanvas;