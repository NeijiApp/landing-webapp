"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Menu, X } from "lucide-react";

export default function LandingLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen">
			<Header />
			<div className="pt-16">{children}</div>
		</div>
	);
}

function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
	const navigate = useRouter();

	const handleLogoClick = (e: React.MouseEvent) => {
		e.preventDefault();
		navigate.push("/");
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	return (
		<header className="fixed top-0 z-50 w-full border-b border-orange-100/20 bg-white/80 backdrop-blur-xl">
			<nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					{/* Logo - Always visible */}
					<a
						href="/"
						onClick={handleLogoClick}
						className="group flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] sm:gap-3"
					>
						<Image
							src="/logo-neiji-full.png"
							alt="Neiji Logo"
							width={620}
							height={403}
							className="h-8 w-auto transition-transform group-hover:rotate-6 sm:h-12"
						/>
						<span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text font-bold text-xl text-transparent sm:text-2xl md:text-3xl">
							Neiji
						</span>
					</a>

					{/* Desktop Navigation */}
					<div className="hidden items-center gap-1 md:flex">
						<Link
							href="/manifesto"
							className="rounded-full px-4 py-2 font-medium text-gray-700 text-sm transition-all hover:bg-orange-50 hover:text-orange-600"
						>
							Manifesto
						</Link>
						<Link
							href="/ask"
							className="rounded-full px-4 py-2 font-medium text-gray-700 text-sm transition-all hover:bg-orange-50 hover:text-orange-600"
						>
							Chat
						</Link>
						<Link
							href="/contact"
							className="rounded-full px-4 py-2 font-medium text-gray-700 text-sm transition-all hover:bg-orange-50 hover:text-orange-600"
						>
							Contact
						</Link>
						<Link
							href="/#newsletter"
							className="rounded-full px-4 py-2 font-medium text-gray-700 text-sm transition-all hover:bg-orange-50 hover:text-orange-600"
						>
							Newsletter
						</Link>
						<Link
							href="/chat?signin=true"
							className="ml-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2 font-semibold text-sm text-white shadow-sm transition-all hover:shadow-md hover:shadow-orange-200 active:scale-95"
						>
							Sign In
						</Link>
					</div>

					{/* Mobile Menu Button */}
					<button
						type="button"
						onClick={() => setIsMenuOpen(!isMenuOpen)}
						className="rounded-xl p-2 transition-colors hover:bg-orange-50 md:hidden"
						aria-label="Toggle menu"
					>
						{isMenuOpen ? (
							<X className="h-6 w-6 text-orange-600" />
						) : (
							<Menu className="h-6 w-6 text-orange-600" />
						)}
					</button>
				</div>
			</nav>

			{/* Mobile Menu */}
			<AnimatePresence>
				{isMenuOpen && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.2, ease: "easeOut" }}
						className="overflow-hidden border-t border-orange-100/20 bg-white/95 backdrop-blur-xl md:hidden"
					>
						<nav className="space-y-1 px-4 py-4">
							<Link
								href="/manifesto"
								onClick={() => setIsMenuOpen(false)}
								className="block rounded-xl px-4 py-3 font-medium text-gray-700 text-sm transition-colors hover:bg-orange-50 hover:text-orange-600"
							>
								Manifesto
							</Link>
							<Link
								href="/ask"
								onClick={() => setIsMenuOpen(false)}
								className="block rounded-xl px-4 py-3 font-medium text-gray-700 text-sm transition-colors hover:bg-orange-50 hover:text-orange-600"
							>
								Chat
							</Link>
							<Link
								href="/contact"
								onClick={() => setIsMenuOpen(false)}
								className="block rounded-xl px-4 py-3 font-medium text-gray-700 text-sm transition-colors hover:bg-orange-50 hover:text-orange-600"
							>
								Contact
							</Link>
							<Link
								href="/#newsletter"
								onClick={() => setIsMenuOpen(false)}
								className="block rounded-xl px-4 py-3 font-medium text-gray-700 text-sm transition-colors hover:bg-orange-50 hover:text-orange-600"
							>
								Newsletter
							</Link>
							<Link
								href="/chat?signin=true"
								onClick={() => setIsMenuOpen(false)}
								className="mt-2 block rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-center font-semibold text-sm text-white shadow-sm transition-all active:scale-95"
							>
								Sign In
							</Link>
						</nav>
					</motion.div>
				)}
			</AnimatePresence>
		</header>
	);
}
