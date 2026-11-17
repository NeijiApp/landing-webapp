export function MangaSection() {
	return (
		<section className="bg-gradient-to-b from-orange-100/70 to-orange-50 py-16 sm:py-20">
			<div className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
				<div className="text-center lg:text-left">
					<p className="mb-3 font-semibold text-orange-600 text-sm uppercase tracking-[0.18em]">
						The story
					</p>
					<h2 className="font-bold font-tt-drugs text-3xl text-[#6B4F2B] sm:text-4xl">
						Neiji began as a manga
					</h2>
					<p className="mt-5 text-[#6B4F2B]/80 text-lg leading-relaxed">
						We drew our vision with a professional mangaka. The story is
						about transformation, the way a caterpillar becomes a
						butterfly, and about the small daily efforts that make it
						possible.
					</p>
					<p className="mt-4 text-[#6B4F2B]/80 text-lg leading-relaxed">
						People keep a habit when they care about where it leads. A
						story gives the daily practice a meaning, and that meaning is
						what brings you back.
					</p>
					<p className="mt-6 text-[#6B4F2B]/60 text-sm">
						Scroll inside the frame to read the first chapter.
					</p>
				</div>
				<div
					className="mx-auto h-[520px] w-full max-w-sm overflow-y-auto overscroll-contain rounded-3xl border border-orange-200 bg-white shadow-xl sm:h-[600px]"
					tabIndex={0}
					role="region"
					aria-label="Neiji manga, chapter one"
				>
					{/* A 914 x 14629 strip: a plain img keeps the native scroll simple. */}
					<img
						src="/manga.png"
						width={914}
						height={14629}
						loading="lazy"
						decoding="async"
						alt="First chapter of the Neiji manga, drawn as a vertical strip"
						className="h-auto w-full"
					/>
				</div>
			</div>
		</section>
	);
}
