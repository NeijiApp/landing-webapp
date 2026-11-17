import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { manifestoItems } from "../_data/manifestoItems";

export function HomeManifesto() {
	return (
		<section className="bg-[#3D2C17] py-20 text-orange-50 sm:py-28">
			<div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
				<div className="lg:sticky lg:top-28 lg:self-start">
					<p className="mb-4 font-semibold text-orange-300 text-sm uppercase tracking-[0.18em]">
						Our thesis
					</p>
					<h2 className="font-bold font-tt-drugs text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
						Seven ideas behind Neiji
					</h2>
					<p className="mt-6 max-w-md text-lg text-orange-50/70 leading-relaxed">
						Neiji started from a conviction about how people change. These
						ideas guide every product decision we make.
					</p>
					<Link
						href="/manifesto"
						className="group mt-8 inline-flex items-center gap-2 border-orange-300/60 border-b pb-1 font-semibold text-orange-200 transition hover:border-orange-200 hover:text-white"
					>
						Read the full manifesto
						<ArrowRight
							className="h-4 w-4 transition-transform group-hover:translate-x-1"
							aria-hidden
						/>
					</Link>
				</div>

				<ol className="border-orange-50/15 border-t">
					{manifestoItems.map((item, index) => (
						<li
							key={item.title}
							className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 border-orange-50/15 border-b py-7 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-x-6 sm:py-9"
						>
							<span
								className="font-bold font-tt-drugs text-4xl text-orange-400 leading-none sm:text-6xl"
								aria-hidden
							>
								{String(index + 1).padStart(2, "0")}
							</span>
							<div>
								<h3 className="font-bold font-tt-drugs text-2xl leading-tight sm:text-3xl">
									{item.title}
								</h3>
								<p className="mt-3 max-w-xl text-orange-50/70 leading-relaxed">
									{item.description}
								</p>
							</div>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
