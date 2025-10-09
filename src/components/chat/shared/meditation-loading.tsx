"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "~/lib/utils";

interface MeditationLoadingAnimationProps {
  className?: string;
  message?: string;
  onCancel?: () => void;
}

/**
 * Breathing circle animation for meditation generation
 * Shows a pulsing, breathing circle with calming colors
 */
export function MeditationLoadingAnimation({ 
  className,
  message = "Crafting your meditation...",
  onCancel
}: MeditationLoadingAnimationProps) {
  const [breathePhase, setBreathePhase] = useState<"inhale" | "exhale">("inhale");
  const [dots, setDots] = useState("");

  // Breathing cycle: 4s inhale, 4s exhale
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathePhase((prev) => (prev === "inhale" ? "exhale" : "inhale"));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Animated dots for text
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("relative flex flex-col items-center justify-center gap-6 py-8", className)}>
      {/* Breathing Circle Container */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow ring */}
        <div
          className={cn(
            "absolute rounded-full bg-gradient-to-br from-orange-400/30 to-orange-600/30 blur-xl transition-all duration-[4000ms] ease-in-out",
            breathePhase === "inhale" ? "h-32 w-32 scale-110" : "h-24 w-24 scale-90"
          )}
        />
        
        {/* Middle ring */}
        <div
          className={cn(
            "absolute rounded-full border-2 border-orange-300/40 transition-all duration-[4000ms] ease-in-out",
            breathePhase === "inhale" ? "h-28 w-28 opacity-60" : "h-20 w-20 opacity-40"
          )}
        />
        
        {/* Main breathing circle */}
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg transition-all duration-[4000ms] ease-in-out",
            breathePhase === "inhale" ? "h-24 w-24" : "h-16 w-16"
          )}
        >
          {/* Inner light pulse */}
          <div
            className={cn(
              "absolute inset-0 rounded-full bg-white transition-opacity duration-[4000ms] ease-in-out",
              breathePhase === "inhale" ? "opacity-30" : "opacity-10"
            )}
          />
          
          {/* Center dot */}
          <div className="relative h-3 w-3 rounded-full bg-white/80" />
        </div>
      </div>

      {/* Loading Text */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-white">
          {message}
          <span className="inline-block w-6 text-left">{dots}</span>
        </p>
        <p className="text-xs text-white/70">
          {breathePhase === "inhale" ? "Breathe in" : "Breathe out"}
        </p>
      </div>

      {/* Progress indicators - small dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-orange-300 transition-all duration-1000"
            style={{
              opacity: (Date.now() / 1000) % 3 > i ? 1 : 0.3,
              animation: `pulse ${1.5 + i * 0.2}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Cancel Button - Discrete in top right */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="absolute top-2 right-2 flex items-center justify-center h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-95 group"
          aria-label="Cancel meditation generation"
        >
          <X className="h-3.5 w-3.5 text-white/60 group-hover:text-white/90 transition-colors" />
        </button>
      )}
    </div>
  );
}

/**
 * Compact version for inline loading states
 */
export function MeditationLoadingCompact({ className }: { className?: string }) {
  const [breathePhase, setBreathePhase] = useState<"inhale" | "exhale">("inhale");

  useEffect(() => {
    const interval = setInterval(() => {
      setBreathePhase((prev) => (prev === "inhale" ? "exhale" : "inhale"));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Small breathing circle */}
      <div className="relative flex items-center justify-center">
        <div
          className={cn(
            "absolute rounded-full bg-orange-400/20 blur-md transition-all duration-[3000ms] ease-in-out",
            breathePhase === "inhale" ? "h-8 w-8" : "h-6 w-6"
          )}
        />
        <div
          className={cn(
            "rounded-full bg-gradient-to-br from-orange-400 to-orange-600 transition-all duration-[3000ms] ease-in-out",
            breathePhase === "inhale" ? "h-6 w-6" : "h-4 w-4"
          )}
        />
      </div>
      
      <span className="text-xs text-orange-600">Generating meditation...</span>
    </div>
  );
}

