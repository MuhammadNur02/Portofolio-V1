import { useEffect, useRef } from "react";
import * as THREE from "three";

// Warm night palette — kept in sync with CursorTrail's ember colors.
const PALETTE = {
  sky: 0x05070a,
  fog: 0x0a0e16,
  fogDeep: 0x03040a,
  moon: 0xe0562f,
  moonGlow: 0xff8a5c,
  embers: [0xf59e0b, 0xfb923c, 0xfbbf24, 0xe0231c],
};

const MOUNTAIN_LAYERS = [
  { color: 0x141c26, z: -140, amplitude: 18, width: 420, segments: 24, parallax: 0.3 },
  { color: 0x0d141c, z: -70, amplitude: 14, width: 220, segments: 20, parallax: 0.6 },
  { color: 0x080d12, z: -30, amplitude: 10, width: 140, segments: 16, parallax: 1 },
];

const ridgeHeight = (t, amplitude) =>
  (Math.sin(t * 6.1 + 1.3) * 0.5 +
    Math.sin(t * 13.7 + 4.2) * 0.3 +
    Math.sin(t * 27.3 + 2.1) * 0.2) *
  amplitude;

function makeMountainLayer({ color, z, amplitude, width, segments, parallax }) {
  const half = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-half, -40);
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    shape.lineTo(-half + width * t, ridgeHeight(t, amplitude));
  }
  shape.lineTo(half, -40);
  shape.lineTo(-half, -40);

  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({ color, fog: true });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = z;
  return { mesh, geometry, material, parallax };
}

function makeGlowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.3, "rgba(255,180,120,0.6)");
  gradient.addColorStop(1, "rgba(255,120,60,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function makeDotTexture() {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.6)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function makeEmbers(count, dotTexture) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);
  const palette = PALETTE.embers.map((c) => new THREE.Color(c));

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 120;
    positions[i * 3 + 1] = Math.random() * 50 - 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 100 - 20;

    const c = palette[i % palette.length];
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    phases[i] = Math.random() * Math.PI * 2;
    speeds[i] = 0.4 + Math.random() * 0.8;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.4,
    map: dotTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  return { points, geometry, material, positions, phases, speeds };
}

function updateEmbers(positions, phases, speeds, dt, t, driftScale) {
  for (let i = 0; i < phases.length; i++) {
    const idx = i * 3;
    positions[idx + 1] += speeds[i] * dt * driftScale;
    positions[idx] += Math.sin(t * 0.5 + phases[i]) * 0.01 * driftScale;

    if (positions[idx + 1] > 40) {
      positions[idx + 1] = -10;
      positions[idx] = (Math.random() - 0.5) * 120;
      positions[idx + 2] = (Math.random() - 0.5) * 100 - 20;
    }
  }
}

const SceneBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(PALETTE.sky);
    scene.fog = new THREE.FogExp2(PALETTE.fog, 0.012);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 600);
    camera.position.set(0, 4, 22);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const resize = () => {
      const { innerWidth: w, innerHeight: h } = window;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();

    // Moon
    const moon = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 32), new THREE.MeshBasicMaterial({ color: PALETTE.moon }));
    moon.position.set(18, 22, -140);
    scene.add(moon);

    const glowTexture = makeGlowTexture();
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: PALETTE.moonGlow,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(60, 60, 1);
    glow.position.copy(moon.position);
    scene.add(glow);

    // Mountains
    const mountains = MOUNTAIN_LAYERS.map(makeMountainLayer);
    mountains.forEach((m) => scene.add(m.mesh));

    // Embers
    const emberCount = window.innerWidth < 640 ? 90 : 200;
    const dotTexture = makeDotTexture();
    const embers = makeEmbers(emberCount, dotTexture);
    scene.add(embers.points);

    // Scroll progress — smoothed toward target each frame, no external dependency.
    let targetProgress = 0;
    let scrollProgress = 0;
    const handleScroll = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      targetProgress = Math.min(Math.max(window.pageYOffset / maxScroll, 0), 1);
    };
    if (!reduceMotion) {
      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
    }

    let raf;
    let lastT = performance.now();
    let elapsed = 0;
    const driftScale = reduceMotion ? 0.08 : 1;

    const animate = (now) => {
      raf = requestAnimationFrame(animate);
      if (document.hidden) return;

      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      elapsed += dt;

      scrollProgress += (targetProgress - scrollProgress) * 0.06;
      const p = scrollProgress;

      camera.position.y = 4 - p * 6;
      camera.position.x = Math.sin(p * Math.PI) * 3;
      camera.rotation.x = -0.03 - p * 0.05;

      mountains.forEach((m) => {
        m.mesh.position.x = -p * m.parallax * 40;
      });

      scene.fog.color.set(PALETTE.fog).lerp(new THREE.Color(PALETTE.fogDeep), p * 0.4);
      scene.fog.density = 0.012 + p * 0.01;

      glowMaterial.opacity = 0.42 + Math.sin(elapsed * 0.6) * 0.08;

      updateEmbers(embers.positions, embers.phases, embers.speeds, dt, elapsed, driftScale);
      embers.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);

      glowTexture.dispose();
      glowMaterial.dispose();
      moon.geometry.dispose();
      moon.material.dispose();
      mountains.forEach((m) => {
        m.geometry.dispose();
        m.material.dispose();
      });
      embers.geometry.dispose();
      embers.material.dispose();
      dotTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />;
};

export default SceneBackground;
