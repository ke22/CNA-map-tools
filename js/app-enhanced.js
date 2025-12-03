/**
 * Enhanced Map Tool - News Editor Version
 * Primary Features:
 * - Click-to-select boundaries
 * - Simplified UI
 * - High-quality export
 * - Optimized for 1-3 countries
 */

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded');
    
    // Validate Mapbox token
    if (!CONFIG.MAPBOX.TOKEN || CONFIG.MAPBOX.TOKEN === 'YOUR_MAPBOX_ACCESS_TOKEN') {
        showToast('Please set your Mapbox access token in config.js!', 'error');
        return;
    }

    // Set Mapbox access token
    mapboxgl.accessToken = CONFIG.MAPBOX.TOKEN;

    // Initialize application
    console.log('🚀 Initializing app...');
    initializeApp();
    
    // Also try binding events after a short delay as backup
    setTimeout(function() {
        console.log('🔧 Backup: Re-checking button setup...');
        const buttons = document.querySelectorAll('.btn-toggle[data-type]');
        console.log(`   Found ${buttons.length} buttons`);
        
        // Re-setup buttons if needed
        if (buttons.length > 0) {
            setupAreaTypeButtons();
        }
    }, 1000);
});

// Application State
const appState = {
    map: null,
    currentAreaType: 'country', // 'country' | 'administration'
    administrationLevel: null, // 'state' | 'city' | null (detected on click)
    preferredAdminLevel: 'both', // 'state' | 'city' | 'both' - User's preference for admin level selection
    selectedAreas: [], // Array of { id, name, type, color, layerId }
    selectedCountry: null, // { id, name } - Selected country for two-layer mode
    currentColor: '#6CA7A1', // Default: Tropical Teal
    mapStyle: 'light',
    labelsVisible: true,
    labelLayerIds: [], // Cache label layer IDs for performance
    boundaryMode: 'fill', // 'fill' | 'line'
    sources: {
        adm0: null,
        adm1: null,
        adm2: null
    },
    // Overlay mode settings (for country + admin area overlay)
    overlayMode: false,           // Whether admin areas overlay on country
    countryLayerIds: [],          // Track country color layers
    adminLayerIds: []             // Track admin area overlay layers
};

// Initialize Application
function initializeApp() {
    initializeMap();
    initializeUI();
    setupEventListeners();
}

/**
 * Initialize Mapbox Map
 */
function initializeMap() {
    const style = getMapStyleUrl('light');
    
    appState.map = new mapboxgl.Map({
        container: 'map',
        style: style,
        center: CONFIG.MAP.DEFAULT_CENTER || [121.533, 25.057],
        zoom: CONFIG.MAP.DEFAULT_ZOOM || 3,
        minZoom: CONFIG.MAP.MIN_ZOOM || 1,
        maxZoom: CONFIG.MAP.MAX_ZOOM || 18,
        projection: 'globe' // Enable globe projection for better global view
    });

    // Wait for map to load
    appState.map.on('load', function() {
        // Set space-like background for Globe Sky (behind the earth only)
        setGlobeSkyBackground();
        
        loadBoundarySources();
        
        // Cache label layer IDs when map loads
        cacheLabelLayerIds();
        
        hideLoading();
        
        // Create initial visible boundary layer for country
        setTimeout(() => {
            if (appState.sources.adm0 && appState.sources.adm0.loaded) {
                createVisibleBoundaryLayer('country');
            }
        }, 500);
        
        // Hide click instructions after first selection
        if (appState.selectedAreas.length > 0) {
            hideClickInstructions();
        }
    });

    // Handle map clicks for area selection
    // Handle map clicks - with improved detection
    appState.map.on('click', handleMapClick);
    
    // Also add mousedown for better click detection
    appState.map.on('mousedown', function(e) {
        // This helps with click detection
    });
    
    // Handle map mouse move for hover effects
    appState.map.on('mousemove', handleMapHover);
    
    // Handle errors - but don't log every error to avoid spam
    appState.map.on('error', function(e) {
        // Only log if it's not a layer insertion error (common and harmless)
        if (e.error && e.error.message && !e.error.message.includes('layer') && !e.error.message.includes('before')) {
            console.error('Map error:', e.error.message);
        }
    });
}

/**
 * Get Mapbox style URL
 */
function getMapStyleUrl(styleName) {
    const styleMap = {
        'light': 'mapbox://styles/mapbox/light-v11',
        'satellite': 'mapbox://styles/mapbox/satellite-v9',
        'streets': 'mapbox://styles/mapbox/streets-v12',
        'dark': 'mapbox://styles/mapbox/dark-v11'
    };
    return styleMap[styleName] || styleMap['light'];
}

/**
 * Load Boundary Sources (Mapbox Boundaries) - Start with country only
 */
function loadBoundarySources() {
    // Load country boundaries first (always needed)
    loadBoundarySourceForType('country', true); // true = create visible layer
}

/**
 * Load boundary source for specific type and create visible layer
 * Uses Mapbox Boundaries
 */
async function loadBoundarySourceForType(areaType, createVisibleLayer = false) {
    const sourceTypeKey = getSourceTypeKey(areaType);
    
    // Skip if already loaded (unless we need to create visible layer)
    if (appState.sources[sourceTypeKey] && appState.sources[sourceTypeKey].loaded && !createVisibleLayer) {
        // Source loaded, but check if visible layer exists
        if (createVisibleLayer) {
            createVisibleBoundaryLayer(areaType);
        }
        return;
    }
    
    // Hybrid approach: 
    // - Country: Use Mapbox Boundaries (free tier)
    // - State/City: Use country-specific data (much smaller files, faster loading)
    if (areaType === 'state' || areaType === 'city') {
        // Check if a country is selected for two-layer mode
        // Skip country-specific files - they usually don't exist
        // Directly use global GADM data which filters by country automatically
        
        // Fallback: Try global GADM data (if no country selected or country loader unavailable)
        if (window.GADM_LOADER) {
            console.log(`🔄 Using global GADM data for ${areaType}`);
            try {
                await window.GADM_LOADER.loadBoundarySourceForType(areaType, createVisibleLayer);
                console.log(`✅ Successfully loaded GADM data for ${areaType}`);
                return;
            } catch (error) {
                console.warn(`⚠️ Failed to load GADM data for ${areaType}:`, error.message);
            }
        }
        
        throw new Error(`行政區數據不可用。請先選擇一個國家，或準備 GADM 數據文件。`);
    }
    
    // For country: Use Mapbox Boundaries (free tier)
    const sourceId = getSourceIdForType(areaType);
    const sourceUrl = getSourceUrlForType(areaType);
    
    if (!sourceUrl) {
        console.warn(`No source URL for ${areaType}`);
        return;
    }
    
    // Check if source already exists
    if (appState.map.getSource(sourceId)) {
        appState.sources[sourceTypeKey] = {
            id: sourceId,
            loaded: true
        };
        
        // Create visible layer if requested
        if (createVisibleLayer) {
            createVisibleBoundaryLayer(areaType);
        }
        
        discoverSourceLayers(sourceId, sourceTypeKey);
        return;
    }
    
    try {
        // Add source
        appState.map.addSource(sourceId, {
            type: 'vector',
            url: sourceUrl
        });

        // Multiple event handlers to catch source loading
        appState.map.once('sourcedata', function(e) {
            if (e.sourceId === sourceId && e.isSourceLoaded) {
                appState.sources[sourceTypeKey] = {
                    id: sourceId,
                    loaded: true
                };
                
                // Discover source layers first
                discoverSourceLayers(sourceId, sourceTypeKey);
                
                // Create visible layer after source is loaded and layers discovered
                if (createVisibleLayer) {
                    // Longer delay to ensure layers are discovered
                    setTimeout(() => {
                        ensureBoundaryLayerExists(areaType);
                        // Show the layer if it's the current active type
                        if (appState.currentAreaType === areaType) {
                            showBoundaryLayer(areaType);
                        }
                    }, 500);
                }
                
                console.log(`✅ Source ${sourceId} loaded successfully`);
            }
        });
        
        // Also listen for source loaded event
        appState.map.once('data', function(e) {
            if (e.sourceId === sourceId && e.isSourceLoaded) {
                if (!appState.sources[sourceTypeKey]) {
                    appState.sources[sourceTypeKey] = {
                        id: sourceId,
                        loaded: true
                    };
                    discoverSourceLayers(sourceId, sourceTypeKey);
                }
            }
        });

        // Handle source errors (including 402 Payment Required)
        appState.map.once('error', function(e) {
            if (e.error && e.error.message && e.error.message.includes(sourceId)) {
                const is402 = e.error.status === 402 || e.error.message.includes('402');
                if (is402) {
                    console.warn(`⚠️ ACCESS DENIED (402): ${sourceId} requires paid Mapbox access. Free tier only includes country boundaries.`);
                } else {
                    console.warn(`⚠️ Source ${sourceId} failed to load:`, e.error.message);
                }
                appState.sources[sourceTypeKey] = {
                    id: sourceId,
                    loaded: false,
                    accessible: !is402,
                    error: is402 ? '402 - Payment Required (upgrade Mapbox account for state/city boundaries)' : e.error.message
                };
            }
        });
        
        // Also listen for network errors
        window.addEventListener('error', function(e) {
            if (e.target && e.target.src && e.target.src.includes(sourceId) && e.target.src.includes('402')) {
                console.warn(`⚠️ 402 ERROR: ${sourceId} - This source requires paid Mapbox access.`);
                if (appState.sources[sourceTypeKey]) {
                    appState.sources[sourceTypeKey].accessible = false;
                    appState.sources[sourceTypeKey].error = '402 - Payment Required';
                }
            }
        }, true);

    } catch (error) {
        // Check if source already exists (from previous attempt)
        if (error.message && error.message.includes('already exists')) {
            appState.sources[sourceTypeKey] = {
                id: sourceId,
                loaded: true
            };
            if (createVisibleLayer) {
                createVisibleBoundaryLayer(areaType);
            }
        } else {
            console.error(`Error loading source ${sourceId}:`, error);
            appState.sources[sourceTypeKey] = {
                id: sourceId,
                loaded: false,
                error: error.message
            };
        }
    }
}

/**
 * Create visible boundary layer (transparent but clickable)
 * Uses shared source - layer references existing source
 */
function createVisibleBoundaryLayer(areaType) {
    const layerId = `visible-boundaries-${areaType}`;
    const sourceId = getSourceIdForType(areaType);
    const sourceLayer = getSourceLayerForType(areaType);
    
    // Check if layer already exists
    if (appState.map.getLayer(layerId)) {
        return true; // Already exists
    }
    
    // Check if source exists (must exist before creating layer)
    if (!appState.map.getSource(sourceId)) {
        console.log(`Source ${sourceId} not available yet for ${areaType}`);
        return false;
    }
    
    try {
        // Create layer that references the existing shared source
        const layerOptions = {
            id: layerId,
            type: 'fill',
            source: sourceId, // Reference to existing source (not inline)
            'source-layer': sourceLayer,
            paint: {
                'fill-color': 'rgba(0,0,0,0)', // Transparent but clickable
                'fill-opacity': 0
            }
        };
        
        // Add layer - Mapbox will place it automatically
        appState.map.addLayer(layerOptions);
        
        // Set visibility based on current area type
        const visibility = appState.currentAreaType === areaType ? 'visible' : 'none';
        appState.map.setLayoutProperty(layerId, 'visibility', visibility);
        
        console.log(`✅ Created visible boundary layer for ${areaType} (visibility: ${visibility})`);
        return true;
    } catch (error) {
        // Only log non-trivial errors
        if (error.message && !error.message.includes('already exists') && !error.message.includes('source')) {
            console.warn(`Could not create layer ${layerId}:`, error.message);
        }
        return false;
    }
}

/**
 * Get source URL for type
 */
function getSourceUrlForType(areaType) {
    const map = {
        'country': 'mapbox://mapbox.country-boundaries-v1',
        'state': 'mapbox://mapbox.boundaries-adm1-v3',
        'city': 'mapbox://mapbox.boundaries-adm2-v3'
    };
    return map[areaType];
}

/**
 * Discover source layers dynamically
 */
