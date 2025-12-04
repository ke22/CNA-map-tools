/**
 * Apple-Style Marker Icons Library
 * Clean, modern icons with customizable colors
 */

// Apple-style color palette
const APPLE_COLORS = {
    red: '#FF3B30',
    orange: '#FF9500',
    yellow: '#FFCC00',
    green: '#34C759',
    teal: '#5AC8FA',
    blue: '#007AFF',
    indigo: '#5856D6',
    purple: '#AF52DE',
    pink: '#FF2D55',
    gray: '#8E8E93'
};

// Apple-style icon shapes
const APPLE_ICON_SHAPES = {
    pin: 'pin',           // Pin shape (default)
    circle: 'circle',     // Circle
    square: 'square',     // Square
    star: 'star'          // Star
};

/**
 * Create Apple-style marker element
 */
function createAppleMarker(color = '#007AFF', shape = 'pin', size = 24) {
    const el = document.createElement('div');
    el.className = 'apple-marker';
    
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.cursor = 'pointer';
    el.style.position = 'relative';
    el.style.transition = 'transform 0.15s ease-out';
    el.style.boxSizing = 'border-box';
    // Ensure marker doesn't interfere with Mapbox positioning
    el.style.margin = '0';
    el.style.padding = '0';
    el.style.display = 'block';
    // Ensure marker stays locked to coordinates (no position interference)
    el.style.left = '0';
    el.style.top = '0';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    
    // Apple-style pin shape
    if (shape === 'pin') {
        // Create pin using CSS
        el.style.background = `radial-gradient(circle at 50% 50%, ${color} 0%, ${color} 60%, ${darkenColor(color, 20)} 100%)`;
        el.style.borderRadius = '50% 50% 50% 0';
        el.style.transform = 'rotate(-45deg)';
        el.style.transformOrigin = 'center center';
        el.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)`;
        
        // Add inner circle for depth
        const inner = document.createElement('div');
        inner.style.position = 'absolute';
        inner.style.top = '25%';
        inner.style.left = '25%';
        inner.style.width = '50%';
        inner.style.height = '50%';
        inner.style.borderRadius = '50%';
        inner.style.background = 'rgba(255, 255, 255, 0.3)';
        el.appendChild(inner);
        
        // White center dot
        const dot = document.createElement('div');
        dot.style.position = 'absolute';
        dot.style.top = '35%';
        dot.style.left = '35%';
        dot.style.width = '30%';
        dot.style.height = '30%';
        dot.style.borderRadius = '50%';
        dot.style.background = 'white';
        el.appendChild(dot);
    } else if (shape === 'circle') {
        el.style.background = color;
        el.style.borderRadius = '50%';
        el.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.15)`;
        
        // White inner circle
        const inner = document.createElement('div');
        inner.style.position = 'absolute';
        inner.style.top = '25%';
        inner.style.left = '25%';
        inner.style.width = '50%';
        inner.style.height = '50%';
        inner.style.borderRadius = '50%';
        inner.style.background = 'rgba(255, 255, 255, 0.3)';
        el.appendChild(inner);
    } else if (shape === 'square') {
        el.style.background = color;
        el.style.borderRadius = '8px';
        el.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.15)`;
        
        // White inner square
        const inner = document.createElement('div');
        inner.style.position = 'absolute';
        inner.style.top = '20%';
        inner.style.left = '20%';
        inner.style.width = '60%';
        inner.style.height = '60%';
        inner.style.borderRadius = '4px';
        inner.style.background = 'rgba(255, 255, 255, 0.3)';
        el.appendChild(inner);
    } else if (shape === 'star') {
        // Star shape using CSS
        el.style.background = color;
        el.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
        el.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.15)`;
    }
    
    // Hover effect - preserve transform origin and current scale
    el.addEventListener('mouseenter', function() {
        const currentScale = parseFloat(this.dataset.currentScale) || 1;
        const hoverScale = currentScale * 1.1; // Scale up 10% on hover
        
        if (shape === 'pin') {
            this.style.transform = `rotate(-45deg) scale(${hoverScale})`;
            this.style.transformOrigin = 'center center';
        } else {
            this.style.transform = `scale(${hoverScale})`;
            this.style.transformOrigin = 'center center';
        }
    });
    
    el.addEventListener('mouseleave', function() {
        const currentScale = parseFloat(this.dataset.currentScale) || 1;
        
        if (shape === 'pin') {
            this.style.transform = `rotate(-45deg) scale(${currentScale})`;
            this.style.transformOrigin = 'center center';
        } else {
            this.style.transform = `scale(${currentScale})`;
            this.style.transformOrigin = 'center center';
        }
    });
    
    // Store shape info for anchor calculation
    el.dataset.markerShape = shape;
    
    return el;
}

/**
 * Get anchor point for marker based on shape
 * @param {string} shape - Marker shape
 * @returns {string} - Mapbox anchor point ('bottom', 'center', etc.)
 */
function getMarkerAnchor(shape) {
    switch(shape) {
        case 'pin':
            // Pin shape is rotated -45deg, creating a diamond shape
            // After rotation, the tip (point) is at the bottom of the element
            // We want the tip to point to the exact coordinate
            // Using 'bottom' anchor ensures the bottom center of the element aligns with coordinates
            // This works correctly even with rotation because anchor is calculated before transform
            return 'bottom';
        case 'circle':
        case 'square':
        case 'star':
        default:
            return 'center'; // Other shapes centered
    }
}

/**
 * Darken color for shadow effects
 */
function darkenColor(color, percent) {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// Export
if (typeof window !== 'undefined') {
    window.APPLE_COLORS = APPLE_COLORS;
    window.APPLE_ICON_SHAPES = APPLE_ICON_SHAPES;
    window.createAppleMarker = createAppleMarker;
    window.getMarkerAnchor = getMarkerAnchor;
}

