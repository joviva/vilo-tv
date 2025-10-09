/**
 * Enhanced error handling classes and utilities
 */

import logger from './logger';

// Base application error class
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  readonly timestamp: string;
  readonly context?: string;

  constructor(message: string, context?: string) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    this.context = context;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  protected logError(): void {
    // Log the error after the concrete class is initialized
    logger.error(this.message, this, this.context, {
      code: this.code,
      statusCode: this.statusCode,
    });
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
    };
  }
}

// Specific error types
export class NetworkError extends AppError {
  readonly code = 'NETWORK_ERROR';
  readonly statusCode = 503;

  constructor(message: string = 'Network request failed', context?: string) {
    super(message, context);
    this.logError();
  }
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(message: string = 'Validation failed', context?: string) {
    super(message, context);
    this.logError();
  }
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;

  constructor(message: string = 'Resource not found', context?: string) {
    super(message, context);
    this.logError();
  }
}

export class ServerError extends AppError {
  readonly code = 'SERVER_ERROR';
  readonly statusCode = 500;

  constructor(message: string = 'Internal server error', context?: string) {
    super(message, context);
    this.logError();
  }
}

export class ParseError extends AppError {
  readonly code = 'PARSE_ERROR';
  readonly statusCode = 422;

  constructor(message: string = 'Failed to parse data', context?: string) {
    super(message, context);
    this.logError();
  }
}

export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMIT_ERROR';
  readonly statusCode = 429;

  constructor(message: string = 'Rate limit exceeded', context?: string) {
    super(message, context);
    this.logError();
  }
}

export class TimeoutError extends AppError {
  readonly code = 'TIMEOUT_ERROR';
  readonly statusCode = 408;

  constructor(message: string = 'Request timeout', context?: string) {
    super(message, context);
    this.logError();
  }
}

// Error handler utilities
export class ErrorHandler {
  static handle(error: unknown, context?: string): AppError {
    // If it's already an AppError, return it
    if (error instanceof AppError) {
      return error;
    }

    // Handle fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new NetworkError(error.message, context);
    }

    // Handle AbortError (timeout/cancellation)
    if (error instanceof Error && error.name === 'AbortError') {
      return new TimeoutError('Request was aborted', context);
    }

    // Handle general errors
    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('JSON')) {
        return new ParseError(error.message, context);
      }
      
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        return new NotFoundError(error.message, context);
      }

      if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
        return new TimeoutError(error.message, context);
      }

      // Default to server error for unknown Error instances
      return new ServerError(error.message, context);
    }

    // Handle string errors
    if (typeof error === 'string') {
      return new ServerError(error, context);
    }

    // Handle unknown error types
    return new ServerError('An unknown error occurred', context);
  }

  static isRetryable(error: AppError): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'RATE_LIMIT_ERROR',
      'SERVER_ERROR'
    ];
    
    return retryableCodes.includes(error.code) || error.statusCode >= 500;
  }

  static getRetryDelay(error: AppError, attempt: number): number {
    // Rate limit errors should wait longer
    if (error.code === 'RATE_LIMIT_ERROR') {
      return Math.min(60000, 5000 * Math.pow(2, attempt)); // Max 1 minute
    }

    // Network errors use standard exponential backoff
    if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT_ERROR') {
      return Math.min(30000, 1000 * Math.pow(2, attempt)); // Max 30 seconds
    }

    // Server errors use moderate backoff
    return Math.min(10000, 500 * Math.pow(2, attempt)); // Max 10 seconds
  }
}

// Error boundary helpers for React components
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorInfo?: string;
}

export class ErrorReporter {
  static reportError(error: Error, errorInfo?: ErrorInfo, context?: string): void {
    const appError = ErrorHandler.handle(error, context || 'ErrorBoundary');
    
    logger.error('React Error Boundary caught an error', error, context, {
      componentStack: errorInfo?.componentStack,
      errorBoundary: errorInfo?.errorBoundary,
      errorInfo: errorInfo?.errorInfo,
      appError: appError.toJSON(),
    });

    // In production, you might want to send this to an error tracking service
    // Example: Sentry.captureException(error, { contexts: { errorInfo, appError } });
  }

  static reportAsyncError(error: unknown, context?: string): void {
    const appError = ErrorHandler.handle(error, context || 'AsyncOperation');
    
    logger.error('Unhandled async error', appError, context, {
      appError: appError.toJSON(),
    });
  }
}

// Global error handlers setup
export function setupGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    ErrorReporter.reportAsyncError(event.reason, 'UnhandledPromiseRejection');
    event.preventDefault(); // Prevent console error
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    ErrorReporter.reportAsyncError(event.error, 'UncaughtError');
  });
}

// Async wrapper with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw ErrorHandler.handle(error, context);
  }
}