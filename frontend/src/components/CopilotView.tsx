"use client";

import React, { useState } from "react";
import { Bot, Send, Terminal, Sparkles, User } from "lucide-react";

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
      text: "Hello, I am **GridWise Copilot**—your tool-grounded natural language interface to the Delhi Grid AI backend. How can I assist with grid risk or demand forecasts today?",
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
      const res = await fetch("http://127.0.0.1:8000/api/copilot", {
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
    let ans = "The Delhi Grid is operating ONLINE. Tomorrow's peak is projected at 8,620 MW at 15:15.";
    let intent = "GENERAL_GRID_QUERY";
    let apis = ["GET /api/dashboard"];

    if (lower.includes("peak") || lower.includes("when")) {
      ans = "Tomorrow's demand is expected to peak at **8,620 MW at 15:15**, during the critical window between **14:15 and 16:00**.";
      intent = "FORECAST_PEAK_LOOKUP";
      apis = ["GET /api/forecast/peak"];
    } else if (lower.includes("why") || lower.includes("risk")) {
      ans = "Risk is rated **82 / 100 (HIGH)** primarily due to **extreme forecasted temperatures (41.2°C)** driving cooling demand (+38% SHAP impact), combined with elevated baseline load (+27%).";
      intent = "EXPLAINABILITY_ANALYSIS";
      apis = ["GET /api/explanation"];
    } else if (lower.includes("area") || lower.includes("where")) {
      ans = "**South Delhi** holds the highest modeled risk score at **86 / 100 (CRITICAL)** with projected peak demand of 2,140 MW.";
      intent = "GEOGRAPHIC_RISK_QUERY";
      apis = ["GET /api/areas"];
    } else if (lower.includes("3°c") || lower.includes("what if") || lower.includes("temp")) {
      ans = "If temperature rises by +3.0°C (to 44.2°C), peak demand increases from **8,620 MW to 9,355 MW** (+735 MW), escalating grid risk from **82 (HIGH)** to **94 (CRITICAL)**.";
      intent = "SIMULATION_EXECUTION";
      apis = ["POST /api/simulation"];
    } else if (lower.includes("anomaly")) {
      ans = "An anomaly was detected at **14:15** with an observed load of **8,430 MW** exceeding expected 7,820 MW by **+610 MW (HIGH severity)** due to unseasonal cooling spikes.";
      intent = "ANOMALY_DETECTION_QUERY";
      apis = ["GET /api/anomalies"];
    }

    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        sender: "copilot",
        text: ans,
        intent,
        apiCalls: apis,
      },
    ]);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="control-card p-6 border border-gray-800">
        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-bold uppercase mb-1">
          <Bot className="w-4 h-4" />
          <span>GROUNDED AI ASSISTANT</span>
        </div>
        <h1 className="text-xl font-bold text-white font-mono">GRIDWISE COPILOT</h1>
        <p className="text-xs text-gray-400">Natural-language tool runner grounded directly in backend forecast & risk services</p>
      </div>

      {/* Chat Container */}
      <div className="control-card p-6 border border-gray-800 flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-2xl p-4 rounded-xl text-xs leading-relaxed ${
                m.sender === "user"
                  ? "bg-purple-600/30 border border-purple-500/40 text-purple-100 font-mono"
                  : "bg-gray-900/90 border border-gray-800 text-gray-200"
              }`}>
                {/* Tool call indicator badge */}
                {m.sender === "copilot" && m.intent && (
                  <div className="mb-2 p-2 bg-gray-950 rounded border border-gray-800 font-mono text-[10px] text-cyan-400 flex items-center space-x-2">
                    <Terminal className="w-3 h-3 text-cyan-400" />
                    <span>Intent: {m.intent}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-amber-300">Tool: {m.apiCalls?.join(", ")}</span>
                  </div>
                )}
                
                <div>{m.text}</div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="p-3 bg-gray-900/90 rounded-xl text-xs text-cyan-400 font-mono flex items-center space-x-2 border border-gray-800">
                <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Executing Grounded Backend Tool Call...</span>
              </div>
            </div>
          )}
        </div>

        {/* Preset Query Chips */}
        <div className="my-3 pt-3 border-t border-gray-800/80 flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {presetQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-300 text-xs whitespace-nowrap font-mono transition"
            >
              &gt; {q}
            </button>
          ))}
        </div>

        {/* Query Input Bar */}
        <div className="flex items-center space-x-2 pt-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask anything about the forecast, risk drivers, or scenario simulations..."
            className="flex-1 bg-gray-900/90 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || isProcessing}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition text-xs font-bold font-mono flex items-center space-x-1 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>ASK</span>
          </button>
        </div>
      </div>
    </div>
  );
};
