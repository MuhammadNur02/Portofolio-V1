import { forwardRef, useImperativeHandle, useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { cn } from "../../lib/utils";

// Port of skyleen77/scroll-progress (animate-ui) to plain JSX + framer-motion.
// Without children it tracks the page; with children it becomes its own scroll container.
const ScrollProgress = forwardRef(function ScrollProgress(
  { className, children, progressProps, springOptions, ...props },
  ref
) {
  const containerRef = useRef(null);
  useImperativeHandle(ref, () => containerRef.current);

  const { scrollYProgress } = useScroll(children ? { container: containerRef } : undefined);
  const scaleX = useSpring(scrollYProgress, springOptions || { stiffness: 250, damping: 40, bounce: 0 });

  return (
    <>
      <motion.div
        aria-hidden="true"
        {...progressProps}
        className={cn(
          "inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-shu-600 via-shu-400 to-kin-400",
          children ? "sticky" : "fixed",
          progressProps?.className
        )}
        style={{ scaleX }}
      />
      {children && (
        <div ref={containerRef} className={cn("size-full overflow-y-auto", className)} {...props}>
          {children}
        </div>
      )}
    </>
  );
});

export default ScrollProgress;
