import React, { memo, useEffect, useState } from "react";
import { GraduationCap, Briefcase, Award } from "lucide-react";
import { supabase } from "../supabase";
import { useLanguage } from "../context/LanguageContext";

const TYPE_ICON = {
  education: GraduationCap,
  work: Briefcase,
  organization: Award,
};

const TimelineSkeleton = () => (
  <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="pl-14">
        <div className="h-24 rounded-2xl bg-white/[0.03] border border-white/10" />
      </div>
    ))}
  </div>
);

const TimelineItem = memo(({ item, index, isLast }) => {
  const Icon = TYPE_ICON[item.type] || Briefcase;
  return (
    <div
      className="relative pl-14 pb-10 last:pb-0 group"
      data-aos="fade-up"
      data-aos-delay={index * 150}
    >
      {!isLast && (
        <span className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-[#8b5cf6]/50 via-white/10 to-transparent" />
      )}

      <div className="absolute left-0 top-0 -translate-x-1/2 flex items-center justify-center">
        <div className="absolute -inset-2 bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] rounded-full blur opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
        <div className="relative w-9 h-9 rounded-full bg-[#0a0a1a] border border-white/15 flex items-center justify-center">
          <Icon className="w-4 h-4 text-cyan-300" />
        </div>
      </div>

      <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-colors duration-300">
        <span className="inline-block text-xs font-medium text-cyan-300/80 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 mb-2">
          {item.period}
        </span>
        <h3 className="text-white font-semibold text-base sm:text-lg">
          {item.role}
        </h3>
        <p className="text-sm text-gray-400 mb-2">{item.place}</p>
        {item.description && (
          <p className="text-sm text-gray-400/90 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
});

const Timeline = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchExperience = async () => {
      try {
        const { data, error } = await supabase
          .from("experience")
          .select("*")
          .order("order_index", { ascending: true })
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (mounted) setItems(data || []);
      } catch (error) {
        console.error("Error fetching experience:", error.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchExperience();
    return () => {
      mounted = false;
    };
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <div className="mt-16 sm:mt-20" data-aos="fade-up">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4]">
          {t.about.timelineTitle}
        </h2>
        <p className="mt-2 text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
          {t.about.timelineSubtitle}
        </p>
      </div>

      {loading ? (
        <TimelineSkeleton />
      ) : (
        <div className="max-w-2xl mx-auto">
          {items.map((item, index) => (
            <TimelineItem
              key={item.id}
              item={item}
              index={index}
              isLast={index === items.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(Timeline);
