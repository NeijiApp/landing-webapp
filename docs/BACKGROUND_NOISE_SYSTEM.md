# Background Noise System Documentation

## Overview

The background noise system allows users to add ambient sounds (ocean waves, rain, focus waves, relax waves) to their meditation sessions. The system provides real-time audio mixing using the Web Audio API.

## Architecture

### Core Components

1. **BackgroundNoiseConfig** (`src/lib/audio/background-noise.ts`)
   - Defines available background noise types
   - Configuration for each noise type (file path, default volume, etc.)

2. **AudioMixer** (`src/lib/audio/audio-mixer.ts`)
   - Handles real-time audio mixing using Web Audio API
   - Manages meditation audio + background noise synchronization
   - Provides volume control for both tracks

3. **BackgroundNoiseDrawer** (`src/components/chat/shared/background-noise-drawer.tsx`)
   - UI component for selecting background noise
   - Volume controls for individual noise types
   - Preview functionality

4. **EnhancedAudioPlayerWithNoise** (`src/components/chat/shared/enhanced-audio-player-with-noise.tsx`)
   - Enhanced version of the audio player with background noise support
   - Integrates with AudioMixer for seamless playback

### File Structure

```
src/
├── lib/audio/
│   ├── background-noise.ts          # Configuration and types
│   └── audio-mixer.ts              # Web Audio API mixing logic
├── components/chat/shared/
│   ├── background-noise-drawer.tsx  # Noise selection UI
│   └── enhanced-audio-player-with-noise.tsx  # Enhanced player
├── app/api/background-noise/
│   └── route.ts                    # API endpoint for noise configs
public/
└── background-noise/               # Static MP3 files
    ├── ocean-waves-30min.mp3
    ├── rain-30min.mp3
    ├── focus-waves-30min.mp3
    └── relax-waves-30min.mp3
```

## Usage

### 1. Adding Background Noise Files

Place 30-minute MP3 files in `public/background-noise/`:

```bash
public/background-noise/
├── ocean-waves-30min.mp3    # Gentle ocean waves
├── rain-30min.mp3          # Soft rain sounds
├── focus-waves-30min.mp3   # Ambient focus waves
└── relax-waves-30min.mp3   # Calming ambient sounds
```

### 2. Using the Enhanced Audio Player

```tsx
import { EnhancedAudioPlayerWithNoise } from "~/components/chat/shared/enhanced-audio-player-with-noise";

<EnhancedAudioPlayerWithNoise
  audioUrl="/path/to/meditation.mp3"
  title="Your Meditation"
/>
```

### 3. Background Noise Selection

Users can:
- Click the waves icon (🌊) in the audio player
- Select from 4 background noise types
- Preview each noise type (5-second preview)
- Adjust individual volume levels
- Set master volume control
- Apply or clear background noise

## Technical Implementation

### Web Audio API Integration

The `AudioMixer` class uses the Web Audio API for real-time audio mixing:

```typescript
// Create audio context and gain nodes
const audioContext = new AudioContext();
const meditationGainNode = audioContext.createGain();
const backgroundGainNode = audioContext.createGain();
const masterGainNode = audioContext.createGain();

// Connect nodes for mixing
meditationGainNode.connect(masterGainNode);
backgroundGainNode.connect(masterGainNode);
masterGainNode.connect(audioContext.destination);
```

### Volume Control

- **Meditation Volume**: Controls the main meditation audio
- **Background Volume**: Controls the background noise level
- **Master Volume**: Overall volume control for both tracks

### Audio Synchronization

- Both tracks start/stop together
- Background noise loops seamlessly
- Meditation audio plays once and stops
- Background noise stops when meditation ends

## Configuration

### Adding New Background Noise Types

1. Add MP3 file to `public/background-noise/`
2. Update `BACKGROUND_NOISE_CONFIGS` in `background-noise.ts`:

```typescript
{
  id: 'new-noise',
  name: 'New Noise',
  description: 'Description of the noise',
  icon: '🎵',
  file: '/background-noise/new-noise-30min.mp3',
  defaultVolume: 0.3,
  category: 'ambient'
}
```

3. Add icon mapping in `background-noise-drawer.tsx`:

```typescript
const NOISE_ICONS = {
  'new-noise': NewIcon,
  // ... existing icons
} as const;
```

### Volume Defaults

Each noise type has a default volume level:
- Ocean Waves: 30%
- Rain: 40%
- Focus Waves: 20%
- Relax Waves: 30%

## API Endpoints

### GET /api/background-noise

Returns available background noise configurations:

```json
{
  "success": true,
  "data": {
    "noises": [
      {
        "id": "ocean-waves",
        "name": "Ocean Waves",
        "description": "Gentle ocean waves for relaxation",
        "icon": "🌊",
        "file": "/background-noise/ocean-waves-30min.mp3",
        "defaultVolume": 0.3,
        "category": "nature"
      }
    ]
  }
}
```

## Browser Compatibility

- **Web Audio API**: Supported in all modern browsers
- **Audio Context**: Requires user interaction to start
- **Fallback**: Graceful degradation if Web Audio API unavailable

## Performance Considerations

- **File Size**: 30-minute MP3 files (~15-30MB each)
- **Memory Usage**: Audio files loaded on demand
- **CPU Usage**: Minimal impact with Web Audio API
- **Caching**: Browser caches static MP3 files

## Future Enhancements

1. **Dynamic Background Noise**: Generate noise procedurally
2. **User Preferences**: Save favorite noise combinations
3. **Custom Uploads**: Allow users to upload their own background sounds
4. **Advanced Mixing**: EQ controls, fade in/out effects
5. **Spatial Audio**: 3D audio positioning for immersive experience

## Troubleshooting

### Common Issues

1. **Audio Context Suspended**: Requires user interaction to start
2. **File Not Found**: Check file paths in configuration
3. **Volume Issues**: Verify gain node connections
4. **Browser Compatibility**: Check Web Audio API support

### Debug Mode

Enable debug logging by setting:
```typescript
console.log('Audio Mixer Debug:', audioMixer.getState());
```

## Testing

### Manual Testing Checklist

- [ ] Background noise drawer opens/closes
- [ ] Noise selection works
- [ ] Preview functionality (5-second preview)
- [ ] Volume controls respond correctly
- [ ] Audio mixing works (meditation + background)
- [ ] Synchronization (start/stop together)
- [ ] Master volume control
- [ ] Clear background noise
- [ ] Apply background noise

### Test Files

Create test MP3 files for development:
- Short 10-second loops for testing
- Different volume levels
- Various audio qualities
