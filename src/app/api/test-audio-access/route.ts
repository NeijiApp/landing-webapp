import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/test-audio-access
 * Simple endpoint to test if audio files are accessible
 */
export async function GET(request: NextRequest) {
  try {
    const baseUrl = new URL(request.url).origin;
    const audioFile = '/background-noise/ocean-waves.mp3';
    const fullUrl = new URL(audioFile, baseUrl).toString();

    // Test if the audio file is accessible
    const response = await fetch(fullUrl, { method: 'HEAD' });
    
    const result = {
      audioFile,
      fullUrl,
      accessible: response.ok,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      lastModified: response.headers.get('last-modified'),
      cacheControl: response.headers.get('cache-control'),
      acceptRanges: response.headers.get('accept-ranges'),
      etag: response.headers.get('etag'),
      timestamp: new Date().toISOString(),
      baseUrl,
      deploymentInfo: {
        platform: process.env.VERCEL ? 'Vercel' : process.env.RAILWAY_STATIC_URL ? 'Railway' : 'Unknown',
        vercel: process.env.VERCEL,
        railway: process.env.RAILWAY_STATIC_URL,
        nodeEnv: process.env.NODE_ENV,
      }
    };

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error testing audio access:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test audio access',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
