"use client";

import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
  AlertTriangle, CheckCircle, Zap, Activity, Info, Map as MapIcon, ChevronRight, ChevronDown, Clock
} from 'lucide-react';

const API_URL = 'http://localhost:8000';

export default function GridwiseDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, forecastRes, areasRes, insightsRes] = await Promise.all([
          fetch(`${API_URL}/dashboard`),
          fetch(`${API_URL}/forecast`),
          fetch(`${API_URL}/areas`),
          fetch(`${API_URL}/insights`)
        ]);
        
        setDashboard(await dashRes.json());
        setForecast(await forecastRes.json());
        
        const areasData = await areasRes.json();
        // Fetch details for each area to get feeders
        const detailedAreas = await Promise.all(
          areasData.map(async (area: any) => {
            const res = await fetch(`${API_URL}/areas/${area.id}`);
            return await res.json();
          })
        );
        setAreas(detailedAreas);
        setInsights(await insightsRes.json());
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'NORMAL': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'WATCH': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'CRITICAL': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch(risk) {
      case 'NORMAL': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'WATCH': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'HIGH': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'CRITICAL': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      default: return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <Zap className="w-12 h-12 text-blue-500 animate-pulse" />
          <h1 className="text-2xl font-bold tracking-widest text-slate-300">GRIDWISE AI</h1>
          <p className="text-slate-500 animate-pulse">Initializing Neural Models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 selection:bg-blue-500/30">
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">GRIDWISE AI</h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-2 text-slate-400 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
            <Clock className="w-4 h-4" />
            <span>04 Sep 2026</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KPI Section */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl flex flex-col gap-2 hover:bg-slate-900/80 transition-colors">
            <span className="text-slate-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" /> Current Load
            </span>
            <div className="text-4xl font-light text-white">
              {dashboard?.current_load?.toLocaleString()} <span className="text-lg text-slate-500">MW</span>
            </div>
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl flex flex-col gap-2 hover:bg-slate-900/80 transition-colors">
            <span className="text-slate-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4" /> Tomorrow Peak
            </span>
            <div className="text-4xl font-light text-white">
              {dashboard?.tomorrow_peak?.toLocaleString()} <span className="text-lg text-slate-500">MW</span>
            </div>
          </div>

          <div className={`backdrop-blur-sm border p-6 rounded-2xl flex flex-col gap-2 transition-colors ${getRiskColor(dashboard?.grid_risk)}`}>
            <span className="text-sm font-medium uppercase tracking-wider flex items-center gap-2 opacity-80">
              <AlertTriangle className="w-4 h-4" /> Grid Risk
            </span>
            <div className="text-4xl font-bold flex items-center gap-3">
              {getRiskIcon(dashboard?.grid_risk)}
              {dashboard?.grid_risk}
            </div>
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Demand Forecast</h2>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                <span className="text-slate-400">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900"></div>
                <span className="text-blue-400">Predicted</span>
              </div>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast?.series || []} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#475569" 
                  tick={{fill: '#64748b'}} 
                  tickFormatter={(val) => val.split(' ')[1]} 
                  dy={10}
                />
                <YAxis 
                  stroke="#475569" 
                  tick={{fill: '#64748b'}}
                  domain={['dataMin - 200', 'dataMax + 200']}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                />
                <ReferenceLine y={forecast?.capacity} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Capacity', fill: '#ef4444', fontSize: 12 }} />
                <Line 
                  type="monotone" 
                  dataKey="actual_load" 
                  stroke="#64748b" 
                  strokeWidth={2}
                  dot={false}
                  name="Actual Load" 
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted_load" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#0f172a', strokeWidth: 2 }}
                  name="Predicted Load" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights & Alerts */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="w-24 h-24" />
            </div>
            <h2 className="text-sm font-semibold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4" /> AI Insights
            </h2>
            <div className="relative z-10">
              <h3 className="text-lg font-medium text-white mb-2 leading-snug">
                {insights?.headline}
              </h3>
              <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                {insights?.body}
              </p>
              
              <div className="bg-slate-950/50 rounded-xl p-4 border border-indigo-500/20">
                <h4 className="text-xs text-indigo-300 uppercase font-semibold tracking-wider mb-2">Primary Drivers</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  {insights?.primary_drivers?.map((driver: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-400 font-bold">•</span> 
                      {driver.replace('•', '').trim()}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex-1">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <MapIcon className="w-4 h-4" /> Area Breakdown
            </h2>
            
            <div className="space-y-3">
              {areas.map((area) => (
                <div key={area.id} className="border border-slate-800 rounded-xl overflow-hidden">
                  <div 
                    className="flex justify-between items-center p-4 bg-slate-800/20 hover:bg-slate-800/40 cursor-pointer transition-colors"
                    onClick={() => setExpandedArea(expandedArea === area.id ? null : area.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedArea === area.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      <span className="font-medium text-white text-lg">{area.id} Zone</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(area.risk)}`}>
                      {area.risk}
                    </div>
                  </div>
                  
                  {expandedArea === area.id && (
                    <div className="p-4 bg-slate-900/80 border-t border-slate-800 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500 block mb-1">Predicted Peak</span>
                          <span className="text-white font-medium">{area.predicted_load.toLocaleString()} MW</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-1">Capacity</span>
                          <span className="text-white font-medium">{area.capacity.toLocaleString()} MW</span>
                        </div>
                      </div>
                      
                      {area.feeders && area.feeders.length > 0 && (
                        <div className="pt-3 border-t border-slate-800/50">
                          <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Feeder Risk</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {area.feeders.map((feeder: any) => (
                              <div key={feeder.id} className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-800">
                                <span className="text-sm font-medium text-slate-300">{feeder.id}</span>
                                {getRiskIcon(feeder.risk)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
