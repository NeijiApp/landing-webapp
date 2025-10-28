import type { BackgroundNoiseConfig, BackgroundNoiseState } from './background-noise';
import { DeploymentAudioLoader } from './deployment-audio-loader';
import { MobileAudioHandler } from './mobile-audio-handler';

export interface AudioMixerState {
  isPlaying: boolean;
  meditationVolume: number;
  backgroundVolume: number;
  currentTime: number;
  duration: number;
  backgroundNoiseState?: any; // For debugging
}

/**
 * SimpleAudioMixer - Uses HTML5 Audio elements for audio playback
 * Much simpler than Web Audio API but sufficient for our needs
 */
export class SimpleAudioMixer {
  private meditationAudio: HTMLAudioElement | null = null;
  private backgroundAudio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private backgroundNoiseState: BackgroundNoiseState;
  private onStateChange: (state: AudioMixerState) => void;
  private handleTimeUpdate: () => void;
  private handleMeditationEnded: () => void;

  constructor(
    backgroundNoiseState: BackgroundNoiseState,
    onStateChange: (state: AudioMixerState) => void
  ) {
    this.backgroundNoiseState = backgroundNoiseState;
    this.onStateChange = onStateChange;
    this.handleTimeUpdate = this.onTimeUpdate.bind(this);
    this.handleMeditationEnded = this.onMeditationEnded.bind(this);
  }

  /**
   * Load meditation audio using DeploymentAudioLoader
   */
  async loadMeditationAudio(audioUrl: string): Promise<void> {
    console.log('[SimpleAudioMixer] Loading meditation audio:', audioUrl.substring(0, 100));
    
    // Clean up existing meditation audio
    if (this.meditationAudio) {
      this.meditationAudio.removeEventListener('timeupdate', this.handleTimeUpdate);
      this.meditationAudio.removeEventListener('ended', this.handleMeditationEnded);
      DeploymentAudioLoader.removeAudio(this.meditationAudio);
      this.meditationAudio = null;
    }

    try {
      // Use DeploymentAudioLoader for consistent audio loading and tracking
      const result = await DeploymentAudioLoader.loadAudio(audioUrl, {
        loop: false,
        preload: 'auto',
        volume: 0.56 // Reduce meditation guidance volume by 44% (from original)
      });

      if (!result.success || !result.audio) {
        console.error('[SimpleAudioMixer] Failed to load meditation audio:', result.error);
        throw new Error(result.error || 'Failed to load meditation audio');
      }

      this.meditationAudio = result.audio;

      // Add event listeners
      this.meditationAudio.addEventListener('timeupdate', this.handleTimeUpdate);
      this.meditationAudio.addEventListener('ended', this.handleMeditationEnded);

      // Wait for duration to be available
      if (!this.meditationAudio.duration || isNaN(this.meditationAudio.duration)) {
        console.log('[SimpleAudioMixer] Waiting for duration...');
        await new Promise<void>((resolve) => {
          const checkDuration = () => {
            if (this.meditationAudio && this.meditationAudio.duration && !isNaN(this.meditationAudio.duration)) {
              this.meditationAudio.removeEventListener('loadedmetadata', checkDuration);
              this.meditationAudio.removeEventListener('durationchange', checkDuration);
              resolve();
            }
          };
          
          this.meditationAudio?.addEventListener('loadedmetadata', checkDuration);
          this.meditationAudio?.addEventListener('durationchange', checkDuration);
          
          // Timeout fallback
          setTimeout(() => {
            this.meditationAudio?.removeEventListener('loadedmetadata', checkDuration);
            this.meditationAudio?.removeEventListener('durationchange', checkDuration);
            resolve();
          }, 2000);
        });
      }

      console.log('[SimpleAudioMixer] Meditation audio loaded successfully, duration:', this.meditationAudio.duration);
      this.updateState();
    } catch (error) {
      console.error('[SimpleAudioMixer] Error loading meditation audio:', error);
      throw error;
    }
  }

