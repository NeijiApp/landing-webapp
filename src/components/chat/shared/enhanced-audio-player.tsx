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
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface EnhancedAudioPlayerProps {
	audioUrl: string;
	title?: string;
	className?: string;
}

export function EnhancedAudioPlayer({
	audioUrl,
	title = "Meditation Audio",
	className,
}: EnhancedAudioPlayerProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const [isMuted, setIsMuted] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		console.log("[Audio Player] Initializing with URL:", audioUrl.substring(0, 100));
		const audio = new Audio();
		audioRef.current = audio;
		
		// Set preload to auto for better mobile compatibility
		audio.preload = "auto";
		
		let isLoaded = false;

		const handleLoadSuccess = () => {
			if (isLoaded) return;
			isLoaded = true;
			
			console.log("[Audio Player] Audio loaded successfully, duration:", audio.duration);
			setDuration(audio.duration);
			setIsLoading(false);
			setLoadError(null);
			
			// Clear timeout on successful load
			if (loadingTimeoutRef.current) {
				clearTimeout(loadingTimeoutRef.current);
				loadingTimeoutRef.current = null;
			}
		};

		const handleLoadedMetadata = () => {
			console.log("[Audio Player] loadedmetadata event fired");
			handleLoadSuccess();
		};
		
		const handleCanPlay = () => {
			console.log("[Audio Player] canplay event fired");
			handleLoadSuccess();
		};
		
		const handleCanPlayThrough = () => {
			console.log("[Audio Player] canplaythrough event fired");
			handleLoadSuccess();
		};
		
		const handleLoadedData = () => {
			console.log("[Audio Player] loadeddata event fired");
			handleLoadSuccess();
		};

		const handleTimeUpdate = () => {
			setCurrentTime(audio.currentTime);
		};

		const handleEnded = () => {
			setIsPlaying(false);
			setCurrentTime(0);
		};

		const handleError = (e: Event | ErrorEvent) => {
			console.error("[Audio Player] Error loading audio:", e);
			console.error("[Audio Player] Audio error details:", {
				error: audio.error,
				networkState: audio.networkState,
				readyState: audio.readyState,
				src: audio.src.substring(0, 100)
			});
			
			setIsLoading(false);
			
			// Provide user-friendly error message
			let errorMsg = "Failed to load audio";
			if (audio.error) {
				switch (audio.error.code) {
					case MediaError.MEDIA_ERR_ABORTED:
						errorMsg = "Audio loading was aborted";
						break;
					case MediaError.MEDIA_ERR_NETWORK:
						errorMsg = "Network error while loading audio";
						break;
					case MediaError.MEDIA_ERR_DECODE:
						errorMsg = "Audio decoding failed";
						break;
					case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
						errorMsg = "Audio format not supported on this device";
						break;
				}
			}
			setLoadError(errorMsg);
			
			// Clear timeout on error
			if (loadingTimeoutRef.current) {
				clearTimeout(loadingTimeoutRef.current);
				loadingTimeoutRef.current = null;
			}
		};

		// Add multiple event listeners for better mobile compatibility
		audio.addEventListener("loadedmetadata", handleLoadedMetadata);
		audio.addEventListener("canplay", handleCanPlay);
		audio.addEventListener("canplaythrough", handleCanPlayThrough);
		audio.addEventListener("loadeddata", handleLoadedData);
		audio.addEventListener("timeupdate", handleTimeUpdate);
		audio.addEventListener("ended", handleEnded);
		audio.addEventListener("error", handleError);

		// Set source and explicitly load
		audio.src = audioUrl;
		audio.load();
		
		// Set a timeout to detect stuck loading (15 seconds)
		loadingTimeoutRef.current = setTimeout(() => {
			if (isLoading && !isLoaded) {
				console.error("[Audio Player] Loading timeout - audio failed to load within 15s");
				setLoadError("Audio loading timeout. Please try again or check your connection.");
				setIsLoading(false);
			}
		}, 15000);

		return () => {
			audio.pause();
			audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
			audio.removeEventListener("canplay", handleCanPlay);
			audio.removeEventListener("canplaythrough", handleCanPlayThrough);
			audio.removeEventListener("loadeddata", handleLoadedData);
			audio.removeEventListener("timeupdate", handleTimeUpdate);
			audio.removeEventListener("ended", handleEnded);
			audio.removeEventListener("error", handleError);
			
			// Clear timeout on cleanup
			if (loadingTimeoutRef.current) {
				clearTimeout(loadingTimeoutRef.current);
				loadingTimeoutRef.current = null;
			}
			
			// Revoke blob URL if it's a blob to free memory
			if (audioUrl.startsWith("blob:")) {
				URL.revokeObjectURL(audioUrl);
			}
		};
	}, [audioUrl]);

	const togglePlayback = () => {
		if (!audioRef.current) return;

		if (isPlaying) {
			audioRef.current.pause();
			setIsPlaying(false);
		} else {
			audioRef.current.play();
			setIsPlaying(true);
		}
	};

	const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!audioRef.current) return;

		const rect = e.currentTarget.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const newTime = (clickX / rect.width) * duration;

		audioRef.current.currentTime = newTime;
		setCurrentTime(newTime);
	};

	const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newVolume = Number.parseFloat(e.target.value);
		setVolume(newVolume);
		if (audioRef.current) {
			audioRef.current.volume = newVolume;
		}
		setIsMuted(newVolume === 0);
	};

	const toggleMute = () => {
		if (!audioRef.current) return;

		if (isMuted) {
			audioRef.current.volume = volume;
			setIsMuted(false);
		} else {
			audioRef.current.volume = 0;
			setIsMuted(true);
		}
	};

	const skipTime = (seconds: number) => {
		if (!audioRef.current) return;

		const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
		audioRef.current.currentTime = newTime;
		setCurrentTime(newTime);
	};

	const restart = () => {
		if (!audioRef.current) return;

		audioRef.current.currentTime = 0;
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
		<div
			className={cn(
				"rounded-xl border border-orange-300 bg-gradient-to-r from-orange-100 to-orange-200 p-4 shadow-lg",
				className,
			)}
		>
			{/* Title */}
			<div className="mb-4 text-center">
				<h3 className="font-semibold text-lg text-orange-800">{title}</h3>
				<p className="text-orange-600 text-sm">
					{formatTime(currentTime)} / {formatTime(duration)}
				</p>
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

			{/* Volume Control */}
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

				<span className="min-w-[30px] text-right text-orange-600 text-xs">
					{Math.round((isMuted ? 0 : volume) * 100)}%
				</span>
			</div>

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
		</div>
	);
}
