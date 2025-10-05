"use client";

import { Ban, Brain, SendHorizonal, Sparkles, User, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { EnhancedDrawer } from "./enhanced-drawer";
import { MeditationDrawer } from "./meditation-drawer";
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
    isGeneratingMeditation,
    setIsGeneratingMeditation,
  } = useChatState();

  const [parsedOverrides, setParsedOverrides] = useState<ParsedOverrides | null>(null);

  const isLoading = useMemo(
    () => status === "streaming" || status === "submitted" || isGeneratingMeditation,
    [status, isGeneratingMeditation],
  );

  const { isOpen: isAuthDrawerOpen, openDrawer, closeDrawer } = useDrawer();
  
  // Meditation drawer is open when meditation mode is active
  const isMeditationDrawerOpen = meditationMode === "meditation";
  
  // Any drawer is open
  const isAnyDrawerOpen = isAuthDrawerOpen || isMeditationDrawerOpen;

  const getVoiceId = (gender: "male" | "female"): string => {
    return gender === "female" ? "g6xIsTj2HwM6VR4iXFCw" : "GUDYcgRAONiI1nXDcNQQ";
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

  const handleMeditationGenerate = async (params: MeditationParams) => {
    setIsGeneratingMeditation(true);
    const prompt = generatePrompt(params);
    const voiceId = getVoiceId(params.gender);
    addCustomMessage({ 
      id: `user-${Date.now()}`, 
      content: `Generate: ${params.duration}m, ${params.goal}, ${params.guidance}, ${params.gender}, ${params.background} bg`, 
      role: "user" 
    });
    const loadingId = `loading-${Date.now()}`;
    addCustomMessage({ 
      id: loadingId, 
      content: "🧘‍♀️ Generating your personalized meditation...", 
      role: "assistant" 
    });
    
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
      });
      
      if (!response.ok) throw new Error(await response.text());
      
      const audioBlob = await response.blob();
      if (audioBlob.size === 0) throw new Error("Received empty audio file");
      const audioUrl = URL.createObjectURL(audioBlob);
      addCustomMessage({ 
        id: `meditation-${Date.now()}`, 
        content: `Here is your personalized meditation.`, 
        role: "assistant", 
        audioUrl 
      });
    } catch (error) {
      console.error("Error generating meditation:", error);
      addCustomMessage({ 
        id: `error-${Date.now()}`, 
        content: "Sorry, I couldn't generate your meditation. Please try again.", 
        role: "assistant" 
      });
    } finally {
      setIsGeneratingMeditation(false);
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
    
    const loadingId = `loading-${Date.now()}`;
    addCustomMessage({ 
      id: loadingId, 
      content: "🧘‍♀️ Generating your personalized meditation from prompt...", 
      role: "assistant" 
    });
    
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
      addCustomMessage({ 
        id: `meditation-${Date.now()}`, 
        content: `Here's your meditation based on your prompt.`, 
        role: "assistant", 
        audioUrl 
      });
    } catch (error) {
      console.error("Error generating meditation from prompt:", error);
      addCustomMessage({ 
        id: `error-${Date.now()}`, 
        content: "Sorry, I couldn't generate from your prompt.", 
        role: "assistant" 
      });
    } finally {
      setIsGeneratingMeditation(false);
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

      {/* Meditation Drawer - matches auth drawer design */}
      <MeditationDrawer
        isOpen={isMeditationDrawerOpen}
        onClose={() => setMeditationMode("chat")}
        onGenerate={handleMeditationGenerate}
        isGenerating={isGeneratingMeditation}
        parsedOverrides={parsedOverrides}
      />

      {/* Enhanced Input Bar with Smooth Animations */}
      <div className={cn(
        "fixed right-1/2 bottom-0 z-40 w-full max-w-xl translate-x-1/2 transition-all duration-500 ease-out",
        isAnyDrawerOpen ? "transform translate-y-0" : "transform translate-y-0"
      )}>
        <div className={cn(
          "rounded-t-3xl bg-white/95 backdrop-blur-md shadow-2xl border border-orange-100/50 transition-all duration-500 ease-out",
          isAnyDrawerOpen 
            ? "p-0 pb-0 shadow-none border-transparent" 
            : "p-3 pb-[calc(12px+env(safe-area-inset-bottom))] md:p-4"
        )}>
          
          {/* Chat Bar Content - Hide when any drawer is open with smooth animation */}
          <div className={cn(
            "transition-all ease-out",
            isAnyDrawerOpen 
              ? "opacity-0 scale-95 pointer-events-none transform -translate-y-2 duration-200" 
              : "opacity-100 scale-100 pointer-events-auto transform translate-y-0 duration-400 delay-100"
          )}>
            <div className="flex items-center gap-3">
              {/* User Profile Button - Enhanced with opening animation */}
              {!isAuthenticated && (
                <Button
                  type="button"
                  size="icon"
                  variant="orange"
                  className={cn(
                    "size-11 rounded-full transition-all ease-out",
                    isAnyDrawerOpen 
                      ? "scale-0 opacity-0 rotate-180 duration-200" 
                      : "scale-100 opacity-100 rotate-0 duration-400 delay-150 hover:scale-105 active:scale-95"
                  )}
                  onClick={() => openDrawer()}
                >
                  <User className={cn(
                    "transition-all ease-out",
                    isAnyDrawerOpen ? "size-0 duration-200" : "size-6 duration-300 delay-150"
                  )} />
                </Button>
              )}

              {/* Brain Button - Enhanced with opening animation */}
              <div className="group relative">
                <Button
                  onClick={() => {
                    setMeditationMode(meditationMode === "meditation" ? "chat" : "meditation");
                  }}
                  size="icon"
                  variant={meditationMode === "meditation" ? "orange" : "orangeOutline"}
                  className={cn(
                    "size-12 rounded-full transition-all ease-out",
                    isAnyDrawerOpen 
                      ? "scale-90 opacity-70 duration-200" 
                      : "scale-100 opacity-100 duration-400 delay-100 hover:scale-105 active:scale-95"
                  )}
                >
                  <Brain
                    className={cn(
                      "transition-all duration-300",
                      meditationMode === "meditation" ? "size-7" : "size-6",
                    )}
                  />
                </Button>

                {meditationMode === "meditation" && !isAnyDrawerOpen && (
                  <div className="absolute -right-1 -top-1 size-4 rounded-full border-2 border-white bg-orange-400">
                    <div className="size-full animate-pulse rounded-full bg-orange-300/70" />
                  </div>
                )}
              </div>

              {/* Input Form - Enhanced with opening/closing animation */}
              <form onSubmit={finalHandleSubmit} className={cn(
                "relative flex-1 transition-all ease-out",
                isAnyDrawerOpen 
                  ? "scale-95 opacity-70 duration-200" 
                  : "scale-100 opacity-100 duration-400 delay-100"
              )}>
                <Input
                  disabled={isLoading || isAnyDrawerOpen}
                  type="text"
                  value={input ?? ""}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !isAnyDrawerOpen) {
                      e.preventDefault();
                      finalHandleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                    }
                  }}
                  onFocus={isAnyDrawerOpen ? undefined : onChatFocus}
                  placeholder={
                    isAnyDrawerOpen 
                      ? "" 
                      : messages.length === 0
                        ? "Ask Neiji"
                        : "Message"
                  }
                  className={cn(
                    "h-12 w-full rounded-full border-orange-200 bg-white/80 pl-6 pr-14 text-base transition-all focus:bg-white focus:ring-2 focus:ring-orange-300",
                    isAnyDrawerOpen && "cursor-default"
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isLoading ? (
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="orangeOutline" 
                      onClick={stop} 
                      className={cn(
                        "size-9 rounded-full transition-all duration-300",
                        isAnyDrawerOpen && "scale-90 opacity-70"
                      )}
                    >
                      <Loader2 className="size-5 animate-spin" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      size="icon" 
                      variant="orange" 
                      className={cn(
                        "size-9 rounded-full transition-all ease-out",
                        isAnyDrawerOpen 
                          ? "scale-0 opacity-0 rotate-180 pointer-events-none duration-200" 
                          : "scale-100 opacity-100 rotate-0 duration-400 delay-200 hover:scale-105 active:scale-95"
                      )}
                      disabled={!((input ?? "").trim()) || isAnyDrawerOpen}
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