  /**
   * Load background noise audio (EXCLUSIVE MODE - NO AUTO START)
   */
  async loadBackgroundNoise(config: BackgroundNoiseConfig): Promise<void> {
    console.log('🎵 [LOAD BG] Loading background noise (EXCLUSIVE MODE - NO AUTO START):', config.name);

    // EXCLUSIVE: Ensure only one background loading operation at a time
    if (this.backgroundNoiseState.selectedNoise && this.backgroundNoiseState.selectedNoise.id !== config.id) {
      console.log('🎵 [LOAD BG] Different background currently active, stopping it first');
      this.stopBackgroundNoise();
    }

    // Clean up existing background audio completely
    if (this.backgroundAudio) {
      console.log('🎵 [LOAD BG] Cleaning up existing background audio');
      try {
        const audioToClean = this.backgroundAudio;
        this.backgroundAudio = null; // Clear reference first

        // Use DeploymentAudioLoader to properly clean up
        DeploymentAudioLoader.removeAudio(audioToClean);
        console.log('🎵 [LOAD BG] Existing background audio cleaned from loader');
      } catch (error) {
        console.error('🎵 [LOAD BG] Error cleaning up background audio:', error);
      }
    }

    // Reset background noise state
    this.backgroundNoiseState.selectedNoise = null;
    this.backgroundNoiseState.isPlaying = false;

    try {
      console.log('🎵 [LOAD BG] Creating background audio for:', config.name, 'File:', config.file);

      const result = await DeploymentAudioLoader.loadAudio(config.file, {
        loop: true,
        preload: 'auto',
        volume: 0, // Start muted, will be set by volume control
      });

      if (!result.success || !result.audio) {
        console.error('🎵 [LOAD BG] Failed to load background noise:', result.error);
        console.error('🎵 [LOAD BG] Error details:', result.details);
        console.error('🎵 [LOAD BG] Config:', config);
        throw new Error(result.error || 'Failed to load background noise');
      }

      this.backgroundAudio = result.audio;

      // Store unique ID for debugging
      (this.backgroundAudio as any).__bgId = `bg-${Date.now()}`;
      console.log('🎵 [LOAD BG] Background audio assigned, ID:', (this.backgroundAudio as any).__bgId);

      this.backgroundNoiseState.selectedNoise = config;
      this.backgroundNoiseState.isPlaying = false; // EXPLICIT: Never auto-start during background change
      this.updateBackgroundVolume();

      console.log('🎵 [LOAD BG] Background noise loaded successfully (but not started):', config.name);
      console.log('🎵 [LOAD BG] Background audio state:', {
        paused: this.backgroundAudio.paused,
        loop: this.backgroundAudio.loop,
        volume: this.backgroundAudio.volume,
        src: this.backgroundAudio.src.substring(0, 50)
      });

      // CRITICAL FIX: NO AUTO-START when changing background noise
      // The background will be started only when explicitly requested
      console.log('🎵 [LOAD BG] Background loaded but NOT started (exclusive mode)');
      console.log('🎵 [LOAD BG] Background will start only when explicitly requested via startBackgroundNoise()');

    } catch (error) {
      console.error('🎵 [LOAD BG] Failed to create background audio:', error);
      console.error('🎵 [LOAD BG] Config:', config);
      throw error;
    }
  }

  /**
   * Play both meditation and background noise
   */
  async play(): Promise<void> {
    if (!this.meditationAudio) {
      console.error('🎵 Cannot play: meditation audio not loaded');
      return;
    }

    console.log('🎵 Playing meditation audio and background noise');

    try {
      // Mark user interaction for mobile
      MobileAudioHandler.markUserInteraction();
      
      // Play meditation audio
      const meditationPlayed = await MobileAudioHandler.playAudio(this.meditationAudio);
      
      if (meditationPlayed) {
        this.isPlaying = true;
        console.log('🎵 Meditation audio playing');
        
        // If there's background noise selected, start it
        if (this.backgroundNoiseState.selectedNoise) {
          console.log('🎵 Background noise selected, starting:', this.backgroundNoiseState.selectedNoise.name);
          await this.startBackgroundNoise();
        }
        
        this.updateState();
      } else {
        console.error('🎵 Failed to play meditation audio (mobile autoplay policy?)');
        console.error('Mobile audio status:', MobileAudioHandler.getMobileAudioStatus());
        throw new Error('Failed to play meditation audio');
      }
    } catch (error) {
      console.error('🎵 Error playing audio:', error);
      console.error('Mobile audio status:', MobileAudioHandler.getMobileAudioStatus());
      throw error;
    }
  }

