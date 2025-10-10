import { env } from "~/env";

/**
 * Get the site URL for OAuth redirects and other purposes
 * 
 * This function returns the site URL in a reliable way across environments:
 * - Production: Uses NEXT_PUBLIC_SITE_URL from env
 * - Development: Falls back to localhost (or window.location.origin)
 * - Vercel: Falls back to VERCEL_URL if available
 * 
 * @returns The site URL (e.g., "https://your-domain.com" or "http://localhost:3000")
 */
export function getSiteUrl(): string {
	// In development, prefer client-side detection or localhost
	if (process.env.NODE_ENV === "development") {
		// If running in browser, use the actual origin (handles custom ports, etc.)
		if (typeof window !== "undefined") {
			return window.location.origin;
		}
		// If server-side in dev, check for explicit override, otherwise use localhost
		return env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
	}

	// 1. Try NEXT_PUBLIC_SITE_URL from env (production priority)
	if (env.NEXT_PUBLIC_SITE_URL) {
		return env.NEXT_PUBLIC_SITE_URL;
	}

	// 2. Try Vercel auto-generated URL (for preview and production)
	if (process.env.NEXT_PUBLIC_VERCEL_URL) {
		return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
	}
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}

	// 3. Try window.location.origin (client-side fallback)
	if (typeof window !== "undefined") {
		return window.location.origin;
	}

	// 4. Default to localhost as last resort
	return "http://localhost:3000";
}

/**
 * Get the OAuth callback URL
 * 
 * @param provider - The OAuth provider (e.g., "google")
 * @returns The full callback URL
 */
export function getOAuthCallbackUrl(provider?: string): string {
	const baseUrl = getSiteUrl();
	return `${baseUrl}/auth/callback`;
}

/**
 * Get the OAuth redirect URL with optional next parameter
 * 
 * @param next - The path to redirect to after successful auth (default: "/protected/chat")
 * @returns The full redirect URL with next parameter
 */
export function getOAuthRedirectUrl(next = "/protected/chat"): string {
	const callbackUrl = getOAuthCallbackUrl();
	return next ? `${callbackUrl}?next=${encodeURIComponent(next)}` : callbackUrl;
}

