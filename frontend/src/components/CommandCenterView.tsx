"use client";

import React from "react";
import { AlertTriangle, TrendingUp, Thermometer, ShieldAlert, ArrowRight, Sun, Info } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceDot } from "recharts";

interface CommandCenterProps {
  onNavigateTab: (tab: string) => void;
}

export const CommandCenterView: React.FC<CommandCenterProps> = ({ onNavigateTab }) => {
  const chartData = [
    { time: "00:00", actual: 7100, forecast: 7050 },
    { time: "04:00", actual: 6650, forecast: 6620 },
    { time: "08:00", actual: 7400, forecast: 7410 },
    { time: "10:00", actual: 7840, forecast: 7840 },
    { time: "12:00", actual: null, forecast: 8150 },
    { time: "14:00", actual: null, forecast: 8510 },
    { time: "14:15", actual: null, forecast: 8550 },
    { time: "15:15", actual: null, forecast: 8620 }, // PEAK
    { time: "16:00", actual: null, forecast: 8580 },
    { time: "18:00", actual: null, forecast: 8250 },
    { time: "20:00", actual: null, forecast: 7920 },
    { time: "24:00", actual: null, forecast: 7200 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. TOP KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="control-card p-5 border-l-4 border-l-cyan-500 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">CURRENT LOAD</span>
            <div className="text-3xl font-extrabold text-white font-mono mt-1">7,840 <span className="text-sm font-normal text-cyan-400">MW</span></div>
          </div>
          <div className="mt-3 flex items-center text-xs text-cyan-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping mr-2" />
            Live Delhi Telemetry
          </div>
        </div>

        {/* KPI 2 */}
        <div className="control-card p-5 border-l-4 border-l-amber-500 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">PEAK FORECAST</span>
            <div className="text-3xl font-extrabold text-amber-400 font-mono mt-1">8,620 <span className="text-sm font-normal text-amber-300">MW</span></div>
          </div>
          <div className="mt-3 flex items-center text-xs text-amber-300 font-medium">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            +780 MW over current load
          </div>
        </div>

        {/* KPI 3 */}
        <div className="control-card p-5 border-l-4 border-l-purple-500 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">PEAK TIME</span>
            <div className="text-3xl font-extrabold text-white font-mono mt-1">15:15</div>
          </div>
          <div className="mt-3 text-xs text-purple-300 font-semibold font-mono">
            Tomorrow (05 Sep)
          </div>
        </div>

        {/* KPI 4 */}
        <div className="control-card p-5 border-l-4 border-l-rose-500 glow-high flex flex-col justify-between bg-rose-950/20">
          <div>
            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">GRID RISK</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-extrabold text-rose-400 font-mono">82</span>
              <span className="text-sm text-gray-400 font-mono">/ 100</span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 uppercase ml-auto">
                HIGH
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-rose-300/80 font-medium flex items-center">
            <ShieldAlert className="w-3.5 h-3.5 mr-1 text-rose-400" />
            Actionable Grid Stress Alert
          </div>
        </div>
      </div>

      {/* 2. DEMAND FORECAST & CRITICAL WINDOW CHART */}
      <div className="control-card p-6 border border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-white font-mono flex items-center space-x-2">
              <span>24-HOUR DEMAND FORECAST</span>
            </h2>
            <p className="text-xs text-gray-400">Delhi System Demand Curve (MW) & Maximum Pressure Window</p>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-cyan-400" />
              <span className="text-gray-300">Actual Load</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-amber-400" />
              <span className="text-gray-300">AI Peak Prediction</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-rose-500/40 border border-rose-500" />
              <span className="text-rose-400 font-semibold">Critical Window</span>
            </div>
          </div>
        </div>

        {/* Chart area */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} domain={[6000, 9200]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "0.5rem" }}
                itemStyle={{ color: "#f3f4f6", fontSize: "12px" }}
              />
              
              {/* Highlight Critical Window 14:15 - 16:00 */}
              <ReferenceArea x1="14:15" x2="16:00" y1={6000} y2={9200} fill="#f43f5e" fillOpacity={0.15} stroke="#f43f5e" strokeDasharray="3 3" />
              
              <Area type="monotone" dataKey="actual" stroke="#22d3ee" strokeWidth={2.5} fillOpacity={1} fill="url(#actualGrad)" name="Actual Load (MW)" />
              <Area type="monotone" dataKey="forecast" stroke="#fbbf24" strokeWidth={2.5} fillOpacity={1} fill="url(#forecastGrad)" name="Forecasted Load (MW)" />
              
              {/* Peak Marker Dot */}
              <ReferenceDot x="15:15" y={8620} r={6} fill="#f43f5e" stroke="#ffffff" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Overlay Marker Bar */}
        <div className="mt-4 p-3 bg-rose-950/30 border border-rose-500/30 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-rose-300 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>🔴 Critical Window Identified: 14:15 — 16:00</span>
          </div>
          <div className="flex items-center space-x-2 font-mono text-white">
            <span className="text-amber-400 font-bold">▲ PEAK: 8,620 MW</span>
            <span className="text-gray-400">at 15:15 Tomorrow</span>
          </div>
        </div>
      </div>

      {/* 3. HERO CARDS: NEXT RISK, EXPLAINABILITY & WEATHER INTELLIGENCE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD A: THE NEXT RISK */}
        <div className="control-card p-5 border-l-4 border-l-rose-500 flex flex-col justify-between bg-gradient-to-b from-rose-950/20 to-transparent">
          <div>
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
              <span className="text-xs font-bold text-rose-400 tracking-wider flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1.5" />
                ⚠ NEXT CRITICAL WINDOW
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                HIGH RISK
              </span>
            </div>

            <div className="text-xl font-bold text-white font-mono">Tomorrow</div>
            <div className="text-sm font-semibold text-rose-300 font-mono mb-4">14:15 — 16:00</div>

            <div className="space-y-2 text-xs border-t border-b border-gray-800/80 py-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Peak Demand</span>
                <span className="text-white font-bold font-mono">8,620 MW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Grid Risk Score</span>
                <span className="text-rose-400 font-bold font-mono">82 / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ramp Rate</span>
                <span className="text-amber-300 font-bold font-mono">▲ +640 MW/hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Forecast Temp</span>
                <span className="text-rose-300 font-bold font-mono">🌡 41.2°C</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("grid-risk")}
            className="w-full py-2 px-3 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 transition text-xs font-bold flex items-center justify-center space-x-2"
          >
            <span>View Risk Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* CARD B: WHY IS DEMAND INCREASING? (SHAP Explainability) */}
        <div className="control-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
              <span className="text-xs font-bold text-cyan-400 tracking-wider flex items-center">
                <Info className="w-4 h-4 mr-1.5" />
                WHY IS DEMAND INCREASING?
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/20 font-mono">
                SHAP Attribution
              </span>
            </div>

            {/* Feature Bars */}
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300 font-medium">Temperature</span>
                  <span className="text-amber-400 font-mono font-bold">+38%</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: "38%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300 font-medium">Recent Load</span>
                  <span className="text-cyan-400 font-mono font-bold">+27%</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-400 h-full rounded-full" style={{ width: "27%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300 font-medium">Hour of Day</span>
                  <span className="text-purple-400 font-mono font-bold">+19%</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-400 h-full rounded-full" style={{ width: "19%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300 font-medium">Humidity</span>
                  <span className="text-emerald-400 font-mono font-bold">+11%</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: "11%" }} />
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-300 bg-gray-900/60 p-3 rounded-lg border border-gray-800 italic leading-relaxed">
            "High temperature is the primary driver of the expected demand increase, followed by elevated recent load and the afternoon demand pattern."
          </p>
        </div>

        {/* CARD C: WEATHER INTELLIGENCE */}
        <div className="control-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
              <span className="text-xs font-bold text-amber-400 tracking-wider flex items-center">
                <Sun className="w-4 h-4 mr-1.5" />
                WEATHER INTELLIGENCE
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/20 font-mono">
                Grid Correlation
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-4">
              <div>
                <div className="text-3xl font-extrabold text-white font-mono">41.2°C</div>
                <div className="text-xs font-semibold text-rose-400">Extreme Heat Alert</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Humidity</div>
                <div className="text-sm font-bold text-gray-200 font-mono">52%</div>
              </div>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg mb-4 text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-300">Demand Impact</span>
                <span className="text-rose-400 font-bold font-mono">↑ HIGH</span>
              </div>
              <p className="text-gray-300 text-[11px]">
                "High temperature is increasing cooling-driven demand."
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("forecast")}
            className="w-full py-2 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition text-xs font-semibold flex items-center justify-center space-x-1"
          >
            <span>View Temperature vs Demand</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
