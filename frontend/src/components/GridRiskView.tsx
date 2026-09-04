"use client";

import React from "react";
import { ShieldAlert, AlertTriangle, Clock, Activity, Zap } from "lucide-react";

export const GridRiskView: React.FC = () => {
  const riskContributors = [
    { name: "Demand Utilization", value: 88, color: "bg-rose-500" },
    { name: "Weather Stress", value: 74, color: "bg-amber-500" },
    { name: "Demand Ramp Rate", value: 62, color: "bg-yellow-500" },
    { name: "Residual Anomaly", value: 41, color: "bg-cyan-500" },
    { name: "Forecast Uncertainty", value: 28, color: "bg-purple-500" },
  ];

  const timeline = [
    { time: "10:00", score: 38, level: "LOW", badge: "bg-emerald-950 text-emerald-400 border-emerald-500/30" },
    { time: "12:00", score: 62, level: "MODERATE", badge: "bg-amber-950 text-amber-400 border-amber-500/30" },
    { time: "14:00", score: 79, level: "HIGH", badge: "bg-rose-950 text-rose-300 border-rose-500/30" },
    { time: "15:00", score: 91, level: "CRITICAL", badge: "bg-rose-600 text-white font-bold animate-pulse" },
    { time: "16:00", score: 82, level: "HIGH", badge: "bg-rose-950 text-rose-300 border-rose-500/30" },
    { time: "18:00", score: 58, level: "MODERATE", badge: "bg-amber-950 text-amber-400 border-amber-500/30" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. HERO RISK SCORE DIAL / CARD */}
      <div className="control-card p-6 border-l-4 border-l-rose-500 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-rose-950/30 via-gray-900 to-gray-900">
        <div className="flex items-center space-x-6">
          <div className="relative flex items-center justify-center w-28 h-28 rounded-full border-4 border-rose-500/40 bg-rose-950/50 glow-critical">
            <div className="text-center">
              <span className="text-4xl font-extrabold text-white font-mono">82</span>
              <div className="text-[10px] text-gray-400 font-mono">/ 100</div>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white font-mono">GRID RISK SCORE</h1>
              <span className="px-3 py-1 rounded bg-rose-500 text-white font-bold text-xs tracking-wider">
                HIGH RISK
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1 max-w-md">
              System grid stress is projected to reach elevated levels during tomorrow's afternoon demand ramp.
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-900/80 rounded-xl border border-gray-800 text-xs space-y-2 font-mono">
          <div className="flex justify-between space-x-4">
            <span className="text-gray-400">Target Grid Capacity:</span>
            <span className="text-white font-bold">9,800 MW</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-gray-400">Peak Demand Load:</span>
            <span className="text-rose-400 font-bold">8,620 MW (88% Util)</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-gray-400">System Stress Trigger:</span>
            <span className="text-amber-300 font-bold">41.2°C Temperature</span>
          </div>
        </div>
      </div>

      {/* 2. RISK CONTRIBUTORS & FUTURE TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risk Contributors */}
        <div className="control-card p-6 border border-gray-800">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-4 flex items-center">
            <ShieldAlert className="w-4 h-4 mr-2 text-rose-400" />
            RISK CONTRIBUTORS BREAKDOWN
          </h2>

          <div className="space-y-4">
            {riskContributors.map((c, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-gray-300">{c.name}</span>
                  <span className="text-white font-bold">{c.value}%</span>
                </div>
                <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                  <div className={`${c.color} h-full rounded-full`} style={{ width: `${c.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Future Risk Timeline */}
        <div className="control-card p-6 border border-gray-800">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-4 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-amber-400" />
            FUTURE RISK TIMELINE (TOMORROW)
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {timeline.map((t, i) => (
              <div
                key={i}
                className="p-3 bg-gray-900/60 rounded-lg border border-gray-800 flex flex-col items-center justify-between space-y-2 text-center"
              >
                <span className="text-xs text-gray-400 font-mono">{t.time}</span>
                <span className="text-xl font-bold text-white font-mono">{t.score}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${t.badge}`}>
                  {t.level}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. ANOMALY DETECTION SECTION */}
      <div className="control-card p-6 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-950/20 to-transparent">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono font-bold uppercase mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span>ANOMALY DETECTED (STATISTICAL RESIDUAL ENGINE)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-4 font-mono">
          <div className="p-3 bg-gray-900/70 rounded-lg border border-gray-800">
            <span className="text-[10px] text-gray-400 uppercase">Detection Time</span>
            <div className="text-lg font-bold text-white mt-1">14:15 Tomorrow</div>
          </div>
          <div className="p-3 bg-gray-900/70 rounded-lg border border-gray-800">
            <span className="text-[10px] text-gray-400 uppercase">Expected Load</span>
            <div className="text-lg font-bold text-gray-300 mt-1">7,820 MW</div>
          </div>
          <div className="p-3 bg-gray-900/70 rounded-lg border border-gray-800">
            <span className="text-[10px] text-gray-400 uppercase">Observed Load</span>
            <div className="text-lg font-bold text-amber-400 mt-1">8,430 MW</div>
          </div>
          <div className="p-3 bg-gray-900/70 rounded-lg border border-gray-800">
            <span className="text-[10px] text-gray-400 uppercase">Residual Deviation</span>
            <div className="text-lg font-bold text-rose-400 mt-1">+610 MW (HIGH)</div>
          </div>
        </div>

        <div className="p-3 bg-gray-900/90 rounded-lg border border-gray-800 text-xs text-gray-300">
          <span className="font-bold text-amber-400">Why? </span>
          Demand is significantly above the model's expected statistical residual range due to rapid localized HVAC cooling spikes.
        </div>
      </div>
    </div>
  );
};
