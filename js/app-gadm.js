/**
 * GADM Data Integration
 * Loads GADM GeoJSON files instead of Mapbox Boundaries
 * 
 * Usage: Replace Mapbox Boundaries with GADM data
 */

// GADM Configuration
const GADM_CONFIG = {
    // Base URL for GADM files (update after hosting)
    // For local development, use relative path
    BASE_URL: './data/gadm/optimized/',  // Local or hosted URL
    
    // Alternative: Use GitHub Pages
    // BASE_URL: 'https://[username].github.io/[repo]/data/gadm/optimized/',
    
    // Alternative: Use Netlify/CDN
    // BASE_URL: 'https://your-site.netlify.app/data/gadm/optimized/',
    
    FILES: {
        country: 'gadm_level0_optimized.geojson',  // Countries
        state: 'gadm_level1_optimized.geojson',    // States/Provinces
        city: 'gadm_level2_optimized.geojson'      // Cities/Counties
    },
    
    // Fallback to non-optimized if optimized not available
    FALLBACK_FILES: {
        country: 'gadm_level0.geojson',
        state: 'gadm_level1.geojson',
        city: 'gadm_level2.geojson'
    }
};

/**
 * Load GADM GeoJSON file and add as source
 */
async function loadGADMSource(areaType) {
    // Determine source type key
    const sourceTypeKey = areaType === 'country' ? 'adm0' : 
                         areaType === 'state' ? 'adm1' : 'adm2';
    const sourceId = `gadm-${areaType}`;
    
    // Check if already loaded
    if (appState.sources[sourceTypeKey] && appState.sources[sourceTypeKey].loaded) {
        return Promise.resolve();
    }
    
    // Determine file path
    const fileName = GADM_CONFIG.FILES[areaType] || GADM_CONFIG.FALLBACK_FILES[areaType];
    const fileUrl = GADM_CONFIG.BASE_URL + fileName;
    
    console.log(`🔄 Loading GADM data for ${areaType} from: ${fileUrl}`);
    
    try {
        // Fetch GeoJSON
        console.log(`📥 Fetching GADM data from: ${fileUrl}`);
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
            // Try fallback file
            const fallbackFile = GADM_CONFIG.FALLBACK_FILES[areaType];
            const fallbackUrl = GADM_CONFIG.BASE_URL.replace('/optimized/', '/') + fallbackFile;
            console.log(`⚠️  Optimized file not found (${response.status}), trying fallback: ${fallbackUrl}`);
            
            const fallbackResponse = await fetch(fallbackUrl);
            if (!fallbackResponse.ok) {
                throw new Error(`Failed to load GADM file: ${response.status} ${response.statusText}`);
            }
            
            // Check content-length for large files
            const contentLength = fallbackResponse.headers.get('content-length');
            if (contentLength) {
                const fileSizeMB = parseInt(contentLength) / (1024 * 1024);
                console.log(`📊 Fallback file size: ${fileSizeMB.toFixed(2)} MB`);
                if (fileSizeMB > 100) {
                    console.warn(`⚠️  Warning: File is very large (${fileSizeMB.toFixed(2)} MB). This may cause memory issues.`);
                }
            }
            
            // Get response text first to check if complete
            const text = await fallbackResponse.text();
            console.log(`✅ Received ${(text.length / (1024 * 1024)).toFixed(2)} MB of data`);
            
            // Check if JSON is complete
            if (!text.trim().endsWith('}') && !text.trim().endsWith(']')) {
                throw new Error('JSON response appears to be truncated');
            }
            
            const geoJson = JSON.parse(text);
            addGADMSourceToMap(sourceId, geoJson, areaType, sourceTypeKey);
            return;
        }
        
        // Check content-length for large files
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
            const fileSizeMB = parseInt(contentLength) / (1024 * 1024);
            console.log(`📊 File size: ${fileSizeMB.toFixed(2)} MB`);
            if (fileSizeMB > 100) {
                console.warn(`⚠️  Warning: File is very large (${fileSizeMB.toFixed(2)} MB). This may cause memory issues.`);
                console.warn(`💡 Consider using optimized/simplified GeoJSON files or splitting the data.`);
            }
        }
        
        // Get response text first to check if complete
        const text = await response.text();
        console.log(`✅ Received ${(text.length / (1024 * 1024)).toFixed(2)} MB of data`);
        
        // Check if JSON is complete
        if (!text.trim().endsWith('}') && !text.trim().endsWith(']')) {
            throw new Error('JSON response appears to be truncated. The file may be too large to load completely.');
        }
        
        const geoJson = JSON.parse(text);
        addGADMSourceToMap(sourceId, geoJson, areaType, sourceTypeKey);
        
    } catch (error) {
        console.error(`❌ Error loading GADM data for ${areaType}:`, error);
        
        // More detailed error message
        let errorMsg = error.message;
        if (error.message.includes('Unexpected end of JSON')) {
            errorMsg = 'File is too large or incomplete. GADM GeoJSON files are very large (hundreds of MB to GB). ' +
                      'Consider using simplified/optimized versions or split the data by region.';
        }
        
        appState.sources[sourceTypeKey] = {
            id: sourceId,
            loaded: false,
            error: errorMsg
        };
        
        throw error;
    }
}

