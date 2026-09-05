"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, AlertTriangle, Zap, Activity, Map, MessageSquare, Database, CheckCircle, BrainCircuit, LineChart, Target, ChevronRight, BarChart3, ShieldAlert, Cpu } from "lucide-react";
import { GridReveal } from "./GridReveal";
import { ScrollReveal } from "./ScrollReveal";

import { API_ENDPOINTS } from "../lib/api";

interface GridWiseLandingProps {
  onViewForecast?: (targetSection?: string) => void;
  onOpenDataHealth?: () => void;
}

export const GridWiseLanding: React.FC<GridWiseLandingProps> = ({ onViewForecast, onOpenDataHealth }) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [accuracyData, setAccuracyData] = useState<any>(null);
  const [temperature, setTemperature] = useState(38);

  useEffect(() => {
    fetch(API_ENDPOINTS.dashboard)
      .then(res => res.json())
      .then(data => setDashboardData(data))
      .catch(err => console.error("Error fetching landing dashboard metrics:", err));

    fetch(API_ENDPOINTS.forecastAccuracy)
      .then(res => res.json())
      .then(data => setAccuracyData(data))
      .catch(err => console.error("Error fetching landing accuracy metrics:", err));
  }, []);

  const peakVal = (dashboardData && dashboardData.peak_24h != null && !isNaN(Number(dashboardData.peak_24h))) 
    ? Math.round(Number(dashboardData.peak_24h)).toLocaleString() 
    : ((dashboardData && dashboardData.tomorrow_peak != null && !isNaN(Number(dashboardData.tomorrow_peak))) 
      ? Math.round(Number(dashboardData.tomorrow_peak)).toLocaleString() : "3,911");
  const currentLoadVal = (dashboardData && dashboardData.current_load != null && !isNaN(Number(dashboardData.current_load))) 
    ? Math.round(Number(dashboardData.current_load)).toLocaleString() : "2,050";
  const peakTimeVal = dashboardData?.peak_time || "10:00 IST";
  const riskScoreVal = (dashboardData && dashboardData.grid_risk_score != null && !isNaN(Number(dashboardData.grid_risk_score))) 
    ? Math.round(Number(dashboardData.grid_risk_score)) : 42;
  const tempVal = (dashboardData && dashboardData.weather_temp != null && !isNaN(Number(dashboardData.weather_temp))) 
    ? Number(dashboardData.weather_temp).toFixed(1) : "14.8";
  const windowVal = dashboardData?.critical_window || "09:00 - 11:00 IST";

  const maeVal = (accuracyData && accuracyData.mae != null && !isNaN(Number(accuracyData.mae))) 
    ? `${Math.round(Number(accuracyData.mae))} MW` : "371 MW";
  const rmseVal = (accuracyData && accuracyData.rmse != null && !isNaN(Number(accuracyData.rmse))) 
    ? `${Math.round(Number(accuracyData.rmse))} MW` : "472 MW";
  const mapeVal = (accuracyData && accuracyData.mape != null && !isNaN(Number(accuracyData.mape))) 
    ? `${(Number(accuracyData.mape) < 1 ? Number(accuracyData.mape) * 100 : Number(accuracyData.mape)).toFixed(1)}%` : "7.9%";

  // Scenario simulation based on dataset current load
  const baseDemand = (dashboardData && dashboardData.current_load != null && !isNaN(Number(dashboardData.current_load))) 
    ? Math.round(Number(dashboardData.current_load)) : 2050;
  const simulatedDemand = Math.round(baseDemand + (temperature - 30) * 35);
  const isCritical = temperature >= 40;

  return (
    <div className="w-full font-sans bg-white text-gray-900 selection:bg-blue-100">
      {/* ── 01 HERO ── */}
      <section className="relative px-6 py-24 md:py-32 w-full bg-white text-gray-900 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10 w-full">
          {/* Left Hero Content */}
          <div className="flex-1 space-y-6">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold tracking-wide uppercase border border-orange-100">
                <Activity className="w-3.5 h-3.5" />
                Intelligence for Grid Operators
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={100}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1]">
                Somewhere in the grid, <br className="hidden lg:block"/>demand is about to <span className="text-orange-500">spike.</span>
              </h1>
            </ScrollReveal>
            
            <ScrollReveal delay={200}>
              <p className="text-lg md:text-xl text-gray-500 max-w-xl leading-relaxed">
                You just can't see it yet. PRVAAH X predicts the peak before everyone else does. Clean, verify, and understand your electricity demand, and stop being caught off guard.
              </p>
            </ScrollReveal>
            
            <ScrollReveal delay={300}>
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <button 
                  onClick={() => onViewForecast?.("command-center")} 
                  className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 cursor-pointer shadow-md hover:shadow-lg"
                >
                  <span>Explore Grid Intelligence</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onOpenDataHealth?.()} 
                  className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 font-semibold rounded-lg hover:bg-gray-50 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>System Health</span>
                </button>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Notification Cards (Authenticom style) */}
          <div className="flex-1 w-full relative h-[500px] flex items-center justify-center pointer-events-none mt-10 lg:mt-0">
            {/* Background decorative elements */}
            <div className="absolute inset-0 bg-blue-50/50 rounded-full blur-3xl scale-150 -z-10"></div>
            
            <div className="w-full max-w-md relative">
              {/* Top Notification Card */}
              <ScrollReveal delay={400} direction="right">
                <div className="bg-white rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 absolute -top-24 -left-8 md:-left-16 w-80 transform -rotate-2 z-20">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-gray-900">Delhi Substation Alpha</div>
                      <div className="text-xs text-gray-500 mt-0.5">Node ID · GW-28471</div>
                    </div>
                    <div className="bg-orange-50 text-orange-600 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                      <Activity className="w-3 h-3"/>
                      High Risk
                    </div>
                  </div>
                  <div className="h-px bg-gray-100 my-3 w-full"></div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 font-medium uppercase">Expected Peak</div>
                      <div className="text-lg font-bold text-gray-900">{peakVal} MW</div>
                      <div className="text-xs text-gray-500">Time: {peakTimeVal}</div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Middle Alert Card */}
              <ScrollReveal delay={500} direction="up">
                <div className="bg-white rounded-xl p-5 shadow-[0_12px_40px_rgb(0,0,0,0.1)] border border-gray-100 w-full relative z-30 ml-4 md:ml-12 mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <div className="font-bold text-orange-500 uppercase tracking-wide text-sm">Grid Quality Alerts</div>
                    <div className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-semibold">3 Issues found</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="mt-0.5"><AlertTriangle className="w-4 h-4 text-red-500" /></div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Critical Window Approaching</div>
                        <div className="text-xs text-gray-500">Risk period: {windowVal}</div>
                      </div>
                    </div>
                    <div className="h-px bg-gray-50 w-full"></div>
                    <div className="flex gap-3">
                      <div className="mt-0.5"><AlertTriangle className="w-4 h-4 text-orange-500" /></div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Temperature Stress</div>
                        <div className="text-xs text-gray-500">Ambient Temp: {tempVal}°C</div>
                      </div>
                    </div>
                    <div className="h-px bg-gray-50 w-full"></div>
                    <div className="flex gap-3">
                      <div className="mt-0.5"><AlertTriangle className="w-4 h-4 text-yellow-500" /></div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Load Ramp Acceleration</div>
                        <div className="text-xs text-gray-500">Current load at {currentLoadVal} MW</div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
              
              {/* Bottom Metric Card */}
              <ScrollReveal delay={600} direction="left">
                <div className="bg-white rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 absolute -bottom-16 -right-4 w-64 transform rotate-2 z-10 hidden sm:block">
                  <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium">
                    <Target className="w-4 h-4" />
                    Model Accuracy
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{mapeVal}</div>
                  <div className="text-xs text-gray-500">Mean Absolute Percentage Error</div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-gray-400">MAE: {maeVal}</span>
                    <span className="text-gray-400">RMSE: {rmseVal}</span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── 02 THE PROBLEM (Cleaned Up) ── */}
      <section className="bg-gray-50 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-6">
                When a grid operator sees a demand spike, the opportunity to prepare is already gone.
              </h2>
              <p className="text-lg text-gray-500">
                PRVAAH X bridges the gap between raw data and actionable grid intelligence. Stop reacting and start predicting.
              </p>
            </div>
          </ScrollReveal>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ScrollReveal delay={100}>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-6">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Current State</div>
                  <div className="text-4xl font-bold text-gray-900 mb-4">{currentLoadVal} <span className="text-xl text-gray-500 font-medium">MW</span></div>
                  <div className="text-gray-500 text-sm">Real-time load tracking across all substations in the grid.</div>
                </div>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={200}>
              <div className="bg-white p-8 rounded-2xl border border-blue-100 shadow-md ring-1 ring-blue-50 relative flex flex-col justify-between h-full">
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">FORECAST</div>
                <div>
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-6">
                    <LineChart className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-2">Predicted Peak</div>
                  <div className="text-4xl font-bold text-gray-900 mb-4">{peakVal} <span className="text-xl text-gray-500 font-medium">MW</span></div>
                  <div className="text-gray-500 text-sm">AI-driven projection for the next 24 hours based on weather and historical load.</div>
                </div>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={300}>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full">
                <div>
                  <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center mb-6">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-2">Danger Zone</div>
                  <div className="text-3xl font-bold text-gray-900 mb-4">{windowVal}</div>
                  <div className="text-gray-500 text-sm">The specific critical window where grid pressure will be highest.</div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── 03 CAPABILITIES ── */}
      <section className="bg-white py-24 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1 space-y-8">
              <ScrollReveal>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                  Don't just watch the grid. <span className="text-blue-600">Understand it.</span>
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={100}>
                <p className="text-lg text-gray-500 leading-relaxed">
                  PRVAAH X identifies the exact period where predicted demand, ramp rate, weather stress and uncertainty combine to create elevated grid pressure. A number tells you what. AI tells you why.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <div className="space-y-4">
                  {[
                    { title: "Demand Forecasting", desc: "Predict future loads with high accuracy." },
                    { title: "Risk Detection", desc: "Identify anomalies and potential failures." },
                    { title: "Scenario Simulation", desc: "Test how weather changes affect the grid." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="mt-1 bg-green-100 text-green-600 rounded-full p-1">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-500">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>

              <ScrollReveal delay={300}>
                <div className="pt-6">
                  <button 
                    onClick={() => onViewForecast?.("command-center")}
                    className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition flex items-center space-x-2 cursor-pointer"
                  >
                    <span>View Command Center</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </ScrollReveal>
            </div>
            
            <div className="flex-1 w-full max-w-lg">
              <ScrollReveal delay={200} direction="left">
                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <Cpu className="w-32 h-32" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 relative z-10">Why is demand rising?</h3>
                  
                  <div className="space-y-4 relative z-10">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center"><Activity className="w-4 h-4"/></div>
                        <span className="font-medium text-gray-700">Temperature</span>
                      </div>
                      <span className="text-red-500 font-bold">+38%</span>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center"><LineChart className="w-4 h-4"/></div>
                        <span className="font-medium text-gray-700">Recent Load</span>
                      </div>
                      <span className="text-blue-500 font-bold">+27%</span>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center"><Database className="w-4 h-4"/></div>
                        <span className="font-medium text-gray-700">Hour of Day</span>
                      </div>
                      <span className="text-purple-500 font-bold">+19%</span>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-semibold">
                      <BrainCircuit className="w-3.5 h-3.5" />
                      Powered by LightGBM & SHAP
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── 04 FINAL CTA ── */}
      <section className="bg-blue-600 py-20 px-6 text-center">
        <ScrollReveal direction="down">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Ready to secure your grid?
            </h2>
            <p className="text-blue-100 text-lg">
              Stop waiting for peak demand to hit. Use our forecasting intelligence to stay ahead.
            </p>
            <div className="flex justify-center pt-4">
              <button 
                onClick={() => onViewForecast?.("command-center")}
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-50 transition flex items-center space-x-2 shadow-lg"
              >
                <span>Get Started Now</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </ScrollReveal>
      </section>

    </div>
  );
};