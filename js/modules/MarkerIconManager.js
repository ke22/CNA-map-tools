/**
 * MarkerIconManager - Centralized Marker Icon Management
 * 
 * Provides unified interface for creating and managing map marker icons.
 * This module extracts marker icon functionality from app-enhanced.js.
 * 
 * Usage:
 *   const icon = MarkerIconManager.getIcon('default', '#FF0000');
 *   const iconUrl = MarkerIconManager.getIconUrl('default', '#FF0000');
 *   MarkerIconManager.preloadIcons(['default', 'location'], '#FF0000');
 */

class MarkerIconManager {
    constructor() {
        this.iconCache = new Map(); // Cache for generated icon URLs
        this.defaultColor = '#6CA7A1'; // Default marker color
        this.iconSize = 40; // Default icon size
    }

    /**
     * Generate icon SVG data URL
     * @param {string} type - Icon type ('default', 'location', 'custom')
     * @param {string} color - Marker color (hex format)
     * @param {number} size - Icon size in pixels
     * @returns {string} Data URL for the icon
     */
    generateIconSVG(type = 'default', color = this.defaultColor, size = this.iconSize) {
        const cacheKey = `${type}-${color}-${size}`;
        
        // Check cache first
        if (this.iconCache.has(cacheKey)) {
            return this.iconCache.get(cacheKey);
        }

        let svg = '';

        switch (type) {
            case 'default':
                svg = this._generateDefaultIcon(color, size);
                break;
            case 'location':
                svg = this._generateLocationIcon(color, size);
                break;
            case 'pin':
                svg = this._generatePinIcon(color, size);
                break;
            default:
                if (typeof Logger !== 'undefined' && Logger.warn) {
                    Logger.warn(`MarkerIconManager: Unknown icon type "${type}", using default`);
                } else {
                    console.warn(`MarkerIconManager: Unknown icon type "${type}", using default`);
                }
                svg = this._generateDefaultIcon(color, size);
        }

        const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
        
        // Cache the result
        this.iconCache.set(cacheKey, dataUrl);
        
        return dataUrl;
    }

    /**
     * Get icon URL (alias for generateIconSVG for consistency)
     * @param {string} type - Icon type
     * @param {string} color - Marker color
     * @param {number} size - Icon size
     * @returns {string} Data URL for the icon
     */
    getIconUrl(type = 'default', color = this.defaultColor, size = this.iconSize) {
        return this.generateIconSVG(type, color, size);
    }

    /**
     * Get icon object for Mapbox (with size properties)
     * @param {string} type - Icon type
     * @param {string} color - Marker color
     * @param {number} size - Icon size
     * @returns {Object} Icon object with url, width, height
     */
    getIcon(type = 'default', color = this.defaultColor, size = this.iconSize) {
        return {
            url: this.generateIconSVG(type, color, size),
            width: size,
            height: size
        };
    }

    /**
     * Preload icons (generate and cache them)
     * @param {string[]} types - Array of icon types to preload
     * @param {string} color - Marker color
     * @param {number} size - Icon size
     */
    preloadIcons(types = ['default'], color = this.defaultColor, size = this.iconSize) {
        types.forEach(type => {
            this.generateIconSVG(type, color, size);
        });
        if (typeof Logger !== 'undefined' && Logger.info) {
            Logger.info(`MarkerIconManager: Preloaded ${types.length} icon(s)`);
        }
    }

    /**
     * Clear icon cache
     */
    clearCache() {
        const cacheSize = this.iconCache.size;
        this.iconCache.clear();
        if (typeof Logger !== 'undefined' && Logger.info) {
            Logger.info(`MarkerIconManager: Cleared cache (${cacheSize} icons)`);
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            cacheSize: this.iconCache.size,
            cachedIcons: Array.from(this.iconCache.keys())
        };
    }

    /**
     * Generate default marker icon SVG
     * @private
     */
    _generateDefaultIcon(color, size) {
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size * 0.4;

        return `
            <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                <circle cx="${centerX}" cy="${centerY}" r="${radius}" 
                        fill="${color}" 
                        stroke="white" 
                        stroke-width="${size * 0.05}"/>
                <circle cx="${centerX}" cy="${centerY}" r="${radius * 0.4}" 
                        fill="white" 
                        opacity="0.9"/>
            </svg>
        `.trim();
    }

    /**
     * Generate location pin icon SVG
     * @private
     */
    _generateLocationIcon(color, size) {
        const centerX = size / 2;
        const pinHeight = size * 0.8;
        const pinWidth = size * 0.6;
        const topY = size * 0.2;
        const bottomY = topY + pinHeight;

        return `
            <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                <path d="M ${centerX} ${topY} 
                        L ${centerX - pinWidth / 2} ${topY + pinHeight * 0.6}
                        L ${centerX} ${bottomY}
                        L ${centerX + pinWidth / 2} ${topY + pinHeight * 0.6} Z"
                      fill="${color}" 
                      stroke="white" 
                      stroke-width="${size * 0.05}"/>
                <circle cx="${centerX}" cy="${topY + pinHeight * 0.4}" r="${size * 0.15}" 
                        fill="white" 
                        opacity="0.9"/>
            </svg>
        `.trim();
    }

    /**
     * Generate pin icon SVG (alternative style)
     * @private
     */
    _generatePinIcon(color, size) {
        const centerX = size / 2;
        const pinHeight = size * 0.85;
        const pinWidth = size * 0.55;
        const topY = size * 0.15;
        const bottomY = topY + pinHeight;

        return `
            <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                <path d="M ${centerX} ${topY} 
                        Q ${centerX - pinWidth / 2} ${topY + pinHeight * 0.3} ${centerX - pinWidth / 2} ${topY + pinHeight * 0.6}
                        L ${centerX} ${bottomY}
                        L ${centerX + pinWidth / 2} ${topY + pinHeight * 0.6}
                        Q ${centerX + pinWidth / 2} ${topY + pinHeight * 0.3} ${centerX} ${topY} Z"
                      fill="${color}" 
                      stroke="white" 
                      stroke-width="${size * 0.04}"/>
                <circle cx="${centerX}" cy="${topY + pinHeight * 0.35}" r="${size * 0.12}" 
                        fill="white" 
                        opacity="0.95"/>
            </svg>
        `.trim();
    }

    /**
     * Set default color
     * @param {string} color - Default color (hex format)
     */
    setDefaultColor(color) {
        this.defaultColor = color;
        if (typeof Logger !== 'undefined' && Logger.info) {
            Logger.info(`MarkerIconManager: Default color set to ${color}`);
        }
    }

    /**
     * Set default icon size
     * @param {number} size - Default size in pixels
     */
    setDefaultSize(size) {
        this.iconSize = size;
        if (typeof Logger !== 'undefined' && Logger.info) {
            Logger.info(`MarkerIconManager: Default size set to ${size}px`);
        }
    }
}

// Export for Node.js (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkerIconManager;
}

// Export for global scope
if (typeof window !== 'undefined') {
    // Create singleton instance
    window.MarkerIconManager = new MarkerIconManager();
    
    // Also provide class for advanced usage
    window.MarkerIconManagerClass = MarkerIconManager;
}

