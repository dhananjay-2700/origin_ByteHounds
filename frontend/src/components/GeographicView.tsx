"use client";

import React, { useState, useEffect } from "react";
import { Map, MapPin, AlertCircle, ChevronRight, Info } from "lucide-react";
import { ScrollReveal } from "./ScrollLayout";

export const GeographicView: React.FC = () => {
  const [selectedAreaId, setSelectedAreaId] = useState<string>("South Delhi");

  const [areas, setAreas] = useState<any[]>([]);
  const [activeArea, setActiveArea] = useState<any>(null);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/areas");
        const data = await res.json();
        const formattedAreas = data.map((a: any, idx: number) => ({
          id: a.id,
          name: a.name,
          rank: idx + 1,
          score: a.risk_score,
          status: a.risk_level,
          badgeColor: a.risk_level === "CRITICAL" ? "bg-white text-black font-bold" : 
                     a.risk_level === "HIGH" ? "bg-gray-300 text-black font-bold" :
                     a.risk_level === "MODERATE" ? "bg-gray-500 text-white font-bold" : "bg-gray-700 text-white font-bold",
          borderColor: a.risk_level === "CRITICAL" ? "border-white" :
                      a.risk_level === "HIGH" ? "border-gray-300" :
                      a.risk_level === "MODERATE" ? "border-gray-500" : "border-gray-700",
          demand: `${a.predicted_load.toLocaleString()} MW`,
          capacity: `${a.capacity.toLocaleString()} MW`,
          utilization: `${a.utilization}%`,
          driver: a.main_driver,
          window: a.critical_window,
          feeders: []
        }));
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
      const res = await fetch(`http://127.0.0.1:8000/api/areas/${id}`);
      const data = await res.json();
      setActiveArea({
        id: data.id,
        name: data.name,
        score: data.risk_score,
        status: data.risk_level,
        badgeColor: data.risk_level === "CRITICAL" ? "bg-white text-black font-bold" : 
                   data.risk_level === "HIGH" ? "bg-gray-300 text-black font-bold" :
                   data.risk_level === "MODERATE" ? "bg-gray-500 text-white font-bold" : "bg-gray-700 text-white font-bold",
        demand: `${data.predicted_load.toLocaleString()} MW`,
        capacity: `${data.capacity.toLocaleString()} MW`,
        utilization: `${data.utilization}%`,
        driver: data.main_driver,
        window: data.critical_window,
        feeders: data.feeders.map((f: any) => ({
          name: f.name,
          current: `${f.current_load} MW`,
          cap: `${f.capacity} MW`,
          status: f.status,
          statusColor: f.status === "CRITICAL" ? "text-white font-bold" : 
                      f.status === "WARNING" ? "text-gray-300" : "text-gray-500"
        }))
      });
    } catch (err) {
      console.error("Failed to fetch area detail", err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner with Disclaimer */}
      <ScrollReveal delay={100} direction="up">
        <div className="control-card p-6 border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-bold uppercase mb-1">
            <Map className="w-4 h-4" />
            <span>SPATIAL GRID INTELLIGENCE</span>
          </div>
          <h1 className="text-xl font-bold text-white font-mono">Delhi Grid Regional Risk Distribution</h1>
          <p className="text-xs text-gray-400">Modeled electricity load and feeder stress across Delhi administrative zones</p>
        </div>

        {/* Operational Telemetry Disclaimer Pill */}
        <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold">“Modeled / simulated area intelligence”</span>
        </div>
        </div>
      </ScrollReveal>

      {/* Map & Ranking Section */}
      <ScrollReveal delay={200} direction="up">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* DELHI MAP VISUALIZATION (7 cols) */}
        <div className="lg:col-span-7 control-card p-6 border border-gray-800 relative flex flex-col justify-between min-h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-gray-400 uppercase">DELHI GRID REGIONAL MAP</span>
            <span className="text-[10px] text-cyan-400 font-mono">Select region for feeder details</span>
          </div>

          {/* Interactive SVG Regional Diagram */}
          <div className="relative w-full h-[350px] bg-black rounded-2xl overflow-hidden border border-gray-800">
            {/* Real Interactive Map of Delhi with Dark Mode Filter */}
            <iframe 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              scrolling="no" 
              marginHeight={0} 
              marginWidth={0} 
              src="https://www.openstreetmap.org/export/embed.html?bbox=76.84,28.40,77.34,28.88&amp;layer=mapnik" 
              style={{ border: 0, filter: 'invert(100%) hue-rotate(180deg) brightness(85%) contrast(110%) opacity(0.8)' }}
              className="absolute inset-0 pointer-events-none"
            ></iframe>
            
            {/* Interactive Data Overlay */}
            <svg viewBox="0 0 800 350" className="absolute inset-0 w-full h-full drop-shadow-2xl z-10">
              {/* North Delhi Marker */}
              <g onClick={() => fetchAreaDetail("North Delhi")} className="cursor-pointer group transition-all duration-300">
                <circle cx="450" cy="80" r="25" className={`transition-colors duration-500 ${selectedAreaId === "North Delhi" ? 'fill-gray-100' : 'fill-gray-900'} hover:fill-white`} />
                <circle cx="450" cy="80" r="6" className="fill-black" />
                <text x="450" y="125" fill="white" className="text-sm font-bold font-sans pointer-events-none drop-shadow-md" textAnchor="middle">North Delhi</text>
                <text x="450" y="140" fill="#ccc" className="text-[10px] font-bold font-mono pointer-events-none drop-shadow-md" textAnchor="middle">78 HIGH</text>
              </g>

              {/* South Delhi Marker */}
              <g onClick={() => fetchAreaDetail("South Delhi")} className="cursor-pointer group transition-all duration-300">
                <circle cx="430" cy="280" r="25" className={`transition-colors duration-500 ${selectedAreaId === "South Delhi" ? 'fill-white' : 'fill-gray-900'} hover:fill-gray-200`} />
                <circle cx="430" cy="280" r="6" className="fill-black animate-pulse" />
                <text x="430" y="325" fill="white" className="text-sm font-bold font-sans pointer-events-none drop-shadow-md" textAnchor="middle">South Delhi</text>
                <text x="430" y="340" fill="#fff" className="text-[10px] font-bold font-mono pointer-events-none drop-shadow-md" textAnchor="middle">86 CRITICAL</text>
              </g>

              {/* East Delhi Marker */}
              <g onClick={() => fetchAreaDetail("East Delhi")} className="cursor-pointer group transition-all duration-300">
                <circle cx="600" cy="200" r="25" className={`transition-colors duration-500 ${selectedAreaId === "East Delhi" ? 'fill-gray-100' : 'fill-gray-900'} hover:fill-white`} />
                <circle cx="600" cy="200" r="6" className="fill-black" />
                <text x="600" y="245" fill="white" className="text-sm font-bold font-sans pointer-events-none drop-shadow-md" textAnchor="middle">East Delhi</text>
                <text x="600" y="260" fill="#ccc" className="text-[10px] font-bold font-mono pointer-events-none drop-shadow-md" textAnchor="middle">51 MOD</text>
              </g>

              {/* West Delhi Marker */}
              <g onClick={() => fetchAreaDetail("West Delhi")} className="cursor-pointer group transition-all duration-300">
                <circle cx="280" cy="180" r="25" className={`transition-colors duration-500 ${selectedAreaId === "West Delhi" ? 'fill-gray-100' : 'fill-gray-900'} hover:fill-white`} />
                <circle cx="280" cy="180" r="6" className="fill-black" />
                <text x="280" y="225" fill="white" className="text-sm font-bold font-sans pointer-events-none drop-shadow-md" textAnchor="middle">West Delhi</text>
                <text x="280" y="240" fill="#ccc" className="text-[10px] font-bold font-mono pointer-events-none drop-shadow-md" textAnchor="middle">64 HIGH</text>
              </g>
            </svg>
          </div>

          {/* Area Ranking List */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <span className="text-xs font-mono text-gray-400 uppercase mb-2 block">AREA RISK RANKING</span>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                {areas.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => fetchAreaDetail(a.id)}
                    className={`shrink-0 snap-start control-card p-4 border w-40 text-left transition-all ${selectedAreaId === a.id ? 'border-white bg-gray-900' : 'border-gray-800 bg-black hover:border-gray-600 hover:bg-gray-900'}`}
                  >
                    <div className="flex items-center space-x-2 mb-2 text-xs text-gray-500 font-mono">
                      <span>{a.rank}.</span>
                      <span className="truncate">{a.name.split(" ")[0]}</span>
                    </div>
                    <div className="text-2xl font-extrabold text-white font-mono">{a.score}</div>
                    <div className="text-[10px] uppercase text-gray-400 mt-1">{a.status}</div>
                  </button>
                ))}
              </div>
          </div>
        </div>

        {/* SELECTED AREA DETAIL DRAWER (5 cols) */}
        <div className="lg:col-span-5 control-card p-6 border border-gray-800 flex flex-col justify-between">
          {activeArea && (
            <div>
              <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white font-mono">{activeArea.id}</h2>
                  <span className="text-xs text-gray-400">Detailed Regional Telemetry</span>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs ${activeArea.badgeColor}`}>
                  {activeArea.score} / 100 {activeArea.status}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-500 font-mono text-xs">Forecast Demand:</span>
                  <span className="text-white font-mono text-sm font-bold">{activeArea.demand}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-500 font-mono text-xs">Grid Capacity:</span>
                  <span className="text-white font-mono text-sm font-bold">{activeArea.capacity}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-500 font-mono text-xs">Utilization Rate:</span>
                  <span className="text-white font-mono text-sm font-bold">{activeArea.utilization}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-500 font-mono text-xs">Main Risk Driver:</span>
                  <span className="text-white font-mono text-sm font-bold">{activeArea.driver}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-500 font-mono text-xs">Critical Window:</span>
                  <span className="text-white font-mono text-sm font-bold">{activeArea.window}</span>
                </div>
              </div>

              {/* Feeder Breakdown */}
              <div className="mt-6">
                <span className="text-xs font-mono text-gray-300 uppercase block mb-2 font-bold">
                  SUB-FEEDER TELEMETRY BREAKDOWN
                </span>
                <div className="space-y-3">
                  {activeArea.feeders.map((f: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-black border border-gray-800 rounded">
                      <div>
                        <div className="text-white font-bold font-mono text-sm">{f.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                          Curr: {f.current} | Cap: {f.cap}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold font-mono text-xs mb-0.5">{f.current}</div>
                        <div className={`text-[10px] font-bold font-mono uppercase tracking-widest ${f.statusColor}`}>{f.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-3 border-t border-gray-800 text-[11px] text-gray-400 text-center italic font-mono">
            “Modeled / simulated area intelligence”
          </div>
        </div>

        </div>
      </ScrollReveal>
    </div>
  );
};
