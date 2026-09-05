"use client";

import React, { useState, useEffect } from "react";
import { Map, MapPin, AlertCircle, ChevronRight, Info, Zap } from "lucide-react";
import { ScrollReveal } from "./ScrollLayout";
import { API_ENDPOINTS } from "../lib/api";

const DEFAULT_AREAS = [
  {
    id: "South Delhi",
    name: "South Delhi Grid",
    rank: 1,
    score: 86,
    status: "CRITICAL",
    badgeColor: "bg-red-500/20 text-red-400 border border-red-500/40",
    demand: "2,744 MW",
    capacity: "2,940 MW",
    utilization: "93.3%",
    driver: "High Residential AC Density",
    window: "08:00 — 19:00",
    feeders: [
      { name: "South Delhi Feeder 1", current: "1,372 MW", cap: "1,470 MW", status: "CRITICAL", statusColor: "text-red-400" },
      { name: "South Delhi Feeder 2", current: "1,372 MW", cap: "1,470 MW", status: "CRITICAL", statusColor: "text-red-400" }
    ]
  },
  {
    id: "North Delhi",
    name: "North Delhi Grid",
    rank: 2,
    score: 78,
    status: "HIGH",
    badgeColor: "bg-[#FF7C1E]/20 text-[#FF7C1E] border border-[#FF7C1E]/40",
    demand: "2,450 MW",
    capacity: "2,744 MW",
    utilization: "89.2%",
    driver: "Commercial & Industrial Ramp",
    window: "08:00 — 19:00",
    feeders: [
      { name: "North Delhi Feeder 1", current: "1,225 MW", cap: "1,372 MW", status: "HIGH", statusColor: "text-[#FF7C1E]" },
      { name: "North Delhi Feeder 2", current: "1,225 MW", cap: "1,372 MW", status: "HIGH", statusColor: "text-[#FF7C1E]" }
    ]
  },
  {
    id: "East Delhi",
    name: "East Delhi Grid",
    rank: 3,
    score: 80,
    status: "HIGH",
    badgeColor: "bg-[#FF7C1E]/20 text-[#FF7C1E] border border-[#FF7C1E]/40",
    demand: "2,254 MW",
    capacity: "2,450 MW",
    utilization: "92.0%",
    driver: "Sub-station Transformer Heating",
    window: "08:00 — 19:00",
    feeders: [
      { name: "East Delhi Feeder 1", current: "1,127 MW", cap: "1,225 MW", status: "HIGH", statusColor: "text-[#FF7C1E]" },
      { name: "East Delhi Feeder 2", current: "1,127 MW", cap: "1,225 MW", status: "HIGH", statusColor: "text-[#FF7C1E]" }
    ]
  },
  {
    id: "West Delhi",
    name: "West Delhi Grid",
    rank: 4,
    score: 75,
    status: "MODERATE",
    badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
    demand: "2,352 MW",
    capacity: "2,744 MW",
    utilization: "85.7%",
    driver: "Domestic Inverter Loads",
    window: "08:00 — 19:00",
    feeders: [
      { name: "West Delhi Feeder 1", current: "1,176 MW", cap: "1,372 MW", status: "MODERATE", statusColor: "text-amber-400" },
      { name: "West Delhi Feeder 2", current: "1,176 MW", cap: "1,372 MW", status: "MODERATE", statusColor: "text-amber-400" }
    ]
  }
];

