"use client";

import React from "react";
import { ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

export function PageErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center border border-white/20">
        <ExclamationTriangleIcon className="w-20 h-20 text-red-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">Oops! Something went wrong</h1>
        <p className="text-gray-300 mb-8">
          We encountered an unexpected error while loading this page. This might be a temporary issue.
        </p>
        
        {process.env.NODE_ENV === "development" && error && (
          <details className="text-left mb-8">
            <summary className="text-gray-400 cursor-pointer mb-3 text-sm font-medium">
              Error Details (Development)
            </summary>
            <pre className="text-xs text-red-300 bg-black/30 p-4 rounded overflow-auto max-h-40">
              {error.message}
              {error.stack && `\n\nStack Trace:\n${error.stack}`}
            </pre>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={resetError}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Try Again
          </button>
          <button
            onClick={() => window.location.href = "/"}
            className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

export function ComponentErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
      <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">Component Error</h3>
      <p className="text-gray-300 mb-4">
        This component failed to load properly.
      </p>
      {process.env.NODE_ENV === "development" && error && (
        <details className="text-left mb-4">
          <summary className="text-gray-400 cursor-pointer mb-2 text-sm">Error Details</summary>
          <pre className="text-xs text-red-300 bg-black/20 p-2 rounded overflow-auto">
            {error.message}
          </pre>
        </details>
      )}
      <button
        onClick={resetError}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