function discoverSourceLayers(sourceId, type) {
    // This will be called when source is loaded
    // Try multiple methods to discover layers
    setTimeout(() => {
        try {
            const source = appState.map.getSource(sourceId);
            
            // Method 1: Check vectorLayerIds property
            if (source && source.vectorLayerIds) {
                console.log(`✅ Source ${sourceId} layers (vectorLayerIds):`, source.vectorLayerIds);
                if (!appState.sources[type]) appState.sources[type] = {};
                appState.sources[type].layers = source.vectorLayerIds;
                return;
            }
            
            // Method 2: Query a sample feature to discover structure
            try {
                const sampleFeatures = appState.map.querySourceFeatures(sourceId, {
                    sourceLayer: null, // Query all layers
                    limit: 1
                });
                
                if (sampleFeatures.length > 0) {
                    const feature = sampleFeatures[0];
                    console.log(`Sample feature from ${sourceId}:`, {
                        sourceLayer: feature.sourceLayer,
                        properties: Object.keys(feature.properties).slice(0, 10)
                    });
                    
                    // Try to query with different potential layer names
                    const potentialLayers = [
                        'boundaries_admin_1', 'boundaries_admin1', 'admin_1', 'admin1',
                        'boundaries_admin_2', 'boundaries_admin2', 'admin_2', 'admin2',
                        'boundaries_adm1', 'boundaries_adm2',
                        'country_boundaries', 'boundaries_adm0'
                    ];
                    
                    const foundLayers = [];
                    potentialLayers.forEach(layerName => {
                        try {
                            const test = appState.map.querySourceFeatures(sourceId, {
                                sourceLayer: layerName,
                                limit: 1
                            });
                            if (test.length > 0) {
                                foundLayers.push(layerName);
                            }
                        } catch (e) {
                            // Layer doesn't exist
                        }
                    });
                    
                    if (foundLayers.length > 0) {
                        console.log(`✅ Found layers for ${sourceId}:`, foundLayers);
                        if (!appState.sources[type]) appState.sources[type] = {};
                        appState.sources[type].layers = foundLayers;
                    } else if (feature.sourceLayer) {
                        console.log(`✅ Using discovered layer: ${feature.sourceLayer}`);
                        if (!appState.sources[type]) appState.sources[type] = {};
                        appState.sources[type].layers = [feature.sourceLayer];
                    }
                }
            } catch (queryError) {
                console.warn(`Could not query source features for ${sourceId}:`, queryError);
            }
            
        } catch (error) {
            console.warn(`Could not discover layers for ${sourceId}:`, error);
        }
    }, 1500); // Wait a bit longer for source to be fully ready
}

/**
 * Handle Map Click - IMPROVED VERSION
 * Tries all boundary levels (city → state → country) to find what was clicked
 */
function handleMapClick(e) {
    console.log('🖱️ Map clicked at:', e.point);
    
    // Try to detect what was clicked (try all levels)
    const detected = detectClickedBoundary(e.point);
    
    if (detected) {
        const { feature, areaType, areaId, areaName } = detected;
        
        console.log(`✅ Detected: ${areaName} (${areaType})`);
        
        // Two-layer mode: If country selected, save it
        if (areaType === 'country') {
            appState.selectedCountry = { id: areaId, name: areaName };
            console.log(`🌍 Selected country for two-layer mode: ${areaName} (${areaId})`);
            
            // If in administration mode, immediately load state/city boundaries for this country
            if (appState.currentAreaType === 'administration') {
                console.log(`🔄 Administration mode active - Loading administrative boundaries for ${areaName}...`);
                loadStateCityForCountry(areaId);
            } else {
                // If in country mode, suggest switching to administration mode
                console.log(`💡 Tip: Switch to "行政區" mode to select states/cities within ${areaName}`);
                showToast(`已選擇國家：${areaName}。請切換到「行政區」模式以選擇州/省或縣市。`, 'info', 3000);
            }
        }
        
        // In administration mode, allow selecting state/city even without country
        // But if country is selected, verify it matches
        if (appState.currentAreaType === 'administration' && 
            (areaType === 'state' || areaType === 'city')) {
            const props = feature.properties || {};
            const countryCode = props.GID_0 || props.COUNTRY;
            
            // If country is already selected, verify match
            if (appState.selectedCountry) {
                if (countryCode && countryCode !== appState.selectedCountry.id) {
                    showToast(`此行政區不屬於已選定的國家 ${appState.selectedCountry.name}。將更新選定國家。`, 'info');
                    // Update selected country
                    appState.selectedCountry = { 
                        id: countryCode, 
                        name: props.COUNTRY || countryCode 
                    };
                }
            } else {
                // No country selected yet, select it automatically
                if (countryCode) {
                    appState.selectedCountry = { 
                        id: countryCode, 
                        name: props.COUNTRY || countryCode 
                    };
                    console.log(`🌍 Auto-selected country: ${appState.selectedCountry.name} (${countryCode})`);
                    // Show country layer
                    ensureBoundaryLayerExists('country');
                    showBoundaryLayer('country');
                }
            }
        }
        
        // Check if already selected
        const existing = appState.selectedAreas.find(a => a.id === areaId && a.type === areaType);
        
        const color = existing ? existing.color : appState.currentColor;
        showColorPickerPopup(e.point, areaId, areaName, areaType, color);
        
        hideClickInstructions();
    } else {
        console.log('❌ No boundary detected at click location. Try clicking directly on boundary lines.');
    }
}

/**
 * Detect which boundary was clicked
 * If in 'administration' mode, tries city → state
 * Otherwise tries the current area type
 */
function detectClickedBoundary(point) {
    const currentType = appState.currentAreaType;
    
    // If administration mode, try both levels
    if (currentType === 'administration') {
        // Check if we have selected country and data loaded
        if (appState.selectedCountry) {
            const stateSourceId = `country-state-${appState.selectedCountry.id}`;
            const citySourceId = `country-city-${appState.selectedCountry.id}`;
            const hasStateSource = !!appState.map.getSource(stateSourceId);
            const hasCitySource = !!appState.map.getSource(citySourceId);
            const hasStateLayer = !!appState.map.getLayer('visible-boundaries-state');
            const hasCityLayer = !!appState.map.getLayer('visible-boundaries-city');
            
            console.log(`🔍 Administration mode - Checking data availability:`);
            console.log(`   Selected country: ${appState.selectedCountry.name} (${appState.selectedCountry.id})`);
            console.log(`   State source (${stateSourceId}): ${hasStateSource ? '✅' : '❌'}`);
            console.log(`   City source (${citySourceId}): ${hasCitySource ? '✅' : '❌'}`);
            console.log(`   State layer: ${hasStateLayer ? '✅' : '❌'}`);
            console.log(`   City layer: ${hasCityLayer ? '✅' : '❌'}`);
            
            // Also check for GADM sources as fallback
            const hasGADMState = !!appState.map.getSource('gadm-state');
            const hasGADMCity = !!appState.map.getSource('gadm-city');
            console.log(`   GADM state source: ${hasGADMState ? '✅' : '❌'}`);
            console.log(`   GADM city source: ${hasGADMCity ? '✅' : '❌'}`);
            
            // If no data loaded, try to load it
            if (!hasStateSource && !hasCitySource && !hasGADMState && !hasGADMCity) {
                console.log(`⚠️ No administrative data loaded yet. Loading for ${appState.selectedCountry.name}...`);
                loadStateCityForCountry(appState.selectedCountry.id);
                showToast(`正在加載 ${appState.selectedCountry.name} 的行政區數據，請稍候...`, 'info', 2000);
                return null; // Return null so user can try again after data loads
            }
        }
        
        // Based on user's preferred admin level
        if (appState.preferredAdminLevel === 'state') {
            // Only try state (province/state level)
            const stateResult = tryBoundaryLevel(point, 'state');
            if (stateResult) {
                appState.administrationLevel = 'state';
                return stateResult;
            }
        } else if (appState.preferredAdminLevel === 'city') {
            // Only try city (city level)
            const cityResult = tryBoundaryLevel(point, 'city');
            if (cityResult) {
                appState.administrationLevel = 'city';
                return cityResult;
            }
        } else {
            // 'both' - Try city first (smallest/most specific), then state
            const cityResult = tryBoundaryLevel(point, 'city');
            if (cityResult) {
                appState.administrationLevel = 'city';
                return cityResult;
            }
            
            // Try state
            const stateResult = tryBoundaryLevel(point, 'state');
            if (stateResult) {
                appState.administrationLevel = 'state';
                return stateResult;
            }
        }
        
        // If no results but in administration mode, give helpful message
        if (appState.selectedCountry) {
            console.log(`⚠️ No administrative area detected at click location.`);
            console.log(`   Selected country: ${appState.selectedCountry.name}`);
            console.log(`   Possible reasons:`);
            console.log(`   - Data is still loading (check console for loading messages)`);
            console.log(`   - Clicked location is outside ${appState.selectedCountry.name}`);
            console.log(`   - Try clicking directly on boundary lines`);
            console.log(`   - Wait a few seconds for data to fully load`);
            
            showToast(`無法檢測到行政區。數據可能還在加載中，請稍候或嘗試點擊邊界線。`, 'info', 4000);
        } else {
            console.log(`💡 Tip: Select a country first, then click on administrative areas`);
            showToast(`請先在"國家"模式下選擇一個國家，或等待行政區數據加載完成`, 'info', 4000);
        }
        
        return null;
    }
    
    // For country mode, just try country
    if (currentType === 'country') {
        return tryBoundaryLevel(point, 'country');
    }
    
    return null;
}

/**
 * Try to detect boundary at a specific level
 */
function tryBoundaryLevel(point, areaType) {
    const sourceTypeKey = getSourceTypeKey(areaType);
    const layerId = `visible-boundaries-${areaType}`;
    
    // Check if Mapbox source is loaded
    const hasMapboxSource = appState.sources[sourceTypeKey]?.loaded;
    
    // For state/city, also check country-specific source
    let hasCountrySource = false;
    if ((areaType === 'state' || areaType === 'city') && appState.selectedCountry) {
        const countrySourceId = `country-${areaType}-${appState.selectedCountry.id}`;
        hasCountrySource = !!appState.map.getSource(countrySourceId);
    }
    
    // Also check GADM source
    const gadmSourceId = `gadm-${areaType}`;
    const hasGADMSource = !!appState.map.getSource(gadmSourceId);
    
    if (!hasMapboxSource && !hasCountrySource && !hasGADMSource) {
        // Try to load it
        console.log(`Source not loaded for ${areaType}, loading...`);
        loadBoundarySourceForType(areaType, true);
        return null;
    }
    
    // Ensure layer exists and is visible
    if (!appState.map.getLayer(layerId)) {
        // Layer doesn't exist - try to create it
        console.log(`ℹ️ Layer ${layerId} does not exist yet, attempting to create...`);
        
        // Try to create it (may still fail if source not ready)
        ensureBoundaryLayerExists(areaType);
        
        // Wait a moment and check again
        // For now, return null - layer will be available after data loads
        if (areaType === 'state' || areaType === 'city') {
            if (!appState.selectedCountry) {
                console.log(`💡 提示：請先選擇一個國家（在"國家"模式下點擊），然後再切換到"行政區"模式`);
                showToast('請先在"國家"模式下選擇一個國家，或等待行政區數據加載完成', 'info', 4000);
            } else {
                console.log(`💡 行政區數據正在為 ${appState.selectedCountry.name} 加載中，請稍候...`);
                showToast(`正在加載 ${appState.selectedCountry.name} 的行政區數據，請稍候...`, 'info', 3000);
            }
        }
        return null;
    }
    
    // CRITICAL: Ensure layer is visible before querying
    const visibility = appState.map.getLayoutProperty(layerId, 'visibility');
    if (visibility !== 'visible') {
        console.log(`⚠️  Layer ${layerId} is not visible (${visibility}), making visible...`);
        showBoundaryLayer(areaType);
        // Return null and let user click again - layer needs time to render
        return null;
    }
    
    // Query features (this function now handles all cases)
    const features = queryFeaturesAtPoint(point, areaType);
    
    if (features.length > 0) {
        const feature = features[0];
        
        // Debug: Log feature details
        console.log(`📋 Using feature from source: ${feature.source}`);
        console.log(`📋 Feature properties:`, {
            GID_0: feature.properties?.GID_0,
            COUNTRY: feature.properties?.COUNTRY,
            allKeys: Object.keys(feature.properties || {}).slice(0, 10)
        });
        
        const areaId = getAreaId(feature, areaType);
        console.log(`📋 Area ID: ${areaId}`);
        
        const areaName = getAreaName(feature, areaType);
        console.log(`📋 Area Name: ${areaName}`);
        
        console.log(`✅ Detected ${areaType}: ${areaName} (${areaId})`);
        
        return {
            feature,
            areaType,
            areaId,
            areaName
        };
    }
    
    return null;
}

/**
 * Handle Map Hover - Visual feedback
 */