export const GeographicView: React.FC = () => {
  const [selectedAreaId, setSelectedAreaId] = useState<string>("South Delhi");
  const [areas, setAreas] = useState<any[]>(DEFAULT_AREAS);
  const [activeArea, setActiveArea] = useState<any>(DEFAULT_AREAS[0]);

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
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const formattedAreas = data.map((a: any, idx: number) => ({
              id: a.id,
              name: a.name,
              rank: idx + 1,
              score: a.risk_score,
              status: a.risk_level,
              badgeColor: getBadgeStyle(a.risk_level),
              demand: `${Math.round(a.predicted_load).toLocaleString()} MW`,
              capacity: `${Math.round(a.capacity).toLocaleString()} MW`,
              utilization: `${a.utilization}%`,
              driver: a.main_driver,
              window: a.critical_window,
              feeders: []
            }));
            setAreas(formattedAreas);
            fetchAreaDetail(formattedAreas[0].id);
          }
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
      const feedersList = data.feeders || [];
      setActiveArea({
        id: data.id,
        name: data.name,
        score: data.risk_score,
        status: data.risk_level,
        badgeColor: getBadgeStyle(data.risk_level),
        demand: `${data.predicted_load.toLocaleString()} MW`,
        capacity: `${data.capacity.toLocaleString()} MW`,
        utilization: `${data.utilization}%`,
        driver: data.main_driver,
        window: data.critical_window,
        feeders: feedersList.map((f: any) => ({
          name: f.name || f.id,
          current: `${f.current_load} MW`,
          cap: `${f.capacity} MW`,
          status: f.status || f.risk || "NORMAL",
          statusColor: (f.status || f.risk) === "CRITICAL" ? "text-red-400" : 
                      (f.status || f.risk) === "HIGH" || (f.status || f.risk) === "WARNING" ? "text-[#FF7C1E]" : "text-emerald-400"
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
        <div className="control-card p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-[#FF7C1E] text-xs font-black uppercase tracking-widest mb-2">
              <Map className="w-4 h-4" />
              <span>SPATIAL GRID INTELLIGENCE</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Delhi Grid Regional Risk Distribution</h1>
            <p className="text-xs md:text-sm text-gray-400 mt-1 font-normal">
              Modeled electricity load and feeder stress across Delhi administrative zones
            </p>
          </div>

          {/* Operational Telemetry Disclaimer Pill */}
          <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-medium">
            <Info className="w-4 h-4 text-[#FF7C1E] shrink-0" />
            <span>Modeled / simulated area intelligence</span>
          </div>
        </div>
      </ScrollReveal>

      {/* Map & Ranking Section */}
      <ScrollReveal delay={200} direction="up">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* DELHI MAP VISUALIZATION (7 cols) */}
          <div className="lg:col-span-7 control-card p-8 relative flex flex-col justify-between min-h-[440px]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">REGIONAL TOPOLOGY</span>
                <h3 className="text-base font-black text-white tracking-tight">Zone Telemetry Map</h3>
              </div>
              <span className="text-xs text-[#FF7C1E] font-semibold">Select marker to inspect</span>
            </div>

            {/* Interactive Regional Diagram */}
            <div className="relative w-full h-[340px] bg-black/80 rounded-2xl overflow-hidden border border-white/10">
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight={0} 
                marginWidth={0} 
                src="https://www.openstreetmap.org/export/embed.html?bbox=76.84,28.40,77.34,28.88&amp;layer=mapnik" 
                style={{ border: 0, filter: 'invert(100%) hue-rotate(180deg) brightness(80%) contrast(110%) opacity(0.7)' }}
                className="absolute inset-0 pointer-events-none"
              />
              
              {/* Interactive Data Overlay */}
              <svg viewBox="0 0 800 340" className="absolute inset-0 w-full h-full drop-shadow-2xl z-10">
                {/* North Delhi Marker */}
                <g onClick={() => fetchAreaDetail("North Delhi")} className="cursor-pointer group">
                  <circle 
                    cx="450" 
                    cy="80" 
                    r="24" 
                    className={`transition-all duration-300 ${selectedAreaId === "North Delhi" ? 'fill-[#FF7C1E] stroke-white stroke-2' : 'fill-black/80 stroke-white/20 stroke-1'} hover:fill-[#FF7C1E]`} 
                  />
                  <circle cx="450" cy="80" r="5" className={selectedAreaId === "North Delhi" ? "fill-black" : "fill-[#FF7C1E]"} />
                  <text x="450" y="122" fill="white" className="text-xs font-black pointer-events-none drop-shadow-md" textAnchor="middle">North Delhi</text>
                  <text x="450" y="136" fill="#FF7C1E" className="text-[10px] font-bold pointer-events-none drop-shadow-md" textAnchor="middle">78 HIGH</text>
                </g>

                {/* South Delhi Marker */}
                <g onClick={() => fetchAreaDetail("South Delhi")} className="cursor-pointer group">
                  <circle 
                    cx="430" 
                    cy="250" 
                    r="26" 
                    className={`transition-all duration-300 ${selectedAreaId === "South Delhi" ? 'fill-[#FF7C1E] stroke-white stroke-2' : 'fill-black/80 stroke-red-500/40 stroke-2'} hover:fill-[#FF7C1E]`} 
                  />
                  <circle cx="430" cy="250" r="6" className="fill-red-500 animate-pulse" />
                  <text x="430" y="295" fill="white" className="text-xs font-black pointer-events-none drop-shadow-md" textAnchor="middle">South Delhi</text>
                  <text x="430" y="309" fill="#ef4444" className="text-[10px] font-black pointer-events-none drop-shadow-md" textAnchor="middle">86 CRITICAL</text>
                </g>

                {/* East Delhi Marker */}
                <g onClick={() => fetchAreaDetail("East Delhi")} className="cursor-pointer group">
                  <circle 
                    cx="600" 
                    cy="180" 
                    r="24" 
                    className={`transition-all duration-300 ${selectedAreaId === "East Delhi" ? 'fill-[#FF7C1E] stroke-white stroke-2' : 'fill-black/80 stroke-white/20 stroke-1'} hover:fill-[#FF7C1E]`} 
                  />
                  <circle cx="600" cy="180" r="5" className={selectedAreaId === "East Delhi" ? "fill-black" : "fill-amber-400"} />
                  <text x="600" y="222" fill="white" className="text-xs font-black pointer-events-none drop-shadow-md" textAnchor="middle">East Delhi</text>
                  <text x="600" y="236" fill="#f59e0b" className="text-[10px] font-bold pointer-events-none drop-shadow-md" textAnchor="middle">51 MOD</text>
                </g>

                {/* West Delhi Marker */}
                <g onClick={() => fetchAreaDetail("West Delhi")} className="cursor-pointer group">
                  <circle 
                    cx="280" 
                    cy="170" 
                    r="24" 
                    className={`transition-all duration-300 ${selectedAreaId === "West Delhi" ? 'fill-[#FF7C1E] stroke-white stroke-2' : 'fill-black/80 stroke-white/20 stroke-1'} hover:fill-[#FF7C1E]`} 
                  />
                  <circle cx="280" cy="170" r="5" className={selectedAreaId === "West Delhi" ? "fill-black" : "fill-[#FF7C1E]"} />
                  <text x="280" y="212" fill="white" className="text-xs font-black pointer-events-none drop-shadow-md" textAnchor="middle">West Delhi</text>
                  <text x="280" y="226" fill="#FF7C1E" className="text-[10px] font-bold pointer-events-none drop-shadow-md" textAnchor="middle">64 HIGH</text>
                </g>
              </svg>
            </div>

            {/* Area Ranking Horizontal Cards */}
            <div className="mt-6 pt-5 border-t border-white/5">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 block">AREA RISK RANKING</span>
              <div className="flex gap-3.5 overflow-x-auto pb-2">
                {areas.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => fetchAreaDetail(a.id)}
                    className={`shrink-0 p-4.5 rounded-2xl border w-40 text-left transition-all duration-300 ${
                      selectedAreaId === a.id
                        ? "border-[#FF7C1E] bg-[#FF7C1E]/10 shadow-lg shadow-[#FF7C1E]/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-2 text-xs font-semibold text-gray-400">
                      <span>{a.rank}.</span>
                      <span className="truncate">{a.name.split(" ")[0]}</span>
                    </div>
                    <div className="text-3xl font-black text-white tracking-tight">{a.score}</div>
                    <div className={`text-[10px] uppercase font-black tracking-wider mt-1 px-2 py-0.5 rounded-full inline-block ${a.badgeColor}`}>
                      {a.status}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SELECTED AREA DETAIL DRAWER (5 cols) */}
          <div className="lg:col-span-5 control-card p-8 flex flex-col justify-between">
            {activeArea ? (
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">{activeArea.id}</h2>
                    <span className="text-xs text-gray-400">Detailed Regional Telemetry</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${activeArea.badgeColor}`}>
                    {activeArea.score} / 100 {activeArea.status}
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-xs text-gray-400 font-medium">Forecast Demand:</span>
                    <span className="text-sm font-black text-white">{activeArea.demand}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-xs text-gray-400 font-medium">Grid Capacity:</span>
                    <span className="text-sm font-black text-white">{activeArea.capacity}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-xs text-gray-400 font-medium">Utilization Rate:</span>
                    <span className="text-sm font-black text-[#FF7C1E]">{activeArea.utilization}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-xs text-gray-400 font-medium">Main Risk Driver:</span>
                    <span className="text-sm font-bold text-white">{activeArea.driver}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-xs text-gray-400 font-medium">Critical Window:</span>
                    <span className="text-sm font-bold text-white">{activeArea.window}</span>
                  </div>
                </div>

                {/* Feeder Breakdown */}
                <div className="mt-7">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-300 block mb-3">
                    SUB-FEEDER TELEMETRY BREAKDOWN
                  </span>
                  <div className="space-y-2.5">
                    {activeArea.feeders.map((f: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-3.5 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-white/20 transition">
                        <div>
                          <div className="text-white font-bold text-xs">{f.name}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Curr: {f.current} | Cap: {f.cap}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-black text-xs">{f.current}</div>
                          <div className={`text-[10px] font-black uppercase tracking-wider ${f.statusColor}`}>{f.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-gray-400 text-sm font-medium">
                Loading Regional Feeder Data...
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-white/5 text-[11px] text-gray-500 text-center font-medium">
              Modeled / simulated area intelligence based on regional transformer hierarchy
            </div>
          </div>

        </div>
      </ScrollReveal>
    </div>
  );
};
