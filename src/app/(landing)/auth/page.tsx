"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import { createClient } from "~/utils/supabase/client";
import { generateStableId } from "~/lib/utils/stable-id";

import { BotMessage } from "~/components/chat/shared/bot-message";
import { Chat } from "~/components/chat/shared/chat";
import { GradientBackground } from "~/components/chat/shared/gradient-background";
import { UserMessage } from "~/components/chat/shared/user-message";
import { AuthInput } from "./_components/auth-input";

// Logique d'authentification (équivalent à ChatLogic)
function AuthLogic() {
	const router = useRouter();
	const supabase = createClient();
    const [authStep, setAuthStep] = useState<
        "welcome" | "email" | "password" | "signup"
    >("welcome");
	const [authData, setAuthData] = useState({
		email: "",
		password: "",
		isExistingUser: false,
	});
	const [isLoading, setIsLoading] = useState(false);

	// Messages d'authentification (équivalent à allMessages)
	const [authMessages, setAuthMessages] = useState<
		Array<{
			id: string;
			role: "user" | "assistant";
			content: string;
		}>
	>([
		{
			id: "auth-welcome",
			role: "assistant" as const,
            content:
                "Would you like to create an account or do you already have one? You can also connect with Google.",
		},
	]);

	// Auto-scroll (même logique que le chat)
	useEffect(() => {
		let intervalId: NodeJS.Timeout | null = null;

		const scrollToBottom = () => {
			window.scrollTo({
				top: document.documentElement.scrollHeight,
				behavior: "smooth",
			});
		};

		// Start auto-scrolling when loading
		if (isLoading) {
			scrollToBottom();
			intervalId = setInterval(scrollToBottom, 100);
		}

		return () => {
			if (intervalId) {
				clearInterval(intervalId);
			}
		};
	}, [isLoading]);

    const addMessage = (role: "user" | "assistant", content: string) => {
        const newMessage = {
            id: generateStableId("auth"),
            role,
            content,
        };
        setAuthMessages((prev) => [...prev, newMessage]);
        return newMessage;
    };
    const params = useSearchParams();
    const selectedMode = (params.get("mode") as "login" | "signup") ?? null;

    const handledModeRef = useRef<string | null>(null);
    useEffect(() => {
        if (!selectedMode) return;
        if (handledModeRef.current === selectedMode) return; // avoid double-run in StrictMode
        handledModeRef.current = selectedMode;
        setAuthStep("email");
        if (selectedMode === "login") {
            addMessage("assistant", "Great, let's sign you in. What's your email?");
        } else if (selectedMode === "signup") {
            addMessage("assistant", "Let's create your account. What's your email?");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMode]);
	const detectPositiveResponse = (input: string): boolean => {
		const normalizedInput = input.toLowerCase().trim();
		console.log("✅ === DEBUG DETECTION POSITIVE ===");
		console.log("✅ Input reçu:", `"${input}"`);
		console.log("✅ Input normalisé:", `"${normalizedInput}"`);

		// Test le plus simple d'abord - juste "oui"
		if (normalizedInput === "oui") {
			console.log('✅ ✨ MATCH DIRECT "oui" trouvé !');
			return true;
		}

		// Tests individuels pour debug
		if (normalizedInput === "ouais") {
			console.log('✅ ✨ MATCH DIRECT "ouais" trouvé !');
			return true;
		}

		if (normalizedInput === "ouai") {
			console.log('✅ ✨ MATCH DIRECT "ouai" trouvé !');
			return true;
		}

		// Variantes de "oui" en français (sans les mots ambigus)
		const positiveVariants = [
			"ui",
			"oiu",
			"ouaip",
			"ok",
			"okay",
			"okey",
			"yes",
			"yep",
			"yeah",
			"yess",
			"ye",
			"bien",
			"parfait",
			"daccord",
			"d'accord",
			"dacord",
			"vas-y",
			"vas y",
			"go",
			"gogogo",
			"connect",
			"connexion",
			"connecter",
			"login",
			"signin",
			"sign in",
			"connecte",
			"connecté",
			"je veux",
			"jveux",
			"allons-y",
			"allez",
			"bien sur",
			"bien sûr",
			"evidemment",
			"évidemment",
			"of course",
			"pourquoi pas",
			"why not",
			"avec plaisir",
			"volontiers",
			"banco",
		];

		console.log("✅ Test des variantes...");

		// Vérifier si l'input correspond à une variante
		for (const variant of positiveVariants) {
			console.log(`✅ Test variant: "${variant}" vs "${normalizedInput}"`);

			if (normalizedInput === variant) {
				console.log(`✅ ✨ MATCH EXACT trouvé: "${variant}"`);
				return true;
			}
			if (normalizedInput.includes(variant)) {
				console.log(`✅ ✨ MATCH PAR INCLUSION trouvé: "${variant}"`);
				return true;
			}
			// Gérer les fautes de frappe courantes avec distance de Levenshtein simple
			if (variant.length > 2 && isCloseMatch(normalizedInput, variant)) {
				console.log(`✅ ✨ MATCH FUZZY trouvé: "${variant}"`);
				return true;
			}
		}

		console.log("✅ ❌ Aucun match positif trouvé");
		console.log("✅ === FIN DEBUG DETECTION POSITIVE ===");
		return false;
	}; // Fonction pour détecter si l'utilisateur refuse de se connecter
	const detectNegativeResponse = (input: string): boolean => {
		const normalizedInput = input.toLowerCase().trim();
		console.log("🚫 === DEBUG DETECTION NEGATIVE ===");
		console.log("🚫 Input reçu:", `"${input}"`);
		console.log("🚫 Input normalisé:", `"${normalizedInput}"`);

		// Test le plus simple d'abord - juste "non"
		if (normalizedInput === "non") {
			console.log('🚫 ✨ MATCH DIRECT "non" trouvé !');
			return true;
		}

		// Variantes de "non" en français et anglais - vérification stricte d'abord
		const negativeVariants = [
			"no",
			"nop",
			"nope",
			"nn",
			"nah",
			"nan",
			"naan",
			"niet",
			"nein",
			"pas",
			"jamais",
			"never",
			"pas question",
			"hors de question",
			"aucun",
			"refuse",
			"refus",
			"decline",
			"skip",
			"passer",
			"plus tard",
			"later",
			"not now",
			"pas maintenant",
			"pas envie",
			"bof",
			"mouais",
			"non merci",
			"no thanks",
			"no thank you",
			"ça va",
			"ca va",
			"ça ira",
			"leave",
			"quit",
			"exit",
			"sortir",
			"partir",
			"retour",
			"back",
			"annuler",
			"cancel",
			"abort",
			"stop",
			"arrêt",
			"arret",
		];

		console.log("🚫 Test des variantes...");

		// Test strict d'abord (correspondance exacte et inclusion)
		for (const variant of negativeVariants) {
			console.log(`🚫 Test variant: "${variant}" vs "${normalizedInput}"`);

			if (normalizedInput === variant) {
				console.log(`🚫 ✨ MATCH EXACT trouvé: "${variant}"`);
				return true;
			}
			if (normalizedInput.includes(variant)) {
				console.log(`🚫 ✨ MATCH PAR INCLUSION trouvé: "${variant}"`);
				return true;
			}
		}

		// Puis test avec Levenshtein seulement pour les mots longs
		console.log("🚫 Test fuzzy matching...");
		for (const variant of negativeVariants) {
			if (variant.length > 3 && isCloseMatch(normalizedInput, variant)) {
				console.log(`🚫 ✨ MATCH FUZZY trouvé: "${variant}"`);
				return true;
			}
		}

		console.log("🚫 ❌ Aucun match négatif trouvé");
		console.log("🚫 === FIN DEBUG DETECTION NEGATIVE ===");
		return false;
	};

	// Fonction simple pour détecter les fautes de frappe (distance de 1-2 caractères)
	const isCloseMatch = (input: string, target: string): boolean => {
		if (Math.abs(input.length - target.length) > 2) return false;

		const shorter = input.length < target.length ? input : target;
		const longer = input.length >= target.length ? input : target;

		let differences = 0;
		let i = 0,
			j = 0;

		while (i < shorter.length && j < longer.length) {
			if (shorter[i] !== longer[j]) {
				differences++;
				if (differences > 2) return false;

				// Essayer de sauter un caractère dans la chaîne plus longue
				if (i + 1 < shorter.length && shorter[i + 1] === longer[j]) {
					i++;
				} else if (j + 1 < longer.length && shorter[i] === longer[j + 1]) {
					j++;
				} else {
					i++;
					j++;
				}
			} else {
				i++;
				j++;
			}
		}
		differences += Math.abs(longer.length - shorter.length);
		return differences <= 2;
	};

	/**
	 * Crée un profil utilisateur dans la table users_table
	 * Initialise les champs de mémoire IA pour le nouveau utilisateur
	 *
	 * @param email - Email de l'utilisateur pour lequel créer le profil
	 * @returns Promise<void>
     */     const createUserProfile = async (email: string) => {
        try {
            const res = await fetch("/api/users/ensure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
                credentials: "include",
            });
            if (!res.ok) {
                // Try to read JSON; if not JSON, read text for better diagnostics
                let errorBody: unknown = null;
                try {
                    errorBody = await res.clone().json();
                } catch {
                    try {
                        errorBody = await res.text();
                    } catch {
                        errorBody = null;
                    }
                }
                console.error("❌ Erreur lors de l'ensure du profil:", errorBody);
                addMessage(
                    "assistant",
                    "We could not finalize your profile automatically. You can still use the chat, and your profile will be created after your first login.",
                );
            }
        } catch (err) {
            console.error("❌ Erreur ensure profil:", err);
            addMessage(
                "assistant",
                "A temporary error occurred while preparing your profile. You can retry later from your profile page.",
            );
        }
    };
	const handleUserInput = async (input: string) => {
		// Ajouter le message utilisateur (masquer le mot de passe dans le chat)
		const displayText =
			authStep === "password" || authStep === "signup"
				? "•".repeat(input.length)
				: input;
		addMessage("user", displayText);
		setIsLoading(true);

		// Debug ultra-détaillé
		console.log("🔍 === DEBUT DEBUG COMPLET ===");
		console.log("🔍 Input brut reçu:", input);
		console.log("🔍 Type de input:", typeof input);
		console.log("🔍 Longueur input:", input.length);
		console.log("🔍 Input avec caractères visibles:", JSON.stringify(input));
		console.log("🔍 AuthStep actuel:", authStep);

		const normalizedInput = input.toLowerCase().trim();
		console.log(
			"🔍 Input après normalisation:",
			JSON.stringify(normalizedInput),
		);
		console.log("🔍 Longueur après normalisation:", normalizedInput.length);

		// Tests directs
		console.log("🔍 === TESTS DIRECTS ===");
		console.log('🔍 Test "oui":', normalizedInput === "oui");
		console.log('🔍 Test "ouais":', normalizedInput === "ouais");
		console.log('🔍 Test "ouai":', normalizedInput === "ouai");
		console.log('🔍 Test "yes":', normalizedInput === "yes");
		console.log('🔍 Test "non":', normalizedInput === "non");

		const isPositive = detectPositiveResponse(input);
		const isNegative = detectNegativeResponse(input);

		console.log("🔍 === RESULTATS FINAUX ===");
		console.log("🔍 Résultat détection positive:", isPositive);
		console.log("🔍 Résultat détection négative:", isNegative);
		console.log("🔍 === FIN DEBUG COMPLET ===");

		try {
            if (authStep === "welcome") {
                addMessage(
                    "assistant",
                    "Tap the drawer button below to choose Sign up, Log in, or Google. Or type your email to continue.",
                );
                setAuthStep("email");
            } else if (authStep === "email") {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(input)) {
					addMessage(
						"assistant",
						"Hmm, this email doesn't seem valid. Can you retype it? (example: name@example.com)",
					);
					return;
				}
				setAuthData((prev) => ({ ...prev, email: input }));

                if (selectedMode === "login") {
                    addMessage("assistant", "Thanks. What's your password?");
                    setAuthStep("password");
                } else {
                    addMessage(
                        "assistant",
                        "Great. Choose a secure password (at least 8 characters with letters and numbers).",
                    );
                    setAuthStep("signup");
                }
			} else if (authStep === "password") {
				const { error } = await supabase.auth.signInWithPassword({
					email: authData.email,
					password: input,
				});

				if (error) {
					addMessage(
						"assistant",
                        "We couldn't sign you in. Check your email or password and try again.",
					);
				} else {
                    addMessage(
                        "assistant",
                        "Welcome back! Setting up your session...",
                    );
                    
                    // Wait for the session to be properly established
                    setTimeout(async () => {
                        await createUserProfile(authData.email);
                        addMessage(
                            "assistant",
                            "Perfect! Login successful. Welcome to your personal space! 🎉",
                        );
                        setTimeout(() => {
                            router.push("/protected/chat");
                        }, 1000);
                    }, 500);
				}
			} else if (authStep === "signup") {
				if (input.length < 8) {
					addMessage(
						"assistant",
						"This password is too short. It must contain at least 8 characters. Try again!",
					);
					return;
				}
				if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(input)) {
					addMessage(
						"assistant",
						"Your password must contain both letters and numbers for better security. Try again!",
					);
					return;
				}

				const { error } = await supabase.auth.signUp({
					email: authData.email,
					password: input,
				});

				if (error) {
					addMessage(
						"assistant",
                        `Sorry, something went wrong: ${error.message}`,
					);
				} else {
                    // Wait a moment for session to be established, then create profile
                    addMessage(
                        "assistant",
                        "Account created successfully! Setting up your profile...",
                    );
                    
                    // Wait for the session to be properly established
                    setTimeout(async () => {
                        await createUserProfile(authData.email);
                        addMessage(
                            "assistant",
                            "Your account is ready! Redirecting…",
                        );
                        setTimeout(() => {
                            router.push("/protected/chat");
                        }, 1000);
                    }, 1000);
				}
			}
		} catch (error) {
			addMessage(
				"assistant",
									"Oops! There was a small technical problem. Can you try again?",
			);
		} finally {
			setIsLoading(false);
		}
	};
	return (
		<Chat>
			<div className="container relative z-0 mx-auto space-y-4 px-4 pt-6 sm:px-6">
				{authMessages.length === 0 ? (
					<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
						<Image
							src="/logo-neiji-full.png"
							alt="Neiji Logo"
							width={96}
							height={96}
						/>
						<p className="mx-auto max-w-md px-4 text-lg text-muted-foreground">
							Sign in to your personal Neiji space
						</p>
					</div>
				) : (
					authMessages.map((message, index) => {
						if (message.role === "user") {
							return (
								<UserMessage key={message.id}>{message.content}</UserMessage>
							);
						}

						if (isLoading && index === authMessages.length - 1) {
							return null;
						}

						return <BotMessage key={message.id} message={message} />;
					})
				)}
			</div>

			{/* No email confirmation step needed */}

			{/* AuthInput remplace ChatInput */}
			<AuthInput
				onSend={handleUserInput}
				disabled={isLoading}
				isPassword={authStep === "password" || authStep === "signup"}
				placeholder={
					authStep === "welcome"
						? "Use the buttons above or type your email..."
						: authStep === "email"
							? "Your email address..."
							: authStep === "password"
								? "Your password..."
								: authStep === "signup"
									? "Choose a password..."
									: "Type your message..."
				}
				onFocus={() => {
					if (authMessages.length === 1) {
						// Trigger welcome message if needed
					}
				}}
			/>
		</Chat>
	);
}

export default function AuthPage() {
	return (
		<GradientBackground>
			<Suspense fallback={<div>Loading...</div>}>
				<AuthLogic />
			</Suspense>
		</GradientBackground>
	);
}
