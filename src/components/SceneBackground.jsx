import { useEffect, useRef } from "react";
import * as THREE from "three";

// Warm night-temple palette — kept in sync with CursorTrail's ember colors.
const PALETTE = {
  sky: 0x03050a,
  fog: 0x0b1620,
  fogDeep: 0x010204,
  moon: 0xdb5b45,
  moonGlow: 0xff6a4a,
  embers: [0xf59e0b, 0xfb923c, 0xfbbf24, 0xe0231c],
  torii: 0x7c2a1f,
  toriiDark: 0x5c1e16,
  templeBody: 0x10151d,
  templeWindow: 0xe8caa0,
  hill: 0x0a0f16,
  treeTrunk: 0x0b0a09,
  treeFoliage: [0x7a2b2a, 0x8a3a2c],
  grassTones: ["#13241a", "#1c3623", "#274a2c", "#2f5a33"],
  stairs: 0x141a22,
  lantern: 0x191510,
  lanternGlow: 0xffb066,
};

const HILL_LAYER = { color: PALETTE.hill, z: -170, amplitude: 10, width: 520, segments: 20, parallax: 0.15 };

const TREE_CONFIGS = [
  { x: -13, z: -6, scale: 1.3, foliage: 0 },
  { x: -9, z: -24, scale: 1.7, foliage: 1 },
  { x: 12, z: -9, scale: 1.25, foliage: 1 },
  { x: 9.5, z: -27, scale: 1.6, foliage: 0 },
];

const LANTERN_POSITIONS = [
  { x: -3.4, z: 2.6 },
  { x: 3.6, z: 2.2 },
  { x: 6.6, z: -4 },
];

const ridgeHeight = (t, amplitude) =>
  (Math.sin(t * 6.1 + 1.3) * 0.5 +
    Math.sin(t * 13.7 + 4.2) * 0.3 +
    Math.sin(t * 27.3 + 2.1) * 0.2) *
  amplitude;

function makeHillLayer({ color, z, amplitude, width, segments, parallax }) {
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

function makeMoonTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const base = ctx.createRadialGradient(size * 0.4, size * 0.38, size * 0.05, size / 2, size / 2, size * 0.55);
  base.addColorStop(0, "#f0806a");
  base.addColorStop(0.5, "#d9543f");
  base.addColorStop(1, "#7c2419");
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = "multiply";
  const craters = [
    [0.3, 0.3, 0.16],
    [0.62, 0.22, 0.1],
    [0.7, 0.55, 0.14],
    [0.4, 0.65, 0.12],
    [0.2, 0.6, 0.08],
    [0.55, 0.4, 0.07],
    [0.78, 0.75, 0.09],
    [0.15, 0.42, 0.06],
  ];
  craters.forEach(([cx, cy, r]) => {
    const x = cx * size;
    const y = cy * size;
    const radius = r * size;
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, "rgba(110,30,22,0.85)");
    g.addColorStop(1, "rgba(110,30,22,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalCompositeOperation = "source-over";

  return new THREE.CanvasTexture(canvas);
}

function makeGrassTexture() {
  const w = 512;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * w;
    const baseY = h - Math.random() * h * 0.55;
    const bladeH = 18 + Math.random() * 46;
    const lean = (Math.random() - 0.5) * 14;
    ctx.strokeStyle = PALETTE.grassTones[Math.floor(Math.random() * PALETTE.grassTones.length)];
    ctx.lineWidth = 1 + Math.random() * 1.6;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + lean * 0.5, baseY - bladeH * 0.6, x + lean, baseY - bladeH);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

function makeRoofShape(width, height, eaveLift, ridgeRatio) {
  const half = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-half, 0);
  shape.lineTo(-half, eaveLift);
  shape.lineTo(-half * ridgeRatio, height);
  shape.lineTo(half * ridgeRatio, height);
  shape.lineTo(half, eaveLift);
  shape.lineTo(half, 0);
  shape.lineTo(-half, 0);
  return shape;
}

function makeTemple(parts) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshBasicMaterial({ color: PALETTE.templeBody, fog: true });

  const bodyGeo = new THREE.PlaneGeometry(34, 9);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.set(0, 8, 0);
  group.add(body);
  parts.push({ geometry: bodyGeo, material: bodyMat });

  const roof1Geo = new THREE.ShapeGeometry(makeRoofShape(40, 3.5, 1.2, 0.55));
  const roof1 = new THREE.Mesh(roof1Geo, bodyMat);
  roof1.position.set(0, 11.5, 0.4);
  group.add(roof1);
  parts.push({ geometry: roof1Geo, material: bodyMat });

  const roof2Geo = new THREE.ShapeGeometry(makeRoofShape(20, 3, 1, 0.5));
  const roof2 = new THREE.Mesh(roof2Geo, bodyMat);
  roof2.position.set(0, 15.5, 0.8);
  group.add(roof2);
  parts.push({ geometry: roof2Geo, material: bodyMat });

  const windowMat = new THREE.MeshBasicMaterial({ color: PALETTE.templeWindow, transparent: true, opacity: 0.85 });
  const windowGeo = new THREE.PlaneGeometry(2, 2.4);
  const windowCount = 7;
  for (let i = 0; i < windowCount; i++) {
    const w = new THREE.Mesh(windowGeo, windowMat);
    w.position.set(-13 + (26 * i) / (windowCount - 1), 8, 0.1);
    group.add(w);
  }
  parts.push({ geometry: windowGeo, material: windowMat });

  group.position.set(0, 0, -70);
  return group;
}