/**
 * Add GADM GeoJSON as Mapbox source
 */
function addGADMSourceToMap(sourceId, geoJson, areaType, sourceTypeKey) {
    // Check if source already exists
    const existingSource = appState.map.getSource(sourceId);
    
    if (existingSource) {
        // Source already exists - check if it's the same data
        console.log(`⚠️ Source ${sourceId} already exists, checking if update is needed...`);
        
        try {
            // If source exists and has data, we can reuse it or update it
            // For GeoJSON sources, we can update the data
            if (existingSource.type === 'geojson') {
                // Update existing source data
                existingSource.setData(geoJson);
                console.log(`✅ Updated existing GADM source: ${sourceId}`);
                
                // Mark as loaded
                appState.sources[sourceTypeKey] = {
                    id: sourceId,
                    loaded: true,
                    type: 'geojson',
                    areaType: areaType
                };
                
                console.log(`✅ GADM source updated: ${sourceId} (${geoJson.features?.length || 0} features)`);
                return; // Exit early, source already exists and updated
            }
        } catch (updateError) {
            console.warn(`Failed to update existing source ${sourceId}, will remove and recreate:`, updateError);
            // Fall through to remove and recreate
        }
        
        // If we get here, need to remove and recreate
        try {
            // Try to remove layers that use this source first
            const layerIds = ['visible-boundaries-state', 'visible-boundaries-city'];
            layerIds.forEach(layerId => {
                try {
                    if (appState.map.getLayer(layerId)) {
                        appState.map.removeLayer(layerId);
                    }
                } catch (e) {
                    // Layer might not exist, ignore
                }
            });
            
            // Now remove the source
            appState.map.removeSource(sourceId);
            console.log(`✅ Removed existing source ${sourceId} for recreation`);
        } catch (removeError) {
            console.error(`Failed to remove existing source ${sourceId}:`, removeError);
            // Continue anyway - might work if source is partially removed
        }
    }
    
    // Add GeoJSON source (either new or after removal)
    try {
        appState.map.addSource(sourceId, {
            type: 'geojson',
            data: geoJson
        });
    } catch (addError) {
        // If source still exists, try to update it instead
        if (addError.message && addError.message.includes('already exists')) {
            console.log(`Source ${sourceId} still exists, updating data instead...`);
            const source = appState.map.getSource(sourceId);
            if (source && source.type === 'geojson') {
                source.setData(geoJson);
                console.log(`✅ Updated source data for ${sourceId}`);
            } else {
                throw addError; // Re-throw if we can't handle it
            }
        } else {
            throw addError; // Re-throw other errors
        }
    }
    
    // Mark as loaded
    appState.sources[sourceTypeKey] = {
        id: sourceId,
        loaded: true,
        type: 'geojson',
        areaType: areaType
    };
    
    console.log(`✅ GADM source loaded: ${sourceId} (${geoJson.features?.length || 0} features)`);
}

/**
 * Create visible boundary layer from GADM source
 * Single line layer for both display and click detection
 */
