import { useEffect, useState, useRef, memo, useMemo } from "react"
import { FileText, Code, Award, Globe, ArrowUpRight, Sparkles } from "lucide-react"
import { useInView, animate } from "framer-motion"
import AOS from 'aos'
import 'aos/dist/aos.css'
import Timeline from "../components/Timeline"
import { useLanguage } from "../context/LanguageContext"
import bingkaiUrl from "../assets/Bingkai-Profil.webp"

// Where the "Download CV" button points. Better than a Drive folder: put your CV in /public
// (e.g. "/CV-Muhammad-Nurrahman-Juliansyah.pdf") and set it here — a direct PDF opens instantly,
// downloads with one tap, and is readable by recruiters' applicant-tracking tools.
const CV_URL = "https://drive.google.com/drive/folders/1gkmicadsk_7yh5qpweNi23js5rCBcsb6"
const CV_IS_LOCAL_FILE = CV_URL.startsWith("/")

const useCountUp = (target, isInView) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, target, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (v) => setCount(Math.round(v)),
    });
    return () => controls.stop();
  }, [isInView, target]);
  return count;
};

// Memoized Components
const Header = memo(() => {
  const { t } = useLanguage();
  return (
    <div className="text-center lg:mb-8 mb-2 px-[5%]">
      <div className="inline-block relative group">
        <h2
          className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f59e0b] to-[#e0231c]"
          data-aos="zoom-in-up"
          data-aos-duration="600"
        >
          {t.about.title}
        </h2>
      </div>
      <p
        className="mt-2 text-gray-400 max-w-2xl mx-auto text-base sm:text-lg flex items-center justify-center gap-2"
        data-aos="zoom-in-up"
        data-aos-duration="800"
      >
        <Sparkles className="w-5 h-5 text-orange-400" />
        {t.about.subtitle}
        <Sparkles className="w-5 h-5 text-orange-400" />
      </p>
    </div>
  );
});

const ProfileImage = memo(() => (
  <div className="flex justify-center lg:justify-end items-center sm:p-12 sm:py-0 sm:pb-0 p-0 py-2 pb-2">
    <div
      className="relative z-10 group w-72 h-72 sm:w-96 sm:h-96"
      data-aos="fade-up"
      data-aos-duration="1000"
      id="about-profile-photo"
    >
      {/* Ambient maroon bloom bleeding out beyond the frame's own edge glow */}
      <div className="absolute inset-0 -z-10 rounded-full bg-[#7f1d1d]/40 blur-3xl scale-75 animate-pulse-slow" />

      <img
        src={bingkaiUrl}
        alt="Muhammad Nurrahman Juliansyah"
        loading="lazy"
        className="relative w-full h-full object-contain animate-ember-glow transition-transform duration-700 ease-out group-hover:scale-110"
      />
    </div>
  </div>
));

