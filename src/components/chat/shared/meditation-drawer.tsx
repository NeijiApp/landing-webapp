"use client";

import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
import { MeditationPanel, type MeditationParams, type ParsedOverrides } from "./meditation-panel";

interface MeditationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: MeditationParams) => void;
  isGenerating: boolean;
  parsedOverrides?: ParsedOverrides | null;
}

/**
 * Meditation drawer that extends from the chat bar
 * Matches the design pattern of the auth drawer
 */
export function MeditationDrawer({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  parsedOverrides,
}: MeditationDrawerProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Calculate drawer height based on expansion state
  const drawerHeight = isExpanded 
    ? "h-[min(75dvh,calc(100dvh-80px))]" 
    : "h-[min(50dvh,calc(100dvh-80px))]";

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/10 backdrop-blur-[2px] z-30 transition-all ease-out",
          isAnimating 
            ? "opacity-100 duration-400" 
            : "opacity-0 pointer-events-none duration-300"
        )}
        onClick={onClose}
      />
      
      {/* Meditation drawer that appears to extend from chat bar */}
      <div
        className={cn(
          "fixed right-1/2 translate-x-1/2 w-full max-w-xl z-50 transition-all ease-out",
          isAnimating 
            ? `bottom-0 ${drawerHeight} duration-500` 
            : "bottom-0 h-0 duration-400"
        )}
      >
        {/* Main drawer container with opening/closing animations */}
        <div className={cn(
          "h-full bg-white rounded-t-3xl shadow-2xl border border-orange-100/50 overflow-hidden transition-all ease-out",
          isAnimating 
            ? "opacity-100 scale-y-100 origin-bottom duration-500" 
            : "opacity-0 scale-y-95 origin-bottom duration-300"
        )}>
          {/* Content with staggered animation */}
          <div className={cn(
            "h-full transition-all ease-out",
            isAnimating 
              ? "opacity-100 translate-y-0 duration-400 delay-200" 
              : "opacity-0 translate-y-6 duration-200"
          )}>
            {/* Meditation Panel Content */}
            <div className="h-full flex flex-col">
              {/* Handlebar */}
              <div className="flex justify-center py-2 flex-shrink-0">
                <div className="h-1.5 w-12 rounded-full bg-orange-200" />
              </div>
              
              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <MeditationPanel
                  onGenerate={onGenerate}
                  isGenerating={isGenerating}
                  isExpanded={isExpanded}
                  toggleExpand={() => setIsExpanded(!isExpanded)}
                  parsedOverrides={parsedOverrides}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
