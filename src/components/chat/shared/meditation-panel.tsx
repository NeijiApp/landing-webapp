"use client";

import {
	ChevronsDown,
	ChevronsUp,
	Clock,
	Focus,
	GraduationCap,
	Moon,
	Play,
	Sunrise,
	Target,
	User,
	Volume2,
	Waves,
} from "lucide-react";
import type * as React from "react";
import { Button } from "~/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

export interface MeditationParams {
	duration: number;
	gender: "male" | "female";
	guidance: "beginner" | "confirmed" | "expert";
	background: "silence" | "waves" | "rain" | "focus" | "relax";
	goal: "morning" | "focus" | "calm" | "sleep";
}

export const DEFAULT_MEDITATION_PARAMS: MeditationParams = {
	duration: 5,
	gender: "female",
	guidance: "confirmed",
	background: "silence",
	goal: "calm",
};

interface MeditationPanelProps {
	onGenerate: (params: MeditationParams) => void;
	isGenerating: boolean;
	isExpanded: boolean;
	toggleExpand: () => void;
	/** Current settings, owned by the chat input so typed requests use them too. */
	params: MeditationParams;
	onParamsChange: React.Dispatch<React.SetStateAction<MeditationParams>>;
	onClose?: () => void;
}

const DURATION_OPTIONS = [2, 3, 5, 7, 10, 15];
const GENDER_OPTIONS = [
	{
		value: "female" as const,
		label: "Female",
		voiceId: "rAmra0SCIYOxYmRNDSm3",
	},
	{ value: "male" as const, label: "Male", voiceId: "GUDYcgRAONiI1nXDcNQQ" },
];
const GUIDANCE_OPTIONS = [
	{
		value: "beginner" as const,
		label: "Beginner",
		description: "Detailed guidance",
	},
	{
		value: "confirmed" as const,
		label: "Confirmed",
		description: "Balanced guidance",
	},
	{
		value: "expert" as const,
		label: "Expert",
		description: "Minimal guidance",
	},
];
const BACKGROUND_OPTIONS = [
	{ value: "silence" as const, label: "Silence", icon: Volume2 },
	{ value: "waves" as const, label: "Ocean Waves", icon: Waves },
	{ value: "rain" as const, label: "Rain", icon: Volume2 },
	{ value: "focus" as const, label: "Focus", icon: Focus },
	{ value: "relax" as const, label: "Relax", icon: Volume2 },
];
const GOAL_OPTIONS = [
	{
		value: "morning" as const,
		label: "Morning",
		icon: Sunrise,
		color: "bg-yellow-100 text-yellow-800",
	},
	{
		value: "focus" as const,
		label: "Focus",
		icon: Focus,
		color: "bg-blue-100 text-blue-800",
	},
	{
		value: "calm" as const,
		label: "Calm",
		icon: Target,
		color: "bg-green-100 text-green-800",
	},
	{
		value: "sleep" as const,
		label: "Sleep",
		icon: Moon,
		color: "bg-purple-100 text-purple-800",
	},
];

