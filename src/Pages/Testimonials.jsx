import React, { useEffect, useState, memo } from "react";
import { Quote, Sparkles } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";
import { supabase } from "../supabase";
import { useLanguage } from "../context/LanguageContext";

const TestimonialSkeleton = () => (
  <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto animate-pulse">
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="h-52 rounded-2xl bg-white/[0.03] border border-white/10"
      />
    ))}
  </div>
);

const Avatar = memo(({ item }) => {
  if (item.avatar) {
    return (
      <img
        src={item.avatar}
        alt={item.name}
        className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
      />
    );
  }
  const initial = (item.name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-white/10 flex items-center justify-center text-orange-200 font-semibold shrink-0">
      {initial}
    </div>
  );
});

const TestimonialCard = memo(({ item, index }) => {
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      className="relative group h-full"
      data-aos="fade-up"
      data-aos-delay={index * 150}
      onMouseMove={handleMouseMove}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f59e0b] to-[#e0231c] rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500" />
      <div className="relative h-full flex flex-col bg-[#120c07]/55 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-colors duration-300 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              "radial-gradient(220px circle at var(--x, 50%) var(--y, 50%), rgba(245, 158, 11,0.15), transparent 70%)",
          }}
        />
        <Quote className="relative w-7 h-7 text-amber-400/70 mb-3" />
        <p className="relative text-gray-300/90 text-sm sm:text-base leading-relaxed flex-1">
          "{item.quote}"
        </p>
        <div className="relative mt-5 pt-4 border-t border-white/10 flex items-center gap-3">
          <Avatar item={item} />
          <div className="min-w-0">
            <p className="text-white font-medium text-sm sm:text-base truncate">
              {item.name}
            </p>
            <p className="text-gray-500 text-xs sm:text-sm truncate">
              {item.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

const Testimonials = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AOS.init({ once: true });
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchTestimonials = async () => {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("*")
          .order("order_index", { ascending: true })
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (mounted) setItems(data || []);
      } catch (error) {
        console.error("Error fetching testimonials:", error.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTestimonials();
    return () => {
      mounted = false;
    };
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <div
      className="relative z-10 overflow-hidden px-[5%] lg:px-[10%] py-16 sm:py-20"
      id="Testimonials"
    >
      <img
        src="/Kane.jpg"
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute inset-0 z-0 w-full h-full object-cover select-none"
      />
      <div className="absolute inset-0 z-0 bg-[#0a0705]/65" />

      <div className="relative z-10 text-center mb-12">
        <p className="inline-flex items-center gap-2 text-orange-300/80 text-xs sm:text-sm font-medium mb-2">
          <Sparkles className="w-4 h-4" />
          {t.testimonials.badge}
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f59e0b] to-[#e0231c]">
          {t.testimonials.title}
        </h2>
        <p className="mt-2 text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
          {t.testimonials.subtitle}
        </p>
      </div>

      {loading ? (
        <TestimonialSkeleton />
      ) : (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {items.map((item, index) => (
            <TestimonialCard key={item.id} item={item} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(Testimonials);
