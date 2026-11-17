"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "~/lib/utils";
import type { GenerationStage } from "./bot-message";

const STAGES: { id: GenerationStage; label: string }[] = [
  { id: "script", label: "Writing your session" },
  { id: "voice", label: "Recording the voice" },
  { id: "mix", label: "Mixing the audio" },
];

interface MeditationLoadingAnimationProps {
  className?: string;
  /** Which step of the generation is running. */
  stage?: GenerationStage;
  onCancel?: () => void;
}

/**
 * Breathing circle shown while a meditation is being made, with the name of
 * the step that is running.
 */
export function MeditationLoadingAnimation({
  className,
  stage = "script",
  onCancel
}: MeditationLoadingAnimationProps) {
  const [dots, setDots] = useState("");
  const stageIndex = Math.max(0, STAGES.findIndex((s) => s.id === stage));

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
        <p className="text-sm font-medium text-white" role="status">
          {STAGES[stageIndex]?.label}
          <span className="inline-block w-6 text-left" aria-hidden="true">{dots}</span>
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

      {/* One dot per step: done, running, to come */}
      <div className="flex items-center gap-2" aria-hidden="true">
        {STAGES.map((item, i) => (
          <div
            key={item.id}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              i < stageIndex && "w-1.5 bg-white",
              i === stageIndex && "w-5 animate-pulse bg-white",
              i > stageIndex && "w-1.5 bg-white/30",
            )}
          />
        ))}
      </div>

      <p className="max-w-[260px] text-center text-xs leading-relaxed text-white/80">
        This usually takes less than a minute. Longer sessions can take a little more. You can breathe with the circle while you wait.
      </p>

      {/* Cancel Button - Discrete in top right */}
      {onCancel && (
        <button
          onClick={onCancel}
          type="button"
          className="absolute top-0 right-0 flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 active:scale-95 group"
          aria-label="Stop making this meditation"
        >
          <X className="h-4 w-4 text-white/70 group-hover:text-white/90 transition-colors" />
        </button>
      )}
    </div>
  );
}
