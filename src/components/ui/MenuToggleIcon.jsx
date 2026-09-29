import { cn } from "../../lib/utils";

// Port of efferd/menu-toggle-icon: one continuous stroke that morphs a hamburger into an X
// by sliding its dash along the path, while the whole icon turns 45°.
export default function MenuToggleIcon({
  open,
  className,
  fill = "none",
  stroke = "currentColor",
  strokeWidth = 2.5,
  strokeLinecap = "round",
  strokeLinejoin = "round",
  duration = 500,
  ...props
}) {
  return (
    <svg
      aria-hidden="true"
      strokeWidth={strokeWidth}
      fill={fill}
      stroke={stroke}
      viewBox="0 0 32 32"
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      className={cn("transition-transform ease-in-out", open && "-rotate-45", className)}
      style={{ transitionDuration: `${duration}ms` }}
      {...props}
    >
      <path
        className="transition-all ease-in-out"
        style={{
          transitionDuration: `${duration}ms`,
          strokeDasharray: open ? "20 300" : "12 63",
          strokeDashoffset: open ? "-32.42px" : "0px",
        }}
        d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
      />
      <path d="M7 16 27 16" />
    </svg>
  );
}
