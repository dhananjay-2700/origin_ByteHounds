"use client";

import React, { useState, useEffect } from "react";
import { Map, MapPin, AlertCircle, ChevronRight, Info, Zap } from "lucide-react";
import { ScrollReveal } from "./ScrollLayout";
import { API_ENDPOINTS } from "../lib/api";

export const GeographicView: React.FC = () => {
  const [selectedAreaId, setSelectedAreaId] = useState<string>("South Delhi");
  const [areas, setAreas] = useState<any[]>([]);
  const [activeArea, setActiveArea] = useState<any>(null);

  const getBadgeStyle = (level: string) => {
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

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.areas);
        const data = await res.json();
        const formattedAreas = data.map((a: any, idx: number) => {
          const predLoad = a.predicted_load ?? a.currentLoadMW ?? a.current_load ?? 0;
          const cap = a.capacity ?? a.capacityMW ?? 0;
          const util = a.utilization ?? a.utilizationPercent ?? 0;
          const rLevel = a.risk_level ?? a.riskLevel ?? "MODERATE";
          const score = a.risk_score ?? Math.round(util);
          const driver = a.main_driver ?? a.hotspotIssue ?? a.description ?? "Thermal Cooling Demand";
          const windowStr = a.critical_window ?? a.peakTime ?? "10:00 IST";

          return {
            id: a.id,
            name: a.name,
            rank: idx + 1,
            score: score,
            status: rLevel,
            badgeColor: rLevel === "CRITICAL" ? "bg-white text-black font-bold" : 
                       rLevel === "HIGH" ? "bg-gray-300 text-black font-bold" :
                       rLevel === "MODERATE" ? "bg-gray-500 text-white font-bold" : "bg-gray-700 text-white font-bold",
            borderColor: rLevel === "CRITICAL" ? "border-white" :
                        rLevel === "HIGH" ? "border-gray-300" :
                        rLevel === "MODERATE" ? "border-gray-500" : "border-gray-700",
            demand: `${Number(predLoad).toLocaleString()} MW`,
            capacity: `${Number(cap).toLocaleString()} MW`,
            utilization: `${util}%`,
            driver: driver,
            window: windowStr,
            feeders: []
          };
        });
        setAreas(formattedAreas);
        if (formattedAreas.length > 0) {
          fetchAreaDetail(formattedAreas[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch areas", err);
      }
    };
    fetchAreas();
  }, []);

  const fetchAreaDetail = async (id: string) => {
    setSelectedAreaId(id);
    try {
      const res = await fetch(API_ENDPOINTS.areaDetail(id));
      const data = await res.json();

      const predLoad = data.predicted_load ?? data.currentLoadMW ?? data.current_load ?? 0;
      const cap = data.capacity ?? data.capacityMW ?? 0;
      const util = data.utilization ?? data.utilizationPercent ?? 0;
      const rLevel = data.risk_level ?? data.riskLevel ?? "MODERATE";
      const score = data.risk_score ?? Math.round(util);
      const driver = data.main_driver ?? data.hotspotIssue ?? data.description ?? "Thermal Cooling Demand";
      const windowStr = data.critical_window ?? data.peakTime ?? "10:00 IST";
      const rawFeeders = Array.isArray(data.feeders) ? data.feeders : [
        { name: `${data.name || 'Regional'} Primary Feeder 1`, current_load: Math.round(predLoad * 0.55), capacity: Math.round(cap * 0.5), status: rLevel },
        { name: `${data.name || 'Regional'} Secondary Feeder 2`, current_load: Math.round(predLoad * 0.45), capacity: Math.round(cap * 0.5), status: rLevel === "CRITICAL" ? "WARNING" : "NORMAL" },
      ];

      setActiveArea({
        id: data.id,
        name: data.name,
        score: score,
        status: rLevel,
        badgeColor: rLevel === "CRITICAL" ? "bg-white text-black font-bold" : 
                   rLevel === "HIGH" ? "bg-gray-300 text-black font-bold" :
                   rLevel === "MODERATE" ? "bg-gray-500 text-white font-bold" : "bg-gray-700 text-white font-bold",
        demand: `${Number(predLoad).toLocaleString()} MW`,
        capacity: `${Number(cap).toLocaleString()} MW`,
        utilization: `${util}%`,
        driver: driver,
        window: windowStr,
        feeders: rawFeeders.map((f: any) => ({
          name: f.name,
          current: `${Number(f.current_load ?? f.current ?? 0).toLocaleString()} MW`,
          cap: `${Number(f.capacity ?? f.cap ?? 0).toLocaleString()} MW`,
          status: f.status || "NORMAL",
          statusColor: f.status === "CRITICAL" ? "text-white font-bold" : 
                      f.status === "WARNING" ? "text-gray-300" : "text-gray-500"
        }))
      });
    } catch (err) {
      console.error("Failed to fetch area detail", err);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Top Banner with Disclaimer */}
      <ScrollReveal delay={100} direction="up">
        <div className="control-card p-6 border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">
              <Map className="w-4 h-4 text-blue-600" />
              <span>SPATIAL GRID INTELLIGENCE</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 font-sans">Delhi Grid Regional Risk Distribution</h1>
            <p className="text-xs text-gray-500 font-medium">Modeled electricity load and feeder stress across Delhi administrative zones</p>
          </div>

          {/* Operational Telemetry Disclaimer Pill */}
          <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold">“Modeled / simulated area intelligence”</span>
          </div>
        </div>
      </ScrollReveal>

      {/* Map & Ranking Section */}
      <ScrollReveal delay={200} direction="up">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* DELHI MAP VISUALIZATION (7 cols) */}
          <div className="lg:col-span-7 control-card p-6 border border-gray-100 bg-white relative flex flex-col justify-between min-h-[420px]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">DELHI GRID REGIONAL MAP</span>
              <span className="text-xs text-blue-600 font-semibold">Select region for feeder details</span>
            </div>

            {/* Interactive SVG Regional Diagram */}
            <div className="relative w-full h-[350px] bg-slate-100 rounded-2xl overflow-hidden border border-gray-200">
              {/* Real Interactive Map of Delhi */}
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight={0} 
                marginWidth={0} 
                src="https://www.openstreetmap.org/export/embed.html?bbox=76.84,28.40,77.34,28.88&amp;layer=mapnik" 
                style={{ border: 0, opacity: 0.85 }}
                className="absolute inset-0 pointer-events-none"
              ></iframe>
              
              {/* Interactive Data Overlay */}
              <svg viewBox="0 0 800 350" className="absolute inset-0 w-full h-full drop-shadow-xl z-10">
                {/* North Delhi Marker */}
                <g onClick={() => fetchAreaDetail("North Delhi")} className="cursor-pointer group transition-all duration-300">
                  <circle cx="450" cy="80" r="25" className={`transition-colors duration-500 ${selectedAreaId === "North Delhi" ? 'fill-blue-600' : 'fill-slate-900'} hover:fill-blue-700`} />
                  <circle cx="450" cy="80" r="6" className="fill-white" />
                  <text x="450" y="125" fill="#0f172a" className="text-xs font-bold font-sans pointer-events-none drop-shadow-sm" textAnchor="middle">North Delhi</text>
                  <text x="450" y="140" fill="#f97316" className="text-[10px] font-bold font-sans pointer-events-none drop-shadow-sm" textAnchor="middle">78 HIGH</text>
                </g>

                {/* South Delhi Marker */}
                <g onClick={() => fetchAreaDetail("South Delhi")} className="cursor-pointer group transition-all duration-300">
                  <circle cx="430" cy="280" r="25" className={`transition-colors duration-500 ${selectedAreaId === "South Delhi" ? 'fill-red-600' : 'fill-slate-900'} hover:fill-red-700`} />
                  <circle cx="430" cy="280" r="6" className="fill-white animate-pulse" />
                  <text x="430" y="325" fill="#0f172a" className="text-xs font-bold font-sans pointer-events-none drop-shadow-sm" textAnchor="middle">South Delhi</text>
                  <text x="430" y="340" fill="#ef4444" className="text-[10px] font-bold font-sans pointer-events-none drop-shadow-sm" textAnchor="middle">86 CRITICAL</text>
                </g>

                {/* East Delhi Marker */}
                <g onClick={() => fetchAreaDetail("East Delhi")} className="cursor-pointer group transition-all duration-300">
                  <circle cx="600" cy="200" r="25" className={`transition-colors duration-500 ${selectedAreaId === "East Delhi" ? 'fill-amber-500' : 'fill-slate-900'} hover:fill-amber-600`} />
                  <circle cx="600" cy="200" r="6" className="fill-white" />
                  <text x="600" y="245" fill="#0f172a" className="text-xs font-bold font-sans pointer-events-none drop-shadow-sm" textAnchor="middle">East Delhi</text>
                  <text x="600" y="260" fill="#d97706" className="text-[10px] font-bold font-sans pointer-events-none drop-shadow-sm" textAnchor="middle">51 MOD</text>
                </g>

                {/* West Delhi Marker */}
                <g onClick={() => fetchAreaDetail("West Delhi")} className="cursor-pointer group transition-all duration-300">
                  <circle cx="280" cy="180" r="25" className={`transition-colors duration-500 ${selectedAreaId === "West Delhi" ? 'fill-blue-600' : 'fill-slate-900'} hover:fill-blue-700`} />
                  <circle cx="280" cy="180" r="6" className="fill-white" />
                  <text x="280" y="225" fill="#0f172a" className="text-xs font-bold font-sans pointer-events-none drop-shadow-sm" textAnchor="middle">West Delhi</text>
                  <text x="280" y="240" fill="#2563eb" className="text-[10px] font-bold font-sans pointer-events-none drop-shadow-sm" textAnchor="middle">64 HIGH</text>
                </g>
              </svg>
            </div>

            {/* Area Ranking List */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">AREA RISK RANKING</span>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                {areas.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => fetchAreaDetail(a.id)}
                    className={`shrink-0 snap-start control-card p-4 border w-40 text-left transition-all cursor-pointer ${
                      selectedAreaId === a.id 
                        ? 'border-blue-500 bg-blue-50/60 shadow-md' 
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1.5 text-xs text-gray-500 font-semibold">
                      <span>{a.rank}.</span>
                      <span className="truncate">{a.name.split(" ")[0]}</span>
                    </div>
                    <div className="text-2xl font-extrabold text-gray-900 font-sans">{a.score}</div>
                    <div className="text-[10px] font-bold uppercase text-gray-500 mt-1">{a.status}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SELECTED AREA DETAIL DRAWER (5 cols) */}
          <div className="lg:col-span-5 control-card p-6 border border-gray-100 bg-white flex flex-col justify-between">
            {activeArea && (
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 font-sans">{activeArea.id}</h2>
                    <span className="text-xs text-gray-500">Detailed Regional Telemetry</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                    {activeArea.score} / 100 {activeArea.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between border-b border-gray-100 pb-2.5 text-xs">
                    <span className="text-gray-500 font-semibold">Forecast Demand:</span>
                    <span className="text-gray-900 font-bold">{activeArea.demand}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2.5 text-xs">
                    <span className="text-gray-500 font-semibold">Grid Capacity:</span>
                    <span className="text-gray-900 font-bold">{activeArea.capacity}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2.5 text-xs">
                    <span className="text-gray-500 font-semibold">Utilization Rate:</span>
                    <span className="text-gray-900 font-bold">{activeArea.utilization}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2.5 text-xs">
                    <span className="text-gray-500 font-semibold">Main Risk Driver:</span>
                    <span className="text-gray-900 font-bold">{activeArea.driver}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2.5 text-xs">
                    <span className="text-gray-500 font-semibold">Critical Window:</span>
                    <span className="text-gray-900 font-bold">{activeArea.window}</span>
                  </div>
                </div>

                {/* Feeder Breakdown */}
                <div className="mt-6">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">
                    SUB-FEEDER TELEMETRY BREAKDOWN
                  </span>
                  <div className="space-y-3">
                    {activeArea.feeders.map((f: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div>
                          <div className="text-gray-900 font-bold text-sm">{f.name}</div>
                          <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                            Curr: {f.current} | Cap: {f.cap}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-900 font-bold text-xs mb-0.5">{f.current}</div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{f.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-3 border-t border-gray-100 text-[11px] text-gray-400 text-center italic font-medium">
              “Modeled / simulated area intelligence”
            </div>
          </div>

        </div>
      </ScrollReveal>
    </div>
  );
};