import React, { useEffect, useRef } from "react";
import daunUrl from "../assets/daun.webp";

/**
 * CursorTrail — small falling-leaf sprites that trail behind the pointer.
 *
 * Emits by distance travelled rather than by timer, so spacing along the
 * path stays constant whether the hand crawls or flicks. A timer-based
 * emitter would space motes by speed × interval, breaking a flick into
 * scattered dots and piling a resting hand's motes on one spot.
 */

const STEP = 14; // px between spawns
const MAX_SPAWNS_PER_FRAME = 10;
const RING_SIZE = 140;

const damp = (a, b, lambda, dt) => b + (a - b) * Math.exp(-lambda * dt);

// Strips the near-white background of the leaf photo into a transparent cutout.
function loadLeafCutout(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness > 235) {
          data[i + 3] = 0;
        } else if (brightness > 195) {
          data[i + 3] = Math.round(data[i + 3] * (1 - (brightness - 195) / 40));
        }
      }
      ctx.putImageData(imageData, 0, 0);

      resolve({ canvas, aspect: canvas.width / canvas.height });
    };
    img.onerror = reject;
    img.src = url;
  });
}

const CursorTrail = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const isTouch =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(hover: none)").matches;
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTouch || reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = window.innerWidth;
    let h = window.innerHeight;
    const applySize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    applySize();

    const motes = Array.from({ length: RING_SIZE }, () => ({ life: 0 }));
    let ringIndex = 0;
    let leafImg = null;
    loadLeafCutout(daunUrl).then((img) => {
      leafImg = img;
    });

    const emitter = { x: w / 2, y: h / 2, acc: 0 };
    const pointer = { x: w / 2, y: h / 2, active: false, lastMoveAt: 0 };
    let idleAcc = 0;

    const spawn = (x, y) => {
      const i = ringIndex;
      ringIndex = (ringIndex + 1) % RING_SIZE;
      const angle = Math.random() * Math.PI * 2;
      const dirAngle = Math.atan2(pointer.y - emitter.y, pointer.x - emitter.x);
      motes[i] = {
        x,
        y,
        vx:
          Math.cos(dirAngle) * -0.4 * STEP * 0.6 +
          Math.cos(angle) * rand(6, 22),
        vy:
          Math.sin(dirAngle) * -0.4 * STEP * 0.6 +
          Math.sin(angle) * rand(6, 22) -
          rand(4, 10),
        phase: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
        spin: rand(-3, 3),
        size: rand(13, 24),
        life: 1,
        maxLife: rand(0.9, 1.8),
      };
    };

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    const handlePointerMove = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      pointer.lastMoveAt = performance.now();
    };
    const handlePointerLeave = () => {
      pointer.active = false;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("resize", applySize);

    let last = performance.now();
    let animationFrameId;
    let paused = false;

    const loop = (now) => {
      animationFrameId = requestAnimationFrame(loop);
      if (paused) {
        last = now;
        return;
      }
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      const prevX = emitter.x;
      const prevY = emitter.y;
      emitter.x = damp(emitter.x, pointer.x, 16, dt);
      emitter.y = damp(emitter.y, pointer.y, 16, dt);

      const dx = emitter.x - prevX;
      const dy = emitter.y - prevY;
      const moved = Math.hypot(dx, dy);

      emitter.acc += moved;
      let guard = 0;
      while (emitter.acc >= STEP && guard++ < MAX_SPAWNS_PER_FRAME) {
        emitter.acc -= STEP;
        const t = moved > 1e-6 ? Math.min(1, (guard * STEP) / moved) : 0;
        spawn(prevX + dx * t, prevY + dy * t);
      }

      const idleFor = now - pointer.lastMoveAt;
      if (pointer.active && idleFor > 120) {
        idleAcc += dt;
        if (idleAcc > 0.42) {
          idleAcc = 0;
          spawn(emitter.x + rand(-4, 4), emitter.y + rand(-4, 4));
        }
      } else {
        idleAcc = 0;
      }

      ctx.clearRect(0, 0, w, h);
      if (leafImg) {
        for (const m of motes) {
          if (m.life <= 0) continue;
          m.life -= dt / m.maxLife;
          if (m.life <= 0) continue;

          m.vx *= 1 - 0.9 * dt;
          m.vy *= 1 - 0.9 * dt;
          m.vy += 14 * dt; // slight buoyancy-then-settle
          m.x += m.vx * dt + Math.sin(now / 400 + m.phase) * 6 * dt;
          m.y += m.vy * dt;
          m.rotation += m.spin * dt;

          const u = 1 - m.life;
          const alpha =
            u < 0.12 ? u / 0.12 : Math.max(0, 1 - (u - 0.22) / 0.78);
          const size = m.size * (1 + 0.9 * u);
          const dw = size * 2;
          const dh = dw / leafImg.aspect;
          const squish = Math.cos(now / 260 + m.phase);

          ctx.save();
          ctx.globalAlpha = Math.max(0, alpha) * 0.95;
          ctx.translate(m.x, m.y);
          ctx.rotate(m.rotation);
          ctx.scale(squish, 1);
          ctx.drawImage(leafImg.canvas, -dw / 2, -dh / 2, dw, dh);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    };

    const handleVisibility = () => {
      paused = document.hidden;
      if (!paused) last = performance.now();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", applySize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
    />
  );
};

export default CursorTrail;
