/**
 * Application constants
 * Centralized constants for API endpoints, UI settings, and other app-wide values
 */

export const API_ENDPOINTS = {
  IPTV_BASE: 'https://iptv-org.github.io/iptv',
  LANGUAGES: '/languages',
  COUNTRIES: '/countries', 
  CATEGORIES: '/categories',
} as const;

export const UI_CONSTANTS = {
  ITEMS_PER_PAGE: 100000,
  SEARCH_DEBOUNCE: 300,
  VIDEO_TIMEOUT: 3000,
  LOADING_SKELETON_COUNT: 12,
  MAX_SEARCH_LENGTH: 100,
  ANIMATION_DURATION: 300,
} as const;

export const CACHE_KEYS = {
  LANGUAGES: 'languages',
  COUNTRIES: 'countries',
  CATEGORIES: 'categories',
  CHANNELS: 'channels',
} as const;

export const STORAGE_KEYS = {
  FAVORITES: 'viloTvFavorites',
  BLOCKLIST: 'viloTvBlocklist',
  USER_PREFERENCES: 'viloTvPreferences',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
} as const;

export const HLS_CONFIG = {
  enableWorker: true,
  lowLatencyMode: true,
  maxBufferLength: 20,
  maxMaxBufferLength: 300,
  maxBufferSize: 60 * 1000 * 1000, // 60 MB
  maxBufferHole: 0.5,
  maxLoadingDelay: 2,
  manifestLoadingRetryDelay: 500,
  levelLoadingRetryDelay: 500,
  fragLoadingRetryDelay: 500,
  startPosition: -1,
  highBufferWatchdogPeriod: 1,
  nudgeMaxRetry: 2,
  abrEwmaDefaultEstimate: 500000,
  abrBandWidthFactor: 0.95,
  abrBandWidthUpFactor: 0.7,
  liveSyncDurationCount: 2,
  liveMaxLatencyDurationCount: 5,
  enableSoftwareAES: false,
  manifestLoadingTimeOut: 10000,
  manifestLoadingMaxRetry: 1,
  levelLoadingTimeOut: 10000,
  levelLoadingMaxRetry: 1,
  fragLoadingTimeOut: 20000,
  fragLoadingMaxRetry: 1,
} as const;