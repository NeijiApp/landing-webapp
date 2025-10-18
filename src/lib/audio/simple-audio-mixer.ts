/**
 * Simple Audio Mixer - Handles mixing meditation audio with background noise
 * Uses simple HTML5 Audio elements with volume control instead of Web Audio API
 */

import type { BackgroundNoiseConfig, BackgroundNoiseState } from './background-noise';

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
    // Clean up existing meditation audio
    if (this.meditationAudio) {
      this.meditationAudio.pause();
      this.meditationAudio.removeEventListener('timeupdate', this.handleTimeUpdate);
      this.meditationAudio.removeEventListener('ended', this.handleMeditationEnded);
      this.meditationAudio = null;
    }

    this.meditationAudio = new Audio(audioUrl);
    this.meditationAudio.loop = false;
    this.meditationAudio.preload = 'auto';
    this.meditationAudio.volume = 1.0; // Meditation volume always at 100%

    // Add event listeners
    this.meditationAudio.addEventListener('timeupdate', this.handleTimeUpdate.bind(this));
    this.meditationAudio.addEventListener('ended', this.handleMeditationEnded.bind(this));

    // Wait for audio to be ready
    return new Promise((resolve, reject) => {
      if (!this.meditationAudio) {
        reject(new Error('Meditation audio not initialized'));
        return;
      }

      const handleCanPlay = () => {
        this.meditationAudio?.removeEventListener('canplaythrough', handleCanPlay);
        this.meditationAudio?.removeEventListener('error', handleError);
        this.updateState();
        resolve();
      };

      const handleError = (error: Event) => {
        this.meditationAudio?.removeEventListener('canplaythrough', handleCanPlay);
        this.meditationAudio?.removeEventListener('error', handleError);
        reject(error);
      };

      this.meditationAudio.addEventListener('canplaythrough', handleCanPlay);
      this.meditationAudio.addEventListener('error', handleError);
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

    this.backgroundAudio = new Audio(config.file);
    this.backgroundAudio.loop = true;
    this.backgroundAudio.preload = 'auto';
    this.backgroundAudio.volume = 0; // Start muted, will be set by volume control

    this.backgroundNoiseState.selectedNoise = config;
    this.backgroundNoiseState.isPlaying = false; // Don't auto-play, wait for user to start meditation
    this.updateBackgroundVolume();
    
    console.log('🎵 Background noise loaded:', config.name);
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
          await this.backgroundAudio.play();
          this.backgroundNoiseState.isPlaying = true;
          console.log('🎵 Background noise started:', this.backgroundNoiseState.selectedNoise.name);
        } catch (bgError) {
          console.warn('Failed to play background noise:', bgError);
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
    if (this.backgroundAudio && this.backgroundNoiseState.selectedNoise) {
      const baseVolume = this.backgroundNoiseState.selectedNoise.defaultVolume;
      const userVolume = this.backgroundNoiseState.volume;
      // Increase max volume by 50% (multiply by 1.5)
      this.backgroundAudio.volume = Math.min(1.0, baseVolume * userVolume * 1.5);
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