export function MeditationPanel({
	onGenerate,
	isGenerating,
	isExpanded,
	toggleExpand,
	params,
	onParamsChange: setParams,
	onClose,
}: MeditationPanelProps) {
	const selectedClass = (isSelected: boolean) =>
		isSelected
			? "bg-orange-500 text-white"
			: "border-orange-300 text-orange-700";

	const handleGenerate = () => {
		onGenerate(params);
		// Close drawer after generation starts
		if (onClose) {
			onClose();
		}
	};

	const CompactView = () => (
		<div className="space-y-3 p-4 pb-0 transition-all duration-300 ease-out">
			{/* Quick Actions: Duration & Goal */}
			<div className="flex gap-2">
				<div className="grid flex-1 grid-cols-3 gap-1.5">
					{[3, 5, 10].map((duration) => (
						<Tooltip key={duration} delayDuration={0}>
							<TooltipTrigger asChild>
								<Button
									key={duration}
									variant={params.duration === duration ? "default" : "outline"}
									size="sm"
									onClick={() => setParams((prev) => ({ ...prev, duration }))}
									className={cn(
										"h-9 min-w-[40px] text-xs transition-all duration-200 ease-out hover:scale-105 active:scale-95",
										selectedClass(params.duration === duration),
									)}
								>
									{duration}m
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>{duration} minutes</p>
							</TooltipContent>
						</Tooltip>
					))}
				</div>
				<div className="grid flex-1 grid-cols-2 gap-1.5">
					{GENDER_OPTIONS.map((gender) => (
						<Tooltip key={gender.value} delayDuration={0}>
							<TooltipTrigger asChild>
								<Button
									variant={
										params.gender === gender.value ? "default" : "outline"
									}
									size="sm"
									onClick={() =>
										setParams((prev) => ({ ...prev, gender: gender.value }))
									}
									className={cn(
										"h-9 w-full text-xs transition-all duration-200 ease-out hover:scale-105 active:scale-95",
										selectedClass(params.gender === gender.value),
									)}
								>
									{gender.label}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>{gender.label} Voice</p>
							</TooltipContent>
						</Tooltip>
					))}
				</div>
			</div>
			<div className="grid flex-1 grid-cols-4 gap-1.5">
				{GOAL_OPTIONS.map((goal) => {
					const Icon = goal.icon;
					return (
						<Tooltip key={goal.value} delayDuration={0}>
							<TooltipTrigger asChild>
								<Button
									variant={params.goal === goal.value ? "default" : "outline"}
									size="icon"
									onClick={() =>
										setParams((prev) => ({ ...prev, goal: goal.value }))
									}
									className={cn(
										"h-9 w-full relative transition-all duration-200 ease-out hover:scale-105 active:scale-95",
										selectedClass(params.goal === goal.value),
									)}
								>
									<Icon className="size-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>{goal.label}</p>
							</TooltipContent>
						</Tooltip>
					);
				})}
			</div>
		</div>
	);

	const ExpandedView = () => (
		<div className="space-y-4 p-4 pb-2 transition-all duration-300 ease-out">
			{/* Duration Selection */}
			<div className="space-y-2">
				<div className="flex items-center gap-2 font-medium text-sm text-orange-800">
					<Clock className="size-4" />
					Duration
				</div>
				<div className="grid grid-cols-3 gap-2">
					{DURATION_OPTIONS.map((duration) => (
						<Button
							key={duration}
							variant={params.duration === duration ? "default" : "outline"}
							size="sm"
							onClick={() => setParams((prev) => ({ ...prev, duration }))}
							className={cn(
								"h-8 text-xs transition-all duration-200 ease-out hover:scale-105 active:scale-95",
								selectedClass(params.duration === duration),
							)}
						>
							{duration}m
						</Button>
					))}
				</div>
			</div>

			{/* Gender Selection */}
			<div className="space-y-2">
				<div className="flex items-center gap-2 font-medium text-sm text-orange-800">
					<User className="size-4" />
					Voice Gender
				</div>
				<div className="grid grid-cols-2 gap-2">
					{GENDER_OPTIONS.map((gender) => (
						<Button
							key={gender.value}
							variant={params.gender === gender.value ? "default" : "outline"}
							size="sm"
							onClick={() =>
								setParams((prev) => ({ ...prev, gender: gender.value }))
							}
							className={cn(
								"h-8 text-xs transition-all duration-200 ease-out hover:scale-105 active:scale-95",
								selectedClass(params.gender === gender.value),
							)}
						>
							{gender.label}
						</Button>
					))}
				</div>
			</div>

			{/* Guidance Level */}
			<div className="space-y-2">
				<div className="flex items-center gap-2 font-medium text-sm text-orange-800">
					<GraduationCap className="size-4" />
					Guidance Level
				</div>
				<div className="grid grid-cols-3 gap-2">
					{GUIDANCE_OPTIONS.map((guidance) => (
						<Button
							key={guidance.value}
							variant={
								params.guidance === guidance.value ? "default" : "outline"
							}
							size="sm"
							onClick={() =>
								setParams((prev) => ({ ...prev, guidance: guidance.value }))
							}
							className={cn(
								"flex h-12 flex-col items-center justify-center p-2 text-center transition-all duration-200 ease-out hover:scale-105 active:scale-95",
								selectedClass(params.guidance === guidance.value),
							)}
						>
							<span className="font-medium text-xs">{guidance.label}</span>
							<span className="text-[10px] opacity-70 leading-tight">{guidance.description}</span>
						</Button>
					))}
				</div>
			</div>

			{/* Background Sound */}
			<div className="space-y-2">
				<div className="flex items-center gap-2 font-medium text-sm text-orange-800">
					<Volume2 className="size-4" />
					Background Sound
				</div>
				<div className="grid grid-cols-3 gap-2">
					{BACKGROUND_OPTIONS.slice(0, 3).map((background) => {
						const Icon = background.icon;
						return (
							<Button
								key={background.value}
								variant={
									params.background === background.value ? "default" : "outline"
								}
								size="sm"
								onClick={() =>
									setParams((prev) => ({
										...prev,
										background: background.value,
									}))
								}
								className={cn(
								"flex h-10 flex-col items-center justify-center gap-1 p-2 relative transition-all duration-200 ease-out hover:scale-105 active:scale-95",
									selectedClass(params.background === background.value),
								)}
							>
								<Icon className="size-3" />
								<span className="text-[10px]">{background.label}</span>
							</Button>
						);
					})}
				</div>
				<div className="grid grid-cols-2 gap-2">
					{BACKGROUND_OPTIONS.slice(3).map((background) => {
						const Icon = background.icon;
						return (
							<Button
								key={background.value}
								variant={
									params.background === background.value ? "default" : "outline"
								}
								size="sm"
								onClick={() =>
									setParams((prev) => ({
										...prev,
										background: background.value,
									}))
								}
								className={cn(
								"flex h-10 flex-col items-center justify-center gap-1 p-2 relative transition-all duration-200 ease-out hover:scale-105 active:scale-95",
									selectedClass(params.background === background.value),
								)}
							>
								<Icon className="size-3" />
								<span className="text-[10px]">{background.label}</span>
							</Button>
						);
					})}
				</div>
			</div>

			{/* Goal Selection */}
			<div className="space-y-2">
				<div className="flex items-center gap-2 font-medium text-sm text-orange-800">
					<Target className="size-4" />
					Meditation Goal
				</div>
				<div className="grid grid-cols-2 gap-2">
					{GOAL_OPTIONS.map((goal) => {
						const Icon = goal.icon;
						return (
							<Button
								key={goal.value}
								variant={params.goal === goal.value ? "default" : "outline"}
								size="sm"
								onClick={() =>
									setParams((prev) => ({ ...prev, goal: goal.value }))
								}
								className={cn(
								"flex h-10 items-center justify-start gap-2 p-2 relative transition-all duration-200 ease-out hover:scale-105 active:scale-95",
									selectedClass(params.goal === goal.value),
								)}
							>
								<Icon className="size-3" />
								<span className="text-xs">{goal.label}</span>
							</Button>
						);
					})}
				</div>
			</div>
		</div>
	);

	return (
		<TooltipProvider>
			<div className="w-full h-full flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-orange-100/60 p-3 text-center bg-white/0 flex-shrink-0">
					<div className="w-8" />
					<h2 className="flex items-center justify-center gap-2 font-bold text-base text-orange-800">
						<Target className="size-4" />
						Meditation Mode
					</h2>
					<Button
						size="icon"
						variant="ghost"
						onClick={toggleExpand}
						className="text-orange-600 hover:bg-orange-200 w-8 h-8 transition-all duration-200 ease-out"
					>
						{isExpanded ? (
							<ChevronsDown className="size-4" />
						) : (
							<ChevronsUp className="size-4" />
						)}
					</Button>
				</div>

				{/* Content - Scrollable in expanded mode */}
				<div className={cn("flex-1", isExpanded && "overflow-y-auto")}>
					{isExpanded ? <ExpandedView /> : <CompactView />}
				</div>

				{/* Generate Button - Sticky at bottom */}
				<div className="border-t border-orange-100/60 p-3 bg-white/0 transition-all duration-300 ease-out flex-shrink-0">
					<Button
						onClick={handleGenerate}
						disabled={isGenerating}
						className="w-full bg-orange-500 py-2.5 font-medium text-sm text-white hover:bg-orange-600 transition-all duration-200 ease-out hover:scale-105 active:scale-95"
						size="default"
					>
						{isGenerating ? (
							<>
								<div className="mr-2 h-3 w-3 animate-spin rounded-full border-white border-b-2" />
								Generating...
							</>
						) : (
							<>
								<Play className="mr-2 size-4" />
								Generate Meditation
							</>
						)}
					</Button>
				</div>
			</div>
		</TooltipProvider>
	);
}

