import {
	type CoreMessage,
	type Message,
	createDataStreamResponse,
	streamText,
	tool,
} from "ai";
import { z } from "zod";
import { chatModel } from "~/lib/ai/openai";
import { SYSTEM_PROMPT, USER_INPUT_TOOL } from "./prompts";

type Messages = CoreMessage[] | Omit<Message, "id">[];

const EmailInput = z.object({
	type: z.literal("email"),
	placeholder: z.string(),
});

export type EmailInputAnnotation = z.infer<typeof EmailInput>;

const SelectInput = z.object({
	type: z.literal("select"),
	choices: z.array(z.string()),
});

export type SelectInputAnnotation = z.infer<typeof SelectInput>;

const UserInputParameters = EmailInput;

export type UserInputParameters = z.infer<typeof UserInputParameters>;

export type PossibleAnnotation = UserInputParameters;

export async function POST(request: Request) {
	const { messages }: { messages: Messages } = await request.json();

	return createDataStreamResponse({
		async execute(dataStream) {
			const result = streamText({
				model: chatModel(),
				system: SYSTEM_PROMPT,
				messages,
				tools: {
					userinput: tool({
						parameters: UserInputParameters,
						description: USER_INPUT_TOOL,
						async execute(args, options) {
							dataStream.writeMessageAnnotation(args);
							return "done";
						},
					}),
				},
				maxSteps: 2,
			});

			result.mergeIntoDataStream(dataStream);
		},
		onError(error) {
			console.error("[api/chat] stream failed:", error);
			return "An error occurred.";
		},
	});
}
