import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		DATABASE_URL: z.string().url(),
		OPENAI_API_KEY: z.string(),
		ELEVENLABS_API_KEY: z.string(),
		OPENROUTER_API_KEY: z.string().optional(),
		TTS_PROVIDER: z.enum(["openai", "elevenlabs"]).optional().default("openai"),
		ASSEMBLY_SERVICE_URL: z.string().url(),
		ASSEMBLY_API_KEY: z.string().optional().default("dev-key-123"),
		ASSEMBLY_TIMEOUT: z.string().optional().default("60000"),
		// Optional overrides of src/lib/meditation/config.ts
		ELEVENLABS_MODEL_ID: z.string().optional(),
		ELEVENLABS_OUTPUT_FORMAT: z.string().optional(),
		ELEVENLABS_VOICE_FEMALE: z.string().optional(),
		ELEVENLABS_VOICE_MALE: z.string().optional(),
		ELEVENLABS_FREE_VOICE_FEMALE: z.string().optional(),
		ELEVENLABS_FREE_VOICE_MALE: z.string().optional(),
		OPENAI_TTS_MODEL: z.string().optional(),
		OPENAI_TTS_VOICE_FEMALE: z.string().optional(),
		OPENAI_TTS_VOICE_MALE: z.string().optional(),
		TTS_CONCURRENCY: z.coerce.number().int().min(1).max(10).optional(),
		SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
		GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
		GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
		NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
		NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
		OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
		TTS_PROVIDER: process.env.TTS_PROVIDER,
		ASSEMBLY_SERVICE_URL: process.env.ASSEMBLY_SERVICE_URL,
		ASSEMBLY_API_KEY: process.env.ASSEMBLY_API_KEY,
		ASSEMBLY_TIMEOUT: process.env.ASSEMBLY_TIMEOUT,
		ELEVENLABS_MODEL_ID: process.env.ELEVENLABS_MODEL_ID,
		ELEVENLABS_OUTPUT_FORMAT: process.env.ELEVENLABS_OUTPUT_FORMAT,
		ELEVENLABS_VOICE_FEMALE: process.env.ELEVENLABS_VOICE_FEMALE,
		ELEVENLABS_VOICE_MALE: process.env.ELEVENLABS_VOICE_MALE,
		ELEVENLABS_FREE_VOICE_FEMALE: process.env.ELEVENLABS_FREE_VOICE_FEMALE,
		ELEVENLABS_FREE_VOICE_MALE: process.env.ELEVENLABS_FREE_VOICE_MALE,
		OPENAI_TTS_MODEL: process.env.OPENAI_TTS_MODEL,
		OPENAI_TTS_VOICE_FEMALE: process.env.OPENAI_TTS_VOICE_FEMALE,
		OPENAI_TTS_VOICE_MALE: process.env.OPENAI_TTS_VOICE_MALE,
		TTS_CONCURRENCY: process.env.TTS_CONCURRENCY,
		SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
		GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
		GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
		NODE_ENV: process.env.NODE_ENV,
		NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
		NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});
