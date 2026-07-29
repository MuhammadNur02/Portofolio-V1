import React, { useEffect, useRef } from "react";

const DragonCanvas = ({ isGamePlaying = false }) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const headRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const isMouseActive = useRef(false);
  const mouseTimeoutRef = useRef(null);

  // --- AI Wandering & Smooth Motion Control ---
  const wanderAngleRef = useRef(Math.random() * Math.PI * 2);
  const wanderSpeedRef = useRef(0.8);
  const targetWanderSpeedRef = useRef(0.8);
  const wanderStateTimeRef = useRef(0);
  const wanderStateRef = useRef("cruising");

  const animationFrameRef = useRef(null);
  const timeRef = useRef(0);
  const targetOpacityRef = useRef(1);

  // Status Game (apakah game sedang berjalan atau tidak)
  const isGamePlayingRef = useRef(isGamePlaying);

  useEffect(() => {
    isGamePlayingRef.current = isGamePlaying;
  }, [isGamePlaying]);

  // --- KONFIGURASI SKELETAL & FAIRY DUST ---
  const N = 55;
  const SEGMENT_DIST = 9.5;
  const bodyRef = useRef([]);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width, height;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      const cx = width / 2;
      const cy = height / 2;
      headRef.current = { x: cx, y: cy };
      mouseRef.current = { x: cx, y: cy };
      targetRef.current = { x: cx, y: cy };
      velocityRef.current = { x: 0, y: 0 };

      initBody(cx, cy);
    };

    const initBody = (cx, cy) => {
      const body = [];
      for (let i = 0; i < N; i++) {
        body.push({
          x: cx - i * SEGMENT_DIST,
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
        current.x = prev.x - Math.cos(angle) * SEGMENT_DIST;
        current.y = prev.y - Math.sin(angle) * SEGMENT_DIST;
      }
    };

    const checkScrollVisibility = () => {
      const portfolioSection = document.querySelector("#Portofolio");
      if (portfolioSection) {
        const rect = portfolioSection.getBoundingClientRect();
        const shouldHide = rect.top < window.innerHeight - 100;
        targetOpacityRef.current = shouldHide ? 0 : 1;
      }
    };

    // ---- RENDER VISUAL NAGA & DEBU PERI ----
    const draw = (moveAngle) => {
      ctx.clearRect(0, 0, width, height);

      const currentOpacity = parseFloat(ctx.globalAlpha) || 1;
      const targetOpacity = targetOpacityRef.current;
      const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * 0.06;
      ctx.globalAlpha = Math.max(0, Math.min(1, newOpacity));

      const body = bodyRef.current;
      const time = timeRef.current;

      if (body.length === 0) return;

      // 1. PARTIKEL DEBU PERI (FAIRY DUST)
      if (Math.random() < 0.95) {
        const randomSeg = body[Math.floor(Math.random() * body.length)];
        particlesRef.current.push({
          x: randomSeg.x + (Math.random() - 0.5) * 20,
          y: randomSeg.y + (Math.random() - 0.5) * 20,
          size: Math.random() * 2.5 + 0.6,
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
          ctx.shadowBlur = 8;
          ctx.fill();
        }
      }

      // 2. TULANG BELAKANG ORGANIK
      for (let i = 0; i < body.length - 1; i++) {
        const p1 = body[i];
        const p2 = body[i + 1];

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = "rgba(240, 245, 250, 0.85)";
        ctx.lineWidth = Math.max(1.2, (N - i) * 0.1);
        ctx.shadowColor = "#79D7BE";
        ctx.shadowBlur = 6;
        ctx.stroke();
      }

      // 3. SAYAP & BULU AKSEN ESTETIK
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
            const wingSpan = 150 - i * 1.3;

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
            ctx.shadowBlur = 12;
            ctx.fill();

            ctx.strokeStyle = "rgba(220, 245, 250, 0.6)";
            ctx.lineWidth = 1.4;
            ctx.stroke();

            if (Math.random() < 0.4) {
              const tipX = seg.x + Math.cos(angle) * (-wingSpan * 0.95) - Math.sin(angle) * (wingSpan * 0.5 * side);
              const tipY = seg.y + Math.sin(angle) * (-wingSpan * 0.95) + Math.cos(angle) * (wingSpan * 0.5 * side);
              particlesRef.current.push({
                x: tipX,
                y: tipY,
                size: Math.random() * 2 + 1,
                alpha: 0.85,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                color: "255, 255, 255",
              });
            }
          } else if (i < 45 && i % 2 === 0) {
            const featherLen = Math.max(0, (45 - i) * 1.2);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-featherLen * 0.5, featherLen * 0.6, -featherLen * 0.8, featherLen * (0.7 + wingFlex * 0.2));
            ctx.strokeStyle = i % 4 === 0 ? "rgba(121, 215, 190, 0.6)" : "rgba(180, 150, 220, 0.6)";
            ctx.lineWidth = 1.2;
            ctx.shadowBlur = 0;
            ctx.stroke();
          }

          ctx.restore();
        });

        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0.7, (N - i) * 0.08), 0, Math.PI * 2);
        ctx.fillStyle = "#F0F5FA";
        ctx.shadowColor = "#79D7BE";
        ctx.shadowBlur = 5;
        ctx.fill();

        ctx.restore();
      }

      // 4. KEPALA NAGA ESTETIK
      const head = body[0];
      const jawAngle = Math.sin(time * 5) * 0.12 + 0.05;

      ctx.save();
      ctx.translate(head.x, head.y);
      ctx.rotate(moveAngle);

      [-1, 1].forEach((side) => {
        ctx.save();
        ctx.scale(1, side);
        
        ctx.beginPath();
        ctx.moveTo(-2, 4);
        ctx.quadraticCurveTo(-15, 18, -28, 14);
        ctx.quadraticCurveTo(-18, 8, -6, 2);
        ctx.fillStyle = "#1A1025";
        ctx.strokeStyle = "rgba(220, 245, 250, 0.8)";
        ctx.lineWidth = 1.2;
        ctx.shadowColor = "#79D7BE";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      });

      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.quadraticCurveTo(12, -8, -6, -10);
      ctx.quadraticCurveTo(-14, -8, -12, 0);
      ctx.quadraticCurveTo(-14, 8, -6, 10);
      ctx.quadraticCurveTo(12, 8, 24, 0);
      ctx.closePath();

      ctx.fillStyle = "#0D0E15";
      ctx.strokeStyle = "rgba(240, 245, 250, 0.9)";
      ctx.lineWidth = 1.6;
      ctx.shadowColor = "#79D7BE";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.rotate(jawAngle);
      ctx.beginPath();
      ctx.moveTo(20, 1);
      ctx.quadraticCurveTo(8, 7, -8, 6);
      ctx.lineTo(-4, 1);
      ctx.closePath();
      ctx.fillStyle = "#08090D";
      ctx.strokeStyle = "rgba(240, 245, 250, 0.7)";
      ctx.lineWidth = 1.2;
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-2, -5);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-2, 5);
      ctx.closePath();
      ctx.fillStyle = "#79D7BE";
      ctx.shadowColor = "#79D7BE";
      ctx.shadowBlur = 10;
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#79D7BE";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(8, -3.5, 1.8, 0, Math.PI * 2);
      ctx.arc(8, 3.5, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.shadowBlur = 0;
    };

    // ---- MAIN LOOP (MODE GAME VS MODE POINTER) ----
    let lastMoveAngle = 0;

    const update = () => {
      timeRef.current += 0.016;

      // JIKA GAME SEDANG DIMAINKAN: Naga terbang bebas keluar layar (Off-Screen Wandering)
      if (isGamePlayingRef.current) {
        wanderStateTimeRef.current -= 0.016;

        if (wanderStateTimeRef.current <= 0) {
          const r = Math.random();
          if (r < 0.4) {
            wanderStateRef.current = "cruising";
            targetWanderSpeedRef.current = 1.5 + Math.random() * 1.5;
            wanderStateTimeRef.current = 4.0 + Math.random() * 4.0;
          } else if (r < 0.7) {
            wanderStateRef.current = "relaxed_turn";
            targetWanderSpeedRef.current = 2.0 + Math.random() * 2.0;
            wanderStateTimeRef.current = 3.0 + Math.random() * 3.0;
          } else {
            wanderStateRef.current = "aggressive_turn";
            targetWanderSpeedRef.current = 3.0 + Math.random() * 2.5; // Naga terbang cepat keluar layar
            wanderStateTimeRef.current = 2.0 + Math.random() * 3.0;
          }
        }

        wanderSpeedRef.current += (targetWanderSpeedRef.current - wanderSpeedRef.current) * 0.02;

        let rotationChange = 0;
        if (wanderStateRef.current === "cruising") rotationChange = (Math.random() - 0.5) * 0.01;
        else if (wanderStateRef.current === "relaxed_turn") rotationChange = (Math.random() - 0.4) * 0.04;
        else rotationChange = (Math.random() - 0.3) * 0.12;

        const maxRotationPerFrame = 0.07;
        const cappedRotation = Math.max(-maxRotationPerFrame, Math.min(maxRotationPerFrame, rotationChange));
        wanderAngleRef.current += cappedRotation;

        // DI GAME MODE: Batas Layar diperluas jauh (Margin -400px s/d +400px dari layar)
        // Naga diperbolehkan pergi keluar layar jauh, lalu perlahan kembali dari sudut lain
        const offscreenMargin = 400;
        if (targetRef.current.x < -offscreenMargin) wanderAngleRef.current = 0;
        if (targetRef.current.x > width + offscreenMargin) wanderAngleRef.current = Math.PI;
        if (targetRef.current.y < -offscreenMargin) wanderAngleRef.current = Math.PI * 0.5;
        if (targetRef.current.y > height + offscreenMargin) wanderAngleRef.current = -Math.PI * 0.5;

        targetRef.current.x += Math.cos(wanderAngleRef.current) * wanderSpeedRef.current;
        targetRef.current.y += Math.sin(wanderAngleRef.current) * wanderSpeedRef.current;
      } 
      // JIKA GAME STOP (KEMBALI KE POINTER MOUSE / TOUCH)
      else {
        targetRef.current.x = mouseRef.current.x;
        targetRef.current.y = mouseRef.current.y;
      }

      // PERHITUNGAN KELURUSAN KEPALA DAN SMOOTH LANDING
      const dx = targetRef.current.x - headRef.current.x;
      const dy = targetRef.current.y - headRef.current.y;
      const dist = Math.hypot(dx, dy);

      let accelFactor = isGamePlayingRef.current ? 0.002 : 0.0035;
      let damping = 0.92;

      // Pendaratan Halus di Pointer (Saat Stop Game)
      if (!isGamePlayingRef.current && dist < 140) {
        const slowRatio = dist / 140;
        damping = 0.78 + slowRatio * 0.14; // Rem lembut bertahap
      }

      velocityRef.current.x = (velocityRef.current.x + dx * accelFactor) * damping;
      velocityRef.current.y = (velocityRef.current.y + dy * accelFactor) * damping;

      headRef.current.x += velocityRef.current.x;
      headRef.current.y += velocityRef.current.y;

      const currentSpeed = Math.hypot(velocityRef.current.x, velocityRef.current.y);

      if (currentSpeed > 0.12) {
        lastMoveAngle = Math.atan2(velocityRef.current.y, velocityRef.current.x);
      }

      updateDragon(headRef.current.x, headRef.current.y);
      draw(lastMoveAngle);

      animationFrameRef.current = requestAnimationFrame(update);
    };

    resize();
    update();
    checkScrollVisibility();

    const handleScroll = () => checkScrollVisibility();

    const activatePointer = (x, y) => {
      mouseRef.current.x = x;
      mouseRef.current.y = y;
    };

    const handleMouseMove = (e) => activatePointer(e.clientX, e.clientY);
    const handleTouchMove = (e) => {
      if (e.touches[0]) activatePointer(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchstart", handleTouchMove, { passive: true });
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      clearTimeout(mouseTimeoutRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
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