function handleMapHover(e) {
    const currentType = appState.currentAreaType;
    
    // If in administration mode, check both state and city
    if (currentType === 'administration') {
        const cityFeatures = queryFeaturesAtPoint(e.point, 'city');
        const stateFeatures = queryFeaturesAtPoint(e.point, 'state');
        const hasFeatures = cityFeatures.length > 0 || stateFeatures.length > 0;
        appState.map.getCanvas().style.cursor = hasFeatures ? 'pointer' : '';
    } else {
        const features = queryFeaturesAtPoint(e.point, currentType);
        appState.map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : '';
    }
    
    // Optional: Add hover highlight
    // This can be implemented later for better UX
}

// Track layer creation to prevent loops
const layerCreationState = {};

/**
 * Query features at point - IMPROVED VERSION
 * Queries from layer, with better error handling
 */
function queryFeaturesAtPoint(point, areaType) {
    const layerId = `visible-boundaries-${areaType}`;
    const lineLayerId = `${layerId}-lines`;
    
    console.log(`🔍 Querying for ${areaType} at point:`, point);
    console.log(`   Looking for layer: ${layerId}`);
    
    try {
        // Step 1: Check if GADM source exists and query directly from GADM layers
        const gadmSourceId = `gadm-${areaType}`;
        if (appState.map.getSource(gadmSourceId)) {
            console.log(`   ✅ GADM source exists: ${gadmSourceId}`);
            
            // First, try querying from GADM layers directly (most reliable)
            const gadmLayerIds = [layerId, lineLayerId];
            for (const lid of gadmLayerIds) {
                if (appState.map.getLayer(lid)) {
                    const visibility = appState.map.getLayoutProperty(lid, 'visibility');
                    if (visibility === 'visible') {
                        const layerFeatures = appState.map.queryRenderedFeatures(point, {
                            layers: [lid],
                            radius: 50
                        });
                        
                        if (layerFeatures.length > 0) {
                            // Verify these are actually GADM features
                            const gadmFeatures = layerFeatures.filter(f => {
                                const props = f.properties || {};
                                const hasGID = props.GID_0 || props.GID_1 || props.GID_2;
                                return hasGID && f.source === gadmSourceId;
                            });
                            
                            if (gadmFeatures.length > 0) {
                                console.log(`✅ Found ${gadmFeatures.length} GADM features from layer ${lid}`);
                                return gadmFeatures;
                            }
                        }
                    }
                }
            }
            
            // Fallback: Query all features and filter for GADM
            const allFeatures = appState.map.queryRenderedFeatures(point, {
                radius: 100 // Increased radius for better click detection
            });
            
            // Filter to only GADM source features
            const gadmFeatures = allFeatures.filter(f => {
                const props = f.properties || {};
                // Check if from GADM source
                if (f.source && f.source === gadmSourceId) {
                    // Check level match
                    if (areaType === 'country' && props.GID_0) return true;
                    if (areaType === 'state' && props.GID_1) return true;
                    if (areaType === 'city' && props.GID_2) return true;
                }
                return false;
            });
            
            if (gadmFeatures.length > 0) {
                console.log(`✅ Found ${gadmFeatures.length} features from GADM source ${gadmSourceId}`);
                return gadmFeatures;
            } else {
                console.warn(`⚠️ GADM source exists but no features found at point`);
            }
        }
        
        // Step 2: Query from visible boundary layers (works for Mapbox, GADM, and country-specific)
        const layerIds = [layerId, lineLayerId];
        let features = [];
        
        for (const lid of layerIds) {
            if (appState.map.getLayer(lid)) {
                const visibility = appState.map.getLayoutProperty(lid, 'visibility');
                console.log(`   Checking layer ${lid}: visibility = ${visibility}`);
                
                if (visibility === 'visible') {
                    // Query from this specific layer with increased radius
                    const layerFeatures = appState.map.queryRenderedFeatures(point, {
                        layers: [lid],
                        radius: 100 // Increased radius for better click detection
                    });
                    
                    console.log(`   Layer ${lid} query returned ${layerFeatures.length} features`);
                    
                    if (layerFeatures.length > 0) {
                        console.log(`✅ Found ${layerFeatures.length} features from layer ${lid}`);
                        features = layerFeatures;
                        break; // Use first layer with features
                    }
                }
            }
        }
        
        // Step 3: If no features from specific layers, query all and filter
        if (features.length === 0) {
            console.log(`   No features from specific layers, querying all features...`);
            const allFeatures = appState.map.queryRenderedFeatures(point, {
                radius: 100 // Increased radius for better click detection
            });
            
            console.log(`📊 Total features found: ${allFeatures.length}`);
            
            // Debug: Log all sources found
            const sourcesFound = [...new Set(allFeatures.map(f => f.source).filter(Boolean))];
            console.log(`   Sources found: ${sourcesFound.join(', ')}`);
            
            // Filter for features from our boundary layers
            features = allFeatures.filter(f => {
                const props = f.properties || {};
                
                // Priority 1: Accept if from our visible boundary layers
                if (f.layer && (f.layer.id === layerId || f.layer.id === lineLayerId)) {
                    console.log(`   ✅ MATCHED: Our layer (${f.layer.id})`);
                    return true;
                }
                
                // Priority 2: Accept if from GADM source (for all levels)
                if (f.source && f.source === gadmSourceId) {
                    console.log(`   ✅ MATCHED: GADM source (${f.source})`);
                    return true;
                }
                
                // Priority 3: Accept if has GID properties (GADM data - all levels)
                if (props.GID_0 || props.GID_1 || props.GID_2) {
                    // Check level match
                    if (areaType === 'country' && props.GID_0) {
                        console.log(`   ✅ MATCHED: GADM country feature (GID_0: ${props.GID_0})`);
                        return true;
                    }
                    if (areaType === 'state' && props.GID_1) {
                        console.log(`   ✅ MATCHED: GADM state feature (GID_1: ${props.GID_1})`);
                        return true;
                    }
                    if (areaType === 'city' && props.GID_2) {
                        console.log(`   ✅ MATCHED: GADM city feature (GID_2: ${props.GID_2})`);
                        return true;
                    }
                }
                
                // Priority 4: Accept if from country-specific source (for state/city)
                if ((areaType === 'state' || areaType === 'city') && 
                    appState.selectedCountry &&
                    f.source && f.source.includes(`country-${areaType}-${appState.selectedCountry.id}`)) {
                    console.log(`   ✅ MATCHED: Country-specific source (${f.source})`);
                    return true;
                }
                
                // Reject Mapbox base layers (but log for debugging)
                if (f.source === 'composite' && f.layer?.id) {
                    const layerIdLower = f.layer.id.toLowerCase();
                    if (layerIdLower.includes('landuse') || layerIdLower.includes('water') || 
                        layerIdLower.includes('building') || layerIdLower.includes('road') ||
                        layerIdLower.includes('place') || layerIdLower.includes('poi') ||
                        layerIdLower.includes('admin-1-boundary')) {
                        // Silently reject - these are expected to be filtered
                        return false;
                    }
                }
                
                // Reject everything else
                return false;
            });
        }
        
        console.log(`📊 Filtered to ${features.length} ${areaType} features`);
        
        // Debug: Log first feature if found
        if (features.length > 0) {
            const firstFeature = features[0];
            console.log(`🔍 First feature details:`, {
                source: firstFeature.source,
                layer: firstFeature.layer?.id,
                hasProperties: !!firstFeature.properties,
                propertyKeys: firstFeature.properties ? Object.keys(firstFeature.properties).slice(0, 10) : [],
                GID_0: firstFeature.properties?.GID_0,
                GID_1: firstFeature.properties?.GID_1,
                GID_2: firstFeature.properties?.GID_2,
                COUNTRY: firstFeature.properties?.COUNTRY
            });
        }
        
        // If still no features, provide helpful diagnostic info
        if (features.length === 0) {
            console.log(`⚠️  No ${areaType} features found at click point`);
            
            // Check what sources exist
            const gadmSourceId = `gadm-${areaType}`;
            const hasGADMSource = appState.map.getSource(gadmSourceId);
            const hasLayer = appState.map.getLayer(layerId);
            const layerVisibility = hasLayer ? appState.map.getLayoutProperty(layerId, 'visibility') : 'not found';
            
            console.log(`   Diagnostic info:`);
            console.log(`   - Layer exists: ${!!hasLayer}`);
            console.log(`   - Layer visibility: ${layerVisibility}`);
            console.log(`   - GADM source exists: ${!!hasGADMSource}`);
            
            if (hasGADMSource) {
                const source = appState.map.getSource(gadmSourceId);
                const sourceData = source._data || source._geojson;
                const featureCount = sourceData && sourceData.features ? sourceData.features.length : 0;
                console.log(`   - GADM source has ${featureCount} features`);
            }
            
            // For state/city, check if country is selected
            if ((areaType === 'state' || areaType === 'city') && !appState.selectedCountry) {
                console.log(`   💡 Tip: Select a country first in "國家" mode, then switch to "行政區" mode`);
            }
            
            console.log(`   💡 Possible reasons:`);
            console.log(`   - Data is still loading (wait a few seconds)`);
            console.log(`   - Clicked location is outside the boundary`);
            console.log(`   - Layer is not fully rendered yet`);
            console.log(`   - Try clicking directly on boundary lines`);
        }
        
        return features || [];
        
    } catch (error) {
        console.error('Error querying features:', error);
        return [];
    }
}

/**
 * Get source ID for area type
 */
function getSourceIdForType(areaType) {
    const map = {
        'country': 'boundaries-adm0',
        'state': 'boundaries-adm1',
        'city': 'boundaries-adm2'
    };
    return map[areaType];
}

/**
 * Get source type key
 */
function getSourceTypeKey(areaType) {
    const map = {
        'country': 'adm0',
        'state': 'adm1',
        'city': 'adm2'
    };
    return map[areaType];
}

/**
 * Get source layer name for type
 * Uses discovered layers if available, falls back to defaults
 */
function getSourceLayerForType(areaType) {
    const sourceTypeKey = getSourceTypeKey(areaType);
    
    // Check if we discovered actual layer names
    if (appState.sources[sourceTypeKey] && appState.sources[sourceTypeKey].layers) {
        const discoveredLayers = appState.sources[sourceTypeKey].layers;
        
        if (areaType === 'country') {
            // Find country layer
            const countryLayer = discoveredLayers.find(l => 
                l.includes('country') || l.includes('boundaries') || l === 'country_boundaries'
            );
            if (countryLayer) return countryLayer;
        } else if (areaType === 'state') {
            // Find state/admin_1 layer
            const stateLayer = discoveredLayers.find(l => 
                l.includes('adm1') || l.includes('admin_1') || l.includes('admin1') ||
                l === 'boundaries_admin_1' || l === 'boundaries_admin1'
            );
            if (stateLayer) return stateLayer;
        } else if (areaType === 'city') {
            // Find city/admin_2 layer
            const cityLayer = discoveredLayers.find(l => 
                l.includes('adm2') || l.includes('admin_2') || l.includes('admin2') ||
                l === 'boundaries_admin_2' || l === 'boundaries_admin2'
            );
            if (cityLayer) return cityLayer;
        }
    }
    
    // Fallback to default layer names
    const defaultMap = {
        'country': 'country_boundaries',
        'state': 'boundaries_admin_1',  // Common Mapbox Boundaries name
        'city': 'boundaries_admin_2'     // Common Mapbox Boundaries name
    };
    return defaultMap[areaType] || 'country_boundaries';
}

/**
 * Get layer IDs for type - Query all layers for the source
 */
function getLayerIdsForType(areaType) {
    // Return all layers from the style that use our boundary source
    const sourceId = getSourceIdForType(areaType);
    if (!sourceId) return [];
    
    try {
        const style = appState.map.getStyle();
        const layers = style.layers.filter(layer => {
            return layer.source === sourceId || (layer.id && layer.id.includes(sourceId));
        });
        return layers.map(l => l.id);
    } catch (error) {
        return [];
    }
}

/**
 * Get area ID from feature
 * Supports both Mapbox Boundaries and GADM features
 */
function getAreaId(feature, areaType) {
    const props = feature.properties || {};
    
    // Check if this is from country-specific loader
    if ((areaType === 'state' || areaType === 'city') && window.COUNTRY_LOADER && window.COUNTRY_LOADER.getAreaId) {
        return window.COUNTRY_LOADER.getAreaId(feature, areaType);
    }
    
    // Check if this is a GADM feature (has GID properties)
    if (props.GID_0 || props.GID_1 || props.GID_2) {
        if (window.GADM_LOADER && window.GADM_LOADER.getAreaId) {
            return window.GADM_LOADER.getAreaId(feature, areaType);
        }
        // Fallback: Use GID directly
        if (areaType === 'country') return props.GID_0;
        if (areaType === 'state') return props.GID_1 || props.GID_0;
        if (areaType === 'city') return props.GID_2 || props.GID_1 || props.GID_0;
    }
    
    // Mapbox Boundaries format
    if (areaType === 'country') {
        return props.iso_3166_1_alpha_3 || props.ISO_A3;
    } else if (areaType === 'state') {
        return props.iso_3166_2 || props.NAME_1 || feature.id;
    } else {
        return props.NAME_2 || props.name || feature.id;
    }
}

