import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Briefcase, Calendar, GraduationCap, Users } from "lucide-react";
import { RevealGroup, RevealItem } from "./Reveal";

// Port of shadcnui-blocks/timeline-02: a vertical rail with a dot per entry, an icon + company line,
// the role, the date range, a description and technology badges. Added: the rail draws itself in
// vermilion as you scroll through it.

const TYPE_ICON = { work: Briefcase, education: GraduationCap, organization: Users };

export default function ExperienceTimeline({ items, typeLabels = {} }) {
  const railRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: railRef, offset: ["start 75%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <div ref={railRef} className="relative ml-3">
      {/* Timeline line: a faint track with the scroll-driven fill on top */}
      <div aria-hidden="true" className="absolute bottom-0 left-0 top-4 w-px bg-white/10" />
      <motion.div
        aria-hidden="true"
        className="absolute bottom-0 left-0 top-4 w-px origin-top bg-gradient-to-b from-shu-500 via-shu-500 to-kin-400"
        style={{ scaleY }}
      />

      <RevealGroup as="ol" className="space-y-14" stagger={0.12}>
        {items.map((item) => {
          const Icon = TYPE_ICON[item.type] || Briefcase;
          const technologies = Array.isArray(item.technologies) ? item.technologies : [];
          return (
            <RevealItem as="li" key={item.id} className="relative pl-10 sm:pl-12">
              {/* Timeline dot */}
              <span
                aria-hidden="true"
                className="absolute left-px top-3 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-shu-500 bg-ink shadow-[0_0_0_6px_rgba(232,71,47,0.12)]"
              />

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04]">
                    <Icon className="h-[18px] w-[18px] text-washi-muted" />
                  </span>
                  <span className="text-base font-medium text-washi">{item.place}</span>
                  {typeLabels[item.type] && (
                    <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-washi-subtle">
                      {typeLabels[item.type]}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-display text-xl font-semibold tracking-tight text-washi font-semiwide sm:text-2xl">
                    {item.role}
                  </h3>
                  <p className="mt-2 flex items-center gap-2 text-sm text-shu-300">
                    <Calendar aria-hidden="true" className="h-4 w-4" />
                    <span>{item.period}</span>
                  </p>
                </div>

                {item.description && (
                  <p className="max-w-2xl leading-relaxed text-washi-muted text-pretty">{item.description}</p>
                )}

                {technologies.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {technologies.map((tech) => (
                      <li key={tech} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-washi-muted">
                        {tech}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </div>
  );
}
