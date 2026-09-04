"use client";

import React, { useState } from "react";
import { Header } from "../components/Header";
import { DataHealthModal } from "../components/DataHealthModal";
import { ParallaxIntroAnimation } from "../components/ParallaxIntroAnimation";
import { CommandCenterView } from "../components/CommandCenterView";
import { ForecastView } from "../components/ForecastView";
import { GridRiskView } from "../components/GridRiskView";
import { GeographicView } from "../components/GeographicView";
import { ScenarioLabView } from "../components/ScenarioLabView";
import { CopilotView } from "../components/CopilotView";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("command-center");
  const [isDataHealthOpen, setIsDataHealthOpen] = useState<boolean>(false);
  const [showParallaxIntro, setShowParallaxIntro] = useState<boolean>(true);

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 flex flex-col font-sans">
      {/* 1. Opening Sticky Parallax Scroll Animation with Photos from /public/animation */}
      {showParallaxIntro && (
        <ParallaxIntroAnimation onComplete={() => setShowParallaxIntro(false)} />
      )}

      {/* 2. Command Center Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDataHealth={() => setIsDataHealthOpen(true)}
        dataHealthScore={94}
      />

      {/* 3. Main Workspaces Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {activeTab === "command-center" && (
          <CommandCenterView onNavigateTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === "forecast" && <ForecastView />}
        {activeTab === "grid-risk" && <GridRiskView />}
        {activeTab === "geographic" && <GeographicView />}
        {activeTab === "scenario-lab" && <ScenarioLabView />}
        {activeTab === "copilot" && <CopilotView />}
      </main>

      {/* Global Data Health Modal */}
      <DataHealthModal
        isOpen={isDataHealthOpen}
        onClose={() => setIsDataHealthOpen(false)}
      />
    </div>
  );
}
