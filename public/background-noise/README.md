# Background Noise Files

This directory contains 30-minute background noise MP3 files for meditation sessions.

## Required Files

Place the following 30-minute MP3 files in this directory:

- `ocean-waves-30min.mp3` - Gentle ocean waves for relaxation
- `rain-30min.mp3` - Soft rain sounds for focus  
- `focus-waves-30min.mp3` - Ambient waves for concentration
- `relax-waves-30min.mp3` - Calming ambient sounds

## File Requirements

- **Format**: MP3
- **Duration**: 30 minutes (1800 seconds)
- **Quality**: 128kbps or higher
- **Loop**: Files should be seamless for looping
- **Size**: Approximately 15-30MB per file

## Usage

These files are served statically from `/background-noise/` and used by the `AudioMixer` class for real-time audio mixing with meditation content.

## Adding New Background Noises

1. Add the MP3 file to this directory
2. Update `BACKGROUND_NOISE_CONFIGS` in `src/lib/audio/background-noise.ts`
3. Add corresponding icon mapping in `src/components/chat/shared/background-noise-drawer.tsx`
