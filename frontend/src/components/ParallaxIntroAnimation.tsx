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
  const targetFrameRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);
  
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isSkipped, setIsSkipped] = useState<boolean>(false);

  const totalFrames = 91;

  // Preload user's exact 91 PNG frame photos into memory
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

  // Sub-frame dual-canvas render function with alpha cross-blending for silky-smooth motion
  const renderSubFrame = (floatIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgList = imagesRef.current;
    if (imgList.length === 0) return;

    // Ensure canvas dimensions match viewport
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const maxIndex = totalFrames - 1;
    const clampedIndex = Math.max(0, Math.min(maxIndex, floatIndex));
    
    const baseIdx = Math.floor(clampedIndex);
    const nextIdx = Math.min(maxIndex, baseIdx + 1);
    const fraction = clampedIndex - baseIdx; // 0.0 to 1.0 sub-frame fractional offset

    const imgBase = imgList[baseIdx];
    const imgNext = imgList[nextIdx];

    if (!imgBase || !imgBase.complete || imgBase.naturalWidth === 0) return;

    // Draw base frame image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCoverImage(ctx, canvas, imgBase, 1.0);

    // If there is a sub-frame fraction and next image is ready, cross-blend for continuous motion
    if (fraction > 0.01 && imgNext && imgNext.complete && imgNext.naturalWidth > 0 && baseIdx !== nextIdx) {
      drawCoverImage(ctx, canvas, imgNext, fraction);
    }
  };

  const drawCoverImage = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    opacity: number
  ) => {
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

    ctx.globalAlpha = opacity;
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    ctx.globalAlpha = 1.0;
  };

  // Scroll position listener -> updates target frame with extended 1200vh track height
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || isSkipped) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRef.current.offsetHeight - window.innerHeight;

      if (containerHeight <= 0) return;

      const scrollTop = Math.max(0, -rect.top);
      const progress = Math.min(1, Math.max(0, scrollTop / containerHeight));
      setScrollProgress(progress);

      // Map scroll progress across 0.0 to 0.88 of the long scroll space
      const animProgress = Math.min(1, progress / 0.88);
      targetFrameRef.current = animProgress * (totalFrames - 1);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isSkipped]);

  // Heavy Physics Inertia LERP Loop (0.05 damping)
  useEffect(() => {
    let animId: number;

    const tick = () => {
      // Heavy 0.05 LERP factor for heavy, smooth cinematic weight
      const diff = targetFrameRef.current - currentFrameRef.current;
      currentFrameRef.current += diff * 0.05;

      renderSubFrame(currentFrameRef.current);

      animId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  const handleSkip = () => {
    setIsSkipped(true);
    if (onComplete) onComplete();
  };

  if (isSkipped) return null;

  // Title opacity (fades in smoothly)
  const titleOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.25) * 2.2));
  
  // Parallax upward translation at the end of scroll track (0.88 to 1.0)
  const parallaxOffset = scrollProgress > 0.88 ? (scrollProgress - 0.88) * 8.33 * 100 : 0;

  return (
    <div ref={containerRef} className="relative w-full h-[1200vh] bg-[#090d16]">
      {/* Sticky Parallax Viewport */}
      <div
        className="sticky top-0 w-full h-screen overflow-hidden z-30 transition-transform duration-100 ease-out"
        style={{ transform: `translateY(-${parallaxOffset}%)` }}
      >
        {/* Canvas rendering crisp frame photos with Sub-Frame Alpha Cross-Blending and heavy inertia */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Subtle vignette gradient */}
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
          <div
            className="transition-all duration-700 transform"
            style={{
              opacity: titleOpacity,
              transform: `scale(${0.9 + titleOpacity * 0.1}) translateY(${(1 - titleOpacity) * 25}px)`,
            }}
          >
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
          <span className="tracking-widest uppercase text-[10px] font-bold font-mono">Scroll Down To Experience Heavy Parallax Sequence</span>
          <ChevronDown className="w-5 h-5 text-cyan-400" />
        </div>
      </div>
    </div>
  );
};
