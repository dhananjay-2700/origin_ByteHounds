"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Play, AlertTriangle, RefreshCw, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import { ScrollReveal } from "./ScrollLayout";

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
        const res = await fetch("http://127.0.0.1:8000/api/dashboard");
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
      const res = await fetch("http://127.0.0.1:8000/api/simulation", {
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
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <ScrollReveal delay={100} direction="up">
        <div className="control-card p-6 border border-gray-800 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-purple-400 text-xs font-mono font-bold uppercase">
              <Sliders className="w-4 h-4" />
              <span>PREDICTIVE SCENARIO LAB</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-[11px] font-mono font-bold flex items-center">
              <Info className="w-3 h-3 mr-1 text-purple-400" />
              Simulated / Modeled Scenario Tool
            </span>
          </div>
          <h1 className="text-xl font-bold text-white font-mono">"What happens if tomorrow gets hotter?"</h1>
          <p className="text-xs text-gray-400 mt-1">
            Hypothetical counterfactual testing tool. Adjust variables below to run modeled what-if simulations against live ML baseline forecasts.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CONTROLS PANEL (6 cols) */}
        <ScrollReveal delay={200} direction="left" className="lg:col-span-6">
          <div className="control-card p-6 border border-gray-800 space-y-6 h-full">
          <h2 className="text-xs font-mono text-gray-300 uppercase font-bold tracking-wider border-b border-gray-800 pb-3">
            SIMULATION PARAMETERS
          </h2>

          {/* Slider 1: Temperature */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-300">Temperature (°C)</span>
              <span className="text-amber-400 font-bold">{temperature}°C</span>
            </div>
            <input
              type="range"
              min="30"
              max="45"
              step="0.5"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>30°C</span>
              <span>41.2°C (Base)</span>
              <span>45°C</span>
            </div>
          </div>

          {/* Slider 2: Humidity */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-300">Humidity (%)</span>
              <span className="text-cyan-400 font-bold">{humidity}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              step="1"
              value={humidity}
              onChange={(e) => setHumidity(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>20%</span>
              <span>52% (Base)</span>
              <span>80%</span>
            </div>
          </div>

          {/* Slider 3: Solar Contribution */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-300">Rooftop Solar Offset (%)</span>
              <span className="text-emerald-400 font-bold">{solar}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={solar}
              onChange={(e) => setSolar(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>0%</span>
              <span>10% (Base)</span>
              <span>30%</span>
            </div>
          </div>

          {/* Slider 4: Demand Growth */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-300">Demand Growth (%)</span>
              <span className="text-purple-400 font-bold">{demandGrowth > 0 ? `+${demandGrowth}` : demandGrowth}%</span>
            </div>
            <input
              type="range"
              min="-5"
              max="10"
              step="0.5"
              value={demandGrowth}
              onChange={(e) => setDemandGrowth(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>-5%</span>
              <span>0% (Base)</span>
              <span>+10%</span>
            </div>
          </div>

          {/* Run Simulation Trigger */}
          <button
            onClick={handleRunSimulation}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold font-mono text-sm hover:from-purple-500 hover:to-indigo-500 transition shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>COMPUTING SCENARIO MODEL...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
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
          <div className="grid grid-cols-2 gap-4 font-mono">
            {/* BASE CASE */}
            <div className="control-card p-5 border-l-4 border-l-gray-500">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">ML BASELINE</span>
              <div className="text-xs text-gray-400">Peak Demand</div>
              <div className="text-2xl font-extrabold text-white mt-1">
                {basePeak.toLocaleString()} <span className="text-xs font-normal">MW</span>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-800">
                <div className="text-[10px] text-gray-400">Model Risk Score</div>
                <div className="text-sm font-bold text-amber-400">{baseRiskScore} ({baseRiskLevel})</div>
              </div>
            </div>

            {/* SIMULATED CASE */}
            <div className="control-card p-5 border-l-4 border-l-purple-500 glow-high bg-purple-950/20">
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block mb-1">MODELED SCENARIO</span>
              <div className="text-xs text-purple-300">Projected Peak</div>
              <div className="text-2xl font-extrabold text-purple-300 mt-1">
                {simulatedPeak.toLocaleString()} <span className="text-xs font-normal">MW</span>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-800/80">
                <div className="text-[10px] text-purple-300/80">Scenario Risk</div>
                <div className="text-sm font-bold text-purple-300">
                  {simulatedRiskScore} ({simulatedRiskLevel})
                </div>
              </div>
            </div>
          </div>

          {/* PEAK CHANGE INDICATOR */}
          <div className="control-card p-5 border border-gray-800 flex items-center justify-between font-mono">
            <div>
              <span className="text-xs text-gray-400 uppercase">SIMULATED PEAK DELTA</span>
              <div className="text-xl font-extrabold text-white mt-0.5">
                {peakChange >= 0 ? `+${peakChange.toLocaleString()}` : peakChange.toLocaleString()} MW
              </div>
            </div>
            <div className={`p-3 rounded-full ${peakChange >= 0 ? "bg-rose-500/20 text-rose-400 border border-rose-500/40" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"}`}>
              {peakChange >= 0 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
            </div>
          </div>

          {/* SCENARIO ALERT BANNER */}
          <div className="control-card p-5 border-l-4 border-l-purple-500 bg-purple-950/40 text-xs">
            <div className="flex items-center space-x-2 text-purple-300 font-bold uppercase mb-2">
              <AlertTriangle className="w-4 h-4 text-purple-400" />
              <span>MODELED WHAT-IF OUTCOME</span>
            </div>
            <p className="text-purple-200 leading-relaxed font-mono">
              {alertMessage}
            </p>
          </div>

          </div>
        </ScrollReveal>

      </div>
    </div>
  );
};
