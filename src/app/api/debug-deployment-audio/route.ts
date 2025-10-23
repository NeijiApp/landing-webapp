import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * GET /api/debug-deployment-audio
 * Comprehensive deployment audio debugging endpoint
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
    const publicDir = path.join(process.cwd(), 'public');
    
    // Get deployment environment info
    const deploymentInfo = {
      platform: process.env.VERCEL ? 'Vercel' : process.env.RAILWAY_STATIC_URL ? 'Railway' : 'Unknown',
      vercel: process.env.VERCEL,
      railway: process.env.RAILWAY_STATIC_URL,
      nodeEnv: process.env.NODE_ENV,
      baseUrl,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      accept: request.headers.get('accept'),
      acceptEncoding: request.headers.get('accept-encoding'),
    };

    for (const filePath of audioFiles) {
      const result: any = {
        file: filePath,
        fullUrl: new URL(filePath, baseUrl).toString(),
      };

      try {
        // Check if file exists in filesystem
        const fullPath = path.join(publicDir, filePath);
        const stats = await fs.stat(fullPath);
        result.fileExists = true;
        result.fileSize = stats.size;
        result.fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
        result.lastModified = stats.mtime.toISOString();
      } catch (error) {
        result.fileExists = false;
        result.fileError = error instanceof Error ? error.message : 'Unknown error';
      }

      try {
        // Test HTTP accessibility with detailed headers
        const response = await fetch(result.fullUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Audio-Debug-Tool/1.0',
            'Accept': 'audio/mpeg, audio/*, */*',
            'Accept-Encoding': 'identity', // Don't compress for testing
          },
        });
        
        result.accessible = response.ok;
        result.status = response.status;
        result.statusText = response.statusText;
        result.contentType = response.headers.get('content-type');
        result.contentLength = response.headers.get('content-length');
        result.lastModified = response.headers.get('last-modified');
        result.cacheControl = response.headers.get('cache-control');
        result.acceptRanges = response.headers.get('accept-ranges');
        result.etag = response.headers.get('etag');
        
        // Check for CORS headers
        result.corsHeaders = {
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
          'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
          'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
        };

        // Check if it's actually an audio file
        if (response.ok && result.contentType) {
          result.isAudioMimeType = result.contentType.startsWith('audio/');
          result.isCorrectMimeType = result.contentType === 'audio/mpeg';
        }

        // Test partial content (range requests)
        if (response.ok) {
          try {
            const rangeResponse = await fetch(result.fullUrl, {
              method: 'GET',
              headers: {
                'Range': 'bytes=0-1023', // First 1KB
              },
            });
            result.rangeRequestSupported = rangeResponse.status === 206;
            result.rangeRequestStatus = rangeResponse.status;
          } catch (rangeError) {
            result.rangeRequestSupported = false;
            result.rangeRequestError = rangeError instanceof Error ? rangeError.message : 'Unknown error';
          }
        }
      } catch (error) {
        result.accessible = false;
        result.httpError = error instanceof Error ? error.message : 'Unknown error';
      }

      results.push(result);
    }

    // Test a simple audio file to verify audio loading works
    let audioTestResult = null;
    try {
      const testAudioUrl = new URL('/background-noise/ocean-waves.mp3', baseUrl).toString();
      const audioResponse = await fetch(testAudioUrl, { method: 'GET' });
      audioTestResult = {
        url: testAudioUrl,
        status: audioResponse.status,
        ok: audioResponse.ok,
        contentType: audioResponse.headers.get('content-type'),
        contentLength: audioResponse.headers.get('content-length'),
        firstBytes: audioResponse.ok ? 'Audio file accessible' : 'Audio file not accessible',
      };
    } catch (error) {
      audioTestResult = {
        url: 'test-failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        deploymentInfo,
        audioTestResult,
        results,
        summary: {
          totalFiles: audioFiles.length,
          accessibleFiles: results.filter(r => r.accessible).length,
          existingFiles: results.filter(r => r.fileExists).length,
          averageFileSizeMB: results
            .filter(r => r.fileSizeMB)
            .reduce((sum, r) => sum + parseFloat(r.fileSizeMB), 0) / results.filter(r => r.fileSizeMB).length,
          rangeRequestSupported: results.filter(r => r.rangeRequestSupported).length,
        }
      }
    });
  } catch (error) {
    console.error('Error debugging deployment audio:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to debug deployment audio',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
