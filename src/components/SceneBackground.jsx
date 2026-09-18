import { useEffect, useRef } from "react";
import * as THREE from "three";
import daunUrl from "../assets/daun.webp";

// Lives in /public (not bundled) so it's referenced by URL, not imported.
const KUIL_URL = "/Kuil-jepang.webp";

const PALETTE = {
  fog: 0x0b1620,
  fogDeep: 0x010204,
};

// Tint variants applied on top of the real leaf photo for a little color variety.
const LEAF_TINTS = [0xffffff, 0xffcf9e, 0xffb37a, 0xff9a6a];
const LEAF_BOUNDS = { width: 90, height: 76, depth: 65, depthOffset: 22 };

// Strips the near-white background of a photo into a transparent cutout.
function loadCutoutTexture(url) {
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

      resolve({ texture: new THREE.CanvasTexture(canvas), aspect: canvas.width / canvas.height });
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Unsharp-mask style convolution — boosts edge contrast at the source's native
// resolution so the upscaled backdrop reads crisper instead of soft.
function sharpenImageData(ctx, width, height, amount) {
  const src = ctx.getImageData(0, 0, width, height);
  const s = src.data;
  const out = ctx.createImageData(width, height);
  const d = out.data;
  const stride = width * 4;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * stride + x * 4;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        d[i] = s[i];
        d[i + 1] = s[i + 1];
        d[i + 2] = s[i + 2];
        d[i + 3] = s[i + 3];
        continue;
      }
      for (let c = 0; c < 3; c++) {
        const center = s[i + c];
        const neighborSum = s[i - stride + c] + s[i + stride + c] + s[i - 4 + c] + s[i + 4 + c];
        const value = center * (1 + 4 * amount) - amount * neighborSum;
        d[i + c] = value < 0 ? 0 : value > 255 ? 255 : value;
      }
      d[i + 3] = s[i + 3];
    }
  }
  ctx.putImageData(out, 0, 0);
}

function loadPlainTexture(url, { sharpen = 0, anisotropy = 1 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Draw at the source's native pixel size (no downscale) so "full
      // resolution" is preserved; the sharpen pass then runs on that canvas.
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      if (sharpen > 0) sharpenImageData(ctx, canvas.width, canvas.height, sharpen);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = anisotropy;
      resolve({ texture, aspect: canvas.width / canvas.height });
    };
    img.onerror = reject;
    img.src = url;
  });
}

function makeBackdrop(texture, aspect) {
  const geometry = new THREE.PlaneGeometry(aspect, 1);
  const material = new THREE.MeshBasicMaterial({ map: texture, fog: true });
  const mesh = new THREE.Mesh(geometry, material);
  return { mesh, geometry, material, aspect };
}

