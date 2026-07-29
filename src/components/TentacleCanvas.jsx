import React, { useEffect, useRef, useState } from "react";

const TentacleCanvas = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const headRef = useRef({ x: 0, y: 0 });
  const isMouseActive = useRef(false);
  const mouseTimeoutRef = useRef(null);
  const wanderAngleRef = useRef(Math.random() * Math.PI * 2);
  const animationFrameRef = useRef(null);
  const timeRef = useRef(0);
  const visibleRef = useRef(true);
  const targetOpacityRef = useRef(1);
 
  // --- CONFIGURATION ---
  const NUM_TENTACLES = 16;
  const TENTACLE_LENGTH = 240;
  const POINTS_PER_TENTACLE = 24;
  const HEAD_RADIUS = 30; // how far from head the tentacle base starts
  const WAVE_AMPLITUDE = 18;
  const WAVE_FREQUENCY = 2.2;

  // Store tentacle points: tentacles[i][j] = { x, y, baseAngle }
  const tentaclesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width, height;

    // ---- RESIZE ----
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      // Reset positions to center
      const cx = width / 2;
      const cy = height / 2;
      headRef.current.x = cx;
      headRef.current.y = cy;
      mouseRef.current.x = cx;
      mouseRef.current.y = cy;
      targetRef.current.x = cx;
      targetRef.current.y = cy;

      initTentacles(cx, cy);
    };

    // ---- INIT ----
    const initTentacles = (cx, cy) => {
      const tentacles = [];
      for (let i = 0; i < NUM_TENTACLES; i++) {
        const baseAngle = (i / NUM_TENTACLES) * Math.PI * 2;
        const points = [];
        for (let j = 0; j < POINTS_PER_TENTACLE; j++) {
          const t = j / (POINTS_PER_TENTACLE - 1);
          const r = HEAD_RADIUS + t * (TENTACLE_LENGTH - HEAD_RADIUS);
          points.push({
            x: cx + Math.cos(baseAngle) * r,
            y: cy + Math.sin(baseAngle) * r,
            baseAngle: baseAngle,
          });
        }
        tentacles.push(points);
      }
      tentaclesRef.current = tentacles;
    };

    // ---- UPDATE TENTACLES (Inverse Kinematics + Sine Wave) ----
    const segmentLen = TENTACLE_LENGTH / (POINTS_PER_TENTACLE - 1);

    const updateTentacles = (headX, headY, time) => {
      const tentacles = tentaclesRef.current;
      for (let i = 0; i < tentacles.length; i++) {
        const baseAngle = tentacles[i][0].baseAngle;
        const points = tentacles[i];

        // --- Point 0: anchored to head with radial offset + sine wiggle ---
        const radialOffset = HEAD_RADIUS;
        const wiggle0 = Math.sin(time * 1.1 + i * 0.8) * 4;
        const baseX0 = headX + Math.cos(baseAngle) * radialOffset;
        const baseY0 = headY + Math.sin(baseAngle) * radialOffset;
        points[0].x += (baseX0 + Math.cos(baseAngle + Math.PI / 2) * wiggle0 - points[0].x) * 0.25;
        points[0].y += (baseY0 + Math.sin(baseAngle + Math.PI / 2) * wiggle0 - points[0].y) * 0.25;

        // --- Chain points with sine wave deformation ---
        for (let j = 1; j < points.length; j++) {
          const prev = points[j - 1];
          const curr = points[j];
          const t = j / (POINTS_PER_TENTACLE - 1);

          // Target direction: radial outward from head, with sine wave perpendicular offset
          const dirAngle = baseAngle + Math.sin(time * WAVE_FREQUENCY + i * 0.9 + j * 0.4) * (WAVE_AMPLITUDE * t * 0.04);
          const targetX = prev.x + Math.cos(dirAngle) * segmentLen;
          const targetY = prev.y + Math.sin(dirAngle) * segmentLen;

          // Smoothly move toward target (spring-like)
          curr.x += (targetX - curr.x) * 0.28;
          curr.y += (targetY - curr.y) * 0.28;

          // Constraint: maintain segment length
          const dx = curr.x - prev.x;
          const dy = curr.y - prev.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            curr.x = prev.x + (dx / dist) * segmentLen;
            curr.y = prev.y + (dy / dist) * segmentLen;
          }
        }
      }
    };

    // ---- SCROLL VISIBILITY ----
    const checkScrollVisibility = () => {
      const portfolioSection = document.querySelector("#Portofolio");
      if (portfolioSection) {
        const rect = portfolioSection.getBoundingClientRect();
        // Hide tentacles if portfolio section top is above the viewport bottom (i.e., scrolled into view)
        const shouldHide = rect.top < window.innerHeight - 100;
        targetOpacityRef.current = shouldHide ? 0 : 1;
      }
    };

    // ---- DRAW ----
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth opacity transition
      const currentOpacity = parseFloat(ctx.globalAlpha) || 1;
      const targetOpacity = targetOpacityRef.current;
      const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * 0.06;
      ctx.globalAlpha = Math.max(0, Math.min(1, newOpacity));

      const tentacles = tentaclesRef.current;

      // Draw head glow
      const headGrad = ctx.createRadialGradient(
        headRef.current.x, headRef.current.y, 0,
        headRef.current.x, headRef.current.y, 40
      );
      headGrad.addColorStop(0, "rgba(0, 210, 255, 0.35)");
      headGrad.addColorStop(0.4, "rgba(59, 130, 246, 0.15)");
      headGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.arc(headRef.current.x, headRef.current.y, 40, 0, Math.PI * 2);
      ctx.fill();

      // Draw small bright core at head
      ctx.beginPath();
      ctx.arc(headRef.current.x, headRef.current.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 210, 255, 0.9)";
      ctx.shadowColor = "#00d2ff";
      ctx.shadowBlur = 20;
      ctx.fill();

      // Draw each tentacle
      for (let i = 0; i < tentacles.length; i++) {
        const points = tentacles[i];

        // --- Tentacle line ---
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let j = 1; j < points.length; j++) {
          ctx.lineTo(points[j].x, points[j].y);
        }

        // Cyan-to-blue gradient along the tentacle
        const grad = ctx.createLinearGradient(
          points[0].x, points[0].y,
          points[points.length - 1].x, points[points.length - 1].y
        );
        grad.addColorStop(0, "rgba(0, 210, 255, 0.7)");
        grad.addColorStop(0.4, "rgba(59, 130, 246, 0.5)");
        grad.addColorStop(0.7, "rgba(147, 197, 253, 0.3)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0.1)");

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.shadowColor = "rgba(0, 210, 255, 0.4)";
        ctx.shadowBlur = 12;
        ctx.stroke();

        // Outer glow line (wider, softer)
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let j = 1; j < points.length; j++) {
          ctx.lineTo(points[j].x, points[j].y);
        }
        ctx.strokeStyle = "rgba(0, 210, 255, 0.08)";
        ctx.lineWidth = 6;
        ctx.shadowColor = "rgba(0, 210, 255, 0.2)";
        ctx.shadowBlur = 25;
        ctx.stroke();

        // --- Glowing node at the tip ---
        const tip = points[points.length - 1];
        // Outer glow circle
        const nodeGrad = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 10);
        nodeGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        nodeGrad.addColorStop(0.3, "rgba(0, 210, 255, 0.7)");
        nodeGrad.addColorStop(0.6, "rgba(59, 130, 246, 0.3)");
        nodeGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = nodeGrad;
        ctx.shadowColor = "#00d2ff";
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Bright core of the node
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.fill();
      }

      // Reset shadow
      ctx.shadowBlur = 0;
    };

    // ---- MAIN UPDATE LOOP ----
    const update = () => {
      timeRef.current += 0.016; // ~60fps step

      // --- Target logic ---
      if (isMouseActive.current) {
        targetRef.current.x = mouseRef.current.x;
        targetRef.current.y = mouseRef.current.y;
      } else {
        // Smooth random wandering
        wanderAngleRef.current += (Math.random() - 0.5) * 0.25;
        const wanderSpeed = 1.2;
        targetRef.current.x += Math.cos(wanderAngleRef.current) * wanderSpeed;
        targetRef.current.y += Math.sin(wanderAngleRef.current) * wanderSpeed;

        // Bounce off edges
        const padding = 120;
        if (targetRef.current.x < padding) wanderAngleRef.current = Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
        if (targetRef.current.x > width - padding) wanderAngleRef.current = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
        if (targetRef.current.y < padding) wanderAngleRef.current = (Math.random() - 0.5) * 0.5;
        if (targetRef.current.y > height - padding) wanderAngleRef.current = Math.PI + (Math.random() - 0.5) * 0.5;
      }

      // Smooth head follows target (faster follow when mouse active)
      const followSpeed = isMouseActive.current ? 0.1 : 0.04;
      headRef.current.x += (targetRef.current.x - headRef.current.x) * followSpeed;
      headRef.current.y += (targetRef.current.y - headRef.current.y) * followSpeed;

      updateTentacles(headRef.current.x, headRef.current.y, timeRef.current);
      draw();

      animationFrameRef.current = requestAnimationFrame(update);
    };

    // ---- EVENTS ----
    resize();
    update();
    checkScrollVisibility();

    const handleScroll = () => {
      checkScrollVisibility();
    };

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      isMouseActive.current = true;
      clearTimeout(mouseTimeoutRef.current);
      mouseTimeoutRef.current = setTimeout(() => {
        isMouseActive.current = false;
      }, 2000);
    };

    const handleMouseLeave = () => {
      isMouseActive.current = false;
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        mouseRef.current.x = touch.clientX;
        mouseRef.current.y = touch.clientY;
        isMouseActive.current = true;
        clearTimeout(mouseTimeoutRef.current);
        mouseTimeoutRef.current = setTimeout(() => {
          isMouseActive.current = false;
        }, 2000);
      }
    };

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      if (touch) {
        mouseRef.current.x = touch.clientX;
        mouseRef.current.y = touch.clientY;
        isMouseActive.current = true;
      }
    };

    const handleTouchEnd = () => {
      clearTimeout(mouseTimeoutRef.current);
      mouseTimeoutRef.current = setTimeout(() => {
        isMouseActive.current = false;
      }, 2000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      clearTimeout(mouseTimeoutRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
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

export default TentacleCanvas;

