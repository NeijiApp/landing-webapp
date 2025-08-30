import { type NextRequest, NextResponse } from "next/server";
// Use Node.js runtime for FFmpeg dynamic import support
export const runtime = "nodejs";
import { z } from "zod";
import { env } from "~/env";
import { generateConcatenatedMeditation } from "~/lib/meditation/generate-concatenated-meditation";
import { llmParameterParser } from "~/lib/meditation/llm-parameter-parser";
import { meditationArchitect } from "~/lib/meditation/meditation-architect";

const meditationSchema = z.object({
  duration: z.number().min(0.5).max(30).optional().default(5),
  prompt: z.string().min(1).max(500),
  voiceId: z.string().optional().default("g6xIsTj2HwM6VR4iXFCw"),
  background: z
    .enum(["silence", "waves", "rain", "focus", "relax"])
    .optional()
    .default("silence"),
  guidance: z
    .enum(["beginner", "confirmed", "expert"])
    .optional()
    .default("confirmed"),
  goal: z
    .enum(["calm", "focus", "sleep", "energy", "healing", "stress", "anxiety"])
    .optional()
    .default("calm"),
  gender: z.enum(["male", "female"]).optional().default("female"),
});

async function checkAssemblyServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${env.ASSEMBLY_SERVICE_URL}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    console.error("Assembly service health check failed:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check assembly service health first
    const isAssemblyHealthy = await checkAssemblyServiceHealth();
    if (!isAssemblyHealthy) {
      return NextResponse.json(
        {
          error: "Assembly service unavailable",
          details: `Please ensure the assembly service is running at ${env.ASSEMBLY_SERVICE_URL}. Run 'pnpm run assembly:start' to start it.`,
        },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { duration, prompt, voiceId, background, guidance, goal, gender } =
      meditationSchema.parse(body);

    console.log(
      `🧘 Starting AI-driven meditation generation: ${duration}min, goal: ${goal}, voice: ${voiceId}, background: ${background}, guidance: ${guidance}`,
    );

    // Parse user input with LLM if there's meaningful content
    let finalParams = {
      duration,
      goal,
      voiceGender: gender,
      voiceStyle: 'calm',
      guidanceLevel: guidance,
      background: background,
    };
    let parsedInfo = null;
    let overrides: string[] = [];

    const hasUserInput = prompt.trim().length > 0 && prompt.toLowerCase() !== 'meditation';
    
    if (hasUserInput) {
      console.log('🤖 Parsing user input with LLM...');
      
      const parsed = await llmParameterParser.parseUserInput(prompt);

      if (parsed.confidence > 0.2) { // Use intelligent inferences, even if confidence is moderate
        const mergeResult = llmParameterParser.mergeWithDefaults(parsed, {
          duration,
          goal,
          voiceGender: gender,
          guidance,
          background,
        });
        
        finalParams = mergeResult.finalParams;
        overrides = mergeResult.overrides;
        parsedInfo = parsed;
        
        console.log('✅ LLM parsing applied:', {
          overrides,
          confidence: parsed.confidence,
          detectedParams: parsed.detectedParams
        });
      } else {
        console.log('⚠️ LLM parsing confidence too low, using defaults (confidence:', parsed.confidence, ')');
      }
    } else {
      console.log('📝 No meaningful user input, using explicit parameters');
    }

    // Create meditation specification
    const specification = {
      originalPrompt: prompt,
      intent: parsedInfo?.reasoning || `${finalParams.goal} meditation`,
      inferredDuration: finalParams.duration,
      guidanceLevel: finalParams.guidanceLevel as 'beginner' | 'confirmed' | 'expert',
      goal: finalParams.goal as 'calm' | 'focus' | 'sleep' | 'energy' | 'healing' | 'stress' | 'anxiety',
      mood: 'neutral',
      background: finalParams.background as 'silence' | 'nature' | 'ambient' | 'waves' | 'rain' | 'focus' | 'relax',
      voicePreferences: {
        gender: finalParams.voiceGender,
        style: finalParams.voiceStyle as 'calm' | 'energetic' | 'soothing' | 'focused',
      },
      constraints: {
        maxSilence: finalParams.guidanceLevel === 'expert' ? 0.7 : finalParams.guidanceLevel === 'beginner' ? 0.3 : 0.5,
        breathingStyle: 'natural' as const,
        instructionDensity: 'moderate' as const,
        pacePreference: 'medium' as const,
      },
      personalContext: {
        timeOfDay: 'afternoon' as const,
        energyLevel: 'medium' as const,
        stressLevel: 'medium' as const,
        experience: 'regular' as const,
      },
    };

    console.log('✅ Meditation specification created:');
    console.log(`   Goal: ${specification.goal}`);
    console.log(`   Duration: ${specification.inferredDuration}min`);
    console.log(`   Guidance: ${specification.guidanceLevel}`);
    console.log(`   Voice: ${specification.voicePreferences.gender} (${specification.voicePreferences.style})`);
    console.log(`   Intent: ${specification.intent}`);
    if (overrides.length > 0) {
      console.log(`   🎯 User overrides: ${overrides.join(', ')}`);
    }

    // Generate meditation plan with AI architect
    console.log('🏗️ Creating meditation plan with AI architect...');
    const meditationPlan = await meditationArchitect.createMeditationPlan(specification);

    console.log('✅ Meditation plan created:');
    console.log(`   Total duration: ${Math.round(meditationPlan.totalDuration)}s`);
    console.log(`   Segments: ${meditationPlan.segments.length}`);
    console.log(`   Silence ratio: ${Math.round(meditationPlan.timingValidation.silenceRatio * 100)}%`);
    console.log(`   Word count: ${meditationPlan.metadata.contentWordCount}`);

    // Convert meditation plan to assembly format
    const assemblySegments: Array<
      { type: "text"; content: string } | { type: "pause"; duration: number }
    > = [];

    meditationPlan.segments.forEach((segment, index) => {
      // Add text segment
      assemblySegments.push({
        type: "text",
        content: segment.content,
      });

      // Add silence segment if needed
      if (segment.silenceAfter > 0.5) {
        assemblySegments.push({
          type: "pause",
          duration: Math.round(segment.silenceAfter),
        });
      }
    });

    console.log(`🔧 Prepared ${assemblySegments.length} segments for assembly`);

    // Use the correct voice ID based on parsed gender
    const finalVoiceId = finalParams.voiceGender === "male"
      ? "GUDYcgRAONiI1nXDcNQQ"  // Male voice ID
      : "g6xIsTj2HwM6VR4iXFCw"; // Female voice ID

    // Generate final meditation audio
    console.log(`🎤 Generating audio with voice: ${finalVoiceId} (${finalParams.voiceGender}) - ${finalParams.voiceStyle} style`);
    const meditationStream = await generateConcatenatedMeditation(
      assemblySegments,
      finalVoiceId,
      finalParams.voiceGender,
      finalParams.voiceStyle,
    );

    console.log("✅ AI-driven meditation generation completed successfully");

    // Return audio stream with metadata including parsing info
    return new Response(meditationStream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'attachment; filename="meditation.mp3"',
        "Cache-Control": "no-cache",
        "X-Meditation-Duration": meditationPlan.totalDuration.toString(),
        "X-Meditation-Segments": meditationPlan.segments.length.toString(),
        "X-Meditation-Words": meditationPlan.metadata.contentWordCount.toString(),
        "X-Meditation-Complexity": meditationPlan.metadata.estimatedComplexity.toString(),
        // Add parsing metadata for UI updates
        "X-Parsed-Overrides": JSON.stringify(overrides),
        "X-Parsed-Confidence": (parsedInfo?.confidence || 0).toString(),
        "X-Final-Params": JSON.stringify(finalParams),
      },
    });
  } catch (error) {
    console.error("❌ AI meditation generation failed:", error);
    return NextResponse.json(
      {
        error: "Meditation generation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
