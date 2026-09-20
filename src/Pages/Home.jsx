import React, { useState, useEffect, useCallback, memo, useRef } from "react"
import { Helmet } from "react-helmet-async"
import { Mail, ExternalLink } from "lucide-react"
import { FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa6"
import AOS from 'aos'
import 'aos/dist/aos.css'
import { useLanguage } from "../context/LanguageContext"

const MainTitle = memo(() => {
  const { lang } = useLanguage();
  const [line1, line2] = lang === "en"
    ? ["AI-Assisted", "Fullstack Developer"]
    : ["Fullstack Developer", "Berbasis AI"];
  return (
    <div className="space-y-2" data-aos="fade-up" data-aos-delay="600">
      <h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-6xl xl:text-7xl font-bold tracking-tight">
        <span className="relative inline-block">
          <span className="absolute -inset-2 bg-gradient-to-r from-[#fbbf24] to-[#dc2626] blur-2xl opacity-20"></span>
          <span className="relative bg-gradient-to-r from-white via-amber-100 to-orange-200 bg-clip-text text-transparent">
            {line1}
          </span>
        </span>
        <br />
        <span className="relative inline-block mt-2">
          <span className="absolute -inset-2 bg-gradient-to-r from-[#fbbf24] to-[#dc2626] blur-2xl opacity-20"></span>
          <span className="relative bg-gradient-to-r from-[#fbbf24] to-[#dc2626] bg-clip-text text-transparent">
            {line2}
          </span>
        </span>
      </h1>
    </div>
  );
});

const ProfilePhoto = memo(() => (
  <div className="flex sm:justify-start justify-center mb-4 lg:mb-0" data-aos="fade-right" data-aos-delay="100">
    <div className="relative group" id="home-profile-photo">
      <div className="absolute -inset-3 bg-gradient-to-r from-[#fbbf24] to-[#dc2626] rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-all duration-500"></div>
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-orange-300/50 shadow-xl shadow-orange-500/20 transition-all duration-500 group-hover:scale-110 group-hover:border-white/40">
        <img
          src="/Profil.jpeg"
          alt="Profile"
          className="w-full h-full object-cover object-[center_40%]"
          loading="lazy"
        />
      </div>
    </div>
  </div>
));

const TechStack = memo(({ tech }) => (
  <div className="px-4 py-2 hidden sm:block rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors">
    {tech}
  </div>
));

const CTAButton = memo(({ href, text, icon: Icon, variant }) => (
  <a href={href}>
    <button className="group relative w-[160px]">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#e0231c] to-[#ea580c] rounded-xl opacity-50 blur-md group-hover:opacity-90 transition-all duration-700"></div>
      <div className="relative h-11 bg-[#0a0705] backdrop-blur-xl rounded-lg border border-white/10 leading-none overflow-hidden">
        <div className="absolute inset-0 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 bg-gradient-to-r from-[#e0231c]/20 to-[#ea580c]/20"></div>
        <span className="absolute inset-0 flex items-center justify-center gap-2 text-sm group-hover:gap-3 transition-all duration-300">
          <span className="bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent font-medium z-10">
            {text}
          </span>
          <Icon className={`w-4 h-4 text-gray-200 ${variant === 'contact' ? 'group-hover:translate-x-1' : 'group-hover:rotate-45'} transform transition-all duration-300 z-10`} />
        </span>
      </div>
    </button>
  </a>
));

const SocialLink = memo(({ icon: Icon, link, label, color }) => (
  <a href={link} target="_blank" rel="noopener noreferrer" aria-label={label}>
    <button className="group relative p-3"
      aria-label={label}>
      <div className="absolute inset-0 bg-gradient-to-r from-[#fbbf24] to-[#dc2626] rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
      <div className="relative rounded-xl bg-black/50 backdrop-blur-xl p-2 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all duration-300">
        <Icon
          className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
          style={{ color }}
        />
      </div>
    </button>
  </a>
));

const TYPING_SPEED = 100;
const ERASING_SPEED = 50;
const PAUSE_DURATION = 2000;
const TECH_STACK = ["React", "Javascript", "Node.js", "Tailwind"];
const SOCIAL_LINKS = [
  { icon: FaGithub, link: "https://github.com/MuhammadNur02", label: "GitHub Profile", color: "#ffffff" },
  { icon: FaLinkedin, link: "https://www.linkedin.com/in/MuchammadNur/", label: "LinkedIn Profile", color: "#0A66C2" },
  { icon: FaInstagram, link: "https://www.instagram.com/rianz_yan/", label: "Instagram Profile", color: "#E4405F" }
];

const Home = () => {
  const { t, lang } = useLanguage()
  const WORDS = t.hero.words
  const [text, setText] = useState("")
  const [isTyping, setIsTyping] = useState(true)
  const [wordIndex, setWordIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setText("")
    setCharIndex(0)
    setWordIndex(0)
    setIsTyping(true)
  }, [lang])

  useEffect(() => {
    const initAOS = () => {
      AOS.init({
        once: true,
        offset: 10,
      });
    };

    initAOS();
    window.addEventListener('resize', initAOS);
    return () => window.removeEventListener('resize', initAOS);
  }, []);

  useEffect(() => {
    setIsLoaded(true);
    return () => setIsLoaded(false); 
  }, []);

  const handleTyping = useCallback(() => {
    if (isTyping) {
      if (charIndex < WORDS[wordIndex].length) {
        setText(prev => prev + WORDS[wordIndex][charIndex]);
        setCharIndex(prev => prev + 1);
      } else {
        setTimeout(() => setIsTyping(false), PAUSE_DURATION);
      }
    } else {
      if (charIndex > 0) {
        setText(prev => prev.slice(0, -1));
        setCharIndex(prev => prev - 1);
      } else {
        setWordIndex(prev => (prev + 1) % WORDS.length);
        setIsTyping(true);
      }
    }
  }, [charIndex, isTyping, wordIndex, WORDS]);

  useEffect(() => {
    const timeout = setTimeout(
      handleTyping,
      isTyping ? TYPING_SPEED : ERASING_SPEED
    );
    return () => clearTimeout(timeout);
  }, [handleTyping]);

  return (
    <>
      <Helmet>
        <title>Muhammad Nurrahman Juliansyah — AI-Assisted Fullstack Developer</title>
        <meta name="description" content="Website resmi Muhammad Nurrahman Juliansyah, AI-Assisted Fullstack Developer. Saya berfokus pada penciptaan pengalaman digital yang menarik dan selalu berupaya memberikan solusi terbaik dalam setiap proyek yang saya kerjakan." />
     <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://portofolio-v1-one-gamma.vercel.app/" />
        <meta property="og:title" content="Muhammad Nurrahman Juliansyah — AI-Assisted Fullstack Developer" />
     <meta property="og:description" content="Website resmi dan portofolio Muhammad Nurrahman Juliansyah, AI-Assisted Fullstack Developer." />
        <meta property="og:url" content="https://portofolio-v1-one-gamma.vercel.app/" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Muhammad Nurrahman Juliansyah",
            "jobTitle": "AI-Assisted Fullstack Developer",
            "url": "https://portofolio-v1-one-gamma.vercel.app/",
            "sameAs": [
              "https://github.com/MuhammadNur02",
              "https://www.linkedin.com/in/MuchammadNur/",
              "https://www.instagram.com/rianz_yan/"
            ]
          }
        `}</script>
      </Helmet>

      <div className="min-h-screen bg-[#0a0705] overflow-hidden px-[5%] sm:px-[5%] lg:px-[10%]" id="Home">
        <div className={`relative z-10 transition-all duration-1000 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
          <div className="container mx-auto min-h-screen">
            <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen pt-20 md:justify-between gap-0 sm:gap-12 lg:gap-20">
              {/* Left Column */}
              {/* Left Column */}
<div className="w-full lg:w-1/2 space-y-6 sm:space-y-8 text-left lg:text-left order-1 lg:order-1 lg:mt-0 relative z-20"
  data-aos="fade-right"
  data-aos-delay="200">
  
  <div className="space-y-6">
    <MainTitle />

    {/* Typing Effect */}
    <div className="h-8 flex items-center" data-aos="fade-up" data-aos-delay="800">
      <span className="text-xl md:text-2xl bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent font-light">
        {text}
      </span>
      <span className="w-[3px] h-6 bg-gradient-to-t from-[#fbbf24] to-[#e0231c] ml-1 animate-blink"></span>
    </div>

    {/* Description */}
    <p className="text-base md:text-lg text-gray-400 max-w-xl leading-relaxed font-light"
      data-aos="fade-up"
      data-aos-delay="1000">
      {t.hero.description}
    </p>

    {/* Tech Stack */}
    <div className="flex flex-wrap gap-3 justify-start" data-aos="fade-up" data-aos-delay="1200">
      {TECH_STACK.map((tech, index) => (
        <TechStack key={index} tech={tech} />
      ))}
    </div>

    {/* CTA Buttons (Projects, Contact) */}
    <div className="flex flex-row gap-3 w-full justify-start flex-wrap" data-aos="fade-up" data-aos-delay="1400">
      <CTAButton href="#Portofolio" text={t.hero.projects} icon={ExternalLink} variant="projects" />
      <CTAButton href="#Contact" text={t.hero.contact} icon={Mail} variant="contact" />
    </div>

    {/* Social Links */}
    <div className="hidden sm:flex gap-4 justify-start" data-aos="fade-up" data-aos-delay="1600">
      {SOCIAL_LINKS.map((social, index) => (
        <SocialLink key={index} {...social} />
      ))}
    </div>
  </div>
</div>

{/* Right Column - GIF illustration */}
<div
  className="w-full py-0 md:py-[10%] sm:py-0 lg:w-1/2 h-[260px] sm:h-[400px] lg:h-[600px] xl:h-[750px] relative flex items-center justify-center order-2 lg:order-2 mt-5 sm:mt-0"
  onMouseMove={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const relY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setParallax({ x: relX * 12, y: relY * 12 });
  }}
  onMouseLeave={() => setParallax({ x: 0, y: 0 })}
