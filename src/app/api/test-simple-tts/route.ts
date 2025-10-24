import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/test-simple-tts
 * Simple TTS test without complex routing
 */
export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasElevenLabsKey: !!process.env.ELEVENLABS_API_KEY,
      openaiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      elevenlabsKeyLength: process.env.ELEVENLABS_API_KEY?.length || 0,
    };

    // Test OpenAI TTS directly
    let openaiTest = null;
    if (envCheck.hasOpenAIKey) {
      try {
        const { openai } = await import('~/utils/openai');
        const response = await openai.audio.speech.create({
          model: "tts-1",
          voice: "nova",
          input: "Hello, this is a test.",
          response_format: "mp3",
        });
        
        const buffer = await response.arrayBuffer();
        openaiTest = {
          success: true,
          size: buffer.byteLength,
        };
      } catch (error) {
        openaiTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Test ElevenLabs TTS directly
    let elevenlabsTest = null;
    if (envCheck.hasElevenLabsKey) {
      try {
        const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/rAmra0SCIYOxYmRNDSm3', {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY!,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: 'Hello, this is a test.',
            model_id: 'eleven_turbo_v2_5',
            output_format: 'mp3_44100_192',
            voice_settings: {
              stability: 0.71,
              similarity_boost: 0.85,
              style: 0.65,
              use_speaker_boost: true,
            },
          }),
        });

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          elevenlabsTest = {
            success: true,
            size: buffer.byteLength,
          };
        } else {
          elevenlabsTest = {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }
      } catch (error) {
        elevenlabsTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        environment: envCheck,
        openaiTest,
        elevenlabsTest,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error testing TTS:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test TTS',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
