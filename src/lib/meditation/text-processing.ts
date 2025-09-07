/**
 * Text Processing Utilities for Meditation Content
 * Handles pause markers and text segmentation for TTS generation
 */

export interface ProcessedSegment {
	type: "text" | "pause";
	content?: string;
	duration?: number;
}

export interface TextProcessingResult {
	segments: ProcessedSegment[];
	totalTextLength: number;
	totalPauseTime: number;
}

/**
 * Parses text with embedded pause markers and converts to structured segments
 * Example: "Hello world.[pause 3] How are you?[pause 2]"
 * Becomes: [{type: "text", content: "Hello world."}, {type: "pause", duration: 3}, ...]
 */
export function parseTextWithPauses(text: string): TextProcessingResult {
	const segments: ProcessedSegment[] = [];
	let totalPauseTime = 0;
	let totalTextLength = 0;

	// Split on pause markers while preserving the markers
	const parts = text.split(/(\[PAUSE:\d+\])/);

	for (const part of parts) {
		const trimmedPart = part.trim();

		if (trimmedPart === "") {
			continue;
		}

		// Check if this part is a pause marker
		const pauseMatch = trimmedPart.match(/\[PAUSE:(\d+)\]/);
		if (pauseMatch) {
			const duration = parseInt(pauseMatch[1]!, 10);
			segments.push({
				type: "pause",
				duration: duration,
			});
			totalPauseTime += duration;
		} else if (trimmedPart.length > 0) {
			// This is text content
			segments.push({
				type: "text",
				content: trimmedPart,
			});
			totalTextLength += trimmedPart.length;
		}
	}

	return {
		segments,
		totalTextLength,
		totalPauseTime,
	};
}

/**
 * Cleans text by removing pause markers for TTS generation
 */
export function cleanTextForTTS(text: string): string {
	return text.replace(/\[PAUSE:\d+\]/g, "").trim();
}

/**
 * Validates that pause markers are properly formatted
 */
export function validatePauseMarkers(text: string): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	// Check for malformed pause markers
	const malformedMarkers = text.match(/\[PAUSE:[^\]]*\]/g);
	if (malformedMarkers) {
		for (const marker of malformedMarkers) {
			if (!/^\[PAUSE:\d+\]$/.test(marker)) {
				errors.push(`Malformed pause marker: ${marker}`);
			}
		}
	}

	// Check for consecutive pauses
	if (text.includes("[PAUSE:") && text.includes("][PAUSE:")) {
		errors.push("Consecutive pause markers detected - may cause issues");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Optimizes pause markers for better audio flow
 */
export function optimizePauseMarkers(text: string): string {
	let optimizedText = text;

	// Remove unnecessary pauses at the end
	optimizedText = optimizedText.replace(/\[PAUSE:\d+\]$/, "");

	// Merge consecutive small pauses
	optimizedText = optimizedText.replace(/\[PAUSE:(\d+)\]\s*\[PAUSE:(\d+)\]/g, (match, p1, p2) => {
		const duration1 = parseInt(p1, 10);
		const duration2 = parseInt(p2, 10);
		return `[PAUSE:${Math.min(duration1 + duration2, 10)}]`; // Cap at 10 seconds
	});

	// Normalize spacing around markers
	optimizedText = optimizedText.replace(/\s*\[PAUSE:\d+\]\s*/g, (match) => {
		const marker = match.trim();
		return ` ${marker} `;
	});

	return optimizedText.trim();
}
