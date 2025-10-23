/**
 * Simple Audio Mixer - Handles mixing meditation audio with background noise
 * Uses simple HTML5 Audio elements with volume control instead of Web Audio API
 */

import type { BackgroundNoiseConfig, BackgroundNoiseState } from './background-noise';
import { DeploymentAudioLoader } from './deployment-audio-loader';

export interface AudioMixerState {
  isPlaying: boolean;
  meditationVolume: number;
  backgroundVolume: number;
  currentTime: number;
  duration: number;
}

export class SimpleAudioMixer {
  private meditationAudio: HTMLAudioElement | null = null;
  private backgroundAudio: HTMLAudioElement | null = null;
  private backgroundNoiseState: BackgroundNoiseState;
  private onStateChange: (state: AudioMixerState) => void;
  private isPlaying = false;

  constructor(
    backgroundNoiseState: BackgroundNoiseState,
    onStateChange: (state: AudioMixerState) => void
  ) {
    this.backgroundNoiseState = backgroundNoiseState;
    this.onStateChange = onStateChange;
  }

  /**
   * Load meditation audio
   */
  async loadMeditationAudio(audioUrl: string): Promise<void> {
    console.log('[SimpleAudioMixer] Loading meditation audio:', audioUrl.substring(0, 100));
    
    // Clean up existing meditation audio
    if (this.meditationAudio) {
      this.meditationAudio.pause();
      this.meditationAudio.removeEventListener('timeupdate', this.handleTimeUpdate);
      this.meditationAudio.removeEventListener('ended', this.handleMeditationEnded);
      this.meditationAudio = null;
    }

    this.meditationAudio = new Audio();
    this.meditationAudio.loop = false;
    this.meditationAudio.preload = 'auto';
    this.meditationAudio.volume = 0.8; // Reduce meditation guidance volume by 20%

    // Add event listeners
    this.meditationAudio.addEventListener('timeupdate', this.handleTimeUpdate.bind(this));
    this.meditationAudio.addEventListener('ended', this.handleMeditationEnded.bind(this));

    // Wait for audio to be ready with multiple event listeners for mobile compatibility
    return new Promise((resolve, reject) => {
      if (!this.meditationAudio) {
        reject(new Error('Meditation audio not initialized'));
        return;
      }

      let isLoaded = false;
      let timeoutId: NodeJS.Timeout;

      const handleSuccess = () => {
        if (isLoaded) return;
        isLoaded = true;

        console.log('[SimpleAudioMixer] Audio loaded successfully, duration:', this.meditationAudio?.duration);
        
        // Clean up all event listeners
        this.meditationAudio?.removeEventListener('loadedmetadata', handleSuccess);
        this.meditationAudio?.removeEventListener('canplay', handleSuccess);
        this.meditationAudio?.removeEventListener('canplaythrough', handleSuccess);
        this.meditationAudio?.removeEventListener('loadeddata', handleSuccess);
        this.meditationAudio?.removeEventListener('error', handleError);
        
        clearTimeout(timeoutId);
        this.updateState();
        resolve();
      };

      const handleError = (error: Event | ErrorEvent) => {
        if (isLoaded) return;
        isLoaded = true;

        console.error('[SimpleAudioMixer] Error loading audio:', error);
        console.error('[SimpleAudioMixer] Audio error details:', {
          error: this.meditationAudio?.error,
          networkState: this.meditationAudio?.networkState,
          readyState: this.meditationAudio?.readyState,
          src: this.meditationAudio?.src?.substring(0, 100)
        });
        
        // Clean up all event listeners
        this.meditationAudio?.removeEventListener('loadedmetadata', handleSuccess);
        this.meditationAudio?.removeEventListener('canplay', handleSuccess);
        this.meditationAudio?.removeEventListener('canplaythrough', handleSuccess);
        this.meditationAudio?.removeEventListener('loadeddata', handleSuccess);
        this.meditationAudio?.removeEventListener('error', handleError);
        
        clearTimeout(timeoutId);
        reject(error);
      };

      // Add multiple event listeners for better mobile compatibility
      this.meditationAudio.addEventListener('loadedmetadata', handleSuccess);
      this.meditationAudio.addEventListener('canplay', handleSuccess);
      this.meditationAudio.addEventListener('canplaythrough', handleSuccess);
      this.meditationAudio.addEventListener('loadeddata', handleSuccess);
      this.meditationAudio.addEventListener('error', handleError);

      // Set source and explicitly load
      this.meditationAudio.src = audioUrl;
      this.meditationAudio.load();

      // Set a timeout to detect stuck loading (15 seconds)
      timeoutId = setTimeout(() => {
        if (!isLoaded) {
          console.error('[SimpleAudioMixer] Loading timeout - audio failed to load within 15s');
          handleError(new Event('timeout'));
        }
      }, 15000);
    });
  }

