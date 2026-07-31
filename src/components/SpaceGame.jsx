import React, { useEffect, useRef, useCallback, useState } from "react";
import DragonCanvas from './DragonCanvas';

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
  const planeImageRef = useRef(null);
  const meteorImageRef = useRef(null);
  const gameStateRef = useRef({
    plane: { x: 0, y: 0, targetX: 0, targetY: 0, angle: 0, roll: 0 },
    bullets: [], meteors: [], particles: [], explosions: [],
    keys: {}, gameOver: false, lastShot: 0, lastSpawn: 0,
    score: 0, animId: null, time: 0, dimensions: { w: 400, h: 500 },
  });
  useEffect(() => {
    const planeImg = new Image();
    planeImg.src = "/Pesawat.png";
    planeImg.onload = () => { planeImageRef.current = planeImg; };

    const meteorImg = new Image();
    meteorImg.src = "/Meteor.png"; 
    meteorImg.onload = () => { meteorImageRef.current = meteorImg; };
  }, []);
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
    gs.plane.x = w * 0.5;
    gs.plane.y = h * 0.85;
    gs.plane.targetX = gs.plane.x;
    gs.plane.targetY = gs.plane.y;
  }, []);

  const spawnMeteor = useCallback(() => {
  const gs = gameStateRef.current;
  if (gs.meteors.length >= GAME_CONFIG.maxMeteors) return;
  const { w } = gs.dimensions;
  
  // Muncul secara acak di sepanjang sumbu X di atas layar (y di luar batas atas)
  let x = rand(GAME_CONFIG.meteorSize, w - GAME_CONFIG.meteorSize);
  let y = -GAME_CONFIG.meteorSize * 2;
  
  // Bergerak lurus ke bawah dengan sedikit variasi horizontal
  const vx = rand(-0.5, 0.5);
  const vy = rand(1.5, 3.0); // Kecepatan jatuh ke bawah
  
  gs.meteors.push({ 
    x, y, vx, vy, 
    size: rand(GAME_CONFIG.meteorSize * 0.8, GAME_CONFIG.meteorSize * 1.2), 
    hp: GAME_CONFIG.meteorHP, 
    maxHp: GAME_CONFIG.meteorHP, 
    rotation: rand(0, Math.PI * 2), 
    rotSpeed: rand(-0.03, 0.03), 
    spawnTime: gs.time, 
    flicker: rand(0, Math.PI * 2) 
  });
}, []);

  const fireBullet = useCallback(() => {
  const gs = gameStateRef.current;
  const { plane } = gs;
  // Ubah ke arah atas (jam 12)
  const angle = -Math.PI / 2; 
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
    plane.angle = -Math.PI / 2;
    plane.roll = 0; 
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

    for (let i = gs.meteors.length - 1; i >= 0; i--) {
      const m = gs.meteors[i];
      
      // Sesuaikan variabel penampung posisi naga Anda (misal: gs.dragonSegments atau variabel naga lain)
      if (gs.dragonSegments && gs.dragonSegments.length > 0) {
        let destroyedByDragon = false;
        for (const seg of gs.dragonSegments) {
          if (dist(seg.x, seg.y, m.x, m.y) < m.size + 35) { // 35 adalah radius sentuhan tubuh naga
            m.hp -= 2; // Damage tambahan dari naga
            spawnExplosion(m.x, m.y, "#00ffff"); // Efek ledakan kebiruan ala naga
            
            if (m.hp <= 0) {
              triggerShake();
              spawnExplosion(m.x, m.y, "#ff6600");
              gs.score += 15; // Bonus poin
              scoreRef.current = gs.score;
              gs.meteors.splice(i, 1);
              destroyedByDragon = true;
            }
            break;
          }
        }
        if (destroyedByDragon) continue;
      }
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

      // --- 1. EKOR API PANJANG MENJULUR KE ATAS ---
      const tailLen = m.size * 3.8; // Ekor dibuat jauh lebih panjang
      const tailGrad = ctx.createLinearGradient(0, 0, 0, -tailLen);
      tailGrad.addColorStop(0, "rgba(255, 150, 0, 0.85)");  // Terang di dekat batu
      tailGrad.addColorStop(0.3, "rgba(255, 60, 0, 0.6)");   // Merah menyala di tengah
      tailGrad.addColorStop(0.7, "rgba(200, 20, 0, 0.25)");  // Meredup
      tailGrad.addColorStop(1, "rgba(100, 0, 0, 0)");        // Memudar total di ujung atas

      ctx.fillStyle = tailGrad;
      ctx.beginPath();
      // Bentuk kerucut ekor panjang dan ramping ke arah atas
      ctx.moveTo(-m.size * 0.8, 0);
      ctx.lineTo(0, -tailLen);
      ctx.lineTo(m.size * 0.8, 0);
      ctx.closePath();
      ctx.fill();

      // --- 2. JEJAK PERCIKAN API (SPARK TRAILS) ---
      for (let i = 0; i < 6; i++) {
        // Posisi percikan api disebar secara dinamis menggunakan fungsi waktu (gs.time)
        const sparkOffset = Math.sin(gs.time * 0.5 + i * 12) * (m.size * 0.6);
        const sparkY = -rand(m.size * 0.5, tailLen * 0.9);
        
        ctx.fillStyle = i % 2 === 0 ? "#ffff33" : "#ff5500"; // Kuning dan oranye menyala
        ctx.shadowColor = "#ff3300";
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.arc(sparkOffset, sparkY, rand(1.5, 3.5), 0, Math.PI * 2);
        ctx.fill();
      }

      // --- 3. RADIASI API RAPAT DI SEKELILING BATU ---
      const fireGlow = ctx.createRadialGradient(0, 0, m.size * 0.3, 0, 0, m.size * 1.3);
      fireGlow.addColorStop(0, "rgba(255, 200, 50, 0.9)");
      fireGlow.addColorStop(0.6, "rgba(255, 60, 0, 0.7)");
      fireGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = fireGlow;
      ctx.shadowColor = "#ff3300";
      ctx.shadowBlur = 15;
      
      ctx.beginPath();
      ctx.arc(0, 0, m.size * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // --- 4. GAMBAR METEOR.PNG DI TENGAH ---
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ff4500";
      ctx.rotate(m.rotation);
      
      if (meteorImageRef.current) {
        const drawSize = m.size * 2.6;
        ctx.drawImage(
          meteorImageRef.current,
          -drawSize / 2,
          -drawSize / 2,
          drawSize,
          drawSize
        );
      }
      ctx.restore();

      // --- 5. BAR HP METEOR DI BAWAH ---
      const hp = m.hp / m.maxHp;
      const bw = m.size * 1.5;
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(m.x - bw / 2, m.y + m.size + 8, bw, 5);
      ctx.fillStyle = hp > 0.5 ? "#44ff44" : hp > 0.25 ? "#ffaa00" : "#ff4444";
      ctx.fillRect(m.x - bw / 2, m.y + m.size + 8, bw * hp, 5);
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
    
    // Sesuaikan rotasi jika gambar pesawat aslinya perlu diputar 
    // (misal ditambah Math.PI / 2 jika menghadap ke atas)
    ctx.rotate(pl.angle + Math.PI / 2); 

    if (planeImageRef.current) {
      const ps = GAME_CONFIG.planeSize * 2; // Sesuaikan ukuran gambar pesawat
      ctx.drawImage(
        planeImageRef.current,
        -ps / 2,
        -ps / 2,
        ps,
        ps
      );
    }
    ctx.restore();

    // Render teks skor tetap berada di bawahnya
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
      if (gs.gameOver) return; // Jangan gerakkan pesawat jika sudah game over
      gs.plane.targetX = e.clientX - rect.left;
      gs.plane.targetY = e.clientY - rect.top;
    };
    
    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = container.getBoundingClientRect();
      const gs = gameStateRef.current;
      if (gs.gameOver) return;
      gs.plane.targetX = touch.clientX - rect.left;
      gs.plane.targetY = touch.clientY - rect.top;
    };

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = container.getBoundingClientRect();
      const gs = gameStateRef.current;
      if (gs.gameOver) return;
      gs.plane.targetX = touch.clientX - rect.left;
      gs.plane.targetY = touch.clientY - rect.top;
    };

    // 👇 TAMBAHKAN: Fungsi untuk memicu Game Over secara manual
    const triggerManualGameOver = () => {
      const gs = gameStateRef.current;
      if (!gs.gameOver) {
        gs.gameOver = true;
        setGameOver(true);
      }
    };

    // 👇 TAMBAHKAN: Handler untuk tombol Keyboard (Spasi)
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault(); // Mencegah halaman ikut scroll ke bawah
        triggerManualGameOver();
      }
    };

    // 👇 TAMBAHKAN: Handler untuk Klik Mouse di area game
    const handleClick = () => {
      triggerManualGameOver();
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    
    // Daftarkan event listener baru untuk Spasi dan Klik Mouse
    window.addEventListener("keydown", handleKeyDown);
    container.addEventListener("click", handleClick);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("click", handleClick);
    };
  }, []);
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
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ cursor: gameOver ? "default" : "none" }}>
      {/* 👇 Tambahkan pointer-events-none di sini */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      
      {gameOver ? (
        /* 👇 Tambahkan pointer-events-auto di sini agar tombol Play Again & Close bisa diklik */
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
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