// Scales the backdrop plane to cover the camera frustum at a given distance (CSS "background-size: cover").
// `margin` over-scales it a touch so the extra parallax drift never reveals an edge.
function fitBackdropCover(backdrop, camera, distance, margin = 1) {
  const vFov = (camera.fov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
  const visibleWidth = visibleHeight * camera.aspect;
  const scale = Math.max(visibleWidth / backdrop.aspect, visibleHeight) * margin;
  backdrop.mesh.scale.set(scale * backdrop.aspect, scale, 1);
}

function makeLeaves(count, bounds, texture, aspect) {
  const baseHeight = 1.1;
  const geometry = new THREE.PlaneGeometry(baseHeight * aspect, baseHeight);
  const materials = LEAF_TINTS.map(
    (tint) =>
      new THREE.MeshBasicMaterial({
        map: texture,
        color: tint,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false,
      })
  );

  const group = new THREE.Group();
  const leaves = [];

  for (let i = 0; i < count; i++) {
    const material = materials[Math.floor(Math.random() * materials.length)];
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(0.4 + Math.random() * 0.75);
    mesh.position.set(
      (Math.random() - 0.5) * bounds.width,
      Math.random() * bounds.height - bounds.height * 0.3,
      bounds.depthOffset - Math.random() * bounds.depth
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    group.add(mesh);

    leaves.push({
      mesh,
      fallSpeed: 1.1 + Math.random() * 1.6,
      swayFreq: 0.4 + Math.random() * 0.6,
      swayAmp: 1.2 + Math.random() * 2,
      swayPhase: Math.random() * Math.PI * 2,
      spin: {
        x: (Math.random() - 0.5) * 1.4,
        y: (Math.random() - 0.5) * 1.4,
        z: (Math.random() - 0.5) * 1.4,
      },
    });
  }

  return { group, geometry, materials, leaves };
}

function updateLeaves(leaves, dt, t, bounds, driftScale, windStrength) {
  for (const leaf of leaves) {
    const { mesh } = leaf;
    mesh.position.y -= leaf.fallSpeed * dt * driftScale;
    mesh.position.x += Math.sin(t * leaf.swayFreq + leaf.swayPhase) * dt * leaf.swayAmp * windStrength * driftScale;
    mesh.rotation.x += leaf.spin.x * dt * driftScale;
    mesh.rotation.y += leaf.spin.y * dt * driftScale;
    mesh.rotation.z += leaf.spin.z * dt * driftScale;

    if (mesh.position.y < -bounds.height * 0.4) {
      mesh.position.y = bounds.height * 0.7;
      mesh.position.x = (Math.random() - 0.5) * bounds.width;
      mesh.position.z = bounds.depthOffset - Math.random() * bounds.depth;
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
    scene.fog = new THREE.FogExp2(PALETTE.fog, 0.006);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 600);
    const CAM_START_Z = 28;
    const CAM_END_Z = 8;
    const BACKDROP_Z = -40;
    // Extra over-scale on the cover fit so the wider parallax drift below never exposes an edge.
    const BACKDROP_MARGIN = 1.3;
    camera.position.set(0, 4, CAM_START_Z);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    let disposed = false;
    let backdrop = null;

    const resize = () => {
      const { innerWidth: w, innerHeight: h } = window;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (backdrop) fitBackdropCover(backdrop, camera, CAM_START_Z - BACKDROP_Z, BACKDROP_MARGIN);
    };
    resize();

    loadPlainTexture(KUIL_URL, { sharpen: 0.35, anisotropy: renderer.capabilities.getMaxAnisotropy() }).then(
      ({ texture, aspect }) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        backdrop = makeBackdrop(texture, aspect);
        backdrop.mesh.position.z = BACKDROP_Z;
        fitBackdropCover(backdrop, camera, CAM_START_Z - BACKDROP_Z, BACKDROP_MARGIN);
        scene.add(backdrop.mesh);
      }
    );

    // Falling leaves — built once the real leaf photo finishes loading.
    const leafCount = window.innerWidth < 640 ? 55 : 110;
    const fallingLeaves = { group: new THREE.Group(), geometry: null, materials: [], leaves: [] };
    scene.add(fallingLeaves.group);

    loadCutoutTexture(daunUrl).then(({ texture, aspect }) => {
      if (disposed) {
        texture.dispose();
        return;
      }
      const built = makeLeaves(leafCount, LEAF_BOUNDS, texture, aspect);
      fallingLeaves.geometry = built.geometry;
      fallingLeaves.materials = built.materials;
      fallingLeaves.leaves = built.leaves;
      built.leaves.forEach((leaf) => fallingLeaves.group.add(leaf.mesh));
    });

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
      camera.position.y = 4 + p * 3.4;
      camera.position.x = Math.sin(p * Math.PI) * 5;
      camera.rotation.x = -0.02 - p * 0.05;

      if (backdrop) {
        backdrop.mesh.position.x = -p * 6 + Math.sin(elapsed * 0.06) * 1.4 * driftScale;
        backdrop.mesh.position.y = p * 2.2;
      }

      fallingLeaves.group.position.x = -p * 4;

      scene.fog.color.set(PALETTE.fog).lerp(new THREE.Color(PALETTE.fogDeep), p * 0.5);

      updateLeaves(fallingLeaves.leaves, dt, elapsed, LEAF_BOUNDS, driftScale, 1 + p * 0.6);

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    window.addEventListener("resize", resize);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);

      if (backdrop) {
        backdrop.geometry.dispose();
        backdrop.material.map?.dispose?.();
        backdrop.material.dispose();
      }

      fallingLeaves.geometry?.dispose?.();
      fallingLeaves.materials.forEach((m, i) => {
        if (i === 0) m.map?.dispose?.();
        m.dispose();
      });

      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />;
};

export default SceneBackground;
