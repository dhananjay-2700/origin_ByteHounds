"use client";

import React, { useState } from "react";
import { Bot, Send, Terminal, Sparkles, User, Zap } from "lucide-react";
import { ScrollReveal } from "./ScrollLayout";
import { API_ENDPOINTS } from "../lib/api";

interface Message {
  id: string;
  sender: "user" | "copilot";
  text: string;
  intent?: string;
  apiCalls?: string[];
  structuredData?: any;
}

export const CopilotView: React.FC = () => {
  const [inputQuery, setInputQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "copilot",
      text: "Hello, I am **PravaahX Copilot**—your tool-grounded natural language interface to the Delhi Grid AI backend. How can I assist with grid risk or demand forecasts today?",
    },
  ]);

  const presetQueries = [
    "When is tomorrow's peak?",
    "Why is risk high?",
    "Which area has the highest risk?",
    "What if temperature rises by 3°C?",
    "Explain today's anomaly.",
  ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery("");
    setIsProcessing(true);

    try {
      const res = await fetch(API_ENDPOINTS.copilot, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      if (res.ok) {
        const data = await res.json();
        const copilotMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: "copilot",
          text: data.answer,
          intent: data.intent,
          apiCalls: data.api_calls,
          structuredData: data.structured_result,
        };
        setMessages((prev) => [...prev, copilotMsg]);
      } else {
        fallbackResponse(q);
      }
    } catch (e) {
      fallbackResponse(q);
    } finally {
      setIsProcessing(false);
    }
  };

  const fallbackResponse = (q: string) => {
    const lower = q.toLowerCase();
    let ans = "The PravaahX system is monitoring live Delhi Grid telemetry and ML model predictions.";
    let intent = "GENERAL_GRID_QUERY";
    let apis = ["GET /api/dashboard"];

    if (lower.includes("peak") || lower.includes("when")) {
      ans = "The LightGBM model forecasts tomorrow's demand peak based on historical demand momentum and ambient temperature curves.";
      intent = "FORECAST_PEAK_LOOKUP";
      apis = ["GET /api/forecast/peak"];
    } else if (lower.includes("why") || lower.includes("risk")) {
      ans = "Grid risk is computed dynamically from peak demand utilization against sub-station transformer thermal capacities and weather stress.";
      intent = "EXPLAINABILITY_ANALYSIS";
      apis = ["GET /api/explanation"];
    } else if (lower.includes("area") || lower.includes("where")) {
      ans = "Regional grid distribution intelligence assigns sub-station risk levels across South, North, West, and East Delhi sectors.";
      intent = "GEOGRAPHIC_RISK_QUERY";
      apis = ["GET /api/areas"];
    } else if (lower.includes("what if") || lower.includes("temp") || lower.includes("scenario")) {
      ans = "[Simulated Scenario] Counterfactual temperature increase models exponential thermal cooling load escalation.";
      intent = "SIMULATION_EXECUTION";
      apis = ["POST /api/simulation"];
    } else if (lower.includes("anomaly")) {
      ans = "Anomaly detection monitors residual deviation between observed telemetry load and expected model confidence bands.";
      intent = "ANOMALY_DETECTION_QUERY";
      apis = ["GET /api/anomalies"];
    }

    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        sender: "copilot",
        text: ans,
        intent: intent,
        apiCalls: apis,
      },
    ]);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Header */}
      <ScrollReveal delay={100} direction="up">
        <div className="control-card p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-[#FF7C1E] text-xs font-black uppercase tracking-widest mb-2">
              <Bot className="w-4 h-4" />
              <span>GROUNDED AI ASSISTANT</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">PravaahX COPILOT</h1>
            <p className="text-xs md:text-sm text-gray-400 mt-1 font-normal">
              Natural-language tool runner grounded directly in backend forecast & risk services
            </p>
          </div>

          <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-medium">
            <Sparkles className="w-4 h-4 text-[#FF7C1E]" />
            <span>Real-Time Model Context</span>
          </div>
        </div>
      </ScrollReveal>

      {/* Chat Container */}
      <ScrollReveal delay={200} direction="up">
        <div className="control-card p-8 flex flex-col h-[560px] justify-between">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-2xl p-5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                    m.sender === "user"
                      ? "bg-[#FF7C1E] text-black font-semibold shadow-lg shadow-[#FF7C1E]/20"
                      : "bg-white/[0.04] border border-white/10 text-gray-200"
                  }`}
                >
                  {/* Tool call indicator badge */}
                  {m.sender === "copilot" && m.intent && (
                    <div className="mb-3 px-3 py-1.5 bg-black/60 rounded-full border border-white/10 text-[10px] text-gray-300 flex items-center space-x-2">
                      <Terminal className="w-3.5 h-3.5 text-[#FF7C1E]" />
                      <span className="font-bold text-[#FF7C1E]">{m.intent}</span>
                      <span className="text-gray-500">·</span>
                      <span className="text-gray-400">{m.apiCalls?.join(", ")}</span>
                    </div>
                  )}
                  
                  <div>{m.text}</div>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="p-4 bg-white/[0.04] rounded-2xl text-xs text-[#FF7C1E] font-medium flex items-center space-x-2.5 border border-white/10">
                  <Sparkles className="w-4 h-4 animate-spin text-[#FF7C1E]" />
                  <span>Executing Grounded Backend Tool Call...</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 mt-4">
            {/* Preset Query Chips */}
            <div className="mb-4 flex items-center space-x-2 overflow-x-auto pb-1">
              {presetQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:border-[#FF7C1E] text-gray-300 hover:text-white text-xs whitespace-nowrap font-medium transition duration-200"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Query Input Bar */}
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask anything about the forecast, risk drivers, or scenario simulations..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-3.5 text-xs md:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF7C1E] transition"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputQuery.trim() || isProcessing}
                className="px-6 py-3.5 rounded-full bg-[#FF7C1E] hover:bg-white text-black transition-all duration-300 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-lg shadow-[#FF7C1E]/20 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ASK</span>
              </button>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};
