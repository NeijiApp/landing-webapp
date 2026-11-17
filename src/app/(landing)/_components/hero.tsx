import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
	return (
		<section className="bg-gradient-to-b from-orange-50 to-orange-100/70 pt-14 pb-16 sm:pt-20 lg:pb-24">
			<div className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-5 sm:px-8 lg:flex-row lg:gap-16">
				<div className="flex-1 text-center lg:text-left">
					<p className="mb-4 font-semibold text-orange-600 text-sm uppercase tracking-[0.18em]">
						Grow with Neiji, play with Neiji
					</p>
					<h1 className="font-bold font-tt-drugs text-4xl text-[#6B4F2B] leading-[1.1] sm:text-5xl lg:text-6xl">
						Meditation made for the day you are having
					</h1>
					<p className="mx-auto mt-6 max-w-xl text-[#6B4F2B]/80 text-lg leading-relaxed lg:mx-0">
						Tell Neiji what is on your mind. It writes and voices a guided
						meditation for that moment, then helps you come back tomorrow
						until calm becomes a habit.
					</p>
					<div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
						<Link
							href="/chat"
							className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-8 py-3.5 font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.98] sm:w-auto"
						>
							Try Neiji
							<ArrowRight className="h-4 w-4" aria-hidden />
						</Link>
						<Link
							href="/#story"
							className="inline-flex w-full items-center justify-center rounded-full border border-orange-300 bg-white/60 px-8 py-3.5 font-semibold text-orange-700 transition hover:bg-white sm:w-auto"
						>
							Read the manga
						</Link>
					</div>
					<p className="mt-4 text-[#6B4F2B]/60 text-sm">
						Free to try in your browser, with or without an account.
					</p>
				</div>
				<div className="w-full max-w-md flex-1 lg:max-w-none">
					<Image
						src="/demo.png"
						width={765}
						height={681}
						priority
						sizes="(max-width: 1024px) 90vw, 560px"
						alt="Two screens of the Neiji app, a habit path and a personalised meditation player"
						className="h-auto w-full rounded-3xl shadow-xl"
					/>
				</div>
			</div>
		</section>
	);
}
