import { NextRequest, NextResponse } from 'next/server';
import { env } from '~/env';
import { ttsRouter } from '~/lib/meditation/tts-router';

/**
 * GET /api/debug-tts
 * Debug TTS configuration and test both providers
 */
export async function GET(request: NextRequest) {
  try {
    const debugInfo = {
      environment: {
        hasOpenAIKey: !!env.OPENAI_API_KEY,
        hasElevenLabsKey: !!env.ELEVENLABS_API_KEY,
        ttsProvider: env.TTS_PROVIDER,
        nodeEnv: env.NODE_ENV,
      },
      ttsRouter: {
        currentProvider: ttsRouter.getCurrentProvider(),
        providerInfo: ttsRouter.getProviderInfo(),
      },
      timestamp: new Date().toISOString(),
    };

    // Just check configuration without making API calls
    const testResults = {
      elevenlabs: {
        configured: !!env.ELEVENLABS_API_KEY,
        keyLength: env.ELEVENLABS_API_KEY ? env.ELEVENLABS_API_KEY.length : 0,
      },
      openai: {
        configured: !!env.OPENAI_API_KEY,
        keyLength: env.OPENAI_API_KEY ? env.OPENAI_API_KEY.length : 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        ...debugInfo,
        testResults,
      }
    });
  } catch (error) {
    console.error('Error debugging TTS:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to debug TTS',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
