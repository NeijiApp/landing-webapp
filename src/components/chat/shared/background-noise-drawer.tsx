"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { 
  BackgroundNoiseConfig, 
  BackgroundNoiseState 
} from "~/lib/audio/background-noise";
import { 
  DEFAULT_BACKGROUND_NOISE_STATE,
  BACKGROUND_NOISE_CONFIGS 
} from "~/lib/audio/background-noise";
import { DeploymentAudioLoader } from "~/lib/audio/deployment-audio-loader";
import { MobileAudioHandler } from "~/lib/audio/mobile-audio-handler";
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  X,
  Waves,
  CloudRain,
  Focus,
  Heart
} from "lucide-react";

interface BackgroundNoiseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (state: BackgroundNoiseState) => void;
  currentState?: BackgroundNoiseState;
}

const NOISE_ICONS = {
  'ocean-waves': Waves,
  'rain': CloudRain,
  'focus-waves': Focus,
  'relax-waves': Heart,
} as const;

export function BackgroundNoiseDrawer({
  isOpen,
  onClose,
  onApply,
  currentState = DEFAULT_BACKGROUND_NOISE_STATE
}: BackgroundNoiseDrawerProps) {
  const [state, setState] = useState<BackgroundNoiseState>(currentState);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [isPreviewing, setIsPreviewing] = useState<string | null>(null);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationCleanupRef = useRef<(() => void) | null>(null);

  // Update state when currentState changes
  useEffect(() => {
    setState(currentState);
  }, [currentState]);

  const handleNoiseSelect = (config: BackgroundNoiseConfig) => {
    setState(prev => ({
      ...prev,
      selectedNoise: prev.selectedNoise?.id === config.id ? null : config
    }));
  };


  const handlePreview = async (config: BackgroundNoiseConfig) => {
    // Prevent concurrent preview operations
    if (isPreviewLoading) {
      console.log('🎵 Preview operation already in progress, ignoring click');
      return;
    }
    
    // Stop current preview completely
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setPreviewAudio(null);
    }
    
    // Clean up any running animations
    if (animationCleanupRef.current) {
      animationCleanupRef.current();
      animationCleanupRef.current = null;
    }
    
    // Clear any pending timeouts
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    // If clicking the same preview button, toggle it off
    if (isPreviewing === config.id) {
      setIsPreviewing(null);
      setPreviewProgress(0);
      setIsFadingOut(false);
      return;
    }

    setIsPreviewLoading(true);
    
    try {
      console.log('🎵 Starting preview for:', config.name, 'File:', config.file);
      
      const result = await DeploymentAudioLoader.loadAudio(config.file, {
        loop: true,
        preload: 'auto',
        volume: config.defaultVolume * 0.5, // Fixed volume for preview
      });

      if (!result.success || !result.audio) {
        console.error('🎵 Failed to load preview audio:', result.error);
        console.error('🎵 Error details:', result.details);
        setIsPreviewing(null);
        setPreviewAudio(null);
        setPreviewProgress(0);
        setIsFadingOut(false);
        setIsPreviewLoading(false);
        return;
      }

      const audio = result.audio;
      
      // Mark user interaction for mobile audio
      MobileAudioHandler.markUserInteraction();
      
      const played = await MobileAudioHandler.playAudio(audio);
      if (played) {
        console.log('🎵 Preview audio playing:', config.name);
        setPreviewAudio(audio);
        setIsPreviewing(config.id);
        setPreviewProgress(0);
        setIsFadingOut(false);
        
        // Start progress animation with smooth timing
        const startTime = Date.now();
        const previewDuration = 5000; // 5 seconds of preview
        const fadeOutDuration = 2000; // 2 seconds of fade out
        const totalDuration = previewDuration + fadeOutDuration; // 7 seconds total
        
        let animationId: number;
        let intervalId: NodeJS.Timeout;
        
        const updateProgress = () => {
          const elapsed = Date.now() - startTime;
          
          if (elapsed < previewDuration) {
            // First 5 seconds: smooth progress animation
            const previewProgress = Math.min(elapsed / previewDuration, 1);
            setPreviewProgress(previewProgress);
            setIsFadingOut(false);
            
            // Debug: Log progress every 500ms
            if (Math.floor(elapsed / 500) !== Math.floor((elapsed - 16) / 500)) {
              console.log(`🎵 Preview progress: ${Math.round(previewProgress * 100)}% (${elapsed}ms)`);
            }
            
            // Continue animation
            animationId = requestAnimationFrame(updateProgress);
          } else if (elapsed < totalDuration) {
            // Next 2 seconds: fade out (keep circle at 100% but fade audio)
            setPreviewProgress(1);
            setIsFadingOut(true);
            
            // Fade out the audio volume
            const fadeOutProgress = (elapsed - previewDuration) / fadeOutDuration;
            const volume = Math.max(0, 1 - fadeOutProgress);
            audio.volume = volume * config.defaultVolume * 0.5;
            
            // Continue animation
            animationId = requestAnimationFrame(updateProgress);
          } else {
            // Animation complete - stop and reset icon state
            setPreviewProgress(0);
            setIsFadingOut(false);
            setIsPreviewing(null);
            return;
          }
        };
        
        // Start the animation with both requestAnimationFrame and setInterval for reliability
        animationId = requestAnimationFrame(updateProgress);
        
        // Backup interval for smooth updates (every 16ms ≈ 60fps)
        intervalId = setInterval(() => {
          const elapsed = Date.now() - startTime;
          if (elapsed < previewDuration) {
            const previewProgress = Math.min(elapsed / previewDuration, 1);
            setPreviewProgress(previewProgress);
          } else if (elapsed < totalDuration) {
            setPreviewProgress(1);
            const fadeOutProgress = (elapsed - previewDuration) / fadeOutDuration;
            const volume = Math.max(0, 1 - fadeOutProgress);
            audio.volume = volume * config.defaultVolume * 0.5;
          } else {
            clearInterval(intervalId);
          }
        }, 16);
        
        // Store cleanup function in ref for later use
        const cleanup = () => {
          if (animationId) {
            cancelAnimationFrame(animationId);
          }
          if (intervalId) {
            clearInterval(intervalId);
          }
        };
        
        animationCleanupRef.current = cleanup;
        setIsPreviewLoading(false);
      } else {
        console.warn('🎵 Preview audio failed to play (mobile autoplay policy?)');
        setPreviewAudio(null);
        setIsPreviewing(null);
        setPreviewProgress(0);
        setIsPreviewLoading(false);
      }

      // Auto-stop preview after 7 seconds (5s preview + 2s fade out)
      previewTimeoutRef.current = setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
        setPreviewAudio(null);
        setIsPreviewing(null);
        setPreviewProgress(0);
        setIsFadingOut(false);
        
        // Clean up animations
        if (animationCleanupRef.current) {
          animationCleanupRef.current();
          animationCleanupRef.current = null;
        }
        
        console.log('🎵 Preview auto-stopped after 7 seconds');
      }, 7000);
    } catch (error) {
      console.error('🎵 Failed to preview audio:', error);
      console.error('🎵 Config:', config);
      setIsPreviewing(null);
      setPreviewAudio(null);
      setPreviewProgress(0);
      setIsFadingOut(false);
      setIsPreviewLoading(false);
    }
  };

  const stopPreviewAudio = () => {
    // Cancel any running animation
    if (animationCleanupRef.current) {
      animationCleanupRef.current();
      animationCleanupRef.current = null;
    }
    
    // Clear any pending timeouts
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setPreviewAudio(null);
    }
    
    setIsPreviewing(null);
    setPreviewProgress(0);
    setIsFadingOut(false);
    setIsPreviewLoading(false);
  };

  const handleApply = () => {
    console.log('🎵 Applying background noise:', state.selectedNoise?.name || 'None');
    
    // Stop any preview audio before applying
    stopPreviewAudio();
    
    onApply(state);
    onClose();
  };

  const handleClear = () => {
    // Stop any preview audio
    stopPreviewAudio();
    
    setState(prev => ({
      ...prev,
      selectedNoise: null,
      isPlaying: false
    }));
  };

  // Cleanup preview audio when drawer closes
  useEffect(() => {
    if (!isOpen) {
      stopPreviewAudio();
    }
  }, [isOpen]);

  // Cleanup preview audio when component unmounts
  useEffect(() => {
    return () => {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
      }
    };
  }, [previewAudio]);

  // Global cleanup - stop all preview audio when component mounts
  useEffect(() => {
    // Stop any existing preview audio when component mounts
    stopPreviewAudio();
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto"
      onClick={onClose}
    >
      {/* Drawer */}
      <div 
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 max-h-[80vh] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="h-1.5 w-12 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Volume2 className="size-4" />
            Background Noise
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* Noise Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Select Background Noise</h3>
            <div className="grid grid-cols-2 gap-3">
              {BACKGROUND_NOISE_CONFIGS.map((config) => {
                const Icon = NOISE_ICONS[config.id as keyof typeof NOISE_ICONS] || Volume2;
                const isSelected = state.selectedNoise?.id === config.id;
                const isPreviewingThis = isPreviewing === config.id;

                return (
                  <div
                    key={config.id}
                    className={cn(
                      "relative p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer hover:scale-105",
                      isSelected
                        ? "border-orange-500 bg-orange-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm"
                    )}
                    onClick={() => handleNoiseSelect(config)}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className={cn(
                        "p-3 rounded-full transition-colors",
                        isSelected ? "bg-orange-100" : "bg-gray-100"
                      )}>
                        <Icon className={cn(
                          "size-5",
                          isSelected ? "text-orange-600" : "text-gray-600"
                        )} />
                      </div>
                      <div className="text-center">
                        <p className={cn(
                          "text-sm font-medium",
                          isSelected ? "text-orange-900" : "text-gray-900"
                        )}>
                          {config.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {config.description}
                        </p>
                      </div>
                    </div>

                    {/* Preview Button with Circular Progress */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "absolute top-2 right-2 h-6 w-6 p-0 rounded-full transition-all relative",
                        isPreviewingThis ? "text-orange-600 bg-orange-100" : "text-gray-400 hover:bg-gray-100"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(config);
                      }}
                    >
                      {isPreviewingThis ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                          {/* Circular Progress Background */}
                          <svg className="w-5 h-5 absolute" viewBox="0 0 20 20">
                            <circle
                              cx="10"
                              cy="10"
                              r="8"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                              className="opacity-30"
                            />
                            <circle
                              cx="10"
                              cy="10"
                              r="8"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 8}`}
                              strokeDashoffset={`${2 * Math.PI * 8 * (1 - previewProgress)}`}
                              strokeLinecap="round"
                              className={cn(
                                isFadingOut && "opacity-60"
                              )}
                              style={{
                                transform: 'rotate(-90deg)',
                                transformOrigin: '10px 10px',
                                transition: 'none' // Disable CSS transitions for smooth JS animation
                              }}
                            />
                          </svg>
                          <Pause className="size-2.5 relative z-10" />
                        </div>
                      ) : (
                        <Play className="size-2.5" />
                      )}
                    </Button>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
                        <div className="h-2 w-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex-1 rounded-2xl text-sm h-10 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              disabled={!state.selectedNoise}
            >
              Clear
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-orange-500 hover:bg-orange-600 rounded-2xl text-sm h-10 font-medium shadow-sm hover:shadow-md transition-all"
              disabled={!state.selectedNoise}
            >
              Apply Background
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(249, 115, 22, 0.3);
          border: 2px solid white;
        }
        
        .slider::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(249, 115, 22, 0.3);
        }
        
        .slider::-webkit-slider-track {
          background: linear-gradient(to right, #f97316 0%, #f97316 var(--value, 0%), #e5e7eb var(--value, 0%), #e5e7eb 100%);
        }
      `}</style>
    </div>
  );
}