function makeToriiGate(parts) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: PALETTE.torii, fog: true });

  const pillarGeo = new THREE.CylinderGeometry(0.4, 0.55, 13, 12);
  const pillarL = new THREE.Mesh(pillarGeo, mat);
  pillarL.position.set(-5, 6.5, 0);
  const pillarR = new THREE.Mesh(pillarGeo, mat);
  pillarR.position.set(5, 6.5, 0);
  group.add(pillarL, pillarR);
  parts.push({ geometry: pillarGeo, material: mat });

  const nukiGeo = new THREE.BoxGeometry(10.6, 0.55, 0.6);
  const nuki = new THREE.Mesh(nukiGeo, mat);
  nuki.position.set(0, 9.2, 0);
  group.add(nuki);
  parts.push({ geometry: nukiGeo, material: mat });

  const shimakiGeo = new THREE.BoxGeometry(12.4, 0.5, 0.85);
  const shimaki = new THREE.Mesh(shimakiGeo, mat);
  shimaki.position.set(0, 12.5, 0);
  group.add(shimaki);
  parts.push({ geometry: shimakiGeo, material: mat });

  const kasagiGeo = new THREE.BoxGeometry(13.6, 0.9, 1.15);
  const kasagi = new THREE.Mesh(kasagiGeo, mat);
  kasagi.position.set(0, 13.25, 0);
  group.add(kasagi);
  parts.push({ geometry: kasagiGeo, material: mat });

  const capGeo = new THREE.BoxGeometry(1.8, 0.55, 1.2);
  [-1, 1].forEach((side) => {
    const cap = new THREE.Mesh(capGeo, mat);
    cap.position.set(side * 6.3, 13.7, 0);
    cap.rotation.z = -side * 0.22;
    group.add(cap);
  });
  parts.push({ geometry: capGeo, material: mat });

  const gakuMat = new THREE.MeshBasicMaterial({ color: PALETTE.toriiDark, fog: true });
  const gakuGeo = new THREE.BoxGeometry(1.1, 1.5, 0.4);
  const gaku = new THREE.Mesh(gakuGeo, gakuMat);
  gaku.position.set(0, 10.9, 0.35);
  group.add(gaku);
  parts.push({ geometry: gakuGeo, material: gakuMat });

  group.position.z = 1;
  return group;
}

function makeStairs(parts) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: PALETTE.stairs, fog: true });
  const steps = 9;
  for (let i = 0; i < steps; i++) {
    const width = 10 - i * 0.35;
    const geo = new THREE.BoxGeometry(width, 0.32, 1.15);
    const step = new THREE.Mesh(geo, mat);
    step.position.set(0, i * 0.3, -i * 1.05);
    group.add(step);
    parts.push({ geometry: geo, material: mat });
  }
  return group;
}

