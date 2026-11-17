import { env } from "~/env";
import { TTS_CONFIG, type VoiceGender } from "./config";

/** A voice able to turn one text into one MP3 buffer. */
export interface Voice {
	provider: "elevenlabs" | "openai";
	model: string;
	voiceId: string;
	/** Value of the X-Meditation-Voice response header. */
	label: string;
	synthesize(text: string, signal: AbortSignal): Promise<Uint8Array>;
}

export class TtsError extends Error {
	constructor(
		message: string,
		readonly provider: Voice["provider"],
		readonly status?: number,
		readonly code?: string,
	) {
		super(message);
		this.name = "TtsError";
	}
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Retries rate limits and server errors; any other answer is final. */
async function withRetry<T>(
	signal: AbortSignal,
	attempt: () => Promise<T>,
): Promise<T> {
	const delays = [600, 1500, 3000];
	for (let i = 0; ; i++) {
		try {
			return await attempt();
		} catch (error) {
			const status = error instanceof TtsError ? error.status : undefined;
			const retryable =
				status === undefined || status === 429 || status >= 500;
			const delay = delays[i];
			if (!retryable || delay === undefined || signal.aborted) throw error;
			console.warn(
				`[meditation] speech call failed (${error instanceof Error ? error.message : "unknown error"}), retrying in ${delay} ms.`,
			);
			await sleep(delay);
		}
	}
}

function elevenLabsVoice(voice: { id: string; name: string }): Voice {
	const { model, outputFormat } = TTS_CONFIG.elevenlabs;
	return {
		provider: "elevenlabs",
		model,
		voiceId: voice.id,
		label: `elevenlabs; model=${model}; voice=${voice.id}; name=${voice.name}`,
		synthesize: (text, signal) =>
			withRetry(signal, async () => {
				let response: Response;
				try {
					response = await fetch(
						`https://api.elevenlabs.io/v1/text-to-speech/${voice.id}?output_format=${outputFormat}`,
						{
							method: "POST",
							headers: {
								"xi-api-key": env.ELEVENLABS_API_KEY,
								"Content-Type": "application/json",
								Accept: "audio/mpeg",
							},
							body: JSON.stringify({ text, model_id: model }),
							signal,
						},
					);
				} catch (error) {
					throw new TtsError(
						`ElevenLabs request failed: ${error instanceof Error ? error.message : "network error"}`,
						"elevenlabs",
					);
				}
				if (!response.ok) {
					const body = await response.text().catch(() => "");
					let code: string | undefined;
					let message = body.slice(0, 300);
					try {
						const detail = (
							JSON.parse(body) as {
								detail?: { code?: string; status?: string; message?: string };
							}
						).detail;
						code = detail?.code ?? detail?.status;
						message = detail?.message ?? message;
					} catch {
						// Not JSON: keep the raw text.
					}
					throw new TtsError(
						`ElevenLabs answered ${response.status}${code ? ` ${code}` : ""}: ${message}`,
						"elevenlabs",
						response.status,
						code,
					);
				}
				return new Uint8Array(await response.arrayBuffer());
			}),
	};
}

function openAiVoice(voiceName: string): Voice {
	const { model, instructions } = TTS_CONFIG.openai;
	return {
		provider: "openai",
		model,
		voiceId: voiceName,
		label: `openai; model=${model}; voice=${voiceName}`,
		synthesize: (text, signal) =>
			withRetry(signal, async () => {
				let response: Response;
				try {
					response = await fetch("https://api.openai.com/v1/audio/speech", {
						method: "POST",
						headers: {
							Authorization: `Bearer ${env.OPENAI_API_KEY}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							model,
							voice: voiceName,
							input: text,
							instructions,
							response_format: "mp3",
						}),
						signal,
					});
				} catch (error) {
					throw new TtsError(
						`OpenAI speech request failed: ${error instanceof Error ? error.message : "network error"}`,
						"openai",
					);
				}
				if (!response.ok) {
					const body = await response.text().catch(() => "");
					throw new TtsError(
						`OpenAI speech answered ${response.status}: ${body.slice(0, 300)}`,
						"openai",
						response.status,
					);
				}
				return new Uint8Array(await response.arrayBuffer());
			}),
	};
}

const isPaidPlanRequired = (error: unknown) =>
	error instanceof TtsError &&
	error.status === 402 &&
	error.code === "paid_plan_required";

/**
 * Runs `task` over `items` with at most `limit` running at once and returns
 * the results in input order. The first failure aborts the remaining work.
 */
async function mapInOrder<T, R>(
	items: T[],
	limit: number,
	task: (item: T, signal: AbortSignal) => Promise<R>,
	outerSignal?: AbortSignal,
): Promise<R[]> {
	const controller = new AbortController();
	const abort = () => controller.abort();
	outerSignal?.addEventListener("abort", abort, { once: true });
	if (outerSignal?.aborted) abort();

	const results = new Array<R>(items.length);
	let next = 0;
	let failure: unknown;
	const worker = async () => {
		while (failure === undefined && !controller.signal.aborted) {
			const index = next++;
			const item = items[index];
			if (item === undefined) return;
			try {
				results[index] = await task(item, controller.signal);
			} catch (error) {
				failure ??= error;
				controller.abort();
			}
		}
	};
	try {
		await Promise.all(
			Array.from({ length: Math.min(limit, items.length) }, worker),
		);
	} finally {
		outerSignal?.removeEventListener("abort", abort);
	}
	if (failure !== undefined) throw failure;
	if (controller.signal.aborted) throw new Error("Speech synthesis aborted.");
	return results;
}

/**
 * The paid voices answered 402 recently: skip them until this time instead of
 * paying one failed call per request. Per server instance, reset on restart.
 */
let paidVoicesBlockedUntil = 0;
const PAID_VOICES_RECHECK_MS = 10 * 60 * 1000;

export interface SpeechResult {
	voice: Voice;
	/** One MP3 buffer per input text, in the same order. */
	audio: Uint8Array[];
}

/**
 * Synthesises every text with one single voice. The voice is decided once for
 * the whole request, in this order:
 *   1. ElevenLabs with the app's voice for the gender;
 *   2. ElevenLabs with a free tier voice, when step 1 answers 402
 *      paid_plan_required;
 *   3. OpenAI, when ElevenLabs fails for any other reason.
 * A failure restarts the whole request on the next voice, so a session never
 * mixes two voices.
 */
export async function synthesizeSpeech(
	texts: string[],
	gender: VoiceGender,
	signal?: AbortSignal,
): Promise<SpeechResult> {
	const paid = elevenLabsVoice(TTS_CONFIG.elevenlabs.voices[gender]);
	const free = elevenLabsVoice(TTS_CONFIG.elevenlabs.freeTierVoices[gender]);
	const openai = openAiVoice(TTS_CONFIG.openai.voices[gender]);

	const run = async (voice: Voice): Promise<SpeechResult> => ({
		voice,
		audio: await mapInOrder(
			texts,
			TTS_CONFIG.concurrency,
			(text, taskSignal) => voice.synthesize(text, taskSignal),
			signal,
		),
	});

	let voice = Date.now() < paidVoicesBlockedUntil ? free : paid;
	try {
		try {
			return await run(voice);
		} catch (error) {
			if (signal?.aborted) throw error;
			if (voice !== paid || !isPaidPlanRequired(error)) throw error;
			paidVoicesBlockedUntil = Date.now() + PAID_VOICES_RECHECK_MS;
			console.warn(
				`[meditation] ElevenLabs voice ${paid.voiceId} needs a paid plan, using free tier voice ${free.voiceId}.`,
			);
			voice = free;
			return await run(voice);
		}
	} catch (error) {
		if (signal?.aborted) throw error;
		console.warn(
			`[meditation] ElevenLabs failed (${error instanceof Error ? error.message : "unknown error"}), using OpenAI ${openai.model}.`,
		);
		return await run(openai);
	}
}
