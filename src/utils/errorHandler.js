/**
 * Error Handler & Logger
 * 
 * Provides conditional logging with severity levels.
 * Filters out noisy browser errors and logs only actionable issues.
 * Supports different modes based on NODE_ENV.
 */

// Log levels
export const LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 999
};

// Current log level (set based on environment)
const currentLevel = import.meta.env.MODE === 'production' 
  ? LOG_LEVEL.ERROR 
  : LOG_LEVEL.DEBUG;

// Noisy error patterns to filter out
const NOISE_PATTERNS = [
  /ResizeObserver loop/i,
  /ResizeObserver loop completed with undelivered notifications/i,
  /passive event listener/i,
  /non-passive event listener/i,
  /webkit-tap-highlight-color/i,
  /Failed to execute 'removeChild'/i, // Framer Motion cleanup
];

/**
 * Check if error message should be filtered out
 */
function isNoisy(message) {
  const msgStr = String(message);
  return NOISE_PATTERNS.some(pattern => pattern.test(msgStr));
}

/**
 * Format log message with timestamp and context
 */
function formatMessage(level, message, context) {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1); // HH:MM:SS.mmm
  const emoji = {
    [LOG_LEVEL.DEBUG]: '🔍',
    [LOG_LEVEL.INFO]: 'ℹ️',
    [LOG_LEVEL.WARN]: '⚠️',
    [LOG_LEVEL.ERROR]: '❌',
  }[level] || '📝';
  
  const contextStr = context ? ` [${context}]` : '';
  return `${emoji} ${timestamp}${contextStr} ${message}`;
}

/**
 * Core logging function
 */
function log(level, message, context, ...args) {
  // Skip if below current log level
  if (level < currentLevel) return;
  
  // Skip noisy errors
  if (isNoisy(message)) return;
  
  const formatted = formatMessage(level, message, context);
  
  switch (level) {
    case LOG_LEVEL.DEBUG:
      console.debug(formatted, ...args);
      break;
    case LOG_LEVEL.INFO:
      console.info(formatted, ...args);
      break;
    case LOG_LEVEL.WARN:
      console.warn(formatted, ...args);
      break;
    case LOG_LEVEL.ERROR:
      console.error(formatted, ...args);
      break;
  }
}

/**
 * Debug - Development only, detailed information
 */
export function debug(message, context, ...args) {
  log(LOG_LEVEL.DEBUG, message, context, ...args);
}

/**
 * Info - General information messages
 */
export function info(message, context, ...args) {
  log(LOG_LEVEL.INFO, message, context, ...args);
}

/**
 * Warn - Warning messages for potential issues
 */
export function warn(message, context, ...args) {
  log(LOG_LEVEL.WARN, message, context, ...args);
}

/**
 * Error - Error messages for actual problems
 */
export function error(message, context, ...args) {
  log(LOG_LEVEL.ERROR, message, context, ...args);
}

/**
 * Log app lifecycle events
 */
export function logAppEvent(appId, event, details = {}) {
  const message = `App ${appId}: ${event}`;
  debug(message, 'App', details);
}

/**
 * Log window events
 */
export function logWindowEvent(windowId, event, details = {}) {
  const message = `Window ${windowId}: ${event}`;
  debug(message, 'Window', details);
}

/**
 * Log settings changes
 */
export function logSettingsChange(key, oldValue, newValue) {
  const message = `Setting changed: ${key}`;
  debug(message, 'Settings', { old: oldValue, new: newValue });
}

/**
 * Log performance metrics
 */
export function logPerformance(operation, duration) {
  if (duration > 100) {
    warn(`Slow operation: ${operation} took ${duration}ms`, 'Performance');
  } else {
    debug(`${operation} completed in ${duration}ms`, 'Performance');
  }
}

/**
 * Catch and log unhandled errors
 */
export function setupGlobalErrorHandler() {
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    if (isNoisy(event.message)) {
      event.preventDefault();
      return;
    }
    error(`Unhandled error: ${event.message}`, 'Global', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
  
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (isNoisy(event.reason)) {
      event.preventDefault();
      return;
    }
    error(`Unhandled promise rejection: ${event.reason}`, 'Global', {
      promise: event.promise,
    });
  });
  
  info('Global error handler initialized', 'ErrorHandler');
}

/**
 * Try-catch wrapper with logging
 */
export function tryCatch(fn, context, fallback = null) {
  return (...args) => {
    try {
      return fn(...args);
    } catch (err) {
      if (!isNoisy(err.message)) {
        error(`Error in ${context}: ${err.message}`, context, err);
      }
      return fallback;
    }
  };
}

/**
 * Async try-catch wrapper with logging
 */
export function asyncTryCatch(fn, context, fallback = null) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (!isNoisy(err.message)) {
        error(`Async error in ${context}: ${err.message}`, context, err);
      }
      return fallback;
    }
  };
}

/**
 * Assert condition and log error if false
 */
export function assert(condition, message, context) {
  if (!condition) {
    error(`Assertion failed: ${message}`, context);
  }
}

/**
 * Time a function execution
 */
export function timeFunction(fn, name, context = 'Performance') {
  return (...args) => {
    const start = performance.now();
    const result = fn(...args);
    const duration = performance.now() - start;
    logPerformance(`${name}()`, duration);
    return result;
  };
}

/**
 * Time an async function execution
 */
export function timeAsyncFunction(fn, name, context = 'Performance') {
  return async (...args) => {
    const start = performance.now();
    const result = await fn(...args);
    const duration = performance.now() - start;
    logPerformance(`${name}()`, duration);
    return result;
  };
}

export default {
  debug,
  info,
  warn,
  error,
  logAppEvent,
  logWindowEvent,
  logSettingsChange,
  logPerformance,
  setupGlobalErrorHandler,
  tryCatch,
  asyncTryCatch,
  assert,
  timeFunction,
  timeAsyncFunction,
  LOG_LEVEL,
};