function makeLantern(parts, glowTexture) {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshBasicMaterial({ color: PALETTE.lantern, fog: true });

  const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 2.2, 8);
  const pole = new THREE.Mesh(poleGeo, stoneMat);
  pole.position.y = 1.1;
  group.add(pole);
  parts.push({ geometry: poleGeo, material: stoneMat });

  const headGeo = new THREE.BoxGeometry(0.7, 0.6, 0.7);
  const head = new THREE.Mesh(headGeo, stoneMat);
  head.position.y = 2.5;
  group.add(head);
  parts.push({ geometry: headGeo, material: stoneMat });

  const glowMat = new THREE.SpriteMaterial({
    map: glowTexture,
    color: PALETTE.lanternGlow,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.position.y = 2.5;
  glow.scale.set(2.4, 2.4, 1);
  group.add(glow);
  parts.push({ geometry: null, material: glowMat });

  return group;
}

function makeTree(parts, { x, z, scale, foliage }, dotTexture) {
  const group = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.15 * scale, 0.25 * scale, 7 * scale, 6);
  const trunkMat = new THREE.MeshBasicMaterial({ color: PALETTE.treeTrunk, fog: true });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 3.5 * scale;
  group.add(trunk);
  parts.push({ geometry: trunkGeo, material: trunkMat });

  const foliageMat = new THREE.SpriteMaterial({
    map: dotTexture,
    color: PALETTE.treeFoliage[foliage],
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const blobCount = 6;
  for (let i = 0; i < blobCount; i++) {
    const angle = (i / blobCount) * Math.PI * 2;
    const s = new THREE.Sprite(foliageMat);
    s.position.set(
      Math.cos(angle) * 1.6 * scale,
      7 * scale + Math.sin(angle) * 1.2 * scale,
      Math.sin(angle * 1.3) * 0.6 * scale
    );
    s.scale.set(3.2 * scale, 3.2 * scale, 1);
    group.add(s);
  }
  parts.push({ geometry: null, material: foliageMat });

  group.position.set(x, 0, z);
  return group;
}

function makeGrassPlane(parts, grassTexture) {
  const geo = new THREE.PlaneGeometry(100, 6);
  const mat = new THREE.MeshBasicMaterial({
    map: grassTexture,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    fog: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, -7.5, 20);
  parts.push({ geometry: geo, material: mat });
  return mesh;
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
    scene.fog = new THREE.FogExp2(PALETTE.fog, 0.017);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 600);
    const CAM_START_Z = 48;
    const CAM_END_Z = 28;
    camera.position.set(0, 4, CAM_START_Z);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const resize = () => {
      const { innerWidth: w, innerHeight: h } = window;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();

    const parts = [];

    // Moon
    const moonTexture = makeMoonTexture();
    const moonMat = new THREE.MeshBasicMaterial({ map: moonTexture });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 32, 32), moonMat);
    moon.position.set(20, 26, -160);
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
    glow.scale.set(70, 70, 1);
    glow.position.copy(moon.position);
    scene.add(glow);

    // Distant hill line
    const hill = makeHillLayer(HILL_LAYER);
    scene.add(hill.mesh);

    // Temple silhouette
    const temple = makeTemple(parts);
    scene.add(temple);

    // Torii gate + stairs
    const torii = makeToriiGate(parts);
    scene.add(torii);
    const stairs = makeStairs(parts);
    scene.add(stairs);

    // Lanterns
    const lanterns = LANTERN_POSITIONS.map((pos) => {
      const lantern = makeLantern(parts, glowTexture);
      lantern.position.set(pos.x, 0, pos.z);
      scene.add(lantern);
      return lantern;
    });

    // Trees
    const dotTexture = makeDotTexture();
    const trees = TREE_CONFIGS.map((cfg) => {
      const tree = makeTree(parts, cfg, dotTexture);
      scene.add(tree);
      return { group: tree, baseX: cfg.x, parallax: 1 - Math.abs(cfg.z) / 40 };
    });

    // Foreground grass
    const grassTexture = makeGrassTexture();
    const grass = makeGrassPlane(parts, grassTexture);
    scene.add(grass);

    // Embers
    const emberCount = window.innerWidth < 640 ? 90 : 200;
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

      camera.position.z = CAM_START_Z - p * (CAM_START_Z - CAM_END_Z);
      camera.position.y = 4 + p * 2.4;
      camera.position.x = Math.sin(p * Math.PI) * 2;
      camera.rotation.x = -0.02 - p * 0.05;

      hill.mesh.position.x = -p * hill.parallax * 40;
      trees.forEach((t) => {
        t.group.position.x = t.baseX - p * t.parallax * 6;
      });

      scene.fog.color.set(PALETTE.fog).lerp(new THREE.Color(PALETTE.fogDeep), p * 0.4);
      scene.fog.density = 0.017 + p * 0.012;

      glowMaterial.opacity = 0.42 + Math.sin(elapsed * 0.6) * 0.08;
      lanterns.forEach((lantern, i) => {
        const flicker = 0.75 + Math.sin(elapsed * 2.4 + i * 1.7) * 0.15;
        lantern.children[2].material.opacity = flicker;
      });

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

      moonTexture.dispose();
      moonMat.dispose();
      moon.geometry.dispose();
      glowTexture.dispose();
      glowMaterial.dispose();
      hill.geometry.dispose();
      hill.material.dispose();
      dotTexture.dispose();
      grassTexture.dispose();
      embers.geometry.dispose();
      embers.material.dispose();

      parts.forEach(({ geometry, material }) => {
        geometry?.dispose?.();
        material?.dispose?.();
      });

      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />;
};

export default SceneBackground;
