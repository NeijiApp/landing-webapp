import {
	findCachedAudioSegment,
	generateTextHash,
	incrementUsageCount,
	saveAudioSegmentToCache,
} from "./audio-cache";
import {
	initializeAudioBucket,
	isStorageUrl,
	saveAudioToStorage,
} from "./audio-storage";

// ELEVENLABS_API_KEY may be undefined in contexts that don't generate audio (e.g., chat landing)
// Check inside the function when actually generating.

type GenerateParagrapheAudioProps = {
	voice_id: string;
	next_text?: string | undefined;
	voice_style?: string;
	voice_gender?: "male" | "female";
};

const generateParagraphAudio = async (
	paragraph: string,
	{
		voice_id,
		next_text = ". With a calm and relaxing voice",
		voice_style = "calm",
		voice_gender,
	}: GenerateParagrapheAudioProps,
) => {
	// Ensure API key is present for audio generation
	const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
	if (!ELEVENLABS_API_KEY) {
		throw new Error("The environment variable ELEVENLABS_API_KEY is not set");
	}

	// Clean the text to remove any pause markers that might have slipped through
	const cleanParagraph = paragraph.replace(/\[PAUSE:\d+\]/g, '').trim();

	// Déduire le genre de la voix à partir de l'ID si pas fourni
	const actualVoiceGender =
		voice_gender || (voice_id === "g6xIsTj2HwM6VR4iXFCw" ? "female" : "male");
	// 1. Vérifier d'abord le cache
	console.log(`🔍 Checking cache for: "${cleanParagraph.substring(0, 50)}..."`);
	const cachedSegment = await findCachedAudioSegment(
		cleanParagraph,
		voice_id,
		voice_style,
	);

	if (cachedSegment) {
		console.log(`✅ Found cached audio segment (ID: ${cachedSegment.id})`);

		// Vérifier si l'URL est valide (seulement HTTP pour l'instant)
		if (
			cachedSegment.audioUrl &&
			cachedSegment.audioUrl.startsWith("http") &&
			!cachedSegment.audioUrl.startsWith("elevenlabs://")
		) {
			// Incrémenter le compteur d'utilisation
			await incrementUsageCount(cachedSegment.id);

			// Récupérer l'audio depuis l'URL cachée
			try {
				const cachedResponse = await fetch(cachedSegment.audioUrl);
				if (cachedResponse.ok && cachedResponse.body) {
					console.log(
						`🎵 Serving cached audio from: ${cachedSegment.audioUrl}`,
					);
					return cachedResponse.body;
				} else {
					console.warn(
						`⚠️ Cached audio URL not accessible: ${cachedSegment.audioUrl}`,
					);
				}
			} catch (error) {
				console.warn(
					`⚠️ Error fetching cached audio: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		} else {
			console.warn(
				`⚠️ Cached segment has invalid URL, generating new audio: ${cachedSegment.audioUrl}`,
			);
		}
	}

	// 2. Générer l'audio via ElevenLabs si pas en cache
		console.log(
			`🎙️ Generating new audio with ElevenLabs for: "${cleanParagraph.substring(0, 50)}..."`,
		);
	// Use non-streaming endpoint for more reliable audio generation
	const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"xi-api-key": ELEVENLABS_API_KEY,
			"Content-Type": "application/json",
			Accept: "audio/mpeg",
		},
		body: JSON.stringify({
			text: cleanParagraph,
			next_text,
			model_id: "eleven_turbo_v2_5", // Latest high-quality model with better naturalness
			output_format: "mp3_44100_192", // Higher quality: 192kbps instead of 128kbps
			voice_settings: {
				stability: 0.71, // Slightly more dynamic
				similarity_boost: 0.85, // Higher for better voice clarity
				style: 0.65, // Much higher for more expressive, natural speech
				use_speaker_boost: true,
			},
		}),
	});

	if (!response.ok || !response.body) {
		throw new Error(
			`Failed to generate audio: ${response.status} ${response.statusText}`,
		);
	}

	// Buffer the response to handle stream properly
	const audioArrayBuffer = await new Response(response.body).arrayBuffer();

	// 3. Save to storage and cache
	try {
		await initializeAudioBucket();

		// Create stream for storage
		const storageBuffer = new Uint8Array(audioArrayBuffer);
		const storageStream = new ReadableStream({
			start(controller) {
				controller.enqueue(storageBuffer);
				controller.close();
			},
		});

		const textHash = cleanParagraph.slice(0, 50).replace(/[^a-zA-Z0-9]/g, "");
		const audioUrl = await saveAudioToStorage(
			storageStream,
			voice_id,
			textHash,
		);

		await saveAudioSegmentToCache(
			cleanParagraph,
			voice_id,
			actualVoiceGender,
			voice_style,
			audioUrl,
		);

		console.log(
			`✅ Generated and saved new audio segment with voice: ${actualVoiceGender} (${voice_id}) to ${audioUrl}`,
		);

		// Return fresh stream from buffer (more reliable than re-fetching)
		return new ReadableStream({
			start(controller) {
				controller.enqueue(new Uint8Array(audioArrayBuffer));
				controller.close();
			},
		});
	} catch (storageError) {
		console.warn(
			`⚠️ Storage failed: ${storageError instanceof Error ? storageError.message : "Unknown error"}`,
		);

		const tempUrl = `elevenlabs://generated/${voice_id}/${Date.now()}`;
		await saveAudioSegmentToCache(
			paragraph,
			voice_id,
			actualVoiceGender,
			voice_style,
			tempUrl,
		);

		console.log(
			`✅ Generated new audio segment with voice: ${actualVoiceGender} (${voice_id}) - Storage fallback`,
		);

		// Return stream from buffer
		return new ReadableStream({
			start(controller) {
				controller.enqueue(new Uint8Array(audioArrayBuffer));
				controller.close();
			},
		});
	}
};

export { generateParagraphAudio };
