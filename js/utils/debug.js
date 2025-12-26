/**
 * Debug Utility Module
 * Centralized logging and performance monitoring
 */

const DEBUG_CONFIG = {
    // Enable/disable debug mode
    // Set to false for production to reduce console output
    enabled: true,
    
    // Log levels: 'none' | 'error' | 'warn' | 'info' | 'debug' | 'all'
    logLevel: 'info',
    
    // Performance monitoring
    performance: {
        enabled: true,
        logSlowOperations: true,
        slowOperationThreshold: 100 // milliseconds
    },
    
    // Console log colors (for better readability)
    colors: {
        error: '#f44336',
        warn: '#ff9800',
        info: '#2196f3',
        debug: '#9e9e9e',
        success: '#4caf50'
    }
};

// Log level priority
const LOG_LEVELS = {
    none: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    all: 5
};

/**
 * Check if logging should occur for given level
 */
function shouldLog(level) {
    if (!DEBUG_CONFIG.enabled) return false;
    return LOG_LEVELS[level] <= LOG_LEVELS[DEBUG_CONFIG.logLevel];
}

/**
 * Format log message with emoji and color
 */
function formatMessage(level, message, data = null) {
    const emoji = {
        error: '❌',
        warn: '⚠️',
        info: 'ℹ️',
        debug: '🔍',
        success: '✅'
    };
    
    const prefix = emoji[level] || '📌';
    const formattedMessage = `${prefix} ${message}`;
    
    if (data !== null) {
        return [formattedMessage, data];
    }
    return formattedMessage;
}

/**
 * Logger object with different log levels
 */
const Logger = {
    error: function(message, data = null) {
        if (shouldLog('error')) {
            const formatted = formatMessage('error', message, data);
            if (data !== null) {
                console.error(...formatted);
            } else {
                console.error(formatted);
            }
        }
    },
    
    warn: function(message, data = null) {
        if (shouldLog('warn')) {
            const formatted = formatMessage('warn', message, data);
            if (data !== null) {
                console.warn(...formatted);
            } else {
                console.warn(formatted);
            }
        }
    },
    
    info: function(message, data = null) {
        if (shouldLog('info')) {
            const formatted = formatMessage('info', message, data);
            if (data !== null) {
                console.log(...formatted);
            } else {
                console.log(formatted);
            }
        }
    },
    
    debug: function(message, data = null) {
        if (shouldLog('debug')) {
            const formatted = formatMessage('debug', message, data);
            if (data !== null) {
                console.log(...formatted);
            } else {
                console.log(formatted);
            }
        }
    },
    
    success: function(message, data = null) {
        if (shouldLog('info')) {
            const formatted = formatMessage('success', message, data);
            if (data !== null) {
                console.log(...formatted);
            } else {
                console.log(formatted);
            }
        }
    },
    
    // Group related logs
    group: function(label) {
        if (shouldLog('debug')) {
            console.group(label);
        }
    },
    
    groupEnd: function() {
        if (shouldLog('debug')) {
            console.groupEnd();
        }
    },
    
    // Performance timing
    time: function(label) {
        if (DEBUG_CONFIG.performance.enabled && shouldLog('debug')) {
            console.time(label);
        }
    },
    
    timeEnd: function(label) {
        if (DEBUG_CONFIG.performance.enabled && shouldLog('debug')) {
            console.timeEnd(label);
        }
    }
};

/**
 * Performance monitoring
 */
const PerformanceMonitor = {
    timers: new Map(),
    measurements: [],
    
    start: function(operation) {
        if (!DEBUG_CONFIG.performance.enabled) return;
        
        const startTime = performance.now();
        this.timers.set(operation, startTime);
        
        Logger.debug(`⏱️ Started: ${operation}`);
    },
    
    end: function(operation) {
        if (!DEBUG_CONFIG.performance.enabled) return null;
        
        const startTime = this.timers.get(operation);
        if (!startTime) return null;
        
        const duration = performance.now() - startTime;
        this.timers.delete(operation);
        
        const measurement = {
            operation,
            duration: duration.toFixed(2),
            timestamp: new Date().toISOString()
        };
        
        this.measurements.push(measurement);
        
        // Log slow operations
        if (DEBUG_CONFIG.performance.logSlowOperations && 
            duration > DEBUG_CONFIG.performance.slowOperationThreshold) {
            Logger.warn(`🐌 Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
        } else {
            Logger.debug(`⏱️ Completed: ${operation} (${duration.toFixed(2)}ms)`);
        }
        
        return duration;
    },
    
    getReport: function() {
        if (this.measurements.length === 0) {
            return 'No performance measurements recorded.';
        }
        
        const report = {
            total: this.measurements.length,
            average: 0,
            slowest: null,
            fastest: null,
            operations: {}
        };
        
        let totalDuration = 0;
        let slowest = { duration: 0 };
        let fastest = { duration: Infinity };
        
        this.measurements.forEach(m => {
            const duration = parseFloat(m.duration);
            totalDuration += duration;
            
            if (duration > slowest.duration) {
                slowest = m;
            }
            if (duration < fastest.duration) {
                fastest = m;
            }
            
            if (!report.operations[m.operation]) {
                report.operations[m.operation] = {
                    count: 0,
                    totalDuration: 0,
                    average: 0
                };
            }
            
            report.operations[m.operation].count++;
            report.operations[m.operation].totalDuration += duration;
        });
        
        report.average = (totalDuration / this.measurements.length).toFixed(2);
        report.slowest = slowest;
        report.fastest = fastest;
        
        // Calculate averages per operation
        Object.keys(report.operations).forEach(op => {
            const stats = report.operations[op];
            stats.average = (stats.totalDuration / stats.count).toFixed(2);
        });
        
        return report;
    },
    
    clear: function() {
        this.timers.clear();
        this.measurements = [];
    }
};

/**
 * Memory usage monitoring
 */
const MemoryMonitor = {
    check: function() {
        if (typeof performance !== 'undefined' && performance.memory) {
            const memory = performance.memory;
            return {
                used: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
                total: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
                limit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
            };
        }
        return null;
    },
    
    log: function() {
        const memory = this.check();
        if (memory) {
            Logger.info(`💾 Memory: ${memory.used} / ${memory.total} (limit: ${memory.limit})`);
        }
    }
};

// Export to global scope for easy access
if (typeof window !== 'undefined') {
    window.Logger = Logger;
    window.PerformanceMonitor = PerformanceMonitor;
    window.MemoryMonitor = MemoryMonitor;
    window.DEBUG_CONFIG = DEBUG_CONFIG;
    
    // Quick access functions
    window.log = Logger.info;
    window.logError = Logger.error;
    window.logWarn = Logger.warn;
    window.logDebug = Logger.debug;
}





