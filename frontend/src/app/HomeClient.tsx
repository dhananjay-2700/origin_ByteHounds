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
import { ArrowLeft } from "lucide-react";

interface HomeClientProps {
  initialIntroCompleted?: boolean;
}

export function HomeClient({ initialIntroCompleted = false }: HomeClientProps) {
  const [isDataHealthOpen, setIsDataHealthOpen] = useState<boolean>(false);
  const [showForecast, setShowForecast] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("command-center");
  const [introCompleted, setIntroCompleted] = useState<boolean>(initialIntroCompleted);

  const landingRef = useRef<HTMLDivElement>(null);
  const savedScrollY = useRef<number>(0);
  const returningToHomeRef = useRef<boolean>(false);

  // Ensure scroll restoration is manual and clear any legacy cookie that permanently blocked the intro
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      // Purge legacy cookie so returning visitors can see the intro animation
      document.cookie = "intro_completed=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }, []);

  const handleCompleteIntro = () => {
    setIntroCompleted(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("intro_completed", "true");
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  };

  const handleReplayIntro = () => {
    setShowForecast(false);
    setIntroCompleted(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("intro_completed");
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  };

  // Reset scroll to top whenever intro completes and user enters the main site
  useEffect(() => {
    if (introCompleted && !showForecast && !returningToHomeRef.current) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      const raf = requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      });
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }, 60);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
  }, [introCompleted, showForecast]);

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
    <div className="min-h-screen bg-black text-gray-100 flex flex-col font-sans relative" suppressHydrationWarning>
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
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-800/80">
              <button 
                onClick={handleBackToHome} 
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer group shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-[#FF7C1E]" />
                <span>Return to Landing Story</span>
              </button>

              <div className="flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-[#12141a] border border-gray-800/80 text-xs text-gray-300 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#FF7C1E] animate-pulse" />
                <span className="uppercase tracking-wider text-white font-black">
                  {activeTab === "command-center" && "Command Center Dashboard"}
                  {activeTab === "forecast" && "24-Hour Demand Forecast"}
                  {activeTab === "grid-risk" && "Grid Risk Intelligence"}
                  {activeTab === "geographic" && "Geographic Intelligence"}
                  {activeTab === "scenario-lab" && "Interactive Scenario Lab"}
                  {activeTab === "copilot" && "Pravaah AI Copilot"}
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
              onReplayIntro={handleReplayIntro}
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
