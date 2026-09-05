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
        const rawSeries = forecastData?.points || forecastData?.series || (Array.isArray(forecastData) ? forecastData : []);
        setForecast(rawSeries.map((item: any) => ({
          time: item.time || item.timestamp,
          actual: item.historical ?? item.actual_load,
          forecast: item.predicted ?? item.predicted_load
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* KPI 1 */}
          <div className="control-card p-6 border-l-4 border-blue-600 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">CURRENT LOAD</span>
              <div className="text-3xl font-extrabold text-gray-900 font-sans mt-1">
                {dashboard?.current_load ? Math.round(dashboard.current_load).toLocaleString() : "--"} <span className="text-sm font-semibold text-gray-500">MW</span>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-gray-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
              Live Delhi Telemetry Dataset
            </div>
          </div>

          {/* KPI 2 */}
          <div className="control-card p-6 border-l-4 border-indigo-600 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">PEAK FORECAST</span>
              <div className="text-3xl font-extrabold text-gray-900 font-sans mt-1">
                {dashboard?.tomorrow_peak ? Math.round(dashboard.tomorrow_peak).toLocaleString() : "--"} <span className="text-sm font-semibold text-gray-500">MW</span>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-gray-500 font-medium">
              <TrendingUp className="w-4 h-4 mr-1 text-blue-600" />
              LightGBM 24h Model Output
            </div>
          </div>

          {/* KPI 3 */}
          <div className="control-card p-6 border-l-4 border-purple-600 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">PEAK TIME</span>
              <div className="text-3xl font-extrabold text-gray-900 font-sans mt-1">
                {dashboard?.peak_time || "--"}
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 font-medium">
              Forecast Horizon (Next 24h)
            </div>
          </div>

          {/* KPI 4 */}
          <div className="control-card p-6 border-l-4 border-orange-500 flex flex-col justify-between bg-orange-50/20">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">GRID RISK</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-gray-900 font-sans">{dashboard?.grid_risk_score ?? "--"}</span>
                <span className="text-sm text-gray-500 font-medium">/ 100</span>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200 uppercase ml-auto">
                  {dashboard?.grid_risk_level || "CALCULATING"}
                </span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 font-medium flex items-center">
              <ShieldAlert className="w-4 h-4 mr-1 text-orange-600" />
              Actionable Grid Stress Index
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 2. DEMAND FORECAST & CRITICAL WINDOW CHART */}
      <ScrollReveal delay={200} direction="up">
        <div className="control-card p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center space-x-2">
                <span>24-HOUR DEMAND FORECAST (LIGHTGBM MODEL)</span>
              </h2>
              <p className="text-xs text-gray-500">Real Processed Delhi Demand Curve (MW) & Model Pressure Window</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-semibold">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-gray-700">Actual Load</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-gray-700">LightGBM Model Prediction</span>
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
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "0.75rem", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                    itemStyle={{ color: "#0f172a", fontSize: "12px", fontWeight: "600" }}
                  />
                  
                  <Area type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#actualGrad)" name="Actual Load (MW)" />
                  <Area type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#forecastGrad)" name="Forecasted Load (MW)" />
                  
                  {peakPoint && (
                    <ReferenceDot x={peakPoint.time} y={peakPoint.forecast} r={6} fill="#ef4444" stroke="#ffffff" strokeWidth={2} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm font-semibold text-gray-400">
                Loading Live Model Forecast Curve...
              </div>
            )}
          </div>

          {/* Overlay Marker Bar */}
          <div className="mt-6 p-4 bg-orange-50/80 border border-orange-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-orange-900 font-semibold">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span>Critical Window Identified: {dashboard?.critical_window || "Calculating..."}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-900 font-bold">
              <span className="text-orange-700">▲ PEAK: {dashboard?.tomorrow_peak ? Math.round(dashboard.tomorrow_peak).toLocaleString() : "--"} MW</span>
              <span className="text-gray-500 font-normal">at {dashboard?.peak_time || "--"}</span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 3. HERO CARDS: NEXT RISK, EXPLAINABILITY & WEATHER INTELLIGENCE */}
      <ScrollReveal delay={300} direction="up">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CARD A: THE NEXT RISK */}
          <div className="control-card p-6 border-l-4 border-red-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <span className="text-xs font-bold text-gray-500 tracking-wider flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1.5 text-red-500" />
                  NEXT CRITICAL WINDOW
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-bold border border-red-200">
                  {dashboard?.grid_risk_level || "HIGH"}
                </span>
              </div>

              <div className="text-xl font-bold text-gray-900">Next 24h Window</div>
              <div className="text-sm font-semibold text-gray-600 mb-4">{dashboard?.critical_window || "--"}</div>

              <div className="space-y-2.5 text-xs border-t border-b border-gray-100 py-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Peak Demand</span>
                  <span className="text-gray-900 font-bold">{dashboard?.tomorrow_peak ? Math.round(dashboard.tomorrow_peak).toLocaleString() : "--"} MW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Grid Risk Score</span>
                  <span className="text-gray-900 font-bold">{dashboard?.grid_risk_score ?? "--"} / 100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Model Algorithm</span>
                  <span className="text-gray-900 font-bold">LightGBM Multi-Horizon</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Forecast Temp</span>
                  <span className="text-gray-900 font-bold">🌡 {weather?.temperature ?? "--"}°C</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab("grid-risk")}
              className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white transition text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
            >
              <span>View Risk Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* CARD B: WHY IS DEMAND INCREASING? (SHAP Explainability) */}
          <div className="control-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <span className="text-xs font-bold text-gray-500 tracking-wider flex items-center">
                  <Info className="w-4 h-4 mr-1.5 text-blue-600" />
                  WHY IS DEMAND INCREASING?
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  Feature Importance
                </span>
              </div>

              {/* Feature Bars */}
              <div className="space-y-3.5 mb-4">
                {explanation?.shap_drivers ? explanation.shap_drivers.slice(0, 4).map((driver: any, index: number) => {
                  const width = driver.percentage;
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 font-semibold">{driver.feature}</span>
                        <span className="text-blue-600 font-bold">+{driver.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, width)}%` }} />
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-xs text-gray-400 font-medium">Loading Feature Importances...</div>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 italic leading-relaxed">
              "{explanation?.summary || 'Loading LightGBM model feature attributions...'}"
            </p>
          </div>

          {/* CARD C: WEATHER INTELLIGENCE */}
          <div className="control-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <span className="text-xs font-bold text-gray-500 tracking-wider flex items-center">
                  <Sun className="w-4 h-4 mr-1.5 text-amber-500" />
                  WEATHER INTELLIGENCE
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                  Open-Meteo Dataset
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <div className="text-3xl font-extrabold text-gray-900">{weather?.temperature ?? "--"}°C</div>
                  <div className="text-xs font-semibold text-gray-500 mt-0.5">{weather?.condition || "Live Stream"}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 font-medium">Humidity</div>
                  <div className="text-sm font-bold text-gray-800">{weather?.humidity ?? "--"}%</div>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl mb-4 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-700 font-semibold">Demand Impact</span>
                  <span className="text-amber-800 font-bold">{weather?.demand_impact || "--"}</span>
                </div>
                <p className="text-gray-600 text-xs">
                  "{weather?.summary || 'Weather impact correlation loaded from dataset.'}"
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab("forecast")}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span>View Temperature vs Demand</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </ScrollReveal>
    </div>
  );
};

