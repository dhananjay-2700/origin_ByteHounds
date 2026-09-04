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
  const currentFrameRef = useRef<number>(0);
  
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isSkipped, setIsSkipped] = useState<boolean>(false);

  const totalFrames = 91;

  // Preload all 91 PNG frame photos into memory
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, "0");
      img.src = `/animation/frame_${frameNum}.png`;
      loadedImages.push(img);
    }
    imagesRef.current = loadedImages;
  }, []);

  // Render current frame to canvas cleanly
  const renderFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgList = imagesRef.current;
    if (imgList.length === 0) return;

    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const idx = Math.max(0, Math.min(totalFrames - 1, Math.floor(frameIndex)));
    const img = imgList[idx];

    if (img && img.complete && img.naturalWidth > 0) {
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = canvas.width / canvas.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        drawHeight = canvas.width / imgRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }
  };

  // Continuous Video-like 30FPS Playback + Scroll Sync Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    const fps = 30; // 30 FPS continuous video playback
    const interval = 1000 / fps;

    const tick = (now: number) => {
      const delta = now - lastTime;

      if (delta >= interval) {
        lastTime = now - (delta % interval);

        // Advance frame index smoothly like a video
        currentFrameRef.current = (currentFrameRef.current + 1) % totalFrames;
        renderFrame(currentFrameRef.current);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Track window scroll for sticky parallax translation
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || isSkipped) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRef.current.offsetHeight - window.innerHeight;

      if (containerHeight <= 0) return;

      const scrollTop = Math.max(0, -rect.top);
      const progress = Math.min(1, Math.max(0, scrollTop / containerHeight));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isSkipped]);

  const handleSkip = () => {
    setIsSkipped(true);
    if (onComplete) onComplete();
  };

  if (isSkipped) return null;

  // Title opacity & scale
  const titleOpacity = Math.min(1, Math.max(0, scrollProgress * 3));
  
  // Parallax upward translation as user scrolls
  const parallaxOffset = scrollProgress > 0.7 ? (scrollProgress - 0.7) * 3.33 * 100 : 0;

  return (
    <div ref={containerRef} className="relative w-full h-[350vh] bg-[#090d16]">
      {/* Sticky Parallax Viewport */}
      <div
        className="sticky top-0 w-full h-screen overflow-hidden z-30 transition-transform duration-100 ease-out"
        style={{ transform: `translateY(-${parallaxOffset}%)` }}
      >
        {/* Canvas auto-playing the 91 PNG frame sequence continuously like a smooth video */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Subtle dark vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090d16]/90 via-[#090d16]/30 to-[#090d16]/10 pointer-events-none" />

        {/* Skip Intro Button */}
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 z-40 px-3.5 py-1.5 rounded-full bg-gray-900/80 border border-gray-700/80 text-gray-300 hover:text-white text-xs font-mono font-semibold backdrop-blur-md shadow-lg transition"
        >
          Skip Intro →
        </button>

        {/* Center Overlay: Bold Italics Site Name */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-30 pointer-events-none">
          <div className="transition-all duration-500 transform">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold mb-4 backdrop-blur-md">
              <Zap className="w-4 h-4 fill-amber-400/20" />
              <span>DELHI GRID DEMAND & RISK INTELLIGENCE</span>
            </div>

            {/* BOLD ITALIC FONT SITE NAME */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black italic tracking-wider font-mono text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-amber-300 drop-shadow-[0_0_35px_rgba(34,211,238,0.4)]">
              GRIDWISE AI
            </h1>

            {/* Tagline */}
            <p className="mt-4 text-base sm:text-xl font-medium text-cyan-100 font-mono tracking-wide max-w-2xl mx-auto italic drop-shadow-md">
              “Don’t just predict the peak. Prepare for it.”
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs font-mono text-gray-300">
              <span className="px-3 py-1 rounded-md bg-gray-900/80 border border-gray-800 backdrop-blur-sm">
                ● 24h Demand Forecasting
              </span>
              <span className="px-3 py-1 rounded-md bg-gray-900/80 border border-gray-800 backdrop-blur-sm">
                ● SHAP Driver Attribution
              </span>
              <span className="px-3 py-1 rounded-md bg-gray-900/80 border border-gray-800 backdrop-blur-sm">
                ● Interactive What-If Scenario Lab
              </span>
            </div>
          </div>
        </div>

        {/* Scroll Prompt */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 text-xs font-mono text-cyan-400 z-30 animate-bounce pointer-events-none">
          <span className="tracking-widest uppercase text-[10px] font-bold font-mono">Scroll Down To Enter Dashboard</span>
          <ChevronDown className="w-5 h-5 text-cyan-400" />
        </div>
      </div>
    </div>
  );
};
