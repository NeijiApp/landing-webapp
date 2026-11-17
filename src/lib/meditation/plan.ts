import { type GuidanceLevel, PLAN_CONFIG } from "./config";

export interface MeditationPlan {
	/** Length the final audio must have, in seconds. */
	targetSec: number;
	/** Seconds of speech the script should produce. */
	speechSec: number;
	/** Seconds of silence left once the speech is placed. */
	silenceSec: number;
	/** Words the script writer is asked for. */
	wordBudget: number;
	/** Number of spoken segments the script writer is asked for. */
	segmentCount: number;
	wordsPerSegment: number;
	/** Average silence after a segment, in seconds. */
	averagePauseSec: number;
}

/**
 * Turns a requested duration into a word and segment budget. Longer sessions
 * get slightly longer segments and longer silences.
 */
export function planMeditation(
	durationMinutes: number,
	guidance: GuidanceLevel,
): MeditationPlan {
	const targetSec = durationMinutes * 60;
	const speechSec = targetSec * PLAN_CONFIG.speechShare[guidance];
	const silenceSec = targetSec - speechSec;
	const wordBudget = Math.round(speechSec * PLAN_CONFIG.wordsPerSecond);

	const segmentSpeechSec = Math.min(16, 8 + 0.6 * durationMinutes);
	const segmentCount = Math.max(3, Math.round(speechSec / segmentSpeechSec));

	return {
		targetSec,
		speechSec,
		silenceSec,
		wordBudget,
		segmentCount,
		wordsPerSegment: Math.round(wordBudget / segmentCount),
		averagePauseSec: silenceSec / segmentCount,
	};
}

export function countWords(text: string): number {
	return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Keeps a script inside its word budget. When the writer goes more than 15 %
 * over, segments are removed from the middle (the opening and the closing
 * stay) until the script fits.
 */
export function trimToWordBudget<T extends { text: string }>(
	segments: T[],
	wordBudget: number,
): T[] {
	const limit = wordBudget * 1.15;
	const kept = [...segments];
	let words = kept.reduce((sum, s) => sum + countWords(s.text), 0);
	while (words > limit && kept.length > 3) {
		const index = Math.floor(kept.length / 2);
		words -= countWords(kept[index]?.text ?? "");
		kept.splice(index, 1);
	}
	return kept;
}

/**
 * Computes the silence after each segment from the measured speech, so that
 * speech plus silence equals the target. The writer's pauses are used as
 * weights: a pause it asked to be twice as long stays twice as long.
 */
export function fitPauses(
	speechDurationsSec: number[],
	requestedPausesSec: number[],
	targetSec: number,
): number[] {
	const count = speechDurationsSec.length;
	if (count === 0) return [];

	const speech = speechDurationsSec.reduce((sum, d) => sum + d, 0);
	const budget = Math.max(0, targetSec - speech);
	const tail = Math.min(PLAN_CONFIG.tailPauseSec, budget);
	if (count === 1) return [tail];

	const gaps = count - 1;
	const available = budget - tail;
	const min = PLAN_CONFIG.minPauseSec;
	// The speech alone nearly fills the target: keep the shortest pause.
	if (available <= gaps * min) {
		return [...Array.from({ length: gaps }, () => min), tail];
	}

	const weights = requestedPausesSec
		.slice(0, gaps)
		.map((p) => (Number.isFinite(p) ? Math.min(Math.max(p, 1), 120) : 1));
	while (weights.length < gaps) weights.push(1);
	const totalWeight = weights.reduce((sum, w) => sum + w, 0);
	const extra = available - gaps * min;

	const pauses = weights.map(
		(w) => Math.round((min + (extra * w) / totalWeight) * 100) / 100,
	);
	return [...pauses, tail];
}