>

  {/* GIF Illustration */}
  <div
    onMouseEnter={() => setIsHovering(true)}
    onMouseLeave={() => setIsHovering(false)}
    className="absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out opacity-100 translate-x-0 scale-100"
  >
    <div
      className="relative w-full opacity-90"
      style={{
        transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)`,
        transition: "transform 0.3s ease-out",
      }}
    >
      <div className={`absolute inset-0 bg-gradient-to-r from-[#fbbf24]/10 to-[#dc2626]/10 rounded-3xl blur-3xl transition-all duration-700 ease-in-out ${
        isHovering ? "opacity-50 scale-105" : "opacity-20 scale-100"
      }`}></div>

      <div className={`relative lg:left-12 z-10 w-full opacity-90 transform transition-transform duration-500 ${
        isHovering ? "scale-105" : "scale-100"
      }`}>
        {/* Float lives on a wrapper so its transform doesn't fight the hover scale/rotate on the <img> */}
        <div className="animate-gate-float">
          <img
            src="Gate-Japanese-removebg-preview.png"
            alt="Japanese torii gate"
            className={`w-full h-full object-contain transition-all duration-500 ${
              isHovering
                ? "scale-[75%] sm:scale-[85%] md:scale-[90%] lg:scale-[90%] rotate-2"
                : "scale-[65%] sm:scale-[75%] md:scale-[80%] lg:scale-[80%]"
            }`}
            // Dark aura hugging the gate's silhouette: tight edge shadow + wide soft falloff.
            style={{
              filter:
                "drop-shadow(0 0 6px rgba(0,0,0,0.9)) drop-shadow(0 0 22px rgba(0,0,0,0.85)) drop-shadow(0 0 56px rgba(0,0,0,0.7))",
            }}
          />
        </div>
      </div>

      <div className={`absolute inset-0 pointer-events-none transition-all duration-700 ${
        isHovering ? "opacity-50" : "opacity-20"
      }`}>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-orange-500/10 to-amber-500/10 blur-3xl animate-[pulse_6s_cubic-bezier(0.4,0,0.6,1)_infinite] transition-all duration-700 ${
          isHovering ? "scale-110" : "scale-100"
        }`}></div>
      </div>
    </div>
  </div>
</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(Home);

