"use client";

import React, { useState } from "react";
import { Activity, CheckCircle2, Cpu, BarChart2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea } from "recharts";

export const ForecastView: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<"all" | "xgb" | "baseline" | "lgb">("all");

  const forecastSeries = [
    { time: "00:00", actual: 7100, xgboost: 7050, baseline: 7000, lightgbm: 7030 },
    { time: "02:00", actual: 6800, xgboost: 6780, baseline: 6700, lightgbm: 6760 },
    { time: "04:00", actual: 6650, xgboost: 6620, baseline: 6500, lightgbm: 6600 },
    { time: "06:00", actual: 6900, xgboost: 6920, baseline: 6800, lightgbm: 6900 },
    { time: "08:00", actual: 7400, xgboost: 7410, baseline: 7300, lightgbm: 7390 },
    { time: "10:00", actual: 7840, xgboost: 7840, baseline: 7700, lightgbm: 7820 },
    { time: "12:00", actual: null, xgboost: 8150, baseline: 8000, lightgbm: 8120 },
    { time: "14:00", actual: null, xgboost: 8510, baseline: 8300, lightgbm: 8490 },
    { time: "15:15", actual: null, xgboost: 8620, baseline: 8420, lightgbm: 8590 },
    { time: "16:00", actual: null, xgboost: 8580, baseline: 8380, lightgbm: 8550 },
    { time: "18:00", actual: null, xgboost: 8250, baseline: 8100, lightgbm: 8220 },
    { time: "20:00", actual: null, xgboost: 7920, baseline: 7800, lightgbm: 7900 },
    { time: "22:00", actual: null, xgboost: 7550, baseline: 7450, lightgbm: 7530 },
    { time: "24:00", actual: null, xgboost: 7200, baseline: 7100, lightgbm: 7180 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="control-card p-6 border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono font-bold uppercase mb-1">
            <Activity className="w-4 h-4" />
            <span>MACHINE LEARNING DEMAND PIPELINE</span>
          </div>
          <h1 className="text-xl font-bold text-white font-mono">24-Hour Electricity Demand Forecast</h1>
          <p className="text-xs text-gray-400">Comparing Seasonal Naive, XGBoost (Main), and LightGBM models</p>
        </div>

        {/* Model Selector Buttons */}
        <div className="flex items-center bg-gray-900/80 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setSelectedModel("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedModel === "all" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "text-gray-400 hover:text-white"
            }`}
          >
            All Models
          </button>
          <button
            onClick={() => setSelectedModel("xgb")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedModel === "xgb" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "text-gray-400 hover:text-white"
            }`}
          >
            XGBoost (Main)
          </button>
          <button
            onClick={() => setSelectedModel("lgb")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedModel === "lgb" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "text-gray-400 hover:text-white"
            }`}
          >
            LightGBM
          </button>
          <button
            onClick={() => setSelectedModel("baseline")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedModel === "baseline" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "text-gray-400 hover:text-white"
            }`}
          >
            Baseline
          </button>
        </div>
      </div>

      {/* Main Interactive Forecast Chart */}
      <div className="control-card p-6 border border-gray-800">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastSeries} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} domain={[6000, 9000]} />
              <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "0.5rem" }} />
              <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
              
              <ReferenceArea x1="14:15" x2="16:00" y1={6000} y2={9000} fill="#f43f5e" fillOpacity={0.12} />

              <Line type="monotone" dataKey="actual" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4 }} name="Actual Load (MW)" />
              
              {(selectedModel === "all" || selectedModel === "xgb") && (
                <Line type="monotone" dataKey="xgboost" stroke="#fbbf24" strokeWidth={3} dot={false} name="XGBoost Main (MW)" />
              )}
              
              {(selectedModel === "all" || selectedModel === "lgb") && (
                <Line type="monotone" dataKey="lightgbm" stroke="#c084fc" strokeWidth={2} strokeDasharray="4 4" dot={false} name="LightGBM Challenger (MW)" />
              )}

              {(selectedModel === "all" || selectedModel === "baseline") && (
                <Line type="monotone" dataKey="baseline" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Seasonal Naive Baseline (MW)" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accuracy & Model Evaluation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="control-card p-4 border border-gray-800">
          <div className="flex items-center space-x-2 text-xs text-gray-400 mb-1">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Mean Absolute Error (MAE)</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">48.5 <span className="text-xs text-cyan-400">MW</span></div>
          <div className="text-[11px] text-emerald-400 mt-1 font-semibold">✓ High Precision</div>
        </div>

        <div className="control-card p-4 border border-gray-800">
          <div className="flex items-center space-x-2 text-xs text-gray-400 mb-1">
            <BarChart2 className="w-4 h-4 text-amber-400" />
            <span>MAPE / WAPE</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">1.42%</div>
          <div className="text-[11px] text-amber-400 mt-1 font-semibold">Standard Threshold &lt; 3.5%</div>
        </div>

        <div className="control-card p-4 border border-gray-800">
          <div className="flex items-center space-x-2 text-xs text-gray-400 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Peak Demand Error</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">0.85%</div>
          <div className="text-[11px] text-emerald-300 mt-1 font-semibold">Timing Error: 0 mins</div>
        </div>

        <div className="control-card p-4 border border-gray-800">
          <div className="flex items-center space-x-2 text-xs text-gray-400 mb-1">
            <Activity className="w-4 h-4 text-purple-400" />
            <span>Selected Model</span>
          </div>
          <div className="text-base font-bold text-purple-300 font-mono">XGBoost (Main)</div>
          <div className="text-[11px] text-gray-400 mt-1">Evaluated against 90-day history</div>
        </div>
      </div>
    </div>
  );
};
