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
    { name: "Demand Utilization", weight: 88, color: "bg-blue-600" },
    { name: "Weather Stress", weight: 74, color: "bg-indigo-600" },
    { name: "Demand Ramp Rate", weight: 62, color: "bg-amber-500" },
    { name: "Residual Anomaly", weight: 41, color: "bg-purple-600" },
    { name: "Forecast Uncertainty", weight: 28, color: "bg-slate-500" },
  ];

  const timeline = riskData?.timeline || [];

  const getBadgeClass = (level: string) => {
    switch (level) {
      case "CRITICAL": return "bg-red-100 text-red-700 border-red-200 font-bold";
      case "HIGH": return "bg-orange-100 text-orange-700 border-orange-200 font-bold";
      case "MODERATE": return "bg-amber-100 text-amber-800 border-amber-200 font-bold";
      case "LOW": return "bg-green-100 text-green-700 border-green-200 font-bold";
      default: return "bg-slate-100 text-slate-700 border-slate-200 font-bold";
    }
  };

  const activeAnomaly = anomalies.length > 0 ? anomalies[0] : null;

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* 1. HERO RISK SCORE DIAL / CARD */}
      <ScrollReveal delay={100} direction="left">
        <div className="control-card p-6 border-l-4 border-l-orange-500 flex flex-col md:flex-row items-center justify-between gap-6 bg-white">
          <div className="flex items-center space-x-6">
            <div className="relative flex items-center justify-center w-28 h-28 rounded-full border-4 border-orange-200 bg-orange-50">
              <div className="text-center">
                <span className="text-4xl font-extrabold text-gray-900 font-sans">{riskData?.risk_score ?? "--"}</span>
                <div className="text-xs text-gray-500 font-semibold">/ 100</div>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900 font-sans">GRID RISK SCORE</h1>
                <span className="px-3 py-1 rounded-full text-orange-700 font-bold text-xs tracking-wider bg-orange-100 border border-orange-200">
                  {riskData?.risk_level || "CALCULATING"}
                </span>
              </div>
              <p className="text-xs text-gray-600 font-medium mt-1.5 max-w-md leading-relaxed">
                System grid stress is evaluated continuously against LightGBM 24h demand predictions and sub-station thermal capacities.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5 font-sans w-full md:w-auto">
            <div className="flex justify-between space-x-6">
              <span className="text-slate-500 font-semibold">Target Grid Capacity:</span>
              <span className="text-slate-900 font-bold">9,800 MW</span>
            </div>
            <div className="flex justify-between space-x-6">
              <span className="text-slate-500 font-semibold">Peak Demand Load:</span>
              <span className="text-slate-900 font-bold">{dashboard?.tomorrow_peak ? `${Math.round(dashboard.tomorrow_peak).toLocaleString()} MW` : "--"}</span>
            </div>
            <div className="flex justify-between space-x-6">
              <span className="text-slate-500 font-semibold">Critical Window:</span>
              <span className="text-slate-900 font-bold">{dashboard?.critical_window || "Live Stream"}</span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 2. RISK CONTRIBUTORS & FUTURE TIMELINE */}
      <ScrollReveal delay={200} direction="up">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Risk Contributors */}
          <div className="control-card p-6 border border-gray-100 bg-white">
            <h2 className="text-sm font-bold text-gray-900 font-sans uppercase tracking-wider mb-4 flex items-center">
              <ShieldAlert className="w-4 h-4 mr-2 text-orange-500" />
              RISK CONTRIBUTORS BREAKDOWN
            </h2>

            <div className="space-y-4">
              {riskContributors.map((c: any, i: number) => {
                const weight = c.weight || c.value;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1.5 font-sans">
                      <span className="text-gray-700 font-semibold">{c.name}</span>
                      <span className="text-gray-900 font-bold">{weight}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className={`${c.color || 'bg-blue-600'} h-full rounded-full transition-all duration-500`} style={{ width: `${weight}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Future Risk Timeline */}
          <div className="control-card p-6 border border-gray-100 bg-white">
            <h2 className="text-sm font-bold text-gray-900 font-sans uppercase tracking-wider mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-blue-600" />
              FUTURE RISK TIMELINE (NEXT 24H)
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {timeline.map((t: any, i: number) => (
                <div
                  key={i}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-between space-y-2 text-center"
                >
                  <span className="text-xs text-gray-500 font-semibold">{t.time}</span>
                  <span className="text-2xl font-extrabold text-gray-900 font-sans">{t.score || t.risk_score}</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${getBadgeClass(t.level || t.risk_level)}`}>
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
        <div className="control-card p-6 border-l-4 border-l-blue-600 bg-white mt-6">
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-semibold uppercase mb-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>ANOMALY DETECTED (STATISTICAL RESIDUAL ENGINE)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-gray-500 font-semibold mb-1 uppercase">Detection Window</div>
              <div className="text-lg font-bold text-gray-900 font-sans">{activeAnomaly?.timestamp || "--"}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-gray-500 font-semibold mb-1 uppercase">Expected Baseline</div>
              <div className="text-lg font-bold text-gray-900 font-sans">{activeAnomaly?.expected_load ? `${Math.round(activeAnomaly.expected_load).toLocaleString()} MW` : "--"}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-gray-500 font-semibold mb-1 uppercase">Observed Telemetry</div>
              <div className="text-lg font-bold text-gray-900 font-sans">{activeAnomaly?.observed_load ? `${Math.round(activeAnomaly.observed_load).toLocaleString()} MW` : "--"}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-gray-500 font-semibold mb-1 uppercase">Residual Deviation</div>
              <div className="text-lg font-bold text-gray-900 font-sans">{activeAnomaly?.deviation ? `+${Math.round(activeAnomaly.deviation).toLocaleString()} MW (${activeAnomaly.severity})` : "--"}</div>
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex text-xs text-blue-900">
            <span className="text-blue-950 font-bold mr-2">Root Cause:</span> 
            {activeAnomaly?.why || "Observed demand telemetry evaluated against model residual thresholds."}
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};