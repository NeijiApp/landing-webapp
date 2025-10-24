/**
 * Deployment-Aware Audio Loader
 * Handles audio loading issues specific to deployment environments
 */

export interface AudioLoadResult {
  success: boolean;
  audio?: HTMLAudioElement;
  error?: string;
  details?: {
    readyState: number;
    networkState: number;
    errorCode?: number;
    errorMessage?: string;
    contentType?: string;
    fileSize?: number;
  };
}

export class DeploymentAudioLoader {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;
  private static readonly LOAD_TIMEOUT = 30000; // 30 seconds
  
  // Track all created audio elements to ensure cleanup
  private static activeAudioElements = new Set<HTMLAudioElement>();

  /**
   * Load audio with deployment-aware error handling
   */
  static async loadAudio(audioUrl: string, options: {
    loop?: boolean;
    preload?: 'none' | 'metadata' | 'auto';
    volume?: number;
  } = {}): Promise<AudioLoadResult> {
    const { loop = false, preload = 'auto', volume = 1 } = options;
    const createdAudios: HTMLAudioElement[] = [];

    try {
      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        console.log(`🎵 [DeploymentAudioLoader] Attempt ${attempt}/${this.MAX_RETRIES} to load:`, audioUrl);

        try {
          const result = await this.attemptLoad(audioUrl, { loop, preload, volume });
          
          // Track this audio element
          if (result.audio) {
            createdAudios.push(result.audio);
          }
          
          if (result.success && result.audio) {
            console.log(`🎵 [DeploymentAudioLoader] Successfully loaded on attempt ${attempt}`);
            
            // Clean up all OTHER audio elements that were created but failed
            createdAudios.forEach(audio => {
              if (audio !== result.audio) {
                console.log('🧹 [DeploymentAudioLoader] Cleaning up failed audio attempt');
                this.cleanupAudio(audio);
              }
            });
            
            // Track the successful audio
            this.activeAudioElements.add(result.audio);
            
            return result;
          }

          console.warn(`🎵 [DeploymentAudioLoader] Attempt ${attempt} failed:`, result.error);
          
          // Wait before retry
          if (attempt < this.MAX_RETRIES) {
            await this.delay(this.RETRY_DELAY * attempt);
          }
        } catch (error) {
          console.error(`🎵 [DeploymentAudioLoader] Attempt ${attempt} threw error:`, error);
          
          if (attempt === this.MAX_RETRIES) {
            // Clean up all created audios
            createdAudios.forEach(audio => this.cleanupAudio(audio));
            
            return {
              success: false,
              error: `Failed after ${this.MAX_RETRIES} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
              details: {
                readyState: 0,
                networkState: 0,
              }
            };
          }
        }
      }

      // Clean up all created audios if we get here
      createdAudios.forEach(audio => this.cleanupAudio(audio));
      
      return {
        success: false,
        error: `Failed to load audio after ${this.MAX_RETRIES} attempts`,
        details: {
          readyState: 0,
          networkState: 0,
        }
      };
    } catch (error) {
      // Clean up all created audios on unexpected error
      createdAudios.forEach(audio => this.cleanupAudio(audio));
      throw error;
    }
  }
  
  /**
   * Clean up an audio element completely
   */
  private static cleanupAudio(audio: HTMLAudioElement): void {
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      audio.load(); // Force clear the buffer
      this.activeAudioElements.delete(audio);
    } catch (error) {
      console.error('🧹 [DeploymentAudioLoader] Error cleaning audio:', error);
    }
  }
  
  /**
   * Remove a specific audio element from tracking (public method)
   */
  static removeAudio(audio: HTMLAudioElement): void {
    this.cleanupAudio(audio);
  }

  /**
   * Single attempt to load audio
   */
  private static async attemptLoad(
    audioUrl: string, 
    options: { loop: boolean; preload: 'none' | 'metadata' | 'auto'; volume: number }
  ): Promise<AudioLoadResult> {
    return new Promise((resolve) => {
      const audio = new Audio();
      
      // IMPORTANT: Set source FIRST to avoid loading default URL
      audio.src = audioUrl;
      
      audio.loop = options.loop;
      audio.preload = options.preload;
      audio.volume = options.volume;

      let isResolved = false;
      let timeoutId: NodeJS.Timeout;

      const resolveOnce = (result: AudioLoadResult) => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeoutId);
        
        // Clean up event listeners
        audio.removeEventListener('canplaythrough', handleSuccess);
        audio.removeEventListener('loadeddata', handleSuccess);
        audio.removeEventListener('loadedmetadata', handleSuccess);
        audio.removeEventListener('error', handleError);
        
        // If failed, don't return the audio element at all
        if (!result.success) {
          try {
            audio.pause();
            audio.src = '';
            (audio as any).__cleaned = true;
          } catch (error) {
            console.error('🎵 [DeploymentAudioLoader] Error cleaning up audio:', error);
          }
          // Remove audio from result
          delete result.audio;
        }
        
        resolve(result);
      };

      // Set timeout
      timeoutId = setTimeout(() => {
        resolveOnce({
          success: false,
          error: 'Audio loading timeout',
          details: {
            readyState: audio.readyState,
            networkState: audio.networkState,
          }
        });
      }, this.LOAD_TIMEOUT);

      // Success handlers
      const handleSuccess = () => {
        console.log(`🎵 [DeploymentAudioLoader] Audio loaded successfully:`, audioUrl);
        resolveOnce({
          success: true,
          audio,
          details: {
            readyState: audio.readyState,
            networkState: audio.networkState,
          }
        });
      };

      // Error handler
      const handleError = (event: Event) => {
        // Don't log errors about default URL or if already cleaned
        if (!(audio as any).__cleaned && !audio.src.includes('/chat') && audio.src !== '') {
          console.error(`🎵 [DeploymentAudioLoader] Audio error:`, event);
          console.error(`🎵 [DeploymentAudioLoader] Audio error details:`, {
            error: audio.error,
            readyState: audio.readyState,
            networkState: audio.networkState,
            src: audio.src,
          });
        }

        resolveOnce({
          success: false,
          error: this.getErrorMessage(audio.error),
          details: {
            readyState: audio.readyState,
            networkState: audio.networkState,
            errorCode: audio.error?.code,
            errorMessage: audio.error?.message,
          }
        });
      };

      // Add event listeners
      audio.addEventListener('canplaythrough', handleSuccess);
      audio.addEventListener('loadeddata', handleSuccess);
      audio.addEventListener('loadedmetadata', handleSuccess);
      audio.addEventListener('error', handleError);

      // Load the audio (source already set above)
      audio.load();
    });
  }

  /**
   * Get user-friendly error message
   */
  private static getErrorMessage(error: MediaError | null): string {
    if (!error) return 'Unknown audio error';

    switch (error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        return 'Audio loading was aborted';
      case MediaError.MEDIA_ERR_NETWORK:
        return 'Network error while loading audio';
      case MediaError.MEDIA_ERR_DECODE:
        return 'Audio decode error - file may be corrupted';
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return 'Audio format not supported';
      default:
        return error.message || 'Unknown audio error';
    }
  }

  /**
   * Clean up all active audio elements
   */
  static cleanupAllAudio(): void {
    console.log(`🧹 [DeploymentAudioLoader] Cleaning up ${this.activeAudioElements.size} active audio elements`);
    this.activeAudioElements.forEach(audio => {
      this.cleanupAudio(audio);
    });
    this.activeAudioElements.clear();
  }
  
  /**
   * Get count of active audio elements (for debugging)
   */
  static getActiveAudioCount(): number {
    return this.activeAudioElements.size;
  }

  /**
   * Test if audio files are accessible
   */
  static async testAudioAccessibility(audioUrls: string[]): Promise<{
    accessible: string[];
    inaccessible: Array<{ url: string; error: string }>;
  }> {
    const accessible: string[] = [];
    const inaccessible: Array<{ url: string; error: string }> = [];

    for (const url of audioUrls) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          accessible.push(url);
        } else {
          inaccessible.push({
            url,
            error: `HTTP ${response.status}: ${response.statusText}`
          });
        }
      } catch (error) {
        inaccessible.push({
          url,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { accessible, inaccessible };
  }

  /**
   * Delay utility
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
