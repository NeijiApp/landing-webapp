"use client";

import { useEffect, useState, useMemo } from "react";
import { cn } from "~/lib/utils";
import { MeditationPanel, type MeditationParams, type ParsedOverrides } from "./meditation-panel";

interface MeditationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: MeditationParams) => void;
  isGenerating: boolean;
  parsedOverrides?: ParsedOverrides | null;
  keyboardOpen?: boolean;
}

/**
 * Meditation drawer that extends from above the chat bar
 * Keeps chat bar accessible for typing meditation descriptions
 * Uses same animation pattern as auth drawer for consistency
 */
export function MeditationDrawer({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  parsedOverrides,
  keyboardOpen = false,
}: MeditationDrawerProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate exact chat bar height for bottom padding
  const chatBarPadding = 70; // Padding to prevent overlap with chat bar

  // Optimized height calculation with memoization
  const drawerHeight = useMemo(() => {
    if (!isAnimating) return "0px";
    if (isExpanded) return "min(70dvh, calc(100dvh - 140px))";
    return "310px";
  }, [isAnimating, isExpanded]);

  // Handle rendering and animation state (same pattern as auth drawer)
  useEffect(() => {
    if (isOpen) {
      // Step 1: Add to DOM
      setShouldRender(true);
      // Step 2: Trigger animation after a brief delay (allows initial render)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      // Step 1: Start closing animation
      setIsAnimating(false);
      setIsExpanded(false); // Reset expansion when closing
      // Step 2: Remove from DOM after animation completes
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 500); // Match the longest closing animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Don't render anything if not needed
  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-1/2 translate-x-1/2 w-full max-w-xl z-40",
        "bottom-0", // Start from bottom, same as chat bar
        // Optimized transitions with hardware acceleration
        isAnimating 
          ? "transition-all duration-300 ease-out" 
          : "transition-all duration-200 ease-out"
      )}
      style={{
        height: drawerHeight,
        willChange: isAnimating ? "height" : "auto",
      }}
    >
      {/* Main drawer container - seamlessly extends from chat bar */}
      <div className={cn(
        "h-full bg-white/95 backdrop-blur-md overflow-hidden",
        "border-l border-r border-t border-orange-100/50", // No bottom border to merge with chat bar
        "rounded-t-3xl", // Only round the top
        "shadow-[0_-8px_30px_rgb(0,0,0,0.12)]", // Shadow only on top/sides
        // Optimized animations with hardware acceleration
        isAnimating 
          ? "opacity-100 scale-y-100 origin-bottom transition-all duration-300 ease-out" 
          : "opacity-0 scale-y-95 origin-bottom transition-all duration-200 ease-out"
      )}
      style={{
        transform: isAnimating ? "translate3d(0, 0, 0) scaleY(1)" : "translate3d(0, 0, 0) scaleY(0.95)",
        willChange: isAnimating ? "transform, opacity" : "auto",
      }}>
        {/* Content */}
        <div className={cn(
          "h-full",
          // Optimized content animations
          isAnimating 
            ? "opacity-100 translate-y-0 transition-all duration-300 ease-out delay-100" 
            : "opacity-0 translate-y-6 transition-all duration-200 ease-out"
        )}
        style={{
          transform: isAnimating ? "translate3d(0, 0, 0)" : "translate3d(0, 24px, 0)",
          willChange: isAnimating ? "transform, opacity" : "auto",
        }}>
          {/* Meditation Panel Content */}
          <div className="h-full flex flex-col pb-[70px]">
            {/* Handlebar */}
            <div className="flex justify-center py-2 flex-shrink-0">
              <div className="h-1.5 w-12 rounded-full bg-orange-200" />
            </div>
            
            {/* Content area - MeditationPanel manages its own scroll */}
            <div className="flex-1 px-4 overflow-hidden">
              <MeditationPanel
                onGenerate={onGenerate}
                isGenerating={isGenerating}
                isExpanded={isExpanded}
                toggleExpand={() => setIsExpanded(!isExpanded)}
                parsedOverrides={parsedOverrides}
                onClose={onClose}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
