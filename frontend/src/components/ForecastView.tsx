"use client";

import React, { useState, useEffect } from "react";
import { Activity, CheckCircle2, Cpu, BarChart2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea } from "recharts";
import { ScrollReveal } from "./ScrollLayout";

export const ForecastView: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<"all" | "xgb" | "baseline" | "lgb">("all");

  const [forecastSeries, setForecastSeries] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [forecastRes, accuracyRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/forecast"),
          fetch("http://127.0.0.1:8000/api/forecast/accuracy")
        ]);
        const forecastData = await forecastRes.json();
        const accuracyData = await accuracyRes.json();
        
        const series = forecastData.series.map((item: any) => ({
          time: item.timestamp,
          actual: item.actual_load,
          xgboost: item.predicted_load,
          baseline: item.baseline_load,
          lightgbm: item.lightgbm_load
        }));
        
        setForecastSeries(series);
        setMetrics(accuracyData);
      } catch (err) {
        console.error("Failed to fetch forecast data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <ScrollReveal delay={100}>
        <div className="control-card p-6 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>MACHINE LEARNING DEMAND PIPELINE</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 font-sans">24-Hour Electricity Demand Forecast</h1>
            <p className="text-xs text-gray-500">Comparing Previous Day Baseline and Trained LightGBM Model</p>
          </div>

          {/* Model Selector Buttons */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setSelectedModel("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedModel === "all" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Models
            </button>
            <button
              onClick={() => setSelectedModel("lgb")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedModel === "lgb" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              LightGBM
            </button>
            <button
              onClick={() => setSelectedModel("baseline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedModel === "baseline" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Baseline
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Main Interactive Forecast Chart */}
      <ScrollReveal delay={200}>
        <div className="control-card p-6 border border-gray-100">
          <div className="h-80 w-full">
            {forecastSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastSeries} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tick={{fill: '#64748b', fontSize: 11}} tickMargin={10} />
                <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{fill: '#64748b', fontSize: 11}} tickMargin={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', color: '#0f172a', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: '600' }}
                />
                
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', fontWeight: '500' }} />
                
                <Line type="monotone" dataKey="actual" name="Actual Load (MW)" stroke="#2563eb" strokeWidth={3} dot={{r: 3, fill: '#2563eb', strokeWidth: 0}} />
                <Line type="monotone" dataKey="lightgbm" name="LightGBM Model (MW)" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b', strokeWidth: 0}} />
                
                {(selectedModel === "all" || selectedModel === "baseline") && (
                    <Line type="monotone" dataKey="baseline" stroke="#94a3b8" strokeWidth={2} strokeDasharray="3 3" dot={false} name="Previous Day Baseline (MW)" />
                )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm font-semibold text-gray-400">
                Loading Live Forecast Series...
              </div>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* Accuracy & Model Evaluation Cards */}
      <ScrollReveal delay={300}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="control-card p-5 border border-gray-100 bg-white flex flex-col justify-center">
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Cpu className="w-4 h-4 text-blue-600" /> Mean Absolute Error (MAE)
            </div>
            <div className="text-2xl font-extrabold text-gray-900 font-sans flex items-baseline gap-1 mt-1">
              {metrics?.mae ?? "--"} <span className="text-xs text-gray-500 font-medium">MW</span>
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> High Precision
            </div>
          </div>

          <div className="control-card p-5 border border-gray-100 bg-white flex flex-col justify-center">
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <BarChart2 className="w-4 h-4 text-blue-600" /> MAPE / WAPE Error
            </div>
            <div className="text-2xl font-extrabold text-gray-900 font-sans mt-1">
              {metrics?.mape ? (metrics.mape * 100).toFixed(2) : (metrics?.mape ?? "--")}%
            </div>
            <div className="text-xs text-gray-500 font-medium mt-2">
              Test Set Validation Performance
            </div>
          </div>

          <div className="control-card p-5 border border-gray-100 bg-white flex flex-col justify-center">
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-blue-600" /> Peak Demand Error
            </div>
            <div className="text-2xl font-extrabold text-gray-900 font-sans mt-1">
              {metrics?.peak_error ? `${metrics.peak_error}%` : "--"}
            </div>
            <div className="text-xs text-gray-500 font-medium mt-2">
              Timing Error: {metrics?.peak_timing_error || "0 mins"}
            </div>
          </div>

          <div className="control-card p-5 border border-gray-100 bg-white flex flex-col justify-center">
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Activity className="w-4 h-4 text-blue-600" /> Active Production Model
            </div>
            <div className="text-lg font-bold text-gray-900 font-sans mt-1">
              {metrics?.best_model || "LightGBM Multi-Horizon"}
            </div>
            <div className="text-xs text-gray-500 font-medium mt-2">
              Trained on 393,440 Delhi Records
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};

