import { RotateCcw } from "lucide-react";
import Image from "next/image";
import { type ComponentProps, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { ExtraProps } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { cn } from "~/lib/utils";
import { EnhancedAudioPlayerWithNoise } from "~/components/chat/shared/enhanced-audio-player-with-noise";
import { MeditationLoadingAnimation } from "./meditation-loading";

export interface MessageChoice {
	label: string;
	value: string;
	isDefault?: boolean;
	/** Set on buttons offered by the chat model that start a meditation. */
	meditation?: "sleep" | "focus" | "calm" | "morning" | null;
}

export type GenerationStage = "script" | "voice" | "mix";

// Extended message type that works for both authenticated and public chat
export interface ExtendedMessage {
	id: string;
	role: "user" | "assistant" | "system" | "data";
	content: string;
	audioUrl?: string;
	isGeneratingMeditation?: boolean; // Flag to show loading animation
	/** Which part of the generation is running. */
	stage?: GenerationStage;
	/** Single-tap answers shown under the bubble. */
	choices?: MessageChoice[];
	choiceKind?: "duration" | "voice" | "reply";
	/** Label of the answer that was picked. */
	answeredWith?: string;
	/** Answers collected so far in the meditation flow. */
	pending?: {
		goal?: "sleep" | "focus" | "calm" | "morning";
		duration?: number;
		prompt?: string;
	};
	/** The generation request, kept so a failed one can be repeated. */
	request?: {
		duration: number;
		gender: "male" | "female";
		guidance: "beginner" | "confirmed" | "expert";
		background: "silence" | "waves" | "rain" | "focus" | "relax";
		goal: "morning" | "focus" | "calm" | "sleep";
		prompt?: string;
	};
	/** True when generation failed or was stopped and can be repeated. */
	canRetry?: boolean;
}

interface BotMessageProps {
	message: ExtendedMessage;
	/** Choice buttons only work on the latest message. */
	isLast?: boolean;
	/** True while a reply or a meditation is on its way. */
	busy?: boolean;
	onChoose?: (choice: MessageChoice | "skip") => void;
	onCancel?: () => void;
	onRetry?: () => void;
}

export function BotMessage({
	message,
	isLast = false,
	busy = false,
	onChoose,
	onCancel,
	onRetry,
}: BotMessageProps) {
	const [displayedText, setDisplayedText] = useState("");
	const [visible, setVisible] = useState(false);
	const [showAudioPlayer, setShowAudioPlayer] = useState(false);

	// Fade in effect
	useEffect(() => {
		setVisible(true);
	}, []);

	// Text typing animation with throttled updates
	useEffect(() => {
		if (message.content.trim().length === 0 || message.isGeneratingMeditation) return;

		const text = message.content;
		let cancelled = false;
		let animationFrame: number;

		// Réinitialiser le texte affiché
		setDisplayedText("");

		// Use a smoother approach: update every 20ms but show multiple characters if needed
		let startTime = Date.now();
		const charsPerUpdate = 1; // Characters to show per update
		const updateInterval = 20; // 20ms between updates for smooth typing effect

		function updateText() {
			if (cancelled) return;

			const elapsed = Date.now() - startTime;
			const targetLength = Math.min(
				Math.floor((elapsed / updateInterval) * charsPerUpdate),
				text.length
			);

			if (targetLength > 0) {
				setDisplayedText(text.substring(0, targetLength));
			}

			if (targetLength < text.length) {
				animationFrame = requestAnimationFrame(updateText);
			}
		}

		// Start animation
		animationFrame = requestAnimationFrame(updateText);

		return () => {
			cancelled = true;
			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
			}
		};
	}, [message.content, message.isGeneratingMeditation]);

	// Animate transformation when audioUrl becomes available
	useEffect(() => {
		if (message.audioUrl && message.isGeneratingMeditation === false) {
			// Wait for text animation to complete, then show audio player with smooth transition
			const timer = setTimeout(() => {
				setShowAudioPlayer(true);
			}, 600);
			
			return () => clearTimeout(timer);
		}
	}, [message.audioUrl, message.isGeneratingMeditation]);

	if (message.content.trim().length === 0 && !message.isGeneratingMeditation) return null;

	const typingDone = displayedText.length >= message.content.length;
	const hasChoices = !!message.choices?.length && !message.isGeneratingMeditation;
	const choicesActive = hasChoices && isLast && !busy && !message.answeredWith;
	const skippable = message.choiceKind === "duration" || message.choiceKind === "voice";

	return (
		<div
			className={cn(
				"relative pt-10 transition-opacity duration-500",
				visible ? "opacity-100" : "opacity-0",
			)}
		>
			{/* Neiji Avatar & Name */}
			<div className="absolute top-1 flex items-center gap-1">
				<Image
					src="/NeijiHeadLogo1.4.png"
					alt="Neiji Logo Head"
					height={50}
					width={50}
				/>
				<span className="text-sm">Neiji</span>
			</div>

			{/* Message Bubble */}
			<div className={cn(
				"whitespace-pre-line break-normal rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-none bg-orange-500 text-white shadow",
				message.isGeneratingMeditation 
					? "w-full max-w-[360px] min-h-[280px] px-4 py-4 sm:px-6" // Holds the breathing circle, never wider than the screen
					: "w-fit max-w-xs lg:max-w-md px-4 py-2" // Normal width for text
			)}>
				{message.isGeneratingMeditation ? (
					// Show loading animation inside the message bubble
					<MeditationLoadingAnimation 
						className="py-2"
						stage={message.stage ?? "script"}
						onCancel={onCancel}
					/>
				) : (
					// Show text content
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						rehypePlugins={[rehypeHighlight]}
						components={{
							// Override default element styling - reduce paragraph spacing
							p: ({ children }) => <p className="my-0.5">{children}</p>,
							a: ({ href, children }) => (
								<a
									href={href}
									className="text-blue-200 underline hover:text-blue-300"
									target="_blank"
									rel="noopener noreferrer"
								>
									{children}
								</a>
							),
							code: ({
								className,
								children,
								...props
							}: ComponentProps<"code"> & ExtraProps) => (
								<code
									className={cn(
										"block overflow-x-auto rounded-md bg-gray-800 p-2",
										className,
									)}
									{...props}
								>
									{children}
								</code>
							),
						}}
					>
						{displayedText}
					</ReactMarkdown>
				)}
			</div>

			{/* Single-tap answers */}
			{hasChoices && typingDone && (
				<div className="mt-3 flex max-w-sm flex-wrap items-center gap-2">
					{message.choices?.map((choice) => {
						const picked = message.answeredWith === choice.label;
						const filled = message.answeredWith ? picked : !!choice.isDefault;
						return (
							<button
								key={choice.label}
								type="button"
								disabled={!choicesActive}
								aria-pressed={picked}
								onClick={() => onChoose?.(choice)}
								className={cn(
									"min-h-11 rounded-full border px-4 py-2 text-left font-medium text-sm transition-colors",
									filled
										? "border-orange-500 bg-orange-500 text-white"
										: "border-orange-300 bg-white/80 text-orange-700",
									choicesActive
										? "hover:border-orange-500 active:scale-[0.98]"
										: "cursor-default",
									!choicesActive && !picked && "opacity-50",
								)}
							>
								{choice.label}
							</button>
						);
					})}
					{skippable && choicesActive && (
						<button
							type="button"
							onClick={() => onChoose?.("skip")}
							className="min-h-11 rounded-full px-3 py-2 text-orange-700 text-sm underline underline-offset-4 hover:text-orange-900"
						>
							Skip
						</button>
					)}
				</div>
			)}

			{/* Retry after a failed or stopped generation */}
			{message.canRetry && !message.isGeneratingMeditation && typingDone && (
				<div className="mt-3">
					<button
						type="button"
						disabled={busy}
						onClick={onRetry}
						className="flex min-h-11 items-center gap-2 rounded-full border border-orange-500 bg-orange-500 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50"
					>
						<RotateCcw className="size-4" />
						Try again
					</button>
				</div>
			)}

			{/* Enhanced Audio Player - Animated entrance */}
			{message.audioUrl && (
				<div 
					className={cn(
						"mt-4 max-w-xs lg:max-w-md transition-all duration-700 ease-out",
						showAudioPlayer 
							? "opacity-100 translate-y-0 scale-100" 
							: "opacity-0 -translate-y-4 scale-95"
					)}
				>
					<EnhancedAudioPlayerWithNoise
						audioUrl={message.audioUrl}
						title="Your Meditation"
					/>
				</div>
			)}
		</div>
	);
}
