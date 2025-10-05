"use client";

import { Ban, Brain, SendHorizonal, Sparkles, User } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { EnhancedDrawer } from "./enhanced-drawer";
import { MeditationPanel, type MeditationParams, type ParsedOverrides } from "./meditation-panel";
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

  const [isExpanded, setIsExpanded] = useState(false);
  const [parsedOverrides, setParsedOverrides] = useState<ParsedOverrides | null>(null);

  const isLoading = useMemo(
    () => status === "streaming" || status === "submitted" || isGeneratingMeditation,
    [status, isGeneratingMeditation],
  );

  const { isOpen, openDrawer, closeDrawer } = useDrawer();

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
      {/* Enhanced Drawer */}
      <EnhancedDrawer 
        isOpen={isOpen} 
        onClose={closeDrawer} 
        isAuthenticated={isAuthenticated} 
      />

      {/* Meditation Panel (unchanged) */}
      <div
        className={cn(
          "fixed right-1/2 bottom-[92px] z-5 w-full max-w-xl translate-x-1/2 transition-all duration-300 ease-in-out",
          meditationMode === "meditation"
            ? isExpanded
              ? "h-[min(70dvh,calc(100dvh-140px))]"
              : "h-[min(45dvh,calc(100dvh-140px))]"
            : "h-0",
        )}
      >
        <div className="h-full overflow-hidden">
          <div className="h-full overflow-y-auto px-4 py-4">
            <MeditationPanel
              onGenerate={handleMeditationGenerate}
              isGenerating={isGeneratingMeditation}
              isExpanded={isExpanded}
              toggleExpand={() => setIsExpanded(!isExpanded)}
              parsedOverrides={parsedOverrides}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Input Bar with Smooth Animations */}
      <div className={cn(
        "fixed right-1/2 bottom-0 z-40 w-full max-w-xl translate-x-1/2 transition-all duration-500 ease-out",
        isOpen ? "transform translate-y-0" : "transform translate-y-0"
      )}>
        <div className={cn(
          "rounded-t-2xl bg-white/95 backdrop-blur-md shadow-xl border border-orange-100/50 transition-all duration-500 ease-out",
          isOpen 
            ? "p-0 pb-0 shadow-none border-transparent" 
            : "p-3 pb-[calc(12px+env(safe-area-inset-bottom))] md:p-4"
        )}>
          
          {/* Chat Bar Content - Hide when drawer is open with smooth animation */}
          <div className={cn(
            "transition-all ease-out",
            isOpen 
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
                    isOpen 
                      ? "scale-0 opacity-0 rotate-180 duration-200" 
                      : "scale-100 opacity-100 rotate-0 duration-400 delay-150 hover:scale-105 active:scale-95"
                  )}
                  onClick={() => openDrawer()}
                >
                  <User className={cn(
                    "transition-all ease-out",
                    isOpen ? "size-0 duration-200" : "size-6 duration-300 delay-150"
                  )} />
                </Button>
              )}

              {/* Brain Button - Enhanced with opening animation */}
              <div className="group relative">
                <Button
                  onClick={() => {
                    setMeditationMode(meditationMode === "meditation" ? "chat" : "meditation");
                    if (meditationMode === "meditation") setIsExpanded(false);
                  }}
                  size="icon"
                  variant={meditationMode === "meditation" ? "orange" : "orangeOutline"}
                  className={cn(
                    "size-12 rounded-full transition-all ease-out",
                    isOpen 
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

                {meditationMode === "meditation" && (
                  <div className="absolute -right-1 -top-1 size-4 rounded-full border-2 border-white bg-orange-400">
                    <div className="size-full animate-pulse rounded-full bg-orange-300/70" />
                  </div>
                )}
              </div>

              {/* Input Form - Enhanced with opening/closing animation */}
              <form onSubmit={finalHandleSubmit} className={cn(
                "relative flex-1 transition-all ease-out",
                isOpen 
                  ? "scale-95 opacity-70 duration-200" 
                  : "scale-100 opacity-100 duration-400 delay-100"
              )}>
                <Input
                  disabled={isLoading || isOpen}
                  type="text"
                  value={input ?? ""}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !isOpen) {
                      e.preventDefault();
                      finalHandleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                    }
                  }}
                  onFocus={isOpen ? undefined : onChatFocus}
                  placeholder={
                    isOpen 
                      ? "" 
                      : meditationMode === "meditation"
                        ? "Describe your meditation..."
                        : messages.length === 0
                          ? "Ask Neiji"
                          : "Message"
                  }
                  className={cn(
                    "h-12 w-full rounded-full border-orange-200 bg-white/80 pl-6 pr-14 text-base transition-all focus:bg-white focus:ring-2 focus:ring-orange-300",
                    isOpen && "cursor-default"
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
                        isOpen && "scale-90 opacity-70"
                      )}
                    >
                      <Ban className="size-5 animate-spin" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      size="icon" 
                      variant="orange" 
                      className={cn(
                        "size-9 rounded-full transition-all ease-out",
                        isOpen 
                          ? "scale-0 opacity-0 rotate-180 pointer-events-none duration-200" 
                          : "scale-100 opacity-100 rotate-0 duration-400 delay-200 hover:scale-105 active:scale-95"
                      )}
                      disabled={!((input ?? "").trim()) || isOpen}
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
