/**
 * StateManager - Centralized Application State Management
 * 
 * Provides reactive state management with change notifications.
 * 
 * Usage:
 *   // Initialize state
 *   StateManager.init({ count: 0, user: null });
 *   
 *   // Update state
 *   StateManager.set('count', 10);
 *   StateManager.update({ count: 20, user: { name: 'John' } });
 *   
 *   // Subscribe to state changes
 *   StateManager.subscribe('count', (newValue, oldValue) => {
 *     console.log(`Count changed: ${oldValue} -> ${newValue}`);
 *   });
 *   
 *   // Get state
 *   const count = StateManager.get('count');
 *   const allState = StateManager.getAll();
 */

class StateManager {
    constructor() {
        this.state = {};
        this.listeners = new Map(); // Map<key, Set<listener>>
        this.globalListeners = new Set(); // Listeners for all state changes
        this.isInitialized = false;
    }

    /**
     * Initialize state (can only be called once)
     * @param {Object} initialState - Initial state object
     * @param {boolean} overwrite - If true, allow re-initialization (default: false)
     */
    init(initialState = {}, overwrite = false) {
        if (this.isInitialized && !overwrite) {
            Logger.warn('StateManager: Already initialized. Use update() to modify state.');
            return;
        }

        if (typeof initialState !== 'object' || initialState === null) {
            Logger.error('StateManager.init: initialState must be an object');
            return;
        }

        // Store old state for listeners
        const oldState = { ...this.state };

        // Deep clone initial state
        this.state = this._deepClone(initialState);
        this.isInitialized = true;

        // Notify global listeners
        this._notifyGlobalListeners(this.state, oldState);

        Logger.info('StateManager: Initialized', { keys: Object.keys(this.state) });
    }

    /**
     * Get state value by key
     * @param {string} key - State key (optional, returns all state if not provided)
     * @returns {*} State value or entire state object
     */
    get(key = null) {
        if (key === null) {
            return this._deepClone(this.state);
        }

        return this._deepClone(this.state[key]);
    }

    /**
     * Get all state (alias for get())
     * @returns {Object} Deep clone of entire state
     */
    getAll() {
        return this.get();
    }

    /**
     * Set a state value (reactive - triggers listeners)
     * @param {string} key - State key
     * @param {*} value - New value
     */
    set(key, value) {
        if (!this.isInitialized) {
            Logger.warn(`StateManager.set: Not initialized. Auto-initializing with key "${key}"`);
            this.init({});
        }

        const oldValue = this._deepClone(this.state[key]);
        this.state[key] = this._deepClone(value);

        // Notify key-specific listeners
        this._notifyListeners(key, this.state[key], oldValue);

        // Notify global listeners
        this._notifyGlobalListeners(this.state, { ...this.state, [key]: oldValue });
    }

    /**
     * Update multiple state values at once
     * @param {Object} updates - Object with key-value pairs to update
     */
    update(updates) {
        if (!this.isInitialized) {
            Logger.warn('StateManager.update: Not initialized. Auto-initializing.');
            this.init({});
        }

        if (typeof updates !== 'object' || updates === null) {
            Logger.error('StateManager.update: updates must be an object');
            return;
        }

        const oldState = this._deepClone(this.state);
        const changedKeys = [];

        Object.keys(updates).forEach(key => {
            const oldValue = this._deepClone(this.state[key]);
            this.state[key] = this._deepClone(updates[key]);
            changedKeys.push(key);

            // Notify key-specific listeners
            this._notifyListeners(key, this.state[key], oldValue);
        });

        // Notify global listeners
        this._notifyGlobalListeners(this.state, oldState);
    }

    /**
     * Subscribe to changes for a specific state key
     * @param {string} key - State key to watch (or '*' for all changes)
     * @param {Function} listener - Callback function (newValue, oldValue, key)
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, listener) {
        if (typeof listener !== 'function') {
            Logger.warn(`StateManager.subscribe: listener must be a function for key "${key}"`);
            return () => {};
        }

        if (key === '*') {
            // Global listener
            this.globalListeners.add(listener);
            return () => {
                this.globalListeners.delete(listener);
            };
        }

        // Key-specific listener
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }

        this.listeners.get(key).add(listener);

        // Return unsubscribe function
        return () => {
            this.unsubscribe(key, listener);
        };
    }

    /**
     * Unsubscribe from state changes
     * @param {string} key - State key (or '*' for global listener)
     * @param {Function} listener - Listener function to remove
     */
    unsubscribe(key, listener) {
        if (key === '*') {
            this.globalListeners.delete(listener);
            return;
        }

        if (!this.listeners.has(key)) {
            return;
        }

        const keyListeners = this.listeners.get(key);
        keyListeners.delete(listener);

        // Clean up empty listener sets
        if (keyListeners.size === 0) {
            this.listeners.delete(key);
        }
    }

    /**
     * Reset state to initial values (requires re-initialization)
     */
    reset() {
        this.state = {};
        this.listeners.clear();
        this.globalListeners.clear();
        this.isInitialized = false;
        Logger.info('StateManager: Reset');
    }

    /**
     * Check if state is initialized
     * @returns {boolean}
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Check if a key exists in state
     * @param {string} key - State key
     * @returns {boolean}
     */
    has(key) {
        return key in this.state;
    }

    /**
     * Delete a state key
     * @param {string} key - State key to delete
     */
    delete(key) {
        if (!(key in this.state)) {
            return;
        }

        const oldValue = this._deepClone(this.state[key]);
        delete this.state[key];

        // Notify listeners with undefined as new value
        this._notifyListeners(key, undefined, oldValue);

        // Clean up listeners for this key
        this.listeners.delete(key);
    }

    /**
     * Notify key-specific listeners
     * @private
     */
    _notifyListeners(key, newValue, oldValue) {
        if (!this.listeners.has(key)) {
            return;
        }

        const keyListeners = this.listeners.get(key);
        keyListeners.forEach(listener => {
            try {
                listener(newValue, oldValue, key);
            } catch (error) {
                Logger.error(`StateManager: Error in listener for key "${key}"`, error);
            }
        });
    }

    /**
     * Notify global listeners
     * @private
     */
    _notifyGlobalListeners(newState, oldState) {
        this.globalListeners.forEach(listener => {
            try {
                listener(newState, oldState);
            } catch (error) {
                Logger.error('StateManager: Error in global listener', error);
            }
        });
    }

    /**
     * Deep clone an object/array/value
     * @private
     */
    _deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof Array) {
            return obj.map(item => this._deepClone(item));
        }

        if (obj instanceof Object) {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this._deepClone(obj[key]);
            });
            return cloned;
        }

        return obj;
    }

    /**
     * Get state statistics (for debugging)
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            keyCount: Object.keys(this.state).length,
            listenerCount: Array.from(this.listeners.values()).reduce((sum, set) => sum + set.size, 0),
            globalListenerCount: this.globalListeners.size,
            keys: Object.keys(this.state)
        };
    }
}

// Export for Node.js (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}

// Export for global scope
if (typeof window !== 'undefined') {
    // Create singleton instance
    window.StateManager = new StateManager();
    
    // Also provide class for advanced usage
    window.StateManagerClass = StateManager;
}

