"use client";

import React, { useState } from "react";
import { Map, MapPin, AlertCircle, ChevronRight, Info } from "lucide-react";

export const GeographicView: React.FC = () => {
  const [selectedAreaId, setSelectedAreaId] = useState<string>("South Delhi");

  const areas = [
    {
      id: "South Delhi",
      rank: 1,
      score: 86,
      status: "CRITICAL",
      badgeColor: "bg-rose-500 text-white font-bold",
      borderColor: "border-rose-500",
      demand: "2,140 MW",
      capacity: "2,280 MW",
      utilization: "94.0%",
      driver: "Extreme Temperature",
      window: "14:30 – 16:00",
      feeders: [
        { id: "SD-Feeder-1", current: "710 MW", forecast: "810 MW", cap: "850 MW", risk: "CRITICAL" },
        { id: "SD-Feeder-2", current: "650 MW", forecast: "740 MW", cap: "780 MW", risk: "HIGH" },
        { id: "SD-Feeder-3", current: "520 MW", forecast: "590 MW", cap: "650 MW", risk: "HIGH" },
      ]
    },
    {
      id: "North Delhi",
      rank: 2,
      score: 78,
      status: "HIGH",
      badgeColor: "bg-amber-500 text-black font-bold",
      borderColor: "border-amber-500",
      demand: "1,720 MW",
      capacity: "1,950 MW",
      utilization: "88.2%",
      driver: "Baseline Ramp",
      window: "14:15 – 15:45",
      feeders: [
        { id: "ND-Feeder-1", current: "810 MW", forecast: "910 MW", cap: "1,000 MW", risk: "HIGH" },
        { id: "ND-Feeder-2", current: "710 MW", forecast: "810 MW", cap: "950 MW", risk: "WATCH" },
      ]
    },
    {
      id: "West Delhi",
      rank: 3,
      score: 64,
      status: "HIGH",
      badgeColor: "bg-yellow-500 text-black font-bold",
      borderColor: "border-yellow-500",
      demand: "1,480 MW",
      capacity: "1,750 MW",
      utilization: "84.5%",
      driver: "Diurnal Peak",
      window: "14:45 – 16:15",
      feeders: [
        { id: "WD-Feeder-1", current: "680 MW", forecast: "760 MW", cap: "900 MW", risk: "WATCH" },
        { id: "WD-Feeder-2", current: "630 MW", forecast: "720 MW", cap: "850 MW", risk: "WATCH" },
      ]
    },
    {
      id: "East Delhi",
      rank: 4,
      score: 51,
      status: "MODERATE",
      badgeColor: "bg-emerald-500 text-black font-bold",
      borderColor: "border-emerald-500",
      demand: "1,280 MW",
      capacity: "1,600 MW",
      utilization: "80.0%",
      driver: "Humidity Load",
      window: "15:00 – 16:30",
      feeders: [
        { id: "ED-Feeder-1", current: "610 MW", forecast: "660 MW", cap: "800 MW", risk: "NORMAL" },
        { id: "ED-Feeder-2", current: "570 MW", forecast: "620 MW", cap: "800 MW", risk: "NORMAL" },
      ]
    },
  ];

  const activeArea = areas.find((a) => a.id === selectedAreaId) || areas[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner with Disclaimer */}
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

      {/* Map & Ranking Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* DELHI MAP VISUALIZATION (7 cols) */}
        <div className="lg:col-span-7 control-card p-6 border border-gray-800 relative flex flex-col justify-between min-h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-gray-400 uppercase">DELHI GRID REGIONAL MAP</span>
            <span className="text-[10px] text-cyan-400 font-mono">Select region for feeder details</span>
          </div>

          {/* Interactive SVG Regional Diagram */}
          <div className="relative w-full h-72 bg-gray-900/60 rounded-xl border border-gray-800 flex items-center justify-center p-4">
            <svg viewBox="0 0 500 350" className="w-full h-full max-h-72">
              {/* North Delhi */}
              <g
                onClick={() => setSelectedAreaId("North Delhi")}
                className={`cursor-pointer transition-all ${selectedAreaId === "North Delhi" ? "opacity-100 scale-105" : "opacity-80 hover:opacity-100"}`}
              >
                <polygon points="180,30 320,30 360,130 220,130" fill="#f59e0b" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="2" />
                <text x="260" y="70" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">North Delhi</text>
                <text x="260" y="90" fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle">78 HIGH</text>
              </g>

              {/* West Delhi */}
              <g
                onClick={() => setSelectedAreaId("West Delhi")}
                className={`cursor-pointer transition-all ${selectedAreaId === "West Delhi" ? "opacity-100 scale-105" : "opacity-80 hover:opacity-100"}`}
              >
                <polygon points="50,110 210,130 210,250 80,240" fill="#eab308" fillOpacity="0.2" stroke="#eab308" strokeWidth="2" />
                <text x="140" y="170" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">West Delhi</text>
                <text x="140" y="190" fill="#eab308" fontSize="11" fontWeight="bold" textAnchor="middle">64 HIGH</text>
              </g>

              {/* East Delhi */}
              <g
                onClick={() => setSelectedAreaId("East Delhi")}
                className={`cursor-pointer transition-all ${selectedAreaId === "East Delhi" ? "opacity-100 scale-105" : "opacity-80 hover:opacity-100"}`}
              >
                <polygon points="370,110 460,110 440,230 350,220" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="2" />
                <text x="405" y="160" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">East Delhi</text>
                <text x="405" y="180" fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle">51 MOD</text>
              </g>

              {/* South Delhi */}
              <g
                onClick={() => setSelectedAreaId("South Delhi")}
                className={`cursor-pointer transition-all ${selectedAreaId === "South Delhi" ? "opacity-100 scale-105" : "opacity-80 hover:opacity-100"}`}
              >
                <polygon points="220,145 340,140 340,320 200,310" fill="#f43f5e" fillOpacity="0.3" stroke="#f43f5e" strokeWidth="3" />
                <text x="270" y="210" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">South Delhi</text>
                <text x="270" y="230" fill="#f43f5e" fontSize="12" fontWeight="bold" textAnchor="middle">🔴 86 CRITICAL</text>
              </g>
            </svg>
          </div>

          {/* Area Ranking List */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <span className="text-xs font-mono text-gray-400 uppercase mb-2 block">AREA RISK RANKING</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {areas.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAreaId(a.id)}
                  className={`p-2 rounded-lg border text-left text-xs transition ${
                    selectedAreaId === a.id
                      ? "bg-gray-800 border-cyan-400 text-white"
                      : "bg-gray-900/60 border-gray-800 text-gray-300 hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex justify-between font-mono">
                    <span>{a.rank}. {a.id.split(" ")[0]}</span>
                    <span className="font-bold">{a.score}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{a.status}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SELECTED AREA DETAIL DRAWER (5 cols) */}
        <div className="lg:col-span-5 control-card p-6 border border-gray-800 flex flex-col justify-between">
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

            <div className="space-y-3 font-mono text-xs mb-6">
              <div className="flex justify-between p-2.5 bg-gray-900/60 rounded border border-gray-800">
                <span className="text-gray-400">Forecast Demand:</span>
                <span className="text-white font-bold">{activeArea.demand}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-gray-900/60 rounded border border-gray-800">
                <span className="text-gray-400">Grid Capacity:</span>
                <span className="text-gray-300 font-bold">{activeArea.capacity}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-gray-900/60 rounded border border-gray-800">
                <span className="text-gray-400">Utilization Rate:</span>
                <span className="text-amber-400 font-bold">{activeArea.utilization}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-gray-900/60 rounded border border-gray-800">
                <span className="text-gray-400">Main Risk Driver:</span>
                <span className="text-cyan-400 font-bold">{activeArea.driver}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-gray-900/60 rounded border border-gray-800">
                <span className="text-gray-400">Critical Window:</span>
                <span className="text-rose-400 font-bold">{activeArea.window}</span>
              </div>
            </div>

            {/* Feeder Breakdown */}
            <div>
              <span className="text-xs font-mono text-gray-300 uppercase block mb-2 font-bold">
                SUB-FEEDER TELEMETRY BREAKDOWN
              </span>
              <div className="space-y-2">
                {activeArea.feeders.map((f) => (
                  <div key={f.id} className="p-2.5 bg-gray-900/90 rounded border border-gray-800 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-gray-200 font-bold">{f.id}</span>
                      <div className="text-[10px] text-gray-400">Curr: {f.current} | Cap: {f.cap}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-300 font-bold">{f.forecast}</span>
                      <div className="text-[10px] text-rose-400">{f.risk}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-gray-800 text-[11px] text-gray-400 text-center italic font-mono">
            “Modeled / simulated area intelligence”
          </div>
        </div>

      </div>
    </div>
  );
};
