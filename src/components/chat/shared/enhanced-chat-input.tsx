"use client";

import { Ban, Brain, SendHorizonal, Sparkles, User, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { EnhancedDrawer } from "./enhanced-drawer";
import { MeditationDrawer } from "./meditation-drawer";
import { SwipeableMeditationPanel } from "./swipeable-meditation-panel";
import { type MeditationParams, type ParsedOverrides } from "./meditation-panel";
import { useChatState, useDrawer } from "./unified-provider";

interface EnhancedChatInputProps {
  onChatFocus?: (() => void) | undefined;
  isAuthenticated?: boolean;
}

export function EnhancedChatInput({ onChatFocus, isAuthenticated = false }: EnhancedChatInputProps) {
  const {
    chat: { messages, input, handleInputChange, handleSubmit, status, stop, setInput },
    meditationMode,
    setMeditationMode,
    addCustomMessage,
    updateCustomMessage,
    isGeneratingMeditation,
    setIsGeneratingMeditation,
  } = useChatState();

  const [parsedOverrides, setParsedOverrides] = useState<ParsedOverrides | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const getVoiceId = (gender: "male" | "female"): string => {
    return gender === "female" ? "rAmra0SCIYOxYmRNDSm3" : "GUDYcgRAONiI1nXDcNQQ";
  };

  const generatePrompt = (params: MeditationParams): string => {
    const guidanceInstructions = {
      beginner: "Provide detailed, step-by-step guidance.",
      confirmed: "Provide balanced guidance.",
      expert: "Provide minimal guidance, with long pauses.",
    } as const;
    const goalInstructions = {
      morning: "Create an energizing morning meditation.",
      focus: "Create a concentration meditation.",
      calm: "Create a calming meditation.",
      sleep: "Create a sleep meditation.",
    } as const;
    return `Create a ${params.duration}-minute ${params.goal} meditation. ${goalInstructions[params.goal]} ${guidanceInstructions[params.guidance]} Use a ${params.gender} voice.`;
  };

  const handleCancelMeditation = (loadingId: string) => {
    // Abort the fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Update the loading message to show cancellation
    updateCustomMessage(loadingId, {
      content: "Meditation generation cancelled.",
      isGeneratingMeditation: false
    });
    
    setIsGeneratingMeditation(false);
  };

  const handleMeditationGenerate = async (params: MeditationParams) => {
    setIsGeneratingMeditation(true);
    const prompt = generatePrompt(params);
    const voiceId = getVoiceId(params.gender);
    addCustomMessage({ 
      id: `user-${Date.now()}`, 
      content: `Generate: ${params.duration}m, ${params.goal}, ${params.guidance}, ${params.gender}, ${params.background} bg`, 
      role: "user" 
    });
    
    // Create loading message with animation and cancel callback
    const loadingId = `loading-${Date.now()}`;
    addCustomMessage({ 
      id: loadingId, 
      content: "Crafting your personalized meditation...", 
      role: "assistant",
      isGeneratingMeditation: true,
      onCancelGeneration: () => handleCancelMeditation(loadingId)
    });
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch("/api/meditation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          duration: params.duration, 
          voiceId, 
          gender: params.gender, 
          background: params.background, 
          guidance: params.guidance, 
          goal: params.goal 
        }),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) throw new Error(await response.text());
      
      const audioBlob = await response.blob();
      if (audioBlob.size === 0) throw new Error("Received empty audio file");
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Transform loading message into final message with audio
      updateCustomMessage(loadingId, {
        content: "Here is your personalized meditation.",
        audioUrl,
        isGeneratingMeditation: false,
        onCancelGeneration: undefined
      });
    } catch (error: any) {
      // Check if it was cancelled
      if (error.name === 'AbortError') {
        console.log("Meditation generation cancelled by user");
        return; // Don't update message, handleCancelMeditation already did
      }
      
      console.error("Error generating meditation:", error);
      
      // Transform loading message into error message
      updateCustomMessage(loadingId, {
        content: "Sorry, I couldn't generate your meditation. Please try again.",
        isGeneratingMeditation: false,
        onCancelGeneration: undefined
      });
    } finally {
      setIsGeneratingMeditation(false);
      abortControllerRef.current = null;
    }
  };

  const handleMeditationSubmitFromInput = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentInput = input?.trim() || "";
    if (!currentInput) return;
    
    setInput("");
    setIsGeneratingMeditation(true);
    addCustomMessage({ 
      id: `user-${Date.now()}`, 
      content: currentInput, 
      role: "user" 
    });
    
    // Create loading message with animation and cancel callback
    const loadingId = `loading-${Date.now()}`;
    addCustomMessage({ 
      id: loadingId, 
      content: "Crafting your personalized meditation...", 
      role: "assistant",
      isGeneratingMeditation: true,
      onCancelGeneration: () => handleCancelMeditation(loadingId)
    });
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    
    try {
      const defaultVoiceId = getVoiceId("female");
      const response = await fetch("/api/meditation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: currentInput, 
          voiceId: defaultVoiceId, 
          gender: "female", 
          duration: 5, 
          background: "silence", 
          guidance: "confirmed", 
          goal: "calm" 
        }),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) throw new Error(await response.text());
      
      // Extract parsing metadata from response headers
      const overridesHeader = response.headers.get("X-Parsed-Overrides");
      const confidenceHeader = response.headers.get("X-Parsed-Confidence");
      const finalParamsHeader = response.headers.get("X-Final-Params");
      
      if (overridesHeader && confidenceHeader && finalParamsHeader) {
        try {
          const overrides = JSON.parse(overridesHeader);
          const confidence = parseFloat(confidenceHeader);
          const finalParams = JSON.parse(finalParamsHeader);
          
          setParsedOverrides({
            overrides,
            confidence,
            finalParams,
          });
          
          console.log("✨ Received parsing info:", { overrides, confidence, finalParams });
        } catch (e) {
          console.warn("Failed to parse meditation metadata:", e);
        }
      }
      
      const audioBlob = await response.blob();
      if (audioBlob.size === 0) throw new Error("Received empty audio file");
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Transform loading message into final message with audio
      updateCustomMessage(loadingId, {
        content: "Here's your meditation based on your prompt.",
        audioUrl,
        isGeneratingMeditation: false,
        onCancelGeneration: undefined
      });
    } catch (error: any) {
      // Check if it was cancelled
      if (error.name === 'AbortError') {
        console.log("Meditation generation cancelled by user");
        return; // Don't update message, handleCancelMeditation already did
      }
      
      console.error("Error generating meditation from prompt:", error);
      
      // Transform loading message into error message
      updateCustomMessage(loadingId, {
        content: "Sorry, I couldn't generate from your prompt.",
        isGeneratingMeditation: false,
        onCancelGeneration: undefined
      });
    } finally {
      setIsGeneratingMeditation(false);
      abortControllerRef.current = null;
    }
  };

  const finalHandleSubmit = meditationMode === "meditation" ? handleMeditationSubmitFromInput : handleSubmit;

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
          parsedOverrides={parsedOverrides}
        />
      ) : (
        <MeditationDrawer
          isOpen={isMeditationDrawerOpen}
          onClose={() => setMeditationMode("chat")}
          onGenerate={handleMeditationGenerate}
          isGenerating={isGeneratingMeditation}
          parsedOverrides={parsedOverrides}
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
            <div className="flex items-center gap-3">
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
                  onFocus={shouldHideChatBar ? undefined : onChatFocus}
                  placeholder={
                    shouldHideChatBar 
                      ? "" 
                      : meditationMode === "meditation"
                        ? "Describe your meditation..."
                        : messages.length === 0
                          ? "Ask Neiji"
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
                      className="size-9 rounded-full transition-all duration-300"
                    >
                      <Loader2 className="size-5 animate-spin" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
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
                      {meditationMode === "meditation" ? (
                        <Sparkles className="size-5" />
                      ) : (
                        <SendHorizonal className="size-5" />
                      )}
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
