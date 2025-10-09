"use client";

import { useEffect } from "react";

export default function GlobalErrorSetup() {
  useEffect(() => {
    // Setup global error handlers on client side
    const setupGlobalErrorHandlers = () => {
      if (typeof window === 'undefined') return;

      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        // In production, you might want to send this to an error tracking service
        event.preventDefault();
      });

      // Handle uncaught errors
      window.addEventListener('error', (event) => {
        console.error('Uncaught error:', event.error);
        // In production, you might want to send this to an error tracking service
      });
    };

    setupGlobalErrorHandlers();
  }, []);

  return null;
}