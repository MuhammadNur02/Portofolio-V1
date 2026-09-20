import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'framer-motion';

// Lives in /public (not bundled) so it's referenced by URL, not imported.
const WELCOME_IMAGE_URL = '/WelcomeScreenNew.jpg';

// ─── LOADING BAR — EDIT SPEED / SIZE / POSITION HERE ────────────────────────
// LOADING_DURATION_MS : how long the bar takes to fill from 0% to 100%.
// HOLD_AT_100_MS      : how long it rests at 100% before the welcome screen switches to the site.
// BAR_SIDE_GAP        : space left/right of the bar ('px-0' makes it touch both screen edges).
// BAR_BOTTOM          : distance from the bottom of the screen (mobile / desktop).
// BAR_HEIGHT          : thickness of the bar (mobile / desktop).
const LOADING_DURATION_MS = 5000;
const HOLD_AT_100_MS = 600;
const BAR_SIDE_GAP = 'px-4 sm:px-10';
const BAR_BOTTOM = 'bottom-[7%] sm:bottom-[9%]';
const BAR_HEIGHT = 'h-[10px] sm:h-[14px]';
// ────────────────────────────────────────────────────────────────────────────

// Pointed ends, like a katana blade.
const BLADE = 'polygon(0 50%, 10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%)';

const LoadingBar = ({ progress, done }) => {
  const width = useTransform(progress, (v) => `${v}%`);
  const label = useTransform(progress, (v) => `${Math.round(v)}%`);

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 ${BAR_BOTTOM} ${BAR_SIDE_GAP}`}
      role="progressbar"
      aria-label="Loading"
    >
      <div className="mb-2 flex items-end justify-between text-[11px] font-medium tracking-[0.35em] text-amber-100/80 sm:mb-3 sm:text-sm">
        <span>LOADING</span>
        <motion.span
          className={`tabular-nums tracking-widest transition-colors duration-500 ${
            done ? 'text-white' : 'text-amber-200'
          }`}
        >
          {label}
        </motion.span>
      </div>

      {/* The drop-shadow lives on this wrapper (not on the clipped shapes) so the glow follows the blade outline. */}
      <div
        className={`relative ${BAR_HEIGHT} transition-[filter] duration-500`}
        style={{
          filter: done
            ? 'drop-shadow(0 0 14px rgba(251,191,36,0.95))'
            : 'drop-shadow(0 0 6px rgba(224,35,28,0.55))',
        }}
      >
        {/* Light the fill spills onto the artwork */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-700 via-orange-500 to-amber-400 opacity-70 blur-xl"
          style={{ width }}
        />

        {/* Edge: dark red → gold → dark red */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-900 via-amber-500/80 to-red-900" style={{ clipPath: BLADE }}>
          {/* Track */}
          <div className="absolute inset-[1.5px] overflow-hidden bg-black/75 backdrop-blur-sm" style={{ clipPath: BLADE }}>
            {/* Fill — slides to the right as progress grows */}
            <motion.div
              className="relative h-full overflow-hidden bg-gradient-to-r from-red-800 via-red-600 to-orange-400"
              style={{ width }}
            >
              <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
              <span className="animate-loader-shimmer absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </motion.div>
          </div>
        </div>

        {/* Glowing spark riding the leading edge of the fill */}
        <motion.div className="absolute inset-y-0 left-0" style={{ width }}>
          <span className="absolute right-0 top-1/2 h-5 w-5 -translate-y-1/2 translate-x-1/2 rounded-full bg-amber-300 blur-md sm:h-7 sm:w-7" />
          <span className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-white blur-[2px]" />
        </motion.div>
      </div>
    </div>
  );
};

const WelcomeScreen = ({ onLoadingComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [done, setDone] = useState(false);
  const progress = useMotionValue(0);

  // Kept in a ref so a parent re-render (new callback identity) never restarts the bar.
  const onCompleteRef = useRef(onLoadingComplete);
  useEffect(() => {
    onCompleteRef.current = onLoadingComplete;
  }, [onLoadingComplete]);

  useEffect(() => {
    progress.set(0);
    let holdTimer;
    let exitTimer;

    // Surges and eases three times on the way to 100% so it reads like real loading, not a flat ramp.
    const controls = animate(progress, [0, 34, 58, 100], {
      duration: LOADING_DURATION_MS / 1000,
      times: [0, 0.35, 0.65, 1],
      ease: 'easeInOut',
      onComplete: () => {
        setDone(true);
        holdTimer = setTimeout(() => {
          setIsLoading(false);
          exitTimer = setTimeout(() => {
            onCompleteRef.current?.();
          }, 1000);
        }, HOLD_AT_100_MS);
      },
    });

    return () => {
      controls.stop();
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
    };
  }, [progress]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 bg-[#0a0705]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.1,
            filter: 'blur(10px)',
            transition: { duration: 0.8, ease: 'easeInOut' },
          }}
        >
          {/* Fills the screen (cover). On phones the artwork is cropped left/right —
              change the first object-[X%_Y%] value to pick which part stays visible
              (0% = left edge ... 100% = right edge). */}
          <img
            src={WELCOME_IMAGE_URL}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-cover object-[40%_50%] md:object-center"
          />

          {/* Darkens the bottom so the bar and its label stay readable on the misty artwork */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

          <LoadingBar progress={progress} done={done} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeScreen;
