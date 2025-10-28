"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export function Hero() {
	return (
		<section className="bg-gradient-to-b from-orange-50 to-orange-100 pt-24 pb-12">
			<div className="container mx-auto px-6">
				<div className="flex flex-col items-center gap-12 lg:flex-row">
					<div className="flex-1 text-center lg:text-left">
						<motion.h1
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8 }}
							className="mb-6 pb-2 font-bold text-4xl text-gray-900 lg:text-6xl font-tt-drugs bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent leading-[1.15] md:leading-[1.1]"
						>
							Grow with <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">Neiji</span>,<br />
							Play with <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">Neiji</span>
						</motion.h1>
						<motion.p
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 0.2 }}
							className="mb-8 text-gray-600 text-lg"
						>
							Meet your mindfulness partner. Personalised guidance,
							science-backed practices, and a journey to transform stress into
							strength.
							<br /> Start your building your habit today.
						</motion.p>
						<div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
							<motion.a
								href="/chat"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className="flex items-center justify-center gap-2 rounded-full bg-orange-500 px-8 py-3 text-white transition hover:bg-orange-600"
							>
								<Sparkles className="h-5 w-5" />
								Chat with Neiji
							</motion.a>
							<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
								<Link
									href="/manifesto"
									className="rounded-full border-2 border-orange-500 px-8 py-3 text-center text-orange-500 transition hover:bg-orange-50 inline-block"
								>
									Neiji's Manifesto
								</Link>
							</motion.div>
						</div>
					</div>
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.8, delay: 0.4 }}
						className="flex-1"
					>
						<Image
							src="/demo.png"
							width={765}
							height={681}
							alt="Meditation App Preview"
							className="rounded-3xl shadow-2xl hover:shadow-xl transition-shadow"
						/>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
