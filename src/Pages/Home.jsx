import React, { useState, useEffect, useCallback, memo, useRef } from "react"
import { Helmet } from "react-helmet-async"
import { Github, Linkedin, Mail, ExternalLink, Instagram, Sparkles, Gamepad2 } from "lucide-react"
import AOS from 'aos'
import 'aos/dist/aos.css'
import SpaceGame from "../components/SpaceGame"

const StatusBadge = memo(() => (
  <div className="inline-block animate-float lg:mx-0" data-aos="zoom-in" data-aos-delay="400">
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00d2ff] to-[#3b82f6] rounded-full blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
      <div className="relative px-3 sm:px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10">
        <span className="bg-gradient-to-r from-[#00d2ff] to-[#3b82f6] text-transparent bg-clip-text sm:text-sm text-[0.7rem] font-medium flex items-center">
          <Sparkles className="sm:w-4 sm:h-4 w-3 h-3 mr-2 text-cyan-400" />
          Ready to Innovate
        </span>
      </div>
    </div>
  </div>
));

const MainTitle = memo(() => (
  <div className="space-y-2" data-aos="fade-up" data-aos-delay="600">
    <h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-6xl xl:text-7xl font-bold tracking-tight">
      <span className="relative inline-block">
        <span className="absolute -inset-2 bg-gradient-to-r from-[#00d2ff] to-[#3b82f6] blur-2xl opacity-20"></span>
        <span className="relative bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
          Game UI
        </span>
      </span>
      <br />
      <span className="relative inline-block mt-2">
        <span className="absolute -inset-2 bg-gradient-to-r from-[#00d2ff] to-[#3b82f6] blur-2xl opacity-20"></span>
        <span className="relative bg-gradient-to-r from-[#00d2ff] to-[#3b82f6] bg-clip-text text-transparent">
          Developer
        </span>
      </span>
    </h1>
  </div>
));

