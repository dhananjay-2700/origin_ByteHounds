"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, TrendingUp, Thermometer, ShieldAlert, ArrowRight, Sun, Info } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceDot } from "recharts";
import { ScrollReveal } from "./ScrollLayout";
import { API_ENDPOINTS } from "../lib/api";

interface CommandCenterProps {
  onNavigateTab: (tab: string) => void;
}

const DEFAULT_FORECAST_SERIES = [
  { time: "00:00", actual: 5420, forecast: 5380 },
  { time: "02:00", actual: 4980, forecast: 4950 },
  { time: "04:00", actual: 4710, forecast: 4680 },
  { time: "06:00", actual: 5120, forecast: 5100 },
  { time: "08:00", actual: 6150, forecast: 6200 },
  { time: "10:00", actual: 6940, forecast: 3911 },
  { time: "12:00", actual: null, forecast: 3850 },
  { time: "14:00", actual: null, forecast: 3790 },
  { time: "16:00", actual: null, forecast: 3650 },
  { time: "18:00", actual: null, forecast: 3420 },
  { time: "20:00", actual: null, forecast: 3150 },
  { time: "22:00", actual: null, forecast: 2800 },
];

export const CommandCenterView: React.FC<CommandCenterProps> = ({ onNavigateTab }) => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>(DEFAULT_FORECAST_SERIES);
  const [explanation, setExplanation] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchSafe = async (url: string) => {
          try {
            const res = await fetch(url);
            if (res.ok) return await res.json();
          } catch (e) {
            console.warn(`Fetch failed for ${url}:`, e);
          }
          return null;
        };

        const [dashData, forecastData, expData, weatherData] = await Promise.all([
          fetchSafe(API_ENDPOINTS.dashboard),
          fetchSafe(API_ENDPOINTS.forecast),
          fetchSafe(API_ENDPOINTS.explanation),
          fetchSafe(API_ENDPOINTS.weather)
        ]);

        if (dashData) setDashboard(dashData);

        if (forecastData && Array.isArray(forecastData.series) && forecastData.series.length > 0) {
          setForecast(forecastData.series.map((item: any) => ({
            time: item.timestamp || item.time,
            actual: item.actual_load ?? item.actual,
            forecast: item.predicted_load ?? item.forecast
          })));
        } else {
          setForecast(DEFAULT_FORECAST_SERIES);
        }

        if (expData) setExplanation(expData);
        if (weatherData) setWeather(weatherData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setForecast(DEFAULT_FORECAST_SERIES);
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
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* 1. TOP KPI ROW */}
      <ScrollReveal delay={100} direction="up">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: CURRENT LOAD */}
        <div className="control-card p-7 flex flex-col justify-between hover:border-white/20 transition-all shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">CURRENT LOAD</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE
              </span>
            </div>
            <div className="text-4xl lg:text-5xl font-black text-white tracking-tighter mt-1">
              {dashboard?.current_load ? Math.round(dashboard.current_load).toLocaleString() : "2,050"}{" "}
              <span className="text-base font-bold text-gray-400">MW</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-xs text-gray-400 font-medium">
            Delhi NCT Real Telemetry Dispatch
          </div>
        </div>

        {/* KPI 2: PEAK FORECAST */}
        <div className="control-card p-7 flex flex-col justify-between border-l-4 border-l-[#FF7C1E] hover:border-[#FF7C1E]/50 transition-all shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-[#FF7C1E] uppercase tracking-widest">PEAK FORECAST</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF7C1E]/10 text-[#FF7C1E] border border-[#FF7C1E]/30 text-[10px] font-bold uppercase tracking-wider">
                24H MODEL
              </span>
            </div>
            <div className="text-4xl lg:text-5xl font-black text-white tracking-tighter mt-1">
              {dashboard?.tomorrow_peak ? Math.round(dashboard.tomorrow_peak).toLocaleString() : "3,911"}{" "}
              <span className="text-base font-bold text-[#FF7C1E]">MW</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-xs text-gray-400 font-medium">
            <TrendingUp className="w-4 h-4 mr-1.5 text-[#FF7C1E]" />
            LightGBM Multi-Horizon Predictor
          </div>
        </div>

        {/* KPI 3: PEAK TIME */}
        <div className="control-card p-7 flex flex-col justify-between hover:border-white/20 transition-all shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">PEAK HORIZON</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10 text-[10px] font-bold uppercase tracking-wider">
                CRITICAL
              </span>
            </div>
            <div className="text-3xl lg:text-4xl font-black text-white tracking-tight mt-1">
              {dashboard?.peak_time || "10:00 IST"}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 text-xs text-gray-400 font-medium">
            High Concurrency Peak Period
          </div>
        </div>

        {/* KPI 4: GRID RISK */}
        <div className="control-card p-7 flex flex-col justify-between border-l-4 border-l-red-500 hover:border-red-500/50 transition-all shadow-xl bg-gradient-to-b from-red-950/20 to-transparent">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">GRID RISK</span>
              <span className="px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest">
                {dashboard?.grid_risk_level || "MODERATE"}
              </span>
            </div>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-4xl lg:text-5xl font-black text-white tracking-tighter">{dashboard?.grid_risk_score ?? "39"}</span>
              <span className="text-base text-gray-500 font-bold">/ 100</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 text-xs text-gray-400 font-medium flex items-center">
            <ShieldAlert className="w-4 h-4 mr-1.5 text-red-400" />
            Thermal &amp; Capacity Stress Index
          </div>
        </div>
        
        </div>
      </ScrollReveal>

      {/* 2. DEMAND FORECAST & CRITICAL WINDOW CHART */}
      <ScrollReveal delay={200} direction="up">
        <div className="control-card p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-[#FF7C1E]/10 text-[#FF7C1E] border border-[#FF7C1E]/30 text-[10px] font-black uppercase tracking-widest mb-2">
              PREDICTIVE POWER CURVE
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">
              24-Hour Demand Forecast (LightGBM)
            </h2>
            <p className="text-xs text-gray-400 mt-1">Real Processed Delhi Demand Curve (MW) &amp; Operational Pressure Window</p>
          </div>
          
          <div className="flex items-center gap-3 text-xs font-bold">
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-gray-800">
              <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
              <span className="text-gray-200">Actual Load</span>
            </div>
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-gray-800">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF7C1E] shadow-sm" />
              <span className="text-[#FF7C1E]">LightGBM Forecast</span>
            </div>
          </div>
        </div>

        {/* Chart area */}
        <div className="h-80 w-full">
          {forecast.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast} margin={{ top: 15, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF7C1E" stopOpacity={0.45}/>
                    <stop offset="95%" stopColor="#FF7C1E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
                <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#000000", borderColor: "#333333", borderRadius: "1rem", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)" }}
                  itemStyle={{ color: "#f3f4f6", fontSize: "12px", fontWeight: "bold" }}
                />
                
                <Area type="monotone" dataKey="actual" stroke="#ffffff" strokeWidth={2.5} fillOpacity={1} fill="url(#actualGrad)" name="Actual Load (MW)" />
                <Area type="monotone" dataKey="forecast" stroke="#FF7C1E" strokeWidth={3} fillOpacity={1} fill="url(#forecastGrad)" name="Forecasted Load (MW)" />
                
                {peakPoint && (
                  <ReferenceDot x={peakPoint.time} y={peakPoint.forecast} r={7} fill="#FF7C1E" stroke="#ffffff" strokeWidth={2.5} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm font-bold text-gray-500">
              Loading Live Model Forecast Curve...
            </div>
          )}
        </div>

        {/* Overlay Marker Bar */}
        <div className="mt-6 p-4 bg-gradient-to-r from-red-950/40 via-black to-black border border-red-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-2.5 text-gray-300 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Critical Pressure Window: {dashboard?.critical_window || "08:00 — 19:00"}</span>
          </div>
          <div className="flex items-center space-x-3 text-white font-bold">
            <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase">
              ▲ PEAK: {dashboard?.tomorrow_peak ? Math.round(dashboard.tomorrow_peak).toLocaleString() : "3,911"} MW
            </span>
            <span className="text-gray-400">at {dashboard?.peak_time || "10:00 IST"}</span>
          </div>
        </div>
        </div>
      </ScrollReveal>

      {/* 3. HERO CARDS: NEXT RISK, EXPLAINABILITY & WEATHER INTELLIGENCE */}
      <ScrollReveal delay={300} direction="up">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD A: THE NEXT RISK */}
        <div className="control-card p-7 flex flex-col justify-between border-l-4 border-l-red-500 bg-gradient-to-b from-red-950/30 via-[#12141a] to-[#12141a] shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-4 mb-5">
              <span className="text-xs font-black text-gray-400 tracking-widest flex items-center uppercase">
                <AlertTriangle className="w-4 h-4 mr-1.5 text-red-400" />
                NEXT CRITICAL WINDOW
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-red-600 text-white font-black uppercase tracking-wider">
                {dashboard?.grid_risk_level || "HIGH"}
              </span>
            </div>

            <div className="text-2xl font-black text-white tracking-tight">Next 24h Window</div>
            <div className="text-sm font-bold text-[#FF7C1E] mt-1 mb-5">{dashboard?.critical_window || "08:00 — 19:00"}</div>

            <div className="space-y-3 text-xs border-t border-b border-gray-800/80 py-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Peak Demand</span>
                <span className="text-white font-black">{dashboard?.tomorrow_peak ? Math.round(dashboard.tomorrow_peak).toLocaleString() : "3,911"} MW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Grid Risk Score</span>
                <span className="text-red-400 font-black">{dashboard?.grid_risk_score ?? "39"} / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Model Algorithm</span>
                <span className="text-gray-200 font-bold">LightGBM Multi-Horizon</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Forecast Temp</span>
                <span className="text-gray-200 font-bold">🌡 {weather?.temperature ?? "14.0"}°C</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("grid-risk")}
            className="w-full py-4 px-6 rounded-full bg-[#FF7C1E] text-black hover:bg-orange-500 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center space-x-2 shadow-xl cursor-pointer"
          >
            <span>Explore Risk Analysis</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* CARD B: WHY IS DEMAND INCREASING? (SHAP Explainability) */}
        <div className="control-card p-7 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-4 mb-5">
              <span className="text-xs font-black text-gray-400 tracking-widest flex items-center uppercase">
                <Info className="w-4 h-4 mr-1.5 text-cyan-400" />
                DEMAND DRIVERS (SHAP)
              </span>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 font-bold uppercase tracking-wider">
                FEATURE ATTRIBUTION
              </span>
            </div>

            {/* Feature Bars */}
            <div className="space-y-4 mb-6">
              {explanation?.shap_drivers ? explanation.shap_drivers.slice(0, 4).map((driver: any, index: number) => {
                const width = driver.percentage;
                return (
                  <div key={index}>
                    <div className="flex justify-between text-xs mb-1.5 font-bold">
                      <span className="text-gray-300">{driver.feature}</span>
                      <span className="text-[#FF7C1E]">+{driver.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-900 h-2.5 rounded-full overflow-hidden border border-gray-800">
                      <div className="bg-gradient-to-r from-[#FF7C1E] to-amber-400 h-full rounded-full" style={{ width: `${Math.min(100, width)}%` }} />
                    </div>
                  </div>
                );
              }) : (
                <div className="text-xs text-gray-500">Loading Feature Importances...</div>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-300 bg-black/60 p-4 rounded-2xl border border-gray-800 leading-relaxed font-medium">
            "{explanation?.summary || 'LightGBM model attributes the projected peak primarily to recent 12h demand momentum, diurnal timing, and cooling load.'}"
          </p>
        </div>

        {/* CARD C: WEATHER INTELLIGENCE */}
        <div className="control-card p-7 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-4 mb-5">
              <span className="text-xs font-black text-gray-400 tracking-widest flex items-center uppercase">
                <Sun className="w-4 h-4 mr-1.5 text-[#FF7C1E]" />
                WEATHER INTELLIGENCE
              </span>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#FF7C1E]/10 text-[#FF7C1E] border border-[#FF7C1E]/30 font-bold uppercase tracking-wider">
                OPEN-METEO
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-5">
              <div>
                <div className="text-4xl lg:text-5xl font-black text-white tracking-tighter">{weather?.temperature ?? "14.0"}°C</div>
                <div className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{weather?.condition || "High Seasonal Temp"}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Humidity</div>
                <div className="text-xl font-black text-white mt-1">{weather?.humidity ?? "54"}%</div>
              </div>
            </div>

            <div className="p-4 bg-black/60 border border-gray-800 rounded-2xl mb-6 text-xs">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Demand Impact</span>
                <span className="text-[#FF7C1E] font-black">{weather?.demand_impact || "↑ HIGH"}</span>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed font-medium">
                "{weather?.summary || 'Ambient temperature directly increases cooling-driven electricity demand across Delhi NCT.'}"
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("forecast")}
            className="w-full py-4 px-6 rounded-full bg-white text-black hover:bg-gray-200 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center space-x-2 shadow-xl cursor-pointer"
          >
            <span>Temperature vs Demand</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        </div>
      </ScrollReveal>
    </div>
  );
};

