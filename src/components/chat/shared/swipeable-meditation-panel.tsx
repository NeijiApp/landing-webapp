"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { cn } from "~/lib/utils";
import { MeditationPanel, type MeditationParams, type ParsedOverrides } from "./meditation-panel";

interface SwipeableMeditationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: MeditationParams) => void;
  isGenerating: boolean;
  parsedOverrides?: ParsedOverrides | null;
}

type PanelState = "closed" | "compact" | "expanded";

export function SwipeableMeditationPanel({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  parsedOverrides,
}: SwipeableMeditationPanelProps) {
  const [panelState, setPanelState] = useState<PanelState>("closed");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  // Handle rendering and animation state
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
          setPanelState("compact");
        });
      });
    } else {
      setIsAnimating(false);
      setPanelState("closed");
      setIsExpanded(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Optimized touch event handlers with performance improvements
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    const touchY = e.touches[0]?.clientY;
    if (touchY !== undefined) {
      setDragStartY(touchY);
      setCurrentY(touchY);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touchY = e.touches[0]?.clientY;
    if (touchY === undefined) return;
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      setCurrentY(touchY);
    });
    
    // Prevent default to avoid scrolling the background
    e.preventDefault();
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    const deltaY = currentY - dragStartY;
    const threshold = 50; // Minimum distance to trigger state change
    
    // Use requestAnimationFrame for smooth state transitions
    requestAnimationFrame(() => {
      if (Math.abs(deltaY) < threshold) {
        // If drag distance is too small, snap back to current state
        setCurrentY(0);
        return;
      }
      
      if (deltaY < -threshold) {
        // Swipe up
        if (panelState === "compact") {
          setPanelState("expanded");
          setIsExpanded(true);
        } else if (panelState === "closed") {
          setPanelState("compact");
        }
      } else if (deltaY > threshold) {
        // Swipe down
        if (panelState === "expanded") {
          setPanelState("compact");
          setIsExpanded(false);
        } else if (panelState === "compact") {
          setPanelState("closed");
          onClose();
        }
      }
      
      setCurrentY(0);
    });
  }, [isDragging, currentY, dragStartY, panelState, onClose]);

  // Click handler for the drag handle (tap to toggle)
  const handleDragHandleClick = useCallback((e: React.MouseEvent) => {
    // Only handle click if we're not in the middle of a drag
    if (!isDragging) {
      if (panelState === "compact") {
        setPanelState("expanded");
        setIsExpanded(true);
      } else if (panelState === "expanded") {
        setPanelState("compact");
        setIsExpanded(false);
      }
    }
  }, [isDragging, panelState]);

  // Optimized panel height calculation with memoization
  const panelHeight = useMemo(() => {
    if (panelState === "closed") return "0px";
    if (panelState === "compact") return "310px";
    return "min(70dvh, calc(100dvh - 140px))";
  }, [panelState]);

  // Optimized transform calculation with memoization and hardware acceleration
  const panelTransform = useMemo(() => {
    if (!isDragging || panelState === "closed") return "translate3d(0, 0, 0)";
    const deltaY = currentY - dragStartY;
    return `translate3d(0, ${deltaY}px, 0)`;
  }, [isDragging, panelState, currentY, dragStartY]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-1/2 translate-x-1/2 w-full max-w-xl z-40",
        "bottom-0",
        // Optimized transitions with hardware acceleration
        isDragging ? "transition-none" : "transition-all ease-out duration-300"
      )}
      style={{
        height: panelHeight,
        transform: panelTransform,
        willChange: isDragging ? "transform, height" : "auto",
      }}
    >
      {/* Hidden white background area - extends below the visible panel */}
      <div 
        className="absolute inset-x-0 bg-white"
        style={{
          height: "200px", // Extra white area below the panel
          bottom: "-200px", // Position it below the panel
        }}
      />
      
      {/* Main drawer container */}
      <div className={cn(
        "h-full bg-white/95 backdrop-blur-md overflow-hidden relative z-10",
        "border-l border-r border-t border-orange-100/50",
        "rounded-t-3xl",
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
          <div className="h-full flex flex-col pb-[70px]">
            {/* Draggable Handle */}
            <div 
              ref={dragHandleRef}
              className="flex justify-center py-2 flex-shrink-0 cursor-pointer touch-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={handleDragHandleClick}
            >
              <div className="h-1.5 w-12 rounded-full bg-orange-200" />
            </div>
            
            {/* Content area */}
            <div className="flex-1 px-4 overflow-hidden">
              <MeditationPanel
                onGenerate={onGenerate}
                isGenerating={isGenerating}
                isExpanded={isExpanded}
                toggleExpand={() => {
                  setIsExpanded(!isExpanded);
                  setPanelState(isExpanded ? "compact" : "expanded");
                }}
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
