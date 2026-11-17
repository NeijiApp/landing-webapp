import { updateSession } from "~/utils/supabase/middleware";
import { authMiddleware } from "~/middleware/auth";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Debug, test and admin surfaces. They call paid APIs or expose internals,
 * so they only exist outside production.
 */
const DEV_ONLY_ROUTES = [
	"/debug-",
	"/design-system",
	"/audio-system-docs",
	"/admin",
	"/api/debug-",
	"/api/test-",
	"/api/cache",
	"/api/tts",
];

function isDevOnlyRoute(pathname: string): boolean {
	// The meditation panel still calls this route in production.
	if (pathname.startsWith("/api/test-meditation")) return false;
	return DEV_ONLY_ROUTES.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
	if (
		process.env.NODE_ENV === "production" &&
		isDevOnlyRoute(request.nextUrl.pathname)
	) {
		return new NextResponse(null, { status: 404 });
	}

	// Apply auth middleware with rate limiting
	const authResponse = await authMiddleware(request);
	if (authResponse.status === 401 || authResponse.status === 429) {
		return authResponse;
	}
	
	// Apply Supabase session update
	return await updateSession(request);
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public assets (including audio files)
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|ogg|m4a)$).*)",
	],
};
