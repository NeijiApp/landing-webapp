import {
	copyFile,
	mkdir,
	mkdtemp,
	readFile,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { env } from "~/env.js";
import { generateParagraphAudioWithRouter } from "./tts-router";
import { parseTextWithPauses, cleanTextForTTS } from "./text-processing";

type Segment =
	| { type: "text"; content: string }
	| { type: "pause"; duration: number };

/**
 * Génère et assemble localement tous les segments de méditation en un seul fichier audio MP3.
 */
export async function generateConcatenatedMeditation(
	segments: Segment[],
	voiceId?: string,
	voiceGender?: "male" | "female",
	voiceStyle?: string,
): Promise<ReadableStream<Uint8Array>> {
	// Répertoire temporaire pour cette requête
	const tempDir = await mkdtemp(join(tmpdir(), "meditation-"));
	const audioFiles: Array<{ localPath: string; silenceAfter?: number }> = [];

		// Process segments and generate audio files
	const processedSegments: Array<{ localPath: string; silenceAfter?: number }> = [];

	for (let i = 0; i < segments.length; i++) {
		const seg = segments[i]!;

		if (seg.type === "text") {
			console.log(`📝 Processing segment text: "${seg.content.substring(0, 100)}..."`);

			// Parse text for pause markers and process accordingly
			const parsedResult = parseTextWithPauses(seg.content);

			console.log(`🔍 Parsed into ${parsedResult.segments.length} segments`);

			for (let j = 0; j < parsedResult.segments.length; j++) {
				const parsedSeg = parsedResult.segments[j]!;

				if (parsedSeg.type === "text" && parsedSeg.content) {
					// Clean the text for TTS (remove pause markers)
					const cleanText = cleanTextForTTS(parsedSeg.content);

					console.log(`🔍 Original text: "${parsedSeg.content}"`);
					console.log(`🧹 Cleaned text: "${cleanText}"`);

					// Double-check that pause markers are removed
					if (cleanText.includes('[PAUSE:')) {
						console.error(`❌ ERROR: Clean text still contains pause markers: "${cleanText}"`);
						// Force clean again
						const forceCleanText = cleanText.replace(/\[PAUSE:\d+\]/g, '').trim();
						console.log(`🔧 Force cleaned: "${forceCleanText}"`);
					}

					if (cleanText.trim().length > 0) {
						// Final safety check - ensure no pause markers remain
						const finalCleanText = cleanText.replace(/\[PAUSE:\d+\]/g, '').trim();

						console.log(`🎙️ Generating TTS for: "${finalCleanText.substring(0, 50)}..."`);

						const stream = await generateParagraphAudioWithRouter(finalCleanText, {
							voice_id: voiceId!,
							voice_gender: voiceGender,
							voice_style: voiceStyle || "calm",
						});

						// Read the stream and write to file
						const buffer = await new Response(stream).arrayBuffer();
						const filePath = join(tempDir, `segment-${i}-${j}.mp3`);
						await writeFile(filePath, Buffer.from(buffer));

						processedSegments.push({
							localPath: filePath,
							silenceAfter: undefined, // Will be set by next pause segment
						});
					}
				} else if (parsedSeg.type === "pause" && parsedSeg.duration) {
					// Apply silence to the previous segment
					const silenceMs = parsedSeg.duration * 1000;
					if (processedSegments.length > 0) {
						const lastSegment = processedSegments[processedSegments.length - 1]!;
						lastSegment.silenceAfter = silenceMs;
						console.log(`⏸️ Adding ${parsedSeg.duration}s pause after previous segment`);
					}
				}
			}
		} else if (seg.type === "pause") {
			// Handle explicit pause segments
			const silenceMs = seg.duration * 1000;
			if (processedSegments.length > 0) {
				const lastSegment = processedSegments[processedSegments.length - 1]!;
				lastSegment.silenceAfter = silenceMs;
				console.log(`⏸️ Adding ${seg.duration}s pause to previous segment`);
			}
		}
	}

	// Copy processed segments to audioFiles for assembly
	audioFiles.push(...processedSegments);

	// Chemin de sortie final
	const outputPath = join(tempDir, "meditation-final.mp3");
	// Assemblage avec le service assembly externe
	try {
		// Validation runtime de l'URL du service assembly
		const assemblyServiceUrl =
			env.ASSEMBLY_SERVICE_URL || process.env.ASSEMBLY_SERVICE_URL;

		if (!assemblyServiceUrl) {
			throw new Error(
				"ASSEMBLY_SERVICE_URL environment variable is required but not set. Please configure it in your deployment settings.",
			);
		}

		if (
			assemblyServiceUrl === "http://localhost:3001" &&
			process.env.NODE_ENV === "production"
		) {
			throw new Error(
				"ASSEMBLY_SERVICE_URL is still set to localhost in production. Please set it to your Railway service URL.",
			);
		}

		// Préparer les segments avec les données de fichiers
		const assemblySegments = [];
		for (let i = 0; i < audioFiles.length; i++) {
			const file = audioFiles[i]!;
			const fileName = `segment-${Date.now()}-${i}.mp3`;

			// Lire le fichier audio en base64 pour l'envoyer au service distant
			const audioBuffer = await readFile(file.localPath);
			const audioBase64 = audioBuffer.toString("base64");

			console.log(
				`📁 Prepared ${file.localPath} for remote assembly (${audioBuffer.length} bytes)`,
			);

			assemblySegments.push({
				id: `segment-${i}`,
				audioUrl: fileName,
				audioData: audioBase64, // Données du fichier en base64
				duration: 30, // Durée estimée en secondes
				silenceAfter: file.silenceAfter || 0,
			});
		}

		console.log(
			`🔧 Calling assembly service at ${assemblyServiceUrl} with ${assemblySegments.length} segments`,
		);

		console.log(`⏱️ Calling assembly service with 45s timeout...`);
		const response = await fetch(`${assemblyServiceUrl}/api/assembly/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				segments: assemblySegments,
			}),
			signal: AbortSignal.timeout(45000), // 45 second timeout
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Assembly service error: ${response.status} ${response.statusText} - ${errorText}`,
			);
		}

		const result = await response.json();
		console.log(`✅ Assembly completed: ${result.jobId}`);

		// Télécharger le fichier assemblé
		const downloadResponse = await fetch(
			`${assemblyServiceUrl}${result.downloadUrl}`,
		);
		if (!downloadResponse.ok || !downloadResponse.body) {
			throw new Error("Failed to download assembled audio");
		}

		// Sauvegarder temporairement pour retour
		const buffer = await new Response(downloadResponse.body).arrayBuffer();
		await writeFile(outputPath, Buffer.from(buffer));

		console.log(`✅ Assembly service completed successfully`);
	} catch (error) {
		console.error("❌ Assembly service failed:", error);
		throw new Error(
			`Audio assembly failed: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}

	// Lire le fichier final et renvoyer un ReadableStream
	const data = await readFile(outputPath);
	return new Response(data).body as ReadableStream<Uint8Array>;
}
