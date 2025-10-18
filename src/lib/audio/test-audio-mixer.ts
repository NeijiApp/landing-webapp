/**
 * Test script for SimpleAudioMixer
 * Run this in browser console to test the audio mixer
 */

import { SimpleAudioMixer } from './simple-audio-mixer';
import { DEFAULT_BACKGROUND_NOISE_STATE } from './background-noise';

export function testAudioMixer() {
  console.log('🧪 Testing SimpleAudioMixer...');
  
  const mixer = new SimpleAudioMixer(DEFAULT_BACKGROUND_NOISE_STATE, (state) => {
    console.log('📊 Audio State:', state);
  });

  // Test meditation audio loading
  mixer.loadMeditationAudio('/assets/silence.mp3').then(() => {
    console.log('✅ Meditation audio loaded successfully');
  }).catch((error) => {
    console.error('❌ Failed to load meditation audio:', error);
  });

  // Test background noise loading
  const oceanConfig = {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    description: '3 hours of deep ocean waves for anxiety relief',
    icon: '🌊',
    file: '/background-noise/3 Hours of Ocean Waves Sounds Deep Anxiety and Stress Relief Calming Meditation Audio.mp3',
    defaultVolume: 0.3,
    category: 'nature' as const
  };

  mixer.loadBackgroundNoise(oceanConfig).then(() => {
    console.log('✅ Background noise loaded successfully');
  }).catch((error) => {
    console.error('❌ Failed to load background noise:', error);
  });

  // Test volume control
  mixer.setBackgroundVolume(0.5);
  console.log('✅ Background volume set to 50%');

  // Test play/pause
  setTimeout(() => {
    mixer.play().then(() => {
      console.log('✅ Audio playing successfully');
    }).catch((error) => {
      console.error('❌ Failed to play audio:', error);
    });
  }, 1000);

  // Clean up after 5 seconds
  setTimeout(() => {
    mixer.dispose();
    console.log('✅ Audio mixer disposed');
  }, 5000);

  return mixer;
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testAudioMixer = testAudioMixer;
}
