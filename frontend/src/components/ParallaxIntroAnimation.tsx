"use client";

import React, { useEffect, useRef, useState } from "react";
import { Zap, ChevronDown } from "lucide-react";

interface ParallaxIntroProps {
  onComplete?: () => void;
}

export const ParallaxIntroAnimation: React.FC<ParallaxIntroProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const imagesRef = useRef<HTMLImageElement[]>([]);
  const loadedCountRef = useRef<number>(0);

  // Spring physics state — purely controls scroll progress
  const scrollTargetRef  = useRef<number>(0);
  const scrollCurrentRef = useRef<number>(0);
  const scrollVelocity   = useRef<number>(0);

  const [displayProgress, setDisplayProgress] = useState<number>(0);
  const [isSkipped, setIsSkipped] = useState<boolean>(false);

  const TOTAL_FRAMES = 301;

  // ─── Preload all frames ───────────────────────────────────────────────
  useEffect(() => {
    const imgs: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `/animation/frame_${String(i).padStart(3, "0")}.png`;
      img.onload = () => { loadedCountRef.current++; };
      imgs[i - 1] = img;
    }
    imagesRef.current = imgs;
  }, []);

  // ─── Draw one frame exactly — no blending, clean like video ──────────
  const drawFrame = (frameIdx: number) => {
    const canvas = canvasRef.current;
    const imgs = imagesRef.current;
    if (!canvas || imgs.length === 0) return;

    const idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frameIdx)));
    const img = imgs[idx];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    // Cover fit
    const iR = img.naturalWidth / img.naturalHeight;
    const cR = w / h;
    let dw = w, dh = h, dx = 0, dy = 0;
    if (cR > iR) { dh = w / iR; dy = (h - dh) / 2; }
    else          { dw = h * iR; dx = (w - dw) / 2; }

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, dx, dy, dw, dh);
  };

  // ─── Track raw scroll target ──────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current || isSkipped) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalH = containerRef.current.offsetHeight - window.innerHeight;
      if (totalH <= 0) return;
      const scrolled = Math.max(0, -rect.top);
      scrollTargetRef.current = Math.min(1, Math.max(0, scrolled / totalH));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isSkipped]);

  // ─── Spring physics RAF loop ──────────────────────────────────────────
  // Smoothness comes ONLY from spring — frames are always sharp/clean
  useEffect(() => {
    let raf: number;

    // Tune these for "heavy" cinematic feel:
    // stiffness: how fast it chases the target (lower = heavier)
    // damping: how much velocity is killed each frame (higher = less bounce)
    const STIFFNESS = 0.04;
    const DAMPING   = 0.75;

    const tick = () => {
      const displacement = scrollTargetRef.current - scrollCurrentRef.current;
      scrollVelocity.current = scrollVelocity.current * DAMPING + displacement * STIFFNESS;
      scrollCurrentRef.current = Math.max(0, Math.min(1, scrollCurrentRef.current + scrollVelocity.current));

      const p = scrollCurrentRef.current;
      setDisplayProgress(p);

      // Photo sequence: progress 0.0 → 0.62 maps to frames 0 → 300
      const photoP = Math.min(1, p / 0.62);
      const frameIdx = photoP * (TOTAL_FRAMES - 1);

      if (p < 0.68) {
        drawFrame(frameIdx);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleSkip = () => {
    setIsSkipped(true);
    if (onComplete) onComplete();
  };

  if (isSkipped) return null;

  // Canvas opacity: fully visible 0–0.56, fades to 0 by 0.68
  const canvasOpacity = displayProgress < 0.56
    ? 1
    : Math.max(0, 1 - (displayProgress - 0.56) / 0.12);

  // Title: fades in 0.72–0.88
  const titleP   = Math.max(0, Math.min(1, (displayProgress - 0.72) / 0.16));
  const titleBlur = (1 - titleP) * 14;

  // Parallax exit: 0.92–1.0
  const exitOffset = displayProgress > 0.92
    ? ((displayProgress - 0.92) / 0.08) * 100
    : 0;

  return (
    <div ref={containerRef} className="relative w-full h-[1400vh] bg-[#090d16]">
      <div
        className="sticky top-0 w-full h-screen overflow-hidden bg-[#090d16]"
        style={{
          transform: `translateY(-${exitOffset}%)`,
          willChange: "transform",
        }}
      >
        {/* ── Frame-accurate video-like canvas ── */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: canvasOpacity,
            willChange: "opacity",
            imageRendering: "auto",
          }}
        />

        {/* ── Title Phase ── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none"
          style={{
            opacity: titleP,
            filter: `blur(${titleBlur}px)`,
            transform: `scale(${0.90 + titleP * 0.10}) translateY(${(1 - titleP) * 36}px)`,
            willChange: "opacity, filter, transform",
          }}
        >
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold mb-6 backdrop-blur-md">
            <Zap className="w-4 h-4 fill-amber-400/20" />
            <span>DELHI GRID DEMAND &amp; RISK INTELLIGENCE</span>
          </div>

          <h1
            className="text-5xl sm:text-7xl lg:text-9xl font-black italic tracking-wider font-mono"
            style={{
              color: "#fff",
              textShadow: "0 0 60px rgba(34,211,238,0.45)",
            }}
          >
            GRIDWISE AI
          </h1>

          <p className="mt-5 text-lg sm:text-2xl font-medium text-cyan-100 font-mono tracking-wide max-w-2xl mx-auto italic">
            "Don't just predict the peak. Prepare for it."
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs font-mono text-gray-300">
            <span className="px-3 py-1.5 rounded-md bg-gray-900/90 border border-gray-800">● 24h Demand Forecasting</span>
            <span className="px-3 py-1.5 rounded-md bg-gray-900/90 border border-gray-800">● SHAP Driver Attribution</span>
            <span className="px-3 py-1.5 rounded-md bg-gray-900/90 border border-gray-800">● Interactive What-If Scenario Lab</span>
          </div>
        </div>

        {/* ── Skip button ── */}
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 z-50 px-3.5 py-1.5 rounded-full bg-gray-900/80 border border-gray-700/80 text-gray-300 hover:text-white text-xs font-mono font-semibold backdrop-blur-md shadow-lg transition"
        >
          Skip Intro →
        </button>

        {/* ── Scroll hint ── */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 animate-bounce pointer-events-none">
          <span className="tracking-widest uppercase text-[10px] font-bold font-mono text-cyan-400">
            {displayProgress < 0.60 ? "Scroll to play" : displayProgress < 0.88 ? "Keep scrolling" : "Entering…"}
          </span>
          <ChevronDown className="w-5 h-5 text-cyan-400" />
        </div>
      </div>
    </div>
  );
};
