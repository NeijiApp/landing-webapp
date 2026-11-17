import Link from "next/link";
import { manifestoItems } from "../_data/manifestoItems";

export function HomeManifesto() {
	return (
		<section className="bg-white py-16 sm:py-20">
			<div className="mx-auto max-w-6xl px-5 sm:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<p className="mb-3 font-semibold text-orange-600 text-sm uppercase tracking-[0.18em]">
						Our thesis
					</p>
					<h2 className="font-bold font-tt-drugs text-3xl text-[#6B4F2B] sm:text-4xl">
						Seven ideas behind Neiji
					</h2>
					<p className="mt-4 text-[#6B4F2B]/75 text-lg leading-relaxed">
						Neiji started from a conviction about how people change. These
						ideas guide every product decision we make.
					</p>
				</div>
				<ol className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
					{manifestoItems.map((item, index) => {
						const Icon = item.icon;
						return (
							<li key={item.title} className="flex gap-4">
								<span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
									<Icon
										className="h-5 w-5 text-orange-600"
										strokeWidth={1.75}
										aria-hidden
									/>
								</span>
								<div>
									<h3 className="font-semibold text-[#6B4F2B] text-lg leading-snug">
										<span className="mr-2 text-orange-500">
											{String(index + 1).padStart(2, "0")}
										</span>
										{item.title}
									</h3>
									<p className="mt-2 text-[#6B4F2B]/75 leading-relaxed">
										{item.description}
									</p>
								</div>
							</li>
						);
					})}
				</ol>
				<div className="mt-12 text-center">
					<Link
						href="/manifesto"
						className="inline-flex items-center justify-center rounded-full border border-orange-300 px-7 py-3 font-semibold text-orange-700 transition hover:bg-orange-50"
					>
						Read the full manifesto
					</Link>
				</div>
			</div>
		</section>
	);
}
