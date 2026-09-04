"use client";

import React from "react";
import { X, CheckCircle, Database, ShieldCheck } from "lucide-react";

interface DataHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataHealthModal: React.FC<DataHealthModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const metrics = [
    { name: "Load Data", score: 98, status: "Verified" },
    { name: "Weather Data", score: 95, status: "Verified" },
    { name: "Missing Values", score: 96, status: "Cleaned" },
    { name: "Timestamp Quality", score: 100, status: "Synchronized" },
    { name: "Duplicates", score: 99, status: "Filtered" },
    { name: "Data Freshness", score: 91, status: "Real-time" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg control-card border border-emerald-500/30 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-mono">DATA HEALTH INTELLIGENCE</h2>
              <p className="text-xs text-gray-400">Global Data Pipeline Validation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Banner */}
        <div className="flex items-center justify-between p-4 mb-5 bg-gradient-to-r from-emerald-950/60 to-emerald-900/20 rounded-xl border border-emerald-500/30">
          <div>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">94 / 100</div>
            <div className="text-xs font-semibold text-emerald-300 tracking-wider">EXCELLENT PIPELINE HEALTH</div>
          </div>
          <ShieldCheck className="w-10 h-10 text-emerald-400/80" />
        </div>

        {/* Sub-Metrics Grid */}
        <div className="space-y-2.5 mb-6">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 bg-gray-900/60 rounded-lg border border-gray-800/80"
            >
              <div className="flex items-center space-x-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-gray-200">{m.name}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-emerald-400/90 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                  {m.score}%
                </span>
                <span className="text-[10px] text-gray-400 font-mono uppercase">{m.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-800/80 pt-3">
          <span>Last validated:</span>
          <span className="font-mono text-gray-300">04 Sep 2026 · 18:42</span>
        </div>
      </div>
    </div>
  );
};
