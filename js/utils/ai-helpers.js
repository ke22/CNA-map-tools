/**
 * AI Helper Functions
 * Utilities for processing AI-extracted location data
 */

/**
 * Validate and normalize AI extraction results
 * @param {Object} aiResult - Raw result from Gemini API
 * @returns {Object} - Normalized and validated result
 */
function validateAIResults(aiResult) {
    if (!aiResult) {
        return { locations: [], areas: [] };
    }

    const locations = (aiResult.locations || []).map(loc => ({
        name: loc.name || '',
        type: loc.type || 'city',
        country: loc.country || '',
        coordinates: loc.coordinates || null, // [lng, lat] or null
        priority: loc.priority || 5,
        context: loc.context || '',
        // Normalize coordinates format
        coords: normalizeCoordinates(loc.coordinates)
    })).filter(loc => loc.name); // Remove entries without name

    const areas = (aiResult.areas || []).map(area => ({
        name: area.name || '',
        iso_code: area.iso_code || null,  // 保留 AI 輸出的 ISO 代碼（優先使用）
        type: area.type || 'country',
        gadm_level: area.gadm_level !== undefined ? area.gadm_level : (area.type === 'country' ? 0 : area.type === 'state' ? 1 : 2),  // GADM 層級
        priority: area.priority || 5,
        suggestedColor: area.suggestedColor || '#007AFF',
        reason: area.reason || ''
    })).filter(area => area.name); // Remove entries without name

    // Extract map design suggestions if available
    const mapDesign = aiResult.mapDesign ? {
        suggestedStyle: aiResult.mapDesign.suggestedStyle || 'standard',
        suggestedZoom: aiResult.mapDesign.suggestedZoom || null,
        suggestedCenter: aiResult.mapDesign.suggestedCenter || null,
        title: aiResult.mapDesign.title || '',
        description: aiResult.mapDesign.description || ''
    } : null;

    return { locations, areas, mapDesign };
}

/**
 * Normalize coordinates format
 * @param {Array|string} coordinates - Coordinates in various formats
 * @returns {Array|null} - Normalized [lng, lat] or null
 */
function normalizeCoordinates(coordinates) {
    if (!coordinates) return null;

    // If already an array
    if (Array.isArray(coordinates)) {
        if (coordinates.length >= 2) {
            // Check if lat/lng are swapped (common mistake: lat, lng vs lng, lat)
            const [first, second] = coordinates;
            // If first > second and both are reasonable lat values, might be swapped
            // But let's assume AI returns [lng, lat] or [lat, lng] correctly
            // We'll trust the format but validate ranges
            if (isValidLng(first) && isValidLat(second)) {
                return [first, second]; // [lng, lat]
            } else if (isValidLat(first) && isValidLng(second)) {
                return [second, first]; // Swap to [lng, lat]
            }
            return [first, second]; // Default: assume [lng, lat]
        }
        return null;
    }

    // If string, try to parse
    if (typeof coordinates === 'string') {
        const parts = coordinates.split(',').map(s => parseFloat(s.trim()));
        if (parts.length >= 2 && !parts.some(isNaN)) {
            return normalizeCoordinates(parts);
        }
    }

    return null;
}

/**
 * Validate longitude
 */
function isValidLng(lng) {
    return typeof lng === 'number' && lng >= -180 && lng <= 180;
}

/**
 * Validate latitude
 */
function isValidLat(lat) {
    return typeof lat === 'number' && lat >= -90 && lat <= 90;
}

/**
 * Sort results by priority (lower number = higher priority)
 */
function sortByPriority(items) {
    return [...items].sort((a, b) => (a.priority || 5) - (b.priority || 5));
}

/**
 * Format location for display
 */
function formatLocationForDisplay(location) {
    const parts = [location.name];
    if (location.country && location.country !== location.name) {
        parts.push(location.country);
    }
    if (location.coords) {
        parts.push(`(${location.coords[1].toFixed(4)}, ${location.coords[0].toFixed(4)})`);
    }
    return parts.join(', ');
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.validateAIResults = validateAIResults;
    window.normalizeCoordinates = normalizeCoordinates;
    window.sortByPriority = sortByPriority;
    window.formatLocationForDisplay = formatLocationForDisplay;
}

