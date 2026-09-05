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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80 px-4 lg:px-8 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div 
            onClick={onBackToHome}
            className="flex items-center space-x-3 cursor-pointer group hover:opacity-90 transition"
          >
            <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-100 transition">
              <Zap className="w-5 h-5 fill-blue-600/20" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-gray-900 tracking-tight font-sans group-hover:text-blue-600 transition">
                  PRVAAH X
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Delhi Grid ONLINE
                </span>
              </div>
              <p className="text-xs text-gray-500 group-hover:text-gray-900 transition font-medium">← Back to Home Landing</p>
            </div>
          </div>

          {/* Mobile Data Health Pill */}
          <button
            onClick={onOpenDataHealth}
            className="md:hidden flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Data Health {dataHealthScore}%</span>
          </button>
        </div>

        {/* Workspace Navigation Bar */}
        <nav className="flex items-center overflow-x-auto space-x-1.5 py-1 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Data Health Pill - Aligned to Right */}
        <div className="flex items-center shrink-0">
          <button
            onClick={onOpenDataHealth}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition shadow-xs cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Data Health {dataHealthScore}%</span>
          </button>
        </div>

      </div>
    </header>
  );
};