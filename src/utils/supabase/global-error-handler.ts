"use client";

import { handleAuthError } from "./auth-error-handler";

/**
 * Initialize global error handlers for authentication errors
 * Call this once in your app's root component
 */
export function initGlobalAuthErrorHandlers() {
  if (typeof window === 'undefined') return;

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
        
        console.log('🔐 Global handler caught auth error:', error);
        
        // Prevent the default error logging
        event.preventDefault();
        
        // Handle the auth error gracefully
        await handleAuthError(error);
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
        
        console.log('🔐 Global handler caught auth error:', error);
        
        // Handle the auth error gracefully
        await handleAuthError(error);
      }
    }
  });

  console.log('🛡️ Global auth error handlers initialized');
}