const StatCard = memo(({ icon: Icon, color, value, label, description, animation }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const count = useCountUp(value, isInView);

  return (
  <div ref={ref} data-aos={animation} data-aos-duration={1300} className="relative group">
    <div className="relative z-10 bg-gray-900/50 backdrop-blur-lg rounded-2xl p-6 border border-white/10 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl h-full flex flex-col justify-between">
      <div className={`absolute -z-10 inset-0 bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>

      <div className="flex items-center justify-between mb-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/10 transition-transform group-hover:rotate-6">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <span
          className="text-4xl font-bold text-white"
        >
          {count}
        </span>
      </div>

      <div>
        <p 
          className="text-sm uppercase tracking-wider text-gray-300 mb-2"
          data-aos="fade-up"
          data-aos-duration="800"
          data-aos-anchor-placement="top-bottom"
        >
          {label}
        </p>
        <div className="flex items-center justify-between">
          <p 
            className="text-xs text-gray-400"
            data-aos="fade-up"
            data-aos-duration="1000"
            data-aos-anchor-placement="top-bottom"
          >
            {description}
          </p>
          <ArrowUpRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
        </div>
      </div>
    </div>
  </div>
  );
});

const AboutPage = () => {
  const { t } = useLanguage();
  // Memoized calculations
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalCertificates: 0,
    YearExperience: 0,
  });

  useEffect(() => {
    const updateStats = () => {
      const storedProjects = JSON.parse(localStorage.getItem("projects") || "[]");
      const storedCertificates = JSON.parse(localStorage.getItem("certificates") || "[]");
      
      const startDate = new Date("2021-11-06");
      const today = new Date();
      const experience = today.getFullYear() - startDate.getFullYear() -
        (today < new Date(today.getFullYear(), startDate.getMonth(), startDate.getDate()) ? 1 : 0);

      setStats({
        totalProjects: storedProjects.length,
        totalCertificates: storedCertificates.length,
        YearExperience: experience
      });
    };

    updateStats();

    window.addEventListener('storage', updateStats);
    window.addEventListener('portfolioDataUpdated', updateStats);

    return () => {
      window.removeEventListener('storage', updateStats);
      window.removeEventListener('portfolioDataUpdated', updateStats);
    };
  }, []);

  const { totalProjects, totalCertificates, YearExperience } = stats;

  // Optimized AOS initialization
  useEffect(() => {
    const initAOS = () => {
      AOS.init({
        once: false, 
      });
    };

    initAOS();
    
    // Debounced resize handler
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(initAOS, 250);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Memoized stats data
  const statsData = useMemo(() => [
    {
      icon: Code,
      color: "from-[#f59e0b] to-[#e0231c]",
      value: totalProjects,
      label: t.about.statTotalProjects,
      description: t.about.statTotalProjectsDesc,
      animation: "fade-right",
    },
    {
      icon: Award,
      color: "from-[#e0231c] to-[#f59e0b]",
      value: totalCertificates,
      label: t.about.statCertificates,
      description: t.about.statCertificatesDesc,
      animation: "fade-up",
    },
    {
      icon: Globe,
      color: "from-[#f59e0b] to-[#e0231c]",
      value: YearExperience,
      label: t.about.statYearsExperience,
      description: t.about.statYearsExperienceDesc,
      animation: "fade-left",
    },
  ], [totalProjects, totalCertificates, YearExperience, t]);

  return (
    <div
  className="relative z-10 h-auto pb-[10%] text-white overflow-hidden px-[5%] sm:px-[5%] lg:px-[10%] mt-10 sm-mt-0" 
  id="About"
  itemScope
  itemType="https://schema.org/Person"
>
      <Header />

      <div className="w-full mx-auto pt-8 sm:pt-12 relative">
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <h2 
              className="text-3xl sm:text-4xl lg:text-5xl font-bold"
              data-aos="fade-right"
              data-aos-duration="1000"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f59e0b] to-[#e0231c]">
                {t.about.greeting}
              </span>
              <span 
                className="block mt-2 text-gray-200"
                data-aos="fade-right"
                data-aos-duration="1300"
                itemProp="name"
              >
                Muhammad Nurrahman Juliansyah
              </span>
            </h2>

            {/* --- DESKRIPSI TENTANG SAYA (DI ATAS QUOTE) --- */}
            <div 
  className="bg-gray-900/40 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-white/10 shadow-xl"
  data-aos="fade-up"
  data-aos-duration="1500"
>
  <p className="text-gray-300 text-sm sm:text-base leading-relaxed text-center lg:text-left">
    {t.about.bio}
  </p>
</div>

            {/* Quote Section */}
            <div 
              className="relative bg-gradient-to-br from-[#f59e0b]/5 via-transparent to-[#e0231c]/5 border border-gradient-to-r border-[#f59e0b]/30 rounded-2xl p-4 my-6 backdrop-blur-md shadow-2xl overflow-hidden"
              data-aos="fade-up"
              data-aos-duration="1700"
            >
              {/* Floating orbs background */}
              <div className="absolute top-2 right-4 w-16 h-16 bg-gradient-to-r from-[#f59e0b]/20 to-[#e0231c]/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-4 -left-2 w-12 h-12 bg-gradient-to-r from-[#e0231c]/20 to-[#f59e0b]/20 rounded-full blur-lg"></div>
              
              {/* Quote icon */}
              <div className="absolute top-3 left-4 text-[#f59e0b] opacity-30">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                </svg>
              </div>
              
              <blockquote className="text-gray-300 text-center lg:text-left italic font-medium text-sm relative z-10 pl-6">
                "{t.about.quote}"
              </blockquote>
            </div>

            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 lg:gap-4 lg:px-0 w-full">
              {/* Links styled as buttons (a <button> inside an <a> is invalid HTML and confuses screen readers) */}
              <a
                href={CV_URL}
                {...(CV_IS_LOCAL_FILE ? { download: true } : { target: "_blank", rel: "noopener noreferrer" })}
                data-aos="fade-up"
                data-aos-duration="800"
                className="w-full lg:w-auto sm:px-6 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-[#f59e0b] to-[#e0231c] text-white font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center lg:justify-start gap-2 shadow-lg hover:shadow-xl"
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" /> {t.about.downloadCV}
              </a>
              <a
                href="#Portofolio"
                data-aos="fade-up"
                data-aos-duration="1000"
                className="w-full lg:w-auto sm:px-6 py-2 sm:py-3 rounded-lg border border-[#e0231c]/50 text-[#e0231c] font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center lg:justify-start gap-2 hover:bg-[#e0231c]/10"
              >
                <Code className="w-4 h-4 sm:w-5 sm:h-5" /> {t.about.viewProjects}
              </a>
            </div>
          </div>

          <ProfileImage />
        </div>

        <a href="#Portofolio">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 cursor-pointer">
            {statsData.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </a>

        <Timeline />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes spin-slower {
          to { transform: rotate(360deg); }
        }
        @keyframes emberGlow {
          0%, 100% {
            filter: drop-shadow(0 0 14px rgba(127,29,29,0.55)) drop-shadow(0 0 32px rgba(224,35,28,0.35));
          }
          18% {
            filter: drop-shadow(0 0 24px rgba(127,29,29,0.72)) drop-shadow(0 0 50px rgba(224,35,28,0.48));
          }
          34% {
            filter: drop-shadow(0 0 10px rgba(127,29,29,0.4)) drop-shadow(0 0 22px rgba(224,35,28,0.25));
          }
          52% {
            filter: drop-shadow(0 0 28px rgba(127,29,29,0.78)) drop-shadow(0 0 58px rgba(224,35,28,0.52));
          }
          67% {
            filter: drop-shadow(0 0 16px rgba(127,29,29,0.5)) drop-shadow(0 0 34px rgba(224,35,28,0.3));
          }
          85% {
            filter: drop-shadow(0 0 22px rgba(127,29,29,0.65)) drop-shadow(0 0 46px rgba(224,35,28,0.4));
          }
        }
        .animate-bounce-slow {
          animation: bounce 3s infinite;
        }
        .animate-pulse-slow {
          animation: pulse 3s infinite;
        }
        .animate-spin-slower {
          animation: spin-slower 8s linear infinite;
        }
        .animate-ember-glow {
          animation: emberGlow 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default memo(AboutPage);

