import { useState } from "react";
import { cn } from "../../lib/utils";
import { useAvatar } from "../../lib/useAvatar";

// The seal that used to be the logo. It stays as the fallback until a profile photo is uploaded.
function Hanko({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-[6px] bg-shu-500 font-kanji text-base font-extrabold text-white shadow-[0_6px_20px_-6px_rgba(232,71,47,0.8)]",
        className
      )}
    >
      侍
    </span>
  );
}

/**
 * The mark next to the name: the profile photo uploaded in the dashboard, in a circle. All three
 * states are the same size, so nothing shifts when the answer arrives — a neutral circle while the
 * first visit is still finding out, the photo when there is one, the seal when there isn't.
 */
export default function BrandMark({ className }) {
  const avatar = useAvatar();
  const [broken, setBroken] = useState(false);

  if (avatar === null || broken) return <Hanko className={cn("h-9 w-9", className)} />;
  if (avatar === undefined) return <span aria-hidden="true" className={cn("h-9 w-9 shrink-0 rounded-full bg-white/[0.06]", className)} />;
  return (
    <img
      src={avatar}
      alt=""
      width="36"
      height="36"
      decoding="async"
      onError={() => setBroken(true)}
      className={cn("h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/20 shadow-[0_6px_20px_-8px_rgba(0,0,0,0.9)]", className)}
    />
  );
}
