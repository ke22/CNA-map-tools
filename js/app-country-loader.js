/**
 * Country-specific Administrative Boundaries Loader
 * Loads administrative boundaries for a specific country (much smaller files)
 * Alternative to loading full GADM global data
 */

// Configuration
const COUNTRY_LOADER_CONFIG = {
    basePath: './data/countries',
    // File naming: {COUNTRY_CODE}/{level_name}.geojson
    // Example: TWN/states.geojson, TWN/cities.geojson
};

/**
 * Load administrative boundaries for a specific country
 * @param {string} countryCode - ISO country code (e.g., 'TWN', 'USA')
 * @param {string} areaType - 'state' or 'city'
 * @param {Function} createVisibleLayer - Callback to create visible layer
 */
async function loadCountryBoundarySource(countryCode, areaType, createVisibleLayer) {
    const sourceTypeKey = areaType === 'state' ? 'adm1' : 'adm2';
    const sourceId = `country-${areaType}-${countryCode}`;
    const fileName = areaType === 'state' ? 'states' : 'cities';
    const filePath = `${COUNTRY_LOADER_CONFIG.basePath}/${countryCode}/${fileName}.geojson`;
    
    console.log(`🌍 Loading ${areaType} boundaries for country: ${countryCode}`);
    console.log(`   File: ${filePath}`);
    
    // Check if source already exists
    if (appState.map.getSource(sourceId)) {
        console.log(`✅ Source ${sourceId} already loaded`);
        if (createVisibleLayer) {
            createCountryVisibleLayer(countryCode, areaType);
        }
        return;
    }
    
    try {
        // Load GeoJSON file
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load ${filePath}: ${response.status} ${response.statusText}`);
        }
        
        const geoJson = await response.json();
        console.log(`✅ Loaded ${geoJson.features.length} ${areaType} features for ${countryCode}`);
        
        // Add source to map
        appState.map.addSource(sourceId, {
            type: 'geojson',
            data: geoJson
        });
        
        // Update app state
        appState.sources[sourceTypeKey] = {
            id: sourceId,
            loaded: true,
            countryCode: countryCode
        };
        
        // Create visible layer if requested
        if (createVisibleLayer) {
            // Create layer immediately after source is added
            setTimeout(() => {
                createCountryVisibleLayer(countryCode, areaType);
                
                // Show layer immediately if it's the current active type
                if (appState.currentAreaType === 'administration') {
                    // Additional delay to ensure layer is ready
                    setTimeout(() => {
                        showBoundaryLayer(areaType);
                        console.log(`✅ ${areaType} layer should now be visible and clickable`);
                    }, 200);
                }
            }, 200);
        }
        
        console.log(`✅ Successfully loaded country boundaries for ${countryCode}`);
        
    } catch (error) {
        console.error(`❌ Failed to load country boundaries for ${countryCode}:`, error);
        throw error;
    }
}

/**
 * Create visible boundary layer for country-specific data
 */
function createCountryVisibleLayer(countryCode, areaType) {
    const sourceId = `country-${areaType}-${countryCode}`;
    const layerId = `visible-boundaries-${areaType}`;
    const lineLayerId = `${layerId}-lines`;
    
    // Check if source exists
    if (!appState.map.getSource(sourceId)) {
        console.warn(`⚠️ Source ${sourceId} does not exist`);
        return;
    }
    
    // Check if layer already exists
    if (appState.map.getLayer(layerId)) {
        console.log(`Layer ${layerId} already exists`);
        return;
    }
    
    try {
        // Create fill layer
        appState.map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: {
                'fill-color': 'transparent',
                'fill-opacity': 0
            },
            layout: {
                visibility: 'visible'
            }
        });
        
        // Create line layer
        appState.map.addLayer({
            id: lineLayerId,
            type: 'line',
            source: sourceId,
            paint: {
                'line-color': '#627BC1',
                'line-width': 1,
                'line-opacity': 0.6
            },
            layout: {
                visibility: 'visible'
            }
        });
        
        console.log(`✅ Created visible boundary layers for ${areaType} (country: ${countryCode})`);
        
    } catch (error) {
        console.error(`Failed to create visible layer for ${areaType}:`, error);
    }
}

/**
 * Get area name from country-specific feature
 */
function getCountryAreaName(feature, areaType) {
    const props = feature.properties || {};
    
    if (areaType === 'state') {
        // Priority: NL_NAME_1 (local) > NAME_1 (English)
        return (props.NL_NAME_1 && props.NL_NAME_1 !== 'NA') ? props.NL_NAME_1 :
               props.NAME_1 || props.name || 'Unknown State';
    } else {
        // Priority: NL_NAME_2 (local) > NAME_2 (English)
        const name2 = (props.NL_NAME_2 && props.NL_NAME_2 !== 'NA') ? props.NL_NAME_2 :
                      props.NAME_2 || props.name;
        const name1 = (props.NL_NAME_1 && props.NL_NAME_1 !== 'NA') ? props.NL_NAME_1 :
                      props.NAME_1;
        
        if (name2) {
            return name1 ? `${name1} - ${name2}` : name2;
        }
        return 'Unknown City';
    }
}

/**
 * Get area ID from country-specific feature
 */
function getCountryAreaId(feature, areaType) {
    const props = feature.properties || {};
    
    if (areaType === 'state') {
        return props.GID_1 || props.NAME_1 || feature.id;
    } else {
        return props.GID_2 || props.NAME_2 || feature.id;
    }
}

// Export functions
if (typeof window !== 'undefined') {
    window.COUNTRY_LOADER = {
        loadBoundarySource: loadCountryBoundarySource,
        createVisibleLayer: createCountryVisibleLayer,
        getAreaName: getCountryAreaName,
        getAreaId: getCountryAreaId,
        config: COUNTRY_LOADER_CONFIG
    };
}

