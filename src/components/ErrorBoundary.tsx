"use client";

import React from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Import ErrorReporter dynamically to avoid SSR issues
    import('@/lib/errors').then(({ ErrorReporter }) => {
      ErrorReporter.reportError(error, {
        componentStack: errorInfo.componentStack || '',
        errorBoundary: 'ErrorBoundary',
      }, 'React');
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center border border-white/20">
        <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
        <p className="text-gray-300 mb-6">
          We&apos;re sorry, but something unexpected happened. Please try again.
        </p>
        {process.env.NODE_ENV === "development" && error && (
          <details className="text-left mb-6">
            <summary className="text-gray-400 cursor-pointer mb-2">Error Details</summary>
            <pre className="text-xs text-red-300 bg-black/20 p-2 rounded overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        <button
          onClick={resetError}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export default ErrorBoundary;
