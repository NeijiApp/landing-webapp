import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AssemblyError } from "~/lib/assembly/assemble";
import { generateMeditation } from "~/lib/meditation/generate-meditation";

export const runtime = "nodejs";
export const maxDuration = 300;

const DEFAULT_DURATION_MINUTES = 5;

const meditationSchema = z.object({
	// An explicit duration is authoritative. Nothing downstream changes it.
	duration: z.number().min(0.5).max(30).optional(),
	prompt: z.string().min(1).max(500),
	// Accepted for compatibility. The voice is chosen from `gender`.
	voiceId: z.string().optional(),
	background: z
		.enum(["silence", "waves", "rain", "focus", "relax"])
		.optional()
		.default("silence"),
	guidance: z
		.enum(["beginner", "confirmed", "expert"])
		.optional()
		.default("confirmed"),
	goal: z
		.enum([
			"calm",
			"focus",
			"sleep",
			"morning",
			"energy",
			"healing",
			"stress",
			"anxiety",
		])
		.optional()
		.default("calm"),
	gender: z.enum(["male", "female"]).optional().default("female"),
});

/** Reads "10 min", "3 minutes" and the like from the prompt. */
function durationFromPrompt(prompt: string): number | undefined {
	const match = /(\d{1,2})\s*(?:-\s*)?min/i.exec(prompt);
	if (!match?.[1]) return undefined;
	const minutes = Number(match[1]);
	return minutes >= 1 && minutes <= 30 ? minutes : undefined;
}

export async function POST(request: NextRequest) {
	const startTime = Date.now();

	let params: z.infer<typeof meditationSchema>;
	try {
		params = meditationSchema.parse(await request.json());
	} catch (error) {
		return NextResponse.json(
			{
				error: "Invalid meditation request",
				details:
					error instanceof z.ZodError
						? error.issues
								.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
								.join("; ")
						: "The request body is not valid JSON.",
			},
			{ status: 400 },
		);
	}

	const { prompt, background, guidance, goal, gender } = params;
	const duration =
		params.duration ?? durationFromPrompt(prompt) ?? DEFAULT_DURATION_MINUTES;

	try {
		const meditation = await generateMeditation(
			{ prompt, durationMinutes: duration, goal, guidance, gender },
			request.signal,
		);

		const { timingsMs } = meditation;
		console.log(
			`[meditation] ${duration} min ${goal} (${gender}): ${meditation.durationSec.toFixed(1)} s of audio, ${meditation.segmentCount} segments, ${meditation.wordCount} words, voice ${meditation.voice.label}; script ${timingsMs.script} ms, speech ${timingsMs.speech} ms, assembly ${timingsMs.assembly} ms, total ${Date.now() - startTime} ms`,
		);

		return new Response(meditation.audio, {
			headers: {
				"Content-Type": "audio/mpeg",
				"Content-Disposition": 'attachment; filename="meditation.mp3"',
				"Cache-Control": "no-cache",
				"X-Meditation-Duration": meditation.durationSec.toFixed(1),
				"X-Meditation-Segments": meditation.segmentCount.toString(),
				"X-Meditation-Words": meditation.wordCount.toString(),
				"X-Meditation-Complexity": "1",
				"X-Meditation-Voice": meditation.voice.label,
				// Kept for the chat client. Nothing overrides the request any more.
				"X-Parsed-Overrides": "[]",
				"X-Parsed-Confidence": "0",
				"X-Final-Params": JSON.stringify({
					duration,
					goal,
					voiceGender: gender,
					voiceStyle: "calm",
					guidanceLevel: guidance,
					background,
				}),
				"Server-Timing": `script;dur=${timingsMs.script}, speech;dur=${timingsMs.speech}, assembly;dur=${timingsMs.assembly}`,
			},
		});
	} catch (error) {
		console.error("[meditation] generation failed:", error);
		if (error instanceof AssemblyError) {
			return NextResponse.json(
				{ error: "Audio assembly failed", details: error.message },
				{ status: 502 },
			);
		}
		return NextResponse.json(
			{
				error: "Meditation generation failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
