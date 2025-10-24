import { NextRequest, NextResponse } from 'next/server';
import { ttsRouter, generateParagraphAudioWithRouter } from '~/lib/meditation/tts-router';

/**
 * GET /api/test-tts-router
 * Test the TTS router directly
 */
export async function GET(request: NextRequest) {
  try {
    const testResults = {
      routerInfo: ttsRouter.getProviderInfo(),
      tests: [] as any[],
    };

    // Test 1: Direct router call
    try {
      console.log('🧪 Testing TTS Router directly...');
      const stream = await ttsRouter.generateAudio('Hello, this is a test.', {
        voice_gender: 'female',
      });
      
      const response = new Response(stream);
      const buffer = await response.arrayBuffer();
      
      testResults.tests.push({
        test: 'direct_router',
        success: true,
        size: buffer.byteLength,
        provider: ttsRouter.getCurrentProvider(),
      });
    } catch (error) {
      testResults.tests.push({
        test: 'direct_router',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: ttsRouter.getCurrentProvider(),
      });
    }

    // Test 2: Convenience function
    try {
      console.log('🧪 Testing convenience function...');
      const stream = await generateParagraphAudioWithRouter('Hello, this is a test.', {
        voice_gender: 'female',
      });
      
      const response = new Response(stream);
      const buffer = await response.arrayBuffer();
      
      testResults.tests.push({
        test: 'convenience_function',
        success: true,
        size: buffer.byteLength,
      });
    } catch (error) {
      testResults.tests.push({
        test: 'convenience_function',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 3: Switch providers and test
    try {
      console.log('🧪 Testing provider switch...');
      ttsRouter.setProvider('openai');
      const stream = await ttsRouter.generateAudio('Hello, this is a test.', {
        voice_gender: 'female',
      });
      
      const response = new Response(stream);
      const buffer = await response.arrayBuffer();
      
      testResults.tests.push({
        test: 'provider_switch',
        success: true,
        size: buffer.byteLength,
        provider: ttsRouter.getCurrentProvider(),
      });
    } catch (error) {
      testResults.tests.push({
        test: 'provider_switch',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: ttsRouter.getCurrentProvider(),
      });
    }

    return NextResponse.json({
      success: true,
      data: testResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error testing TTS router:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test TTS router',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
