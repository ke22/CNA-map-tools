/**
 * Map Download Tool - Territory Handler
 * 
 * This module handles marking territories on the map by name or coordinates.
 * It uses Mapbox Geocoding API to resolve names to boundaries and then
 * highlights the territory with the selected color.
 * 
 * @module features/territory-handler
 * @requires mapbox-gl
 * @requires config
 */

/**
 * Marks a territory on the map by name
 * 
 * Flow:
 * 1. Validates input name
 * 2. Calls Mapbox Geocoding API to find territory
 * 3. Gets territory boundary from GeoJSON data
 * 4. Adds colored layer to map
 * 5. Updates state object
 * 
 * @param {string} name - Territory name (e.g., 'Taipei', 'New York')
 * @param {string} color - Hex color code (e.g., '#3B82F6')
 * @returns {Promise<Object>} Promise that resolves with territory object
 * 
 * @example
 * // Mark Taipei in blue
 * await markTerritoryByName('Taipei', '#3B82F6');
 * 
 * @throws {ValidationError} If name is invalid or empty
 * @throws {GeocodingError} If geocoding API fails
 * @throws {BoundaryLoadError} If boundary data cannot be loaded
 */
async function markTerritoryByName(name, color) {
  // Validate input
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('Territory name is required');
  }
  
  // Validate color
  if (!color || !isValidHexColor(color)) {
    throw new ValidationError('Invalid color format');
  }
  
  try {
    // Step 1: Geocode the territory name
    // This converts the name to coordinates and gets territory info
    const geocodeResult = await geocodeTerritory(name);
    
    // Step 2: Get boundary GeoJSON for the territory
    // This loads the polygon/multipolygon geometry
    const boundary = await getTerritoryBoundary(geocodeResult);
    
    // Step 3: Add territory layer to map
    // Creates a fill layer with the selected color
    const layerId = addTerritoryLayer(boundary, color);
    
    // Step 4: Update state
    // Store territory info in state object for later reference
    const territory = {
      id: generateId(),
      name: name,
      coordinates: geocodeResult.center,
      color: color,
      boundary: boundary,
      layerId: layerId,
      timestamp: new Date()
    };
    
    mapState.territories.push(territory);
    
    // Step 5: Track analytics (if enabled)
    if (CONFIG.FEATURES.ENABLE_ANALYTICS) {
      trackEvent('territory_marked', { name, color });
    }
    
    return territory;
    
  } catch (error) {
    // Log error for debugging
    Logger.error('Failed to mark territory by name', {
      name,
      color,
      error: error.message
    });
    
    // Show user-friendly error message
    showError(`Could not find territory "${name}". Please check the spelling or try using coordinates.`);
    
    throw error;
  }
}

/**
 * Marks a territory on the map by coordinates
 * 
 * Uses reverse geocoding to find the territory containing the coordinates,
 * then highlights that territory.
 * 
 * @param {number} lat - Latitude (-90 to 90)
 * @param {number} lng - Longitude (-180 to 180)
 * @param {string} color - Hex color code
 * @returns {Promise<Object>} Territory object
 * 
 * @example
 * // Mark territory at Taipei coordinates
 * await markTerritoryByCoordinates(25.0330, 121.5654, '#EF4444');
 */
async function markTerritoryByCoordinates(lat, lng, color) {
  // Validate coordinates
  validateCoordinates(lat, lng);
  
  // Reverse geocode to get territory name
  const reverseResult = await reverseGeocode(lat, lng);
  const territoryName = extractTerritoryName(reverseResult);
  
  // Use the name-based function
  return await markTerritoryByName(territoryName, color);
}

/**
 * Helper function to geocode a territory name
 * 
 * Makes a request to Mapbox Geocoding API to convert a territory name
 * into coordinates and territory information.
 * 
 * @private
 * @param {string} name - Territory name
 * @returns {Promise<Object>} Geocoding result from Mapbox API
 * 
 * @throws {GeocodingError} If API request fails or no results found
 */
async function geocodeTerritory(name) {
  // Build API URL with query parameters
  const query = encodeURIComponent(name);
  const params = new URLSearchParams({
    access_token: CONFIG.MAPBOX.TOKEN,
    country: CONFIG.GEOCODING.COUNTRY_CODE,
    types: CONFIG.GEOCODING.TYPES.join(','),
    limit: CONFIG.GEOCODING.LIMIT
  });
  
  const url = `${CONFIG.GEOCODING.BASE_URL}/${query}.json?${params}`;
  
  // Make API request with timeout
  // AbortController allows us to cancel the request if it takes too long
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.GEOCODING.TIMEOUT);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    // Check if request was successful
    if (!response.ok) {
      throw new GeocodingError(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check if results found
    if (!data.features || data.features.length === 0) {
      throw new GeocodingError(`No territory found for "${name}"`);
    }
    
    // Return best match (first result)
    // Mapbox API returns results sorted by relevance
    return data.features[0];
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new GeocodingError('Geocoding request timed out');
    }
    throw error;
  }
}

/**
 * Helper function to get territory boundary from GeoJSON
 * 
 * Loads the appropriate boundary GeoJSON file based on current map type,
 * then finds the matching territory feature.
 * 
 * @private
 * @param {Object} geocodeResult - Result from geocoding API
 * @returns {Promise<Object>} GeoJSON feature with boundary geometry
 * 
 * @throws {BoundaryLoadError} If boundary file cannot be loaded or territory not found
 */
