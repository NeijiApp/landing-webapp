import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/test-audio-files
 * Test if audio files are accessible in production
 */
export async function GET(request: NextRequest) {
  try {
    const baseUrl = new URL(request.url).origin;
    const audioFiles = [
      '/background-noise/ocean-waves.mp3',
      '/background-noise/rain-sounds.mp3',
      '/background-noise/focus-music.mp3',
      '/background-noise/relax-music.mp3'
    ];

    const results = [];
    
    for (const filePath of audioFiles) {
      try {
        const fullUrl = new URL(filePath, baseUrl).toString();
        console.log('Testing file:', fullUrl);
        
        const response = await fetch(fullUrl, {
          method: 'HEAD',
        });
        
        results.push({
          file: filePath,
          fullUrl,
          accessible: response.ok,
          status: response.status,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length'),
          lastModified: response.headers.get('last-modified'),
        });
      } catch (error) {
        results.push({
          file: filePath,
          fullUrl: new URL(filePath, baseUrl).toString(),
          accessible: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        baseUrl,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error testing audio files:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test audio files'
      },
      { status: 500 }
    );
  }
}