function createGADMVisibleLayer(areaType) {
    const sourceId = `gadm-${areaType}`;
    const layerId = `visible-boundaries-${areaType}`;
    
    // Check if source exists
    if (!appState.map.getSource(sourceId)) {
        console.warn(`Source ${sourceId} not loaded yet`);
        return false;
    }
    
    // Check if layer already exists
    if (appState.map.getLayer(layerId)) {
        return true;
    }
    
    // Create single line layer (replaces both fill and line layers)
    // Line layers can be used for click detection via queryRenderedFeatures
    const boundaryColor = (typeof getContrastingBoundaryColor === 'function') 
        ? getContrastingBoundaryColor() 
        : '#808080'; // Default to gray
    const initialWidth = (typeof getAdaptiveBoundaryLineWidth === 'function')
        ? getAdaptiveBoundaryLineWidth(areaType)
        : (areaType === 'country' ? 0.1 : 0.15); // Thinner default
    const maxWidth = areaType === 'country' ? 0.2 : 0.3; // Country boundaries are thinner (reduced)
    
    // Set visibility based on boundary line toggle (separate for country and admin)
    let visibility = 'none';
    if (areaType === 'country') {
        // Country boundaries: show when country boundary toggle is on
        visibility = appState.countryBoundaryVisible ? 'visible' : 'none';
    } else if (areaType === 'state' || areaType === 'city') {
        // Admin boundaries: show state boundaries when admin boundary toggle is on
        visibility = (areaType === 'state' && appState.adminBoundaryVisible) ? 'visible' : 'none';
    }
    
    // Insert boundary line AFTER all fill layers (boundary lines should be on top of fills)
    // Use findLastFillLayer function from app-enhanced.js if available
    let insertBefore = undefined;
    if (typeof findLastFillLayer === 'function') {
        const lastFillLayerId = findLastFillLayer();
        if (lastFillLayerId && appState.map.getLayer(lastFillLayerId)) {
            const allLayers = appState.map.getStyle().layers;
            const lastFillLayerIndex = allLayers.findIndex(l => l.id === lastFillLayerId);
            if (lastFillLayerIndex >= 0 && lastFillLayerIndex < allLayers.length - 1) {
                // Insert boundary line right after the last fill layer (on top of all fills)
                insertBefore = allLayers[lastFillLayerIndex + 1].id;
                console.log(`   📍 Inserting boundary line after fill layer ${lastFillLayerId} (boundary lines on top of fills)`);
            }
        }
    }
    
    // Fallback: if no fill layers, insert before labels
    // When fill layers are added later, they will be inserted before this boundary layer
    if (!insertBefore) {
        const labelLayers = appState.labelLayerIds || [];
        insertBefore = labelLayers.length > 0 ? labelLayers[0] : undefined;
        if (insertBefore) {
            console.log(`   📍 No fill layers yet, inserting boundary line before labels (fills will be added below this)`);
        }
    }
    
    const layerOptions = {
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
            'line-color': boundaryColor,
                    'line-width': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        3, initialWidth,   // Country: 0.1px, Admin: 0.15px at zoom 3
                        10, maxWidth       // Country: 0.2px, Admin: 0.3px at zoom 10
                    ],
            'line-opacity': 0.8
        },
        layout: {
            visibility: visibility
        }
    };
    
    try {
        if (insertBefore) {
            appState.map.addLayer(layerOptions, insertBefore);
        } else {
            appState.map.addLayer(layerOptions);
        }
        console.log(`✅ Created GADM visible boundary layer: ${layerId} (single line layer, inserted after fill layers, color: ${boundaryColor}, adaptive width, visibility: ${visibility})`);
    } catch (error) {
        console.warn(`⚠️ Could not create GADM boundary layer ${layerId}:`, error);
        return false;
    }
    
    return true;
}

/**
 * Get area ID from GADM feature
 * This function is used by the main app for GADM features
 */
function getGADMAreaId(feature, areaType) {
    const props = feature.properties || {};
    
    if (areaType === 'country') {
        // Country identifier - use GID_0 as primary
        return props.GID_0 || 
               props.ISO || 
               props.ISO_A3 || 
               props.iso_3166_1_alpha_3 ||
               props.NAME_0 ||
               feature.id;
    } else if (areaType === 'state') {
        // State/Province identifier - use GID_1
        return props.GID_1 || 
               (props.NAME_0 && props.NAME_1 ? `${props.NAME_0}-${props.NAME_1}` : null) ||
               props.iso_3166_2 ||
               feature.id;
    } else {
        // City/County identifier - use GID_2
        return props.GID_2 || 
               (props.NAME_1 && props.NAME_2 ? `${props.NAME_1}-${props.NAME_2}` : null) ||
               feature.id;
    }
}

/**
 * Get area name from GADM feature
 */
