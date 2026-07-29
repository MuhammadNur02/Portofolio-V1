import React, { useEffect, useRef, useCallback, useState } from "react";

const GAME_CONFIG = {
  planeSize: 28,
  bulletSpeed: 9,
  bulletFireRate: 80,
  meteorBaseSpeed: 1.2,
  meteorSpawnInterval: 1200,
  meteorHP: 6,
  meteorSize: 24,
  maxMeteors: 12,
  trailParticlesPerFrame: 2,
  explosionParticles: 18,
};

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}
function rand(min, max) {
  return Math.random() * (max - min) + min;
}
function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

const SpaceGame = ({ onClose }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const shakeRef = useRef({ x: 0, y: 0, intensity: 0 });
  const gameStateRef = useRef({
    plane: { x: 0, y: 0, targetX: 0, targetY: 0, angle: 0, roll: 0 },
    bullets: [], meteors: [], particles: [], explosions: [],
    keys: {}, gameOver: false, lastShot: 0, lastSpawn: 0,
    score: 0, animId: null, time: 0, dimensions: { w: 400, h: 500 },
  });
  const [gameOver, setGameOver] = useState(false);
  const scoreRef = useRef(0);

  const triggerShake = useCallback(() => {
    const intensity = rand(4, 8);
    shakeRef.current = { x: rand(-intensity, intensity), y: rand(-intensity, intensity), intensity };
  }, []);

  const resizeCanvas = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const gs = gameStateRef.current;
    gs.dimensions = { w, h };
    gs.plane.x = w * 0.35;
    gs.plane.y = h * 0.65;
    gs.plane.targetX = gs.plane.x;
    gs.plane.targetY = gs.plane.y;
  }, []);

  const spawnMeteor = useCallback(() => {
    const gs = gameStateRef.current;
    if (gs.meteors.length >= GAME_CONFIG.maxMeteors) return;
    const { w, h } = gs.dimensions;
    const fromTop = randInt(0, 1);
    let x = fromTop ? rand(0, w * 0.7) : -GAME_CONFIG.meteorSize;
    let y = fromTop ? -GAME_CONFIG.meteorSize : rand(0, h * 0.5);
    const vx = rand(0.8, 1.8);
    const vy = rand(1.2, 2.5);
    gs.meteors.push({ x, y, vx, vy, size: rand(GAME_CONFIG.meteorSize * 0.8, GAME_CONFIG.meteorSize * 1.2), hp: GAME_CONFIG.meteorHP, maxHp: GAME_CONFIG.meteorHP, rotation: rand(0, Math.PI * 2), rotSpeed: rand(-0.03, 0.03), spawnTime: gs.time, flicker: rand(0, Math.PI * 2) });
  }, []);

  const fireBullet = useCallback(() => {
    const gs = gameStateRef.current;
    const { plane } = gs;
    const angle = -Math.PI*(2 / 3);
    const bx = plane.x + Math.cos(angle) * GAME_CONFIG.planeSize * 0.8;
    const by = plane.y + Math.sin(angle) * GAME_CONFIG.planeSize * 0.8;
    gs.bullets.push({ x: bx, y: by, vx: Math.cos(angle) * GAME_CONFIG.bulletSpeed, vy: Math.sin(angle) * GAME_CONFIG.bulletSpeed, life: 0, maxLife: 60, size: 3 });
  }, []);

  const spawnExplosion = useCallback((x, y, color) => {
    if (!color) color = "#ffaa00";
    const gs = gameStateRef.current;
    for (let i = 0; i < GAME_CONFIG.explosionParticles + randInt(0, 8); i++) {
      const a = rand(0, Math.PI * 2);
      const spd = rand(1, 5);
      gs.particles.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 0, maxLife: randInt(20, 50), size: rand(2, 6), color, type: "explosion" });
    }
  }, []);

  const spawnJetTrail = useCallback(() => {
    const gs = gameStateRef.current;
    const { plane } = gs;
    const backAngle = plane.angle + Math.PI;
    for (let i = 0; i < GAME_CONFIG.trailParticlesPerFrame; i++) {
      const a = backAngle + rand(-0.4, 0.4);
      const offset = rand(5, 15);
      gs.particles.push({ x: plane.x + Math.cos(backAngle) * offset + rand(-3, 3), y: plane.y + Math.sin(backAngle) * offset + rand(-3, 3), vx: Math.cos(a) * rand(1, 3), vy: Math.sin(a) * rand(1, 3), life: 0, maxLife: randInt(10, 25), size: rand(2, 5), color: "#00aaff", type: "jet" });
    }
  }, []);

  const update = useCallback(() => {
    const gs = gameStateRef.current;
    if (gs.gameOver) return;
    gs.time++;
    const { w, h } = gs.dimensions;
    const { plane } = gs;
    plane.x += (plane.targetX - plane.x) * 0.12;
    plane.y += (plane.targetY - plane.y) * 0.12;
    plane.x = Math.max(20, Math.min(w - 20, plane.x));
    plane.y = Math.max(20, Math.min(h - 20, plane.y));
    const baseAngle = -Math.PI * (2 / 3);
    const rollTarget = Math.atan2(plane.targetY - plane.y, plane.targetX - plane.x) * 0.3;
    plane.roll += (rollTarget - plane.roll) * 0.1;
    plane.angle = baseAngle + plane.roll;
    const now = Date.now();
    if (now - gs.lastShot > GAME_CONFIG.bulletFireRate) { fireBullet(); gs.lastShot = now; }
    if (gs.time - gs.lastSpawn > GAME_CONFIG.meteorSpawnInterval / 16.67) { spawnMeteor(); gs.lastSpawn = gs.time; if (gs.time > 600) { GAME_CONFIG.meteorSpawnInterval = Math.max(400, 1200 - Math.min(600, Math.floor(gs.time / 600) * 80)); } }
    spawnJetTrail();
    for (let i = gs.bullets.length - 1; i >= 0; i--) {
      const b = gs.bullets[i];
      b.x += b.vx; b.y += b.vy; b.life++;
      if (b.life > b.maxLife || b.x > w + 20 || b.y < -20 || b.x < -20 || b.y > h + 20) gs.bullets.splice(i, 1);
    }
    for (let i = gs.meteors.length - 1; i >= 0; i--) {
      const m = gs.meteors[i];
      m.x += m.vx; m.y += m.vy; m.rotation += m.rotSpeed; m.flicker += 0.1;
      if (m.y > h + m.size && m.x > 0 && m.x < w) { gs.gameOver = true; setGameOver(true); return; }
      if (m.x > w + m.size * 2 || m.y > h + m.size * 2 || m.x < -m.size * 2) gs.meteors.splice(i, 1);
    }
    for (let i = gs.bullets.length - 1; i >= 0; i--) {
      const b = gs.bullets[i];
      let hit = false;
      for (let j = gs.meteors.length - 1; j >= 0; j--) {
        const m = gs.meteors[j];
        if (dist(b.x, b.y, m.x, m.y) < m.size + b.size) { m.hp--; hit = true; spawnExplosion(b.x, b.y, "#88ccff");
          if (m.hp <= 0) { triggerShake(); spawnExplosion(m.x, m.y, "#ff6600"); gs.score += 10; scoreRef.current = gs.score; gs.meteors.splice(j, 1); } break; }
      }
      if (hit) gs.bullets.splice(i, 1);
    }
    for (let i = gs.particles.length - 1; i >= 0; i--) {
      const p = gs.particles[i];
      p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96; p.life++;
      if (p.life > p.maxLife) gs.particles.splice(i, 1);
    }
    const shake = shakeRef.current;
    if (shake.intensity > 0.5) { shake.intensity *= 0.85; shake.x = rand(-shake.intensity, shake.intensity); shake.y = rand(-shake.intensity, shake.intensity); }
    else { shake.intensity = 0; shake.x = 0; shake.y = 0; }
  }, [fireBullet, spawnMeteor, spawnExplosion, spawnJetTrail, triggerShake]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const gs = gameStateRef.current;
    const { w, h } = gs.dimensions;
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const shake = shakeRef.current;
    ctx.translate(shake.x, shake.y);
    ctx.clearRect(-10, -10, w + 20, h + 20);
    for (const p of gs.particles) {
      const alpha = 1 - p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    for (const m of gs.meteors) {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.rotation);
      const gradGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, m.size * 1.5);
      gradGlow.addColorStop(0, "rgba(255,100,0,0.3)");
      gradGlow.addColorStop(0.5, "rgba(255,60,0,0.1)");
      gradGlow.addColorStop(1, "rgba(255,0,0,0)");
      ctx.fillStyle = gradGlow;
      ctx.beginPath();
      ctx.arc(0, 0, m.size * 1.5, 0, Math.PI * 2);
      ctx.fill();
      const flicker = Math.sin(m.flicker) * 0.15 + 0.85;
      const fireGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, m.size);
      fireGrad.addColorStop(0, "rgba(255," + Math.floor(200 * flicker) + ",0,0.9)");
      fireGrad.addColorStop(0.4, "rgba(255,100,0," + (0.7 * flicker) + ")");
      fireGrad.addColorStop(0.7, "rgba(150,40,0," + (0.5 * flicker) + ")");
      fireGrad.addColorStop(1, "rgba(80,20,0,0)");
      ctx.fillStyle = fireGrad;
      ctx.beginPath();
      ctx.arc(0, 0, m.size, 0, Math.PI * 2);
      ctx.fill();
      const coreSize = m.size * 0.55;
      const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize);
      coreGrad.addColorStop(0, "#333");
      coreGrad.addColorStop(0.5, "#222");
      coreGrad.addColorStop(1, "#111");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      const hp = m.hp / m.maxHp;
      const bw = m.size * 1.5;
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(m.x - bw / 2, m.y - m.size - 10, bw, 4);
      ctx.fillStyle = hp > 0.5 ? "#44ff44" : hp > 0.25 ? "#ffaa00" : "#ff4444";
      ctx.fillRect(m.x - bw / 2, m.y - m.size - 10, bw * hp, 4);
      ctx.shadowBlur = 0;
    }
    for (const b of gs.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffaa";
      ctx.shadowColor = "#ffff00";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 6;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    const pl = gs.plane;
    ctx.save();
    ctx.translate(pl.x, pl.y);
    ctx.rotate(pl.angle);
    const ps = GAME_CONFIG.planeSize;
    const flameLen = ps * 0.9 + Math.sin(gs.time * 0.3) * 5;
    const flameGrad = ctx.createRadialGradient(-ps * 0.5, 0, 0, -ps * 0.5, 0, flameLen);
    flameGrad.addColorStop(0, "rgba(100,200,255,0.9)");
    flameGrad.addColorStop(0.3, "rgba(0,150,255,0.6)");
    flameGrad.addColorStop(0.6, "rgba(0,80,200,0.3)");
    flameGrad.addColorStop(1, "rgba(0,50,150,0)");
    ctx.fillStyle = flameGrad;
    ctx.shadowColor = "#0088ff";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(-ps * 0.3, -6);
    ctx.lineTo(-ps * 0.3 - flameLen, 0);
    ctx.lineTo(-ps * 0.3, 6);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = "#00ccff";
    ctx.shadowBlur = 15;
    const bodyGrad = ctx.createLinearGradient(0, -ps, 0, ps);
    bodyGrad.addColorStop(0, "rgba(0,180,255,0.8)");
    bodyGrad.addColorStop(0.5, "rgba(59,130,246,0.9)");
    bodyGrad.addColorStop(1, "rgba(100,100,255,0.7)");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(ps * 0.8, 0);
    ctx.lineTo(-ps * 0.2, -ps * 0.35);
    ctx.lineTo(-ps * 0.1, -ps * 0.12);
    ctx.lineTo(-ps * 0.4, -ps * 0.1);
    ctx.lineTo(-ps * 0.4, ps * 0.1);
    ctx.lineTo(-ps * 0.1, ps * 0.12);
    ctx.lineTo(-ps * 0.2, ps * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ps * 0.5, -ps * 0.1);
    ctx.lineTo(-ps * 0.1, 0);
    ctx.lineTo(ps * 0.5, ps * 0.1);
    ctx.stroke();
    ctx.restore();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "14px Poppins, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Star " + gs.score, 12, 24);
    ctx.restore();
  }, []);

  const gameLoop = useCallback(() => {
    update();
    draw();
    const gs = gameStateRef.current;
    if (!gs.gameOver) { gs.animId = requestAnimationFrame(gameLoop); }
  }, [update, draw]);

  useEffect(() => {
    resizeCanvas();
    const gs = gameStateRef.current;
    gs.lastShot = Date.now();
    gs.animId = requestAnimationFrame(gameLoop);
    return () => { if (gs.animId) cancelAnimationFrame(gs.animId); };
  }, [resizeCanvas, gameLoop]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const gs = gameStateRef.current;
      gs.plane.targetX = e.clientX - rect.left;
      gs.plane.targetY = e.clientY - rect.top;
    };
    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = container.getBoundingClientRect();
      const gs = gameStateRef.current;
      gs.plane.targetX = touch.clientX - rect.left;
      gs.plane.targetY = touch.clientY - rect.top;
    };
    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = container.getBoundingClientRect();
      const gs = gameStateRef.current;
      gs.plane.targetX = touch.clientX - rect.left;
      gs.plane.targetY = touch.clientY - rect.top;
    };
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchstart", handleTouchStart);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => resizeCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [resizeCanvas]);

  const handlePlayAgain = () => {
    const gs = gameStateRef.current;
    gs.bullets = [];
    gs.meteors = [];
    gs.particles = [];
    gs.explosions = [];
    gs.gameOver = false;
    gs.score = 0;
    gs.time = 0;
    gs.lastShot = Date.now();
    gs.lastSpawn = 0;
    shakeRef.current = { x: 0, y: 0, intensity: 0 };
    scoreRef.current = 0;
    setGameOver(false);
    GAME_CONFIG.meteorSpawnInterval = 1200;
    gs.animId = requestAnimationFrame(gameLoop);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ cursor: "none" }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {gameOver ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">Game Over</h3>
            <p className="text-white/70 text-sm">Score: <span className="text-cyan-400 font-bold text-lg">{scoreRef.current}</span></p>
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={handlePlayAgain} className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30">Play Again</button>
              <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-white/20 text-white/80 font-medium text-sm transition-all hover:bg-white/10 hover:border-white/40">Close</button>
            </div>
            </div>
        </div>
      ) : null}
    </div>
  );
};

export default SpaceGame;
