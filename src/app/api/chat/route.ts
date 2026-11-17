import {
	createDataStreamResponse,
	streamText,
	tool,
} from "ai";
import { z } from "zod";
import { chatModel } from "~/lib/ai/openai";
import { SYSTEM_PROMPT, USER_INPUT_TOOL } from "./prompts";

/**
 * What the chat client sends: plain user and assistant turns. Anything else
 * (system or tool roles, oversized history) is refused before the model runs.
 */
const MAX_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 4000;
const MAX_BODY_CHARS = 150_000;
/** Covers the model's reasoning and a reply of two short paragraphs. */
const MAX_OUTPUT_TOKENS = 1500;

const ChatRequest = z.object({
	messages: z
		.array(
			z.object({
				role: z.enum(["user", "assistant"]),
				content: z.string().min(1).max(MAX_MESSAGE_CHARS),
			}),
		)
		.min(1)
		.max(MAX_MESSAGES),
});

const MAX_CHOICES = 3;

const SelectChoice = z.object({
	label: z.string().describe("Button text, five words at most."),
	meditation: z
		.enum(["sleep", "focus", "calm", "morning"])
		.nullable()
		.describe(
			"Goal of the meditation this button starts, or null when the button is a plain answer.",
		),
});

const SelectInput = z.object({
	type: z.literal("select"),
	choices: z.array(SelectChoice).describe("Two or three choices."),
});

export type SelectChoiceAnnotation = z.infer<typeof SelectChoice>;
export type SelectInputAnnotation = z.infer<typeof SelectInput>;

const UserInputParameters = SelectInput;

export type UserInputParameters = z.infer<typeof UserInputParameters>;

export type PossibleAnnotation = UserInputParameters;

export async function POST(request: Request) {
	let messages: z.infer<typeof ChatRequest>["messages"];
	try {
		const raw = await request.text();
		if (raw.length > MAX_BODY_CHARS) throw new Error("body too large");
		messages = ChatRequest.parse(JSON.parse(raw)).messages;
	} catch {
		return Response.json({ error: "Invalid chat request" }, { status: 400 });
	}

	return createDataStreamResponse({
		async execute(dataStream) {
			const result = streamText({
				model: chatModel(),
				system: SYSTEM_PROMPT,
				messages,
				maxTokens: MAX_OUTPUT_TOKENS,
				abortSignal: request.signal,
				tools: {
					userinput: tool({
						parameters: UserInputParameters,
						description: USER_INPUT_TOOL,
						async execute(args) {
							const choices = args.choices
								.filter((choice) => choice.label.trim().length > 0)
								.slice(0, MAX_CHOICES);
							// A single button is not a choice: show nothing.
							if (choices.length < 2) return "No buttons were shown.";
							dataStream.writeMessageAnnotation({ type: "select", choices });
							return "The buttons are shown.";
						},
					}),
				},
				// One step: the reply ends with the buttons, nothing is written after them.
				maxSteps: 1,
			});

			result.mergeIntoDataStream(dataStream);
		},
		onError(error) {
			console.error("[api/chat] stream failed:", error);
			return "An error occurred.";
		},
	});
}
