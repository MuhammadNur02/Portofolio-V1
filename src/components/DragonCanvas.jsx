import React, { useEffect, useRef } from "react";

/**
 * DragonCanvas — Falling Leaves ambience (kage-inspired night-temple mood).
 * Each leaf tumbles on its own axis (roll + spin) so it presents a face,
 * thins to an edge, and opens out again — the tumble that reads as "leaf"
 * rather than a flat confetti spin. Lateral slip is coupled to the tumble
 * so the motion looks aerodynamic instead of windy.
 */

const PALETTE = ["#c2410c", "#ea580c", "#f59e0b", "#fb923c", "#fda4af"];

const LAYERS = [
  { scale: [0.35, 0.55], fall: [10, 18], opacity: [0.18, 0.32], count: 26 },
  { scale: [0.55, 0.85], fall: [22, 34], opacity: [0.4, 0.6], count: 22 },
  { scale: [0.9, 1.3], fall: [38, 52], opacity: [0.55, 0.78], count: 10 },
];

const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

class Leaf {
  constructor(w, h, layer, spawnAbove = true) {
    this.layer = layer;
    this.w = w;
    this.reset(w, h, spawnAbove);
  }

  reset(w, h, spawnAbove) {
    this.x = rand(-40, w + 40);
    this.y = spawnAbove ? rand(-h, -20) : rand(0, h);
    this.scale = rand(...this.layer.scale);
    this.fall = rand(...this.layer.fall);
    this.opacity = rand(...this.layer.opacity);
    this.roll = rand(0, Math.PI * 2);
    this.rollRate = rand(-0.35, 0.35);
    this.spin = rand(0, Math.PI * 2);
    this.spinRate = rand(0.6, 1.4) * (Math.random() < 0.5 ? -1 : 1);
    this.slip = rand(10, 26);
    this.color = pick(PALETTE);
    this.size = 9 * this.scale;
  }

  update(dt, w, h) {
    this.spin += this.spinRate * dt;
    this.roll += this.rollRate * dt;
    this.x += Math.sin(this.spin) * this.slip * dt;
    this.y += this.fall * dt;
    if (this.y > h + 30) this.reset(w, h, true);
    if (this.x < -60) this.x = w + 40;
    if (this.x > w + 60) this.x = -40;
  }

  draw(ctx) {
    const tumble = Math.cos(this.spin);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.roll);
    ctx.scale(Math.max(Math.abs(tumble), 0.06), 1);
    ctx.globalAlpha = this.opacity * (0.55 + 0.45 * Math.abs(tumble));

    const s = this.size;
    ctx.fillStyle = tumble < 0 ? shade(this.color, -25) : this.color;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.9, -s * 0.4, s * 0.9, s * 0.4, 0, s);
    ctx.bezierCurveTo(-s * 0.9, s * 0.4, -s * 0.9, -s * 0.4, 0, -s);
    ctx.fill();

    ctx.strokeStyle = shade(this.color, -35);
    ctx.globalAlpha *= 0.5;
    ctx.lineWidth = Math.max(0.4, s * 0.06);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.85);
    ctx.lineTo(0, s * 0.85);
    ctx.stroke();

    ctx.restore();
  }
}

function shade(hex, amt) {
  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) + amt;
  let g = ((num >> 8) & 0xff) + amt;
  let b = (num & 0xff) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}

const DragonCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    const areaScale = Math.min(1.3, Math.max(0.5, Math.sqrt((w * h) / (1440 * 900))));
    const densityScale = reducedMotion ? 0.25 : areaScale;

    let leaves = LAYERS.flatMap((layer) =>
      Array.from({ length: Math.round(layer.count * densityScale) }, () =>
        new Leaf(w, h, layer, false)
      )
    );

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

      ctx.clearRect(0, 0, w, h);
      const speedMul = reducedMotion ? 0.15 : 1;
      for (const leaf of leaves) {
        leaf.update(dt * speedMul, w, h);
        leaf.draw(ctx);
      }
    };

    const handleResize = () => applySize();
    const handleVisibility = () => {
      paused = document.hidden;
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);
    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
};

export default DragonCanvas;
