"use client";

import { useEffect } from "react";
import { initGlobalAuthErrorHandlers } from "~/utils/supabase/global-error-handler";

export function GlobalErrorHandler() {
  useEffect(() => {
    initGlobalAuthErrorHandlers();
  }, []);

  return null; // This component doesn't render anything
}
