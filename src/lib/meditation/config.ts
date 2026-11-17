import { env } from "~/env";

export type VoiceGender = "male" | "female";
export type GuidanceLevel = "beginner" | "confirmed" | "expert";

/**
 * Every model id and voice id used to generate a meditation lives here.
 * Each value can be overridden by the optional env var named next to it
 * (declared in src/env.js). The script model id lives in src/lib/ai/openai.ts.
 */
export const TTS_CONFIG = {
	elevenlabs: {
		/** ELEVENLABS_MODEL_ID */
		model: env.ELEVENLABS_MODEL_ID ?? "eleven_v4",
		/** ELEVENLABS_OUTPUT_FORMAT. 192 kbps needs the Creator plan or above. */
		outputFormat: env.ELEVENLABS_OUTPUT_FORMAT ?? "mp3_44100_128",
		/**
		 * The app's Voice Library voices. They need a paid ElevenLabs plan.
		 * ELEVENLABS_VOICE_FEMALE, ELEVENLABS_VOICE_MALE
		 */
		voices: {
			female: {
				id: env.ELEVENLABS_VOICE_FEMALE ?? "rAmra0SCIYOxYmRNDSm3",
				name: "Lana Weiss",
			},
			male: {
				id: env.ELEVENLABS_VOICE_MALE ?? "GUDYcgRAONiI1nXDcNQQ",
				name: "Milo",
			},
		},
		/**
		 * Voices that work on the free tier, used when the API answers
		 * 402 paid_plan_required for the voices above.
		 * ELEVENLABS_FREE_VOICE_FEMALE, ELEVENLABS_FREE_VOICE_MALE
		 */
		freeTierVoices: {
			female: {
				id: env.ELEVENLABS_FREE_VOICE_FEMALE ?? "SAz9YHcvj6GT2YYXdXww",
				name: "River",
			},
			male: {
				id: env.ELEVENLABS_FREE_VOICE_MALE ?? "0wNZ6hM7uPvBndYl7LNf",
				name: "Male calm resonant",
			},
		},
	},
	openai: {
		/** OPENAI_TTS_MODEL */
		model: env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
		/** OPENAI_TTS_VOICE_FEMALE, OPENAI_TTS_VOICE_MALE */
		voices: {
			female: env.OPENAI_TTS_VOICE_FEMALE ?? "sage",
			male: env.OPENAI_TTS_VOICE_MALE ?? "ash",
		},
		instructions:
			"You are guiding a meditation. Speak slowly, in a calm, warm and soft voice. Keep a steady, gentle tone, leave a short breath between sentences, and never sound rushed or cheerful.",
	},
	/** TTS_CONCURRENCY. Number of segments synthesised at the same time. */
	concurrency: env.TTS_CONCURRENCY ?? 5,
} as const;

/** Timing constants used to plan a script before any audio exists. */
export const PLAN_CONFIG = {
	/** Average delivery of the meditation voices, in words per second. */
	wordsPerSecond: 2.3,
	/** Share of the session that is spoken, the rest is silence. */
	speechShare: { beginner: 0.65, confirmed: 0.55, expert: 0.4 },
	/** Shortest silence left between two segments, in seconds. */
	minPauseSec: 1.5,
	/** Silence after the last segment, in seconds. */
	tailPauseSec: 2,
} as const satisfies {
	wordsPerSecond: number;
	speechShare: Record<GuidanceLevel, number>;
	minPauseSec: number;
	tailPauseSec: number;
};
