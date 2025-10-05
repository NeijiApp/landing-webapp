import { createBrowserClient } from "@supabase/ssr";
import { env } from "~/env";

export const createClient = () => {
	const client = createBrowserClient(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
	);

	// Add global auth error handler
	client.auth.onAuthStateChange((event, session) => {
		if (event === 'TOKEN_REFRESHED') {
			console.log('🔄 Token refreshed successfully');
		} else if (event === 'SIGNED_OUT') {
			console.log('👋 User signed out');
			// Clear any cached user data
			localStorage.removeItem('supabase.auth.token');
		}
	});

	return client;
};
