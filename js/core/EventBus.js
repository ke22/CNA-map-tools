/**
 * EventBus - Centralized Event System
 * 
 * Provides a publish-subscribe pattern for decoupled module communication.
 * 
 * Usage:
 *   // Subscribe to events
 *   EventBus.on('map:clicked', (data) => { console.log(data); });
 *   
 *   // Publish events
 *   EventBus.emit('map:clicked', { x: 100, y: 200 });
 *   
 *   // Unsubscribe
 *   const handler = (data) => { console.log(data); };
 *   EventBus.on('map:clicked', handler);
 *   EventBus.off('map:clicked', handler);
 *   
 *   // One-time subscription
 *   EventBus.once('map:loaded', () => { console.log('Map loaded!'); });
 */

class EventBus {
    constructor() {
        this.events = new Map();
        this.onceHandlers = new WeakMap();
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - Event name (supports namespaces: 'module:action')
     * @param {Function} handler - Event handler function
     * @returns {Function} Unsubscribe function
     */
    on(eventName, handler) {
        if (typeof handler !== 'function') {
            Logger.warn(`EventBus.on: handler must be a function for event "${eventName}"`);
            return () => {};
        }

        if (!this.events.has(eventName)) {
            this.events.set(eventName, new Set());
        }

        this.events.get(eventName).add(handler);

        // Return unsubscribe function
        return () => {
            this.off(eventName, handler);
        };
    }

    /**
     * Unsubscribe from an event
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler function to remove
     */
    off(eventName, handler) {
        if (!this.events.has(eventName)) {
            return;
        }

        const handlers = this.events.get(eventName);
        handlers.delete(handler);

        // Clean up empty event sets
        if (handlers.size === 0) {
            this.events.delete(eventName);
        }
    }

    /**
     * Subscribe to an event once (auto-unsubscribe after first trigger)
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler function
     * @returns {Function} Unsubscribe function
     */
    once(eventName, handler) {
        const wrappedHandler = (...args) => {
            handler(...args);
            this.off(eventName, wrappedHandler);
        };

        // Track original handler for potential manual cleanup
        this.onceHandlers.set(wrappedHandler, handler);
        return this.on(eventName, wrappedHandler);
    }

    /**
     * Emit an event (publish)
     * @param {string} eventName - Event name
     * @param {*} data - Event data (optional)
     */
    emit(eventName, data = null) {
        if (!this.events.has(eventName)) {
            // Silently ignore events with no subscribers (normal behavior)
            return;
        }

        const handlers = this.events.get(eventName);
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                Logger.error(`EventBus: Error in handler for event "${eventName}"`, error);
            }
        });
    }

    /**
     * Check if an event has subscribers
     * @param {string} eventName - Event name
     * @returns {boolean}
     */
    hasListeners(eventName) {
        return this.events.has(eventName) && this.events.get(eventName).size > 0;
    }

    /**
     * Get count of listeners for an event
     * @param {string} eventName - Event name
     * @returns {number}
     */
    listenerCount(eventName) {
        if (!this.events.has(eventName)) {
            return 0;
        }
        return this.events.get(eventName).size;
    }

    /**
     * Remove all listeners for an event
     * @param {string} eventName - Event name (optional, if not provided removes all)
     */
    removeAllListeners(eventName = null) {
        if (eventName) {
            this.events.delete(eventName);
        } else {
            this.events.clear();
        }
    }

    /**
     * Get all registered event names
     * @returns {string[]}
     */
    getEventNames() {
        return Array.from(this.events.keys());
    }

    /**
     * Debug: Get event statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        const stats = {
            totalEvents: this.events.size,
            totalListeners: 0,
            events: {}
        };

        this.events.forEach((handlers, eventName) => {
            const count = handlers.size;
            stats.totalListeners += count;
            stats.events[eventName] = count;
        });

        return stats;
    }
}

// Export for Node.js (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventBus;
}

// Export for global scope
if (typeof window !== 'undefined') {
    // Create singleton instance
    window.EventBus = new EventBus();
    
    // Also provide class for advanced usage
    window.EventBusClass = EventBus;
}

