/**
 * Location Resolver
 * Resolves location names to coordinates using Mapbox Geocoding API
 */

/**
 * Resolve location name to coordinates using Mapbox Geocoding
 * @param {string} locationName - Name of the location
 * @param {string} countryCode - Optional country code for better results
 * @returns {Promise<Array|null>} - [lng, lat] coordinates or null if not found
 */
async function resolveLocationCoordinates(locationName, countryCode = null) {
    if (!CONFIG || !CONFIG.MAPBOX || !CONFIG.MAPBOX.TOKEN) {
        console.warn('Mapbox token not configured');
        return null;
    }

    const token = CONFIG.MAPBOX.TOKEN;
    const baseUrl = CONFIG.GEOCODING?.BASE_URL || 'https://api.mapbox.com/geocoding/v5/mapbox.places';
    const limit = CONFIG.GEOCODING?.LIMIT || 5;

    // Build query
    let query = locationName;
    if (countryCode) {
        query = `${locationName}, ${countryCode}`;
    }

    const url = `${baseUrl}/${encodeURIComponent(query)}.json?access_token=${token}&limit=${limit}`;

    try {
        console.log(`🌍 Resolving coordinates for: ${locationName}`);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Geocoding API error: ${response.status}`);
        }

        const data = await response.json();
        const features = data.features || [];

        if (features.length === 0) {
            console.warn(`No coordinates found for: ${locationName}`);
            return null;
        }

        // Get first result (most relevant)
        const firstFeature = features[0];
        const coords = firstFeature.center; // [lng, lat]

        console.log(`✅ Resolved ${locationName} to: [${coords[0]}, ${coords[1]}]`);
        return coords;

    } catch (error) {
        console.error(`Failed to resolve coordinates for ${locationName}:`, error);
        return null;
    }
}

/**
 * Resolve multiple locations in batch (with rate limiting)
 * @param {Array} locations - Array of location objects with name property
 * @param {number} delay - Delay between requests (ms)
 * @returns {Promise<Array>} - Array of locations with resolved coordinates
 */
async function resolveLocationsBatch(locations, delay = 200) {
    const results = [];

    for (const location of locations) {
        // If coordinates already exist, skip
        if (location.coords) {
            results.push(location);
            continue;
        }

        // Resolve coordinates
        const coords = await resolveLocationCoordinates(location.name, location.country);
        
        results.push({
            ...location,
            coords: coords
        });

        // Rate limiting delay
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    return results;
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.resolveLocationCoordinates = resolveLocationCoordinates;
    window.resolveLocationsBatch = resolveLocationsBatch;
}

