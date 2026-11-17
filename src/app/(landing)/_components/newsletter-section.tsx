"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

type Status = "idle" | "loading" | "success" | "error";

export function NewsletterSection() {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<Status>("idle");

	const { mutate } = api.newsletter.create.useMutation();

	return (
		<section className="bg-gradient-to-b from-orange-50 to-orange-100/70 py-16 sm:py-20">
			<div className="mx-auto max-w-xl px-5 text-center sm:px-8">
				<h2 className="font-bold font-tt-drugs text-3xl text-[#6B4F2B] sm:text-4xl">
					Follow the project
				</h2>
				<p className="mt-4 text-[#6B4F2B]/75 text-lg leading-relaxed">
					Leave your email to hear about new chapters of the manga and
					the release of the mobile app.
				</p>

				<form
					className="mt-8 flex flex-col gap-3 sm:flex-row"
					onSubmit={(e) => {
						e.preventDefault();
						setStatus("loading");
						mutate(
							{ email },
							{
								onSuccess: () => {
									setStatus("success");
									setEmail("");
								},
								onError: () => setStatus("error"),
							},
						);
					}}
				>
					<label htmlFor="newsletter-email" className="sr-only">
						Email address
					</label>
					<input
						id="newsletter-email"
						type="email"
						autoComplete="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@example.com"
						className="w-full flex-1 rounded-full border border-orange-200 bg-white px-5 py-3 text-[#6B4F2B] placeholder:text-[#6B4F2B]/40 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
						required
					/>
					<button
						type="submit"
						disabled={status === "loading"}
						className="rounded-full bg-orange-500 px-7 py-3 font-semibold text-white transition hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60"
					>
						{status === "loading" ? "Sending" : "Keep me posted"}
					</button>
				</form>

				<p className="mt-4 min-h-6 text-sm" aria-live="polite">
					{status === "success" && (
						<span className="text-green-700">
							Thank you, you are on the list.
						</span>
					)}
					{status === "error" && (
						<span className="text-red-700">
							We could not save your email. Please try again in a moment.
						</span>
					)}
				</p>
			</div>
		</section>
	);
}