/**
 * Get area name from feature
 * Supports both Mapbox Boundaries and GADM features
 */
function getAreaName(feature, areaType) {
    if (!feature || !feature.properties) {
        console.warn('⚠️ getAreaName: Invalid feature', feature);
        return `Unknown ${areaType}`;
    }
    
    const props = feature.properties || {};
    
    // Debug: Log properties for troubleshooting
    console.log(`🔍 getAreaName called for ${areaType}:`, {
        hasGID_0: !!props.GID_0,
        hasGID_1: !!props.GID_1,
        hasGID_2: !!props.GID_2,
        COUNTRY: props.COUNTRY,
        NAME_0: props.NAME_0,
        allKeys: Object.keys(props).slice(0, 10) // First 10 keys
    });
    
    // Check if this is from country-specific loader
    if ((areaType === 'state' || areaType === 'city') && window.COUNTRY_LOADER && window.COUNTRY_LOADER.getAreaName) {
        const name = window.COUNTRY_LOADER.getAreaName(feature, areaType);
        if (name && name !== 'Unknown State' && name !== 'Unknown City') {
            console.log(`✅ Got name from COUNTRY_LOADER: ${name}`);
            return name;
        }
    }
    
    // Check if this is a GADM feature (has GID properties)
    const isGADM = !!(props.GID_0 || props.GID_1 || props.GID_2);
    if (isGADM) {
        // For country type, check COUNTRY property FIRST (most reliable for GADM)
        if (areaType === 'country') {
            if (props.COUNTRY && props.COUNTRY !== 'NA' && props.COUNTRY.trim() !== '') {
                console.log(`✅ Got country name directly from COUNTRY property: ${props.COUNTRY}`);
                return props.COUNTRY;
            }
        }
        
        // Try GADM_LOADER
        if (window.GADM_LOADER && window.GADM_LOADER.getAreaName) {
            try {
                const name = window.GADM_LOADER.getAreaName(feature, areaType);
                console.log(`🔍 GADM_LOADER.getAreaName returned: "${name}" for ${areaType}`);
                if (name && !name.includes('Unknown') && name.trim() !== '') {
                    console.log(`✅ Got name from GADM_LOADER: ${name}`);
                    return name;
                } else {
                    console.warn(`⚠️ GADM_LOADER returned invalid name: "${name}", trying fallback...`);
                }
            } catch (error) {
                console.error('❌ Error calling GADM_LOADER.getAreaName:', error);
            }
        } else {
            console.warn('⚠️ GADM_LOADER not available:', {
                hasGADM_LOADER: !!window.GADM_LOADER,
                hasGetAreaName: !!(window.GADM_LOADER && window.GADM_LOADER.getAreaName)
            });
        }
        
        // Fallback: Try common property names directly
        if (areaType === 'country') {
            // Try all possible property names
            const name = props.COUNTRY || 
                        props.NAME_0 || 
                        props.name_0 || 
                        props.name_en ||
                        props.name || 
                        props.Country || 
                        props.COUNTRY_NAME ||
                        props.country_name ||
                        props.NAME;
            
            if (name && name !== 'NA' && name.trim() !== '') {
                console.log(`✅ Got country name from properties: ${name}`);
                return name;
            }
            
            // If no name found but has GID_0, try to look up from COUNTRY_CODES mapping
            if (props.GID_0) {
                const gid0 = String(props.GID_0).toUpperCase().trim();
                // Try to get name from COUNTRY_CODES mapping (GID_0 is usually ISO 3166-1 alpha-3)
                if (typeof COUNTRY_CODES !== 'undefined' && COUNTRY_CODES[gid0]) {
                    const countryInfo = COUNTRY_CODES[gid0];
                    const countryName = countryInfo.nameEn || countryInfo.name || gid0;
                    console.log(`✅ Got country name from COUNTRY_CODES mapping: ${countryName} (GID_0: ${gid0})`);
                    return countryName;
                } else {
                    console.warn(`⚠️ GID_0 "${gid0}" not in COUNTRY_CODES mapping. Available codes:`, 
                        typeof COUNTRY_CODES !== 'undefined' ? Object.keys(COUNTRY_CODES).slice(0, 10) : 'COUNTRY_CODES not loaded');
                    // Last resort: use GID_0 as fallback (better than "Unknown Country")
                    console.log(`⚠️ Using GID_0 as country name: ${gid0}`);
                    return gid0;
                }
            }
            
            // Last resort: log all properties for debugging
            console.warn('⚠️ No country name found in properties:', {
                allKeys: Object.keys(props),
                sampleProps: Object.keys(props).slice(0, 20).reduce((acc, key) => {
                    acc[key] = props[key];
                    return acc;
                }, {})
            });
            
            return 'Unknown Country';
        } else if (areaType === 'state') {
            const name = (props.NL_NAME_1 && props.NL_NAME_1 !== 'NA') ? props.NL_NAME_1 :
                        props.NAME_1 || props.name_1 || props.name || props.State || props.STATE;
            if (name) {
                console.log(`✅ Got state name from properties: ${name}`);
                return name;
            }
            return props.GID_1 || 'Unknown State';
        } else {
            const name = (props.NL_NAME_2 && props.NL_NAME_2 !== 'NA') ? props.NL_NAME_2 :
                        props.NAME_2 || props.name_2 || props.name || props.City || props.CITY;
            if (name) {
                console.log(`✅ Got city name from properties: ${name}`);
                return name;
            }
            return props.GID_2 || 'Unknown City';
        }
    }
    
    // Mapbox Boundaries format
    if (areaType === 'country') {
        const name = props.name_en || props.NAME_EN || props.NAME_0 || props.name || props.COUNTRY;
        return name || 'Unknown Country';
    } else if (areaType === 'state') {
        return props.name || props.NAME_1 || 'Unknown State';
    } else {
        return props.name || props.NAME_2 || 'Unknown City';
    }
}

/**
 * Show Color Picker Popup
 */
