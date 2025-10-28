'use client';

import { Bell } from "lucide-react";
import { newsItems } from "../_data/news";
import type { NewsItem } from "../_types/news";
import { motion } from "framer-motion";

export function NewsSection() {
	return (
		<section id="news" className="bg-gradient-to-b from-orange-50 to-white py-20">
			<div className="container mx-auto px-6">
				<NewsHeader />
				<div className="grid gap-8 md:grid-cols-2">
					{newsItems.map((item, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						<NewsCard key={index} item={item} />
					))}
				</div>
			</div>
		</section>
	);
}

export function NewsCard({ item }: { item: NewsItem }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6 }}
			viewport={{ once: true }}
			className="rounded-lg bg-gradient-to-br from-orange-50 to-white p-6 transition hover:shadow-lg border border-orange-100"
		>
			<time className="text-orange-500 text-sm">{item.date}</time>
			<h3 className="mt-2 mb-3 font-semibold text-xl font-tt-drugs">{item.title}</h3>
			<p className="text-gray-600">{item.content}</p>
		</motion.div>
	);
}

export function NewsHeader() {
	return (
		<div className="mb-12 flex items-center justify-center gap-2">
			<Bell className="h-6 w-6 bg-gradient-to-br from-orange-500 to-orange-600 bg-clip-text text-transparent" />
			<h2 className="font-bold text-3xl font-tt-drugs bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Latest Updates</h2>
		</div>
	);
}
