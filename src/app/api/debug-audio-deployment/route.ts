import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * GET /api/debug-audio-deployment
 * Comprehensive audio deployment debugging endpoint
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
        // Test HTTP accessibility
        const response = await fetch(result.fullUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Audio-Debug-Tool/1.0',
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
        
        // Check for CORS headers
        result.corsHeaders = {
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
          'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
          'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
        };

        // Test if it's actually an audio file
        if (response.ok && result.contentType) {
          result.isAudioMimeType = result.contentType.startsWith('audio/');
        }
      } catch (error) {
        result.accessible = false;
        result.httpError = error instanceof Error ? error.message : 'Unknown error';
      }

      results.push(result);
    }

    // Get deployment info
    const deploymentInfo = {
      platform: process.env.VERCEL ? 'Vercel' : process.env.RAILWAY_STATIC_URL ? 'Railway' : 'Unknown',
      vercel: process.env.VERCEL,
      railway: process.env.RAILWAY_STATIC_URL,
      nodeEnv: process.env.NODE_ENV,
      baseUrl,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        deploymentInfo,
        results,
        summary: {
          totalFiles: audioFiles.length,
          accessibleFiles: results.filter(r => r.accessible).length,
          existingFiles: results.filter(r => r.fileExists).length,
          averageFileSizeMB: results
            .filter(r => r.fileSizeMB)
            .reduce((sum, r) => sum + parseFloat(r.fileSizeMB), 0) / results.filter(r => r.fileSizeMB).length,
        }
      }
    });
  } catch (error) {
    console.error('Error debugging audio deployment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to debug audio deployment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
