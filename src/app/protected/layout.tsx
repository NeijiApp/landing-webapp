/**
 * @fileoverview Layout de protection pour les pages authentifiées de l'application Neiji
 *
 * Ce composant fournit un layout protégé qui vérifie l'authentification de l'utilisateur
 * avant d'afficher le contenu. Il inclut également une barre de navigation avec les
 * principales sections de l'application et un menu utilisateur avec déconnexion.
 *
 * @component ProtectedLayout
 * @description Layout wrapper qui assure la protection par authentification
 *
 * Fonctionnalités principales :
 * - Vérification automatique de l'authentification utilisateur
 * - Redirection vers login si non authentifié
 * - Navigation principale avec liens vers Dashboard, Chat et Ask
 * - Menu utilisateur avec email affiché et bouton de déconnexion
 * - Interface responsive avec affichage conditionnel sur mobile
 *
 * @author Neiji Team
 * @version 1.0.0
 * @since 2025
 */

"use client";

import type { User } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "~/utils/supabase/client";

/**
 * Interface pour les props du ProtectedLayout
 */
interface ProtectedLayoutProps {
	children: React.ReactNode;
}

/**
 * Composant de layout pour l'espace protégé
 * Gère l'authentification et fournit la structure de navigation
 */
export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
	// États pour gérer l'utilisateur et le chargement
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

	// Hooks pour la navigation et l'authentification
	const router = useRouter();
	const supabase = createClient();
	useEffect(() => {
		/**
		 * Vérifie l'authentification de l'utilisateur
		 * Redirige vers la page de connexion si non authentifié
		 * Bypass pour développeurs en mode développement
		 */
		const getUser = async () => {
			// Bypass pour développeurs en mode développement
			if (process.env.NODE_ENV === "development") {
				// Vous pouvez créer un utilisateur mockup pour le développement
				const isDeveloper = localStorage.getItem("neiji_dev_mode") === "true";
				if (isDeveloper) {
					setUser({
						id: "dev-user",
						email: "dev@neiji.com",
						// ...autres propriétés mockées
					} as User);
					setLoading(false);
					return;
				}
			}

			// Récupération des données utilisateur depuis Supabase
			const {
				data: { user },
			} = await supabase.auth.getUser();

			// Redirection si utilisateur non authentifié - utilise notre système d'auth conversationnel
			if (!user) {
				router.push("/auth");
				return;
			}

			setUser(user);
			setLoading(false);
		};

		getUser();
	}, [router, supabase]); /**
	 * Gère la déconnexion de l'utilisateur
	 * Supprime la session et redirige vers la page d'accueil
	 */
	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.push("/chat"); // Retourne au chat landing au lieu de forcer la connexion
	};

	/**
	 * Gère le clic sur le logo pour retourner au tableau de bord
	 */
	const handleLogoClick = (e: React.MouseEvent) => {
		e.preventDefault();
		router.push("/protected");
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
									<div className="text-lg">Loading...</div>
			</div>
		);
	}
	return (
		<div className="min-h-screen">
			<header className="fixed top-0 z-50 w-full border-b border-orange-100/20 bg-white/80 backdrop-blur-xl">
				<nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex h-16 items-center justify-between">
						{/* Logo - Always visible */}
					<a
						href="/protected"
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
						<span className="font-logo bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text font-bold text-xl text-transparent sm:text-2xl md:text-3xl">
							Neiji
						</span>
					</a>

						{/* Desktop Navigation */}
						<div className="hidden items-center gap-1 md:flex">
							<Link
								href="/protected"
								className="rounded-full px-4 py-2 font-medium text-gray-700 text-sm transition-all hover:bg-orange-50 hover:text-orange-600"
							>
								Tableau de bord
							</Link>
							<Link
								href="/protected/chat"
								className="rounded-full px-4 py-2 font-medium text-gray-700 text-sm transition-all hover:bg-orange-50 hover:text-orange-600"
							>
								Chat
							</Link>
							<Link
								href="/protected/profile"
								className="rounded-full px-4 py-2 font-medium text-gray-700 text-sm transition-all hover:bg-orange-50 hover:text-orange-600"
							>
								Profile
							</Link>
							<button
								type="button"
								onClick={handleSignOut}
								className="ml-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2 font-semibold text-sm text-white shadow-sm transition-all hover:shadow-md hover:shadow-orange-200 active:scale-95"
							>
								Sign out
							</button>
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
									href="/protected"
									onClick={() => setIsMenuOpen(false)}
									className="block rounded-xl px-4 py-3 font-medium text-gray-700 text-sm transition-colors hover:bg-orange-50 hover:text-orange-600"
								>
									Tableau de bord
								</Link>
								<Link
									href="/protected/chat"
									onClick={() => setIsMenuOpen(false)}
									className="block rounded-xl px-4 py-3 font-medium text-gray-700 text-sm transition-colors hover:bg-orange-50 hover:text-orange-600"
								>
									Chat
								</Link>
								<Link
									href="/protected/profile"
									onClick={() => setIsMenuOpen(false)}
									className="block rounded-xl px-4 py-3 font-medium text-gray-700 text-sm transition-colors hover:bg-orange-50 hover:text-orange-600"
								>
									Profile
								</Link>
								<button
									type="button"
									onClick={() => {
										setIsMenuOpen(false);
										handleSignOut();
									}}
									className="mt-2 block w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-center font-semibold text-sm text-white shadow-sm transition-all active:scale-95"
								>
									Sign out
								</button>
							</nav>
						</motion.div>
					)}
				</AnimatePresence>
			</header>
			<div className="pt-16">{children}</div>
		</div>
	);
}
