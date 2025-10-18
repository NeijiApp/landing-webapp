/**
 * Audio Mixer - Handles mixing meditation audio with background noise
 * Uses Web Audio API for real-time audio mixing and volume control
 */

import { BackgroundNoiseConfig, BackgroundNoiseState } from './background-noise';

export interface AudioMixerState {
  isPlaying: boolean;
  meditationVolume: number;
  backgroundVolume: number;
  masterVolume: number;
  currentTime: number;
  duration: number;
}

export class AudioMixer {
  private audioContext: AudioContext | null = null;
  private meditationAudio: HTMLAudioElement | null = null;
  private backgroundAudio: HTMLAudioElement | null = null;
  private meditationGainNode: GainNode | null = null;
  private backgroundGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private meditationSource: MediaElementAudioSourceNode | null = null;
  private backgroundSource: MediaElementAudioSourceNode | null = null;
  private backgroundNoiseState: BackgroundNoiseState;
  private onStateChange: (state: AudioMixerState) => void;

  constructor(
    backgroundNoiseState: BackgroundNoiseState,
    onStateChange: (state: AudioMixerState) => void
  ) {
    this.backgroundNoiseState = backgroundNoiseState;
    this.onStateChange = onStateChange;
  }

  /**
   * Initialize the audio context and gain nodes
   */
  private async initializeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state !== 'closed') return;

    try {
      // Close existing context if it exists
      if (this.audioContext) {
        await this.audioContext.close();
      }

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create gain nodes for volume control
      this.meditationGainNode = this.audioContext.createGain();
      this.backgroundGainNode = this.audioContext.createGain();
      this.masterGainNode = this.audioContext.createGain();

      // Connect gain nodes
      this.meditationGainNode.connect(this.masterGainNode);
      this.backgroundGainNode.connect(this.masterGainNode);
      this.masterGainNode.connect(this.audioContext.destination);

      // Set initial volumes
      this.updateVolumes();
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw error;
    }
  }

  /**
   * Load meditation audio
   */
  async loadMeditationAudio(audioUrl: string): Promise<void> {
    await this.initializeAudioContext();
    
    // Clean up existing meditation audio
    if (this.meditationAudio) {
      this.meditationAudio.pause();
      this.meditationAudio = null;
    }
    if (this.meditationSource) {
      this.meditationSource = null;
    }

    this.meditationAudio = new Audio(audioUrl);
    this.meditationAudio.loop = false;
    this.meditationAudio.preload = 'auto';

    // Connect to audio context when ready
    this.meditationAudio.addEventListener('canplaythrough', () => {
      if (this.audioContext && this.meditationAudio && this.meditationGainNode && !this.meditationSource) {
        this.meditationSource = this.audioContext.createMediaElementSource(this.meditationAudio);
        this.meditationSource.connect(this.meditationGainNode);
      }
    });

    // Update state when metadata loads
    this.meditationAudio.addEventListener('loadedmetadata', () => {
      this.updateState();
    });

    // Update state during playback
    this.meditationAudio.addEventListener('timeupdate', () => {
      this.updateState();
    });

    // Handle end of meditation
    this.meditationAudio.addEventListener('ended', () => {
      this.stopBackgroundNoise();
      this.updateState();
    });
  }

  /**
   * Load background noise audio
   */
  async loadBackgroundNoise(config: BackgroundNoiseConfig): Promise<void> {
    await this.initializeAudioContext();
    
    // Clean up existing background audio
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio = null;
    }
    if (this.backgroundSource) {
      this.backgroundSource = null;
    }

    this.backgroundAudio = new Audio(config.file);
    this.backgroundAudio.loop = true;
    this.backgroundAudio.preload = 'auto';

    // Connect to audio context when ready
    this.backgroundAudio.addEventListener('canplaythrough', () => {
      if (this.audioContext && this.backgroundAudio && this.backgroundGainNode && !this.backgroundSource) {
        this.backgroundSource = this.audioContext.createMediaElementSource(this.backgroundAudio);
        this.backgroundSource.connect(this.backgroundGainNode);
      }
    });

    this.backgroundNoiseState.selectedNoise = config;
    this.updateVolumes();
  }

  /**
   * Start playing both meditation and background noise
   */
  async play(): Promise<void> {
    if (!this.audioContext) {
      await this.initializeAudioContext();
    }

    // Resume audio context if suspended
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }

    try {
      // Start meditation audio
      if (this.meditationAudio) {
        await this.meditationAudio.play();
      }

      // Start background noise if selected
      if (this.backgroundAudio && this.backgroundNoiseState.selectedNoise) {
        await this.backgroundAudio.play();
        this.backgroundNoiseState.isPlaying = true;
      }

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
   * Set meditation volume
   */
  setMeditationVolume(volume: number): void {
    this.backgroundNoiseState.volume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  /**
   * Set background noise volume
   */
  setBackgroundVolume(volume: number): void {
    this.backgroundNoiseState.volume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.backgroundNoiseState.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  /**
   * Update all volume levels
   */
  private updateVolumes(): void {
    if (this.meditationGainNode) {
      this.meditationGainNode.gain.value = 1.0; // Meditation volume controlled by main player
    }
    if (this.backgroundGainNode) {
      const backgroundVolume = this.backgroundNoiseState.selectedNoise?.defaultVolume || 0.3;
      this.backgroundGainNode.gain.value = backgroundVolume * this.backgroundNoiseState.volume;
    }
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = 1.0; // Master volume controlled by main player
    }
  }

  /**
   * Update and emit current state
   */
  private updateState(): void {
    const state: AudioMixerState = {
      isPlaying: this.backgroundNoiseState.isPlaying && !!(this.meditationAudio?.paused === false),
      meditationVolume: this.backgroundNoiseState.volume,
      backgroundVolume: this.backgroundNoiseState.volume,
      masterVolume: this.backgroundNoiseState.masterVolume,
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
      this.meditationAudio = null;
    }
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio = null;
    }
    if (this.meditationSource) {
      this.meditationSource = null;
    }
    if (this.backgroundSource) {
      this.backgroundSource = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Get current state
   */
  getState(): AudioMixerState {
    return {
      isPlaying: this.backgroundNoiseState.isPlaying && !!(this.meditationAudio?.paused === false),
      meditationVolume: this.backgroundNoiseState.volume,
      backgroundVolume: this.backgroundNoiseState.volume,
      masterVolume: this.backgroundNoiseState.masterVolume,
      currentTime: this.meditationAudio?.currentTime || 0,
      duration: this.meditationAudio?.duration || 0
    };
  }
}
