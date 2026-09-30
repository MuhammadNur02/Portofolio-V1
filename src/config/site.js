// ─── EVERYTHING PERSONAL LIVES HERE ─────────────────────────────────────────
// Edit this one file to update your name, links, CV and availability across the whole site.

// Before changing `url`: renaming the Vercel PROJECT does not by itself move the live domain — the
// short "<name>.vercel.app" you want is a name shared by every Vercel user on earth, so it's usually
// already taken by someone else's unrelated project (this happened once: "julian.vercel.app" turned
// out to belong to a stranger's game). Check the "Domains" panel on the Vercel project page — whatever
// is listed there is what's actually live — before updating this value (and public/robots.txt,
// scripts/generate-sitemap.mjs, index.html's meta tags, public/og-image.jpg, and README.md, which all
// hardcode the same URL and need to change together).
export const SITE = {
  url: "https://juliansyah.vercel.app",
  name: "Muhammad Nurrahman Juliansyah",
  shortName: "Julian",
  role: "AI-Assisted Fullstack Developer",
  email: "muchammad.nur02@gmail.com",
  // The day you started coding — "years of experience" is counted from here.
  startDate: "2021-11-06",
  // Shows the green "available" badge in the hero and contact section. Set to false once you're hired.
  availableForWork: true,
  // Tip: a direct PDF in /public (e.g. "/CV-Muhammad-Nurrahman-Juliansyah.pdf") beats a Drive folder —
  // it opens instantly, downloads in one tap, and applicant-tracking tools can read it.
  cvUrl: "https://drive.google.com/drive/folders/1gkmicadsk_7yh5qpweNi23js5rCBcsb6",
};

// Country code + number, digits only (e.g. "6281234567890"). Leave empty to hide WhatsApp everywhere
// (the socials list below and the "Hire Me" nav button both fall back gracefully — see waLink()).
export const WHATSAPP_NUMBER = "62895329278298";

// Builds a wa.me link, optionally with a prefilled message (e.g. the "Hire Me" button's greeting).
// Returns null when no number is set, so callers can hide/disable the link instead of pointing nowhere.
export const waLink = (message = "") =>
  WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ""}` : null;

export const SOCIALS = [
  { id: "github", label: "GitHub", handle: "@MuhammadNur02", url: "https://github.com/MuhammadNur02" },
  { id: "linkedin", label: "LinkedIn", handle: "in/muhammad-nurrahman-juliansyah", url: "https://www.linkedin.com/in/muhammad-nurrahman-juliansyah-47080b2b8" },
  { id: "instagram", label: "Instagram", handle: "@rianz_yan", url: "https://www.instagram.com/rianz_yan/" },
  { id: "youtube", label: "YouTube", handle: "@Julian.Alvarez02", url: "https://www.youtube.com/@Julian.Alvarez02" },
  { id: "tiktok", label: "TikTok", handle: "@julian.alvareezz", url: "https://www.tiktok.com/@julian.alvareezz" },
  { id: "whatsapp", label: "WhatsApp", handle: "Chat", url: `https://wa.me/${WHATSAPP_NUMBER}`, hidden: !WHATSAPP_NUMBER },
].filter((s) => !s.hidden);

export const yearsOfExperience = (now = new Date()) => {
  const start = new Date(SITE.startDate);
  const beforeAnniversary = now < new Date(now.getFullYear(), start.getMonth(), start.getDate());
  return now.getFullYear() - start.getFullYear() - (beforeAnniversary ? 1 : 0);
};

export const isExternalCv = !SITE.cvUrl.startsWith("/");
