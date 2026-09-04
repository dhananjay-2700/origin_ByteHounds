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
    { id: "command-center", label: "Command Center", icon: Zap },
    { id: "forecast", label: "Forecast", icon: Activity },
    { id: "grid-risk", label: "Grid Risk", icon: ShieldAlert },
    { id: "geographic", label: "Geographic Intelligence", icon: Map },
    { id: "scenario-lab", label: "Scenario Lab", icon: Sliders },
    { id: "copilot", label: "GridWise Copilot", icon: Bot },
  ];

  return (
    <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-gray-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div 
            onClick={onBackToHome}
            className="flex items-center space-x-3 cursor-pointer group hover:opacity-90 transition"
          >
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 group-hover:border-amber-500/60">
              <Zap className="w-5 h-5 fill-amber-400/20" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-white tracking-wider font-mono group-hover:text-amber-300">
                  GRIDWISE AI
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Delhi Grid ● ONLINE
                </span>
              </div>
              <p className="text-xs text-gray-400 group-hover:text-gray-200 transition">← Back to Home Landing</p>
            </div>
          </div>

          {/* Mobile Data Health Pill */}
          <button
            onClick={onOpenDataHealth}
            className="md:hidden flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-semibold hover:bg-emerald-900/60 transition"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Data Health {dataHealthScore}%</span>
          </button>
        </div>

        {/* Workspace Navigation Bar */}
        <nav className="flex items-center overflow-x-auto space-x-1 py-1 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/40"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-gray-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Desktop Data Health Pill */}
        <div className="hidden md:flex items-center">
          <button
            onClick={onOpenDataHealth}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-semibold hover:bg-emerald-900/60 transition shadow-sm cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Data Health {dataHealthScore}%</span>
          </button>
        </div>

      </div>
    </header>
  );
};
