import { AuthError } from "@supabase/supabase-js";
import { createClient } from "./client";

/**
 * Handle authentication errors gracefully
 * This function helps recover from common auth issues like expired refresh tokens
 */
export async function handleAuthError(error: unknown): Promise<void> {
  console.error("🔐 Authentication error:", error);

  if (error instanceof AuthError) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('refresh token not found') || 
        errorMessage.includes('invalid refresh token') ||
        errorMessage.includes('refresh_token_not_found')) {
      
      console.log("🔄 Handling expired/invalid refresh token...");
      
      try {
        const supabase = createClient();
        
        // Sign out to clear the invalid session
        await supabase.auth.signOut();
        console.log("✅ Successfully signed out user with invalid token");
        
        // Clear any cached authentication data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.token');
          
          // Clear all supabase-related localStorage items
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') || key.includes('supabase')) {
              localStorage.removeItem(key);
            }
          });
        }
        
        console.log("✅ Cleared authentication cache");
        
        // Optionally redirect to login page for protected routes
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/protected')) {
          console.log("🔀 Redirecting to login page...");
          window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
        }
        
      } catch (signOutError) {
        console.error("❌ Error during sign out:", signOutError);
        // Even if sign out fails, clear the cache
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
      }
    } else {
      console.error("🚨 Unhandled auth error:", error);
    }
  } else {
    console.error("🚨 Non-auth error:", error);
  }
}

/**
 * Wrapper for async operations that might fail due to auth issues
 */
export async function withAuthErrorHandling<T>(
  operation: () => Promise<T>,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    await handleAuthError(error);
    return fallbackValue;
  }
}
