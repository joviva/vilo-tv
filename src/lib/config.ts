/**
 * Application configuration
 * Centralized configuration for environment variables and app settings
 */

export const config = {
  api: {
    cacheTime: parseInt(process.env.API_CACHE_TIME || '3600', 10), // 1 hour
    rateLimit: parseInt(process.env.RATE_LIMIT || '60', 10),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    timeout: parseInt(process.env.API_TIMEOUT || '10000', 10),
    retries: parseInt(process.env.API_RETRIES || '3', 10),
  },
  app: {
    name: process.env.APP_NAME || 'ViloTV',
    version: process.env.APP_VERSION || '1.0.0',
    env: process.env.NODE_ENV || 'development',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  },
  security: {
    enableCSP: process.env.ENABLE_CSP === 'true',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
  },
  performance: {
    enableCaching: process.env.ENABLE_CACHING !== 'false',
    cacheSize: parseInt(process.env.CACHE_SIZE || '1000', 10),
    enableVirtualization: process.env.ENABLE_VIRTUALIZATION === 'true',
  }
} as const;

export type Config = typeof config;