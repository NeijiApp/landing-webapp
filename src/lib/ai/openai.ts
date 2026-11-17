import { createOpenAI } from "@ai-sdk/openai";

/**
 * Model ids used across the app. Change them here only.
 */
export const CHAT_MODEL = "gpt-6-luna";
export const GENERATION_MODEL = "gpt-6.1-terra";

/**
 * The GPT-6 family rejects sampling parameters such as `temperature`, and the
 * AI SDK version pinned in this project (ai v4) always sends one. This fetch
 * wrapper removes them from the request body. It can go once the project moves
 * to an AI SDK release that knows these models.
 */
const UNSUPPORTED_PARAMS = ["temperature", "top_p"] as const;

const fetchWithoutSampling: typeof fetch = async (input, init) => {
	if (typeof init?.body === "string") {
		try {
			const body = JSON.parse(init.body) as Record<string, unknown>;
			for (const param of UNSUPPORTED_PARAMS) delete body[param];
			return fetch(input, { ...init, body: JSON.stringify(body) });
		} catch {
			// Not JSON: send the request unchanged.
		}
	}
	return fetch(input, init);
};

const provider = createOpenAI({ fetch: fetchWithoutSampling });

/** Chat model, served through the Responses API (required for tool calls). */
export const chatModel = () => provider.responses(CHAT_MODEL);

/** Model that writes the meditation script. */
export const generationModel = () => provider.responses(GENERATION_MODEL);
