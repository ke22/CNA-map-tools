/**
 * Core Logger Module
 * Unified logging system for the entire application
 * 
 * This module provides a centralized logging interface that can be used
 * throughout the application, replacing direct console.log calls.
 * 
 * Usage (Browser):
 *   Logger.info('Message');
 *   Logger.error('Error message', errorData);
 * 
 * Usage (Node.js):
 *   const Logger = require('./core/Logger.js');
 *   Logger.info('Message');
 */

// Import existing Logger if available (for backward compatibility)
const ExistingLogger = typeof window !== 'undefined' && window.Logger;

/**
 * Logger Configuration
 */
const LOG_CONFIG = {
    enabled: true,
    logLevel: 'info', // 'none' | 'error' | 'warn' | 'info' | 'debug' | 'all'
    
    // Log level priority
    levels: {
        none: 0,
        error: 1,
        warn: 2,
        info: 3,
        debug: 4,
        all: 5
    },
    
    // Emoji prefixes for better visual identification
    emojis: {
        error: '❌',
        warn: '⚠️',
        info: 'ℹ️',
        debug: '🔍',
        success: '✅',
        trace: '📍'
    }
};

/**
 * Check if logging should occur for given level
 */
function shouldLog(level) {
    if (!LOG_CONFIG.enabled) return false;
    const currentLevel = LOG_CONFIG.levels[LOG_CONFIG.logLevel] || 0;
    const messageLevel = LOG_CONFIG.levels[level] || 0;
    return messageLevel <= currentLevel;
}

/**
 * Format log message with emoji prefix
 */
function formatMessage(level, message, data = null) {
    const emoji = LOG_CONFIG.emojis[level] || '📌';
    const prefix = `${emoji} [${level.toUpperCase()}]`;
    const formattedMessage = `${prefix} ${message}`;
    
    if (data !== null && data !== undefined) {
        return [formattedMessage, data];
    }
    return formattedMessage;
}

/**
 * Core Logger Class
 * Provides unified logging interface
 */
class Logger {
    /**
     * Log error message
     */
    static error(message, data = null) {
        if (shouldLog('error')) {
            const formatted = formatMessage('error', message, data);
            if (data !== null) {
                console.error(...formatted);
            } else {
                console.error(formatted);
            }
        }
    }
    
    /**
     * Log warning message
     */
    static warn(message, data = null) {
        if (shouldLog('warn')) {
            const formatted = formatMessage('warn', message, data);
            if (data !== null) {
                console.warn(...formatted);
            } else {
                console.warn(formatted);
            }
        }
    }
    
    /**
     * Log info message
     */
    static info(message, data = null) {
        if (shouldLog('info')) {
            const formatted = formatMessage('info', message, data);
            if (data !== null) {
                console.log(...formatted);
            } else {
                console.log(formatted);
            }
        }
    }
    
    /**
     * Log debug message
     */
    static debug(message, data = null) {
        if (shouldLog('debug')) {
            const formatted = formatMessage('debug', message, data);
            if (data !== null) {
                console.log(...formatted);
            } else {
                console.log(formatted);
            }
        }
    }
    
    /**
     * Log success message
     */
    static success(message, data = null) {
        if (shouldLog('info')) {
            const formatted = formatMessage('success', message, data);
            if (data !== null) {
                console.log(...formatted);
            } else {
                console.log(formatted);
            }
        }
    }
    
    /**
     * Log trace message (for detailed debugging)
     */
    static trace(message, data = null) {
        if (shouldLog('debug')) {
            const formatted = formatMessage('trace', message, data);
            if (data !== null) {
                console.log(...formatted);
            } else {
                console.log(formatted);
            }
        }
    }
    
    /**
     * Group related logs
     */
    static group(label) {
        if (shouldLog('debug')) {
            console.group(label);
        }
    }
    
    /**
     * End log group
     */
    static groupEnd() {
        if (shouldLog('debug')) {
            console.groupEnd();
        }
    }
    
    /**
     * Start performance timer
     */
    static time(label) {
        if (shouldLog('debug')) {
            console.time(label);
        }
    }
    
    /**
     * End performance timer
     */
    static timeEnd(label) {
        if (shouldLog('debug')) {
            console.timeEnd(label);
        }
    }
    
    /**
     * Set log level
     */
    static setLevel(level) {
        if (LOG_CONFIG.levels.hasOwnProperty(level)) {
            LOG_CONFIG.logLevel = level;
            Logger.info(`Log level set to: ${level}`);
        } else {
            Logger.warn(`Invalid log level: ${level}`);
        }
    }
    
    /**
     * Enable/disable logging
     */
    static setEnabled(enabled) {
        LOG_CONFIG.enabled = enabled;
    }
    
    /**
     * Get current configuration
     */
    static getConfig() {
        return { ...LOG_CONFIG };
    }
}

// Export for Node.js (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}

// Export for global scope (backward compatibility)
if (typeof window !== 'undefined') {
    // Use existing Logger if available, otherwise create new one
    if (!window.CoreLogger) {
        window.CoreLogger = Logger;
    }
    
    // Also provide as Logger if not already defined
    if (!window.Logger) {
        window.Logger = Logger;
    }
    
    // Quick access functions for convenience
    window.log = Logger.info;
    window.logError = Logger.error;
    window.logWarn = Logger.warn;
    window.logDebug = Logger.debug;
    window.logSuccess = Logger.success;
}

// For backward compatibility with existing debug.js
// If existing Logger is available, merge functionality
if (ExistingLogger && typeof ExistingLogger === 'object') {
    // Keep existing Logger methods if they exist
    Object.keys(ExistingLogger).forEach(key => {
        if (!Logger[key] && typeof ExistingLogger[key] === 'function') {
            Logger[key] = ExistingLogger[key];
        }
    });
}

// Note: ES6 export removed for browser compatibility
// Logger is available via window.Logger instead

