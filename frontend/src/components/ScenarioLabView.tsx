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
        <div className="control-card p-6 border border-gray-100 bg-white relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-purple-600 text-xs font-semibold uppercase tracking-wider">
              <Sliders className="w-4 h-4" />
              <span>PREDICTIVE SCENARIO LAB</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold flex items-center">
              <Info className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
              Simulated / Modeled Scenario Tool
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 font-sans">"What happens if tomorrow gets hotter?"</h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Hypothetical counterfactual testing tool. Adjust variables below to run modeled what-if simulations against live ML baseline forecasts.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CONTROLS PANEL (6 cols) */}
        <ScrollReveal delay={200} direction="left" className="lg:col-span-6">
          <div className="control-card p-6 border border-gray-100 bg-white space-y-6 h-full">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-3">
              SIMULATION PARAMETERS
            </h2>

            {/* Slider 1: Temperature */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-gray-700 font-semibold">Temperature (°C)</span>
                <span className="text-amber-600 font-bold">{temperature}°C</span>
              </div>
              <input
                type="range"
                min="30"
                max="45"
                step="0.5"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                <span>30°C</span>
                <span>41.2°C (Base)</span>
                <span>45°C</span>
              </div>
            </div>

            {/* Slider 2: Humidity */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-gray-700 font-semibold">Humidity (%)</span>
                <span className="text-blue-600 font-bold">{humidity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                step="1"
                value={humidity}
                onChange={(e) => setHumidity(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                <span>20%</span>
                <span>52% (Base)</span>
                <span>80%</span>
              </div>
            </div>

            {/* Slider 3: Solar Contribution */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-gray-700 font-semibold">Rooftop Solar Offset (%)</span>
                <span className="text-emerald-600 font-bold">{solar}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={solar}
                onChange={(e) => setSolar(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                <span>0%</span>
                <span>10% (Base)</span>
                <span>30%</span>
              </div>
            </div>

            {/* Slider 4: Demand Growth */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-gray-700 font-semibold">Demand Growth (%)</span>
                <span className="text-purple-600 font-bold">{demandGrowth > 0 ? `+${demandGrowth}` : demandGrowth}%</span>
              </div>
              <input
                type="range"
                min="-5"
                max="10"
                step="0.5"
                value={demandGrowth}
                onChange={(e) => setDemandGrowth(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                <span>-5%</span>
                <span>0% (Base)</span>
                <span>+10%</span>
              </div>
            </div>

            {/* Run Simulation Trigger */}
            <button
              onClick={handleRunSimulation}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
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
            <div className="grid grid-cols-2 gap-4">
              {/* BASE CASE */}
              <div className="control-card p-5 border-l-4 border-l-gray-400 bg-white">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">ML BASELINE</span>
                <div className="text-xs text-gray-500 font-medium">Peak Demand</div>
                <div className="text-2xl font-extrabold text-gray-900 font-sans mt-1">
                  {basePeak.toLocaleString()} <span className="text-xs font-medium text-gray-500">MW</span>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="text-[10px] text-gray-500 font-semibold">Model Risk Score</div>
                  <div className="text-sm font-bold text-amber-600">{baseRiskScore} ({baseRiskLevel})</div>
                </div>
              </div>

              {/* SIMULATED CASE */}
              <div className="control-card p-5 border-l-4 border-l-purple-600 bg-purple-50/50">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block mb-1">MODELED SCENARIO</span>
                <div className="text-xs text-purple-600 font-medium">Projected Peak</div>
                <div className="text-2xl font-extrabold text-purple-900 font-sans mt-1">
                  {simulatedPeak.toLocaleString()} <span className="text-xs font-medium text-purple-600">MW</span>
                </div>
                
                <div className="mt-4 pt-3 border-t border-purple-100">
                  <div className="text-[10px] text-purple-700 font-semibold">Scenario Risk</div>
                  <div className="text-sm font-bold text-purple-900">
                    {simulatedRiskScore} ({simulatedRiskLevel})
                  </div>
                </div>
              </div>
            </div>

            {/* PEAK CHANGE INDICATOR */}
            <div className="control-card p-5 border border-gray-100 bg-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">SIMULATED PEAK DELTA</span>
                <div className="text-2xl font-extrabold text-gray-900 font-sans mt-0.5">
                  {peakChange >= 0 ? `+${peakChange.toLocaleString()}` : peakChange.toLocaleString()} MW
                </div>
              </div>
              <div className={`p-3 rounded-2xl ${peakChange >= 0 ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
                {peakChange >= 0 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
              </div>
            </div>

            {/* SCENARIO ALERT BANNER */}
            <div className="control-card p-5 border-l-4 border-l-purple-600 bg-purple-50/80 border border-purple-100 text-xs">
              <div className="flex items-center space-x-2 text-purple-900 font-bold uppercase mb-2">
                <AlertTriangle className="w-4 h-4 text-purple-600" />
                <span>MODELED WHAT-IF OUTCOME</span>
              </div>
              <p className="text-purple-900 leading-relaxed font-sans font-medium">
                {alertMessage}
              </p>
            </div>

          </div>
        </ScrollReveal>

      </div>
    </div>
  );
};
