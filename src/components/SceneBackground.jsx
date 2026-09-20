import { useEffect, useRef } from "react";
import * as THREE from "three";
import daunUrl from "../assets/daun.webp";

// Lives in /public (not bundled) so it's referenced by URL, not imported.
const BACKDROP_URL = "/Samurai_LE_upscale_prime_x4.jpg";

// ─── WALLPAPER — EDIT WHICH PART OF THE IMAGE SHOWS, AND HOW IT MOVES ───────
// The image always fills the whole screen (CSS "object-fit: cover"), never stretched. The artwork
// is portrait, so on a landscape screen the top/bottom gets cropped and on a narrow phone the
// left/right does. Pick which part is visible (same idea as CSS object-position: 0% .. 100%):
//   x    : 0 = show the image's left edge ... 0.5 = centered ... 1 = show its right edge
//   y    : which vertical part shows at the TOP of the page   (0 = image's top edge ... 1 = its bottom edge)
//   endY : which vertical part shows at the BOTTOM of the page. While scrolling, the wallpaper glides
//          smoothly from y to endY (and back when scrolling up). The bigger the gap, the more it
//          moves. Set endY = y to make it static.
//   zoom : 1 = exact fit. Above 1 the image is enlarged a little, which gives it extra room to glide
//          — needed on phones, where the image already fills the full height at zoom 1.
// Keep endY around 0.85 or lower and x around 0.55+ on mobile so the "Let's Enhance.io" watermark
// baked into the image's bottom-left corner stays out of view.
const BACKDROP_FOCUS = {
  desktop: { x: 0.5, y: 0.6, endY: 0.85, zoom: 1 },
  mobile: { x: 0.55, y: 0.15, endY: 0.85, zoom: 1.25 },
};
// Screens narrower than this (px) use the "mobile" focus above.
const MOBILE_MAX_WIDTH = 640;
// ────────────────────────────────────────────────────────────────────────────

// Distance from the camera at which the wallpaper plane sits. Only matters for
// depth ordering — the plane is re-scaled to the screen at whatever distance this is.
const BACKDROP_DISTANCE = 100;

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

// Loads the wallpaper as a plain texture — no canvas round trip, so nothing softens it.
// Three.js downsizes it on its own only if a device's max texture size is smaller than the image.
function loadBackdropTexture(url, renderer) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const { naturalWidth, naturalHeight } = texture.image;
        resolve({ texture, aspect: naturalWidth / naturalHeight });
      },
      undefined,
      reject
    );
  });
}

function makeBackdrop(texture, aspect) {
  const geometry = new THREE.PlaneGeometry(aspect, 1);
  // depthWrite off + renderOrder -1 keeps it strictly behind everything else, leaves included.
  const material = new THREE.MeshBasicMaterial({ map: texture, fog: false, depthWrite: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = -1;
  return { mesh, geometry, material, aspect };
}

// Scales the plane to COVER the camera frustum (CSS "object-fit: cover") and remembers how much
// of it overflows the screen. Run on load/resize; positionBackdrop then slides it within that
// overflow. The plane is a child of the camera, so the camera dolly never zooms or crops it.
function layoutBackdrop(backdrop, camera) {
  const focus = window.innerWidth < MOBILE_MAX_WIDTH ? BACKDROP_FOCUS.mobile : BACKDROP_FOCUS.desktop;
  const vFov = (camera.fov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(vFov / 2) * BACKDROP_DISTANCE;
  const visibleWidth = visibleHeight * camera.aspect;

  // The geometry is already `aspect` wide × 1 tall, so one uniform scale sets the plane's height.
  const height = Math.max(visibleWidth / backdrop.aspect, visibleHeight) * focus.zoom;
  const width = height * backdrop.aspect;
  backdrop.mesh.scale.set(height, height, 1);
  backdrop.focus = focus;
  backdrop.overflowX = width - visibleWidth;
  backdrop.overflowY = height - visibleHeight;
}

// Slides the wallpaper for a scroll progress of 0 (top of page) .. 1 (bottom of page).
// Sliding only ever stays inside the overflow, so an edge of the image never shows.
function positionBackdrop(backdrop, progress) {
  const { focus, overflowX, overflowY } = backdrop;
  const y = focus.y + (focus.endY - focus.y) * progress;
  backdrop.mesh.position.set((0.5 - focus.x) * overflowX, (y - 0.5) * overflowY, -BACKDROP_DISTANCE);
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

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 600);
    const CAM_START_Z = 28;
    const CAM_END_Z = 8;
    camera.position.set(0, 4, CAM_START_Z);
    // The camera must be in the scene for the wallpaper plane parented to it to render.
    scene.add(camera);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    let disposed = false;
    let backdrop = null;

    const resize = () => {
      const { innerWidth: w, innerHeight: h } = window;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (backdrop) layoutBackdrop(backdrop, camera);
    };
    resize();

    // 3D wallpaper — an image texture on a plane pinned to the camera, so the
    // leaves and camera dolly still composite in 3D in front of it.
    loadBackdropTexture(BACKDROP_URL, renderer)
      .then(({ texture, aspect }) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        backdrop = makeBackdrop(texture, aspect);
        layoutBackdrop(backdrop, camera);
        positionBackdrop(backdrop, 0);
        camera.add(backdrop.mesh);
      })
      .catch(() => {});

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

      if (backdrop) positionBackdrop(backdrop, p);

      fallingLeaves.group.position.x = -p * 4;

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
        camera.remove(backdrop.mesh);
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
