"use client";

import { Brain, SendHorizonal, Square, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { EnhancedDrawer } from "./enhanced-drawer";
import { MeditationDrawer } from "./meditation-drawer";
import { SwipeableMeditationPanel } from "./swipeable-meditation-panel";
import { DEFAULT_MEDITATION_PARAMS, type MeditationParams } from "./meditation-panel";
import { describeRequest, useChatState, useDrawer } from "./unified-provider";

interface EnhancedChatInputProps {
  isAuthenticated?: boolean;
}

/** Reads "10 min" or "3 minutes" from a typed request. */
function durationFromText(text: string): number | undefined {
  const match = /(\d{1,2})\s*(?:-\s*)?min/i.exec(text);
  if (!match?.[1]) return undefined;
  const minutes = Number(match[1]);
  return minutes >= 1 && minutes <= 30 ? minutes : undefined;
}

export function EnhancedChatInput({ isAuthenticated = false }: EnhancedChatInputProps) {
  const {
    chat: { messages, input, handleInputChange, handleSubmit, status, stop, setInput },
    customMessages,
    meditationMode,
    setMeditationMode,
    isGeneratingMeditation,
    generateMeditation,
  } = useChatState();

  // Settings of the Meditation Mode panel. A typed request uses them too.
  const [panelParams, setPanelParams] = useState<MeditationParams>(DEFAULT_MEDITATION_PARAMS);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isLoading = useMemo(
    () => status === "streaming" || status === "submitted" || isGeneratingMeditation,
    [status, isGeneratingMeditation],
  );

  const { isOpen: isAuthDrawerOpen, openDrawer, closeDrawer } = useDrawer();
  
  // Meditation drawer is open when meditation mode is active (but doesn't hide chat bar)
  const isMeditationDrawerOpen = meditationMode === "meditation";
  
  // Only auth drawer should hide the chat bar buttons
  const shouldHideChatBar = isAuthDrawerOpen;

  /**
   * Coordinated drawer handlers to ensure only one drawer is open at a time
   * When opening one drawer, the other closes first with proper animation timing
   */
  const handleOpenAuthDrawer = () => {
    if (isMeditationDrawerOpen) {
      // Close meditation drawer first, then open auth drawer after animation completes
      setMeditationMode("chat");
      setTimeout(() => {
        openDrawer();
      }, 500); // Wait for meditation drawer closing animation (500ms)
    } else {
      openDrawer();
    }
  };

  const handleToggleMeditationDrawer = () => {
    const newMode = meditationMode === "meditation" ? "chat" : "meditation";
    
    if (newMode === "meditation" && isAuthDrawerOpen) {
      // Close auth drawer first, then open meditation drawer after animation completes
      closeDrawer();
      setTimeout(() => {
        setMeditationMode("meditation");
      }, 500); // Wait for auth drawer closing animation (500ms)
    } else {
      setMeditationMode(newMode);
    }
  };

  // Detect mobile device
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Detect mobile keyboard
  useEffect(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      const viewport = window.visualViewport;
      const handleResize = () => {
        // Keyboard is likely open if visual viewport height is significantly less than layout viewport height
        setKeyboardOpen(viewport.height < window.innerHeight * 0.7 && isMeditationDrawerOpen);
      };

      viewport.addEventListener('resize', handleResize);
      return () => viewport.removeEventListener('resize', handleResize);
    }
  }, [isMeditationDrawerOpen]);

  // Panel button: the provider closes the panel, shows the request and generates.
  const handleMeditationGenerate = (params: MeditationParams) => {
    generateMeditation(params, describeRequest(params));
  };

  // Typed text while Meditation Mode is on: the sentence becomes the request,
  // with the panel settings. A duration written in the sentence wins.
  const handleMeditationSubmitFromInput = (e: React.FormEvent) => {
    e.preventDefault();
    const currentInput = input?.trim() || "";
    if (!currentInput || isLoading) return;

    setInput("");
    generateMeditation(
      {
        ...panelParams,
        duration: durationFromText(currentInput) ?? panelParams.duration,
        prompt: currentInput,
      },
      currentInput,
    );
  };

  const finalHandleSubmit = meditationMode === "meditation" ? handleMeditationSubmitFromInput : handleSubmit;
  const hasMessages = messages.length + customMessages.length > 0;

  return (
    <>
      {/* Auth Drawer */}
      <EnhancedDrawer 
        isOpen={isAuthDrawerOpen} 
        onClose={closeDrawer} 
        isAuthenticated={isAuthenticated} 
      />

      {/* Meditation Drawer - conditional rendering for mobile vs desktop */}
      {isMobile ? (
        <SwipeableMeditationPanel
          isOpen={isMeditationDrawerOpen}
          onClose={() => setMeditationMode("chat")}
          onGenerate={handleMeditationGenerate}
          isGenerating={isGeneratingMeditation}
          params={panelParams}
          onParamsChange={setPanelParams}
        />
      ) : (
        <MeditationDrawer
          isOpen={isMeditationDrawerOpen}
          onClose={() => setMeditationMode("chat")}
          onGenerate={handleMeditationGenerate}
          isGenerating={isGeneratingMeditation}
          params={panelParams}
          onParamsChange={setPanelParams}
          keyboardOpen={keyboardOpen}
        />
      )}

      {/* Enhanced Input Bar - Always visible on top, seamlessly connected to meditation drawer */}
      <div className={cn(
        "fixed right-1/2 bottom-0 z-50 w-full max-w-xl translate-x-1/2",
        // Optimized transitions with hardware acceleration
        "transition-all duration-300 ease-out"
      )}
      style={{
        willChange: "transform",
      }}>
        {/* Hidden white background area - extends below the chat bar */}
        {isMobile && (
          <div 
            className="absolute inset-x-0 bg-white"
            style={{
              height: "150px", // Extra white area below the chat bar
              bottom: "-150px", // Position it below the chat bar
            }}
          />
        )}
        
        <div className={cn(
          "bg-white/95 backdrop-blur-md relative",
          "border-l border-r border-orange-100/50", // Sides only, no top/bottom border
          shouldHideChatBar 
            ? "p-0 pb-0 rounded-t-3xl border-t shadow-2xl" 
            : "p-3 pb-[calc(12px+env(safe-area-inset-bottom))] md:p-4 rounded-t-3xl border-t shadow-2xl",
          // When meditation drawer is open, remove top rounding and border to merge
          isMeditationDrawerOpen && !shouldHideChatBar && "rounded-t-none border-t-0 shadow-none",
          // Optimized transitions
          "transition-all duration-300 ease-out"
        )}
        style={{
          willChange: "transform, opacity",
        }}>
          
          {/* Chat Bar Content - Only hide for auth drawer */}
          <div className={cn(
            "transition-all ease-out duration-300",
            shouldHideChatBar 
              ? "opacity-0 scale-95 pointer-events-none transform -translate-y-2" 
              : "opacity-100 scale-100 pointer-events-auto transform translate-y-0 delay-100"
          )}
          style={{
            willChange: shouldHideChatBar ? "transform, opacity" : "auto",
          }}>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* User Profile Button */}
              {!isAuthenticated && (
                <Button
                  type="button"
                  size="icon"
                  variant="orange"
                  className={cn(
                    "size-11 rounded-full transition-all ease-out duration-300",
                    shouldHideChatBar 
                      ? "scale-0 opacity-0 rotate-180" 
                      : "scale-100 opacity-100 rotate-0 delay-150 hover:scale-105 active:scale-95"
                  )}
                  style={{
                    willChange: shouldHideChatBar ? "transform, opacity" : "transform",
                  }}
                  onClick={handleOpenAuthDrawer}
                  aria-label="Sign in"
                >
                  <User className={cn(
                    "transition-all ease-out duration-300",
                    shouldHideChatBar ? "size-0" : "size-6 delay-150"
                  )} />
                </Button>
              )}

              {/* Brain Button - Hidden when auth drawer is open */}
              <div className="group relative">
                <Button
                  onClick={handleToggleMeditationDrawer}
                  aria-label={meditationMode === "meditation" ? "Close Meditation Mode" : "Open Meditation Mode"}
                  aria-pressed={meditationMode === "meditation"}
                  type="button"
                  size="icon"
                  variant={meditationMode === "meditation" ? "orange" : "orangeOutline"}
                  className={cn(
                    "size-12 rounded-full transition-all ease-out duration-300",
                    shouldHideChatBar 
                      ? "scale-0 opacity-0 rotate-180 pointer-events-none" 
                      : "scale-100 opacity-100 rotate-0 hover:scale-105 active:scale-95"
                  )}
                  style={{
                    willChange: shouldHideChatBar ? "transform, opacity" : "transform",
                  }}
                >
                  <Brain
                    className={cn(
                      "transition-all ease-out duration-300",
                      shouldHideChatBar ? "size-0" : meditationMode === "meditation" ? "size-7" : "size-6",
                    )}
                  />
                </Button>

                {meditationMode === "meditation" && !shouldHideChatBar && (
                  <div className="absolute -right-1 -top-1 size-4 rounded-full border-2 border-white bg-orange-400">
                    <div className="size-full animate-pulse rounded-full bg-orange-300/70" />
                  </div>
                )}
              </div>

              {/* Input Form - Always accessible */}
              <form onSubmit={finalHandleSubmit} className="relative flex-1">
                <Input
                  disabled={isLoading || shouldHideChatBar}
                  type="text"
                  value={input ?? ""}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !shouldHideChatBar) {
                      e.preventDefault();
                      finalHandleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                    }
                  }}
                  placeholder={
                    shouldHideChatBar 
                      ? "" 
                      : meditationMode === "meditation"
                        ? "Describe a session"
                        : !hasMessages
                          ? "How do you feel?"
                          : "Message"
                  }
                  className={cn(
                    "h-12 w-full rounded-full border-orange-200 bg-white/80 pl-6 pr-14 text-base transition-all focus:bg-white focus:ring-2 focus:ring-orange-300",
                    shouldHideChatBar && "cursor-default"
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isLoading ? (
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="orangeOutline" 
                      onClick={stop} 
                      aria-label="Stop"
                      className="size-9 rounded-full transition-all duration-300"
                    >
                      <Square className="size-4 animate-pulse fill-current" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      aria-label="Send"
                      size="icon" 
                      variant="orange" 
                      className={cn(
                        "size-9 rounded-full transition-all ease-out duration-300",
                        shouldHideChatBar 
                          ? "scale-0 opacity-0 rotate-180 pointer-events-none" 
                          : "scale-100 opacity-100 rotate-0 hover:scale-105 active:scale-95"
                      )}
                      style={{
                        willChange: shouldHideChatBar ? "transform, opacity" : "transform",
                      }}
                      disabled={!((input ?? "").trim()) || shouldHideChatBar}
                    >
                      <SendHorizonal className="size-5" />
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
