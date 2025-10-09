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
  const [dots, setDots] = useState("");

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
    <div className={cn("relative flex flex-col items-center justify-center gap-6 py-6", className)}>
      {/* Breathing Circle Container - Fixed size to prevent bubble resizing */}
      <div className="relative flex items-center justify-center w-36 h-36">
        {/* Outer glow ring - Pure CSS animation */}
        <div
          className="absolute rounded-full bg-gradient-to-br from-orange-400/30 to-orange-600/30 blur-xl"
          style={{
            width: '128px',
            height: '128px',
            animation: 'breathe-glow 8s ease-in-out infinite',
          }}
        />
        
        {/* Middle ring - Pure CSS animation */}
        <div
          className="absolute rounded-full border-2 border-orange-300/40"
          style={{
            width: '112px',
            height: '112px',
            animation: 'breathe-ring 8s ease-in-out infinite',
          }}
        />
        
        {/* Main breathing circle - Pure CSS animation */}
        <div
          className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg"
          style={{
            width: '96px',
            height: '96px',
            animation: 'breathe-main 8s ease-in-out infinite',
          }}
        >
          {/* Inner light pulse - Pure CSS animation */}
          <div
            className="absolute inset-0 rounded-full bg-white"
            style={{
              animation: 'breathe-light 8s ease-in-out infinite',
            }}
          />
          
          {/* Center dot */}
          <div className="relative h-3 w-3 rounded-full bg-white/80" />
        </div>
      </div>

      <style jsx>{`
        @keyframes breathe-glow {
          0%, 100% { transform: scale(0.9); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 0.9; }
        }
        
        @keyframes breathe-ring {
          0%, 100% { transform: scale(0.71); opacity: 0.4; }
          50% { transform: scale(1); opacity: 0.6; }
        }
        
        @keyframes breathe-main {
          0%, 100% { transform: scale(0.67); }
          50% { transform: scale(1); }
        }
        
        @keyframes breathe-light {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {/* Loading Text */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-white">
          {message}
          <span className="inline-block w-6 text-left">{dots}</span>
        </p>
        <div className="relative h-5 w-24 text-xs text-white/70">
          <span 
            className="absolute left-0 right-0 text-center"
            style={{ animation: 'breathe-text-in 8s ease-in-out infinite' }}
          >
            Breathe in
          </span>
          <span 
            className="absolute left-0 right-0 text-center"
            style={{ animation: 'breathe-text-out 8s ease-in-out infinite' }}
          >
            Breathe out
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes breathe-text-in {
          0%, 25% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        
        @keyframes breathe-text-out {
          0%, 50% { opacity: 0; }
          75%, 100% { opacity: 1; }
        }
      `}</style>

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

