const steps = [
	{
		title: "Say how you feel",
		description:
			"Write a sentence or pick a goal such as sleep, focus or calm. Neiji asks one or two questions when it needs to understand more.",
	},
	{
		title: "Listen to your meditation",
		description:
			"Neiji writes a session for your situation and reads it in a voice you choose, with the length and background sound you prefer.",
	},
	{
		title: "Come back tomorrow",
		description:
			"A few minutes a day is enough. Neiji remembers what helped you and keeps the next session short and easy to start.",
	},
];

export function HowItWorks() {
	return (
		<section className="bg-white py-16 sm:py-20">
			<div className="mx-auto max-w-6xl px-5 sm:px-8">
				<h2 className="text-center font-bold font-tt-drugs text-3xl text-[#6B4F2B] sm:text-4xl">
					How Neiji works
				</h2>
				<ol className="mt-10 grid gap-6 md:grid-cols-3">
					{steps.map((step, index) => (
						<li
							key={step.title}
							className="rounded-2xl border border-orange-100 bg-orange-50/50 p-6"
						>
							<span className="font-bold font-tt-drugs text-2xl text-orange-500">
								{String(index + 1).padStart(2, "0")}
							</span>
							<h3 className="mt-3 font-semibold text-[#6B4F2B] text-xl">
								{step.title}
							</h3>
							<p className="mt-2 text-[#6B4F2B]/75 leading-relaxed">
								{step.description}
							</p>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