const ProfilePhoto = memo(() => (
  <div className="flex sm:justify-start justify-center mb-4 lg:mb-0" data-aos="fade-right" data-aos-delay="100">
    <div className="relative group" id="home-profile-photo">
      <div className="absolute -inset-3 bg-gradient-to-r from-[#00d2ff] to-[#3b82f6] rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-all duration-500"></div>
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-cyan-300/50 shadow-xl shadow-cyan-500/20 transition-all duration-500 group-hover:scale-110 group-hover:border-white/40">
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

const CTAButton = memo(({ href, text, icon: Icon }) => (
  <a href={href}>
    <button className="group relative w-[160px]">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#06b6d4] to-[#2563eb] rounded-xl opacity-50 blur-md group-hover:opacity-90 transition-all duration-700"></div>
      <div className="relative h-11 bg-[#030014] backdrop-blur-xl rounded-lg border border-white/10 leading-none overflow-hidden">
        <div className="absolute inset-0 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 bg-gradient-to-r from-[#06b6d4]/20 to-[#2563eb]/20"></div>
        <span className="absolute inset-0 flex items-center justify-center gap-2 text-sm group-hover:gap-3 transition-all duration-300">
          <span className="bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent font-medium z-10">
            {text}
          </span>
          <Icon className={`w-4 h-4 text-gray-200 ${text === 'Contact' ? 'group-hover:translate-x-1' : 'group-hover:rotate-45'} transform transition-all duration-300 z-10`} />
        </span>
      </div>
    </button>
  </a>
));

const SocialLink = memo(({ icon: Icon, link, label }) => (
  <a href={link} target="_blank" rel="noopener noreferrer" aria-label={label}>
    <button className="group relative p-3"
      aria-label={label}>
      <div className="absolute inset-0 bg-gradient-to-r from-[#00d2ff] to-[#3b82f6] rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
      <div className="relative rounded-xl bg-black/50 backdrop-blur-xl p-2 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all duration-300">
        <Icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
      </div>
    </button>
  </a>
));

const TYPING_SPEED = 100;
const ERASING_SPEED = 50;
const PAUSE_DURATION = 2000;
const WORDS = ["Game UI Developer", "Engine UI Specialist"];
const TECH_STACK = ["React", "Javascript", "Node.js", "Tailwind"];
const SOCIAL_LINKS = [
  { icon: Github, link: "https://github.com/MuhammadNur02", label: "GitHub Profile" },
  { icon: Linkedin, link: "https://www.linkedin.com/in/MuchammadNur/", label: "LinkedIn Profile" },
  { icon: Instagram, link: "https://www.instagram.com/rianz_yan/", label: "Instagram Profile" }
];

const Home = ({ isPlaying, setIsPlaying }) => {
  const [text, setText] = useState("")
  const [isTyping, setIsTyping] = useState(true)
  const [wordIndex, setWordIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

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
  }, [charIndex, isTyping, wordIndex]);

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
        <title>Muhammad Nurrahman Juliansyah — Game UI Developer</title>
        <meta name="description" content="Website resmi Muhammad Nurrahman Juliansyah, Game UI Developer. Saya berfokus pada penciptaan pengalaman digital yang menarik dan selalu berupaya memberikan solusi terbaik dalam setiap proyek yang saya kerjakan." />
     <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://portofolio-v1-one-gamma.vercel.app/" />
        <meta property="og:title" content="Muhammad Nurrahman Juliansyah — Game UI Developer" />
     <meta property="og:description" content="Website resmi dan portofolio Muhammad Nurrahman Juliansyah, Game UI Developer." />
        <meta property="og:url" content="https://portofolio-v1-one-gamma.vercel.app/" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Muhammad Nurrahman Juliansyah",
            "jobTitle": "Game UI Developer",
            "url": "https://portofolio-v1-one-gamma.vercel.app/",
            "sameAs": [
              "https://github.com/MuhammadNur02",
              "https://www.linkedin.com/in/MuchammadNur/",
              "https://www.instagram.com/rianz_yan/"
            ]
          }
        `}</script>
      </Helmet>

      <div className="min-h-screen bg-[#030014] overflow-hidden px-[5%] sm:px-[5%] lg:px-[10%]" id="Home">
        <div className={`relative z-10 transition-all duration-1000 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
          <div className="container mx-auto min-h-screen">
            <div className="flex flex-col lg:flex-row items-center justify-center h-screen md:justify-between gap-0 sm:gap-12 lg:gap-20">
              {/* Left Column */}
              {/* Left Column */}
<div className="w-full lg:w-1/2 space-y-6 sm:space-y-8 text-left lg:text-left order-1 lg:order-1 lg:mt-0 relative z-20"
  data-aos="fade-right"
  data-aos-delay="200">
  
  {/* Bungkus SEMUA konten kiri di sini agar ikut bergeser & memudar halus */}
  <div className={`space-y-6 transition-all duration-700 ease-in-out transform ${
    isPlaying ? "opacity-0 -translate-x-24 pointer-events-none" : "opacity-100 translate-x-0 pointer-events-auto"
  }`}>
    <StatusBadge />
    <MainTitle />

    {/* Typing Effect */}
    <div className="h-8 flex items-center" data-aos="fade-up" data-aos-delay="800">
      <span className="text-xl md:text-2xl bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent font-light">
        {text}
      </span>
      <span className="w-[3px] h-6 bg-gradient-to-t from-[#00d2ff] to-[#06b6d4] ml-1 animate-blink"></span>
    </div>

    {/* Description */}
    <p className="text-base md:text-lg text-gray-400 max-w-xl leading-relaxed font-light"
      data-aos="fade-up"
      data-aos-delay="1000">
      Combining modern front-end architecture, visual aesthetics, and UX principles to build a game interface that is responsive, smooth, and intuitive. Focusing on creating HUDs, menu systems, and immersive player interactions.
    </p>

    {/* Tech Stack */}
    <div className="flex flex-wrap gap-3 justify-start" data-aos="fade-up" data-aos-delay="1200">
      {TECH_STACK.map((tech, index) => (
        <TechStack key={index} tech={tech} />
      ))}
    </div>

    {/* CTA Buttons (Projects, Contact, Play/Stop Game) */}
    <div className="flex flex-row gap-3 w-full justify-start flex-wrap" data-aos="fade-up" data-aos-delay="1400">
      <CTAButton href="#Portofolio" text="Projects" icon={ExternalLink} />
      <CTAButton href="#Contact" text="Contact" icon={Mail} />
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="group relative w-[160px] z-30 pointer-events-auto"
      >
        <div className={`absolute -inset-0.5 bg-gradient-to-r ${isPlaying ? 'from-red-500 to-rose-600' : 'from-[#f59e0b] to-[#ef4444]'} rounded-xl opacity-50 blur-md group-hover:opacity-90 transition-all duration-700`}></div>
        <div className="relative h-11 bg-[#030014] backdrop-blur-xl rounded-lg border border-white/10 leading-none overflow-hidden">
          <div className={`absolute inset-0 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 bg-gradient-to-r ${isPlaying ? 'from-red-500/20 to-rose-600/20' : 'from-[#f59e0b]/20 to-[#ef4444]/20'}`}></div>
          <span className="absolute inset-0 flex items-center justify-center gap-2 text-sm group-hover:gap-3 transition-all duration-300">
            <span className={`bg-gradient-to-r ${isPlaying ? 'from-red-200 to-rose-300' : 'from-amber-200 to-orange-300'} bg-clip-text text-transparent font-medium z-10`}>
              {isPlaying ? "Stop Game" : "Play Game"}
            </span>
            <Gamepad2 className={`w-4 h-4 ${isPlaying ? 'text-red-400' : 'text-amber-300'} group-hover:rotate-12 transform transition-all duration-300 z-10`} />
          </span>
        </div>
      </button>
    </div>

    {/* Social Links */}
    <div className="hidden sm:flex gap-4 justify-start" data-aos="fade-up" data-aos-delay="1600">
      {SOCIAL_LINKS.map((social, index) => (
        <SocialLink key={index} {...social} />
      ))}
    </div>
  </div>
</div>

{/* Right Column - Toggles between GIF illustration and SpaceGame */}
<div className="w-full py-0 md:py-[10%] sm:py-0 lg:w-1/2 h-[260px] sm:h-[400px] lg:h-[600px] xl:h-[750px] relative flex items-center justify-center order-2 lg:order-2 mt-5 sm:mt-0">
  
  {/* GIF Illustration */}
  <div
    onMouseEnter={() => !isPlaying && setIsHovering(true)}
    onMouseLeave={() => !isPlaying && setIsHovering(false)}
    className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out ${
      isPlaying
        ? "opacity-0 translate-x-20 scale-95 pointer-events-none"
        : "opacity-100 translate-x-0 scale-100"
    }`}
  >
    <div className="relative w-full opacity-90">
      <div className={`absolute inset-0 bg-gradient-to-r from-[#00d2ff]/10 to-[#3b82f6]/10 rounded-3xl blur-3xl transition-all duration-700 ease-in-out ${
        isHovering ? "opacity-50 scale-105" : "opacity-20 scale-100"
      }`}></div>

      <div className={`relative lg:left-12 z-10 w-full opacity-90 transform transition-transform duration-500 ${
        isHovering ? "scale-105" : "scale-100"
      }`}>
        <img
          src="Animation1.gif"
          alt="Developer Animation"
          className={`w-full h-full object-contain transition-all duration-500 ${
            isHovering
              ? "scale-[75%] sm:scale-[85%] md:scale-[90%] lg:scale-[90%] rotate-2"
              : "scale-[65%] sm:scale-[75%] md:scale-[80%] lg:scale-[80%]"
          }`}
        />
      </div>

      <div className={`absolute inset-0 pointer-events-none transition-all duration-700 ${
        isHovering ? "opacity-50" : "opacity-20"
      }`}>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-cyan-500/10 to-blue-500/10 blur-3xl animate-[pulse_6s_cubic-bezier(0.4,0,0.6,1)_infinite] transition-all duration-700 ${
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
      {/* SpaceGame Fullscreen */}
{isPlaying && (
  <div className="fixed inset-0 w-screen h-screen z-10 pointer-events-auto">
    <SpaceGame onClose={() => setIsPlaying(false)} />
  </div>
)}
    </>
  );
};

export default memo(Home);

