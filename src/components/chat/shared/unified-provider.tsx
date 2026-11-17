"use client";

import type { Message } from "ai";
import { nanoid } from "nanoid";
import type * as React from "react";
import {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import type {
	SelectChoiceAnnotation,
	SelectInputAnnotation,
} from "~/app/api/chat/route";
import { conversationHistory } from "~/lib/conversation-history";
import type { ExtendedMessage, MessageChoice } from "./bot-message";
import {
	DEFAULT_MEDITATION_PARAMS,
	type MeditationParams,
} from "./meditation-panel";

export type UIMessage = Message;

type ChatStatus = "idle" | "submitted" | "streaming" | "awaiting" | "error";
type MeditationGoal = MeditationParams["goal"];

/** What the chat sends to /api/meditation. `prompt` holds the user's own words. */
export interface MeditationRequest extends MeditationParams {
	prompt?: string;
}

// Unified chat state interface
export interface UnifiedChatState {
	// Core chat state
	messages: ExtendedMessage[];
	status: ChatStatus;
	setMessages: React.Dispatch<React.SetStateAction<ExtendedMessage[]>>;
	setStatus: React.Dispatch<React.SetStateAction<ChatStatus>>;
	customMessages: ExtendedMessage[];
	setCustomMessages: React.Dispatch<React.SetStateAction<ExtendedMessage[]>>;
	// Input state and handlers (used by chat input components)
	input: string;
	setInput: React.Dispatch<React.SetStateAction<string>>;
	handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	stop: () => void;

	// Drawer state
	isDrawerOpen: boolean;
	setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;

	// Authentication state (optional)
	isAuthenticated: boolean;
	userId?: string;
	conversationId?: string;
	isLoadingHistory: boolean;
}

// Context with all state
interface ChatContextValue {
	chat: UnifiedChatState;
	customMessages: ExtendedMessage[];
	isDrawerOpen: boolean;
	setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
	isLoadingHistory: boolean;
	// Meditation-specific state
	meditationMode: "chat" | "meditation";
	setMeditationMode: React.Dispatch<
		React.SetStateAction<"chat" | "meditation">
	>;
	addCustomMessage: (message: ExtendedMessage) => void;
	updateCustomMessage: (id: string, updates: Partial<ExtendedMessage>) => void;
	clearCustomMessages: () => void;
	isGeneratingMeditation: boolean;
	setIsGeneratingMeditation: React.Dispatch<React.SetStateAction<boolean>>;
	/** Sends a text message to the chat model. */
	sendMessage: (text: string) => void;
	/** Starts the two-question flow (duration, voice) for a goal. */
	startMeditationFlow: (
		goal: MeditationGoal,
		options?: { userLine?: string; prompt?: string },
	) => void;
	/** Answers the choice buttons of a message. "skip" takes the default. */
	chooseOption: (messageId: string, choice: MessageChoice | "skip") => void;
	/** Generates a meditation now. Closes the Meditation Mode panel first. */
	generateMeditation: (
		request: MeditationRequest,
		userLine?: string | null,
	) => void;
	cancelMeditation: (messageId: string) => void;
	retryMeditation: (messageId: string) => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const useChatState = () => {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error("useChatState must be used within a ChatStateProvider");
	}
	return context;
};

/**
 * Drawer hook for backward compatibility
 */
export function useDrawer() {
	const { isDrawerOpen, setIsDrawerOpen } = useChatState();

	return {
		isOpen: isDrawerOpen,
		toggleDrawer: () => setIsDrawerOpen(!isDrawerOpen),
		openDrawer: () => setIsDrawerOpen(true),
		closeDrawer: () => setIsDrawerOpen(false),
	};
}

/**
 * Message ids look like "prefix-{13 digit timestamp}-{nanoid}". Messages
 * without a timestamp (loaded history) sort first.
 */
function timestampOf(id: string): number {
	const match = id.match(/-(\d{13})/);
	return match?.[1] ? Number.parseInt(match[1], 10) : 0;
}

/** Chat replies and local messages in the order they were created. */
export function mergeMessages(
	messages: ExtendedMessage[],
	customMessages: ExtendedMessage[],
): ExtendedMessage[] {
	return [...messages, ...customMessages].sort(
		(a, b) => timestampOf(a.id) - timestampOf(b.id),
	);
}

const GOAL_PHRASES: Record<MeditationGoal, string> = {
	sleep: "meditation for sleep",
	focus: "meditation for focus",
	calm: "calming meditation",
	morning: "morning meditation",
};

const GOAL_INSTRUCTIONS: Record<MeditationGoal, string> = {
	morning: "Create an energizing morning meditation.",
	focus: "Create a concentration meditation.",
	calm: "Create a calming meditation.",
	sleep: "Create a sleep meditation.",
};

const GUIDANCE_INSTRUCTIONS: Record<MeditationParams["guidance"], string> = {
	beginner: "Provide detailed, step-by-step guidance.",
	confirmed: "Provide balanced guidance.",
	expert: "Provide minimal guidance, with long pauses.",
};

/** One line that says what is being made, shown as the user's message. */
export function describeRequest(request: MeditationParams): string {
	return `A ${request.duration} minute ${GOAL_PHRASES[request.goal]}, ${request.gender} voice.`;
}

function buildPrompt(request: MeditationRequest): string {
	const base = `Create a ${request.duration}-minute ${request.goal} meditation. ${GOAL_INSTRUCTIONS[request.goal]} ${GUIDANCE_INSTRUCTIONS[request.guidance]} Use a ${request.gender} voice.`;
	const words = request.prompt?.trim().replace(/"/g, "'").slice(0, 280);
	// The route accepts 500 characters at most.
	return words ? `${base} The listener said: "${words}"` : base;
}

/**
 * The route answers once, with the finished audio, so the step from "writing"
 * to "recording" is an estimate. Writing a 1 minute script was measured at 6
 * to 7 seconds; longer scripts are assumed to take a little more.
 */
function scriptEstimateMs(durationMinutes: number): number {
	return Math.min(6000 + durationMinutes * 1000, 20000);
}

class GenerationError extends Error {
	constructor(
		public readonly kind: "http" | "empty",
		public readonly status = 0,
	) {
		super(kind === "http" ? `HTTP ${status}` : "Empty audio");
	}
}

function describeFailure(error: unknown): string {
	if (error instanceof GenerationError) {
		if (error.kind === "empty") {
			return "The audio file came back empty, so there is nothing to play.";
		}
		switch (error.status) {
			case 400:
				return "The request was not accepted, so no session was made.";
			case 401:
				return "Your sign-in has expired, so no session was made. Sign in again, then try once more.";
			case 429:
				return "Too many sessions were requested in a short time. Wait a minute, then try again.";
			case 502:
				return "Your session was written and recorded, but the audio could not be put together.";
			case 408:
			case 504:
				return "The session took too long to make and the server stopped before it was ready.";
			default:
				return "Something went wrong on our side while making your session.";
		}
	}
	return "I could not reach the server, so your session was not made. Check your connection and try again.";
}

const DURATION_CHOICES: MessageChoice[] = [
	{ label: "3 min", value: "3" },
	{ label: "5 min", value: "5", isDefault: true },
	{ label: "10 min", value: "10" },
];

const VOICE_CHOICES: MessageChoice[] = [
	{ label: "Female", value: "female", isDefault: true },
	{ label: "Male", value: "male" },
];

function isSelectAnnotation(value: unknown): value is SelectInputAnnotation {
	return (
		typeof value === "object" &&
		value !== null &&
		(value as { type?: unknown }).type === "select" &&
		Array.isArray((value as { choices?: unknown }).choices)
	);
}

function toMessageChoice(choice: SelectChoiceAnnotation): MessageChoice {
	return {
		label: choice.label,
		value: choice.label,
		meditation: choice.meditation,
	};
}

interface ChatStateProviderProps {
	children: React.ReactNode;
	isAuthenticated?: boolean;
	userId?: string;
	initialMessages?: Message[];
}

/**
 * Unified provider that works for both authenticated and unauthenticated users
 * Features are enabled/disabled based on isAuthenticated prop
 */
export function ChatStateProvider({
	children,
	isAuthenticated = false,
	userId,
	initialMessages = [],
}: ChatStateProviderProps) {
	// Core chat state
	const [messages, setMessages] = useState<ExtendedMessage[]>(initialMessages);
	const [status, setStatus] = useState<ChatStatus>("idle");
	const [customMessages, setCustomMessages] = useState<ExtendedMessage[]>([]);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [input, setInput] = useState<string>("");

	// Meditation-specific state
	const [meditationMode, setMeditationMode] = useState<"chat" | "meditation">(
		"chat",
	);
	const [isGeneratingMeditation, setIsGeneratingMeditation] = useState(false);

	// Authentication-specific state
	const [conversationId] = useState<string | undefined>();
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);

	// Latest values for callbacks that run after an await.
	const messagesRef = useRef(messages);
	messagesRef.current = messages;
	const customMessagesRef = useRef(customMessages);
	customMessagesRef.current = customMessages;

	const lastTimestampRef = useRef(0);
	const chatAbortRef = useRef<AbortController | null>(null);
	const chatBusyRef = useRef(false);
	const generationRef = useRef<{
		id: string;
		controller: AbortController;
	} | null>(null);

	/** Ids carry a strictly increasing timestamp, which is the display order. */
	const nextId = (prefix: string) => {
		const timestamp = Math.max(Date.now(), lastTimestampRef.current + 1);
		lastTimestampRef.current = timestamp;
		return `${prefix}-${timestamp}-${nanoid(6)}`;
	};

	// Load conversation history if authenticated
	useEffect(() => {
		if (!isAuthenticated || !userId) return;

		async function loadHistory() {
			setIsLoadingHistory(true);
			try {
				const numericalUserId = Number.parseInt(userId as string, 10);
				if (Number.isNaN(numericalUserId)) {
					console.warn("[chat] Invalid userId for history load");
					return;
				}
				const history = await conversationHistory.getHistory(
					numericalUserId,
					100,
				);
				const mapped: ExtendedMessage[] = history.map((m) => ({
					id: m.id,
					role: m.role,
					content: m.content,
				}));
				if (mapped.length > 0) {
					setMessages(mapped);
				}
			} catch (error) {
				console.error("[chat] Unexpected error loading history:", error);
			} finally {
				setIsLoadingHistory(false);
			}
		}

		loadHistory();
	}, [isAuthenticated, userId]);

	const persist = (message: ExtendedMessage) => {
		if (!isAuthenticated || !userId) return;
		if (message.role !== "user" && message.role !== "assistant") return;
		const uid = Number.parseInt(userId, 10);
		if (Number.isNaN(uid)) return;
		conversationHistory
			.saveMessage(uid, {
				id: message.id,
				role: message.role,
				content: message.content,
				audioUrl: message.audioUrl,
			})
			.catch((err) => console.warn("[chat] Persist message failed", err));
	};

	// Helper functions for custom messages
	const addCustomMessage = (message: ExtendedMessage) => {
		customMessagesRef.current = [...customMessagesRef.current, message];
		setCustomMessages((prev) => [...prev, message]);
		if (message.content) persist(message);
	};

	/** Changes a local message without saving it. */
	const patchCustomMessage = (
		id: string,
		updates: Partial<ExtendedMessage>,
	) => {
		setCustomMessages((prev) =>
			prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)),
		);
	};

	const updateCustomMessage = (
		id: string,
		updates: Partial<ExtendedMessage>,
	) => {
		patchCustomMessage(id, updates);
		const current = customMessagesRef.current.find((msg) => msg.id === id);
		if (current) persist({ ...current, ...updates });
	};

	const clearCustomMessages = () => {
		setCustomMessages([]);
	};

	const markAnswered = (id: string, label: string) => {
		const mark = (list: ExtendedMessage[]) =>
			list.map((msg) =>
				msg.id === id ? { ...msg, answeredWith: label } : msg,
			);
		setMessages(mark);
		setCustomMessages(mark);
	};

	// ---------------------------------------------------------------- chat

	const sendMessage = async (text: string) => {
		const trimmed = text.trim();
		if (!trimmed || chatBusyRef.current) return;
		chatBusyRef.current = true;

		const userMessage: ExtendedMessage = {
			id: nextId("user"),
			role: "user",
			content: trimmed,
		};

		// The model sees the whole conversation, local messages included.
		const history = [
			...mergeMessages(messagesRef.current, customMessagesRef.current),
			userMessage,
		]
			.filter(
				(m) =>
					(m.role === "user" || m.role === "assistant") &&
					m.content.trim().length > 0 &&
					!m.isGeneratingMeditation,
			)
			.slice(-30)
			.map((m) => ({ role: m.role, content: m.content }));

		messagesRef.current = [...messagesRef.current, userMessage];
		setMessages((prev) => [...prev, userMessage]);
		persist(userMessage);
		setStatus("streaming");

		const controller = new AbortController();
		chatAbortRef.current = controller;
		const assistantId = nextId("assistant");
		let assistantContent = "";
		let choices: MessageChoice[] | undefined;

		const publish = () => {
			const assistant: ExtendedMessage = {
				id: assistantId,
				role: "assistant",
				content: assistantContent,
				...(choices ? { choices, choiceKind: "reply" as const } : {}),
			};
			setMessages((prev) => [
				...prev.filter((m) => m.id !== assistantId),
				assistant,
			]);
		};

		// AI SDK data stream: one `{code}:{json}` entry per line.
		const handleLine = (line: string) => {
			const separator = line.indexOf(":");
			if (separator < 1) return;
			const code = line.slice(0, separator);
			if (code !== "0" && code !== "8" && code !== "3") return;
			let payload: unknown;
			try {
				payload = JSON.parse(line.slice(separator + 1));
			} catch {
				console.warn("[chat] Skipped a malformed stream line");
				return;
			}
			if (code === "0" && typeof payload === "string") {
				// The prompt forbids dashes. This is the safety net.
				assistantContent = (assistantContent + payload).replace(
					/\s*[\u2013\u2014]\s*/g,
					", ",
				);
				publish();
			} else if (code === "8" && Array.isArray(payload)) {
				const select = payload.find(isSelectAnnotation);
				if (select) {
					choices = select.choices.map(toMessageChoice);
					publish();
				}
			} else if (code === "3") {
				throw new Error(
					typeof payload === "string" ? payload : "Stream error",
				);
			}
		};

		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ messages: history }),
				signal: controller.signal,
			});

			if (!response.ok || !response.body) {
				throw new Error(`API error: ${response.status}`);
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";
			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					buffer += decoder.decode(value, { stream: true });
					// A network chunk can end in the middle of a line.
					const lines = buffer.split("\n");
					buffer = lines.pop() ?? "";
					for (const line of lines) {
						if (line.trim()) handleLine(line);
					}
				}
				if (buffer.trim()) handleLine(buffer);
			} finally {
				reader.releaseLock();
			}

			if (!assistantContent.trim()) {
				// Buttons without a sentence, or nothing at all.
				assistantContent = choices
					? "Here is what I can do for you."
					: "I have no answer for that. Could you say it another way?";
				publish();
			}
			persist({
				id: assistantId,
				role: "assistant",
				content: assistantContent,
			});
			setStatus("idle");
		} catch (error) {
			if (controller.signal.aborted) {
				// Stopped by the user: keep what was already written.
				setStatus("idle");
			} else {
				console.error("[chat] Chat API error:", error);
				setStatus("error");
				const errorMessage: ExtendedMessage = {
					id: nextId("error"),
					role: "assistant",
					content:
						"I could not get an answer from the server. Check your connection and send your message again.",
				};
				setMessages((prev) => [...prev, errorMessage]);
			}
		} finally {
			chatBusyRef.current = false;
			chatAbortRef.current = null;
		}
	};

	// ---------------------------------------------------------- meditation

	const runGeneration = async (id: string, request: MeditationRequest) => {
		if (generationRef.current) return;
		const controller = new AbortController();
		generationRef.current = { id, controller };
		setIsGeneratingMeditation(true);
		patchCustomMessage(id, {
			content: "",
			isGeneratingMeditation: true,
			stage: "script",
			canRetry: false,
		});

		const stageTimer = setTimeout(
			() => patchCustomMessage(id, { stage: "voice" }),
			scriptEstimateMs(request.duration),
		);

		try {
			const response = await fetch("/api/meditation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: buildPrompt(request),
					duration: request.duration,
					gender: request.gender,
					background: request.background,
					guidance: request.guidance,
					goal: request.goal,
				}),
				signal: controller.signal,
			});
			clearTimeout(stageTimer);

			if (!response.ok) throw new GenerationError("http", response.status);

			// The server has finished. What remains is receiving the mixed file.
			patchCustomMessage(id, { stage: "mix" });
			const audioBlob = await response.blob();
			if (audioBlob.size === 0) throw new GenerationError("empty");
			const audioUrl = URL.createObjectURL(audioBlob);

			updateCustomMessage(id, {
				content: `Your ${request.duration} minute ${GOAL_PHRASES[request.goal]} is ready. Find a comfortable position and press play.`,
				audioUrl,
				isGeneratingMeditation: false,
				stage: undefined,
			});
		} catch (error) {
			if (controller.signal.aborted) {
				patchCustomMessage(id, {
					content: "You stopped this session before it was ready.",
					isGeneratingMeditation: false,
					stage: undefined,
					canRetry: true,
				});
			} else {
				console.error("[chat] Meditation generation failed:", error);
				patchCustomMessage(id, {
					content: describeFailure(error),
					isGeneratingMeditation: false,
					stage: undefined,
					canRetry: true,
				});
			}
		} finally {
			clearTimeout(stageTimer);
			generationRef.current = null;
			setIsGeneratingMeditation(false);
		}
	};

	const generateMeditation = (
		request: MeditationRequest,
		userLine?: string | null,
	) => {
		// The panel must never sit on top of the waiting animation or the player.
		setMeditationMode("chat");
		if (generationRef.current) return;

		if (userLine) {
			addCustomMessage({ id: nextId("user"), role: "user", content: userLine });
		}
		const loadingId = nextId("loading");
		addCustomMessage({
			id: loadingId,
			role: "assistant",
			content: "",
			isGeneratingMeditation: true,
			stage: "script",
			request,
		});
		void runGeneration(loadingId, request);
	};

	const cancelMeditation = (messageId: string) => {
		if (generationRef.current?.id === messageId) {
			generationRef.current.controller.abort();
		}
	};

	const retryMeditation = (messageId: string) => {
		const message = customMessagesRef.current.find((m) => m.id === messageId);
		if (!message?.request) return;
		setMeditationMode("chat");
		void runGeneration(messageId, message.request);
	};

	const startMeditationFlow = (
		goal: MeditationGoal,
		options?: { userLine?: string; prompt?: string },
	) => {
		if (generationRef.current) return;
		setMeditationMode("chat");
		addCustomMessage({
			id: nextId("user"),
			role: "user",
			content: options?.userLine ?? `A ${GOAL_PHRASES[goal]}`,
		});
		addCustomMessage({
			id: nextId("ask"),
			role: "assistant",
			content: "How long do you have?",
			choices: DURATION_CHOICES,
			choiceKind: "duration",
			pending: { goal, prompt: options?.prompt },
		});
	};

	const chooseOption = (messageId: string, picked: MessageChoice | "skip") => {
		const message = [
			...messagesRef.current,
			...customMessagesRef.current,
		].find((m) => m.id === messageId);
		if (!message?.choices || message.answeredWith) return;

		const choice =
			picked === "skip"
				? (message.choices.find((c) => c.isDefault) ?? message.choices[0])
				: picked;
		if (!choice) return;

		if (message.choiceKind === "duration") {
			markAnswered(messageId, choice.label);
			addCustomMessage({
				id: nextId("user"),
				role: "user",
				content: `${choice.value} minutes`,
			});
			addCustomMessage({
				id: nextId("ask"),
				role: "assistant",
				content: "Which voice do you prefer?",
				choices: VOICE_CHOICES,
				choiceKind: "voice",
				pending: { ...message.pending, duration: Number(choice.value) },
			});
			return;
		}

		if (message.choiceKind === "voice") {
			if (generationRef.current) return;
			markAnswered(messageId, choice.label);
			addCustomMessage({
				id: nextId("user"),
				role: "user",
				content: `${choice.label} voice`,
			});
			generateMeditation({
				...DEFAULT_MEDITATION_PARAMS,
				...message.pending,
				gender: choice.value === "male" ? "male" : "female",
			});
			return;
		}

		// Buttons offered by the chat model.
		if (choice.meditation) {
			if (generationRef.current) return;
			markAnswered(messageId, choice.label);
			// The feeling the user typed goes into the script request.
			const lastTyped = [...messagesRef.current]
				.reverse()
				.find((m) => m.role === "user");
			startMeditationFlow(choice.meditation, {
				userLine: choice.label,
				prompt: lastTyped?.content,
			});
			return;
		}
		if (chatBusyRef.current) return;
		markAnswered(messageId, choice.label);
		void sendMessage(choice.label);
	};

	const stop = () => {
		chatAbortRef.current?.abort();
		generationRef.current?.controller.abort();
	};

	// Create unified state object
	const unifiedState: UnifiedChatState = {
		messages,
		status,
		setMessages,
		setStatus,
		customMessages,
		setCustomMessages,
		input,
		setInput,
		handleInputChange: (e) => {
			setInput(e.target.value);
		},
		handleSubmit: (e) => {
			e.preventDefault();
			const trimmed = input.trim();
			if (!trimmed || chatBusyRef.current) return;
			setInput("");
			void sendMessage(trimmed);
		},
		stop,
		isDrawerOpen,
		setIsDrawerOpen,
		isAuthenticated,
		userId,
		conversationId,
		isLoadingHistory,
	};

	// Create context value
	const contextValue: ChatContextValue = {
		chat: unifiedState,
		customMessages,
		isDrawerOpen,
		setIsDrawerOpen,
		isLoadingHistory,
		meditationMode,
		setMeditationMode,
		addCustomMessage,
		updateCustomMessage,
		clearCustomMessages,
		isGeneratingMeditation,
		setIsGeneratingMeditation,
		sendMessage: (text) => void sendMessage(text),
		startMeditationFlow,
		chooseOption,
		generateMeditation,
		cancelMeditation,
		retryMeditation,
	};

	return (
		<ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
	);
}
