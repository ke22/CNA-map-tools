/**
 * Map Download Tool - Configuration File
 * 
 * This file contains all configuration settings for the map tool.
 * Update these values according to your needs.
 * 
 * IMPORTANT: Never commit this file with real tokens to public repositories!
 */

const CONFIG = {
  /**
   * Mapbox Configuration
   * Get your access token from: https://account.mapbox.com/
   */
  MAPBOX: {
    // Your Mapbox public access token
    // Can be set via environment variable MAPBOX_TOKEN in .env file
    // Falls back to hardcoded token if not set
    TOKEN: (typeof window !== 'undefined' && window.MAPBOX_TOKEN) || 'pk.eyJ1IjoiY25hZ3JhcGhpY2Rlc2lnbiIsImEiOiJjbHRxbXlnc28wODF6Mmltb2Rjb3g5a25kIn0.x73wo3gKurL6CivFUOjVeg',
    
    // Mapbox style URL
    // Options:
    // - 'mapbox://styles/mapbox/light-v11' (light theme)
    // - 'mapbox://styles/mapbox/dark-v11' (dark theme)
    // - 'mapbox://styles/mapbox/streets-v12' (streets)
    // - 'mapbox://styles/mapbox/satellite-v9' (satellite)
    STYLE: 'mapbox://styles/mapbox/light-v11',
    
    // Map type specific styles (from old tool)
    // If custom styles don't work, fallback to default styles below
    STYLES: {
      country: 'mapbox://styles/cnagraphicdesign/clts2b1mr018801r5flymg36h',
      state: 'mapbox://styles/cnagraphicdesign/cltqna92j01ig01pt1kvfexby',
      county: 'mapbox://styles/cnagraphicdesign/cltqnf7vy01gw01ra4t5xewq0',
      world: 'mapbox://styles/cnagraphicdesign/clts2b1mr018801r5flymg36h', // Same as country
    },
    
    // Fallback styles if custom styles are not accessible
    FALLBACK_STYLES: {
      country: 'mapbox://styles/mapbox/light-v11',
      state: 'mapbox://styles/mapbox/light-v11',
      county: 'mapbox://styles/mapbox/light-v11',
      world: 'mapbox://styles/mapbox/light-v11',
    },
    
    // Vector tile source for country boundaries
    // This automatically uses the latest data from Mapbox servers
    // No need to update - Mapbox maintains the latest boundaries
    VECTOR_TILE_SOURCE: 'mapbox://mapbox.country-boundaries-v1',
    
    // Auto-refresh boundaries on map load (optional)
    // Set to true to always fetch latest data on page load
    AUTO_REFRESH_BOUNDARIES: false,
    
    // Worldview filter for disputed territories
    // This includes 'all' plus specific worldview groups
    // Note: Ukraine (UKR) might not be in 'all' worldview due to recent Mapbox data changes
    // If Ukraine or other countries can't be colored, try disabling worldview filter below
    WORLDVIEW_FILTER: [
      'all', 'JP', 'AR,JP,MA,RU,TR,US', 'US',
      'AR,IN,JP,MA,RU,TR,US', 'AR,CN,IN,JP,MA,TR,US',
      'AR,CN,JP,MA,RU,TR,US', 'AR,CN,IN,JP,RU,TR,US',
      'CN,JP', 'CN,IN,JP,MA,RU,TR,US',
      'AR,IN,JP,MA,RS,RU,TR,US', 'IN',
      // Try adding these if Ukraine still doesn't work:
      'EU', 'GB'  // European and UK worldviews
    ],
    
    // Option to disable worldview filter (set to false to allow all countries)
    // If set to false, all countries will be colorable regardless of worldview
    // 
    // ⚠️ IMPORTANT: If Ukraine (UKR) or other countries can't be colored,
    // set this to false:
    USE_WORLDVIEW_FILTER: false,  // Set to false to fix Ukraine coloring issue
    
    // Note: If UK/Ukraine still can't be colored, disable worldview filter above
  },

  /**
   * Default Map Settings
   */
  MAP: {
    // Default map center [longitude, latitude]
    // Default: Taiwan center
    DEFAULT_CENTER: [121.5654, 25.0330],
    
    // Default zoom level (0-22)
    // 0 = World view, 22 = Street level
    DEFAULT_ZOOM: 7,
    
    // Minimum zoom level
    MIN_ZOOM: 2,
    
    // Maximum zoom level
    MAX_ZOOM: 18,
    
    // Map container element ID
    CONTAINER_ID: 'map',
  },

  /**
   * Map Types Configuration
   */
  MAP_TYPES: {
    // Map type identifiers
    COUNTRY: 'country',      // Country boundaries
    STATE: 'state',          // State/province boundaries
    COUNTY: 'county',        // County/city boundaries
    WORLD: 'world',          // World map view
    
    // Default map type
    DEFAULT: 'county',
    
    // Map type display names
    NAMES: {
      country: '國界版',        // Country Boundary Version
      state: '省州界版',        // State Boundary Version
      county: '縣市界版',       // County Boundary Version
      world: '小地圖用',        // For Small Maps
    },
    
    // Boundary data file paths
    // These files should be in data/boundaries/
    DATA_PATHS: {
      country: 'data/boundaries/countries.geojson',
      state: 'data/boundaries/states.geojson',
      county: 'data/boundaries/counties.geojson',
      world: 'data/boundaries/world.geojson',
    },
  },

  /**
   * Color Palette
   * Available colors for territory marking
   * Default palette: The Economist style
   */
  COLORS: {
    // Color definitions - The Economist palette
    TROPICAL_TEAL: {
      name: 'Tropical Teal',
      value: '#6CA7A1',
      rgb: [108, 167, 161],
    },
    RICH_CERULEAN: {
      name: 'Rich Cerulean',
      value: '#496F96',
      rgb: [73, 111, 150],
    },
    LOBSTER_PINK: {
      name: 'Lobster Pink',
      value: '#E05C5A',
      rgb: [224, 92, 90],
    },
    SUNLIT_CLAY: {
      name: 'Sunlit Clay',
      value: '#EDBD76',
      rgb: [237, 189, 118],
    },
    BONE: {
      name: 'Bone',
      value: '#E8DFCF',
      rgb: [232, 223, 207],
    },
    ASH_GREY: {
      name: 'Ash Grey',
      value: '#B5CBCD',
      rgb: [181, 203, 205],
    },
    
    // Default selected color
    DEFAULT: '#6CA7A1',
    
    // Preset colors array (for easy iteration)
    PRESETS: [
      { name: 'Tropical Teal', hex: '#6CA7A1', rgb: [108, 167, 161] },
      { name: 'Rich Cerulean', hex: '#496F96', rgb: [73, 111, 150] },
      { name: 'Lobster Pink', hex: '#E05C5A', rgb: [224, 92, 90] },
      { name: 'Sunlit Clay', hex: '#EDBD76', rgb: [237, 189, 118] },
      { name: 'Bone', hex: '#E8DFCF', rgb: [232, 223, 207] },
      { name: 'Ash Grey', hex: '#B5CBCD', rgb: [181, 203, 205] },
    ],
    
    // Territory fill opacity (0-1) - matching old tool
    TERRITORY_OPACITY: 0.5,
    
    // Territory stroke color
    TERRITORY_STROKE: '#000000',
    
    // Territory stroke width (pixels)
    TERRITORY_STROKE_WIDTH: 1,
  },

  /**
   * Geocoding Configuration
   */
  GEOCODING: {
    // Mapbox Geocoding API base URL
    BASE_URL: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
    
    // Country code filter (ISO 3166-1 alpha-2)
    // Set to null to search globally
    // Example: 'TW' for Taiwan only
    COUNTRY_CODE: 'TW',
    
    // Feature types to search
    // Options: country, region, postcode, district, place, locality, neighborhood, address, poi
    TYPES: ['region', 'district', 'place'],
    
    // Maximum number of results
    LIMIT: 5,
    
    // Timeout in milliseconds
    TIMEOUT: 10000,
  },

  /**
   * Export Configuration
   */
  EXPORT: {
    // Default export format
    // Options: 'png', 'jpg'
    DEFAULT_FORMAT: 'png',
    
    // JPG quality (0-1, only for JPG format)
    JPG_QUALITY: 0.9,
    
    // Export scale factor
    // 1 = normal, 2 = high resolution (2x)
    SCALE: 2,
    
    // Export filename prefix
    FILENAME_PREFIX: 'map',
    
    // Include timestamp in filename
    INCLUDE_TIMESTAMP: true,
    
    // Export timeout in milliseconds
    TIMEOUT: 30000,
  },

  /**
   * UI Configuration
   */
  UI: {
    // Show loading spinner
    SHOW_LOADING: true,
    
    // Loading spinner HTML
    LOADING_HTML: '<div class="spinner"></div>',
    
    // Animation duration (milliseconds)
    ANIMATION_DURATION: 300,
    
    // Show coordinate input field
    SHOW_COORDINATE_INPUT: true,
    
    // Coordinate input placeholder text
    COORDINATE_PLACEHOLDER: 'Enter coordinates (lat,lng) or location name',
    
    // Show help text
    SHOW_HELP: true,
  },

  /**
   * Feature Flags
   * Enable/disable features
   */
  FEATURES: {
    // Enable Google Analytics tracking
    ENABLE_ANALYTICS: false,
    
    // Google Analytics tracking ID
    // Format: 'G-XXXXXXXXXX'
    ANALYTICS_ID: null,
    
    // Enable save/load functionality (Phase 2)
    ENABLE_SAVE_LOAD: false,
    
    // Enable template system (Phase 2)
    ENABLE_TEMPLATES: false,
    
    // Enable drawing tools (Phase 2)
    ENABLE_DRAWING: false,
    
    // Enable measurement tools (Phase 2)
    ENABLE_MEASUREMENT: false,
  },

  /**
   * Error Handling Configuration
   */
  ERROR: {
    // Show error messages to users
    SHOW_ERRORS: true,
    
    // Log errors to console
    LOG_TO_CONSOLE: true,
    
    // Show detailed error messages (for debugging)
    SHOW_DETAILED_ERRORS: false,
    
    // Error message duration (milliseconds, 0 = don't auto-hide)
    ERROR_DURATION: 5000,
  },

  /**
   * Performance Configuration
   */
  PERFORMANCE: {
    // Cache geocoding results
    CACHE_GEOCODING: true,
    
    // Cache duration in milliseconds (24 hours)
    CACHE_DURATION: 24 * 60 * 60 * 1000,
    
    // Simplify GeoJSON geometries for performance
    SIMPLIFY_GEOJSON: true,
    
    // Simplification tolerance (higher = more simplified)
    SIMPLIFY_TOLERANCE: 0.001,
    
    // Lazy load boundary data
    LAZY_LOAD_BOUNDARIES: true,
    
    // Maximum number of territories to display
    MAX_TERRITORIES: 100,
    
    // Maximum number of locations to display
    MAX_LOCATIONS: 200,
  },

  /**
   * External Links
   */
  LINKS: {
    // Google Maps link template
    // {lat} and {lng} will be replaced with coordinates
    GOOGLE_MAPS: 'https://www.google.com/maps?q={lat},{lng}',
    
    // Google Drive folder link (optional)
    GOOGLE_DRIVE: null,
    
    // Documentation link
    DOCS: 'https://github.com/yourusername/map-tool',
  },

  /**
   * Gemini AI Configuration (for news analysis)
   * Get your API key from: https://makersuite.google.com/app/apikey
   */
  GEMINI: {
    // ============================================================
    // Production Mode: Backend Proxy (Recommended)
    // ============================================================
    // For production, use backend proxy to keep API key secure
    // API key will be stored in server environment variables
    
    // Use backend proxy? (true = production, false = development with direct API)
    USE_BACKEND_PROXY: true, // Set to false for direct API calls (requires API_KEY below)
    
    // Backend proxy endpoint (relative path)
    PROXY_ENDPOINT: '/api/gemini/generateContent',
    
    // ============================================================
    // Development Mode: Direct API (Optional)
    // ============================================================
    // Only needed if USE_BACKEND_PROXY = false
    // Get your Gemini API key from: https://aistudio.google.com/app/apikey
    API_KEY: 'YOUR_GEMINI_API_KEY_HERE', // Only used if USE_BACKEND_PROXY = false
    
    // Model name (use gemini-2.0-flash, gemini-1.5-pro-latest, or specific versions)
    MODEL: 'gemini-2.0-flash', // Fast model for quick responses
    
    // API base URL (v1beta for latest features, v1 for stable)
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
    
    // Request timeout (milliseconds)
    TIMEOUT: 30000,
    
    // Enable/disable AI features
    ENABLED: true, // GenAI feature enabled
  },

  /**
   * Validation Rules
   */
  VALIDATION: {
    // Coordinate validation
    MIN_LATITUDE: -90,
    MAX_LATITUDE: 90,
    MIN_LONGITUDE: -180,
    MAX_LONGITUDE: 180,
    
    // Territory name validation
    MIN_TERRITORY_NAME_LENGTH: 1,
    MAX_TERRITORY_NAME_LENGTH: 100,
    
    // Location name validation
    MIN_LOCATION_NAME_LENGTH: 1,
    MAX_LOCATION_NAME_LENGTH: 200,
  },

  /**
   * Localization (Future Enhancement)
   */
  I18N: {
    // Default language
    DEFAULT_LANGUAGE: 'zh-TW',
    
    // Supported languages
    SUPPORTED_LANGUAGES: ['zh-TW', 'en-US'],
  },
};

/**
 * Helper function to get color value by name
 * @param {string} colorName - Color name (e.g., 'blue', 'red')
 * @returns {string} Hex color value
 */
function getColorValue(colorName) {
  const colorMap = {
    blue: CONFIG.COLORS.BLUE.value,
    red: CONFIG.COLORS.RED.value,
    orange: CONFIG.COLORS.ORANGE.value,
    darkgray: CONFIG.COLORS.DARK_GRAY.value,
    lightgray: CONFIG.COLORS.LIGHT_GRAY.value,
  };
  
  return colorMap[colorName.toLowerCase()] || CONFIG.COLORS.DEFAULT;
}

/**
 * Helper function to validate Mapbox token
 * @returns {boolean} True if token is valid format
 */
function validateToken() {
  const token = CONFIG.MAPBOX.TOKEN;
  return token && token.startsWith('pk.') && token.length > 20;
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, getColorValue, validateToken };
}

// Export to window for browser use
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
  console.log('✅ CONFIG 已載入到 window');
}
