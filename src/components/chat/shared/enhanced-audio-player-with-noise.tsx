"use client";

import {
	Download,
	Pause,
	Play,
	RotateCcw,
	SkipBack,
	SkipForward,
	Volume2,
	VolumeX,
	Waves,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { BackgroundNoiseDrawer } from "./background-noise-drawer";
import type { 
  BackgroundNoiseState, 
  BackgroundNoiseConfig 
} from "~/lib/audio/background-noise";
import { 
  DEFAULT_BACKGROUND_NOISE_STATE
} from "~/lib/audio/background-noise";
import { SimpleAudioMixer } from "~/lib/audio/simple-audio-mixer";
import type { AudioMixerState } from "~/lib/audio/simple-audio-mixer";

interface EnhancedAudioPlayerWithNoiseProps {
	audioUrl: string;
	title?: string;
	className?: string;
}

export function EnhancedAudioPlayerWithNoise({
	audioUrl,
	title = "Meditation Audio",
	className,
}: EnhancedAudioPlayerWithNoiseProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(0.8); // Default to 80%
	const [isMuted, setIsMuted] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [showNoiseDrawer, setShowNoiseDrawer] = useState(false);
	const [backgroundNoiseState, setBackgroundNoiseState] = useState<BackgroundNoiseState>(DEFAULT_BACKGROUND_NOISE_STATE);
	
	const audioMixerRef = useRef<SimpleAudioMixer | null>(null);
	const [mixerState, setMixerState] = useState<AudioMixerState | null>(null);

	// Initialize audio mixer
	useEffect(() => {
		audioMixerRef.current = new SimpleAudioMixer(backgroundNoiseState, (state) => {
			setMixerState(state);
			setIsPlaying(state.isPlaying);
			setCurrentTime(state.currentTime);
			setDuration(state.duration);
		});

		return () => {
			audioMixerRef.current?.dispose();
		};
	}, []);

	// Load meditation audio when URL changes
	useEffect(() => {
		if (audioUrl && audioMixerRef.current) {
			console.log('[AudioPlayer] Loading meditation audio...');
			audioMixerRef.current.loadMeditationAudio(audioUrl).then(() => {
				console.log('[AudioPlayer] Meditation audio loaded successfully');
				setIsLoading(false);
				setLoadError(null);
			}).catch((error) => {
				console.error('[AudioPlayer] Failed to load meditation audio:', error);
				setIsLoading(false);
				
				// Provide user-friendly error message
				let errorMsg = 'Failed to load meditation audio';
				if (error instanceof Error) {
					if (error.message.includes('timeout')) {
						errorMsg = 'Audio loading timeout. Please check your connection and try again.';
					} else if (error.message.includes('network')) {
						errorMsg = 'Network error while loading audio. Please check your connection.';
					} else if (error.message.includes('decode')) {
						errorMsg = 'Audio format error. The file may be corrupted.';
					} else if (error.message.includes('not supported')) {
						errorMsg = 'Audio format not supported on this device.';
					}
				}
				setLoadError(errorMsg);
			});
		}
	}, [audioUrl]);

	// Load background noise when selected
	useEffect(() => {
		if (backgroundNoiseState.selectedNoise && audioMixerRef.current) {
			audioMixerRef.current.loadBackgroundNoise(backgroundNoiseState.selectedNoise);
		} else if (!backgroundNoiseState.selectedNoise && audioMixerRef.current) {
			// Stop background noise if none selected
			audioMixerRef.current.stopBackgroundNoise();
		}
	}, [backgroundNoiseState.selectedNoise]);

	// Update background volume when volume changes
	useEffect(() => {
		if (audioMixerRef.current) {
			audioMixerRef.current.setBackgroundVolume(volume);
		}
	}, [volume]);

	const togglePlayback = async () => {
		if (!audioMixerRef.current) return;

		try {
			if (isPlaying) {
				audioMixerRef.current.pause();
			} else {
				await audioMixerRef.current.play();
			}
		} catch (error) {
			console.error('Playback error:', error);
		}
	};

	const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!audioMixerRef.current) return;

		const rect = e.currentTarget.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const newTime = (clickX / rect.width) * duration;

		audioMixerRef.current.seekTo(newTime);
		setCurrentTime(newTime);
	};

	const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newVolume = Number.parseFloat(e.target.value);
		setVolume(newVolume);
		// This volume control now only affects background noise
		audioMixerRef.current?.setBackgroundVolume(newVolume);
		setIsMuted(newVolume === 0);
	};

	const toggleMute = () => {
		if (!audioMixerRef.current) return;

		if (isMuted) {
			audioMixerRef.current.setBackgroundVolume(volume);
			setIsMuted(false);
		} else {
			audioMixerRef.current.setBackgroundVolume(0);
			setIsMuted(true);
		}
	};

	const skipTime = (seconds: number) => {
		if (!audioMixerRef.current) return;

		const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
		audioMixerRef.current.seekTo(newTime);
		setCurrentTime(newTime);
	};

	const restart = () => {
		if (!audioMixerRef.current) return;

		audioMixerRef.current.seekTo(0);
		setCurrentTime(0);
	};

	const downloadAudio = () => {
		const link = document.createElement("a");
		link.href = audioUrl;
		link.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp3`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleBackgroundNoiseApply = (newState: BackgroundNoiseState) => {
		console.log('🎵 Background noise state updated:', newState);
		setBackgroundNoiseState(newState);
		
		// Load the selected background noise in the audio mixer
		if (newState.selectedNoise && audioMixerRef.current) {
			audioMixerRef.current.loadBackgroundNoise(newState.selectedNoise);
		} else if (!newState.selectedNoise && audioMixerRef.current) {
			// Stop background noise if none selected
			audioMixerRef.current.stopBackgroundNoise();
		}
	};

	const formatTime = (time: number) => {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
	};

	const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

	// Show error state
	if (loadError) {
		return (
			<div
				className={cn(
					"rounded-xl border border-red-300 bg-gradient-to-r from-red-100 to-red-200 p-4",
					className,
				)}
			>
				<div className="flex flex-col items-center justify-center gap-2 text-red-700">
					<span className="font-semibold text-sm">⚠️ Audio Error</span>
					<span className="text-center text-xs">{loadError}</span>
					<button
						onClick={() => window.location.reload()}
						className="mt-2 rounded-md bg-red-500 px-3 py-1 text-white text-xs hover:bg-red-600"
					>
						Reload Page
					</button>
				</div>
			</div>
		);
	}

	// Show loading state
	if (isLoading) {
		return (
			<div
				className={cn(
					"rounded-xl border border-orange-300 bg-gradient-to-r from-orange-100 to-orange-200 p-4",
					className,
				)}
			>
				<div className="flex items-center justify-center gap-2 text-orange-700">
					<div className="h-4 w-4 animate-spin rounded-full border-orange-600 border-b-2" />
					<span className="text-sm">Loading audio...</span>
				</div>
			</div>
		);
	}

	return (
		<>
			<div
				className={cn(
					"rounded-xl border border-orange-300 bg-gradient-to-r from-orange-100 to-orange-200 p-4 shadow-lg relative",
					className,
				)}
			>
				{/* Backdrop overlay when background noise drawer is open */}
				{showNoiseDrawer && (
					<div className="absolute inset-0 rounded-xl bg-black/20 backdrop-blur-sm z-10" />
				)}
				
				{/* Content - positioned above backdrop */}
				<div className={cn("relative", showNoiseDrawer && "z-20")}>
					{/* Title */}
					<div className="mb-4 text-center">
					<h3 className="font-semibold text-lg text-orange-800">{title}</h3>
					<p className="text-orange-600 text-sm">
						{formatTime(currentTime)} / {formatTime(duration)}
					</p>
					{backgroundNoiseState.selectedNoise && (
						<p className="text-orange-500 text-xs mt-1 flex items-center justify-center gap-1">
							<Waves className="size-3" />
							{backgroundNoiseState.selectedNoise.name} playing
						</p>
					)}
				</div>

				{/* Progress Bar */}
				<div className="mb-4">
					<div
						className="relative h-2 w-full cursor-pointer overflow-hidden rounded-full bg-orange-200"
						onClick={handleSeek}
					>
						<div
							className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-150"
							style={{ width: `${progressPercentage}%` }}
						/>
						<div
							className="-translate-y-0.5 absolute top-0 h-3 w-3 transform rounded-full bg-orange-600 shadow-md transition-all duration-150"
							style={{ left: `calc(${progressPercentage}% - 6px)` }}
						/>
					</div>
				</div>

				{/* Controls */}
				<div className="mb-4 flex items-center justify-between">
					{/* Left Controls */}
					<div className="flex items-center gap-2">
						<Button
							onClick={restart}
							size="sm"
							variant="ghost"
							className="p-2 text-orange-700 hover:bg-orange-200"
						>
							<RotateCcw className="size-4" />
						</Button>

						<Button
							onClick={() => skipTime(-10)}
							size="sm"
							variant="ghost"
							className="p-2 text-orange-700 hover:bg-orange-200"
						>
							<SkipBack className="size-4" />
						</Button>
					</div>

					{/* Play/Pause Button */}
					<Button
						onClick={togglePlayback}
						size="lg"
						className="h-12 w-12 rounded-full bg-orange-500 p-0 text-white shadow-lg hover:bg-orange-600"
					>
						{isPlaying ? (
							<Pause className="size-6" />
						) : (
							<Play className="ml-0.5 size-6" />
						)}
					</Button>

					{/* Right Controls */}
					<div className="flex items-center gap-2">
						<Button
							onClick={() => skipTime(10)}
							size="sm"
							variant="ghost"
							className="p-2 text-orange-700 hover:bg-orange-200"
						>
							<SkipForward className="size-4" />
						</Button>

						<Button
							onClick={downloadAudio}
							size="sm"
							variant="ghost"
							className="p-2 text-orange-700 hover:bg-orange-200"
						>
							<Download className="size-4" />
						</Button>
					</div>
				</div>

				{/* Volume Controls */}
				<div className="flex items-center gap-3">
					<Button
						onClick={toggleMute}
						size="sm"
						variant="ghost"
						className="p-2 text-orange-700 hover:bg-orange-200"
					>
						{isMuted ? (
							<VolumeX className="size-4" />
						) : (
							<Volume2 className="size-4" />
						)}
					</Button>

					<div className="flex-1">
						<div className="flex items-center justify-between mb-1">
							<span className="text-xs text-orange-600 font-medium">Background Volume</span>
							<span className="text-xs text-orange-600">
								{Math.round((isMuted ? 0 : volume) * 100)}%
							</span>
						</div>
						<input
							type="range"
							min="0"
							max="1"
							step="0.1"
							value={isMuted ? 0 : volume}
							onChange={handleVolumeChange}
							className="slider h-1 w-full cursor-pointer appearance-none rounded-lg bg-orange-200"
							style={{
								background: `linear-gradient(to right, #f97316 0%, #f97316 ${(isMuted ? 0 : volume) * 100}%, #fed7aa ${(isMuted ? 0 : volume) * 100}%, #fed7aa 100%)`,
							}}
						/>
					</div>

					{/* Background Noise Button */}
					<Button
						onClick={() => setShowNoiseDrawer(true)}
						size="sm"
						variant="ghost"
						className={cn(
							"p-2 text-orange-700 hover:bg-orange-200 rounded-full",
							backgroundNoiseState.selectedNoise && "bg-orange-200"
						)}
					>
						<Waves className="size-4" />
					</Button>
				</div>
				</div>
			</div>

			{/* Background Noise Drawer */}
			<BackgroundNoiseDrawer
				isOpen={showNoiseDrawer}
				onClose={() => setShowNoiseDrawer(false)}
				onApply={handleBackgroundNoiseApply}
				currentState={backgroundNoiseState}
			/>

			<style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ea580c;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ea580c;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
		</>
	);
}
