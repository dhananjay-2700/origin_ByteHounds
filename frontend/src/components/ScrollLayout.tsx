"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  direction = "up",
  className = "",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const transforms: Record<string, string> = {
    up:    "translateY(40px)",
    left:  "translateX(-40px)",
    right: "translateX(40px)",
    none:  "none",
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : transforms[direction],
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
};

/* ─── Sidebar Nav ─────────────────────────────────── */
const SECTIONS = [
  { id: "command-center", label: "Command Center",        icon: "⚡" },
  { id: "forecast",       label: "Demand Forecast",       icon: "📈" },
  { id: "grid-risk",      label: "Grid Risk",             icon: "🛡" },
  { id: "geographic",     label: "Geographic Intel",      icon: "🗺" },
  { id: "scenario-lab",   label: "Scenario Lab",          icon: "🧪" },
  { id: "copilot",        label: "Pravaah AI Copilot",    icon: "🤖" },
];

interface SidebarProps {
  active: string;
  onNav: (id: string) => void;
  dataHealthScore: number;
  onOpenDataHealth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ active, onNav, dataHealthScore, onOpenDataHealth }) => {
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-[220px] z-40 bg-[#080D1A]/95 backdrop-blur-xl border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center space-x-2.5 mb-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
            style={{ background: "linear-gradient(135deg,#FF6B00,#D4A017)" }}
          >
            ⚡
          </div>
          <span className="text-sm font-black tracking-widest text-white font-mono">Pravaah AI</span>
        </div>
        <div className="text-[10px] text-gray-500 font-mono tracking-wider pl-10">AI DELHI GRID</div>
        {/* Tricolour bar */}
        <div className="mt-3 h-[2px] rounded-full overflow-hidden flex">
          <div className="flex-1 bg-[#FF6B00]" />
          <div className="flex-1 bg-white/80" />
          <div className="flex-1 bg-[#138808]" />
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 no-scrollbar">
        {SECTIONS.map((s, i) => {
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onNav(s.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 text-left group ${
                isActive
                  ? "bg-gradient-to-r from-[#FF6B00]/20 to-[#D4A017]/10 text-[#FF8C40] border border-[#FF6B00]/30"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className={`text-base transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-105"}`}>{s.icon}</span>
              <span className="tracking-wide">{s.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Data Health pill at bottom */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        <button
          onClick={onOpenDataHealth}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/50 transition text-xs font-semibold"
        >
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Data Health</span>
          </div>
          <span className="font-mono font-bold">{dataHealthScore}%</span>
        </button>
        <p className="text-[10px] text-gray-600 text-center mt-3 font-mono">भारत · DELHI NCR GRID</p>
      </div>
    </aside>
  );
};

/* ─── Active Section Tracker ─────────────────────── */
export function useActiveSection(sectionIds: string[]) {
  const [active, setActive] = useState(sectionIds[0]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sectionIds]);

  return active;
}
