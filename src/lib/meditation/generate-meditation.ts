import { assembleMeditation } from "~/lib/assembly/assemble";
import type { GuidanceLevel, VoiceGender } from "./config";
import { measureMp3Duration } from "./mp3-duration";
import { fitPauses, planMeditation } from "./plan";
import { writeMeditationScript } from "./script";
import { type Voice, synthesizeSpeech } from "./voice";

export interface MeditationRequest {
	prompt: string;
	durationMinutes: number;
	goal: string;
	guidance: GuidanceLevel;
	gender: VoiceGender;
}

export interface GeneratedMeditation {
	audio: Uint8Array;
	title: string;
	voice: Voice;
	/** Speech plus silence sent to assembly, in seconds. */
	durationSec: number;
	speechSec: number;
	silenceSec: number;
	segmentCount: number;
	wordCount: number;
	timingsMs: { script: number; speech: number; assembly: number };
}

/**
 * Speech and assembly for segments that already have their text. The pauses
 * are fitted to the measured speech when a target is given, otherwise the
 * requested pauses are used as they are.
 */
export async function renderSegments(
	segments: Array<{ text: string; pauseAfterSec: number }>,
	gender: VoiceGender,
	targetSec?: number,
	signal?: AbortSignal,
) {
	const speechStart = Date.now();
	const { voice, audio } = await synthesizeSpeech(
		segments.map((segment) => segment.text),
		gender,
		signal,
	);
	const speechMs = Date.now() - speechStart;

	const durations = audio.map(measureMp3Duration);
	const requested = segments.map((segment) => segment.pauseAfterSec);
	const pauses =
		targetSec === undefined
			? requested
			: fitPauses(durations, requested, targetSec);

	const assemblyStart = Date.now();
	const file = await assembleMeditation(
		audio.map((data, index) => ({
			audio: data,
			durationSec: durations[index] ?? 0,
			pauseAfterSec: pauses[index] ?? 0,
		})),
	);
	const assemblyMs = Date.now() - assemblyStart;

	const speechSec = durations.reduce((sum, d) => sum + d, 0);
	const silenceSec = pauses.reduce((sum, p) => sum + p, 0);
	return { file, voice, speechSec, silenceSec, speechMs, assemblyMs };
}

/** Script, speech and assembly for one meditation request. */
export async function generateMeditation(
	request: MeditationRequest,
	signal?: AbortSignal,
): Promise<GeneratedMeditation> {
	const plan = planMeditation(request.durationMinutes, request.guidance);

	const scriptStart = Date.now();
	const script = await writeMeditationScript({ ...request, plan }, signal);
	const scriptMs = Date.now() - scriptStart;

	const rendered = await renderSegments(
		script.segments,
		request.gender,
		plan.targetSec,
		signal,
	);

	return {
		audio: rendered.file,
		title: script.title,
		voice: rendered.voice,
		durationSec: rendered.speechSec + rendered.silenceSec,
		speechSec: rendered.speechSec,
		silenceSec: rendered.silenceSec,
		segmentCount: script.segments.length,
		wordCount: script.wordCount,
		timingsMs: {
			script: scriptMs,
			speech: rendered.speechMs,
			assembly: rendered.assemblyMs,
		},
	};
}
