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
	const error = requestUrl.searchParams.get("error");
	const errorDescription = requestUrl.searchParams.get("error_description");
	
	// Use getSiteUrl() to respect environment (localhost in dev, production URL in prod)
	const origin = getSiteUrl();
	const next = requestUrl.searchParams.get("next") ?? "/protected/chat";

	console.log("🔍 [OAuth Callback] Received request:", {
		url: request.url,
		code: code ? `${code.substring(0, 10)}...` : null,
		error,
		errorDescription,
		origin,
		next,
	});

	// Check if OAuth provider returned an error
	if (error) {
		console.error("❌ [OAuth Callback] Provider error:", error, errorDescription);
		return NextResponse.redirect(
			`${origin}/auth?error=${encodeURIComponent(errorDescription || error)}`
		);
	}

	if (code) {
		try {
			const supabase = await createClient();
			
			console.log("🔄 [OAuth Callback] Exchanging code for session...");
			
			// Exchange the code for a session
			const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
			
			if (exchangeError) {
				console.error("❌ [OAuth Callback] Exchange error:", exchangeError);
				// Redirect to auth page with error
				return NextResponse.redirect(
					`${origin}/auth?error=${encodeURIComponent(exchangeError.message)}`
				);
			}

			if (data?.session) {
				console.log("✅ [OAuth Callback] Session created successfully", {
					userId: data.user?.id,
					email: data.user?.email,
				});
				
				// Ensure user profile exists in database
				if (data.user?.email) {
					try {
						console.log("🔄 [OAuth Callback] Creating user profile...");
						await fetch(`${origin}/api/users/ensure`, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ email: data.user.email }),
						});
						console.log("✅ [OAuth Callback] User profile ensured");
					} catch (profileError) {
						console.error("⚠️ [OAuth Callback] Failed to create user profile:", profileError);
						// Don't block the login flow if profile creation fails
					}
				}
				
				// Redirect to the intended destination
				const redirectUrl = `${origin}${next}`;
				console.log("🎯 [OAuth Callback] Redirecting to:", redirectUrl);
				return NextResponse.redirect(redirectUrl);
			} else {
				console.error("❌ [OAuth Callback] No session in response data");
				return NextResponse.redirect(
					`${origin}/auth?error=no_session_created`
				);
			}
		} catch (exchangeError) {
			console.error("❌ [OAuth Callback] Exception during exchange:", exchangeError);
			return NextResponse.redirect(
				`${origin}/auth?error=authentication_failed`
			);
		}
	}

	// If no code is present, redirect to auth page
	console.log("⚠️ [OAuth Callback] No code parameter, redirecting to auth");
	return NextResponse.redirect(`${origin}/auth`);
}

