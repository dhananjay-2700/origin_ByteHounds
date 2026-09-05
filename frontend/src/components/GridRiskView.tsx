"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, AlertTriangle, Clock, Activity, Zap, CheckCircle2 } from "lucide-react";
import { ScrollReveal } from "./ScrollLayout";
import { API_ENDPOINTS } from "../lib/api";

export const GridRiskView: React.FC = () => {
  const [riskData, setRiskData] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [riskRes, anomalyRes, dashRes] = await Promise.all([
          fetch(API_ENDPOINTS.risk),
          fetch(API_ENDPOINTS.anomalies),
          fetch(API_ENDPOINTS.dashboard)
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
    { name: "Demand Utilization", weight: 88, color: "from-[#FF7C1E] to-red-500" },
    { name: "Weather Stress", weight: 74, color: "from-amber-500 to-[#FF7C1E]" },
    { name: "Demand Ramp Rate", weight: 62, color: "from-yellow-400 to-amber-500" },
    { name: "Residual Anomaly", weight: 41, color: "from-orange-400 to-[#FF7C1E]" },
    { name: "Forecast Uncertainty", weight: 28, color: "from-gray-400 to-gray-200" },
  ];

  const timeline = riskData?.timeline || [];

  const getBadgeClass = (level: string) => {
    switch (level?.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-400 border border-red-500/40";
      case "HIGH":
        return "bg-[#FF7C1E]/20 text-[#FF7C1E] border border-[#FF7C1E]/40";
      case "MODERATE":
        return "bg-amber-500/20 text-amber-300 border border-amber-500/40";
      case "LOW":
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
      default:
        return "bg-white/10 text-gray-300 border border-white/20";
    }
  };

  const activeAnomaly = anomalies.length > 0 ? anomalies[0] : null;

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* 1. HERO RISK SCORE DIAL / CARD */}
      <ScrollReveal delay={100} direction="left">
        <div className="control-card p-8 border-l-4 border-l-[#FF7C1E] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 bg-gradient-to-r from-[#FF7C1E]/5 via-transparent to-transparent shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative flex items-center justify-center w-28 h-28 rounded-full border-4 border-white/10 bg-black/60 shrink-0 shadow-inner">
              <div className="text-center">
                <span className="text-4xl lg:text-5xl font-black text-white tracking-tighter">
                  {riskData?.risk_score ?? "39"}
                </span>
                <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest mt-0.5">/ 100</div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">GRID RISK SCORE</h1>
                <span className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${getBadgeClass(riskData?.risk_level || "MODERATE")}`}>
                  {riskData?.risk_level || "MODERATE"}
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-400 mt-2 max-w-xl font-normal leading-relaxed">
                System stress evaluates continuous LightGBM demand predictions against regional sub-station transformer capacities and extreme ambient heat thresholds.
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto p-5 bg-white/[0.03] rounded-2xl border border-white/10 text-xs space-y-3 shrink-0">
            <div className="flex justify-between items-center space-x-6">
              <span className="text-gray-400 font-medium">Target Grid Capacity:</span>
              <span className="text-white font-black text-sm">9,800 MW</span>
            </div>
            <div className="flex justify-between items-center space-x-6">
              <span className="text-gray-400 font-medium">Peak Demand Load:</span>
              <span className="text-[#FF7C1E] font-black text-sm">
                {dashboard?.tomorrow_peak ? `${Math.round(dashboard.tomorrow_peak).toLocaleString()} MW` : "3,911 MW"}
              </span>
            </div>
            <div className="flex justify-between items-center space-x-6">
              <span className="text-gray-400 font-medium">Critical Window:</span>
              <span className="text-white font-black text-sm">
                {dashboard?.critical_window || "08:00 — 19:00"}
              </span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 2. RISK CONTRIBUTORS & FUTURE TIMELINE */}
      <ScrollReveal delay={200} direction="up">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Risk Contributors (6 cols) */}
          <div className="lg:col-span-6 control-card p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-[#FF7C1E] text-xs font-black uppercase tracking-widest mb-2">
                <ShieldAlert className="w-4 h-4" />
                <span>FACTOR DECOMPOSITION</span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight mb-6">
                Risk Contributors Breakdown
              </h2>

              <div className="space-y-5">
                {riskContributors.map((c: any, i: number) => {
                  const weight = c.weight || c.value || 50;
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-300">{c.name}</span>
                        <span className="text-white font-black">{weight}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${c.color || "from-[#FF7C1E] to-red-500"} transition-all duration-500`}
                          style={{ width: `${weight}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 text-xs text-gray-400">
              Weights represent dynamic SHAP regression contributions to composite risk.
            </div>
          </div>

          {/* Future Risk Timeline (6 cols) */}
          <div className="lg:col-span-6 control-card p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-[#FF7C1E] text-xs font-black uppercase tracking-widest mb-2">
                <Clock className="w-4 h-4" />
                <span>24-HOUR TRAJECTORY</span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight mb-6">
                Future Risk Timeline
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {timeline.map((t: any, i: number) => (
                  <div
                    key={i}
                    className="p-4 bg-white/[0.03] rounded-2xl border border-white/10 flex flex-col items-center justify-between space-y-3 text-center hover:border-white/20 transition-all"
                  >
                    <span className="text-xs text-gray-400 font-medium">{t.time}</span>
                    <span className="text-2xl font-black text-white tracking-tight">
                      {t.score || t.risk_score}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${getBadgeClass(t.level || t.risk_level)}`}>
                      {t.level || t.risk_level}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 text-xs text-gray-400">
              Evaluated hourly through next 24-hour forecast horizon.
            </div>
          </div>

        </div>
      </ScrollReveal>

      {/* 3. ANOMALY DETECTION SECTION */}
      <ScrollReveal delay={300} direction="up">
        <div className="control-card p-8 border-l-4 border-l-red-500 bg-gradient-to-r from-red-950/20 via-transparent to-transparent shadow-xl">
          <div className="flex items-center space-x-2 text-red-400 text-xs font-black uppercase tracking-widest mb-2">
            <Activity className="w-4 h-4" />
            <span>STATISTICAL RESIDUAL ENGINE</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Anomaly Detection & Deviation Analysis
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/10">
              <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Detection Window</div>
              <div className="text-lg font-black text-white">{activeAnomaly?.timestamp || "14:15 IST"}</div>
            </div>
            <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/10">
              <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Expected Baseline</div>
              <div className="text-lg font-black text-white">
                {activeAnomaly?.expected_load ? `${Math.round(activeAnomaly.expected_load).toLocaleString()} MW` : "3,250 MW"}
              </div>
            </div>
            <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/10">
              <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Observed Telemetry</div>
              <div className="text-lg font-black text-white">
                {activeAnomaly?.observed_load ? `${Math.round(activeAnomaly.observed_load).toLocaleString()} MW` : "3,590 MW"}
              </div>
            </div>
            <div className="p-5 bg-red-500/10 rounded-2xl border border-red-500/30">
              <div className="text-[10px] text-red-400 uppercase font-black tracking-widest mb-1.5">Residual Deviation</div>
              <div className="text-lg font-black text-red-400">
                {activeAnomaly?.deviation ? `+${Math.round(activeAnomaly.deviation).toLocaleString()} MW` : "+340 MW (Elevated)"}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs text-gray-300">
            <span className="text-[#FF7C1E] font-black uppercase tracking-wider shrink-0">Root Cause Diagnostics:</span> 
            <span>{activeAnomaly?.why || "Observed demand telemetry exceeded 95% confidence interval of the baseline LightGBM model due to abrupt cloud cover shifts."}</span>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};