function showColorPickerPopup(point, areaId, areaName, areaType, currentColor) {
    const popup = document.getElementById('color-picker-popup');
    const areaNameEl = document.getElementById('popup-area-name');
    const colorPicker = document.getElementById('popup-color-picker');
    const applyBtn = document.getElementById('apply-color-btn');
    const cancelBtn = document.getElementById('cancel-color-btn');
    
    // Set area name
    areaNameEl.textContent = areaName;
    
    // Set current color
    colorPicker.value = currentColor;
    
    // Position popup near click point
    const popupRect = popup.getBoundingClientRect();
    const mapContainer = document.querySelector('.map-container');
    const mapRect = mapContainer.getBoundingClientRect();
    
    // Calculate position (center for now, can be improved)
    popup.style.left = '50%';
    popup.style.top = '50%';
    popup.style.display = 'block';
    
    // Setup event listeners
    const applyHandler = () => {
        const selectedColor = colorPicker.value;
        applyColorToArea(areaId, areaName, areaType, selectedColor);
        hideColorPickerPopup();
    };
    
    const cancelHandler = () => {
        hideColorPickerPopup();
    };
    
    // Remove old listeners and add new ones
    applyBtn.replaceWith(applyBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    
    const newApplyBtn = document.getElementById('apply-color-btn');
    const newCancelBtn = document.getElementById('cancel-color-btn');
    
    newApplyBtn.addEventListener('click', applyHandler);
    newCancelBtn.addEventListener('click', cancelHandler);
    
    // Color preset buttons
    setupColorPresets(popup.querySelectorAll('.color-preset'), colorPicker);
    
    // Setup hex color input for popup
    const popupHexInput = document.getElementById('popup-color-hex-input');
    if (popupHexInput) {
        // Sync hex input with color picker
        const syncHexFromPicker = () => {
            popupHexInput.value = colorPicker.value.toUpperCase();
        };
        colorPicker.addEventListener('change', syncHexFromPicker);
        
        // Sync color picker with hex input
        popupHexInput.addEventListener('input', function() {
            const hex = this.value.trim();
            if (/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
                const color = hex.startsWith('#') ? hex : '#' + hex;
                colorPicker.value = color;
            }
        });
        
        // Initialize hex input value
        popupHexInput.value = currentColor.toUpperCase();
        syncHexFromPicker();
    }
}

/**
 * Hide Color Picker Popup
 */
function hideColorPickerPopup() {
    document.getElementById('color-picker-popup').style.display = 'none';
}

/**
 * Apply Color to Area
 */
function applyColorToArea(areaId, areaName, areaType, color) {
    // Check if area already selected
    const existingIndex = appState.selectedAreas.findIndex(
        a => a.id === areaId && a.type === areaType
    );
    
    const layerId = `area-${areaType}-${areaId}`;
    
    if (existingIndex >= 0) {
        // Update existing
        appState.selectedAreas[existingIndex].color = color;
        updateAreaLayer(layerId, color);
        updateSelectedAreasList();
    } else {
        // Add new area
        appState.selectedAreas.push({
            id: areaId,
            name: areaName,
            type: areaType,
            color: color,
            layerId: layerId
        });
        
        createAreaLayer(areaId, areaName, areaType, color, layerId);
        updateSelectedAreasList();
    }
    
    // Update current color
    appState.currentColor = color;
    const colorPicker = document.getElementById('color-picker');
    if (colorPicker) {
        colorPicker.value = color;
    }
    
    // Don't show toast - less annoying
    // showToast(`${areaName} colored successfully`, 'success');
}

/**
 * Create Area Layer with Overlay Support
 */
function createAreaLayer(areaId, areaName, areaType, color, layerId) {
    // Check if GADM source exists (priority)
    const gadmSourceId = `gadm-${areaType}`;
    const hasGADMSource = appState.map.getSource(gadmSourceId);
    
    let sourceId, sourceLayer, filter;
    
    if (hasGADMSource) {
        // Use GADM source (GeoJSON - no source-layer needed)
        sourceId = gadmSourceId;
        sourceLayer = undefined; // GeoJSON sources don't have source-layer
        filter = createFilterForArea(areaId, areaType, true); // true = GADM format
        console.log(`🎨 Creating color layer for GADM: ${sourceId}, areaId: ${areaId}`);
    } else {
        // Use Mapbox source
        sourceId = getSourceIdForType(areaType);
        sourceLayer = getSourceLayerForType(areaType);
        filter = createFilterForArea(areaId, areaType, false); // false = Mapbox format
        
        if (!sourceId || !appState.sources[getSourceTypeKey(areaType)]?.loaded) {
            console.warn(`Source not loaded for ${areaType}`);
            return;
        }
    }
    
    try {
        // Determine if this is an admin layer (for overlay mode)
        const isAdmin = areaType === 'state' || areaType === 'city';
        const isCountry = areaType === 'country';
        
        // Determine layer insertion point for z-ordering (only in overlay mode)
        let insertBefore = undefined;
        if (appState.overlayMode) {
            insertBefore = getInsertionPoint(isAdmin ? 'admin' : 'country');
            console.log(`   Z-order: ${isAdmin ? 'admin' : 'country'} layer, insertBefore: ${insertBefore || 'end'}`);
        }
        
        // Set opacity based on overlay mode and layer type
        let fillOpacity = 0.8; // Default - increased for better visibility
        let lineOpacity = 0.9;
        
        if (appState.overlayMode) {
            if (isAdmin) {
                fillOpacity = 0.9; // Higher opacity for admin overlays
                lineOpacity = 0.95;
            } else if (isCountry) {
                fillOpacity = 0.7; // Lower opacity for country base layer
                lineOpacity = 0.85;
            }
        } else {
            // Non-overlay mode - use higher opacity for better visibility
            fillOpacity = 0.85;
            lineOpacity = 0.9;
        }
        
        // Remove existing layer if present
        if (appState.map.getLayer(layerId)) {
            appState.map.removeLayer(layerId);
            // Remove from tracking arrays
            const adminIndex = appState.adminLayerIds.indexOf(layerId);
            if (adminIndex !== -1) {
                appState.adminLayerIds.splice(adminIndex, 1);
            }
            const countryIndex = appState.countryLayerIds.indexOf(layerId);
            if (countryIndex !== -1) {
                appState.countryLayerIds.splice(countryIndex, 1);
            }
        }
        
        // Add layer
        const paint = appState.boundaryMode === 'fill' 
            ? {
                'fill-color': color,
                'fill-opacity': fillOpacity
            }
            : {
                'line-color': color,
                'line-width': isAdmin && appState.overlayMode ? 1.5 : 2,
                'line-opacity': lineOpacity
            };
        
        const layerDef = {
            id: layerId,
            type: appState.boundaryMode === 'fill' ? 'fill' : 'line',
            source: sourceId,
            filter: filter,
            paint: paint
        };
        
        // Only add source-layer for vector sources (not GeoJSON)
        if (sourceLayer) {
            layerDef['source-layer'] = sourceLayer;
        }
        
        // Add layer with proper z-ordering
        try {
            if (insertBefore && appState.map.getLayer(insertBefore)) {
                appState.map.addLayer(layerDef, insertBefore);
                console.log(`✅ Created color layer: ${layerId} (inserted before ${insertBefore})`);
            } else {
                // Add to top of stack (before labels if they exist, otherwise at end)
                const labelLayers = appState.labelLayerIds;
                if (labelLayers.length > 0 && !insertBefore) {
                    appState.map.addLayer(layerDef, labelLayers[0]);
                    console.log(`✅ Created color layer: ${layerId} (inserted before labels)`);
                } else {
                    appState.map.addLayer(layerDef);
                    console.log(`✅ Created color layer: ${layerId} (added to top)`);
                }
            }
        } catch (err) {
            console.error(`Error adding layer ${layerId}:`, err);
            // Fallback: just add the layer
            appState.map.addLayer(layerDef);
            console.log(`✅ Created color layer: ${layerId} (fallback - added to end)`);
        }
        
        // Track layer IDs for overlay mode
        if (appState.overlayMode) {
            if (isAdmin) {
                if (!appState.adminLayerIds.includes(layerId)) {
                    appState.adminLayerIds.push(layerId);
                }
            } else if (isCountry) {
                if (!appState.countryLayerIds.includes(layerId)) {
                    appState.countryLayerIds.push(layerId);
                }
            }
        }
        
        console.log(`   Filter:`, filter);
        console.log(`   Color: ${color}`);
        console.log(`   Opacity: ${fillOpacity} (fill) / ${lineOpacity} (line)`);
        console.log(`   Layer type: ${appState.boundaryMode}`);
        console.log(`   Paint properties:`, JSON.stringify(paint, null, 2));
        console.log(`   Source: ${sourceId}, SourceLayer: ${sourceLayer || 'none'}`);
        
        // Verify layer was actually added
        setTimeout(() => {
            const addedLayer = appState.map.getLayer(layerId);
            if (addedLayer) {
                console.log(`✅ Layer ${layerId} verified on map`);
                const visibility = appState.map.getLayoutProperty(layerId, 'visibility');
                const paintProps = appState.map.getPaintProperty(layerId, 'fill-color');
                console.log(`   Visibility: ${visibility}, Current color: ${paintProps}`);
                
                // Check if layer is above country layers in overlay mode
                if (appState.overlayMode && isAdmin && appState.countryLayerIds.length > 0) {
                    const allLayers = appState.map.getStyle().layers;
                    const layerIndex = allLayers.findIndex(l => l.id === layerId);
                    appState.countryLayerIds.forEach(countryLayerId => {
                        const countryLayerIndex = allLayers.findIndex(l => l.id === countryLayerId);
                        if (countryLayerIndex >= 0) {
                            if (layerIndex < countryLayerIndex) {
                                console.warn(`⚠️  WARNING: Admin layer ${layerId} is BELOW country layer ${countryLayerId}!`);
                            } else {
                                console.log(`✅ Admin layer ${layerId} is ABOVE country layer ${countryLayerId}`);
                            }
                        }
                    });
                }
            } else {
                console.error(`❌ ERROR: Layer ${layerId} NOT found on map after creation!`);
            }
        }, 500);
        
    } catch (error) {
        console.error(`Error creating layer for ${areaId}:`, error);
        showToast(`Error coloring ${areaName}`, 'error');
    }
}

/**
 * Update Area Layer
 */
function updateAreaLayer(layerId, color) {
    if (!appState.map.getLayer(layerId)) return;
    
    const paintProperty = appState.boundaryMode === 'fill' ? 'fill-color' : 'line-color';
    appState.map.setPaintProperty(layerId, paintProperty, color);
}

/**
 * Determine the correct layer insertion point for z-ordering (overlay mode)
 * This ensures country layers are below admin layers
 */
function getInsertionPoint(layerType) {
    const labelLayers = appState.labelLayerIds;
    
    if (layerType === 'admin') {
        // Admin areas go above ALL country layers, below labels
        // Find the highest country layer to insert above it
        if (appState.countryLayerIds.length > 0) {
            // Get the last country layer (highest in z-order)
            const lastCountryLayer = appState.countryLayerIds[appState.countryLayerIds.length - 1];
            console.log(`   Inserting admin layer above country layer: ${lastCountryLayer}`);
            // Insert after the last country layer - find the layer after it
            const allLayers = appState.map.getStyle().layers;
            const countryLayerIndex = allLayers.findIndex(l => l.id === lastCountryLayer);
            if (countryLayerIndex >= 0 && countryLayerIndex < allLayers.length - 1) {
                return allLayers[countryLayerIndex + 1].id;
            }
        }
        // If no country layers, insert before labels
        return labelLayers.length > 0 ? labelLayers[0] : undefined;
    } else if (layerType === 'country') {
        // Country layers go below admin layers
        // If there are admin layers, insert before the first one
        if (appState.adminLayerIds.length > 0) {
            const firstAdminLayer = appState.adminLayerIds[0];
            console.log(`   Inserting country layer below admin layer: ${firstAdminLayer}`);
            return firstAdminLayer;
        }
        // If no admin layers, insert before labels
        return labelLayers.length > 0 ? labelLayers[0] : undefined;
    }
    return undefined;
}

/**
 * Create Filter for Area - Based on old tool approach
 */
function createFilterForArea(areaId, areaType, isGADM = false) {
    if (isGADM) {
        // GADM format filters
        if (areaType === 'country') {
            // Exclude Taiwan (TWN) from China (CHN) boundaries
            if (areaId === 'CHN' || areaId === 'China') {
                return [
                    'all',
                    ['==', ['get', 'GID_0'], 'CHN']
                    // Note: Taiwan has its own GID_0='TWN', so it won't be included in CHN filter
                ];
            }
            return ['==', ['get', 'GID_0'], areaId];
        } else if (areaType === 'state') {
            return ['==', ['get', 'GID_1'], areaId];
        } else {
            return ['==', ['get', 'GID_2'], areaId];
        }
    } else {
        // Mapbox format filters
        if (areaType === 'country') {
            // Exclude Taiwan (TWN) from China (CHN) boundaries
            // When selecting China, ensure Taiwan is not included
            if (areaId === 'CHN' || areaId === 'China') {
                let filterExpression;
                if (CONFIG.MAPBOX.USE_WORLDVIEW_FILTER !== false) {
                    filterExpression = [
                        'all',
                        ['==', 'iso_3166_1_alpha_3', 'CHN'],
                        ['!=', 'iso_3166_1_alpha_3', 'TWN'], // Explicitly exclude Taiwan
                        ['in', 'worldview', ...CONFIG.MAPBOX.WORLDVIEW_FILTER]
                    ];
                } else {
                    filterExpression = [
                        'all',
                        ['==', 'iso_3166_1_alpha_3', 'CHN'],
                        ['!=', 'iso_3166_1_alpha_3', 'TWN'] // Explicitly exclude Taiwan
                    ];
                }
                return filterExpression;
            }
            // Use same filter as old tool for other countries
            let filterExpression;
            if (CONFIG.MAPBOX.USE_WORLDVIEW_FILTER !== false) {
                filterExpression = [
                    'all',
                    ['==', 'iso_3166_1_alpha_3', areaId],
                    ['in', 'worldview', ...CONFIG.MAPBOX.WORLDVIEW_FILTER]
                ];
            } else {
                filterExpression = ['==', 'iso_3166_1_alpha_3', areaId];
            }
            return filterExpression;
        } else if (areaType === 'state') {
            // Try different property names that might exist
            return ['==', ['get', 'iso_3166_2'], areaId];
        } else {
            return ['==', ['get', 'NAME_2'], areaId];
        }
    }
}

/**
 * Initialize UI Components
 */
function initializeUI() {
    // Area type buttons
    setupAreaTypeButtons();
    
    // Color picker
    setupColorPicker();
    
    // Search
    setupSearch();
    
    // Export button
    setupExport();
    
    // Advanced section toggle
    setupAdvancedToggle();
    
    // Panel toggle
    setupPanelToggle();
    
    // Clear button
    setupClearButton();
    
    // Admin level selector
    setupAdminLevelSelector();
    
    // Overlay toggle
    setupOverlayToggle();
}

/**
 * Setup Area Type Buttons
 */
function setupAreaTypeButtons() {
    // Use event delegation for more reliable event handling
    const buttonGroup = document.querySelector('.button-group');
    
    if (!buttonGroup) {
        console.error('❌ Button group not found!');
        return;
    }
    
    console.log(`🔧 Setting up area type buttons using event delegation`);
    
    // Remove existing listeners by cloning
    const buttons = document.querySelectorAll('.btn-toggle[data-type]');
    console.log(`   Found ${buttons.length} buttons:`, Array.from(buttons).map(b => b.dataset.type));
    
    // Use event delegation on the button group
    buttonGroup.addEventListener('click', function(e) {
        // Find the clicked button
        const button = e.target.closest('.btn-toggle[data-type]');
        
        if (!button) {
            return; // Click wasn't on a button
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        const clickedType = button.dataset.type;
        console.log(`🖱️ Button clicked! data-type: "${clickedType}"`);
        
        // Accept 'country' or 'administration' types
        if (clickedType === 'country' || clickedType === 'administration') {
            console.log(`✅ Type "${clickedType}" is valid, calling switchAreaType...`);
            switchAreaType(clickedType);
        } else {
            console.warn(`⚠️ Type "${clickedType}" is not recognized!`);
        }
    });
    
    console.log(`✅ Area type buttons setup complete (using event delegation)`);
}

/**
 * Switch Area Type
 * Supports: 'country' or 'administration' (which shows both state and city)
 */
function switchAreaType(type) {
    console.log(`🔄 Switching to ${type} mode...`);
    
    appState.currentAreaType = type;
    appState.administrationLevel = null; // Reset detected level
    
    // Step 1: Hide all visible boundary layers first
    hideAllBoundaryLayers();
    
    // Step 2: Update button states
    document.querySelectorAll('.btn-toggle[data-type]').forEach(btn => {
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Step 3: Update overlay toggle and admin level selector visibility
    updateOverlayToggleVisibility();
    updateAdminLevelSelectorVisibility();
    
    // Step 3: Load and show appropriate layers
    if (type === 'country') {
        // Country mode: Only show country boundaries
        const sourceTypeKey = getSourceTypeKey('country');
        if (!appState.sources[sourceTypeKey] || !appState.sources[sourceTypeKey].loaded) {
            loadBoundarySourceForType('country', true);
            return;
        }
        ensureBoundaryLayerExists('country');
        showBoundaryLayer('country');
        
    } else if (type === 'administration') {
        // Administration mode: Two-layer mode
        // Step 1: Keep country layer visible (if country is selected)
        if (appState.selectedCountry) {
            console.log(`🌍 Two-layer mode: Country ${appState.selectedCountry.name} is selected`);
            console.log(`🔄 Loading administrative boundaries for ${appState.selectedCountry.name}...`);
            
            // Ensure country layer is visible
            ensureBoundaryLayerExists('country');
            showBoundaryLayer('country');
            
            // Step 2: Immediately load state and city boundaries for selected country
            loadStateCityForCountry(appState.selectedCountry.id);
        } else {
            console.log('💡 Tip: Select a country first in "國家" mode, then switch to "行政區" mode');
            console.log('   Or: Click directly on administrative areas - system will auto-detect the country');
            
            // Step 2: Load state and city boundaries globally (will filter by country when selected)
            // Note: Layers will be created when data loads, and shown automatically
            // Don't try to show layers immediately - they will be shown when ready
            console.log('💡 Loading administrative boundaries...');
            console.log('   They will appear when data is loaded');
            
            // Try to load state level (layers will be created automatically when source loads)
            loadBoundarySourceForType('state', true).catch(err => {
                console.log('ℹ️ State boundaries not available:', err.message);
            });
            
            // Try to load state level (layers will be created automatically when source loads)
            loadBoundarySourceForType('state', true).catch(err => {
                console.log('ℹ️ State boundaries not available:', err.message);
            });
            
            // Try to load city level
            loadBoundarySourceForType('city', true).catch(err => {
                console.log('ℹ️ City boundaries not available:', err.message);
            });
        }
        
        // Note: If GADM files are not available, these will fail gracefully
        // User can still use country mode
    }
    
    console.log(`✅ Switched to ${type} mode`);
}

/**
 * Load state/city boundaries for a selected country (two-layer mode)
 * Uses country-specific data (much smaller files)
 */
function loadStateCityForCountry(countryId) {
    console.log(`🌍 Loading administrative boundaries for country: ${countryId}`);
    
    // Ensure country layer is visible
    ensureBoundaryLayerExists('country');
    showBoundaryLayer('country');
    
    // Skip country-specific files (they usually don't exist)
    // Directly use global GADM data which filters by country automatically
    console.log(`🔄 Loading state boundaries (using global GADM data)...`);
    loadBoundarySourceForType('state', true).then(() => {
        ensureBoundaryLayerExists('state');
        showBoundaryLayer('state');
        console.log(`✅ State layer should now be visible and clickable`);
    }).catch(err => {
        console.warn('State boundaries not available:', err);
    });
    
    console.log(`🔄 Loading city boundaries (using global GADM data)...`);
    loadBoundarySourceForType('city', true).then(() => {
        ensureBoundaryLayerExists('city');
        showBoundaryLayer('city');
        console.log(`✅ City layer should now be visible and clickable`);
    }).catch(err => {
        console.warn('City boundaries not available:', err);
    });
}

/**
 * Hide all visible boundary layers
 */
function hideAllBoundaryLayers() {
    ['country', 'state', 'city'].forEach(areaType => {
        const layerId = `visible-boundaries-${areaType}`;
        const lineLayerId = `${layerId}-lines`;
        
        if (appState.map.getLayer(layerId)) {
            appState.map.setLayoutProperty(layerId, 'visibility', 'none');
        }
        if (appState.map.getLayer(lineLayerId)) {
            appState.map.setLayoutProperty(lineLayerId, 'visibility', 'none');
        }
    });
}

/**
 * Show boundary layer for specific type
 */
function showBoundaryLayer(areaType) {
    const layerId = `visible-boundaries-${areaType}`;
    const lineLayerId = `${layerId}-lines`;
    
    // Show fill layer
    if (appState.map.getLayer(layerId)) {
        appState.map.setLayoutProperty(layerId, 'visibility', 'visible');
        // CRITICAL: Set opacity > 0 so layer is rendered and queryable
        appState.map.setPaintProperty(layerId, 'fill-opacity', 0.01);
        console.log(`✅ Showing ${layerId}`);
    } else {
        // Layer doesn't exist yet - this is normal during data loading
        // Don't log as error, just return false silently
        return false;
    }
    
    // Also show line layer for better visibility
    if (appState.map.getLayer(lineLayerId)) {
        appState.map.setLayoutProperty(lineLayerId, 'visibility', 'visible');
        console.log(`✅ Showing ${lineLayerId}`);
    }
    
    return true;
}

/**
 * Ensure boundary layer exists, create if needed
 */
function ensureBoundaryLayerExists(areaType) {
    const layerId = `visible-boundaries-${areaType}`;
    
    if (!appState.map.getLayer(layerId)) {
        console.log(`Creating missing layer ${layerId}...`);
        
        // For state/city, try country-specific layer first
        if ((areaType === 'state' || areaType === 'city') && 
            appState.selectedCountry && 
            window.COUNTRY_LOADER) {
            const countrySourceId = `country-${areaType}-${appState.selectedCountry.id}`;
            if (appState.map.getSource(countrySourceId)) {
                // Use country-specific layer creator
                window.COUNTRY_LOADER.createVisibleLayer(appState.selectedCountry.id, areaType);
                return;
            }
        }
        
        // Default: Use standard layer creator
        createVisibleBoundaryLayer(areaType);
    }
}

/**
 * Setup Color Picker - Enhanced with custom color
 */
function setupColorPicker() {
    const colorPicker = document.getElementById('color-picker');
    const hexInput = document.getElementById('color-hex-input');
    const presets = document.querySelectorAll('.color-preset:not(.popup-color-presets .color-preset)');
    
    // Color picker change
    colorPicker.addEventListener('change', function() {
        const color = this.value;
        appState.currentColor = color;
        if (hexInput) {
            hexInput.value = color.toUpperCase();
        }
        updateActivePreset(color);
    });
    
    colorPicker.addEventListener('input', function() {
        const color = this.value;
        appState.currentColor = color;
        if (hexInput) {
            hexInput.value = color.toUpperCase();
        }
        updateActivePreset(color);
    });
    
    // Hex input change
    if (hexInput) {
        hexInput.addEventListener('input', function() {
            let value = this.value.trim();
            
            // Add # if missing
            if (value && !value.startsWith('#')) {
                value = '#' + value;
            }
            
            // Validate hex color
            if (/^#[0-9A-F]{6}$/i.test(value)) {
                appState.currentColor = value;
                colorPicker.value = value;
                updateActivePreset(value);
                this.style.borderColor = '';
            } else if (value.length > 0) {
                this.style.borderColor = '#d32f2f';
            }
        });
        
        hexInput.addEventListener('blur', function() {
            // Format value on blur
            let value = this.value.trim().toUpperCase();
            if (value && !value.startsWith('#')) {
                value = '#' + value;
            }
            if (/^#[0-9A-F]{6}$/i.test(value)) {
                this.value = value;
                this.style.borderColor = '';
            } else {
                this.value = colorPicker.value.toUpperCase();
                this.style.borderColor = '';
            }
        });
    }
    
    setupColorPresets(presets, colorPicker);
}

/**
 * Update active preset based on color value
 */
function updateActivePreset(color) {
    const presets = document.querySelectorAll('.color-preset:not(.popup-color-presets .color-preset)');
    presets.forEach(preset => {
        if (preset.dataset.color && preset.dataset.color.toLowerCase() === color.toLowerCase()) {
            preset.classList.add('active');
        } else {
            preset.classList.remove('active');
        }
    });
}

/**
 * Setup Color Presets
 */
function setupColorPresets(presets, colorPicker) {
    presets.forEach(preset => {
        preset.addEventListener('click', function() {
            const color = this.dataset.color;
            colorPicker.value = color;
            appState.currentColor = color;
            
            // Update hex input if it exists
            const hexInput = document.getElementById('color-hex-input');
            if (hexInput) {
                hexInput.value = color.toUpperCase();
            }
            
            // Update active state
            presets.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

/**
 * Setup Search
 */
function setupSearch() {
    const searchInput = document.getElementById('area-search');
    const resultsContainer = document.getElementById('search-results');
    
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length >= 2) {
            performSearch(query);
        } else {
            resultsContainer.style.display = 'none';
        }
    });
}

/**
 * Perform Search
 */
let searchTimeout = null;
function performSearch(query) {
    clearTimeout(searchTimeout);
    
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    
    if (query.length < 2) {
        resultsContainer.style.display = 'none';
        return;
    }
    
    // Debounce search
    searchTimeout = setTimeout(() => {
        searchAreas(query, resultsContainer);
    }, 300);
}

/**
 * Search Areas using country codes and geocoding
 */
async function searchAreas(query, container) {
    container.style.display = 'block';
    container.innerHTML = '<div class="search-result-item">Searching...</div>';
    
    const queryLower = query.toLowerCase();
    const results = [];
    
    // Search country codes first
    if (typeof COUNTRY_CODES !== 'undefined' && COUNTRY_CODES) {
        for (const code in COUNTRY_CODES) {
            const country = COUNTRY_CODES[code];
            const nameEn = country.en || '';
            const nameZh = country.zh || '';
            
            if (nameEn.toLowerCase().includes(queryLower) || 
                nameZh.includes(query) ||
                code.toLowerCase().includes(queryLower)) {
                results.push({
                    id: code,
                    name: nameEn || nameZh,
                    type: 'country'
                });
                
                if (results.length >= 10) break; // Limit results
            }
        }
    }
    
    // Also try Mapbox Geocoding API for more results
    try {
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${CONFIG.MAPBOX.TOKEN}&types=country,region,place&limit=5`;
        const response = await fetch(geocodeUrl);
        const data = await response.json();
        
        if (data.features) {
            data.features.forEach(feature => {
                const type = feature.place_type[0]; // 'country', 'region', 'place'
                const name = feature.text || feature.place_name;
                const context = feature.context || [];
                
                // Extract country code
                const countryContext = context.find(c => c.id.startsWith('country'));
                const countryCode = countryContext ? countryContext.short_code.toUpperCase() : null;
                
                results.push({
                    id: countryCode || feature.id,
                    name: name,
                    type: type === 'country' ? 'country' : type === 'region' ? 'state' : 'city',
                    geometry: feature.geometry,
                    center: feature.center
                });
            });
        }
    } catch (error) {
        console.warn('Geocoding error:', error);
    }
    
    // Display results
    if (results.length === 0) {
        container.innerHTML = '<div class="search-result-item">No results found</div>';
    } else {
        container.innerHTML = results.map(result => `
            <div class="search-result-item" onclick="selectAreaFromSearch('${result.id}', '${result.name}', '${result.type}', ${result.center ? JSON.stringify(result.center) : 'null'})">
                <strong>${result.name}</strong>
                <span style="color: #999; font-size: 12px;">${result.type}</span>
            </div>
        `).join('');
    }
}

/**
 * Select area from search results
 */
function selectAreaFromSearch(areaId, areaName, areaType, center) {
    // Hide search results
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('area-search').value = areaName;
    
    // Zoom to area if center provided
    if (center && center.length === 2) {
        appState.map.flyTo({
            center: center,
            zoom: areaType === 'country' ? 4 : areaType === 'state' ? 6 : 10,
            duration: 1000
        });
    }
    
    // Switch to correct area type
    if (appState.currentAreaType !== areaType) {
        switchAreaType(areaType);
        // Wait a bit for switch to complete
        setTimeout(() => {
            applyColorToArea(areaId, areaName, areaType, appState.currentColor);
        }, 500);
    } else {
        applyColorToArea(areaId, areaName, areaType, appState.currentColor);
    }
}

// Make function globally available
window.selectAreaFromSearch = selectAreaFromSearch;

/**
 * Setup Export
 */
function setupExport() {
    const exportBtn = document.getElementById('export-btn');
    exportBtn.addEventListener('click', function() {
        showExportDialog();
    });
    
    setupExportDialog();
}

/**
 * Paper size definitions (in mm)
 */
const PAPER_SIZES = {
    'a4': { width: 210, height: 297 },
    'a3': { width: 297, height: 420 },
    'a2': { width: 420, height: 594 },
    'letter': { width: 215.9, height: 279.4 },
    'legal': { width: 215.9, height: 355.6 },
    'tabloid': { width: 279.4, height: 431.8 }
};

/**
 * Convert mm to pixels based on DPI
 */
function mmToPixels(mm, dpi) {
    // 1 inch = 25.4 mm
    // pixels = (mm / 25.4) * dpi
    return Math.round((mm / 25.4) * dpi);
}

/**
 * Setup Export Dialog
 */
function setupExportDialog() {
    const overlay = document.getElementById('export-dialog-overlay');
    const closeBtn = document.getElementById('export-dialog-close');
    const cancelBtn = document.getElementById('export-dialog-cancel');
    const exportBtn = document.getElementById('export-dialog-export');
    const paperSizeSelect = document.getElementById('export-paper-size');
    const orientationRadios = document.querySelectorAll('input[name="export-orientation"]');
    const dpiSelect = document.getElementById('export-dpi');
    const formatRadios = document.querySelectorAll('input[name="export-format"]');
    const qualitySlider = document.getElementById('export-quality');
    const qualityValue = document.getElementById('export-quality-value');
    const qualityGroup = document.getElementById('export-quality-group');
    const dimensionsPreview = document.getElementById('export-dimensions-preview');
    
    // Close dialog handlers
    function closeDialog() {
        overlay.style.display = 'none';
    }
    
    closeBtn.addEventListener('click', closeDialog);
    cancelBtn.addEventListener('click', closeDialog);
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeDialog();
        }
    });
    
    // Update dimensions preview when options change
    function updateDimensionsPreview() {
        const paperSize = paperSizeSelect.value;
        const orientation = document.querySelector('input[name="export-orientation"]:checked').value;
        const dpi = parseInt(dpiSelect.value);
        
        let width, height;
        
        if (paperSize === 'custom') {
            const mapCanvas = appState.map.getCanvas();
            width = mapCanvas.clientWidth;
            height = mapCanvas.clientHeight;
        } else {
            const size = PAPER_SIZES[paperSize];
            width = mmToPixels(size.width, dpi);
            height = mmToPixels(size.height, dpi);
            
            if (orientation === 'landscape') {
                [width, height] = [height, width];
            }
        }
        
        const sizeInMB = ((width * height * 4) / (1024 * 1024)).toFixed(1);
        dimensionsPreview.textContent = `${width.toLocaleString()} × ${height.toLocaleString()} px (~${sizeInMB}MB at ${dpi} DPI)`;
    }
    
    // Show/hide quality slider for JPEG
    formatRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            qualityGroup.style.display = this.value === 'jpeg' ? 'block' : 'none';
        });
    });
    
    // Update quality value display
    qualitySlider.addEventListener('input', function() {
        qualityValue.textContent = this.value + '%';
    });
    
    // Update dimensions when options change
    paperSizeSelect.addEventListener('change', updateDimensionsPreview);
    orientationRadios.forEach(radio => {
        radio.addEventListener('change', updateDimensionsPreview);
    });
    dpiSelect.addEventListener('change', updateDimensionsPreview);
    
    // Export button handler
    exportBtn.addEventListener('click', function() {
        const settings = {
            paperSize: paperSizeSelect.value,
            orientation: document.querySelector('input[name="export-orientation"]:checked').value,
            dpi: parseInt(dpiSelect.value),
            format: document.querySelector('input[name="export-format"]:checked').value,
            quality: parseInt(qualitySlider.value)
        };
        
        closeDialog();
        exportMapImage(settings);
    });
    
    // Initial preview update
    setTimeout(updateDimensionsPreview, 100);
}

/**
 * Show Export Dialog
 */
function showExportDialog() {
    const overlay = document.getElementById('export-dialog-overlay');
    overlay.style.display = 'flex';
    
    // Update dimensions preview
    setTimeout(() => {
        const dimensionsPreview = document.getElementById('export-dimensions-preview');
        if (dimensionsPreview) {
            const paperSizeSelect = document.getElementById('export-paper-size');
            const dpiSelect = document.getElementById('export-dpi');
            const orientation = document.querySelector('input[name="export-orientation"]:checked');
            
            let width, height;
            const paperSize = paperSizeSelect.value;
            const dpi = parseInt(dpiSelect.value);
            const orient = orientation ? orientation.value : 'portrait';
            
            if (paperSize === 'custom') {
                const mapCanvas = appState.map.getCanvas();
                width = mapCanvas.clientWidth;
                height = mapCanvas.clientHeight;
            } else {
                const size = PAPER_SIZES[paperSize];
                width = mmToPixels(size.width, dpi);
                height = mmToPixels(size.height, dpi);
                
                if (orient === 'landscape') {
                    [width, height] = [height, width];
                }
            }
            
            const sizeInMB = ((width * height * 4) / (1024 * 1024)).toFixed(1);
            dimensionsPreview.textContent = `${width} × ${height} px (~${sizeInMB}MB at ${dpi} DPI)`;
        }
    }, 100);
}

/**
 * Export Map Image with settings (like Mapbox Print)
 * @param {Object} settings - Export settings {paperSize, orientation, dpi, format, quality}
 */
function exportMapImage(settings = {}) {
    if (!appState.map || !appState.map.loaded()) {
        showToast('Map is not fully loaded, please try again.', 'error');
        return;
    }
    
    // Default settings
    const defaultSettings = {
        paperSize: 'custom',
        orientation: 'portrait',
        dpi: 300,
        format: 'png',
        quality: 90
    };
    
    settings = { ...defaultSettings, ...settings };
    
    showLoading('Exporting map...');
    
    // Calculate dimensions
    let targetWidth, targetHeight;
    
    if (settings.paperSize === 'custom') {
        // Use current map dimensions
        const mapCanvas = appState.map.getCanvas();
        targetWidth = mapCanvas.clientWidth;
        targetHeight = mapCanvas.clientHeight;
    } else {
        // Use paper size dimensions
        const size = PAPER_SIZES[settings.paperSize];
        targetWidth = mmToPixels(size.width, settings.dpi);
        targetHeight = mmToPixels(size.height, settings.dpi);
        
        if (settings.orientation === 'landscape') {
            [targetWidth, targetHeight] = [targetHeight, targetWidth];
        }
    }
    
    // Store original map container size and state
    const mapContainer = appState.map.getContainer();
    const originalWidth = mapContainer.clientWidth;
    const originalHeight = mapContainer.clientHeight;
    const originalCenter = appState.map.getCenter();
    const originalZoom = appState.map.getZoom();
    
    // Function to restore original map state
    const restoreMap = () => {
        // Restore container position and size
        mapContainer.style.position = '';
        mapContainer.style.top = '';
        mapContainer.style.left = '';
        mapContainer.style.zIndex = '';
        mapContainer.style.width = originalWidth + 'px';
        mapContainer.style.height = originalHeight + 'px';
        appState.map.resize();
        // Restore map view if it changed
        if (originalCenter && originalZoom) {
            appState.map.setCenter(originalCenter);
            appState.map.setZoom(originalZoom);
        }
    };
    
    // Function to capture and download the map
    const captureMap = () => {
        try {
            // For custom size, use current canvas directly
            if (settings.paperSize === 'custom') {
                const mapCanvas = appState.map.getCanvas();
                
                if (!mapCanvas) {
                    hideLoading();
                    showToast('Map canvas not found. Please try again.', 'error');
                    return;
                }
                
                // Wait for map to render before capturing
                appState.map.once('render', function() {
                    // Get actual canvas dimensions
                    const canvasWidth = mapCanvas.clientWidth || mapCanvas.width;
                    const canvasHeight = mapCanvas.clientHeight || mapCanvas.height;
                    
                    if (canvasWidth === 0 || canvasHeight === 0) {
                        hideLoading();
                        showToast('Map canvas is not ready. Please try again.', 'error');
                        return;
                    }
                    
                    // Create a new canvas and copy the map canvas to it
                    const exportCanvas = document.createElement('canvas');
                    exportCanvas.width = canvasWidth;
                    exportCanvas.height = canvasHeight;
                    const ctx = exportCanvas.getContext('2d');
                    
                    // Fill white background first (in case map has transparency)
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                    
                    // Draw the map canvas onto export canvas
                    ctx.drawImage(mapCanvas, 0, 0, canvasWidth, canvasHeight);
                    
                    // Convert to blob and download
                    const mimeType = settings.format === 'jpeg' ? 'image/jpeg' : 'image/png';
                    const quality = settings.format === 'jpeg' ? settings.quality / 100 : undefined;
                    
                    exportCanvas.toBlob(function(blob) {
                        if (!blob || blob.size === 0) {
                            hideLoading();
                            showToast('Failed to export map image - empty blob', 'error');
                            return;
                        }
                        
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                        const extension = settings.format === 'jpeg' ? 'jpg' : 'png';
                        a.download = `map-custom-${timestamp}.${extension}`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        hideLoading();
                        showToast('Map exported successfully', 'success');
                    }, mimeType, quality);
                });
                
                // Trigger a render to ensure map is ready
                appState.map.triggerRepaint();
                return;
            }
            
            // For paper sizes, resize map container to render at target resolution
            // This ensures high-quality rendering at the target DPI
            // Limit dimensions to prevent browser crashes (max 8000px for very high DPI)
            const maxDimension = 8000;
            const renderWidth = Math.min(targetWidth, maxDimension);
            const renderHeight = Math.min(targetHeight, maxDimension);
            
            // Check if we need to resize (always resize for paper sizes to get high resolution)
            const needsResize = renderWidth !== originalWidth || renderHeight !== originalHeight;
            
            if (needsResize) {
                // Temporarily resize map container to target resolution
                // Hide it off-screen to avoid flickering
                const originalPosition = mapContainer.style.position;
                const originalTop = mapContainer.style.top;
                const originalLeft = mapContainer.style.left;
                const originalZIndex = mapContainer.style.zIndex;
                
                mapContainer.style.position = 'fixed';
                mapContainer.style.top = '-9999px';
                mapContainer.style.left = '-9999px';
                mapContainer.style.zIndex = '-1';
                mapContainer.style.width = renderWidth + 'px';
                mapContainer.style.height = renderHeight + 'px';
                
                // Resize the map to trigger re-rendering at new size
                appState.map.resize();
            }
            
            // Wait for map to fully render at the new high resolution
            let renderCount = 0;
            const maxRenderWaits = 3; // Wait for multiple renders to ensure everything is loaded
            
            const waitForFullRender = () => {
                appState.map.once('render', function() {
                    renderCount++;
                    if (renderCount < maxRenderWaits) {
                        // Wait for more renders to ensure all tiles are loaded
                        setTimeout(waitForFullRender, 300);
                    } else {
                        // Final render complete, capture the canvas
                        setTimeout(() => {
                            try {
                                const mapCanvas = appState.map.getCanvas();
                                
                                if (!mapCanvas || mapCanvas.width === 0 || mapCanvas.height === 0) {
                                    if (needsResize) restoreMap();
                                    hideLoading();
                                    showToast('Map canvas is not ready. Please try again.', 'error');
                                    return;
                                }
                                
                                // Get actual rendered canvas dimensions
                                const sourceWidth = mapCanvas.width || mapCanvas.clientWidth;
                                const sourceHeight = mapCanvas.height || mapCanvas.clientHeight;
                                
                                if (sourceWidth === 0 || sourceHeight === 0) {
                                    if (needsResize) restoreMap();
                                    hideLoading();
                                    showToast('Map canvas has invalid dimensions. Please try again.', 'error');
                                    return;
                                }
                                
                                // Create export canvas with exact target dimensions
                                const exportCanvas = document.createElement('canvas');
                                exportCanvas.width = targetWidth;
                                exportCanvas.height = targetHeight;
                                const ctx = exportCanvas.getContext('2d');
                                
                                // Fill white background first
                                ctx.fillStyle = '#ffffff';
                                ctx.fillRect(0, 0, targetWidth, targetHeight);
                                
                                // If source size matches target size, copy directly (no scaling = no blur)
                                if (sourceWidth === targetWidth && sourceHeight === targetHeight) {
                                    // Direct copy - no scaling, maximum quality
                                    ctx.drawImage(mapCanvas, 0, 0);
                                } else {
                                    // Need to scale - use high-quality interpolation
                                    ctx.imageSmoothingEnabled = true;
                                    ctx.imageSmoothingQuality = 'high';
                                    ctx.drawImage(mapCanvas, 0, 0, sourceWidth, sourceHeight, 
                                                 0, 0, targetWidth, targetHeight);
                                }
                                
                                // Restore map immediately after capturing
                                if (needsResize) restoreMap();
                                
                                // Convert to blob and download
                                const mimeType = settings.format === 'jpeg' ? 'image/jpeg' : 'image/png';
                                const quality = settings.format === 'jpeg' ? settings.quality / 100 : undefined;
                                
                                exportCanvas.toBlob(function(blob) {
                                    if (!blob) {
                                        hideLoading();
                                        showToast('Failed to export map image', 'error');
                                        return;
                                    }
                                    
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                                    const extension = settings.format === 'jpeg' ? 'jpg' : 'png';
                                    const paperSizeStr = settings.paperSize.toUpperCase();
                                    a.download = `map-${paperSizeStr}-${settings.dpi}dpi-${timestamp}.${extension}`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                    hideLoading();
                                    showToast('Map exported successfully', 'success');
                                }, mimeType, quality);
                                
                            } catch (error) {
                                if (needsResize) restoreMap();
                                console.error('Error exporting map:', error);
                                hideLoading();
                                showToast('Failed to export map image: ' + error.message, 'error');
                            }
                        }, 500); // Additional wait to ensure all tiles are loaded
                    }
                });
            };
            
            // Start waiting for renders
            waitForFullRender();
            
            // Trigger repaint to start rendering at new size
            if (needsResize) {
                appState.map.triggerRepaint();
            } else {
                // If no resize needed, still wait for render
                waitForFullRender();
            }
            
        } catch (error) {
            if (typeof restoreMap === 'function') restoreMap();
            console.error('Error exporting map:', error);
            hideLoading();
            showToast('Failed to export map image: ' + error.message, 'error');
        }
    };
    
    // Wait for map to finish rendering before capturing
    if (appState.map.isStyleLoaded() && appState.map.loaded()) {
        setTimeout(() => {
            captureMap();
        }, 200);
    } else {
        appState.map.once('idle', function() {
            setTimeout(() => {
                captureMap();
            }, 200);
        });
        appState.map.triggerRepaint();
    }
}

/**
 * Setup Advanced Toggle
 */
function setupAdvancedToggle() {
    const toggle = document.getElementById('advanced-toggle');
    const content = document.getElementById('advanced-content');
    
    toggle.addEventListener('click', function() {
        const isExpanded = content.style.display !== 'none';
        content.style.display = isExpanded ? 'none' : 'block';
        toggle.classList.toggle('expanded', !isExpanded);
    });
}

/**
 * Setup Panel Toggle
 */
function setupPanelToggle() {
    const toggle = document.getElementById('toggle-panel');
    const panel = document.getElementById('side-panel');
    
    toggle.addEventListener('click', function() {
        panel.classList.toggle('collapsed');
        const icon = this.querySelector('.material-icons');
        icon.textContent = panel.classList.contains('collapsed') ? 'chevron_right' : 'chevron_left';
    });
}

/**
 * Setup Overlay Mode Toggle
 */
function setupOverlayToggle() {
    const overlayToggle = document.getElementById('overlay-mode-toggle');
    const overlayGroup = document.getElementById('overlay-toggle-group');
    const overlayHint = document.getElementById('overlay-hint');
    
    if (!overlayToggle) return;
    
    // Show/hide toggle based on current area type
    updateOverlayToggleVisibility();
    
    // Bind change event
    overlayToggle.addEventListener('change', function(e) {
        appState.overlayMode = e.target.checked;
        console.log(`🔄 Overlay mode: ${appState.overlayMode ? 'ON' : 'OFF'}`);
        
        // Update hint text
        if (overlayHint) {
            if (appState.overlayMode) {
                overlayHint.textContent = '啟用後：先選國家（底層），再選行政區（疊加上層）';
                overlayHint.style.color = '#4CAF50';
            } else {
                overlayHint.textContent = '標準模式：點擊選擇區域';
                overlayHint.style.color = '#666';
            }
        }
        
        // If overlay mode is enabled and we have selected areas, recreate layers with proper z-order
        if (appState.overlayMode && appState.selectedAreas.length > 0) {
            console.log('🔄 Recreating layers with overlay z-ordering...');
            // Recreate all layers to apply new z-ordering
            appState.selectedAreas.forEach(area => {
                const existingLayer = appState.map.getLayer(area.layerId);
                if (existingLayer) {
                    const color = area.color;
                    const areaId = area.id;
                    const areaName = area.name;
                    const areaType = area.type;
                    
                    // Remove old layer
                    appState.map.removeLayer(area.layerId);
                    
                    // Recreate with proper z-order
                    createAreaLayer(areaId, areaName, areaType, color, area.layerId);
                }
            });
        }
        
        showToast(appState.overlayMode ? '疊加模式已啟用' : '疊加模式已關閉', 'info', 2000);
    });
}

/**
 * Setup Admin Level Selector
 */
function setupAdminLevelSelector() {
    const adminLevelGroup = document.getElementById('admin-level-group');
    if (!adminLevelGroup) return;
    
    // Use event delegation for button clicks
    adminLevelGroup.addEventListener('click', function(e) {
        const btn = e.target.closest('.btn-toggle[data-level]');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            const level = btn.dataset.level;
            
            // Update active state
            adminLevelGroup.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update app state
            appState.preferredAdminLevel = level;
            console.log(`🔄 Admin level preference: ${level}`);
            
            // Show feedback
            let message = '';
            if (level === 'state') {
                message = '已切換到「省/州」模式：點擊地圖選擇整個省或州';
            } else if (level === 'city') {
                message = '已切換到「市」模式：點擊地圖選擇各個城市';
            } else {
                message = '已切換到「自動」模式：優先選擇最小級別';
            }
            showToast(message, 'info', 2000);
        }
    });
    
    // Initialize visibility
    updateAdminLevelSelectorVisibility();
}

/**
 * Update Admin Level Selector Visibility
 */
function updateAdminLevelSelectorVisibility() {
    const adminLevelGroup = document.getElementById('admin-level-group');
    if (!adminLevelGroup) return;
    
    // Only show in administration mode
    if (appState.currentAreaType === 'administration') {
        adminLevelGroup.style.display = 'block';
    } else {
        adminLevelGroup.style.display = 'none';
    }
}

/**
 * Update Overlay Toggle Visibility
 */
function updateOverlayToggleVisibility() {
    const overlayGroup = document.getElementById('overlay-toggle-group');
    if (!overlayGroup) return;
    
    // Only show in administration mode
    if (appState.currentAreaType === 'administration') {
        overlayGroup.style.display = 'block';
        // Default: Enable overlay mode automatically in administration mode
        appState.overlayMode = true;
        const overlayToggle = document.getElementById('overlay-mode-toggle');
        if (overlayToggle) {
            overlayToggle.checked = true;
        }
    } else {
        overlayGroup.style.display = 'none';
        // Reset overlay mode when switching away from administration
        appState.overlayMode = false;
        const overlayToggle = document.getElementById('overlay-mode-toggle');
        if (overlayToggle) {
            overlayToggle.checked = false;
        }
    }
}

/**
 * Setup Clear Button
 */
function setupClearButton() {
    const clearBtn = document.getElementById('clear-areas-btn');
    clearBtn.addEventListener('click', function() {
        clearAllAreas();
    });
}

/**
 * Clear All Areas
 */
function clearAllAreas() {
    appState.selectedAreas.forEach(area => {
        if (appState.map.getLayer(area.layerId)) {
            appState.map.removeLayer(area.layerId);
        }
    });
    
    appState.selectedAreas = [];
    updateSelectedAreasList();
    showToast('All areas cleared', 'success');
}

/**
 * Update Selected Areas List
 */
function updateSelectedAreasList() {
    const list = document.getElementById('selected-areas-list');
    
    if (appState.selectedAreas.length === 0) {
        list.innerHTML = '<p class="empty-state">Click on map to select areas</p>';
        return;
    }
    
    list.innerHTML = appState.selectedAreas.map(area => `
        <div class="area-item" style="border-left-color: ${area.color}">
            <div class="area-item-info">
                <div class="area-item-color" style="background-color: ${area.color}"></div>
                <span class="area-item-name">${area.name}</span>
            </div>
            <div class="area-item-actions">
                <button class="btn-remove" onclick="removeArea('${area.id}', '${area.type}')" title="Remove">
                    <span class="material-icons">close</span>
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Remove Area
 */
function removeArea(areaId, areaType) {
    const index = appState.selectedAreas.findIndex(
        a => a.id === areaId && a.type === areaType
    );
    
    if (index >= 0) {
        const area = appState.selectedAreas[index];
        if (appState.map.getLayer(area.layerId)) {
            appState.map.removeLayer(area.layerId);
        }
        appState.selectedAreas.splice(index, 1);
        updateSelectedAreasList();
        showToast(`${area.name} removed`, 'success');
    }
}

// Make removeArea available globally
window.removeArea = removeArea;

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
    // Map style selector
    const styleSelect = document.getElementById('map-style-select');
    if (styleSelect) {
        styleSelect.addEventListener('change', function() {
            switchMapStyle(this.value);
        });
    }
    
    // Labels toggle
    const labelsToggle = document.getElementById('toggle-labels');
    if (labelsToggle) {
        labelsToggle.addEventListener('change', function() {
            toggleLabels(this.checked);
        });
    }
    
    // Boundary mode
    const modeButtons = document.querySelectorAll('.btn-toggle[data-mode]');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.dataset.mode;
            switchBoundaryMode(mode);
        });
    });
}

/**
 * Set space-like background for Globe Sky (behind the earth only)
 * Uses setFog() method which properly controls the sky/space area in Globe projection
 * Works for all 4 styles
 */
function setGlobeSkyBackground() {
    try {
        // Use setFog() to control the space/sky area behind the globe
        // This is the correct method for Globe projection
        appState.map.setFog({
            'range': [0.8, 8],
            'color': 'rgba(10, 10, 10, 0)', // Transparent at horizon
            'horizon-blend': 0,
            'high-color': 'rgba(10, 10, 10, 0.7)', // Dark at high altitude
            'space-color': 'rgba(10, 10, 10, 1)', // Pure dark space color (#0a0a0a)
            'star-intensity': 0.5 // Subtle star effect
        });
    } catch (err) {
        console.log('Note: Globe Sky background setup (setFog):', err.message);
        // Fallback: try setting background layer
        try {
            const style = appState.map.getStyle();
            if (!style || !style.layers) return;

            const skyBgColor = '#0a0a0a';
            const existingBg = appState.map.getLayer('background');
            
            if (existingBg) {
                appState.map.setPaintProperty('background', 'background-color', skyBgColor);
            } else {
                const firstLayerId = style.layers.length > 0 ? style.layers[0].id : null;
                if (firstLayerId) {
                    appState.map.addLayer({
                        id: 'background',
                        type: 'background',
                        paint: {
                            'background-color': skyBgColor
                        }
                    }, firstLayerId);
                } else {
                    appState.map.addLayer({
                        id: 'background',
                        type: 'background',
                        paint: {
                            'background-color': skyBgColor
                        }
                    });
                }
            }
        } catch (bgErr) {
            console.log('Note: Fallback background setup also failed:', bgErr.message);
        }
    }
}

/**
 * Switch Map Style
 */
function switchMapStyle(styleName) {
    showLoading('Switching map style...');
    const styleUrl = getMapStyleUrl(styleName);
    appState.mapStyle = styleName;
    appState.map.setStyle(styleUrl);
    
    appState.map.once('style.load', function() {
        // Ensure globe projection is maintained after style change
        appState.map.setProjection('globe');
        
        // Set space-like background for Globe Sky (behind the earth only)
        setGlobeSkyBackground();
        
        // Reload boundaries after style change
        loadBoundarySources();
        // Reapply selected areas
        reapplySelectedAreas();
        // Refresh label layer cache (new style = new label layers)
        refreshLabelLayerCache();
        hideLoading();
    });
}

/**
 * Toggle Labels - IMPLEMENTED
 * Hide/show all text labels on the map
 */
function toggleLabels(visible) {
    appState.labelsVisible = visible;
    
    // Cache label layer IDs if not already cached
    if (appState.labelLayerIds.length === 0) {
        cacheLabelLayerIds();
    }
    
    // Toggle all label layers
    const visibility = visible ? 'visible' : 'none';
    appState.labelLayerIds.forEach(layerId => {
        if (appState.map.getLayer(layerId)) {
            appState.map.setLayoutProperty(layerId, 'visibility', visibility);
        }
    });
    
    console.log(`Labels ${visible ? 'shown' : 'hidden'} (${appState.labelLayerIds.length} layers)`);
}

/**
 * Cache label layer IDs for performance
 */
function cacheLabelLayerIds() {
    try {
        const style = appState.map.getStyle();
        if (style && style.layers) {
            appState.labelLayerIds = style.layers
                .filter(layer => layer.type === 'symbol') // All labels are symbol layers
                .map(layer => layer.id);
            
            console.log(`Cached ${appState.labelLayerIds.length} label layers`);
        }
    } catch (error) {
        console.error('Error caching label layers:', error);
        // Fallback: query all layers dynamically
        appState.labelLayerIds = [];
    }
}

/**
 * Refresh label layer cache (after style change)
 */
function refreshLabelLayerCache() {
    appState.labelLayerIds = [];
    cacheLabelLayerIds();
    
    // Apply current visibility state
    toggleLabels(appState.labelsVisible);
}

/**
 * Switch Boundary Mode
 */
function switchBoundaryMode(mode) {
    appState.boundaryMode = mode;
    
    // Update button states
    document.querySelectorAll('.btn-toggle[data-mode]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Update existing layers
    reapplySelectedAreas();
    showToast(`Switched to ${mode} mode`, 'info');
}

/**
 * Reapply Selected Areas (after style change)
 */
function reapplySelectedAreas() {
    appState.selectedAreas.forEach(area => {
        createAreaLayer(area.id, area.name, area.type, area.color, area.layerId);
    });
}

/**
 * Show/Hide Loading
 */
function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.querySelector('p').textContent = message;
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

/**
 * Show/Hide Click Instructions
 */
function hideClickInstructions() {
    const instructions = document.getElementById('click-instructions');
    if (instructions) {
        instructions.classList.add('hidden');
    }
}

/**
 * Show Toast Notification
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = {
        'success': 'check_circle',
        'error': 'error',
        'info': 'info'
    }[type] || 'info';
    
    toast.innerHTML = `
        <span class="material-icons">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Add slideOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Expose appState and key functions to global scope for testing
window.appState = appState;
window.handleMapClick = handleMapClick;
window.detectClickedBoundary = detectClickedBoundary;
window.getAreaName = getAreaName;
window.switchAreaType = switchAreaType;
window.clearAllAreas = clearAllAreas;
window.applyColorToArea = applyColorToArea;

