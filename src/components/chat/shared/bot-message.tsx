import Image from "next/image";
import { type ComponentProps, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { ExtraProps } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { cn } from "~/lib/utils";
import { EnhancedAudioPlayer } from "~/components/chat/shared/enhanced-audio-player";
import { MeditationLoadingAnimation } from "./meditation-loading";

// Extended message type that works for both authenticated and public chat
export interface ExtendedMessage {
	id: string;
	role: "user" | "assistant" | "system" | "data";
	content: string;
	audioUrl?: string;
	isGeneratingMeditation?: boolean; // Flag to show loading animation
	onCancelGeneration?: () => void; // Callback to cancel generation
}

interface BotMessageProps {
	message: ExtendedMessage;
}

export function BotMessage({ message }: BotMessageProps) {
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
				"whitespace-pre-line break-normal rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-none bg-orange-500 px-4 py-2 text-white shadow",
				message.isGeneratingMeditation 
					? "w-fit max-w-sm lg:max-w-md" // Slightly wider for loading animation
					: "w-fit max-w-xs lg:max-w-md" // Normal width for text
			)}>
				{message.isGeneratingMeditation ? (
					// Show loading animation inside the message bubble
					<MeditationLoadingAnimation 
						className="py-2"
						message="Crafting your meditation"
						onCancel={message.onCancelGeneration}
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
					<EnhancedAudioPlayer
						audioUrl={message.audioUrl}
						title="Your Meditation"
					/>
				</div>
			)}
		</div>
	);
}
