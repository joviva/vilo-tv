/**
 * Enhanced API utilities with retry logic and request deduplication
 */

import { config } from './config';
import { HTTP_STATUS, ERROR_CODES } from './constants';

// Request deduplication - prevent multiple identical requests
const pendingRequests = new Map<string, Promise<unknown>>();

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: Error, attempt: number) => boolean;
}

class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Default retry condition - retry on network errors and 5xx status codes
 */
function defaultRetryCondition(error: Error, attempt: number): boolean {
  // Don't retry after max attempts
  if (attempt >= config.api.retries) return false;
  
  // Retry on network errors
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return true;
  }
  
  // Retry on server errors (5xx)
  if (error instanceof APIError && error.statusCode >= 500) {
    return true;
  }
  
  return false;
}

/**
 * Calculate exponential backoff delay
 */
function calculateDelay(attempt: number, baseDelay: number = 1000, maxDelay: number = 30000, backoffFactor: number = 2): number {
  const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Enhanced fetch with retry logic
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  options: RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = config.api.retries,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    retryCondition = defaultRetryCondition,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.api.timeout);

      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Throw error for non-ok responses
      if (!response.ok) {
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.status === HTTP_STATUS.TOO_MANY_REQUESTS ? ERROR_CODES.RATE_LIMIT_EXCEEDED : undefined
        );
      }

      return response;
    } catch (error) {
      const apiError = error instanceof APIError ? error : new APIError(
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      lastError = apiError;

      // Don't retry if it's the last attempt or retry condition is false
      if (attempt > maxRetries || !retryCondition(apiError, attempt)) {
        throw lastError;
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, baseDelay, maxDelay, backoffFactor);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Deduplicated fetch - prevents multiple identical requests
 */
export async function dedupedFetch<T>(
  url: string,
  init: RequestInit = {},
  options: RetryOptions = {}
): Promise<T> {
  const requestKey = `${url}:${JSON.stringify(init)}`;

  // Return existing promise if request is already in flight
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey) as Promise<T>;
  }

  // Create new request promise
  const requestPromise = fetchWithRetry(url, init, options)
    .then(async (response) => {
      const data = await response.json();
      return data as T;
    })
    .finally(() => {
      // Remove from pending requests when completed
      pendingRequests.delete(requestKey);
    });

  // Store pending request
  pendingRequests.set(requestKey, requestPromise);

  return requestPromise;
}

/**
 * Enhanced fetch with built-in JSON parsing and error handling
 */
export async function fetchJSON<T>(
  url: string,
  init: RequestInit = {},
  options: RetryOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, init, options);
  
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    throw new APIError(
      'Expected JSON response but received: ' + contentType,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.EXTERNAL_API_ERROR
    );
  }

  try {
    return await response.json() as T;
  } catch {
    throw new APIError(
      'Failed to parse JSON response',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.EXTERNAL_API_ERROR
    );
  }
}

/**
 * Utility to check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof APIError)) return false;
  
  // Retry server errors but not client errors
  return error.statusCode >= 500 || error.code === ERROR_CODES.RATE_LIMIT_EXCEEDED;
}

/**
 * Utility to check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('Failed to fetch') ||
           error.name === 'AbortError';
  }
  return false;
}

/**
 * Utility to check if error is a server error
 */
export function isServerError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.statusCode >= 500;
  }
  return false;
}

/**
 * Get request statistics
 */
export function getRequestStats() {
  return {
    pendingRequests: pendingRequests.size,
    pendingUrls: Array.from(pendingRequests.keys()),
  };
}

export { APIError };