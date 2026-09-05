"use client";

import React from "react";
import { Zap, Activity, ShieldAlert, Map, Sliders, Bot } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDataHealth: () => void;
  onBackToHome?: () => void;
  dataHealthScore?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenDataHealth,
  onBackToHome,
  dataHealthScore = 94,
}) => {
  const tabs = [
    { id: "command-center", label: "Command", icon: Zap },
    { id: "forecast", label: "Forecast", icon: Activity },
    { id: "grid-risk", label: "Grid Risk", icon: ShieldAlert },
    { id: "geographic", label: "Geo Intel", icon: Map },
    { id: "scenario-lab", label: "Scenario Lab", icon: Sliders },
    { id: "copilot", label: "Copilot", icon: Bot },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0d0f12]/95 backdrop-blur-xl border-b border-gray-800/80 px-4 lg:px-8 py-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo - Shifted to Left */}
        <div 
          onClick={onBackToHome}
          className="flex items-center space-x-3 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-[#FF7C1E] flex items-center justify-center text-black font-black shadow-lg group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 fill-black" />
          </div>
          <span className="text-xl font-black text-white tracking-tight group-hover:text-[#FF7C1E] transition-colors whitespace-nowrap">
            PravaahX
          </span>
        </div>

        {/* Workspace Navigation Bar - Centered & Streamlined */}
        <nav className="flex items-center overflow-x-auto space-x-1 py-1 no-scrollbar bg-black/60 p-1.5 rounded-full border border-gray-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#FF7C1E] text-black shadow-lg font-black"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black stroke-[2.5]" : "text-gray-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Data Health Pill - Aligned to Right */}
        <div className="flex items-center shrink-0">
          <button
            onClick={onOpenDataHealth}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-black border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider hover:bg-emerald-950/40 hover:border-emerald-400 transition shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Data Health {dataHealthScore}%</span>
          </button>
        </div>

      </div>
    </header>
  );
};
