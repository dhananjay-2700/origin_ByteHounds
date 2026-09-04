"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, AlertTriangle, Clock, Activity, Zap } from "lucide-react";
import { ScrollReveal } from "./ScrollLayout";

export const GridRiskView: React.FC = () => {
  const [riskData, setRiskData] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [riskRes, anomalyRes, dashRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/risk"),
          fetch("http://127.0.0.1:8000/api/anomalies"),
          fetch("http://127.0.0.1:8000/api/dashboard")
        ]);
        const riskJson = await riskRes.json();
        const anomalyJson = await anomalyRes.json();
        const dashJson = await dashRes.json();
        setRiskData(riskJson);
        setAnomalies(anomalyJson);
        setDashboard(dashJson);
      } catch (err) {
        console.error("Failed to fetch risk data", err);
      }
    };
    fetchData();
  }, []);

  const riskContributors = riskData?.contributors || [
    { name: "Demand Utilization", weight: 88, color: "bg-rose-500" },
    { name: "Weather Stress", weight: 74, color: "bg-amber-500" },
    { name: "Demand Ramp Rate", weight: 62, color: "bg-yellow-500" },
    { name: "Residual Anomaly", weight: 41, color: "bg-cyan-500" },
    { name: "Forecast Uncertainty", weight: 28, color: "bg-purple-500" },
  ];

  const timeline = riskData?.timeline || [];

  const getBadgeClass = (level: string) => {
    switch (level) {
      case "CRITICAL": return "bg-white text-black font-bold";
      case "HIGH": return "bg-gray-900 text-white border-gray-600";
      case "MODERATE": return "bg-gray-900 text-gray-300 border-gray-700";
      case "LOW": return "bg-gray-950 text-gray-500 border-gray-800";
      default: return "bg-black text-gray-500 border-gray-800";
    }
  };

  const getContributorColor = (index: number) => {
    const colors = ["bg-white", "bg-gray-300", "bg-gray-500", "bg-gray-700", "bg-gray-800"];
    return colors[index % colors.length];
  };

  const activeAnomaly = anomalies.length > 0 ? anomalies[0] : null;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. HERO RISK SCORE DIAL / CARD */}
      <ScrollReveal delay={100} direction="left">
        <div className="control-card p-6 border-l-4 border-l-white flex flex-col md:flex-row items-center justify-between gap-6 bg-black">
        <div className="flex items-center space-x-6">
          <div className="relative flex items-center justify-center w-28 h-28 rounded-full border-4 border-gray-800 bg-black">
            <div className="text-center">
              <span className="text-4xl font-extrabold text-white font-mono">{riskData?.risk_score ?? "--"}</span>
              <div className="text-[10px] text-gray-500 font-mono">/ 100</div>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white font-mono">GRID RISK SCORE</h1>
              <span className={`px-3 py-1 rounded text-black font-bold text-xs tracking-wider bg-white`}>
                {riskData?.risk_level || "CALCULATING"}
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1 max-w-md">
              System grid stress is evaluated continuously against LightGBM 24h demand predictions and sub-station thermal capacities.
            </p>
          </div>
        </div>

        <div className="p-4 bg-black rounded-xl border border-gray-800 text-xs space-y-2 font-mono">
          <div className="flex justify-between space-x-4">
            <span className="text-gray-500">Target Grid Capacity:</span>
            <span className="text-white font-bold">9,800 MW</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-gray-500">Peak Demand Load:</span>
            <span className="text-white font-bold">{dashboard?.tomorrow_peak ? `${Math.round(dashboard.tomorrow_peak).toLocaleString()} MW` : "--"}</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-gray-500">Critical Window:</span>
            <span className="text-white font-bold">{dashboard?.critical_window || "Live Stream"}</span>
          </div>
        </div>
        </div>
      </ScrollReveal>

      {/* 2. RISK CONTRIBUTORS & FUTURE TIMELINE */}
      <ScrollReveal delay={200} direction="up">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risk Contributors */}
        <div className="control-card p-6 border border-gray-800 bg-black">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-4 flex items-center">
            <ShieldAlert className="w-4 h-4 mr-2 text-white" />
            RISK CONTRIBUTORS BREAKDOWN
          </h2>

          <div className="space-y-4">
            {riskContributors.map((c: any, i: number) => {
              const weight = c.weight || c.value;
              return (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-gray-300">{c.name}</span>
                  <span className="text-white font-bold">{weight}%</span>
                </div>
                <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                  <div className={`${getContributorColor(i)} h-full rounded-full`} style={{ width: `${weight}%` }} />
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* Future Risk Timeline */}
        <div className="control-card p-6 border border-gray-800 bg-black">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-4 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-white" />
            FUTURE RISK TIMELINE (NEXT 24H)
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {timeline.map((t: any, i: number) => (
              <div
                key={i}
                className="p-3 bg-black rounded-lg border border-gray-800 flex flex-col items-center justify-between space-y-2 text-center"
              >
                <span className="text-xs text-gray-500 font-mono">{t.time}</span>
                <span className="text-xl font-bold text-white font-mono">{t.score || t.risk_score}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${t.badge || getBadgeClass(t.level || t.risk_level)}`}>
                  {t.level || t.risk_level}
                </span>
              </div>
            ))}
          </div>
        </div>

        </div>
      </ScrollReveal>

      {/* 3. ANOMALY DETECTION SECTION */}
      <ScrollReveal delay={300} direction="up">
        <div className="control-card p-6 border-l-4 border-l-white bg-black mt-6">
        <div className="flex items-center space-x-2 text-white text-xs font-mono font-bold uppercase mb-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>ANOMALY DETECTED (STATISTICAL RESIDUAL ENGINE)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-black rounded-xl border border-gray-800">
            <div className="text-[10px] text-gray-500 font-mono mb-1 uppercase">Detection Window</div>
            <div className="text-lg font-bold text-white font-mono">{activeAnomaly?.timestamp || "--"}</div>
          </div>
          <div className="p-4 bg-black rounded-xl border border-gray-800">
            <div className="text-[10px] text-gray-500 font-mono mb-1 uppercase">Expected Baseline</div>
            <div className="text-lg font-bold text-white font-mono">{activeAnomaly?.expected_load ? `${Math.round(activeAnomaly.expected_load).toLocaleString()} MW` : "--"}</div>
          </div>
          <div className="p-4 bg-black rounded-xl border border-gray-800">
            <div className="text-[10px] text-gray-500 font-mono mb-1 uppercase">Observed Telemetry</div>
            <div className="text-lg font-bold text-white font-mono">{activeAnomaly?.observed_load ? `${Math.round(activeAnomaly.observed_load).toLocaleString()} MW` : "--"}</div>
          </div>
          <div className="p-4 bg-black rounded-xl border border-gray-800">
            <div className="text-[10px] text-gray-500 font-mono mb-1 uppercase">Residual Deviation</div>
            <div className="text-lg font-bold text-white font-mono">{activeAnomaly?.deviation ? `+${Math.round(activeAnomaly.deviation).toLocaleString()} MW (${activeAnomaly.severity})` : "--"}</div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-black border border-gray-800 rounded flex text-xs text-gray-300">
          <span className="text-white font-bold mr-2">Root Cause:</span> 
          {activeAnomaly?.why || "Observed demand telemetry evaluated against model residual thresholds."}
        </div>
        </div>
      </ScrollReveal>
    </div>
  );
};

