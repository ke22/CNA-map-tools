/**
 * Marker Icons Library
 * Provides various marker icon styles similar to Google Maps
 */

const MARKER_ICONS = {
    // Default red pin (Google Maps default)
    default: {
        name: 'Default',
        icon: 'location_on',
        color: '#E05C5A',
        style: 'pin'
    },
    
    // Basic colored pins
    red: {
        name: 'Red Pin',
        icon: 'place',
        color: '#DB4437',
        style: 'pin'
    },
    blue: {
        name: 'Blue Pin',
        icon: 'place',
        color: '#4285F4',
        style: 'pin'
    },
    green: {
        name: 'Green Pin',
        icon: 'place',
        color: '#0F9D58',
        style: 'pin'
    },
    yellow: {
        name: 'Yellow Pin',
        icon: 'place',
        color: '#F4B400',
        style: 'pin'
    },
    purple: {
        name: 'Purple Pin',
        icon: 'place',
        color: '#9C27B0',
        style: 'pin'
    },
    orange: {
        name: 'Orange Pin',
        icon: 'place',
        color: '#FF9800',
        style: 'pin'
    },
    
    // Category-based icons
    restaurant: {
        name: 'Restaurant',
        icon: 'restaurant',
        color: '#E05C5A',
        style: 'circle'
    },
    hotel: {
        name: 'Hotel',
        icon: 'hotel',
        color: '#4285F4',
        style: 'circle'
    },
    shopping: {
        name: 'Shopping',
        icon: 'shopping_cart',
        color: '#0F9D58',
        style: 'circle'
    },
    school: {
        name: 'School',
        icon: 'school',
        color: '#9C27B0',
        style: 'circle'
    },
    hospital: {
        name: 'Hospital',
        icon: 'local_hospital',
        color: '#E53935',
        style: 'circle'
    },
    airport: {
        name: 'Airport',
        icon: 'flight',
        color: '#607D8B',
        style: 'circle'
    },
    park: {
        name: 'Park',
        icon: 'park',
        color: '#4CAF50',
        style: 'circle'
    },
    museum: {
        name: 'Museum',
        icon: 'museum',
        color: '#FF5722',
        style: 'circle'
    },
    business: {
        name: 'Business',
        icon: 'business',
        color: '#2196F3',
        style: 'circle'
    },
    home: {
        name: 'Home',
        icon: 'home',
        color: '#FF9800',
        style: 'circle'
    },
    star: {
        name: 'Star',
        icon: 'star',
        color: '#FFC107',
        style: 'star'
    },
    flag: {
        name: 'Flag',
        icon: 'flag',
        color: '#E05C5A',
        style: 'flag'
    },
    warning: {
        name: 'Warning',
        icon: 'warning',
        color: '#FF5722',
        style: 'triangle'
    },
    info: {
        name: 'Info',
        icon: 'info',
        color: '#2196F3',
        style: 'circle'
    }
};

/**
 * Get marker icon configuration
 */
function getMarkerIcon(iconKey) {
    return MARKER_ICONS[iconKey] || MARKER_ICONS.default;
}

/**
 * Create marker HTML element with icon
 */
function createMarkerElement(iconConfig) {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    
    const size = 40;
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.cursor = 'pointer';
    el.style.position = 'relative';
    
    // Create icon element
    const iconEl = document.createElement('span');
    iconEl.className = 'material-icons';
    iconEl.textContent = iconConfig.icon;
    iconEl.style.color = iconConfig.color;
    iconEl.style.fontSize = '24px';
    iconEl.style.zIndex = '2';
    
    // Style based on marker style type
    switch (iconConfig.style) {
        case 'pin':
            // Pin style with shadow
            el.style.background = `radial-gradient(circle, ${iconConfig.color} 0%, ${iconConfig.color} 70%, transparent 70%)`;
            el.style.borderRadius = '50% 50% 50% 0';
            el.style.transform = 'rotate(-45deg)';
            iconEl.style.transform = 'rotate(45deg)';
            el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            break;
            
        case 'circle':
            // Circle with white background
            el.style.backgroundColor = '#ffffff';
            el.style.borderRadius = '50%';
            el.style.border = `3px solid ${iconConfig.color}`;
            el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            break;
            
        case 'star':
            // Star shape
            el.style.backgroundColor = iconConfig.color;
            el.style.borderRadius = '50%';
            el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            iconEl.style.color = '#ffffff';
            break;
            
        case 'flag':
            // Flag style
            el.style.backgroundColor = iconConfig.color;
            el.style.clipPath = 'polygon(0 0, 100% 0, 100% 70%, 50% 85%, 0 70%)';
            el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            iconEl.style.color = '#ffffff';
            iconEl.style.fontSize = '20px';
            break;
            
        case 'triangle':
            // Triangle warning style
            el.style.width = '0';
            el.style.height = '0';
            el.style.borderLeft = `${size/2}px solid transparent`;
            el.style.borderRight = `${size/2}px solid transparent`;
            el.style.borderBottom = `${size}px solid ${iconConfig.color}`;
            el.style.backgroundColor = 'transparent';
            iconEl.style.position = 'absolute';
            iconEl.style.top = '8px';
            iconEl.style.color = '#ffffff';
            iconEl.style.fontSize = '16px';
            break;
            
        default:
            // Default circle
            el.style.backgroundColor = iconConfig.color;
            el.style.borderRadius = '50%';
            el.style.border = '3px solid white';
            el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            iconEl.style.color = '#ffffff';
    }
    
    el.appendChild(iconEl);
    
    return el;
}

/**
 * Get all available marker icons
 */
function getAllMarkerIcons() {
    return Object.keys(MARKER_ICONS).map(key => ({
        key: key,
        ...MARKER_ICONS[key]
    }));
}

/**
 * Get icons by category
 */
function getIconsByCategory() {
    return {
        'Colors': ['default', 'red', 'blue', 'green', 'yellow', 'purple', 'orange'],
        'Places': ['restaurant', 'hotel', 'shopping', 'park', 'museum'],
        'Services': ['school', 'hospital', 'airport', 'business'],
        'Special': ['home', 'star', 'flag', 'warning', 'info']
    };
}

// Export to global scope
if (typeof window !== 'undefined') {
    window.MARKER_ICONS = MARKER_ICONS;
    window.getMarkerIcon = getMarkerIcon;
    window.createMarkerElement = createMarkerElement;
    window.getAllMarkerIcons = getAllMarkerIcons;
    window.getIconsByCategory = getIconsByCategory;
}





