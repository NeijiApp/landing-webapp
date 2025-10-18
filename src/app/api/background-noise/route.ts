import { NextRequest, NextResponse } from 'next/server';
import { BACKGROUND_NOISE_CONFIGS } from '~/lib/audio/background-noise';

/**
 * GET /api/background-noise
 * Returns available background noise configurations
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        noises: BACKGROUND_NOISE_CONFIGS
      }
    });
  } catch (error) {
    console.error('Error fetching background noise configs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch background noise configurations'
      },
      { status: 500 }
    );
  }
}
