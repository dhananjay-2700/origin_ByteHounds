"use client";

import React, { useEffect, useRef, useState } from "react";

interface GridRevealProps {
  children: React.ReactNode;
  blockSize?: number;
  baseDelay?: number;
}

export const GridReveal: React.FC<GridRevealProps> = ({ 
  children, 
  blockSize = 80,
  baseDelay = 0 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [inView, setInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [delays, setDelays] = useState<number[]>([]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    const cols = Math.ceil(dimensions.width / blockSize);
    const rows = Math.ceil(dimensions.height / blockSize);
    const totalBlocks = cols * rows;
    
    // Generate random delays for a glitchy/staggered reveal
    const newDelays = Array.from({ length: totalBlocks }).map(() => Math.random() * 800);
    setDelays(newDelays);
  }, [dimensions, blockSize]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setInView(true);
          setHasAnimated(true);
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const cols = Math.ceil(dimensions.width / blockSize);
  const rows = Math.ceil(dimensions.height / blockSize);
  const totalBlocks = cols * rows;

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      {/* The actual content being revealed */}
      <div className="relative z-0">
        {children}
      </div>

      {/* The Grid Overlay */}
      {dimensions.width > 0 && dimensions.height > 0 && totalBlocks > 0 && (
        <div 
          className="absolute inset-0 z-50 pointer-events-none flex flex-wrap leading-none"
          style={{ 
            width: `${cols * blockSize}px`,
            height: `${rows * blockSize}px`
          }}
        >
          {Array.from({ length: totalBlocks }).map((_, i) => (
            <div
              key={i}
              className="bg-white transition-opacity ease-out"
              style={{
                width: `${blockSize}px`,
                height: `${blockSize}px`,
                opacity: inView ? 0 : 1,
                transitionDuration: "400ms",
                transitionDelay: `${baseDelay + (delays[i] || 0)}ms`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