  /**
   * Pause both meditation and background noise
   */
  pause(): void {
    console.log('🎵 [PAUSE] ====== PAUSING MEDITATION AND BACKGROUND ======');
    console.log('🎵 [PAUSE] Meditation audio exists:', !!this.meditationAudio);
    console.log('🎵 [PAUSE] Background audio exists:', !!this.backgroundAudio);
    console.log('🎵 [PAUSE] Background audio ID:', this.backgroundAudio ? (this.backgroundAudio as any).__bgId : 'N/A');

    // Clean up any orphaned audio elements first
    this.cleanupOrphanedAudioElements();

    if (this.meditationAudio) {
      this.meditationAudio.pause();
      console.log('🎵 [PAUSE] ✅ Meditation audio paused');
    }

    if (this.backgroundAudio) {
      console.log('🎵 [PAUSE] Background audio BEFORE pause:', {
        id: (this.backgroundAudio as any).__bgId,
        paused: this.backgroundAudio.paused,
        currentTime: this.backgroundAudio.currentTime,
        volume: this.backgroundAudio.volume,
        src: this.backgroundAudio.src.substring(0, 50)
      });

      try {
        this.backgroundAudio.pause();
        console.log('🎵 [PAUSE] Background audio AFTER pause:', {
          id: (this.backgroundAudio as any).__bgId,
          paused: this.backgroundAudio.paused,
          currentTime: this.backgroundAudio.currentTime
        });

        // Verify it's actually paused
        if (!this.backgroundAudio.paused) {
          console.error('🎵 [PAUSE] ❌ ERROR: Background audio.pause() called but audio is NOT paused!');
          // Force pause by setting currentTime and reloading
          this.backgroundAudio.currentTime = 0;
          this.backgroundAudio.load();
        } else {
          console.log('🎵 [PAUSE] ✅ Background audio successfully paused');
        }
      } catch (error) {
        console.error('🎵 [PAUSE] ❌ ERROR pausing background audio:', error);
      }
    } else {
      console.log('🎵 [PAUSE] ⚠️ No background audio to pause');
    }

    this.backgroundNoiseState.isPlaying = false;
    this.isPlaying = false;
    this.updateState();
    console.log('🎵 [PAUSE] ====== PAUSE COMPLETE ======');
  }

