"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, TrendingUp, Thermometer, ShieldAlert, ArrowRight, Sun, Info } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceDot } from "recharts";
import { ScrollReveal } from "./ScrollLayout";

interface CommandCenterProps {
  onNavigateTab: (tab: string) => void;
}

export const CommandCenterView: React.FC<CommandCenterProps> = ({ onNavigateTab }) => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [explanation, setExplanation] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, forecastRes, expRes, weatherRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/dashboard"),
          fetch("http://127.0.0.1:8000/api/forecast"),
          fetch("http://127.0.0.1:8000/api/explanation"),
          fetch("http://127.0.0.1:8000/api/weather")
        ]);
        const dashData = await dashRes.json();
        const forecastData = await forecastRes.json();
        const expData = await expRes.json();
        const weatherData = await weatherRes.json();

        setDashboard(dashData);
        setForecast(forecastData.series.map((item: any) => ({
          time: item.timestamp,
          actual: item.actual_load,
          forecast: item.predicted_load
        })));
        setExplanation(expData);
        setWeather(weatherData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const peakPoint = forecast.length > 0 
    ? forecast.reduce((max, pt) => ((pt.forecast || 0) > (max?.forecast || 0) ? pt : max), forecast[0])
    : null;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. TOP KPI ROW */}
      <ScrollReveal delay={100} direction="up">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="control-card p-5 border-l-4 border-gray-600 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">CURRENT LOAD</span>
            <div className="text-3xl font-extrabold text-white font-mono mt-1">
              {dashboard?.current_load ? Math.round(dashboard.current_load).toLocaleString() : "--"} <span className="text-sm font-normal text-gray-400">MW</span>
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-gray-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-2" />
            Live Delhi Telemetry Dataset
          </div>
        </div>

        {/* KPI 2 */}
        <div className="control-card p-5 border-l-4 border-gray-600 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">PEAK FORECAST</span>
            <div className="text-3xl font-extrabold text-gray-200 font-mono mt-1">
              {dashboard?.tomorrow_peak ? Math.round(dashboard.tomorrow_peak).toLocaleString() : "--"} <span className="text-sm font-normal text-gray-400">MW</span>
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-gray-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            LightGBM 24h Model Output
          </div>
        </div>

        {/* KPI 3 */}
        <div className="control-card p-5 border-l-4 border-gray-600 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">PEAK TIME</span>
            <div className="text-3xl font-extrabold text-white font-mono mt-1">
              {dashboard?.peak_time || "--"}
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400 font-semibold font-mono">
            Forecast Horizon (Next 24h)
          </div>
        </div>

        {/* KPI 4 */}
        <div className="control-card p-5 border-l-4 border-gray-600 glow-high flex flex-col justify-between bg-gray-800/20">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">GRID RISK</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-extrabold text-gray-200 font-mono">{dashboard?.grid_risk_score ?? "--"}</span>
              <span className="text-sm text-gray-400 font-mono">/ 100</span>
              <span className="px-2 py-0.5 rounded bg-gray-800/40 text-rose-400 text-xs font-bold border border-rose-500/40 uppercase ml-auto">
                {dashboard?.grid_risk_level || "CALCULATING"}
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400/80 font-medium flex items-center">
            <ShieldAlert className="w-3.5 h-3.5 mr-1 text-gray-400" />
            Actionable Grid Stress Index
          </div>
        </div>
        </div>
      </ScrollReveal>

      {/* 2. DEMAND FORECAST & CRITICAL WINDOW CHART */}
      <ScrollReveal delay={200} direction="up">
        <div className="control-card p-6 border border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-white font-mono flex items-center space-x-2">
              <span>24-HOUR DEMAND FORECAST (LIGHTGBM MODEL)</span>
            </h2>
            <p className="text-xs text-gray-400">Real Processed Delhi Demand Curve (MW) & Model Pressure Window</p>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-cyan-400" />
              <span className="text-gray-300">Actual Load</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-amber-400" />
              <span className="text-gray-300">LightGBM Model Prediction</span>
            </div>
          </div>
        </div>

        {/* Chart area */}
        <div className="h-72 w-full">
          {forecast.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast} margin={{ top: 15, right: 20, left: 0, bottom: 0 }}>
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
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "0.5rem" }}
                  itemStyle={{ color: "#f3f4f6", fontSize: "12px" }}
                />
                
                <Area type="monotone" dataKey="actual" stroke="#22d3ee" strokeWidth={2.5} fillOpacity={1} fill="url(#actualGrad)" name="Actual Load (MW)" />
                <Area type="monotone" dataKey="forecast" stroke="#fbbf24" strokeWidth={2.5} fillOpacity={1} fill="url(#forecastGrad)" name="Forecasted Load (MW)" />
                
                {peakPoint && (
                  <ReferenceDot x={peakPoint.time} y={peakPoint.forecast} r={6} fill="#f43f5e" stroke="#ffffff" strokeWidth={2} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm font-mono text-gray-500">
              Loading Live Model Forecast Curve...
            </div>
          )}
        </div>

        {/* Overlay Marker Bar */}
        <div className="mt-4 p-3 bg-gray-800/30 border border-rose-500/30 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-gray-400 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>🔴 Critical Window Identified: {dashboard?.critical_window || "Calculating..."}</span>
          </div>
          <div className="flex items-center space-x-2 font-mono text-white">
            <span className="text-gray-300 font-bold">▲ PEAK: {dashboard?.tomorrow_peak ? Math.round(dashboard.tomorrow_peak).toLocaleString() : "--"} MW</span>
            <span className="text-gray-400">at {dashboard?.peak_time || "--"}</span>
          </div>
        </div>
        </div>
      </ScrollReveal>

      {/* 3. HERO CARDS: NEXT RISK, EXPLAINABILITY & WEATHER INTELLIGENCE */}
      <ScrollReveal delay={300} direction="up">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD A: THE NEXT RISK */}
        <div className="control-card p-5 border-l-4 border-gray-600 flex flex-col justify-between bg-gradient-to-b from-rose-950/20 to-transparent">
          <div>
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
              <span className="text-xs font-bold text-gray-400 tracking-wider flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1.5" />
                ⚠ NEXT CRITICAL WINDOW
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-800/20 text-rose-400 font-mono font-bold border border-rose-500/30">
                {dashboard?.grid_risk_level || "HIGH"}
              </span>
            </div>

            <div className="text-xl font-bold text-white font-mono">Next 24h Window</div>
            <div className="text-sm font-semibold text-gray-400 font-mono mb-4">{dashboard?.critical_window || "--"}</div>

            <div className="space-y-2 text-xs border-t border-b border-gray-800/80 py-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Peak Demand</span>
                <span className="text-white font-bold font-mono">{dashboard?.tomorrow_peak ? Math.round(dashboard.tomorrow_peak).toLocaleString() : "--"} MW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Grid Risk Score</span>
                <span className="text-gray-300 font-bold font-mono">{dashboard?.grid_risk_score ?? "--"} / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Model Algorithm</span>
                <span className="text-gray-300 font-bold font-mono">LightGBM Multi-Horizon</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Forecast Temp</span>
                <span className="text-gray-300 font-bold font-mono">🌡 {weather?.temperature ?? "--"}°C</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("grid-risk")}
            className="w-full py-2 px-3 rounded-lg bg-gray-800/20 border border-rose-500/40 text-gray-300 hover:bg-gray-800/30 transition text-xs font-bold flex items-center justify-center space-x-2"
          >
            <span>View Risk Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* CARD B: WHY IS DEMAND INCREASING? (SHAP Explainability) */}
        <div className="control-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
              <span className="text-xs font-bold text-gray-400 tracking-wider flex items-center">
                <Info className="w-4 h-4 mr-1.5" />
                WHY IS DEMAND INCREASING?
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-cyan-400 border border-cyan-500/20 font-mono">
                Feature Importance
              </span>
            </div>

            {/* Feature Bars */}
            <div className="space-y-3 mb-4">
              {explanation?.shap_drivers ? explanation.shap_drivers.slice(0, 4).map((driver: any, index: number) => {
                const width = driver.percentage;
                return (
                  <div key={index}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300 font-medium">{driver.feature}</span>
                      <span className="text-cyan-400 font-mono font-bold">+{driver.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${Math.min(100, width)}%` }} />
                    </div>
                  </div>
                );
              }) : (
                <div className="text-xs text-gray-500 font-mono">Loading Feature Importances...</div>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-300 bg-gray-900/60 p-3 rounded-lg border border-gray-800 italic leading-relaxed">
            "{explanation?.summary || 'Loading LightGBM model feature attributions...'}"
          </p>
        </div>

        {/* CARD C: WEATHER INTELLIGENCE */}
        <div className="control-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
              <span className="text-xs font-bold text-gray-400 tracking-wider flex items-center">
                <Sun className="w-4 h-4 mr-1.5" />
                WEATHER INTELLIGENCE
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-amber-400 border border-amber-500/20 font-mono">
                Open-Meteo Dataset
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-4">
              <div>
                <div className="text-3xl font-extrabold text-white font-mono">{weather?.temperature ?? "--"}°C</div>
                <div className="text-xs font-semibold text-gray-400">{weather?.condition || "Live Stream"}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Humidity</div>
                <div className="text-sm font-bold text-gray-200 font-mono">{weather?.humidity ?? "--"}%</div>
              </div>
            </div>

            <div className="p-3 bg-gray-800/30 border border-amber-500/30 rounded-lg mb-4 text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-300">Demand Impact</span>
                <span className="text-amber-400 font-bold font-mono">{weather?.demand_impact || "--"}</span>
              </div>
              <p className="text-gray-300 text-[11px]">
                "{weather?.summary || 'Weather impact correlation loaded from dataset.'}"
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
      </ScrollReveal>
    </div>
  );
};