function getGADMAreaName(feature, areaType) {
    const props = feature.properties || {};
    
    // Debug logging
    console.log(`🔍 getGADMAreaName called for ${areaType}:`, {
        hasCOUNTRY: !!props.COUNTRY,
        COUNTRY: props.COUNTRY,
        hasNAME_0: !!props.NAME_0,
        NAME_0: props.NAME_0,
        GID_0: props.GID_0,
        allKeys: Object.keys(props)
    });
    
    if (areaType === 'country') {
        // Try multiple possible property names for country name
        // Priority: COUNTRY (from optimized GADM) > NAME_0 > others
        let name = props.COUNTRY ||
               props.NAME_0 || 
               props.NAME_EN || 
               props.name_0 || 
               props.name_en ||
               props.name || 
               props.Country ||
               props.NAME;
        
        // If no name found in properties, try to get from COUNTRY_CODES mapping using GID_0
        if ((!name || name === 'NA' || name.trim() === '') && props.GID_0) {
            const gid0 = String(props.GID_0).toUpperCase().trim();
            if (typeof COUNTRY_CODES !== 'undefined' && COUNTRY_CODES[gid0]) {
                const countryInfo = COUNTRY_CODES[gid0];
                name = countryInfo.nameEn || countryInfo.name || gid0;
                console.log(`✅ Got country name from COUNTRY_CODES mapping: ${name} (GID_0: ${gid0})`);
            } else {
                console.warn(`⚠️ GID_0 "${gid0}" not found in COUNTRY_CODES mapping`);
            }
        }
        
        // Last fallback: use GID_0 or 'Unknown Country'
        if (!name || name === 'NA' || name.trim() === '') {
            if (props.GID_0) {
                name = String(props.GID_0);
                console.log(`⚠️ Using GID_0 as country name: ${name}`);
            } else {
                name = 'Unknown Country';
                console.error('❌ No GID_0 found, cannot determine country name');
            }
        }
        
        console.log(`✅ Returning country name: ${name}`);
        return name;
    } else if (areaType === 'state' || areaType === 'administration') {
        // Try multiple possible property names for state/province name
        // Priority: NL_NAME_1 (local name) > NAME_1 (English) > others
        return props.NL_NAME_1 && props.NL_NAME_1 !== 'NA' ? props.NL_NAME_1 :
               props.NAME_1 || 
               props.NAME_EN || 
               props.name_1 || 
               props.name_en ||
               props.name || 
               props.STATE || 
               props.State ||
               props.PROVINCE ||
               props.Province ||
               props.NAME || 
               (props.GID_1 ? props.GID_1 : 'Unknown State');
    } else {
        // Try multiple possible property names for city/county name
        // Priority: NL_NAME_2 (local name) > NAME_2 (English) > others
        const name2 = (props.NL_NAME_2 && props.NL_NAME_2 !== 'NA') ? props.NL_NAME_2 :
                      props.NAME_2 || props.name_2 || props.NAME_EN || props.name_en || props.name;
        const name1 = (props.NL_NAME_1 && props.NL_NAME_1 !== 'NA') ? props.NL_NAME_1 :
                      props.NAME_1 || props.name_1;
        
        if (name2) {
            return name1 ? `${name1} - ${name2}` : name2;
        }
        
        return props.NAME || 
               props.CITY || 
               props.City ||
               props.COUNTY ||
               props.County ||
               (props.GID_2 ? props.GID_2 : 'Unknown City');
    }
}

/**
 * Modified loadBoundarySourceForType to use GADM
 * This is the entry point called from app-enhanced.js
 */
async function loadBoundarySourceForTypeGADM(areaType, createVisibleLayer = false) {
    // Use the helper function to get source type key
    const sourceTypeKey = areaType === 'country' ? 'adm0' : 
                         areaType === 'state' ? 'adm1' : 'adm2';
    
    // Skip if already loaded
    if (appState.sources[sourceTypeKey] && appState.sources[sourceTypeKey].loaded) {
        if (createVisibleLayer) {
            createGADMVisibleLayer(areaType);
        }
        return;
    }
    
    try {
        // Load GADM source
        await loadGADMSource(areaType);
        
        // Create visible layer if requested
        if (createVisibleLayer) {
            // Small delay to ensure source is fully loaded
            setTimeout(() => {
                createGADMVisibleLayer(areaType);
                
                // Show layer if it's the current active type or in administration mode
                if (appState.currentAreaType === areaType || 
                    (appState.currentAreaType === 'administration' && (areaType === 'state' || areaType === 'city'))) {
                    if (typeof showBoundaryLayer === 'function') {
                        showBoundaryLayer(areaType);
                    }
                }
            }, 100);
        }
        
    } catch (error) {
        console.error(`Failed to load GADM source for ${areaType}:`, error);
        throw error;
    }
}

// Export functions for use in main app
if (typeof window !== 'undefined') {
    window.GADM_LOADER = {
        loadBoundarySourceForType: loadBoundarySourceForTypeGADM,
        createVisibleLayer: createGADMVisibleLayer,
        getAreaId: getGADMAreaId,
        getAreaName: getGADMAreaName,
        config: GADM_CONFIG
    };
}

