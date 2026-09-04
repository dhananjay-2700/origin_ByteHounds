"use client";

import React, { useState, useRef, useEffect } from "react";
import { DataHealthModal } from "../components/DataHealthModal";
import { ParallaxIntroAnimation } from "../components/ParallaxIntroAnimation";
import { GridWiseLanding } from "../components/GridWiseLanding";
import { Header } from "../components/Header";
import { ForecastView } from "../components/ForecastView";
import { CommandCenterView } from "../components/CommandCenterView";
import { GridRiskView } from "../components/GridRiskView";
import { GeographicView } from "../components/GeographicView";
import { ScenarioLabView } from "../components/ScenarioLabView";
import { CopilotView } from "../components/CopilotView";
import { ArrowLeft, Bot, MessageSquare } from "lucide-react";

export default function Home() {
  const [isDataHealthOpen, setIsDataHealthOpen] = useState<boolean>(false);
  const [showForecast, setShowForecast] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("command-center");
  const [introCompleted, setIntroCompleted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("intro_completed") === "true";
    }
    return false;
  });

  const landingRef = useRef<HTMLDivElement>(null);
  const savedScrollY = useRef<number>(0);
  const returningToHomeRef = useRef<boolean>(false);

  const handleCompleteIntro = () => {
    setIntroCompleted(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("intro_completed", "true");
    }
  };

  useEffect(() => {
    if (!showForecast && returningToHomeRef.current) {
      returningToHomeRef.current = false;
      const targetY = savedScrollY.current;
      requestAnimationFrame(() => {
        window.scrollTo({ top: targetY, behavior: "smooth" });
      });
    }
  }, [showForecast]);

  const handleOpenFeature = (sectionId?: string) => {
    handleCompleteIntro();
    savedScrollY.current = window.scrollY;
    setActiveTab(sectionId || "command-center");
    setShowForecast(true);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const handleBackToHome = () => {
    returningToHomeRef.current = true;
    setShowForecast(false);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col font-sans relative">
      {showForecast ? (
        <div className="w-full flex flex-col min-h-screen">
          {/* Header Navigation */}
          <Header
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onOpenDataHealth={() => setIsDataHealthOpen(true)}
            onBackToHome={handleBackToHome}
          />

          {/* Feature Page Container */}
          <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-800/80">
              <button 
                onClick={handleBackToHome} 
                className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors uppercase tracking-widest text-xs font-bold font-mono cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Previous Location</span>
              </button>

              <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="uppercase tracking-widest text-white font-bold">
                  {activeTab === "command-center" && "Command Center Dashboard"}
                  {activeTab === "forecast" && "24-Hour Demand Forecast"}
                  {activeTab === "grid-risk" && "Grid Risk Intelligence"}
                  {activeTab === "geographic" && "Geographic Intelligence"}
                  {activeTab === "scenario-lab" && "Interactive Scenario Lab"}
                  {activeTab === "copilot" && "PRVAAH X Copilot"}
                </span>
              </div>
            </div>

            {/* Standalone Feature View */}
            {activeTab === "command-center" && (
              <CommandCenterView onNavigateTab={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }} />
            )}
            {activeTab === "forecast" && <ForecastView />}
            {activeTab === "grid-risk" && <GridRiskView />}
            {activeTab === "geographic" && <GeographicView />}
            {activeTab === "scenario-lab" && <ScenarioLabView />}
            {activeTab === "copilot" && <CopilotView />}
          </main>
        </div>
      ) : (
        <>
          {/* 1. Opening Sticky Parallax Scroll Animation with Photos (Renders ONCE only) */}
          {!introCompleted && (
            <ParallaxIntroAnimation onComplete={handleCompleteIntro} />
          )}

          {/* 2. Main Storytelling MVP Content */}
          <div ref={landingRef} className="relative z-10 w-full bg-[#0d0f12]">
            <GridWiseLanding 
              onViewForecast={(sec) => handleOpenFeature(sec)} 
              onOpenDataHealth={() => setIsDataHealthOpen(true)}
            />
          </div>
        </>
      )}

      {/* Global Data Health Modal */}
      <DataHealthModal
        isOpen={isDataHealthOpen}
        onClose={() => setIsDataHealthOpen(false)}
      />
    </div>
  );
}
