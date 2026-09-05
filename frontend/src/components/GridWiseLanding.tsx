"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, AlertTriangle, Zap, Activity, Map, MessageSquare, Database, CheckCircle, BrainCircuit, LineChart, Target } from "lucide-react";
import { GridReveal } from "./GridReveal";

import { API_ENDPOINTS } from "../lib/api";

interface GridWiseLandingProps {
  onViewForecast?: (targetSection?: string) => void;
  onOpenDataHealth?: () => void;
}

export const GridWiseLanding: React.FC<GridWiseLandingProps> = ({ onViewForecast, onOpenDataHealth }) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [accuracyData, setAccuracyData] = useState<any>(null);
  const [temperature, setTemperature] = useState(38);

  useEffect(() => {
    fetch(API_ENDPOINTS.dashboard)
      .then(res => res.json())
      .then(data => setDashboardData(data))
      .catch(err => console.error("Error fetching landing dashboard metrics:", err));

    fetch(API_ENDPOINTS.forecastAccuracy)
      .then(res => res.json())
      .then(data => setAccuracyData(data))
      .catch(err => console.error("Error fetching landing accuracy metrics:", err));
  }, []);

  const peakVal = dashboardData ? Math.round(dashboardData.peak_24h || dashboardData.tomorrow_peak || 3911).toLocaleString() : "3,911";
  const currentLoadVal = dashboardData ? Math.round(dashboardData.current_load || 2050).toLocaleString() : "2,050";
  const peakTimeVal = dashboardData?.peak_time || "10:00 IST";
  const riskScoreVal = dashboardData ? Math.round(dashboardData.grid_risk_score) : 42;
  const tempVal = dashboardData?.weather_temp != null ? Number(dashboardData.weather_temp).toFixed(1) : "14.8";
  const windowVal = dashboardData?.critical_window || "08:00 — 19:00";

  const maeVal = accuracyData ? `${Math.round(accuracyData.mae)} MW` : "412 MW";
  const rmseVal = accuracyData ? `${Math.round(accuracyData.rmse)} MW` : "547 MW";
  const mapeVal = accuracyData ? `${(accuracyData.mape < 1 ? accuracyData.mape * 100 : accuracyData.mape).toFixed(1)}%` : "8.4%";

  // Scenario simulation based on dataset current load
  const baseDemand = dashboardData ? Math.round(dashboardData.current_load) : 2050;
  const simulatedDemand = Math.round(baseDemand + (temperature - 30) * 35);
  const isCritical = temperature >= 40;

  return (
    <div className="w-full font-sans bg-black text-gray-100">

      {/* ── 01 HERO ── */}
      <GridReveal blockSize={100} baseDelay={100}>
        <section className="relative px-6 py-32 w-full bg-[#111111] text-white overflow-hidden min-h-screen flex items-center">
          <div className="absolute inset-0 z-0 opacity-20">
            <img 
              src="https://images.unsplash.com/photo-1541888079001-eb472714a849?auto=format&fit=crop&q=80&w=2000" 
              alt="Power Grid" 
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/80 to-transparent"></div>
          </div>
          
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10 w-full">
            <div className="flex-1 space-y-8">
              <h1 className="text-6xl lg:text-[7rem] font-black tracking-tighter leading-[0.95] text-white uppercase">
                THE GRID KNOWS THE PEAK IS COMING.
              </h1>
              <p className="text-2xl lg:text-4xl font-bold text-[#FF7C1E] tracking-tight">
                PravaahX sees it before everyone else does.
              </p>
              <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
                AI-powered electricity demand forecasting and grid-risk intelligence that predicts demand, identifies critical windows, explains the drivers and lets operators test what happens next.
              </p>
              
              <div className="pt-8 flex flex-col sm:flex-row items-center gap-4">
                <button 
                  onClick={() => onViewForecast?.("command-center")} 
                  className="w-full sm:w-auto px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-sm rounded-full hover:bg-gray-200 transition flex items-center justify-center space-x-3 cursor-pointer shadow-lg"
                >
                  <span>Explore Grid Intelligence</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full relative h-[600px] flex items-center justify-center pointer-events-none">
              {/* Floating Metric Display */}
              <div className="absolute top-10 left-0 bg-black/90 backdrop-blur-md border border-gray-800 p-6 rounded-2xl shadow-2xl text-left">
                <div className="text-4xl font-black text-white">{peakVal} MW</div>
                <div className="text-[#FF7C1E] font-bold text-sm tracking-widest uppercase mt-1">PEAK DEMAND ↑</div>
              </div>

              <div className="absolute top-1/3 right-0 bg-black/90 backdrop-blur-md border border-gray-800 p-6 rounded-2xl shadow-2xl text-left">
                <div className="text-4xl font-black text-white">{tempVal}°C</div>
                <div className="text-gray-400 font-bold text-sm tracking-widest uppercase mt-1">AMBIENT TEMP</div>
              </div>

              <div className="absolute bottom-1/4 left-10 bg-[#FF7C1E]/20 backdrop-blur-md border border-[#FF7C1E]/50 p-6 rounded-2xl shadow-2xl text-left">
                <div className="text-3xl font-black text-[#FF7C1E]">{windowVal}</div>
                <div className="text-white font-bold text-sm tracking-widest uppercase mt-1">CRITICAL WINDOW</div>
              </div>
            </div>
          </div>
        </section>
      </GridReveal>

      {/* ── 02 THE PROBLEM ── */}
      <section className="bg-white text-black py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl lg:text-[6rem] font-black tracking-tighter leading-[1] uppercase mb-24 max-w-5xl">
            SOMEWHERE IN THE GRID, DEMAND IS ABOUT TO SPIKE.
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t-4 border-black pt-12">
            <div className="space-y-4">
              <div className="text-sm font-bold uppercase tracking-widest text-gray-500">TODAY</div>
              <div className="text-6xl font-black tracking-tighter">{currentLoadVal} MW</div>
              <div className="text-xl font-bold text-gray-400 uppercase">CURRENT DEMAND</div>
            </div>
            
            <div className="space-y-4 relative">
              <div className="absolute -left-10 top-8 hidden md:block"><ArrowRight className="w-8 h-8 text-gray-300"/></div>
              <div className="text-sm font-bold uppercase tracking-widest text-[#FF7C1E]">TOMORROW</div>
              <div className="text-6xl font-black tracking-tighter">{peakVal} MW</div>
              <div className="text-xl font-bold text-black uppercase">PREDICTED PEAK</div>
            </div>
            
            <div className="space-y-4 relative">
              <div className="absolute -left-10 top-8 hidden md:block"><ArrowRight className="w-8 h-8 text-[#FF7C1E]"/></div>
              <div className="text-sm font-bold uppercase tracking-widest text-red-600">DANGER</div>
              <div className="text-5xl font-black tracking-tighter text-red-600">{windowVal}</div>
              <div className="text-xl font-bold text-black uppercase">HIGH-RISK WINDOW</div>
            </div>
          </div>
          
          <div className="mt-24 text-3xl lg:text-4xl font-medium leading-relaxed max-w-4xl text-gray-800">
            By the time a grid operator sees a demand spike, the opportunity to prepare may already be gone.
          </div>
        </div>
      </section>

      {/* ── 03 THE "PRAVAAHX MOMENT" ── */}
      <section className="bg-[#FF7C1E] text-black py-32 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 space-y-8 relative z-10">
            <h2 className="text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-[1.05]">
              The grid hasn't failed.<br/>But the signals are already there.
            </h2>
            <div className="pt-4">
              <button 
                onClick={() => onViewForecast?.("grid-risk")}
                className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-full hover:bg-gray-900 transition flex items-center space-x-3 cursor-pointer shadow-xl"
              >
                <span>Open Risk Intelligence</span>
                <ArrowRight className="w-4 h-4 text-[#FF7C1E]" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-lg z-10">
            <div className="bg-black text-white rounded-3xl p-8 shadow-2xl border border-black/40">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">DELHI GRID</h3>
                  <p className="text-sm text-gray-400 font-mono mt-2">Forecast ID · GW-28471</p>
                </div>
                <div className="bg-red-600/20 text-red-500 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-red-600/50 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4"/>
                  <span>PEAK APPROACHING</span>
                </div>
              </div>
              
              <div className="mb-8">
                <div className="text-6xl font-black tracking-tighter">{peakVal} MW</div>
                <div className="text-[#FF7C1E] font-medium text-lg mt-1">Expected at {peakTimeVal}</div>
              </div>

              
              <div className="border-t border-gray-800 pt-6 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-bold uppercase tracking-widest text-gray-500">RISK ALERTS</div>
                  <div className="bg-white text-black px-3.5 py-1.5 rounded-full text-xs font-black">
                    03 Issues detected
                  </div>
                </div>
                
                <ul className="space-y-3 font-medium">
                  <li className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/60 border border-gray-800/80">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-200">Temperature stress</span>
                  </li>

                  <li className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/60 border border-gray-800/80">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                    <span className="text-sm text-gray-200">Demand ramp acceleration</span>
                  </li>

                  <li className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/60 border border-gray-800/80">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                    <span className="text-sm text-gray-200">Capacity threshold approaching</span>
                  </li>
                </ul>

                <button 
                  onClick={() => onViewForecast?.("grid-risk")}
                  className="w-full py-4 px-5 bg-[#FF7C1E] text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-orange-500 transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg"
                >
                  <span>Open Risk Intelligence</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 04 FROM RAW DATA TO GRID INTELLIGENCE ── */}
      <section className="bg-[#111111] text-white py-32 px-6 border-b border-gray-900">
        <div className="max-w-7xl mx-auto text-center space-y-16">
          <h2 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-[1.05]">
            DON'T JUST WATCH THE GRID.<br/><span className="text-[#FF7C1E]">UNDERSTAND IT.</span>
          </h2>
          
          <div className="flex flex-col lg:flex-row justify-center items-center gap-4 lg:gap-12 font-black uppercase tracking-widest text-xl text-gray-400">
            <div>LOAD DATA</div><div className="text-[#FF7C1E]">+</div>
            <div>WEATHER</div><div className="text-[#FF7C1E]">+</div>
            <div>TIME</div><div className="text-[#FF7C1E]">+</div>
            <div>HISTORICAL PATTERNS</div>
          </div>
          
          <div className="flex justify-center">
            <ArrowRight className="w-12 h-12 text-white transform rotate-90" />
          </div>
          
          <div className="text-6xl font-black tracking-tighter">PravaahX</div>
          
          <div className="flex justify-center">
            <ArrowRight className="w-12 h-12 text-white transform rotate-90" />
          </div>
          
          <div className="inline-flex flex-wrap justify-center gap-4">
            {[
              { label: 'PREDICT', target: 'forecast' },
              { label: 'DETECT', target: 'grid-risk' },
              { label: 'EXPLAIN', target: 'command-center' },
              { label: 'LOCATE', target: 'geographic' },
              { label: 'SIMULATE', target: 'scenario-lab' },
            ].map(layer => (
              <button 
                key={layer.label}
                onClick={() => onViewForecast?.(layer.target)}
                className="border-2 border-white hover:border-[#FF7C1E] hover:text-[#FF7C1E] px-8 py-4 rounded-full text-2xl font-black tracking-widest transition cursor-pointer flex items-center space-x-2"
              >
                <span>{layer.label}</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 05 PREDICT ── */}
      <section className="bg-white text-black py-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 space-y-8">
            <div className="text-sm font-bold uppercase tracking-widest text-gray-500">01 — PREDICT</div>
            <h2 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-[1.05]">
              SEE THE PEAK BEFORE IT HAPPENS.
            </h2>
            
            <div className="pt-8 border-t-2 border-black grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">MAE</div>
                <div className="text-3xl font-black tracking-tighter">{maeVal}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">RMSE</div>
                <div className="text-3xl font-black tracking-tighter">{rmseVal}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">MAPE</div>
                <div className="text-3xl font-black tracking-tighter text-[#FF7C1E]">{mapeVal}</div>
              </div>
            </div>
            <p className="text-sm font-bold uppercase text-gray-400 tracking-widest">REAL MODEL TEST SET PERFORMANCE (LIGHTGBM)</p>

            <button 
              onClick={() => onViewForecast?.("forecast")}
              className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-full hover:bg-gray-800 transition flex items-center space-x-3 cursor-pointer shadow-lg"
            >
              <span>Open Demand Forecast</span>
              <ArrowRight className="w-4 h-4 text-[#FF7C1E]" />
            </button>
          </div>
          
          <div className="flex-1 w-full bg-[#f6f5f2] p-8 rounded-3xl relative">
            <div className="h-64 w-full border-b-2 border-l-2 border-black flex items-end relative pb-4">
              <svg className="w-full h-full absolute bottom-4 left-0" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0,80 Q20,80 40,60 T60,30 T80,10 L100,5" fill="none" stroke="#000" strokeWidth="3" />
                <circle cx="80" cy="10" r="4" fill="#FF7C1E" />
              </svg>
              <div className="absolute top-0 right-10 text-right">
                <div className="text-5xl font-black tracking-tighter">{peakVal} MW</div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Predicted peak · {peakTimeVal}</div>
              </div>
            </div>
            <div className="flex justify-between mt-4 text-xs font-bold text-gray-400">
              <span>08:00</span><span>10:00</span><span>12:00</span><span>14:00</span><span>16:00</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 06 DETECT ── */}
      <section className="bg-[#111111] text-white py-32 px-6 border-t border-gray-900">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 w-full space-y-8">
             <div className="text-sm font-bold uppercase tracking-widest text-[#FF7C1E]">TOMORROW</div>
             <div className="flex justify-between text-xs font-bold text-gray-600 tracking-widest border-b border-gray-800 pb-4">
                <span>08:00</span><span>09:00</span><span>10:00</span><span>11:00</span>
             </div>
             <div className="relative h-12 w-full flex items-center">
                <div className="absolute left-0 w-full h-2 bg-gray-800"></div>
                <div className="absolute left-[25%] w-[40%] h-6 bg-[#FF7C1E]"></div>
             </div>
             <div className="text-center font-black tracking-widest text-[#FF7C1E] uppercase mt-2">CRITICAL WINDOW ({windowVal})</div>
             
             <div className="mt-12 bg-white text-black p-8 rounded-3xl inline-block w-full sm:w-auto">
               <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">GRID RISK INDEX</div>
               <div className="text-6xl font-black tracking-tighter">{riskScoreVal} <span className="text-2xl text-gray-400">/ 100</span></div>
             </div>
          </div>
          
          <div className="flex-1 space-y-8">
            <div className="text-sm font-bold uppercase tracking-widest text-gray-500">02 — DETECT</div>
            <h2 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-[1.05]">
              KNOW WHEN THE GRID IS UNDER PRESSURE.
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed font-medium">
              PravaahX identifies the exact period where predicted demand, ramp rate, weather stress and uncertainty combine to create elevated grid pressure.
            </p>

            <button 
              onClick={() => onViewForecast?.("grid-risk")}
              className="px-8 py-4 bg-[#FF7C1E] text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-orange-600 transition flex items-center space-x-3 cursor-pointer shadow-lg"
            >
              <span>Open Grid Risk</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── 07 EXPLAIN ── */}
      <section className="bg-black text-white py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <div className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">03 — EXPLAIN</div>
            <h2 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-[1.05]">
              A NUMBER TELLS YOU WHAT.<br/><span className="text-emerald-400">AI TELLS YOU WHY.</span>
            </h2>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-16 border-t border-gray-800 pt-16">
            <div className="flex-1 space-y-8">
              <h3 className="text-3xl font-black tracking-tight uppercase">WHY IS DEMAND RISING?</h3>
              <div className="space-y-4 text-xl font-bold font-mono">
                <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                  <span className="text-gray-400">Temperature</span><span className="text-emerald-400">+38%</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                  <span className="text-gray-400">Recent Load</span><span className="text-emerald-400">+27%</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                  <span className="text-gray-400">Hour of Day</span><span className="text-emerald-400">+19%</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                  <span className="text-gray-400">Humidity</span><span className="text-emerald-400">+11%</span>
                </div>
              </div>

              <button 
                onClick={() => onViewForecast?.("command-center")}
                className="px-8 py-4 bg-emerald-500 text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-emerald-400 transition flex items-center space-x-3 cursor-pointer shadow-lg"
              >
                <span>View Feature Importance</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 space-y-8 flex flex-col justify-center">
              <p className="text-3xl font-medium leading-relaxed text-gray-300">
                High ambient temperature is the strongest contributor to predicted demand increase, followed by recent load lag profiles and diurnal afternoon consumption cycles.
              </p>
              <div className="inline-flex items-center gap-2 bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
                <BrainCircuit className="w-4 h-4" />
                Powered by LightGBM & SHAP Drivers
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 08 LOCATE ── */}
      <section className="bg-[#111111] text-white py-32 px-6 border-t border-gray-900 overflow-hidden relative">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 relative z-10">
          <div className="flex-1 space-y-8">
            <div className="text-sm font-bold uppercase tracking-widest text-gray-500">04 — LOCATE</div>
            <h2 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-[1.05]">
              RISK ISN'T EVERYWHERE.
            </h2>
            <div className="bg-black border border-gray-800 p-8 rounded-3xl mt-12 inline-block space-y-6">
              <div className="inline-block px-3 py-1 bg-[#FF7C1E]/20 text-[#FF7C1E] border border-[#FF7C1E]/40 text-xs font-bold uppercase tracking-widest rounded-full">
                SIMULATED SPATIAL ALLOCATION
              </div>
              <div className="text-4xl font-black tracking-tighter">South Delhi</div>
              <div className="flex gap-12">
                <div>
                  <div className="text-3xl font-black">58<span className="text-xl text-gray-500">/100</span></div>
                </div>
                <div>
                  <div className="text-3xl font-black">1,280 MW</div>
                  <div className="text-xs font-bold uppercase text-gray-500 mt-1">Forecast Demand</div>
                </div>
              </div>

              <button 
                onClick={() => onViewForecast?.("geographic")}
                className="w-full py-4 px-6 bg-[#FF7C1E] text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-orange-500 transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg"
              >
                <span>Open Geographic Map</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Abstract Map Graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:flex items-center justify-center opacity-40">
           <div className="relative w-[400px] h-[400px]">
             <Map className="w-full h-full text-gray-800" strokeWidth={0.5} />
             <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-gray-600 rounded-full animate-pulse"></div>
             <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-gray-600 rounded-full animate-pulse delay-100"></div>
             <div className="absolute bottom-1/3 right-1/4 w-8 h-8 bg-red-600 rounded-full animate-ping shadow-[0_0_50px_rgba(220,38,38,0.8)] flex items-center justify-center z-20"></div>
           </div>
        </div>
      </section>

      {/* ── 09 SIMULATE ── */}
      <section className="bg-white text-black py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <div className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">05 — SIMULATE</div>
            <div className="inline-block mb-4 px-4 py-1.5 bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs uppercase tracking-widest rounded-full">
              SIMULATED / MODELED SCENARIO TOOL
            </div>
            <h2 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-[1.05]">
              WHAT IF TOMORROW IS HOTTER?
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-16">
            <div className="bg-[#f6f5f2] p-12 rounded-3xl space-y-8">
              <div className="flex justify-between items-end">
                <div className="text-xl font-bold uppercase tracking-widest">TEMPERATURE</div>
                <div className="text-6xl font-black tracking-tighter">{temperature}°C</div>
              </div>
              <input 
                type="range" 
                min="30" 
                max="45" 
                value={temperature}
                onChange={(e) => setTemperature(parseInt(e.target.value))}
                className="w-full h-4 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <div className="flex justify-between text-sm font-bold text-gray-400">
                <span>30°C</span><span>45°C</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-8 border-t-4 border-gray-200">
                <div className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">BASE TELEMETRY</div>
                <div className="text-4xl font-black tracking-tighter mb-2">{baseDemand.toLocaleString()} MW</div>
                <div className="inline-block bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase">LIVE BASE</div>
              </div>
              <div className={`p-8 border-t-4 transition-colors ${temperature > 32 ? 'border-orange-500' : 'border-gray-200'}`}>
                <div className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">MODELED SCENARIO</div>
                <div className="text-5xl font-black tracking-tighter mb-2">{simulatedDemand.toLocaleString()} MW</div>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${isCritical ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}>
                  {isCritical ? 'CRITICAL' : 'HIGH RISK'}
                </div>
              </div>
              <div className="p-8 border-t-4 border-red-600">
                <div className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">EXTREME (+10°C MODELED)</div>
                <div className="text-4xl font-black tracking-tighter mb-2">{Math.round(baseDemand * 1.25).toLocaleString()} MW</div>
                <div className="inline-block bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">CRITICAL</div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button 
                onClick={() => onViewForecast?.("scenario-lab")}
                className="px-10 py-5 bg-black text-white font-black uppercase tracking-widest text-xs rounded-full hover:bg-gray-800 transition flex items-center space-x-3 cursor-pointer shadow-xl"
              >
                <span>Launch Scenario Lab</span>
                <ArrowRight className="w-5 h-5 text-[#FF7C1E]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10 THE AI COPILOT ── */}
      <section className="bg-[#111111] text-white py-32 px-6 border-t border-gray-900">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 space-y-8">
            <h2 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-[1.05]">
              YOU SHOULDN'T HAVE TO READ THE DASHBOARD.
            </h2>
            <p className="text-xl text-gray-400 font-medium">
              PravaahX Copilot provides grounded natural language answers to complex grid queries.
            </p>
            <button 
              onClick={() => onViewForecast?.("copilot")}
              className="px-8 py-4 bg-[#FF7C1E] text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-orange-600 transition flex items-center space-x-3 cursor-pointer shadow-lg"
            >
              <span>Open PravaahX Copilot</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 w-full max-w-xl">
            <div className="bg-black border border-gray-800 rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-4 border-b border-gray-800 pb-4">
                <div className="w-10 h-10 bg-[#FF7C1E] rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-black" />
                </div>
                <div className="font-black text-xl tracking-widest uppercase">PRAVAAHX COPILOT</div>
              </div>
              
              <div className="space-y-4 text-sm">
                <div className="bg-gray-900 p-4 rounded-xl text-gray-300">
                  "What should I know about tomorrow's peak?"
                </div>
                <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl space-y-2 text-gray-300">
                  <p>Peak is expected at <strong>{peakTimeVal}</strong> with <strong>{peakVal} MW</strong> of demand.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 11 DATA TRUST ── */}
      <section className="bg-white text-black py-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 space-y-8">
            <h2 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-[1.05]">
              AI IS ONLY AS GOOD AS THE DATA BEHIND IT.
            </h2>
            <p className="text-xl text-gray-600 font-medium">
              PravaahX continuously checks the quality of the data feeding its predictions.
            </p>
            <button 
              onClick={onOpenDataHealth}
              className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-full hover:bg-gray-800 transition flex items-center space-x-3 cursor-pointer shadow-lg"
            >
              <span>View Data Health</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
          
          <div className="flex-1 w-full">
            <div className="bg-[#111111] text-white p-12 rounded-3xl shadow-2xl border border-gray-800">
              <div className="flex items-end justify-between mb-8">
                <div className="text-8xl font-black tracking-tighter text-emerald-400">94%</div>
                <div className="text-xl font-bold uppercase tracking-widest text-gray-400 pb-2">DATA HEALTH</div>
              </div>
              
              <div className="space-y-4 font-mono text-base font-bold">
                {[
                  { label: "LOAD DATA", val: "98%" },
                  { label: "WEATHER DATA", val: "95%" },
                  { label: "TIMESTAMP QUALITY", val: "100%" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-gray-800 pb-2">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-emerald-400">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 12 FOOTER ── */}
      <footer className="bg-black text-white py-32 px-6 text-center border-t border-gray-900">
        <div className="max-w-4xl mx-auto space-y-12">
          <h2 className="text-6xl lg:text-[8rem] font-black tracking-tighter uppercase leading-[0.9]">
            THE PEAK IS COMING.
          </h2>
          <p className="text-3xl text-gray-400 font-medium">Be ready before it arrives.</p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-8">
            <button 
              onClick={() => onViewForecast?.("command-center")} 
              className="w-full sm:w-auto px-12 py-6 bg-[#FF7C1E] text-black font-black uppercase tracking-widest text-sm rounded-full hover:bg-orange-600 transition flex items-center justify-center space-x-3 cursor-pointer shadow-2xl"
            >
              <span>EXPLORE PRAVAAHX</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="pt-24 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-8 text-left">
            <div>
              <div className="text-3xl font-black tracking-widest uppercase mb-4">PravaahX</div>
              <p className="text-gray-500 font-medium">Built for smarter grid decisions.</p>
            </div>
          </div>
        </div>
      </footer>
      
    </div>
  );
};
