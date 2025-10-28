"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export function Item({
	icon: Icon,
	title,
	description,
	isMobile,
	index,
}: {
	icon: LucideIcon;
	title: string;
	description: string;
	isMobile: boolean;
	index: number;
}) {
	const itemNumber = `${(index + 1).toString().padStart(2, "0")}.`;

	return (
		<motion.div
			initial={{ opacity: 0, y: isMobile ? 20 : 10 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: isMobile ? "0px" : "-25% 0px" }}
			transition={{ duration: 0.6, delay: index * 0.1 }}
			className="relative rounded-xl border border-orange-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-orange-50/50 to-white"
		>
			{/* Update the layout structure */}
			<div
				className={`flex ${isMobile ? "flex-col" : "flex-row"} items-start gap-6`}
			>
				{/* Icon container */}
				<motion.div
					className={`relative ${isMobile ? "self-center mb-4" : "flex-shrink-0"} mt-0.5 md:mt-1`}
					whileHover={{ scale: 1.1, rotate: 12, boxShadow: "0 4px 20px rgba(255,112,67,0.3)" }}
					transition={{ type: "spring", stiffness: 300 }}
				>
					<Icon
						className={`${
							isMobile ? "h-6 w-6" : "h-10 w-10"
						} text-[#FF7043] opacity-90 transition-all duration-300`}
						strokeWidth={1.75}
					/>
				</motion.div>

				{/* Text content */}
				<div className="flex-1">
					<motion.h2
						whileHover={{ scale: 1.02 }}
						transition={{ type: "spring", stiffness: 300 }}
						className={`${
							isMobile ? "text-3xl" : "text-4xl"
						} mb-4 font-bold text-[#6B4F2B] font-tt-drugs flex items-baseline gap-2`}
					>
						<span className="text-2xl">{itemNumber}</span>
						{title}
					</motion.h2>

					{/* Animated connection line as horizontal divider */}
					<motion.div
						initial={{ scaleX: 0 }}
						whileInView={{ scaleX: 1 }}
						transition={{ delay: 0.3, duration: 0.4 }}
						className="h-0.5 bg-[#FF7043]/50 mb-4"
					/>

					<motion.p
						initial={{ opacity: isMobile ? 1 : 0.8, y: 10 }}
						whileInView={{ opacity: 1, y: 0 }}
						whileHover={isMobile ? {} : { opacity: 1, scale: 1.01 }}
						transition={{ duration: 0.5 }}
						className={`text-[#6B4F2B] ${
							isMobile ? "text-base" : "text-lg"
						} leading-relaxed`}
					>
						{description}
					</motion.p>
				</div>
			</div>
		</motion.div>
	);
}