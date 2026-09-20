import { useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import { FaLinkedinIn, FaGithub, FaInstagram, FaYoutube, FaTiktok, FaWhatsapp } from "react-icons/fa6";
import AOS from "aos";
import "aos/dist/aos.css";

// ─── WHATSAPP — FILL IN YOUR NUMBER HERE ────────────────────────────────────
// Country code + number, digits only (no "+", spaces or dashes), e.g. "6281234567890".
// While this is empty the WhatsApp card stays hidden, so nobody lands on a broken link.
const WHATSAPP_NUMBER = "";
// ────────────────────────────────────────────────────────────────────────────

// The real TikTok logo: white note with the cyan and red offset shadows.
const TikTokIcon = ({ className }) => (
  <span className={`relative inline-block ${className}`}>
    <FaTiktok className="absolute inset-0 h-full w-full -translate-x-[1.5px] -translate-y-px" style={{ color: "#25F4EE" }} />
    <FaTiktok className="absolute inset-0 h-full w-full translate-x-[1.5px] translate-y-px" style={{ color: "#FE2C55" }} />
    <FaTiktok className="absolute inset-0 h-full w-full text-white" />
  </span>
);

// Each platform is drawn like its own app icon: official brand color behind the white logo.
const socialLinks = [
  {
    name: "LinkedIn",
    handle: "Let's Connect",
    url: "https://www.linkedin.com/in/MuchammadNur/",
    icon: FaLinkedinIn,
    background: "#0A66C2",
  },
  {
    name: "GitHub",
    handle: "@MuhammadNur02",
    url: "https://github.com/MuhammadNur02",
    icon: FaGithub,
    background: "#181717",
  },
  {
    name: "Instagram",
    handle: "@rianz_yan",
    url: "https://www.instagram.com/rianz_yan/",
    icon: FaInstagram,
    background:
      "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
  },
  {
    name: "TikTok",
    handle: "@julian.alvareezz",
    url: "https://www.tiktok.com/@julian.alvareezz?lang=id-ID",
    icon: TikTokIcon,
    background: "#000000",
  },
  {
    name: "YouTube",
    handle: "@Julian.Alvarez02",
    url: "https://www.youtube.com/@Julian.Alvarez02",
    icon: FaYoutube,
    background: "#FF0000",
  },
  {
    name: "WhatsApp",
    handle: "Chat via WhatsApp",
    url: `https://wa.me/${WHATSAPP_NUMBER}`,
    icon: FaWhatsapp,
    background: "#25D366",
    hidden: !WHATSAPP_NUMBER,
  },
].filter((link) => !link.hidden);

const SocialLinks = () => {
  useEffect(() => {
    AOS.init({
      offset: 10,
    });
  }, []);

  return (
    <div className="w-full bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 py-8 backdrop-blur-xl">
      <h3
        className="text-xl font-semibold text-white mb-6 flex items-center gap-2"
        data-aos="fade-down"
      >
        <span className="inline-block w-8 h-1 bg-orange-500 rounded-full"></span>
        Connect With Me
      </h3>

      {/* Two columns only where the card is wide (tablet); on phones and in the narrow desktop column one per row keeps handles readable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
        {socialLinks.map((link, index) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${link.name} — ${link.handle}`}
            className="group flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10
                       hover:bg-white/[0.08] hover:border-white/25 transition-colors duration-300"
            data-aos="fade-up"
            data-aos-delay={index * 80}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/10"
              style={{ background: link.background }}
            >
              <link.icon className="h-5 w-5 text-white" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-gray-100">{link.name}</span>
              <span className="block truncate text-xs text-gray-400">{link.handle}</span>
            </span>

            <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-500 transition-colors duration-300 group-hover:text-white" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default SocialLinks;
