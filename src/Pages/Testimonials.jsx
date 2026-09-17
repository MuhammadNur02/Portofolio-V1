import React, { useEffect, useState, memo } from "react";
import { Quote, Sparkles } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";
import { supabase } from "../supabase";

const TestimonialSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto animate-pulse">
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
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-cyan-200 font-semibold shrink-0">
      {initial}
    </div>
  );
});

const TestimonialCard = memo(({ item, index }) => (
  <div
    className="relative group h-full"
    data-aos="fade-up"
    data-aos-delay={index * 150}
  >
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00d2ff] to-[#3b82f6] rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500" />
    <div className="relative h-full flex flex-col bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-500/30 transition-colors duration-300">
      <Quote className="w-7 h-7 text-cyan-400/40 mb-3" />
      <p className="text-gray-300/90 text-sm sm:text-base leading-relaxed flex-1">
        "{item.quote}"
      </p>
      <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-3">
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
));

const Testimonials = () => {
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
      className="relative z-10 bg-[#030014] px-[5%] lg:px-[10%] py-16 sm:py-20"
      id="Testimonials"
    >
      <div className="text-center mb-12">
        <p className="inline-flex items-center gap-2 text-cyan-300/80 text-xs sm:text-sm font-medium mb-2">
          <Sparkles className="w-4 h-4" />
          What People Say
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00d2ff] to-[#3b82f6]">
          Testimonials
        </h2>
        <p className="mt-2 text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
          Sedikit cerita dari orang-orang yang pernah bekerja sama dengan saya.
        </p>
      </div>

      {loading ? (
        <TestimonialSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {items.map((item, index) => (
            <TestimonialCard key={item.id} item={item} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(Testimonials);
