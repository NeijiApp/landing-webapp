import type { VoiceGender } from "./config";
import { renderSegments } from "./generate-meditation";

type Segment =
	| { type: "text"; content: string }
	| { type: "pause"; duration: number };

/**
 * Renders a fixed list of text and pause segments into one MP3. Only the
 * /api/test-meditation route uses it; the meditation route goes through
 * generateMeditation. The voice id and style arguments are ignored: the voice
 * is chosen from the gender (see voice.ts).
 */
export async function generateConcatenatedMeditation(
	segments: Segment[],
	_voiceId?: string,
	voiceGender: VoiceGender = "female",
	_voiceStyle?: string,
): Promise<ReadableStream<Uint8Array>> {
	const spoken: Array<{ text: string; pauseAfterSec: number }> = [];
	for (const segment of segments) {
		if (segment.type === "text") {
			spoken.push({ text: segment.content, pauseAfterSec: 0 });
		} else {
			const last = spoken[spoken.length - 1];
			if (last) last.pauseAfterSec += segment.duration;
		}
	}
	const { file } = await renderSegments(spoken, voiceGender);
	return new Response(file).body as ReadableStream<Uint8Array>;
}
