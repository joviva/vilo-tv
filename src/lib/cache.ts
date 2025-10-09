/**
 * Response caching system
 * In-memory cache with TTL support for API responses
 */

import { config } from './config';
import { CACHE_KEYS } from './constants';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  public readonly maxSize: number;

  constructor(maxSize: number = config.performance.cacheSize) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = config.api.cacheTime * 1000): void {
    // If cache is at max size, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
const cache = new MemoryCache();

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

// Helper functions for easier usage
export function getCachedResponse<T>(key: string): T | null {
  if (!config.performance.enableCaching) {
    return null;
  }
  return cache.get<T>(key);
}

export function setCachedResponse<T>(key: string, data: T, ttlMs?: number): void {
  if (!config.performance.enableCaching) {
    return;
  }
  cache.set(key, data, ttlMs);
}

export function deleteCachedResponse(key: string): boolean {
  return cache.delete(key);
}

export function clearCache(): void {
  cache.clear();
}

export function getCacheStats() {
  return {
    size: cache.size(),
    maxSize: cache.maxSize,
    enabled: config.performance.enableCaching,
  };
}

// Cache key generators
export function generateChannelCacheKey(languageCode: string, search?: string, page?: number): string {
  const parts = [CACHE_KEYS.CHANNELS, languageCode];
  if (search) parts.push(`search:${search}`);
  if (page) parts.push(`page:${page}`);
  return parts.join(':');
}

export function generateCountryCacheKey(countryCode: string, search?: string, page?: number): string {
  const parts = [CACHE_KEYS.COUNTRIES, countryCode];
  if (search) parts.push(`search:${search}`);
  if (page) parts.push(`page:${page}`);
  return parts.join(':');
}

export function generateCategoryCacheKey(categoryId: string, search?: string, page?: number): string {
  const parts = [CACHE_KEYS.CATEGORIES, categoryId];
  if (search) parts.push(`search:${search}`);
  if (page) parts.push(`page:${page}`);
  return parts.join(':');
}

export { cache as cacheInstance };