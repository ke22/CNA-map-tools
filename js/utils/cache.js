/**
 * DOM Element Cache Utility
 * Reduces redundant DOM queries for better performance
 */

const ElementCache = {
    cache: new Map(),
    
    /**
     * Get element by ID with caching
     * @param {string} id - Element ID
     * @param {boolean} forceRefresh - Force refresh cache
     * @returns {HTMLElement|null}
     */
    get: function(id, forceRefresh = false) {
        if (forceRefresh || !this.cache.has(id)) {
            const element = document.getElementById(id);
            if (element) {
                this.cache.set(id, element);
            } else {
                // Cache null to avoid repeated failed queries
                this.cache.set(id, null);
            }
        }
        
        return this.cache.get(id);
    },
    
    /**
     * Query selector with caching
     * @param {string} selector - CSS selector
     * @param {boolean} forceRefresh - Force refresh cache
     * @returns {NodeList|HTMLElement|null}
     */
    query: function(selector, forceRefresh = false) {
        if (forceRefresh || !this.cache.has(selector)) {
            const elements = document.querySelectorAll(selector);
            this.cache.set(selector, elements);
        }
        
        return this.cache.get(selector);
    },
    
    /**
     * Clear cache for specific element or all cache
     * @param {string|null} id - Element ID to clear, or null to clear all
     */
    clear: function(id = null) {
        if (id) {
            this.cache.delete(id);
        } else {
            this.cache.clear();
        }
    },
    
    /**
     * Invalidate cache when DOM changes
     * Call this after dynamically adding/removing elements
     */
    invalidate: function() {
        this.cache.clear();
    },
    
    /**
     * Get cache statistics
     */
    getStats: function() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
};

// Export to global scope
if (typeof window !== 'undefined') {
    window.ElementCache = ElementCache;
}





