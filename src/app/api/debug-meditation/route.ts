import { NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

export async function GET(request: NextRequest) {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks: {} as Record<string, any>
    };

    // Check Assembly Service
    try {
      const assemblyResponse = await fetch(`${env.ASSEMBLY_SERVICE_URL}/api/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      results.checks.assembly_service = {
        status: assemblyResponse.ok ? 'healthy' : 'unhealthy',
        url: env.ASSEMBLY_SERVICE_URL,
        status_code: assemblyResponse.status,
        response: assemblyResponse.ok ? 'OK' : 'Failed'
      };
    } catch (error) {
      results.checks.assembly_service = {
        status: 'error',
        url: env.ASSEMBLY_SERVICE_URL,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Check Environment Variables
    results.checks.environment_variables = {
      ASSEMBLY_SERVICE_URL: !!env.ASSEMBLY_SERVICE_URL,
      ELEVENLABS_API_KEY: !!env.ELEVENLABS_API_KEY,
      OPENAI_API_KEY: !!env.OPENAI_API_KEY,
      TTS_PROVIDER: env.TTS_PROVIDER || 'default'
    };

    // Check TTS Provider (simplified)
    results.checks.tts_provider = {
      configured: env.TTS_PROVIDER || 'openai',
      elevenlabs_available: !!env.ELEVENLABS_API_KEY,
      openai_available: !!env.OPENAI_API_KEY
    };

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      error: "Debug check failed",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
