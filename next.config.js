/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
	typescript: {
		ignoreBuildErrors: false,
	},
	eslint: {
		ignoreDuringBuilds: false,
		dirs: ["src", "pages", "app"], // Only lint these directories
	},
	// Handle large audio files
	experimental: {
		largePageDataBytes: 128 * 1024 * 1024, // 128MB
	},
	// Add headers for audio files
	async headers() {
		return [
			{
				source: '/background-noise/:path*',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=31536000, immutable',
					},
					{
						key: 'Content-Type',
						value: 'audio/mpeg',
					},
					{
						key: 'Accept-Ranges',
						value: 'bytes',
					},
				],
			},
		];
	},
};

export default config;
