const BITRATES_V1_L3 = [
	0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320,
];
const BITRATES_V2_L3 = [
	0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160,
];
const SAMPLE_RATES: Record<number, number[]> = {
	3: [44100, 48000, 32000], // MPEG 1
	2: [22050, 24000, 16000], // MPEG 2
	0: [11025, 12000, 8000], // MPEG 2.5
};

/**
 * Measures an MP3 (MPEG Layer III) buffer by walking its frames. Returns the
 * duration in seconds, or an estimate at 128 kbps when no frame is found.
 */
export function measureMp3Duration(data: Uint8Array): number {
	let offset = 0;

	// Skip an ID3v2 tag if there is one.
	if (data[0] === 0x49 && data[1] === 0x44 && data[2] === 0x33) {
		const size =
			((data[6] ?? 0) << 21) |
			((data[7] ?? 0) << 14) |
			((data[8] ?? 0) << 7) |
			(data[9] ?? 0);
		offset = 10 + size;
	}

	let seconds = 0;
	let frames = 0;
	while (offset + 4 <= data.length) {
		const b1 = data[offset + 1] ?? 0;
		const b2 = data[offset + 2] ?? 0;
		if (data[offset] !== 0xff || (b1 & 0xe0) !== 0xe0) {
			offset += 1;
			continue;
		}
		const version = (b1 >> 3) & 0x03;
		const layer = (b1 >> 1) & 0x03;
		const bitrateIndex = (b2 >> 4) & 0x0f;
		const sampleRate = SAMPLE_RATES[version]?.[(b2 >> 2) & 0x03];
		const bitrate =
			(version === 3 ? BITRATES_V1_L3 : BITRATES_V2_L3)[bitrateIndex] ?? 0;
		if (layer !== 1 || !sampleRate || bitrate === 0) {
			offset += 1;
			continue;
		}
		const padding = (b2 >> 1) & 0x01;
		const samples = version === 3 ? 1152 : 576;
		const frameLength =
			Math.floor(((samples / 8) * bitrate * 1000) / sampleRate) + padding;
		seconds += samples / sampleRate;
		frames += 1;
		offset += frameLength;
	}

	if (frames === 0) return (data.length * 8) / 128_000;
	return seconds;
}
