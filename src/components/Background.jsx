// The backdrop shown before the 3D scene fades in (and instead of it, if WebGL is unavailable):
// a faint moon-glow gradient in pure CSS — no image download, no scroll listener.
const AnimatedBackground = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none fixed inset-0 bg-ink bg-[radial-gradient(ellipse_70%_55%_at_60%_12%,rgba(150,38,23,0.28),transparent_70%),radial-gradient(ellipse_60%_50%_at_10%_100%,rgba(42,35,31,0.6),transparent_70%)]"
  />
);

export default AnimatedBackground;
