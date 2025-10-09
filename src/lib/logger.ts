/**
 * Enhanced logging system for the application
 */

import { config } from './config';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn', 
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  meta?: Record<string, unknown>;
  error?: Error;
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStoredLogs: number;
}

class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logs: LogEntry[] = [];

  private constructor(logConfig: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: config.app.env === 'development',
      enableStorage: true,
      maxStoredLogs: 1000,
      ...logConfig,
    };
  }

  static getInstance(logConfig?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(logConfig);
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    meta?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      meta,
      error,
    };
  }

  private formatLogMessage(entry: LogEntry): string {
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
    const context = entry.context ? ` [${entry.context}]` : '';
    const meta = entry.meta ? ` ${JSON.stringify(entry.meta)}` : '';
    return `${prefix}${context}: ${entry.message}${meta}`;
  }

  private storeLog(entry: LogEntry): void {
    if (!this.config.enableStorage) return;

    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.config.maxStoredLogs) {
      this.logs = this.logs.slice(-this.config.maxStoredLogs);
    }

    // Store in localStorage for persistence across sessions
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('viloTvLogs', JSON.stringify(this.logs.slice(-100))); // Keep only last 100 in storage
      } catch {
        // Handle storage quota exceeded
      }
    }
  }

  private consoleLog(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const message = this.formatLogMessage(entry);
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(message, entry.error || entry.meta);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.meta);
        break;
      case LogLevel.INFO:
        console.info(message, entry.meta);
        break;
      case LogLevel.DEBUG:
        console.debug(message, entry.meta);
        break;
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context?: string,
    meta?: Record<string, unknown>,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context, meta, error);
    
    this.consoleLog(entry);
    this.storeLog(entry);
  }

  error(message: string, error?: Error, context?: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context, meta, error);
  }

  warn(message: string, context?: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context, meta);
  }

  info(message: string, context?: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context, meta);
  }

  debug(message: string, context?: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context, meta);
  }

  // Performance logging
  time(label: string): void {
    if (config.app.env === 'development') {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (config.app.env === 'development') {
      console.timeEnd(label);
    }
  }

  // Get stored logs
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  // Clear stored logs
  clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('viloTvLogs');
    }
  }

  // Load logs from localStorage
  loadStoredLogs(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('viloTvLogs');
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      } catch (error) {
        this.warn('Failed to load stored logs', 'Logger', { error });
      }
    }
  }
}

// Create default logger instance
const logger = Logger.getInstance();

// Load stored logs on initialization
if (typeof window !== 'undefined') {
  logger.loadStoredLogs();
}

export { Logger };
export default logger;