async function getTerritoryBoundary(geocodeResult) {
  // Get current map type to load appropriate boundary file
  // Map types: 'country', 'state', 'county', 'world'
  const mapType = mapState.currentMapType;
  const boundaryPath = CONFIG.MAP_TYPES.DATA_PATHS[mapType];
  
  if (!boundaryPath) {
    throw new BoundaryLoadError(`Invalid map type: ${mapType}`);
  }
  
  // Load boundary GeoJSON file
  // This is an async operation as the file may be large
  const response = await fetch(boundaryPath);
  if (!response.ok) {
    throw new BoundaryLoadError(`Failed to load boundary data: ${response.statusText}`);
  }
  
  const geoJson = await response.json();
  
  // Validate GeoJSON structure
  if (!geoJson.features || !Array.isArray(geoJson.features)) {
    throw new BoundaryLoadError('Invalid GeoJSON structure');
  }
  
  // Find matching territory in GeoJSON
  // Match by name (case-insensitive) or by coordinates
  const territory = findTerritoryInGeoJson(geoJson, geocodeResult);
  
  if (!territory) {
    throw new BoundaryLoadError(`Territory boundary not found in ${mapType} data`);
  }
  
  return territory;
}

/**
 * Adds a colored territory layer to the map
 * 
 * Creates both a fill layer (colored area) and a stroke layer (boundary outline)
 * for the territory on the Mapbox map.
 * 
 * @private
 * @param {Object} boundary - GeoJSON feature with territory geometry
 * @param {string} color - Hex color code for fill
 * @returns {string} Layer ID for later removal
 */
function addTerritoryLayer(boundary, color) {
  // Generate unique IDs for source and layers
  // Format: 'territory-{timestamp}-{random}'
  const layerId = `territory-${generateId()}`;
  const sourceId = `source-${layerId}`;
  
  // Add GeoJSON source to map
  // This makes the boundary data available to layers
  map.addSource(sourceId, {
    type: 'geojson',
    data: boundary
  });
  
  // Add fill layer for colored area
  // Fill opacity is configurable in CONFIG.COLORS.TERRITORY_OPACITY
  map.addLayer({
    id: layerId,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': color,
      'fill-opacity': CONFIG.COLORS.TERRITORY_OPACITY
    }
  });
  
  // Add stroke layer for boundary outline
  // This creates the black border around the territory
  map.addLayer({
    id: `${layerId}-stroke`,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': CONFIG.COLORS.TERRITORY_STROKE,
      'line-width': CONFIG.COLORS.TERRITORY_STROKE_WIDTH
    }
  });
  
  return layerId;
}

/**
 * Validates coordinate values
 * 
 * Ensures coordinates are within valid ranges:
 * - Latitude: -90 to 90
 * - Longitude: -180 to 180
 * 
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @throws {ValidationError} If coordinates are invalid
 */
function validateCoordinates(lat, lng) {
  // Check if values are numbers
  if (typeof lat !== 'number' || isNaN(lat)) {
    throw new ValidationError('Latitude must be a number');
  }
  
  if (typeof lng !== 'number' || isNaN(lng)) {
    throw new ValidationError('Longitude must be a number');
  }
  
  // Check latitude range
  if (lat < CONFIG.VALIDATION.MIN_LATITUDE || lat > CONFIG.VALIDATION.MAX_LATITUDE) {
    throw new ValidationError(
      `Latitude must be between ${CONFIG.VALIDATION.MIN_LATITUDE} and ${CONFIG.VALIDATION.MAX_LATITUDE}`
    );
  }
  
  // Check longitude range
  if (lng < CONFIG.VALIDATION.MIN_LONGITUDE || lng > CONFIG.VALIDATION.MAX_LONGITUDE) {
    throw new ValidationError(
      `Longitude must be between ${CONFIG.VALIDATION.MIN_LONGITUDE} and ${CONFIG.VALIDATION.MAX_LONGITUDE}`
    );
  }
}

/**
 * Finds a territory feature in GeoJSON by matching with geocode result
 * 
 * Matches territories by:
 * 1. Exact name match (case-insensitive)
 * 2. Partial name match
 * 3. Coordinate proximity
 * 
 * @private
 * @param {Object} geoJson - Complete GeoJSON FeatureCollection
 * @param {Object} geocodeResult - Result from Mapbox geocoding
 * @returns {Object|null} Matching territory feature or null
 */
function findTerritoryInGeoJson(geoJson, geocodeResult) {
  const searchName = geocodeResult.text || geocodeResult.place_name;
  const normalizedSearchName = searchName.toLowerCase().trim();
  
  // First, try exact name match
  let match = geoJson.features.find(feature => {
    const name = feature.properties.name || '';
    return name.toLowerCase() === normalizedSearchName;
  });
  
  // If no exact match, try partial match
  if (!match) {
    match = geoJson.features.find(feature => {
      const name = feature.properties.name || '';
      return name.toLowerCase().includes(normalizedSearchName) ||
             normalizedSearchName.includes(name.toLowerCase());
    });
  }
  
  // If still no match, try coordinate proximity (for point-in-polygon)
  if (!match && geocodeResult.center) {
    const [lng, lat] = geocodeResult.center;
    match = geoJson.features.find(feature => {
      return isPointInPolygon([lng, lat], feature.geometry);
    });
  }
  
  return match || null;
}

// Export functions
// This allows the functions to be imported in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    markTerritoryByName,
    markTerritoryByCoordinates,
    validateCoordinates
  };
}

