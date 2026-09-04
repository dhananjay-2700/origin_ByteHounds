"use client";

import React, { useEffect, useRef, useState } from "react";
import { Zap, ChevronDown } from "lucide-react";

interface ParallaxIntroProps {
  onComplete?: () => void;
}

export const ParallaxIntroAnimation: React.FC<ParallaxIntroProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenARef = useRef<HTMLCanvasElement | null>(null);
  const offscreenBRef = useRef<HTMLCanvasElement | null>(null);

  const imagesRef = useRef<HTMLImageElement[]>([]);
  const loadedCountRef = useRef<number>(0);

  // Spring physics state
  const scrollTargetRef = useRef<number>(0);   // raw scroll progress 0–1
  const scrollCurrentRef = useRef<number>(0);  // spring-smoothed progress
  const scrollVelocityRef = useRef<number>(0); // spring velocity

  const [displayProgress, setDisplayProgress] = useState<number>(0);
  const [isSkipped, setIsSkipped] = useState<boolean>(false);

  const totalFrames = 91;

  // Preload all 91 PNG frame photos
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = new Array(totalFrames);
    loadedCountRef.current = 0;

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, "0");
      img.src = `/animation/frame_${frameNum}.png`;
      img.onload = () => { loadedCountRef.current++; };
      loadedImages[i - 1] = img;
    }
    imagesRef.current = loadedImages;

    // Create two offscreen canvases for sub-frame blending
    offscreenARef.current = document.createElement("canvas");
    offscreenBRef.current = document.createElement("canvas");
  }, []);

  // Draw a single image onto an offscreen canvas (cover fit)
  const drawImageToCanvas = (
    targetCanvas: HTMLCanvasElement,
    img: HTMLImageElement,
    w: number,
    h: number
  ) => {
    if (!img || !img.complete || img.naturalWidth === 0) return false;
    const ctx = targetCanvas.getContext("2d");
    if (!ctx) return false;

    if (targetCanvas.width !== w) targetCanvas.width = w;
    if (targetCanvas.height !== h) targetCanvas.height = h;

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = w / h;
    let dw = w, dh = h, dx = 0, dy = 0;

    if (canvasRatio > imgRatio) {
      dh = w / imgRatio;
      dy = (h - dh) / 2;
    } else {
      dw = h * imgRatio;
      dx = (w - dw) / 2;
    }

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, dx, dy, dw, dh);
    return true;
  };

  // Render smooth sub-frame blend to main canvas
  const renderSubFrame = (floatFrame: number) => {
    const canvas = canvasRef.current;
    const offA = offscreenARef.current;
    const offB = offscreenBRef.current;
    const imgList = imagesRef.current;

    if (!canvas || !offA || !offB || imgList.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    const clamped = Math.max(0, Math.min(totalFrames - 1, floatFrame));
    const baseIdx = Math.floor(clamped);
    const nextIdx = Math.min(totalFrames - 1, baseIdx + 1);
    const fraction = clamped - baseIdx;

    const imgA = imgList[baseIdx];
    const imgB = imgList[nextIdx];

    const drawnA = drawImageToCanvas(offA, imgA, w, h);
    if (!drawnA) return;

    ctx.clearRect(0, 0, w, h);

    // Draw base frame at full opacity
    ctx.globalAlpha = 1.0;
    ctx.drawImage(offA, 0, 0);

    // Cross-blend next frame on top if fraction is significant
    if (fraction > 0.02 && baseIdx !== nextIdx) {
      const drawnB = drawImageToCanvas(offB, imgB, w, h);
      if (drawnB) {
        ctx.globalAlpha = fraction;
        ctx.drawImage(offB, 0, 0);
        ctx.globalAlpha = 1.0;
      }
    }
  };

  // Scroll position listener — only sets the raw target
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || isSkipped) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerH = containerRef.current.offsetHeight - window.innerHeight;
      if (containerH <= 0) return;
      const scrolled = Math.max(0, -rect.top);
      scrollTargetRef.current = Math.min(1, Math.max(0, scrolled / containerH));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isSkipped]);

  // Spring physics + sub-frame render loop at 60FPS
  useEffect(() => {
    let animId: number;

    // Spring constants — heavy, slow, cinematic feel
    const stiffness = 0.045;  // spring pull strength (lower = slower/heavier)
    const damping = 0.72;     // velocity damping (higher = less bounce)

    const tick = () => {
      // Spring physics: velocity-based smooth approach
      const displacement = scrollTargetRef.current - scrollCurrentRef.current;
      scrollVelocityRef.current = scrollVelocityRef.current * damping + displacement * stiffness;
      scrollCurrentRef.current += scrollVelocityRef.current;

      const p = Math.max(0, Math.min(1, scrollCurrentRef.current));
      setDisplayProgress(p);

      // Phase 1: Photo animation covers progress 0.0 → 0.50
      // Map 0.0–0.50 of scroll to frames 0–90
      const photoAnimProgress = Math.min(1, p / 0.50);
      const floatFrameIdx = photoAnimProgress * (totalFrames - 1);

      // Only render canvas during photo phase (fade starts at 0.42)
      if (p < 0.52) {
        renderSubFrame(floatFrameIdx);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleSkip = () => {
    setIsSkipped(true);
    if (onComplete) onComplete();
  };

  if (isSkipped) return null;

  // Phase 1: Photo canvas fades out at 0.42, fully gone by 0.52
  const canvasOpacity = Math.max(0, Math.min(1, 1 - (displayProgress - 0.42) * 10));

  // Phase 3: Title fades in on blank screen 0.55–0.78
  const titleProgress = Math.max(0, Math.min(1, (displayProgress - 0.55) * 4.35));
  const titleBlur = Math.max(0, (1 - titleProgress) * 16);

  // Phase 4: Scroll exit 0.84–1.0
  const parallaxOffset = displayProgress > 0.84 ? (displayProgress - 0.84) * 6.25 * 100 : 0;

  return (
    <div ref={containerRef} className="relative w-full h-[900vh] bg-[#090d16]">
      <div
        className="sticky top-0 w-full h-screen overflow-hidden z-30 bg-[#090d16]"
        style={{ transform: `translateY(-${parallaxOffset}%)`, willChange: "transform" }}
      >
        {/* Photo sequence canvas — NO title overlay during phase 1 */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ opacity: canvasOpacity, willChange: "opacity" }}
        />

        {/* Phase 3: Blank screen + animated site name */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 pointer-events-none"
          style={{
            opacity: titleProgress,
            filter: `blur(${titleBlur}px)`,
            transform: `scale(${0.88 + titleProgress * 0.12}) translateY(${(1 - titleProgress) * 40}px)`,
            willChange: "opacity, filter, transform",
          }}
        >
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold mb-6 backdrop-blur-md">
            <Zap className="w-4 h-4 fill-amber-400/20" />
            <span>DELHI GRID DEMAND & RISK INTELLIGENCE</span>
          </div>

          <h1
            className="text-5xl sm:text-7xl lg:text-9xl font-black italic tracking-wider font-mono text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-amber-300"
            style={{ textShadow: "0 0 60px rgba(34,211,238,0.4)" }}
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

        {/* Skip Intro */}
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 z-40 px-3.5 py-1.5 rounded-full bg-gray-900/80 border border-gray-700/80 text-gray-300 hover:text-white text-xs font-mono font-semibold backdrop-blur-md shadow-lg transition"
        >
          Skip Intro →
        </button>

        {/* Scroll Prompt */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 z-30 animate-bounce pointer-events-none">
          <span className="tracking-widest uppercase text-[10px] font-bold font-mono text-cyan-400">
            {displayProgress < 0.50 ? "Scroll to play sequence" : displayProgress < 0.80 ? "Keep scrolling" : "Entering Command Center..."}
          </span>
          <ChevronDown className="w-5 h-5 text-cyan-400" />
        </div>
      </div>
    </div>
  );
};
