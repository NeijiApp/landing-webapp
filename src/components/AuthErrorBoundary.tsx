"use client";

import React, { Component, type ReactNode } from "react";
import { handleAuthError } from "~/utils/supabase/auth-error-handler";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🚨 AuthErrorBoundary caught an error:", error, errorInfo);
    
    // Check if it's an auth-related error
    const errorMessage = error.message?.toLowerCase() || "";
    if (errorMessage.includes('refresh token') || 
        errorMessage.includes('invalid refresh') ||
        errorMessage.includes('auth') ||
        errorMessage.includes('session')) {
      
      console.log("🔐 Handling authentication error in boundary...");
      handleAuthError(error).catch(console.error);
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center p-4">
          <div className="text-orange-500">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Session Expired</h2>
          <p className="text-gray-600 max-w-md">
            Your session has expired. Please refresh the page or sign in again to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
