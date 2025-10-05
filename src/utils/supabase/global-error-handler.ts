"use client";

import { handleAuthError } from "./auth-error-handler";

/**
 * Initialize global error handlers for authentication errors
 * Call this once in your app's root component
 */
export function initGlobalAuthErrorHandlers() {
  if (typeof window === 'undefined') return;

  // Override console.error to suppress expected auth errors for unauthenticated users
  const originalConsoleError = console.error;
  console.error = function(...args: any[]) {
    // Check if this is an auth error we want to suppress
    const errorString = args.join(' ').toLowerCase();
    
    if (
      errorString.includes('authapierror') &&
      (errorString.includes('invalid refresh token') || 
       errorString.includes('refresh token not found'))
    ) {
      // Silently ignore - this is expected for unauthenticated users on public pages
      console.debug('🔇 Suppressed expected auth error for unauthenticated user');
      return;
    }
    
    // Call original console.error for all other errors
    originalConsoleError.apply(console, args);
  };

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', async (event) => {
    const error = event.reason;
    
    if (error && typeof error === 'object') {
      const errorMessage = error.message?.toLowerCase() || '';
      const errorName = error.name?.toLowerCase() || '';
      
      if (errorMessage.includes('refresh token not found') ||
          errorMessage.includes('invalid refresh token') ||
          errorMessage.includes('refresh_token_not_found') ||
          errorName.includes('authapierror')) {
        
        console.debug('🔐 Global handler caught auth error (suppressed)');
        
        // Prevent the default error logging
        event.preventDefault();
        
        // Handle the auth error gracefully (only for protected routes)
        if (window.location.pathname.startsWith('/protected')) {
          await handleAuthError(error);
        }
      }
    }
  });

  // Handle global errors
  window.addEventListener('error', async (event) => {
    const error = event.error;
    
    if (error && typeof error === 'object') {
      const errorMessage = error.message?.toLowerCase() || '';
      const errorName = error.name?.toLowerCase() || '';
      
      if (errorMessage.includes('refresh token not found') ||
          errorMessage.includes('invalid refresh token') ||
          errorMessage.includes('refresh_token_not_found') ||
          errorName.includes('authapierror')) {
        
        console.debug('🔐 Global handler caught auth error (suppressed)');
        
        // Prevent the default error logging
        event.preventDefault();
        
        // Handle the auth error gracefully (only for protected routes)
        if (window.location.pathname.startsWith('/protected')) {
          await handleAuthError(error);
        }
      }
    }
  });

  console.log('🛡️ Global auth error handlers initialized (with console suppression)');
}
