/**
 * Add neighboring country labels (gray text) for context
 * @param {Array} selectedAreas - The areas that were just applied
 */
async function addNeighboringCountryLabels(selectedAreas) {
    if (!selectedAreas || selectedAreas.length === 0) return;
    if (!appState.map || !window.COUNTRY_CODES) return;

    // Get ISO codes of selected countries
    const selectedIsoCodes = new Set(
        selectedAreas
            .filter(a => a.type === 'country' && a.id)
            .map(a => a.id.toUpperCase())
    );

    if (selectedIsoCodes.size === 0) return;

    // Get GADM source
    const source = appState.map.getSource('gadm-country');
    if (!source || !source._data || !source._data.features) {
        console.warn('⚠️ GADM country source not available for neighboring labels');
        return;
    }

    // Find neighboring countries (1st tier)
    const firstTierNeighbors = new Set();
    const secondTierNeighbors = new Set();

    // First pass: Find all first-tier neighbors
    source._data.features.forEach(feature => {
        const props = feature.properties || {};
        const gid = props.GID_0;
        if (!gid) return;

        // Skip if this is a selected country
        if (selectedIsoCodes.has(gid)) return;

        // Check if this country is adjacent to any selected country
        selectedIsoCodes.forEach(selectedIso => {
            if (window.areCountriesAdjacent && window.areCountriesAdjacent(gid, selectedIso)) {
                firstTierNeighbors.add(gid);
            }
        });
    });

    // Second pass: Find second-tier neighbors (neighbors of first-tier neighbors)
    source._data.features.forEach(feature => {
        const props = feature.properties || {};
        const gid = props.GID_0;
        if (!gid) return;

        // Skip if this is a selected country or already a first-tier neighbor
        if (selectedIsoCodes.has(gid) || firstTierNeighbors.has(gid)) return;

        // Check if this country is adjacent to any first-tier neighbor
        firstTierNeighbors.forEach(neighborIso => {
            if (window.areCountriesAdjacent && window.areCountriesAdjacent(gid, neighborIso)) {
                secondTierNeighbors.add(gid);
            }
        });
    });

    console.log(`🌍 Found ${firstTierNeighbors.size} first-tier neighbors, ${secondTierNeighbors.size} second-tier neighbors`);

    // Add labels for first-tier neighbors (darker gray)
    for (const isoCode of firstTierNeighbors) {
        try {
            const feature = source._data.features.find(f => {
                const props = f.properties || {};
                return props.GID_0 === isoCode;
            });

            if (feature && feature.geometry) {
                const centerCoords = calculateGeometryCenter(feature.geometry);
                if (centerCoords && typeof addMapTextLabel === 'function') {
                    const countryName = window.COUNTRY_CODES[isoCode]?.name || isoCode;
                    // Add with gray color and smaller font
                    addMapTextLabel(centerCoords, countryName, {
                        color: '#888888',
                        fontSize: 14,
                        opacity: 0.7
                    });
                    console.log(`  ✅ Added 1st-tier neighbor label: ${countryName}`);
                }
            }
        } catch (error) {
            console.warn(`Failed to add neighbor label for ${isoCode}:`, error);
        }
    }

    // Add labels for second-tier neighbors (lighter gray)
    for (const isoCode of secondTierNeighbors) {
        try {
            const feature = source._data.features.find(f => {
                const props = f.properties || {};
                return props.GID_0 === isoCode;
            });

            if (feature && feature.geometry) {
                const centerCoords = calculateGeometryCenter(feature.geometry);
                if (centerCoords && typeof addMapTextLabel === 'function') {
                    const countryName = window.COUNTRY_CODES[isoCode]?.name || isoCode;
                    // Add with lighter gray color and smaller font
                    addMapTextLabel(centerCoords, countryName, {
                        color: '#AAAAAA',
                        fontSize: 12,
                        opacity: 0.5
                    });
                    console.log(`  ✅ Added 2nd-tier neighbor label: ${countryName}`);
                }
            }
        } catch (error) {
            console.warn(`Failed to add 2nd-tier neighbor label for ${isoCode}:`, error);
        }
    }
}

/**
 * Add sea/ocean labels based on selected countries
 * @param {Array} selectedAreas - The areas that were just applied
 */
async function addSeaLabels(selectedAreas) {
    if (!selectedAreas || selectedAreas.length === 0) return;
    if (!appState.map || typeof getAdjacentSeas !== 'function') return;

    console.log('🌊 Getting adjacent seas...');

    // Use the existing getAdjacentSeas function from app-enhanced.js
    const seas = getAdjacentSeas(selectedAreas);

    if (!seas || seas.length === 0) {
        console.log('  ℹ️ No seas found for selected countries');
        return;
    }

    console.log(`🌊 Found ${seas.length} adjacent seas`);

    // Add sea labels
    for (const sea of seas) {
        try {
            if (sea.center && sea.center.length >= 2 && typeof addMapTextLabel === 'function') {
                // Add with blue-gray color and italic style
                addMapTextLabel(sea.center, sea.name, {
                    color: '#4A90A4',
                    fontSize: 13,
                    opacity: 0.6,
                    fontStyle: 'italic'
                });
                console.log(`  ✅ Added sea label: ${sea.name}`);
            }
        } catch (error) {
            console.warn(`Failed to add sea label for ${sea.name}:`, error);
        }
    }
}

/**
 * Calculate the center of a geometry (Polygon or MultiPolygon)
 * @param {Object} geometry - GeoJSON geometry object
 * @returns {Array|null} - [lng, lat] coordinates or null
 */
function calculateGeometryCenter(geometry) {
    if (!geometry || !geometry.coordinates) return null;

    try {
        if (geometry.type === 'Polygon') {
            const coords = geometry.coordinates[0];
            if (coords && coords.length > 0) {
                let sumLng = 0, sumLat = 0;
                coords.forEach(coord => {
                    sumLng += coord[0];
                    sumLat += coord[1];
                });
                return [sumLng / coords.length, sumLat / coords.length];
            }
        } else if (geometry.type === 'MultiPolygon') {
            const coords = geometry.coordinates[0][0];
            if (coords && coords.length > 0) {
                let sumLng = 0, sumLat = 0;
                coords.forEach(coord => {
                    sumLng += coord[0];
                    sumLat += coord[1];
                });
                return [sumLng / coords.length, sumLat / coords.length];
            }
        }
    } catch (error) {
        console.warn('Error calculating geometry center:', error);
    }

    return null;
}

// Export to global scope
if (typeof window !== 'undefined') {
    window.addNeighboringCountryLabels = addNeighboringCountryLabels;
    window.addSeaLabels = addSeaLabels;
    window.calculateGeometryCenter = calculateGeometryCenter;
}
