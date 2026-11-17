import { generateObject } from "ai";
import { z } from "zod";
import { generationModel } from "~/lib/ai/openai";
import type { GuidanceLevel } from "./config";
import { type MeditationPlan, countWords, trimToWordBudget } from "./plan";

/** Longest text sent to the synthesiser for one segment. */
const MAX_SEGMENT_CHARS = 600;

/** Cuts an over-long segment at the last sentence end before the limit. */
function capSegmentText(text: string): string {
	if (text.length <= MAX_SEGMENT_CHARS) return text;
	const head = text.slice(0, MAX_SEGMENT_CHARS);
	const sentenceEnd = Math.max(
		head.lastIndexOf(". "),
		head.lastIndexOf("? "),
		head.lastIndexOf("! "),
	);
	if (sentenceEnd > MAX_SEGMENT_CHARS / 2) return head.slice(0, sentenceEnd + 1);
	const wordEnd = head.lastIndexOf(" ");
	return (wordEnd > 0 ? head.slice(0, wordEnd) : head).trim();
}

/**
 * Each segment is one speech request, so the count is bounded whatever the
 * writer returns. The closing segment is kept.
 */
function capSegmentCount<T>(segments: T[], planned: number): T[] {
	const limit = Math.max(3, Math.ceil(planned * 1.5));
	if (segments.length <= limit) return segments;
	const last = segments[segments.length - 1] as T;
	return [...segments.slice(0, limit - 1), last];
}

const scriptSchema = z.object({
	title: z.string(),
	segments: z
		.array(
			z.object({
				text: z.string(),
				pauseAfterSec: z.number(),
			}),
		)
		.min(2),
});

export interface ScriptSegment {
	text: string;
	pauseAfterSec: number;
}

export interface MeditationScript {
	title: string;
	segments: ScriptSegment[];
	wordCount: number;
}

export interface ScriptRequest {
	prompt: string;
	durationMinutes: number;
	goal: string;
	guidance: GuidanceLevel;
	plan: MeditationPlan;
}

const GUIDANCE_NOTES: Record<GuidanceLevel, string> = {
	beginner:
		"The listener is new to meditation. Explain each step simply and keep them company with regular guidance.",
	confirmed:
		"The listener meditates regularly. Give clear guidance and leave room for silence.",
	expert:
		"The listener is experienced. Use few words, give sparse cues and leave long silences.",
};

function buildSystemPrompt(): string {
	return [
		"You write scripts for guided meditations that are read aloud by a calm voice.",
		"A script is a list of spoken segments. After each segment the audio stays silent for the number of seconds you give in pauseAfterSec, while the listener follows the instruction.",
		"Rules:",
		"- Write in the language of the listener's request. If the request has no clear language, write in English.",
		"- Address the listener as you. Use plain, concrete, gentle sentences of at most 20 words.",
		"- Each segment holds one to three sentences that belong together.",
		"- Follow an arc: settle in, breathe, the core practice for the goal, then a gentle return.",
		"- Give a longer pause after an instruction that takes time to follow (a breath cycle, a body scan step) and a shorter pause after a transition.",
		"- The text is sent to a speech synthesiser as it is: no stage directions, no brackets, no markup, no emoji, no lists, numbers written as words.",
		"- No medical claims and no religious references unless the listener asks for them.",
		"- Respect the word count and the number of segments you are given. They decide the length of the session.",
	].join("\n");
}

function buildUserPrompt(request: ScriptRequest): string {
	const { plan } = request;
	return [
		`Listener's request: "${request.prompt}"`,
		`Goal: ${request.goal}`,
		`Session length: ${request.durationMinutes} minute(s), ${Math.round(plan.targetSec)} seconds in total.`,
		GUIDANCE_NOTES[request.guidance],
		`Write ${plan.segmentCount} segments, about ${plan.wordsPerSegment} words each, ${plan.wordBudget} words in total. Do not exceed ${plan.wordBudget} words.`,
		`The pauses should add up to about ${Math.round(plan.silenceSec)} seconds, about ${Math.round(plan.averagePauseSec)} seconds on average. The last segment closes the session and takes a pause of 2 seconds.`,
		"Give the session a short title.",
	].join("\n");
}

/** Writes the whole script in one structured LLM call. */
export async function writeMeditationScript(
	request: ScriptRequest,
	abortSignal?: AbortSignal,
): Promise<MeditationScript> {
	const { object } = await generateObject({
		model: generationModel(),
		schema: scriptSchema,
		schemaName: "meditation_script",
		system: buildSystemPrompt(),
		prompt: buildUserPrompt(request),
		maxRetries: 1,
		// Room for the script, its JSON wrapping and the model's reasoning.
		maxTokens: request.plan.wordBudget * 3 + 2000,
		abortSignal,
	});

	const cleaned = object.segments
		.map((segment) => ({
			// Safety net: nothing between brackets may reach the synthesiser.
			text: capSegmentText(
				segment.text
					.replace(/\[[^\]]*\]/g, " ")
					.replace(/\s+/g, " ")
					.trim(),
			),
			pauseAfterSec: segment.pauseAfterSec,
		}))
		.filter((segment) => segment.text.length > 0);

	if (cleaned.length < 2) {
		throw new Error("The script writer returned an empty script.");
	}

	const segments = trimToWordBudget(
		capSegmentCount(cleaned, request.plan.segmentCount),
		request.plan.wordBudget,
	);
	return {
		title: object.title,
		segments,
		wordCount: segments.reduce((sum, s) => sum + countWords(s.text), 0),
	};
}
