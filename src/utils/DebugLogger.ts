/**
 * Debug Logger Utility
 */

const DEBUG_PREFIX = '[KGiTON SDK]';

/**
 * Debug logger with conditional logging based on __DEV__
 */
export class DebugLogger {
  private static enabled = __DEV__ ?? false;

  /**
   * Enable or disable debug logging
   */
  static setEnabled(enabled: boolean): void {
    DebugLogger.enabled = enabled;
  }

  /**
   * Check if debug logging is enabled
   */
  static isEnabled(): boolean {
    return DebugLogger.enabled;
  }

  /**
   * Log info message
   */
  static info(message: string, ...args: unknown[]): void {
    if (DebugLogger.enabled) {
      console.log(`${DEBUG_PREFIX} ${message}`, ...args);
    }
  }

  /**
   * Log warning message
   */
  static warn(message: string, ...args: unknown[]): void {
    if (DebugLogger.enabled) {
      console.warn(`${DEBUG_PREFIX} ${message}`, ...args);
    }
  }

  /**
   * Log error message
   */
  static error(message: string, ...args: unknown[]): void {
    if (DebugLogger.enabled) {
      console.error(`${DEBUG_PREFIX} ${message}`, ...args);
    }
  }

  /**
   * Log debug message (only in development)
   */
  static debug(message: string, ...args: unknown[]): void {
    if (DebugLogger.enabled) {
      console.debug(`${DEBUG_PREFIX} ${message}`, ...args);
    }
  }

  /**
   * Log API request
   */
  static logRequest(method: string, url: string, body?: unknown): void {
    if (DebugLogger.enabled) {
      console.log(`${DEBUG_PREFIX} → ${method} ${url}`, body ?? '');
    }
  }

  /**
   * Log API response
   */
  static logResponse(status: number, url: string, data?: unknown): void {
    if (DebugLogger.enabled) {
      console.log(`${DEBUG_PREFIX} ← ${status} ${url}`, data ?? '');
    }
  }

  /**
   * Log BLE event
   */
  static logBle(event: string, ...args: unknown[]): void {
    if (DebugLogger.enabled) {
      console.log(`${DEBUG_PREFIX} [BLE] ${event}`, ...args);
    }
  }
}

// Global declaration for React Native
declare const __DEV__: boolean | undefined;
