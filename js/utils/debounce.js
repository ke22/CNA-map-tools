/**
 * Debounce and Throttle Utilities
 * Optimize frequent function calls
 */

/**
 * Debounce function - delays execution until after wait time
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately on first call
 * @returns {Function}
 */
function debounce(func, wait = 300, immediate = false) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(this, args);
        };
        
        const callNow = immediate && !timeout;
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        
        if (callNow) func.apply(this, args);
    };
}

/**
 * Throttle function - limits execution frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function}
 */
function throttle(func, limit = 300) {
    let inThrottle;
    
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Debounce manager - tracks multiple debounced functions
 */
const DebounceManager = {
    timers: new Map(),
    
    /**
     * Create a debounced function with ID
     * @param {string} id - Unique identifier
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function}
     */
    create: function(id, func, wait = 300) {
        return debounce(func, wait);
    },
    
    /**
     * Cancel a debounced function
     * @param {string} id - Function identifier
     */
    cancel: function(id) {
        // This would need to store the timeout reference
        // For now, just clear all if needed
    },
    
    /**
     * Clear all debounced functions
     */
    clearAll: function() {
        this.timers.clear();
    }
};

// Export to global scope
if (typeof window !== 'undefined') {
    window.debounce = debounce;
    window.throttle = throttle;
    window.DebounceManager = DebounceManager;
}

