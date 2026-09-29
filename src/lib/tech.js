import {
  SiNextdotjs,
  SiReact,
  SiTypescript,
  SiJavascript,
  SiTailwindcss,
  SiNodedotjs,
  SiExpress,
  SiSupabase,
  SiFirebase,
  SiPostgresql,
  SiPrisma,
  SiVite,
  SiVercel,
  SiThreedotjs,
  SiFramer,
  SiShadcnui,
  SiHtml5,
  SiCss,
  SiGit,
  SiGithub,
  SiFigma,
  SiSanity,
  SiClerk,
  SiCloudflare,
  SiResend,
  SiPosthog,
  SiSentry,
  SiUpstash,
  SiLemonsqueezy,
  SiMui,
  SiBootstrap,
  SiRedux,
  SiGreensock,
} from "react-icons/si";

// One entry per technology: its proper name, brand icon/color, and the spellings people actually type.
// Project tech stacks are typed by hand in the dashboard, so this also fixes typos on display
// ("Tail WInd" -> "Tailwind CSS") — worth fixing in the data too, but visitors never see them either way.
const TECH = [
  { name: "Next.js", icon: SiNextdotjs, color: "#ffffff", aliases: ["next", "nextjs"] },
  { name: "React", icon: SiReact, color: "#61DAFB", aliases: ["react", "reactjs"] },
  { name: "TypeScript", icon: SiTypescript, color: "#3178C6", aliases: ["typescript", "ts"] },
  { name: "JavaScript", icon: SiJavascript, color: "#F7DF1E", aliases: ["javascript", "js"] },
  { name: "Tailwind CSS", icon: SiTailwindcss, color: "#38BDF8", aliases: ["tailwind", "tailwindcss", "taillwind", "tailwin"] },
  { name: "Node.js", icon: SiNodedotjs, color: "#5FA04E", aliases: ["node", "nodejs"] },
  { name: "Express", icon: SiExpress, color: "#ffffff", aliases: ["express", "expressjs"] },
  { name: "Supabase", icon: SiSupabase, color: "#3ECF8E", aliases: ["supabase"] },
  { name: "Firebase", icon: SiFirebase, color: "#FFCA28", aliases: ["firebase"] },
  { name: "PostgreSQL", icon: SiPostgresql, color: "#4169E1", aliases: ["postgresql", "postgres"] },
  { name: "Prisma", icon: SiPrisma, color: "#ffffff", aliases: ["prisma"] },
  { name: "Vite", icon: SiVite, color: "#646CFF", aliases: ["vite", "vitejs"] },
  { name: "Vercel", icon: SiVercel, color: "#ffffff", aliases: ["vercel"] },
  { name: "Three.js", icon: SiThreedotjs, color: "#ffffff", aliases: ["three", "threejs", "webgl"] },
  { name: "Motion", icon: SiFramer, color: "#FFF312", aliases: ["motion", "framermotion", "framer"] },
  { name: "shadcn/ui", icon: SiShadcnui, color: "#ffffff", aliases: ["shadcn", "shadcnui"] },
  { name: "HTML", icon: SiHtml5, color: "#E34F26", aliases: ["html", "html5"] },
  { name: "CSS", icon: SiCss, color: "#663399", aliases: ["css", "css3"] },
  { name: "Git", icon: SiGit, color: "#F05032", aliases: ["git"] },
  { name: "GitHub", icon: SiGithub, color: "#ffffff", aliases: ["github"] },
  { name: "Figma", icon: SiFigma, color: "#F24E1E", aliases: ["figma"] },
  { name: "Sanity", icon: SiSanity, color: "#F03E2F", aliases: ["sanity", "sanityio"] },
  { name: "Clerk", icon: SiClerk, color: "#6C47FF", aliases: ["clerk"] },
  { name: "Cloudflare R2", icon: SiCloudflare, color: "#F38020", aliases: ["cloudflarer2", "r2"] },
  { name: "Cloudflare", icon: SiCloudflare, color: "#F38020", aliases: ["cloudflare"] },
  { name: "Resend", icon: SiResend, color: "#ffffff", aliases: ["resend"] },
  { name: "PostHog", icon: SiPosthog, color: "#F9BD2B", aliases: ["posthog"] },
  { name: "Sentry", icon: SiSentry, color: "#A78BFA", aliases: ["sentry"] },
  { name: "Upstash", icon: SiUpstash, color: "#00E9A3", aliases: ["upstash", "uptash"] },
  { name: "Lemon Squeezy", icon: SiLemonsqueezy, color: "#FFC233", aliases: ["lemonsqueezy", "lemonsquizy", "lemonsqeezy"] },
  { name: "Material UI", icon: SiMui, color: "#007FFF", aliases: ["mui", "materialui"] },
  { name: "Bootstrap", icon: SiBootstrap, color: "#7952B3", aliases: ["bootstrap"] },
  { name: "Redux", icon: SiRedux, color: "#764ABC", aliases: ["redux", "reduxtoolkit"] },
  { name: "GSAP", icon: SiGreensock, color: "#88CE02", aliases: ["gsap", "greensock"] },
];

const BY_ALIAS = new Map(TECH.flatMap((tech) => tech.aliases.map((alias) => [alias, tech])));

// "Next.js 16.x" -> "nextjs", "Tail WInd" -> "tailwind", "Shadcn.ui" -> "shadcnui"
export const techKey = (raw) =>
  String(raw)
    .toLowerCase()
    .replace(/\s+v?\d+(\.[\dx]+)*\s*$/, "")
    .replace(/[^a-z0-9]/g, "");

export function resolveTech(raw) {
  const match = BY_ALIAS.get(techKey(raw));
  if (match) return { name: match.name, icon: match.icon, color: match.color };
  return { name: String(raw).trim(), icon: null, color: null };
}

// The logos in the hero's marquee, in display order.
export const MARQUEE_STACK = [
  "Next.js",
  "React",
  "TypeScript",
  "JavaScript",
  "Tailwind CSS",
  "Node.js",
  "Supabase",
  "Three.js",
  "Motion",
  "shadcn/ui",
  "Vercel",
  "Vite",
  "Sanity",
  "Clerk",
  "Firebase",
  "Git",
  "Figma",
].map(resolveTech);
