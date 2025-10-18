/**
 * Background Noise Configuration
 * Defines available background noise types and their properties
 */

export interface BackgroundNoiseConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  file: string;
  defaultVolume: number;
  category: 'nature' | 'ambient' | 'focus' | 'relax';
}

export const BACKGROUND_NOISE_CONFIGS: BackgroundNoiseConfig[] = [
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    description: '3 hours of deep ocean waves for anxiety relief',
    icon: '🌊',
    file: '/background-noise/3 Hours of Ocean Waves Sounds Deep Anxiety and Stress Relief Calming Meditation Audio.mp3',
    defaultVolume: 0.3, // Will be boosted by 50% in audio mixer
    category: 'nature'
  },
  {
    id: 'rain',
    name: 'Rain Sounds',
    description: 'Soothing rain with distant thunder for deep sleep',
    icon: '🌧️',
    file: '/background-noise/Soothing rain sounds in hitting clay jars with distant thunder. Great for relaxing and deep sleep.mp3',
    defaultVolume: 0.4, // Will be boosted by 50% in audio mixer
    category: 'nature'
  },
  {
    id: 'focus-waves',
    name: 'Focus Music',
    description: 'Binaural beats for enhanced concentration',
    icon: '🎯',
    file: '/background-noise/Memory Binaural Beats Focus Music.mp3',
    defaultVolume: 0.2, // Will be boosted by 50% in audio mixer
    category: 'focus'
  },
  {
    id: 'relax-waves',
    name: 'Inner Balance',
    description: '432Hz healing frequencies for inner peace',
    icon: '😌',
    file: '/background-noise/Inner Balance 432Hz 111Hz Healing Calm Inner Peace Release All Blockages Meditation Sleep.mp3',
    defaultVolume: 0.3, // Will be boosted by 50% in audio mixer
    category: 'relax'
  }
];

export interface BackgroundNoiseState {
  selectedNoise: BackgroundNoiseConfig | null;
  isPlaying: boolean;
  volume: number;
  masterVolume: number;
}

export const DEFAULT_BACKGROUND_NOISE_STATE: BackgroundNoiseState = {
  selectedNoise: null,
  isPlaying: false,
  volume: 0.8, // Default cursor at 80%
  masterVolume: 0.7
};

/**
 * Get background noise config by ID
 */
export function getBackgroundNoiseConfig(id: string): BackgroundNoiseConfig | undefined {
  return BACKGROUND_NOISE_CONFIGS.find(config => config.id === id);
}

/**
 * Get background noise configs by category
 */
export function getBackgroundNoiseConfigsByCategory(category: BackgroundNoiseConfig['category']): BackgroundNoiseConfig[] {
  return BACKGROUND_NOISE_CONFIGS.filter(config => config.category === category);
}
