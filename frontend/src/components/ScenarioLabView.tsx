"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Play, AlertTriangle, RefreshCw, ArrowUpRight, ArrowDownRight, Info, Zap } from "lucide-react";
import { ScrollReveal } from "./ScrollLayout";
import { API_ENDPOINTS } from "../lib/api";

export const ScenarioLabView: React.FC = () => {
  const [temperature, setTemperature] = useState<number>(41.2);
  const [humidity, setHumidity] = useState<number>(52.0);
  const [solar, setSolar] = useState<number>(10.0);
  const [demandGrowth, setDemandGrowth] = useState<number>(0.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Dynamic baseline case loaded from LightGBM model API
  const [basePeak, setBasePeak] = useState<number>(3910);
  const [baseRiskScore, setBaseRiskScore] = useState<number>(39);
  const [baseRiskLevel, setBaseRiskLevel] = useState<string>("MODERATE");

  // Simulated state
  const [simulatedPeak, setSimulatedPeak] = useState<number>(4150);
  const [simulatedRiskScore, setSimulatedRiskScore] = useState<number>(45);
  const [simulatedRiskLevel, setSimulatedRiskLevel] = useState<string>("MODERATE");
  const [alertMessage, setAlertMessage] = useState<string>(
    "[Simulated / Modeled Scenario] Stress test simulation mode active."
  );

  useEffect(() => {
    const fetchBaseline = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.dashboard);
        if (res.ok) {
          const data = await res.json();
          setBasePeak(Math.round(data.tomorrow_peak));
          setBaseRiskScore(data.grid_risk_score);
          setBaseRiskLevel(data.grid_risk_level);
          setSimulatedPeak(Math.round(data.tomorrow_peak * 1.05));
        }
      } catch (err) {
        console.error("Error fetching simulation baseline:", err);
      }
    };
    fetchBaseline();
  }, []);

  const handleRunSimulation = async () => {
    setIsLoading(true);

    try {
      const res = await fetch(API_ENDPOINTS.simulation, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperature,
          humidity,
          solar_contribution: solar,
          demand_growth: demandGrowth,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSimulatedPeak(data.scenario_peak);
        setSimulatedRiskScore(data.scenario_risk);
        setSimulatedRiskLevel(data.scenario_risk_level);
        setAlertMessage(data.alert_message);
      } else {
        computeFallback();
      }
    } catch (e) {
      computeFallback();
    } finally {
      setIsLoading(false);
    }
  };

  const computeFallback = () => {
    const tempDelta = temperature - 41.2;
    const humDelta = humidity - 52.0;
    const solarEffect = (solar - 10.0) * -18;
    const growthEffect = (demandGrowth / 100) * basePeak;

    const newPeak = Math.round(basePeak + tempDelta * 245 + humDelta * 12 + solarEffect + growthEffect);
    setSimulatedPeak(newPeak);

    const ratio = newPeak / 9800;
    const newRisk = Math.min(99, Math.max(10, Math.round(ratio * 92)));
    setSimulatedRiskScore(newRisk);

    if (newRisk >= 88) setSimulatedRiskLevel("CRITICAL");
    else if (newRisk >= 75) setSimulatedRiskLevel("HIGH");
    else if (newRisk >= 50) setSimulatedRiskLevel("MODERATE");
    else setSimulatedRiskLevel("LOW");

    setAlertMessage(
      `[Simulated / Modeled Scenario] A ${tempDelta >= 0 ? "+" : ""}${tempDelta.toFixed(1)}°C shift projects peak demand at ${newPeak.toLocaleString()} MW (${newRisk}/100 Risk).`
    );
  };

  const peakChange = simulatedPeak - basePeak;

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Header Banner */}
      <ScrollReveal delay={100} direction="up">
        <div className="control-card p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-[#FF7C1E] text-xs font-black uppercase tracking-widest mb-2">
              <Sliders className="w-4 h-4" />
              <span>PREDICTIVE SCENARIO LAB</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">"What happens if tomorrow gets hotter?"</h1>
            <p className="text-xs md:text-sm text-gray-400 mt-1 font-normal">
              Hypothetical counterfactual testing tool. Adjust variables to run modeled what-if simulations against live ML baseline forecasts.
            </p>
          </div>

          <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-medium">
            <Info className="w-4 h-4 text-[#FF7C1E]" />
            <span>Simulated / Modeled Scenario Tool</span>
          </div>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CONTROLS PANEL (6 cols) */}
        <ScrollReveal delay={200} direction="left" className="lg:col-span-6">
          <div className="control-card p-8 space-y-7 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-gray-400">COUNTERFACTUAL CONTROLS</span>
                  <h3 className="text-lg font-black text-white tracking-tight">Simulation Parameters</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/5 text-gray-400 text-xs font-semibold">4 Variables</span>
              </div>

              <div className="space-y-6">
                {/* Slider 1: Temperature */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-300 font-semibold">Ambient Temperature</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FF7C1E]/10 text-[#FF7C1E] font-black border border-[#FF7C1E]/30">
                      {temperature}°C
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="45"
                    step="0.5"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF7C1E]"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400 font-medium">
                    <span>30°C</span>
                    <span className="text-gray-400">41.2°C (Base)</span>
                    <span>45°C</span>
                  </div>
                </div>

                {/* Slider 2: Humidity */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-300 font-semibold">Relative Humidity</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white font-black border border-white/20">
                      {humidity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="80"
                    step="1"
                    value={humidity}
                    onChange={(e) => setHumidity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400 font-medium">
                    <span>20%</span>
                    <span className="text-gray-400">52% (Base)</span>
                    <span>80%</span>
                  </div>
                </div>

                {/* Slider 3: Solar Contribution */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-300 font-semibold">Rooftop Solar Offset</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 font-black border border-emerald-500/30">
                      {solar}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={solar}
                    onChange={(e) => setSolar(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400 font-medium">
                    <span>0%</span>
                    <span className="text-gray-400">10% (Base)</span>
                    <span>30%</span>
                  </div>
                </div>

                {/* Slider 4: Demand Growth */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-300 font-semibold">Underlying Demand Shift</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white font-black border border-white/20">
                      {demandGrowth > 0 ? `+${demandGrowth}` : demandGrowth}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-5"
                    max="10"
                    step="0.5"
                    value={demandGrowth}
                    onChange={(e) => setDemandGrowth(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF7C1E]"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400 font-medium">
                    <span>-5%</span>
                    <span className="text-gray-400">0% (Base)</span>
                    <span>+10%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Run Simulation Button */}
            <button
              onClick={handleRunSimulation}
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-full bg-[#FF7C1E] text-black font-black uppercase text-xs tracking-widest hover:bg-white hover:text-black transition-all duration-300 shadow-xl shadow-[#FF7C1E]/20 flex items-center justify-center space-x-2 disabled:opacity-50 mt-6"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>COMPUTING SCENARIO MODEL...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-black" />
                  <span>RUN WHAT-IF SIMULATION</span>
                </>
              )}
            </button>
          </div>
        </ScrollReveal>

        {/* RESULTS COMPARISON PANEL (6 cols) */}
        <ScrollReveal delay={300} direction="right" className="lg:col-span-6">
          <div className="space-y-6">
            
            {/* Side-by-Side Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* BASE CASE */}
              <div className="control-card p-6 border-l-4 border-l-white/30 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">ML BASELINE</span>
                  <div className="text-xs text-gray-400 font-medium">Peak Demand</div>
                  <div className="text-3xl lg:text-4xl font-black text-white tracking-tight mt-1">
                    {basePeak.toLocaleString()}{" "}
                    <span className="text-sm font-bold text-gray-400">MW</span>
                  </div>
                </div>
                
                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">Risk Score:</span>
                  <span className="text-white font-bold">{baseRiskScore} ({baseRiskLevel})</span>
                </div>
              </div>

              {/* SIMULATED CASE */}
              <div className="control-card p-6 border-l-4 border-l-[#FF7C1E] bg-[#FF7C1E]/5 flex flex-col justify-between shadow-xl">
                <div>
                  <span className="text-[10px] font-black text-[#FF7C1E] uppercase tracking-widest block mb-2">MODELED SCENARIO</span>
                  <div className="text-xs text-[#FF7C1E] font-medium">Projected Peak</div>
                  <div className="text-3xl lg:text-4xl font-black text-[#FF7C1E] tracking-tight mt-1">
                    {simulatedPeak.toLocaleString()}{" "}
                    <span className="text-sm font-bold text-[#FF7C1E]">MW</span>
                  </div>
                </div>
                
                <div className="mt-5 pt-4 border-t border-[#FF7C1E]/20 flex items-center justify-between text-xs">
                  <span className="text-gray-300 font-medium">Scenario Risk:</span>
                  <span className="text-[#FF7C1E] font-black">
                    {simulatedRiskScore} ({simulatedRiskLevel})
                  </span>
                </div>
              </div>
            </div>

            {/* PEAK CHANGE INDICATOR */}
            <div className="control-card p-6 flex items-center justify-between shadow-lg">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">SIMULATED PEAK DELTA</span>
                <div className="text-2xl lg:text-3xl font-black text-white tracking-tight mt-1">
                  {peakChange >= 0 ? `+${peakChange.toLocaleString()}` : peakChange.toLocaleString()} MW
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {peakChange >= 0 ? "Surplus capacity reserved required" : "Load shedding risk avoided"}
                </div>
              </div>
              <div className={`p-4 rounded-full ${peakChange >= 0 ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"}`}>
                {peakChange >= 0 ? <ArrowUpRight className="w-7 h-7" /> : <ArrowDownRight className="w-7 h-7" />}
              </div>
            </div>

            {/* SCENARIO ALERT BANNER */}
            <div className="control-card p-6 border-l-4 border-l-[#FF7C1E] bg-white/[0.02]">
              <div className="flex items-center space-x-2 text-[#FF7C1E] font-black text-xs uppercase tracking-widest mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>MODELED WHAT-IF OUTCOME</span>
              </div>
              <p className="text-gray-300 text-xs md:text-sm leading-relaxed font-normal">
                {alertMessage}
              </p>
            </div>

          </div>
        </ScrollReveal>

      </div>
    </div>
  );
};