  /**
   * Load background noise audio
   */
  async loadBackgroundNoise(config: BackgroundNoiseConfig): Promise<void> {
    // Clean up existing background audio
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio = null;
    }

    try {
      console.log('🎵 Creating background audio for:', config.name, 'File:', config.file);
      
      const result = await DeploymentAudioLoader.loadAudio(config.file, {
        loop: true,
        preload: 'auto',
        volume: 0, // Start muted, will be set by volume control
      });

      if (!result.success || !result.audio) {
        console.error('🎵 Failed to load background noise:', result.error);
        console.error('🎵 Error details:', result.details);
        console.error('🎵 Config:', config);
        return;
      }

      this.backgroundAudio = result.audio;
      this.backgroundNoiseState.selectedNoise = config;
      this.backgroundNoiseState.isPlaying = false; // Don't auto-play, wait for user to start meditation
      this.updateBackgroundVolume();
      
      console.log('🎵 Background noise loaded:', config.name, 'File:', config.file);
    } catch (error) {
      console.error('🎵 Failed to create background audio:', error);
      console.error('🎵 Config:', config);
    }
  }

  /**
   * Start playing both meditation and background noise
   */
  async play(): Promise<void> {
    try {
      // Start meditation audio
      if (this.meditationAudio) {
        await this.meditationAudio.play();
        console.log('🎵 Meditation audio started');
      }

      // Start background noise if selected and loaded
      if (this.backgroundAudio && this.backgroundNoiseState.selectedNoise) {
        try {
          // Check if audio is ready to play
          if (this.backgroundAudio.readyState >= 2) { // HAVE_CURRENT_DATA or higher
            await this.backgroundAudio.play();
            this.backgroundNoiseState.isPlaying = true;
            console.log('🎵 Background noise started:', this.backgroundNoiseState.selectedNoise.name);
          } else {
            console.warn('🎵 Background noise not ready to play, readyState:', this.backgroundAudio.readyState);
            // Try to load it first
            this.backgroundAudio.load();
            this.backgroundAudio.addEventListener('canplaythrough', async () => {
              try {
                await this.backgroundAudio!.play();
                this.backgroundNoiseState.isPlaying = true;
                console.log('🎵 Background noise started after loading:', this.backgroundNoiseState.selectedNoise!.name);
              } catch (playError) {
                console.error('🎵 Failed to play background noise after loading:', playError);
              }
            });
          }
        } catch (bgError) {
          console.error('🎵 Failed to play background noise:', bgError);
          console.error('🎵 Background audio state:', {
            readyState: this.backgroundAudio.readyState,
            error: this.backgroundAudio.error,
            src: this.backgroundAudio.src
          });
          // Continue with meditation even if background fails
        }
      } else {
        console.log('🎵 No background noise selected or loaded');
      }

      this.isPlaying = true;
      this.updateState();
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  /**
   * Pause both meditation and background noise
   */
  pause(): void {
    if (this.meditationAudio) {
      this.meditationAudio.pause();
    }
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
    }
    this.backgroundNoiseState.isPlaying = false;
    this.isPlaying = false;
    this.updateState();
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
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio.currentTime = 0;
    }
    this.backgroundNoiseState.selectedNoise = null;
    this.backgroundNoiseState.isPlaying = false;
    this.updateState();
  }

  /**
   * Seek to specific time
   */
  seekTo(time: number): void {
    if (this.meditationAudio) {
      this.meditationAudio.currentTime = time;
    }
    // Don't seek background noise as it's looped
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
      // Boost background max by 2x across the continuum, clamped to 1.0
      const userVolume = Math.max(0, Math.min(1, this.backgroundNoiseState.volume));
      this.backgroundAudio.volume = Math.min(1.0, userVolume * 2);
    }
  }

  /**
   * Handle time update events
   */
  private handleTimeUpdate(): void {
    this.updateState();
  }

  /**
   * Handle meditation ended
   */
  private handleMeditationEnded(): void {
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
      meditationVolume: 1.0, // Controlled by main player
      backgroundVolume: this.backgroundNoiseState.volume,
      currentTime: this.meditationAudio?.currentTime || 0,
      duration: this.meditationAudio?.duration || 0
    };

    this.onStateChange(state);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.meditationAudio) {
      this.meditationAudio.pause();
      this.meditationAudio.removeEventListener('timeupdate', this.handleTimeUpdate);
      this.meditationAudio.removeEventListener('ended', this.handleMeditationEnded);
      this.meditationAudio = null;
    }
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio = null;
    }
    this.isPlaying = false;
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
}
