/**
 * Marker Update Functions - Apple Style with Color Selection
 * This file contains functions for:
 * - Apple-style marker creation
 * - Click marker to change icon/color
 * - Color selection UI
 */

/**
 * Create Apple-style marker element
 */
function createAppleMarkerElement(color = '#007AFF', shape = 'pin', size = 40) {
    const el = document.createElement('div');
    el.className = 'apple-marker';
    el.dataset.color = color;
    el.dataset.shape = shape;
    
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.cursor = 'pointer';
    el.style.position = 'relative';
    el.style.transition = 'transform 0.2s';
    el.style.zIndex = '10';
    
    // Apple-style pin shape
    if (shape === 'pin') {
        el.style.background = `radial-gradient(circle at 50% 50%, ${color} 0%, ${color} 60%, ${adjustColorBrightness(color, -15)} 100%)`;
        el.style.borderRadius = '50% 50% 50% 0';
        el.style.transform = 'rotate(-45deg)';
        el.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)`;
        
        // Add inner highlight
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
        
        const inner = document.createElement('div');
        inner.style.position = 'absolute';
        inner.style.top = '25%';
        inner.style.left = '25%';
        inner.style.width = '50%';
        inner.style.height = '50%';
        inner.style.borderRadius = '50%';
        inner.style.background = 'rgba(255, 255, 255, 0.3)';
        el.appendChild(inner);
    }
    
    return el;
}

/**
 * Adjust color brightness
 */
function adjustColorBrightness(hex, percent) {
    const num = parseInt(hex.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

