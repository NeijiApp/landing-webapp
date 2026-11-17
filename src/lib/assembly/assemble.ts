import { env } from "~/env";

export interface AssemblySegment {
	/** MP3 data of the spoken segment. */
	audio: Uint8Array;
	/** Silence appended after the segment, in seconds. */
	pauseAfterSec: number;
	/** Measured length of the speech, in seconds. */
	durationSec: number;
}

/** Raised when the assembly service cannot produce the final file. */
export class AssemblyError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AssemblyError";
	}
}

/**
 * Sends the segments to the assembly service, which appends the silences,
 * joins everything, normalises the loudness and returns one MP3.
 */
export async function assembleMeditation(
	segments: AssemblySegment[],
): Promise<Uint8Array> {
	const baseUrl = env.ASSEMBLY_SERVICE_URL.replace(/\/$/, "");
	const timeoutMs = Number(env.ASSEMBLY_TIMEOUT) || 60_000;
	const signal = AbortSignal.timeout(timeoutMs);

	try {
		const response = await fetch(`${baseUrl}/api/assembly/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				segments: segments.map((segment, index) => ({
					id: `segment-${index}`,
					audioUrl: `segment-${index}.mp3`,
					audioData: Buffer.from(segment.audio).toString("base64"),
					duration: Math.round(segment.durationSec * 1000),
					silenceAfter: Math.round(segment.pauseAfterSec * 1000),
				})),
			}),
			signal,
		});
		if (!response.ok) {
			const body = await response.text().catch(() => "");
			throw new AssemblyError(
				`The assembly service answered ${response.status}: ${body.slice(0, 300)}`,
			);
		}

		const result = (await response.json()) as { downloadUrl?: string };
		if (!result.downloadUrl) {
			throw new AssemblyError("The assembly service returned no file.");
		}

		const download = await fetch(`${baseUrl}${result.downloadUrl}`, { signal });
		if (!download.ok) {
			throw new AssemblyError(
				`The assembled file could not be downloaded (${download.status}).`,
			);
		}
		const audio = new Uint8Array(await download.arrayBuffer());
		if (audio.length === 0) {
			throw new AssemblyError("The assembly service returned an empty file.");
		}
		return audio;
	} catch (error) {
		if (error instanceof AssemblyError) throw error;
		const reason =
			error instanceof Error && error.name === "TimeoutError"
				? `no answer after ${Math.round(timeoutMs / 1000)} seconds`
				: error instanceof Error
					? error.message
					: "unknown error";
		throw new AssemblyError(
			`The assembly service could not be reached: ${reason}`,
		);
	}
}
