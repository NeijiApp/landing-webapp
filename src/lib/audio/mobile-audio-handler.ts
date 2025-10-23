/**
 * Mobile Audio Handler
 * Handles mobile-specific audio issues including autoplay policies and user interaction requirements
 */

export interface MobileAudioResult {
  success: boolean;
  audio?: HTMLAudioElement;
  error?: string;
  requiresUserInteraction?: boolean;
  isMobile?: boolean;
}

export class MobileAudioHandler {
  private static isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private static hasUserInteracted = false;
  private static audioContextUnlocked = false;

  /**
   * Initialize mobile audio handling
   * This should be called on user interaction to unlock audio context
   */
  static async initializeOnUserInteraction(): Promise<void> {
    if (!this.isMobileDevice()) return;

    try {
      // Create a silent audio context to unlock audio on mobile
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create and play a silent buffer to unlock audio
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);

      this.audioContextUnlocked = true;
      this.hasUserInteracted = true;
      
      console.log('🎵 Mobile audio context unlocked');
    } catch (error) {
      console.warn('🎵 Failed to unlock mobile audio context:', error);
    }
  }

  /**
   * Load and prepare audio for mobile devices
   */
  static async loadAudioForMobile(
    audioUrl: string, 
    options: {
      loop?: boolean;
      preload?: 'none' | 'metadata' | 'auto';
      volume?: number;
    } = {}
  ): Promise<MobileAudioResult> {
    const { loop = false, preload = 'auto', volume = 1 } = options;
    const isMobile = this.isMobileDevice();

    console.log('🎵 Loading audio for mobile:', { audioUrl: audioUrl.substring(0, 50), isMobile });

    try {
      const audio = new Audio();
      audio.loop = loop;
      audio.preload = preload;
      audio.volume = volume;

      // For mobile, we need to handle the audio loading differently
      if (isMobile) {
        // Set mobile-specific attributes
        audio.setAttribute('playsinline', 'true');
        audio.setAttribute('webkit-playsinline', 'true');
        
        // For iOS, we need to handle the audio differently
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          audio.setAttribute('x-webkit-airplay', 'deny');
        }
      }

      // Load the audio
      audio.src = audioUrl;
      audio.load();

      return new Promise((resolve) => {
        let isResolved = false;
        let timeoutId: NodeJS.Timeout;

        const resolveOnce = (result: MobileAudioResult) => {
          if (isResolved) return;
          isResolved = true;
          clearTimeout(timeoutId);
          resolve(result);
        };

        // Set timeout
        timeoutId = setTimeout(() => {
          resolveOnce({
            success: false,
            error: 'Audio loading timeout',
            requiresUserInteraction: isMobile && !this.hasUserInteracted,
            isMobile,
          });
        }, 30000);

        // Success handlers
        const handleSuccess = () => {
          console.log('🎵 Mobile audio loaded successfully');
          resolveOnce({
            success: true,
            audio,
            requiresUserInteraction: isMobile && !this.hasUserInteracted,
            isMobile,
          });
        };

        // Error handler
        const handleError = (event: Event) => {
          console.error('🎵 Mobile audio error:', event);
          resolveOnce({
            success: false,
            error: this.getMobileErrorMessage(audio.error),
            requiresUserInteraction: isMobile && !this.hasUserInteracted,
            isMobile,
          });
        };

        // Add event listeners
        audio.addEventListener('canplaythrough', handleSuccess);
        audio.addEventListener('loadeddata', handleSuccess);
        audio.addEventListener('loadedmetadata', handleSuccess);
        audio.addEventListener('error', handleError);
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requiresUserInteraction: isMobile && !this.hasUserInteracted,
        isMobile,
      };
    }
  }

  /**
   * Play audio with mobile-specific handling
   */
  static async playAudio(audio: HTMLAudioElement): Promise<boolean> {
    const isMobile = this.isMobileDevice();

    try {
      if (isMobile && !this.hasUserInteracted) {
        console.warn('🎵 Attempting to play audio on mobile without user interaction');
        return false;
      }

      await audio.play();
      console.log('🎵 Audio played successfully on mobile');
      return true;
    } catch (error) {
      console.error('🎵 Failed to play audio on mobile:', error);
      
      if (isMobile && (error as any).name === 'NotAllowedError') {
        console.warn('🎵 Audio play blocked - user interaction required');
        return false;
      }
      
      return false;
    }
  }

  /**
   * Get mobile-specific error messages
   */
  private static getMobileErrorMessage(error: MediaError | null): string {
    if (!error) return 'Unknown mobile audio error';

    switch (error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        return 'Audio loading was aborted on mobile';
      case MediaError.MEDIA_ERR_NETWORK:
        return 'Network error while loading audio on mobile';
      case MediaError.MEDIA_ERR_DECODE:
        return 'Audio decode error on mobile - file may be corrupted';
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return 'Audio format not supported on mobile';
      default:
        return error.message || 'Unknown mobile audio error';
    }
  }

  /**
   * Check if audio can play on mobile
   */
  static canPlayOnMobile(): boolean {
    if (!this.isMobileDevice()) return true;
    return this.hasUserInteracted;
  }

  /**
   * Mark that user has interacted (call this on any user interaction)
   */
  static markUserInteraction(): void {
    this.hasUserInteracted = true;
    console.log('🎵 User interaction marked for mobile audio');
  }

  /**
   * Get mobile audio status
   */
  static getMobileAudioStatus(): {
    isMobile: boolean;
    hasUserInteracted: boolean;
    audioContextUnlocked: boolean;
    canPlayAudio: boolean;
  } {
    return {
      isMobile: this.isMobileDevice(),
      hasUserInteracted: this.hasUserInteracted,
      audioContextUnlocked: this.audioContextUnlocked,
      canPlayAudio: this.canPlayOnMobile(),
    };
  }
}
