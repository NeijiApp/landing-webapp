"use client";

import type React from "react";
import { useState } from "react";
import { api } from "~/trpc/react";
import { StatePopup } from "./state-popup";
import { motion } from "framer-motion";

export function NewsletterSection() {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");

	const { mutate } = api.newsletter.create.useMutation();

	const [isPopupOpen, setIsPopupOpen] = useState(false);

	const handleOpenPopup = () => {
		setIsPopupOpen(true);
	};

	const handleClosePopup = () => {
		setIsPopupOpen(false);
	};

	return (
		<div>
			<section id="newsletter" className="bg-gradient-to-b from-orange-100 to-orange-50 py-20">
				<div className="container mx-auto px-6">
					<div className="mx-auto max-w-md text-center">
						<h2 className="mb-6 font-bold text-3xl font-tt-drugs bg-gradient-to-r from-gray-900 to-orange-500 bg-clip-text text-transparent">
							Stay Connected with Neiji
						</h2>
						<p className="mb-8 text-gray-600">
							Be the first to experience Neiji's App
						</p>

						<form
							className="space-y-4"
							onSubmit={(e) => {
								e.preventDefault();
								setStatus("loading");
								mutate(
									{ email },
									{
										onSuccess: () => {
											setStatus("success");
											handleOpenPopup();
											setEmail("");
										},
										onError: () => {
											setStatus("error");
											handleOpenPopup();
										},
									},
								);
							}}
						>
							<motion.input
								initial={{ opacity: 0, x: -20 }}
								whileInView={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.5 }}
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Enter your email"
								className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-orange-500"
								required
							/>
							<motion.button
								initial={{ opacity: 0, x: 20 }}
								whileInView={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.5, delay: 0.1 }}
								whileHover={{ scale: 1.02 }}
								type="submit"
								disabled={status === "loading"}
								className="w-full rounded-lg bg-orange-500 px-6 py-3 text-white transition hover:bg-orange-600 disabled:opacity-50"
							>
								{status === "loading"
									? "Subscribing..."
									: "Subscribe"}
							</motion.button>
							<StatePopup
								isOpen={isPopupOpen}
								onClose={handleClosePopup}
								type={status === "error" ? "error" : "success"}
								message={
									status === "error"
										? "Something went wrong. Please try again."
										: "Thank you for subscribing at the newsletter !"
								}
							/>
						</form>

						{status === "success" && (
							<p className="mt-4 text-green-600">Thank you for subscribing!</p>
						)}
						{status === "error" && (
							<p className="mt-4 text-red-600">
								Something went wrong. Please try again.
							</p>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}
