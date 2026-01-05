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

// Icon shapes using SVG files from icon folder
// Map shape keys to SVG file paths
// Includes all icons from the icon folder
const MATERIAL_ICON_SHAPES = {
    circle: { 
        svgPath: 'icon/circle_24dp_E3E3E3.svg', 
        name: 'Circle',
        viewBox: '0 0 24 24'
    },
    pin: { 
        svgPath: 'icon/location_pin_24dp_E3E3E3.svg', 
        name: 'Location Pin',
        viewBox: '0 0 24 24'
    },
    city: { 
        svgPath: 'icon/trip_origin_24dp_E3E3E3.svg', 
        name: 'City',
        viewBox: '0 0 24 24'
    },
    airport: { 
        svgPath: 'icon/airplanemode_active_24dp_E3E3E3.svg', 
        name: 'Airport',
        viewBox: '0 0 24 24'
    },
    port: { 
        svgPath: 'icon/waves_24dp_E3E3E3.svg', 
        name: 'Port',
        viewBox: '0 0 24 24'
    },
    anchor: { 
        svgPath: 'icon/anchor_24dp_E3E3E3.svg', 
        name: 'Anchor',
        viewBox: '0 0 24 24'
    },
    bolt: { 
        svgPath: 'icon/bolt_24dp_E3E3E3.svg', 
        name: 'Bolt',
        viewBox: '0 0 24 24'
    },
    error: { 
        svgPath: 'icon/error_24dp_E3E3E3.svg', 
        name: 'Error',
        viewBox: '0 0 24 24'
    },
    factory: { 
        svgPath: 'icon/factory_24dp_E3E3E3.svg', 
        name: 'Factory',
        viewBox: '0 0 24 24'
    },
    grade: { 
        svgPath: 'icon/grade_24dp_E3E3E3.svg', 
        name: 'Grade',
        viewBox: '0 0 24 24'
    },
    fire: { 
        svgPath: 'icon/local_fire_department_24dp_E3E3E3.svg', 
        name: 'Fire',
        viewBox: '0 0 24 24'
    },
    hospital: { 
        svgPath: 'icon/local_hospital_24dp_E3E3E3.svg', 
        name: 'Hospital',
        viewBox: '0 0 24 24'
    },
    square: { 
        svgPath: 'icon/square_24dp_E3E3E3.svg', 
        name: 'Square',
        viewBox: '0 0 24 24'
    }
};

/**
 * Create marker element with Material Icons support
 */
function createAppleMarker(color = '#007AFF', shape = 'pin', size = 24) {
    const el = document.createElement('div');
    el.className = 'apple-marker';
    
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.cursor = 'pointer';
    el.style.position = 'relative';
    /* Removed transition to prevent floating effects - markers should be completely fixed */
    el.style.boxSizing = 'border-box';
    // Ensure marker doesn't interfere with Mapbox positioning
    el.style.margin = '0';
    el.style.padding = '0';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    // Ensure marker stays locked to coordinates (no position interference)
    el.style.left = '0';
    el.style.top = '0';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    
    // Check if shape exists in MATERIAL_ICON_SHAPES (now uses SVG files)
    const iconShapes = (typeof MATERIAL_ICON_SHAPES !== 'undefined') ? MATERIAL_ICON_SHAPES : {};
    const shapeConfig = iconShapes[shape];
    
    if (shapeConfig && typeof shapeConfig === 'object' && shapeConfig.svgPath) {
        // Check if we have a cached SVG template
        if (!window._svgIconCache) {
            window._svgIconCache = {};
        }
        
        // Try to load from cache first
        const cacheKey = shapeConfig.svgPath;
        let svgTemplate = window._svgIconCache[cacheKey];
        
        if (svgTemplate) {
            // Use cached template
            createIconFromTemplate(el, svgTemplate, color, size);
        } else {
            // Load SVG and cache it
            const iconImg = document.createElement('img');
            iconImg.style.width = size + 'px';
            iconImg.style.height = size + 'px';
            iconImg.style.maxWidth = size + 'px';
            iconImg.style.maxHeight = size + 'px';
            iconImg.style.objectFit = 'contain';
            iconImg.style.display = 'block';
            iconImg.style.userSelect = 'none';
            iconImg.style.pointerEvents = 'none';
            iconImg.style.flexShrink = '0';
            
            // Try to load SVG
            fetch(shapeConfig.svgPath)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response.text();
                })
                .then(svgText => {
                    // Cache the template
                    window._svgIconCache[cacheKey] = svgText;
                    // Create icon from template
                    createIconFromTemplate(el, svgText, color, size);
                })
                .catch(err => {
                    // Only log in development mode
                    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                        console.warn('Failed to load SVG icon:', shapeConfig.svgPath, err.message);
                    }
                    // Fallback to CSS-based icon
                    createFallbackIcon(el, shape, color, size);
                });
            
            el.appendChild(iconImg);
        }
        
        return el;
    }
    
    // Helper function to create icon from SVG template
    function createIconFromTemplate(container, svgTemplate, color, size) {
        // Replace fill color in SVG (#e3e3e3 or #E3E3E3 -> user color)
        let svgString = svgTemplate.replace(/fill="#e3e3e3"/gi, `fill="${color}"`);
        svgString = svgString.replace(/#e3e3e3/gi, color);
        
        // Create inline SVG element instead of img with blob URL
        const svgEl = document.createElement('div');
        svgEl.innerHTML = svgString;
        const svg = svgEl.querySelector('svg');
        if (svg) {
            svg.style.width = size + 'px';
            svg.style.height = size + 'px';
            svg.style.display = 'block';
            svg.style.pointerEvents = 'none';
        }
        container.innerHTML = '';
        container.appendChild(svgEl.firstChild);
    }
    
    // Helper function to create fallback icon using CSS
    function createFallbackIcon(container, shape, color, size) {
        container.innerHTML = '';
        if (shape === 'pin') {
            container.style.background = `radial-gradient(circle at 50% 50%, ${color} 0%, ${color} 60%, ${darkenColor(color, 20)} 100%)`;
            container.style.borderRadius = '50% 50% 50% 0';
            container.style.transform = 'rotate(-45deg)';
        } else if (shape === 'circle') {
            container.style.background = color;
            container.style.borderRadius = '50%';
        } else if (shape === 'square') {
            container.style.background = color;
            container.style.borderRadius = '4px';
        } else {
            // Default circle
            container.style.background = color;
            container.style.borderRadius = '50%';
        }
        container.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    }
    
    // Legacy Apple-style pin shape (fallback)
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
    
    // REMOVED: Hover effect with transform: scale() causes position drift
    // Markers should remain fixed at coordinates - no hover scaling effects
    // If hover effects are needed in future, use width/height changes instead of transform: scale()
    
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
    // Check if shape exists in MATERIAL_ICON_SHAPES
    const materialIcon = MATERIAL_ICON_SHAPES[shape];
    if (materialIcon) {
        return 'center'; // Material icons are typically centered
    }
    
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
    window.MATERIAL_ICON_SHAPES = MATERIAL_ICON_SHAPES;
    window.createAppleMarker = createAppleMarker;
    window.getMarkerAnchor = getMarkerAnchor;
}

