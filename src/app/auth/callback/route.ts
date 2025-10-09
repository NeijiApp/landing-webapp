import { createClient } from "~/utils/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSiteUrl } from "~/lib/utils/site-url";

/**
 * OAuth Callback Handler
 * 
 * This route handles the OAuth callback from providers like Google.
 * It exchanges the OAuth code for a session and redirects the user.
 * 
 * @see https://supabase.com/docs/guides/auth/social-login/auth-google
 */
export async function GET(request: NextRequest) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");
	// Use getSiteUrl() to respect environment (localhost in dev, production URL in prod)
	const origin = getSiteUrl();
	const next = requestUrl.searchParams.get("next") ?? "/protected/chat";

	if (code) {
		try {
			const supabase = await createClient();
			
			// Exchange the code for a session
			const { data, error } = await supabase.auth.exchangeCodeForSession(code);
			
			if (error) {
				console.error("OAuth callback error:", error);
				// Redirect to auth page with error
				return NextResponse.redirect(
					`${origin}/auth?error=${encodeURIComponent(error.message)}`
				);
			}

			if (data?.session) {
				console.log("✅ OAuth session created successfully");
				
				// Ensure user profile exists in database
				if (data.user?.email) {
					try {
						await fetch(`${origin}/api/users/ensure`, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ email: data.user.email }),
						});
					} catch (profileError) {
						console.error("Failed to create user profile:", profileError);
						// Don't block the login flow if profile creation fails
					}
				}
				
				// Redirect to the intended destination
				return NextResponse.redirect(`${origin}${next}`);
			}
		} catch (exchangeError) {
			console.error("Failed to exchange code for session:", exchangeError);
			return NextResponse.redirect(
				`${origin}/auth?error=authentication_failed`
			);
		}
	}

	// If no code is present, redirect to auth page
	return NextResponse.redirect(`${origin}/auth`);
}