  /**
   * Stop both meditation and background noise
   */
  stop(): void {
    if (this.meditationAudio) {
      this.meditationAudio.pause();
      this.meditationAudio.currentTime = 0;
    }
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio.currentTime = 0;
    }
    this.backgroundNoiseState.isPlaying = false;
    this.isPlaying = false;
    this.updateState();
  }

  /**
   * Stop only background noise
   */
  stopBackgroundNoise(): void {
    console.log('🎵 [STOP BG] Stopping background noise');
    console.log('🎵 [STOP BG] Background audio exists:', !!this.backgroundAudio);
    console.log('🎵 [STOP BG] Current background:', this.backgroundNoiseState.selectedNoise?.name || 'None');

    if (this.backgroundAudio) {
      console.log('🎵 [STOP BG] Background audio state before stop:', {
        paused: this.backgroundAudio.paused,
        currentTime: this.backgroundAudio.currentTime,
        volume: this.backgroundAudio.volume,
        src: this.backgroundAudio.src
      });

      try {
        const audioToClean = this.backgroundAudio;
        this.backgroundAudio = null; // Clear reference first

        // Use DeploymentAudioLoader to properly clean up
        DeploymentAudioLoader.removeAudio(audioToClean);
        console.log('🎵 [STOP BG] Background audio element removed and cleaned from loader');
      } catch (error) {
        console.error('🎵 [STOP BG] Error stopping background audio:', error);
      }
    }

    // Also stop any other background noise that might be playing
    this.stopAllOtherBackgrounds();

    this.backgroundNoiseState.selectedNoise = null;
    this.backgroundNoiseState.isPlaying = false;
    this.updateState();
    console.log('🎵 [STOP BG] Background noise completely stopped');
  }

  /**
   * Force stop all background noise (public method for debugging)
   */
  forceStopAllBackgroundNoise(): void {
    console.log('🛑 [FORCE STOP] Force stopping all background noise');

    // Stop current background
    if (this.backgroundAudio) {
      try {
        const audioToClean = this.backgroundAudio;
        this.backgroundAudio = null;
        DeploymentAudioLoader.removeAudio(audioToClean);
      } catch (error) {
        console.error('🛑 [FORCE STOP] Error stopping current background:', error);
      }
    }

    // Stop all other backgrounds
    this.stopAllOtherBackgrounds();

    // Reset state
    this.backgroundNoiseState.selectedNoise = null;
    this.backgroundNoiseState.isPlaying = false;
    this.updateState();

    console.log('🛑 [FORCE STOP] All background noise stopped');
  }

  /**
   * Start background noise if loaded but not playing
   */
  async startBackgroundNoise(): Promise<void> {
    console.log('🎵 [START BG] Starting background noise');

    // CRITICAL: Clean up any orphaned audio elements first
    this.cleanupOrphanedAudioElements();

    // Also stop any other background that might be playing
    this.stopAllOtherBackgrounds();

    if (!this.backgroundAudio) {
      console.warn('🎵 [START BG] No background audio loaded');
      return;
    }

    if (!this.backgroundNoiseState.selectedNoise) {
      console.warn('🎵 [START BG] No background noise selected');
      return;
    }

    if (this.backgroundNoiseState.isPlaying) {
      console.log('🎵 [START BG] Background noise already playing');
      return;
    }

    // Only start if meditation is playing
    if (!this.isPlaying || !this.meditationAudio || this.meditationAudio.paused) {
      console.log('🎵 [START BG] Meditation not playing, background will start when meditation starts');
      return;
    }

    console.log('🎵 [START BG] Starting background noise:', this.backgroundNoiseState.selectedNoise.name);
    console.log('🎵 [START BG] Background audio state before start:', {
      paused: this.backgroundAudio.paused,
      currentTime: this.backgroundAudio.currentTime,
      volume: this.backgroundAudio.volume,
      src: this.backgroundAudio.src.substring(0, 50)
    });

    try {
      const backgroundPlayed = await MobileAudioHandler.playAudio(this.backgroundAudio);
      if (backgroundPlayed) {
        this.backgroundNoiseState.isPlaying = true;
        console.log('🎵 [START BG] Background noise started successfully');
        console.log('🎵 [START BG] Background audio state after start:', {
          paused: this.backgroundAudio.paused,
          currentTime: this.backgroundAudio.currentTime,
          isPlaying: this.backgroundNoiseState.isPlaying
        });
        this.updateState();
      } else {
        console.warn('🎵 [START BG] Background noise failed to start (mobile autoplay policy)');
        this.backgroundNoiseState.isPlaying = false;
      }
    } catch (error) {
      console.error('🎵 [START BG] Error starting background noise:', error);
      this.backgroundNoiseState.isPlaying = false;
    }
  }

  /**
   * Clean up any orphaned audio elements that might be playing
   */
  private cleanupOrphanedAudioElements(): void {
    try {
      // Check for any audio elements in the DOM that are not our controlled ones
      const allAudioElements = document.querySelectorAll('audio');

      allAudioElements.forEach((audio, index) => {
        // Check if this audio is controlled by our mixer
        const isOurAudio = audio === this.meditationAudio || audio === this.backgroundAudio;

        if (!isOurAudio && !audio.paused) {
          console.log('🧹 [CLEANUP] Found orphaned playing audio:', {
            index,
            src: audio.src?.substring(0, 50),
            currentTime: audio.currentTime,
            paused: audio.paused
          });

          // Stop orphaned audio
          try {
            audio.pause();
            audio.currentTime = 0;
            audio.src = '';

            // Remove from DOM
            if (audio.parentNode) {
              audio.parentNode.removeChild(audio);
              console.log('🧹 [CLEANUP] Orphaned audio removed from DOM');
            }
          } catch (cleanupError) {
            console.error('🧹 [CLEANUP] Error cleaning orphaned audio:', cleanupError);
          }
        }
      });
    } catch (error) {
      console.error('🧹 [CLEANUP] Error during orphaned audio cleanup:', error);
    }
  }

  /**
   * Stop any other background audio that might be playing (from previous loads)
   */
  private stopAllOtherBackgrounds(): void {
    try {
      // Get all audio elements that might be background noise
      const allAudioElements = document.querySelectorAll('audio');

      allAudioElements.forEach((audio, index) => {
        // Check if this looks like background noise (by URL pattern)
        const isBackgroundNoise = audio.src &&
          (audio.src.includes('/background-noise/') ||
           audio.src.includes('background-noise'));

        // But not our current controlled background
        const isOurCurrentBackground = audio === this.backgroundAudio;

        if (isBackgroundNoise && !isOurCurrentBackground && !audio.paused) {
          console.log('🛑 [STOP OTHER] Found other background noise playing:', {
            index,
            src: audio.src?.substring(0, 50),
            currentTime: audio.currentTime,
            paused: audio.paused
          });

          // Stop this other background
          try {
            audio.pause();
            audio.currentTime = 0;
            audio.src = '';

            // Remove from DOM and cleanup
            if (audio.parentNode) {
              audio.parentNode.removeChild(audio);
              console.log('🛑 [STOP OTHER] Other background removed from DOM');
            }

            // Also remove from DeploymentAudioLoader tracking
            DeploymentAudioLoader.removeAudio(audio);
          } catch (cleanupError) {
            console.error('🛑 [STOP OTHER] Error stopping other background:', cleanupError);
          }
        }
      });
    } catch (error) {
      console.error('🛑 [STOP OTHER] Error stopping other backgrounds:', error);
    }
  }

  /**
   * Seek to specific time
   */
  seekTo(time: number): void {
    if (this.meditationAudio) {
      this.meditationAudio.currentTime = time;
    }
    if (this.backgroundAudio) {
      this.backgroundAudio.currentTime = time;
    }
    this.updateState();
  }

  /**
   * Set meditation volume (controlled by main player)
   */
  setMeditationVolume(volume: number): void {
    // Meditation volume is controlled by the main audio player
    // This method is kept for compatibility but doesn't do anything
  }

  /**
   * Set background noise volume
   */
  setBackgroundVolume(volume: number): void {
    this.backgroundNoiseState.volume = Math.max(0, Math.min(1, volume));
    this.updateBackgroundVolume();
    
    // If volume is being increased from 0 and meditation is playing, restart background
    if (volume > 0 && this.isPlaying && this.backgroundAudio && this.backgroundAudio.paused && this.backgroundNoiseState.selectedNoise) {
      console.log('🎵 Restarting background noise (volume increased from 0)');
      MobileAudioHandler.playAudio(this.backgroundAudio).then(played => {
        if (played) {
          this.backgroundNoiseState.isPlaying = true;
          console.log('🎵 Background noise restarted');
        }
      }).catch(err => {
        console.error('🎵 Failed to restart background noise:', err);
      });
    }
    
    console.log('🎵 Background volume set to:', Math.round(volume * 100) + '%');
  }

  /**
   * Set master volume (controlled by main player)
   */
  setMasterVolume(volume: number): void {
    // Master volume is controlled by the main audio player
    // This method is kept for compatibility but doesn't do anything
  }

  /**
   * Update background volume based on current settings
   */
  private updateBackgroundVolume(): void {
    if (this.backgroundAudio) {
      // Use user volume directly without amplification
      const userVolume = Math.max(0, Math.min(1, this.backgroundNoiseState.volume));
      this.backgroundAudio.volume = userVolume;
      console.log('🎵 Background audio volume set to:', userVolume);
    }
  }

  /**
   * Handle time update events
   */
  private onTimeUpdate(): void {
    this.updateState();
  }

  /**
   * Handle meditation ended
   */
  private onMeditationEnded(): void {
    this.stopBackgroundNoise();
    this.isPlaying = false;
    this.updateState();
  }

  /**
   * Update and emit current state
   */
  private updateState(): void {
    const state: AudioMixerState = {
      isPlaying: this.isPlaying && !!(this.meditationAudio?.paused === false),
      meditationVolume: 1.0,
      backgroundVolume: this.backgroundNoiseState.volume,
      currentTime: this.meditationAudio?.currentTime || 0,
      duration: this.meditationAudio?.duration || 0,
      backgroundNoiseState: {
        selectedNoise: this.backgroundNoiseState.selectedNoise,
        isPlaying: this.backgroundNoiseState.isPlaying,
        volume: this.backgroundNoiseState.volume
      }
    };

    this.onStateChange(state);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    console.log('🧹 [DISPOSE] Disposing audio mixer');
    
    if (this.meditationAudio) {
      this.meditationAudio.removeEventListener('timeupdate', this.handleTimeUpdate);
      this.meditationAudio.removeEventListener('ended', this.handleMeditationEnded);
      DeploymentAudioLoader.removeAudio(this.meditationAudio);
      this.meditationAudio = null;
    }
    
    if (this.backgroundAudio) {
      DeploymentAudioLoader.removeAudio(this.backgroundAudio);
      this.backgroundAudio = null;
    }
    
    this.isPlaying = false;
    console.log('🧹 [DISPOSE] Audio mixer disposed');
  }

  /**
   * Get current state
   */
  getState(): AudioMixerState {
    return {
      isPlaying: this.isPlaying && !!(this.meditationAudio?.paused === false),
      meditationVolume: 1.0,
      backgroundVolume: this.backgroundNoiseState.volume,
      currentTime: this.meditationAudio?.currentTime || 0,
      duration: this.meditationAudio?.duration || 0
    };
  }

  /**
   * Debug function to check audio state
   */
  debugAudioState(): void {
    console.log('🔍 [DEBUG] ===== AUDIO MIXER STATE =====');
    console.log('🔍 [DEBUG] isPlaying:', this.isPlaying);
    console.log('🔍 [DEBUG] Meditation audio:', {
      exists: !!this.meditationAudio,
      paused: this.meditationAudio?.paused,
      currentTime: this.meditationAudio?.currentTime,
      duration: this.meditationAudio?.duration
    });
    console.log('🔍 [DEBUG] Background audio:', {
      exists: !!this.backgroundAudio,
      id: this.backgroundAudio ? (this.backgroundAudio as any).__bgId : 'N/A',
      paused: this.backgroundAudio?.paused,
      currentTime: this.backgroundAudio?.currentTime,
      volume: this.backgroundAudio?.volume,
      loop: this.backgroundAudio?.loop,
      src: this.backgroundAudio?.src?.substring(0, 50) || 'N/A'
    });
    console.log('🔍 [DEBUG] Background state:', {
      selectedNoise: this.backgroundNoiseState.selectedNoise?.name || 'None',
      isPlaying: this.backgroundNoiseState.isPlaying,
      volume: this.backgroundNoiseState.volume
    });
    console.log('🔍 [DEBUG] ===========================');
    
    // Check for orphaned audio elements in the page
    const allAudio = document.querySelectorAll('audio');
    console.log('🔍 [DEBUG] Total audio elements in page:', allAudio.length);
    allAudio.forEach((audio, index) => {
      console.log(`🔍 [DEBUG] Audio ${index}:`, {
        id: (audio as any).__bgId || 'unknown',
        paused: audio.paused,
        currentTime: audio.currentTime,
        src: audio.src.substring(0, 50)
      });
    });
  }
}
