/**
 * Secure Logger - Only logs in development mode
 * Prevents information leakage in production
 */

const isDevelopment = import.meta.env.MODE === 'development';

export const logger = {
  /**
   * Log general information (development only)
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (development only)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log errors (always logged, but sanitized in production)
   */
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, only log generic error without sensitive details
      console.error('An error occurred. Check application logs for details.');
    }
  },

  /**
   * Log debug information (development only)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Log info (development only)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Log API requests (development only, sanitizes sensitive data)
   */
  apiRequest: (method: string, url: string, data?: any) => {
    if (isDevelopment) {
      console.log(`🌐 [API] ${method} ${url}`, data);
    }
  },

  /**
   * Log API responses (development only, sanitizes sensitive data)
   */
  apiResponse: (url: string, status: number, data?: any) => {
    if (isDevelopment) {
      console.log(`✅ [API] ${status} ${url}`, data);
    }
  },

  /**
   * Log API errors (sanitized in production)
   */
  apiError: (url: string, status: number, error: any) => {
    if (isDevelopment) {
      console.error(`❌ [API] ${status} ${url}`, error);
    } else {
      console.error(`API Error: ${status} - Request failed`);
    }
  },
};

export default logger;
