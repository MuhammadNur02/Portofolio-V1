import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * DragonCanvas — Electric Tentacles / Lightning Cursor
 * Memadukan efek animasi tentakel listrik dari Canvas JS asli ke komponen React.
 */
const DragonCanvas = () => {
  const canvasRef = useRef(null);
  const location = useLocation();

  // Reference state internal agar tidak mentrigger re-render React yang lambat
  const mouseRef = useRef({ x: false, y: false });
  const targetRef = useRef({ x: 0, y: 0, errx: 0, erry: 0 });
  const lastTargetRef = useRef({ x: 0, y: 0 });
  const isFleeingRef = useRef(false);

  // Status Layar Mobile
  const isMobileRef = useRef(false);

  useEffect(() => {
    isMobileRef.current = typeof window !== "undefined" && window.innerWidth < 768;
  }, []);

  // Deteksi Halaman About (Kabur/Flee)
  useEffect(() => {
    const isAbout = location.pathname.includes("about");
    isFleeingRef.current = isAbout;
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const c = canvas.getContext("2d");
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    let animationFrameId;
    let t = 0;
    const q = 10;
    const maxl = 300;
    const minl = 50;
    const n = 30;
    const numt = 500;
    const tent = [];

    // --- Helper Math ---
    function dist(p1x, p1y, p2x, p2y) {
      return Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));
    }

    // --- Class Segment ---
    class Segment {
      constructor(parent, l, a, first) {
        this.first = first;
        if (first) {
          this.pos = { x: parent.x, y: parent.y };
        } else {
          this.pos = { x: parent.nextPos.x, y: parent.nextPos.y };
        }
        this.l = l;
        this.ang = a;
        this.nextPos = {
          x: this.pos.x + this.l * Math.cos(this.ang),
          y: this.pos.y + this.l * Math.sin(this.ang),
        };
      }
      update(t) {
        this.ang = Math.atan2(t.y - this.pos.y, t.x - this.pos.x);
        this.pos.x = t.x + this.l * Math.cos(this.ang - Math.PI);
        this.pos.y = t.y + this.l * Math.sin(this.ang - Math.PI);
        this.nextPos.x = this.pos.x + this.l * Math.cos(this.ang);
        this.nextPos.y = this.pos.y + this.l * Math.sin(this.ang);
      }
      fallback(t) {
        this.pos.x = t.x;
        this.pos.y = t.y;
        this.nextPos.x = this.pos.x + this.l * Math.cos(this.ang);
        this.nextPos.y = this.pos.y + this.l * Math.sin(this.ang);
      }
      show() {
        c.lineTo(this.nextPos.x, this.nextPos.y);
      }
    }

    // --- Class Tentacle ---
    class Tentacle {
      constructor(x, y, l, n, a) {
        this.x = x;
        this.y = y;
        this.l = l;
        this.n = n;
        this.t = {};
        this.rand = Math.random();
        this.segments = [new Segment(this, this.l / this.n, 0, true)];
        for (let i = 1; i < this.n; i++) {
          this.segments.push(
            new Segment(this.segments[i - 1], this.l / this.n, 0, false)
          );
        }
      }
      move(last_target, target) {
        this.angle = Math.atan2(target.y - this.y, target.x - this.x);
        this.dt = dist(last_target.x, last_target.y, target.x, target.y) + 5;
        this.t = {
          x: target.x - 0.8 * this.dt * Math.cos(this.angle),
          y: target.y - 0.8 * this.dt * Math.sin(this.angle),
        };
        if (this.t.x) {
          this.segments[this.n - 1].update(this.t);
        } else {
          this.segments[this.n - 1].update(target);
        }
        for (let i = this.n - 2; i >= 0; i--) {
          this.segments[i].update(this.segments[i + 1].pos);
        }
        if (
          dist(this.x, this.y, target.x, target.y) <=
          this.l + dist(last_target.x, last_target.y, target.x, target.y)
        ) {
          this.segments[0].fallback({ x: this.x, y: this.y });
          for (let i = 1; i < this.n; i++) {
            this.segments[i].fallback(this.segments[i - 1].nextPos);
          }
        }
      }
      show(target) {
        if (dist(this.x, this.y, target.x, target.y) <= this.l) {
          c.globalCompositeOperation = "lighter";
          c.beginPath();
          c.lineTo(this.x, this.y);
          for (let i = 0; i < this.n; i++) {
            this.segments[i].show();
          }
          c.strokeStyle =
            "hsl(" +
            (this.rand * 60 + 180) +
            ",100%," +
            (this.rand * 60 + 25) +
            "%)";
          c.lineWidth = this.rand * 2;
          c.lineCap = "round";
          c.lineJoin = "round";
          c.stroke();
          c.globalCompositeOperation = "source-over";
        }
      }
      show2(target) {
        c.beginPath();
        if (dist(this.x, this.y, target.x, target.y) <= this.l) {
          c.arc(this.x, this.y, 2 * this.rand + 1, 0, 2 * Math.PI);
          c.fillStyle = "white";
        } else {
          c.arc(this.x, this.y, this.rand * 2, 0, 2 * Math.PI);
          c.fillStyle = "darkcyan";
        }
        c.fill();
      }
    }

    // Inisialisasi Tentakel
    for (let i = 0; i < numt; i++) {
      tent.push(
        new Tentacle(
          Math.random() * w,
          Math.random() * h,
          Math.random() * (maxl - minl) + minl,
          n,
          Math.random() * 2 * Math.PI
        )
      );
    }

    // --- Core Draw Loop ---
    const draw = () => {
      const mouse = mouseRef.current;
      const target = targetRef.current;
      const last_target = lastTargetRef.current;

      // Jika halaman About (Kabur ke sudut luar layar)
      if (isFleeingRef.current) {
        target.errx = w + 500 - target.x;
        target.erry = -500 - target.y;
      } else if (mouse.x !== false) {
        target.errx = mouse.x - target.x;
        target.erry = mouse.y - target.y;
      } else {
        // Gerakan lemniscate (angka 8) saat mouse tidak aktif/idle
        target.errx =
          w / 2 +
          ((h / 2 - q) * Math.sqrt(2) * Math.cos(t)) /
            (Math.pow(Math.sin(t), 2) + 1) -
          target.x;
        target.erry =
          h / 2 +
          ((h / 2 - q) * Math.sqrt(2) * Math.cos(t) * Math.sin(t)) /
            (Math.pow(Math.sin(t), 2) + 1) -
          target.y;
      }

      target.x += target.errx / 10;
      target.y += target.erry / 10;
      t += 0.01;

      // Bola magnet cahaya di tengah kursor
      c.beginPath();
      c.arc(
        target.x,
        target.y,
        dist(last_target.x, last_target.y, target.x, target.y) + 5,
        0,
        2 * Math.PI
      );
      c.fillStyle = "hsl(210,100%,80%)";
      c.fill();

      // Render Tentakel
      for (let i = 0; i < numt; i++) {
        tent[i].move(last_target, target);
        tent[i].show2(target);
      }
      for (let i = 0; i < numt; i++) {
        tent[i].show(target);
      }

      last_target.x = target.x;
      last_target.y = target.y;
    };

    const loop = () => {
      c.clearRect(0, 0, w, h);
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    // --- Handlers & Event Listeners ---
    const handleMouseMove = (e) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: false, y: false };
    };

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (isMobileRef.current) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        width: "100vw",
        height: "100vh",
      }}
    />
  );
};

export default DragonCanvas;