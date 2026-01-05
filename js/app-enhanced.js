/**
 * Enhanced Map Tool - News Editor Version
 * Primary Features:
 * - Click-to-select boundaries
 * - Simplified UI
 * - High-quality export
 * - Optimized for 1-3 countries
 */

// Prevent duplicate initialization
if (typeof window.__MAP_APP_INITIALIZED__ !== 'undefined') {
    if (typeof Logger !== 'undefined') {
        Logger.error('app-enhanced.js 已被加载，检测到重复的 script 标签！');
        Logger.error('请检查 HTML 文件中是否有重复的 <script src="js/app-enhanced.js"> 标签');
    } else {
        console.error('❌ app-enhanced.js 已被加载，检测到重复的 script 标签！');
        console.error('请检查 HTML 文件中是否有重复的 <script src="js/app-enhanced.js"> 标签');
    }
    throw new Error('app-enhanced.js 已被加载，请检查是否有重复的 script 标签');
}
window.__MAP_APP_INITIALIZED__ = true;

// Check if running on file:// protocol (CORS will block resources)
function checkProtocol() {
    if (window.location.protocol === 'file:') {
        const errorMsg = `
⚠️ 檢測到 file:// 協議！

此應用必須通過 HTTP 服務器運行，否則會出現 CORS 錯誤。

請執行以下命令啟動服務器：
  cd /Users/yulincho/Documents/01_Github/map
  npm start
  或
  node server-combined.js

然後訪問：http://localhost:3000/index-enhanced.html

如果沒有服務器，可以使用：
  npx live-server --port=8080
`;
        console.error(errorMsg);
        
        // Show blocking error message
        document.body.innerHTML = `
            <div style="padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 100px auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <h1 style="color: #d32f2f; margin-bottom: 20px;">⚠️ 協議錯誤</h1>
                <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
                    此應用必須通過 <strong>HTTP 服務器</strong> 運行，不能直接用瀏覽器打開 HTML 文件。
                </p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
                    <h3 style="margin-top: 0; color: #1976d2;">解決方案：</h3>
                    <ol style="line-height: 2;">
                        <li>打開終端，進入項目目錄：<br>
                            <code style="background: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px;">cd /Users/yulincho/Documents/01_Github/map</code>
                        </li>
                        <li>啟動服務器：<br>
                            <code style="background: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px;">npm start</code><br>
                            或<br>
                            <code style="background: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px;">node server-combined.js</code>
                        </li>
                        <li>訪問：<br>
                            <code style="background: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px;">http://localhost:3000/index-enhanced.html</code>
                        </li>
                    </ol>
                </div>
                <p style="color: #666; font-size: 14px;">
                    如果沒有安裝 Node.js，可以使用：<br>
                    <code style="background: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px;">npx live-server --port=8080</code>
                </p>
            </div>
        `;
        throw new Error('應用必須通過 HTTP 服務器運行');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    // Check protocol first (before any other initialization)
    try {
        checkProtocol();
    } catch (e) {
        // Error already displayed, stop initialization
        return;
    }

    // Use Logger if available, fallback to console.log
    const log = (typeof Logger !== 'undefined') ? Logger.info : console.log;
    log('DOM Content Loaded');
    
    // Validate Mapbox token
    if (!CONFIG.MAPBOX.TOKEN || CONFIG.MAPBOX.TOKEN === 'YOUR_MAPBOX_ACCESS_TOKEN') {
        showToast('Please set your Mapbox access token in config.js!', 'error');
        return;
    }

    // Set Mapbox access token
    mapboxgl.accessToken = CONFIG.MAPBOX.TOKEN;

    // Initialize application
    log('Initializing app...');
    initializeApp();
    
    // Also try binding events after a short delay as backup
    setTimeout(function () {
        const debugLog = (typeof Logger !== 'undefined') ? Logger.debug : console.log;
        debugLog('Backup: Re-checking button setup...');
        const buttons = document.querySelectorAll('.btn-toggle[data-type]');
        debugLog(`Found ${buttons.length} buttons`);
        
        // Re-setup buttons if needed
        if (buttons.length > 0) {
            setupAreaTypeButtons();
        }
    }, 1000);
});

// Application State
// Check if appState already exists (prevent duplicate declaration)
if (typeof window.appState !== 'undefined') {
    console.error('❌ appState 已存在，检测到重复的 script 标签！');
    console.error('请检查 HTML 文件中是否有重复的 <script src="js/app-enhanced.js"> 标签');
    throw new Error('appState 已存在，请检查是否有重复的 script 标签');
}
// Use window.appState to prevent parse-time SyntaxError if script is loaded twice
if (!window.appState) {
    window.appState = {
    map: null,
    currentAreaType: 'country', // 'country' | 'administration'
    administrationLevel: null, // 'state' | 'city' | null (detected on click)
    preferredAdminLevel: 'city', // 'state' | 'city' | 'both' - User's preference for admin level selection (default: 'city' for maximum detail)
    selectedAreas: [], // Array of { id, name, type, color, layerId }
    selectedCountry: null, // { id, name } - Selected country for two-layer mode
    currentColor: '#6CA7A1', // Default: Tropical Teal
    mapStyle: 'light',
    labelsVisible: false, // 预设隐藏标签
    labelLayerIds: [], // Cache label layer IDs for performance
    waterColor: null, // 自定义海洋颜色（null = 使用默认）
    boundaryMode: 'fill', // 'fill' | 'line'
    sources: {
        adm0: null,
        adm1: null,
        adm2: null
    },
    // Overlay mode settings (for country + admin area overlay)
    overlayMode: false,           // Whether admin areas overlay on country
    countryLayerIds: [],          // Track country color layers
    adminLayerIds: [],            // Track admin area overlay layers
    countryBoundaryVisible: true,  // Whether country boundary lines are visible (default: visible)
    adminBoundaryVisible: false,   // Whether administrative boundary lines are visible (default: hidden)
    // Markers management
    markers: [],                   // Array of { id, name, coordinates: [lng, lat], marker: MapboxMarker, color: string, shape: string }
    currentMarkerColor: '#007AFF', // Current selected marker color (Apple blue)
    currentMarkerShape: 'pin',     // Current selected marker shape
    editingMarkerId: null,         // ID of marker currently being edited
    showColorPickerOnAdd: false,   // Show color picker popup when adding new markers (false = use sidebar default)
    pendingMarkerData: null,       // Temporary storage for marker data while color is being selected
    markerMode: false,             // When true, clicking map always adds marker (even if boundary detected)
    textMode: false,               // When true, clicking map adds text label
    imageOverlays: [],             // Array of { id, image: Image/Canvas, bounds: [[sw], [ne]], layerId: string }
    labelPositions: {},            // ARCHIVED: Object storing custom label positions: { areaId: { offset: [x, y] } }
        mapTextLabels: [],             // Array of text labels on map: [{ id, text, coordinates: [lng, lat], fontSize, color, align }]
        // Label dragging state (initialized early for smoke tests)
        labelDragState: {
            isDragging: false,
            draggedFeatureId: null,
            dragStartPoint: null,
            dragStartOffset: null,
            hasMoved: false,
            globalMoveHandler: null,
            globalUpHandler: null
        }
    };
}
// Create local reference for convenience (allows using appState instead of window.appState)
const appState = window.appState;

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
    appState.map.on('load', function () {
        // Set space-like background for Globe Sky (behind the earth only)
        setGlobeSkyBackground();
        
        // Hide Mapbox base map boundaries (use GADM instead)
        hideMapboxBaseMapBoundaries();
        
        loadBoundarySources();
        
        // Cache label layer IDs when map loads
        cacheLabelLayerIds();
        
        // 预设隐藏国家和地名标签
        hideCountryAndPlaceLabels();
        
        // Add scale control and navigation control to map (always visible)
        addMapControls();
        
        // Setup map text tool
        setupMapTextTool();
        
        hideLoading();
        
        // Create initial visible boundary layer for country
        // Retry multiple times to ensure source is loaded and layers are discovered
        let retryCount = 0;
        const maxRetries = 10;
        const retryInterval = 500;
        
        const tryCreateCountryLayer = () => {
            retryCount++;
            const sourceTypeKey = getSourceTypeKey('country');
            
            if (appState.sources[sourceTypeKey] && appState.sources[sourceTypeKey].loaded) {
                // Check if source layer is discovered
                const sourceLayer = getSourceLayerForType('country');
                if (sourceLayer || retryCount >= maxRetries) {
                    // Either we have the layer name, or we've tried enough times
                    if (createVisibleBoundaryLayer('country')) {
                        console.log('✅ Country boundary layer created successfully');
                    } else if (retryCount < maxRetries) {
                        // Layer creation failed, but source exists - try again
                        setTimeout(tryCreateCountryLayer, retryInterval);
                    }
                } else {
                    // Source loaded but layer not discovered yet - wait and retry
                    setTimeout(tryCreateCountryLayer, retryInterval);
                }
            } else if (retryCount < maxRetries) {
                // Source not loaded yet - wait and retry
                setTimeout(tryCreateCountryLayer, retryInterval);
            }
        };
        
        // Start trying after a short delay
        setTimeout(tryCreateCountryLayer, 500);
        
        // Hide click instructions after first selection
        if (appState.selectedAreas.length > 0) {
            hideClickInstructions();
        }
    });

    // Handle map clicks for area selection
    // Handle map clicks - with improved detection
    appState.map.on('click', handleMapClick);
    
    // Handle zoom events to scale markers proportionally
    // Throttle marker scale updates to prevent excessive calls during zoom
    let markerScaleUpdateTimeout = null;
    const throttleMarkerScale = () => {
        if (markerScaleUpdateTimeout) {
            clearTimeout(markerScaleUpdateTimeout);
        }
        markerScaleUpdateTimeout = setTimeout(() => {
            updateMarkersScale();
            markerScaleUpdateTimeout = null;
        }, 50); // Throttle to max once per 50ms
    };
    
    // Update marker scale on zoom (throttled)
    appState.map.on('zoom', throttleMarkerScale);
    
    // Always update on zoomend (final update)
    appState.map.on('zoomend', () => {
        if (markerScaleUpdateTimeout) {
            clearTimeout(markerScaleUpdateTimeout);
            markerScaleUpdateTimeout = null;
        }
        updateMarkersScale();
    });
    
    // In Globe projection, markers need to be repositioned during rotation/pan
    // to stay aligned with their coordinates (Mapbox doesn't do this automatically)
    appState.map.on('move', () => {
        // Reposition markers during map movement (especially important for Globe projection)
        appState.markers.forEach(markerInfo => {
            if (markerInfo.marker && markerInfo.coordinates) {
                // Use requestAnimationFrame for smooth repositioning
                requestAnimationFrame(() => {
                    markerInfo.marker.setLngLat(markerInfo.coordinates);
                });
            }
        });
    });
    
    // Also ensure markers are positioned correctly after movement ends
    appState.map.on('moveend', () => {
        appState.markers.forEach(markerInfo => {
            if (markerInfo.marker && markerInfo.coordinates) {
                markerInfo.marker.setLngLat(markerInfo.coordinates);
            }
        });
    });
    
    // TODO: Re-enable after fixing position accuracy with scaling
    
    // Also add mousedown for better click detection
    appState.map.on('mousedown', function (e) {
        // This helps with click detection
    });
    
    // Handle map mouse move for hover effects
    // 保存处理器引用以便后续临时禁用
    // Debounced hover handler for performance
    let hoverTimeout = null;
    const debouncedHandleMapHover = (e) => {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }
        hoverTimeout = setTimeout(() => {
            handleMapHover(e);
        }, 300); // 300ms debounce
    };
    
    appState.map._mapHoverHandler = debouncedHandleMapHover;
    appState.map.on('mousemove', debouncedHandleMapHover);
    
    // Handle errors - but don't log every error to avoid spam
    appState.map.on('error', function (e) {
        // Only log if it's not a layer insertion error (common and harmless)
        if (e.error && e.error.message && !e.error.message.includes('layer') && !e.error.message.includes('before')) {
            if (typeof Logger !== 'undefined') {
                Logger.error('Map error', e.error.message);
            } else {
                console.error('Map error:', e.error.message);
            }
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
    // Load country boundaries (GADM level 0)
    loadBoundarySourceForType('country', true); // true = create visible layer
    
    // Load state boundaries (GADM level 1) - preset enabled
    loadBoundarySourceForType('state', true); // true = create visible layer
}

/**
 * Load boundary source for specific type and create visible layer
 * Uses GADM for all types (country, state, city)
 * Falls back to Mapbox Boundaries for country only if GADM is not available
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
    
    // Use GADM for all boundary types (country, state, city)
    if (window.GADM_LOADER) {
        if (typeof Logger !== 'undefined') {
            Logger.info(`Using GADM data for ${areaType}`);
        } else {
            console.log(`🔄 Using GADM data for ${areaType}`);
        }
        try {
            await window.GADM_LOADER.loadBoundarySourceForType(areaType, createVisibleLayer);
            if (typeof Logger !== 'undefined') {
                Logger.success(`Successfully loaded GADM data for ${areaType}`);
            } else {
                console.log(`✅ Successfully loaded GADM data for ${areaType}`);
            }
            return;
        } catch (error) {
            // Only log in dev mode
            if (IS_DEV_MODE) {
                if (typeof Logger !== 'undefined') {
                    Logger.warn(`Failed to load GADM data for ${areaType}`, error.message);
                } else {
                    console.warn(`⚠️ Failed to load GADM data for ${areaType}:`, error.message);
                }
            }
            
            // Show user-friendly error message
            if (typeof showToast === 'function') {
                const areaTypeName = areaType === 'country' ? '國家' : 
                                    areaType === 'state' ? '州/省' : '城市';
                showToast(`無法載入 ${areaTypeName} 邊界數據。請檢查數據文件是否存在。`, 'error', 5000);
            }
            
            // Don't throw here - fallback to Mapbox if GADM fails (for backward compatibility)
            if (areaType === 'state' || areaType === 'city') {
                throw new Error(`行政區數據不可用。請準備 GADM 數據文件。`);
            }
        }
    } else {
        if (typeof Logger !== 'undefined') {
            Logger.warn('GADM_LOADER not available, falling back to Mapbox Boundaries for country only');
        } else {
            console.warn(`⚠️ GADM_LOADER not available, falling back to Mapbox Boundaries for country only`);
        }
    }
    
    // Fallback: Use Mapbox Boundaries (only if GADM is not available or fails for country)
    // This maintains backward compatibility but GADM is preferred
    if (areaType === 'country') {
        if (typeof Logger !== 'undefined') {
            Logger.warn('Falling back to Mapbox Boundaries for country (GADM not available or failed)');
        } else {
            console.log(`⚠️ Falling back to Mapbox Boundaries for country (GADM not available or failed)`);
        }
    const sourceId = getSourceIdForType(areaType);
    const sourceUrl = getSourceUrlForType(areaType);
    
    if (!sourceUrl) {
        if (typeof Logger !== 'undefined') {
            Logger.warn(`No source URL for ${areaType}`);
        } else {
            console.warn(`No source URL for ${areaType}`);
        }
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
        // Check one more time if source exists (race condition prevention)
        if (appState.map.getSource(sourceId)) {
            console.log(`Source ${sourceId} already exists, skipping add`);
            appState.sources[sourceTypeKey] = {
                id: sourceId,
                loaded: true
            };
            if (createVisibleLayer) {
                createVisibleBoundaryLayer(areaType);
            }
            discoverSourceLayers(sourceId, sourceTypeKey);
            return;
        }
        
        // Add source
        appState.map.addSource(sourceId, {
            type: 'vector',
            url: sourceUrl
        });

        // Multiple event handlers to catch source loading
            appState.map.once('sourcedata', function (e) {
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
            appState.map.once('data', function (e) {
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
            appState.map.once('error', function (e) {
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
            window.addEventListener('error', function (e) {
                if (e.target && e.target.src && e.target.src.includes(sourceId) && e.target.src.includes('402')) {
                    if (typeof Logger !== 'undefined') {
                        Logger.warn(`402 ERROR: ${sourceId} - This source requires paid Mapbox access.`);
                    } else {
                        console.warn(`⚠️ 402 ERROR: ${sourceId} - This source requires paid Mapbox access.`);
                    }
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
            if (typeof Logger !== 'undefined') {
                Logger.error(`Error loading source ${sourceId}`, error);
            } else {
                console.error(`Error loading source ${sourceId}:`, error);
            }
            appState.sources[sourceTypeKey] = {
                id: sourceId,
                loaded: false,
                error: error.message
            };
        }
    }
    } else if (areaType === 'state' || areaType === 'city') {
        throw new Error(`行政區數據不可用。請準備 GADM 數據文件。`);
    }
}

/**
 * Create visible boundary layer (single line layer for both display and click detection)
 * Uses shared source - layer references existing source
 * Combined approach: single line layer replaces both fill and line layers
 */
function createVisibleBoundaryLayer(areaType) {
    const layerId = `visible-boundaries-${areaType}`;
    const sourceId = getSourceIdForType(areaType);
    
    // Check if layer already exists
    if (appState.map.getLayer(layerId)) {
        console.log(`Layer ${layerId} already exists`);
        return true; // Already exists
    }
    
    // Check if source exists (must exist before creating layer)
    if (!appState.map.getSource(sourceId)) {
        console.log(`Source ${sourceId} not available yet for ${areaType}`);
        return false;
    }
    
    // Get source layer - use fallback if not discovered yet
    let sourceLayer = getSourceLayerForType(areaType);
    
    // Fallback to known default layer names if not discovered
    if (!sourceLayer) {
        const fallbackLayers = {
            'country': 'boundaries_admin_0',
            'state': 'boundaries_admin_1',
            'city': 'boundaries_admin_2'
        };
        sourceLayer = fallbackLayers[areaType];
        console.log(`Using fallback source layer for ${areaType}: ${sourceLayer}`);
    }
    
    if (!sourceLayer) {
        if (typeof Logger !== 'undefined') {
            Logger.warn(`Cannot create layer ${layerId} - source layer unknown for ${areaType}`);
        } else {
            console.warn(`Cannot create layer ${layerId} - source layer unknown for ${areaType}`);
        }
        return false;
    }
    
    try {
        // Create single line layer (replaces both fill and line layers)
        // Line layers can be used for click detection via queryRenderedFeatures
        const boundaryColor = getContrastingBoundaryColor(); // Gray (#808080)
        const initialWidth = getAdaptiveBoundaryLineWidth(areaType);
        const maxWidth = areaType === 'country' ? 0.2 : 0.3; // Country boundaries are thinner (reduced)
        
    // CRITICAL FIX: For click detection, administrative boundary layers must always be visible when active
    // The boundary line visibility toggle should only control visual appearance (opacity), not clickability
        // Set visibility based on boundary line toggle (separate for country and admin)
    let visibility = 'visible'; // Default to visible for click detection
        if (areaType === 'country') {
            // Country boundaries: show when country boundary toggle is on
        visibility = appState.countryBoundaryVisible ? 'visible' : 'visible'; // Always visible for click detection
        } else if (areaType === 'state' || areaType === 'city') {
        // Admin boundaries: always visible for click detection (opacity will be controlled by toggle)
        visibility = 'visible';
        }
        
        const layerOptions = {
            id: layerId,
            type: 'line',
            source: sourceId,
            'source-layer': sourceLayer,
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
        
        // Add boundary layer AFTER all fill layers (boundary lines should be on top of fills)
        // Strategy: Find the last fill layer (country or admin) and insert boundary line after it
        const lastFillLayerId = findLastFillLayer();
        if (lastFillLayerId && appState.map.getLayer(lastFillLayerId)) {
            // Insert boundary line AFTER the last fill layer (on top of all fills)
            const allLayers = appState.map.getStyle().layers;
            const lastFillLayerIndex = allLayers.findIndex(l => l.id === lastFillLayerId);
            if (lastFillLayerIndex >= 0 && lastFillLayerIndex < allLayers.length - 1) {
                // Insert before the layer after the last fill layer (so boundary is right after fills)
                const insertBeforeId = allLayers[lastFillLayerIndex + 1].id;
                appState.map.addLayer(layerOptions, insertBeforeId);
                console.log(`✅ Created boundary line layer for ${areaType} (inserted after last fill layer: ${lastFillLayerId} - boundary lines on top of fills)`);
            } else {
                // Last fill layer is the last layer, add boundary after it (on top)
                appState.map.addLayer(layerOptions);
                console.log(`✅ Created boundary line layer for ${areaType} (added after last fill layer: ${lastFillLayerId} - boundary lines on top of fills)`);
            }
        } else {
            // No fill layers yet, insert before labels (if available) or add to end
            // When fill layers are added later, they will be inserted before this boundary layer
            const labelLayers = appState.labelLayerIds;
            if (labelLayers.length > 0) {
                appState.map.addLayer(layerOptions, labelLayers[0]);
                console.log(`✅ Created boundary line layer for ${areaType} (inserted before labels, no fill layers yet - fills will be added below this)`);
            } else {
                appState.map.addLayer(layerOptions);
                console.log(`✅ Created boundary line layer for ${areaType} (added to end, no fill layers yet - fills will be added below this)`);
            }
        }
        
        console.log(`✅ Created visible boundary layer for ${areaType} (visibility: ${visibility}, color: ${boundaryColor}, adaptive width)`);
        return true;
    } catch (error) {
        // Try without source-layer if it fails (some sources might not need it)
        if (error.message && error.message.includes('source-layer')) {
            try {
                // Create fallback layer options without source-layer
                const boundaryColor = getContrastingBoundaryColor();
                const initialWidth = getAdaptiveBoundaryLineWidth(areaType);
                const maxWidth = areaType === 'country' ? 0.2 : 0.3; // Country boundaries are thinner (reduced)
                
                // CRITICAL FIX: For click detection, layers must always be visible when active
                // Set visibility based on area type
                let visibility = 'visible'; // Always visible for click detection
                // Note: Opacity will be controlled by boundary line visibility toggle
                
                const fallbackLayerOptions = {
                    id: layerId,
                    type: 'line',
                    source: sourceId,
                    paint: {
                        'line-color': boundaryColor,
                        'line-width': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            3, initialWidth,  // Country: 0.15px, Admin: 0.25px
                            10, maxWidth      // Country: 0.3px, Admin: 0.5px
                        ],
                        'line-opacity': 0.8
                    },
                    layout: {
                        visibility: visibility
                    }
                };
                
                // Insert after fill layers for fallback case
                const lastFillLayerId = findLastFillLayer();
                if (lastFillLayerId && appState.map.getLayer(lastFillLayerId)) {
                    const allLayers = appState.map.getStyle().layers;
                    const lastFillLayerIndex = allLayers.findIndex(l => l.id === lastFillLayerId);
                    if (lastFillLayerIndex >= 0 && lastFillLayerIndex < allLayers.length - 1) {
                        const insertBeforeId = allLayers[lastFillLayerIndex + 1].id;
                        appState.map.addLayer(fallbackLayerOptions, insertBeforeId);
                        console.log(`✅ Created visible boundary layer for ${areaType} (fallback, inserted after last fill layer: ${lastFillLayerId})`);
                    } else {
                        appState.map.addLayer(fallbackLayerOptions);
                        console.log(`✅ Created visible boundary layer for ${areaType} (fallback, added after last fill layer: ${lastFillLayerId})`);
                    }
                } else {
                    const labelLayers = appState.labelLayerIds;
                    if (labelLayers.length > 0) {
                        appState.map.addLayer(fallbackLayerOptions, labelLayers[0]);
                        console.log(`✅ Created visible boundary layer for ${areaType} (fallback, inserted before labels, no fill layers yet)`);
                    } else {
                        appState.map.addLayer(fallbackLayerOptions);
                        console.log(`✅ Created visible boundary layer for ${areaType} (fallback, added to end)`);
                    }
                }
                
                return true;
            } catch (retryError) {
                console.warn(`Could not create layer ${layerId} even without source-layer:`, retryError.message);
            }
        }
        
        // Only log non-trivial errors
        if (error.message && !error.message.includes('already exists')) {
            console.warn(`Could not create layer ${layerId}:`, error.message);
        }
        return false;
    }
}

/**
 * Move boundary layer to top (before labels)
 * Uses moveLayer for efficient layer reordering without removing/re-adding
 * Single line layer replaces both fill and line layers
 */
function moveBoundaryLayersToTop(areaType) {
    const boundaryLayerId = `visible-boundaries-${areaType}`;
    
    if (!appState.map.getLayer(boundaryLayerId)) {
        return; // Boundary layer doesn't exist
    }
    
    const labelLayers = appState.labelLayerIds;
    if (labelLayers.length === 0) {
        return; // No labels to reference
    }
    
    const firstLabelId = labelLayers[0];
    
    try {
        // Move boundary layer to top (before labels)
        appState.map.moveLayer(boundaryLayerId, firstLabelId);
        console.log(`🔄 Moved boundary layer ${boundaryLayerId} to top (before labels)`);
    } catch (error) {
        console.warn(`⚠️ Could not move boundary layer ${boundaryLayerId} to top:`, error);
        // Fallback to old method if moveLayer fails
        ensureBoundaryLayerOnTop(areaType);
    }
}

/**
 * Ensure boundary layer is on top (before labels) - Legacy method using remove/add
 * Kept as fallback if moveLayer fails
 * Single line layer approach
 */
function ensureBoundaryLayerOnTop(areaType) {
    const boundaryLayerId = `visible-boundaries-${areaType}`;
    
    if (!appState.map.getLayer(boundaryLayerId)) {
        return; // Boundary layer doesn't exist
    }
    
    try {
        // Get all layers
        const allLayers = appState.map.getStyle().layers;
        const boundaryLayerIndex = allLayers.findIndex(l => l.id === boundaryLayerId);
        
        if (boundaryLayerIndex === -1) {
            return; // Layer not found
        }
        
        // Check if boundary layer is already before labels
        const labelLayers = appState.labelLayerIds;
        if (labelLayers.length > 0) {
            const firstLabelIndex = allLayers.findIndex(l => l.id === labelLayers[0]);
            
            // If boundary is after first label, move it before labels
            if (firstLabelIndex !== -1 && boundaryLayerIndex > firstLabelIndex) {
                // Remove and re-add before labels to move to top
                const layer = appState.map.getLayer(boundaryLayerId);
                
                // Get layer properties
                const layout = {};
                const paint = {};
                const sourceId = layer.source;
                const sourceLayer = layer['source-layer'];
                const filter = appState.map.getFilter(boundaryLayerId);
                const layerType = layer.type;
                
                // Get all layout properties
                try {
                    const visibility = appState.map.getLayoutProperty(boundaryLayerId, 'visibility');
                    if (visibility !== undefined) layout.visibility = visibility;
                } catch (e) { }
                
                // Get all paint properties (for line layer)
                try {
                    const lineColor = appState.map.getPaintProperty(boundaryLayerId, 'line-color');
                    if (lineColor !== undefined) paint['line-color'] = lineColor;
                    const lineWidth = appState.map.getPaintProperty(boundaryLayerId, 'line-width');
                    if (lineWidth !== undefined) paint['line-width'] = lineWidth;
                    const lineOpacity = appState.map.getPaintProperty(boundaryLayerId, 'line-opacity');
                    if (lineOpacity !== undefined) paint['line-opacity'] = lineOpacity;
                } catch (e) { }
                
                // Remove old layer
                appState.map.removeLayer(boundaryLayerId);
                
                // Re-add before labels (this moves it to top)
                const newLayerOptions = {
                    id: boundaryLayerId,
                    type: layerType,
                    source: sourceId,
                    layout: layout,
                    paint: paint
                };
                
                // Add source-layer if it exists
                if (sourceLayer) {
                    newLayerOptions['source-layer'] = sourceLayer;
                }
                
                // Add filter if it exists
                if (filter) {
                    newLayerOptions.filter = filter;
                }
                
                appState.map.addLayer(newLayerOptions, labelLayers[0]);
                console.log(`🔄 Moved boundary layer ${boundaryLayerId} to top (before labels)`);
                
                // Single layer approach - no separate line layer
                return;
            }
            
            // If boundary is already before labels, check if there are fill layers after it
            // If so, move boundary to ensure it's the topmost non-label layer
            const layersAfterBoundary = allLayers.slice(boundaryLayerIndex + 1, firstLabelIndex);
            const hasFillLayersAfter = layersAfterBoundary.some(l => 
                l.type === 'fill' && l.id.startsWith('area-')
            );
            
            if (hasFillLayersAfter) {
                // There are fill layers after boundary, move boundary to top
                const layer = appState.map.getLayer(boundaryLayerId);
                const sourceId = layer.source;
                const sourceLayer = layer['source-layer'];
                const filter = appState.map.getFilter(boundaryLayerId);
                const layerType = layer.type;
                
                const layout = {};
                const paint = {};
                try {
                    const visibility = appState.map.getLayoutProperty(boundaryLayerId, 'visibility');
                    if (visibility !== undefined) layout.visibility = visibility;
                } catch (e) { }
                // Get all paint properties (for line layer - boundary layers are now line type)
                try {
                    const lineColor = appState.map.getPaintProperty(boundaryLayerId, 'line-color');
                    if (lineColor !== undefined) paint['line-color'] = lineColor;
                    const lineWidth = appState.map.getPaintProperty(boundaryLayerId, 'line-width');
                    if (lineWidth !== undefined) paint['line-width'] = lineWidth;
                    const lineOpacity = appState.map.getPaintProperty(boundaryLayerId, 'line-opacity');
                    if (lineOpacity !== undefined) paint['line-opacity'] = lineOpacity;
                } catch (e) { }
                
                appState.map.removeLayer(boundaryLayerId);
                
                const newLayerOptions = {
                    id: boundaryLayerId,
                    type: layerType,
                    source: sourceId,
                    layout: layout,
                    paint: paint
                };
                
                if (sourceLayer) {
                    newLayerOptions['source-layer'] = sourceLayer;
                }
                if (filter) {
                    newLayerOptions.filter = filter;
                }
                
                appState.map.addLayer(newLayerOptions, labelLayers[0]);
                console.log(`🔄 Moved boundary layer ${boundaryLayerId} to top (above fill layers)`);
            }
        } else {
            // No labels cached, boundary should already be at top if it was added correctly
            console.log(`ℹ️ No labels cached, boundary layer ${boundaryLayerId} position: ${boundaryLayerIndex}`);
        }
    } catch (error) {
        console.warn(`⚠️ Could not move boundary layer ${boundaryLayerId} to top:`, error);
    }
}

/**
 * Calculate contrasting color for boundary lines
 * Default: gray (#808080) for subtle visibility
 */
function getContrastingBoundaryColor() {
    // Default to gray for better visibility without being too prominent
    return '#808080'; // Gray color
}

/**
 * Calculate adaptive line width based on zoom level
 * Thinner lines at lower zoom levels, thicker at higher zoom levels
 */
/**
 * Get adaptive boundary line width based on zoom level
 * Returns width between 0.25px and 0.5px for admin areas
 * Returns width between 0.15px and 0.3px for country (thinner)
 * @param {string} areaType - 'country' | 'state' | 'city'
 */
function getAdaptiveBoundaryLineWidth(areaType = 'state') {
    if (!appState.map) return areaType === 'country' ? 0.1 : 0.15; // Default fallback (thinner)
    
    const zoom = appState.map.getZoom();
    
    if (areaType === 'country') {
        // Country boundaries: 0.1px at zoom 3, gradually increase to 0.2px at zoom 10+
        // Formula: 0.1 + (zoom - 3) * 0.0143, clamped between 0.1 and 0.2
        const width = Math.max(0.1, Math.min(0.2, 0.1 + (zoom - 3) * 0.0143));
        return width;
    } else {
        // Admin boundaries (state/city): 0.15px at zoom 3, gradually increase to 0.3px at zoom 10+
        // Formula: 0.15 + (zoom - 3) * 0.0214, clamped between 0.15 and 0.3
        const width = Math.max(0.15, Math.min(0.3, 0.15 + (zoom - 3) * 0.0214));
        return width;
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
 * 檢查點擊位置是否在標記上
 * 使用多種方法來確保準確檢測
 * 
 * @param {Object} e - Mapbox click event
 * @returns {boolean} - 如果點擊了標記，返回 true
 */
function isClickOnMarker(e) {
    // 方法 1: 檢查 DOM 元素（最直接的方法）
    if (e.originalEvent && e.originalEvent.target) {
        const target = e.originalEvent.target;
        
        // 使用 closest 方法（最快）
        if (target.closest) {
            const markerElement = target.closest('.apple-marker, .marker-element, [data-marker-id]');
            if (markerElement) {
                return true;
            }
        }
        
        // 向上遍歷 DOM 樹
        let currentElement = target;
        let checkDepth = 0;
        const maxDepth = 10;
        
        while (currentElement && checkDepth < maxDepth) {
            if (currentElement.classList) {
                if (currentElement.classList.contains('apple-marker') ||
                    currentElement.classList.contains('marker-element') ||
                    currentElement.dataset?.markerId) {
                    return true;
                }
            }
            currentElement = currentElement.parentElement;
            checkDepth++;
        }
    }
    
    // 方法 2: 使用 Mapbox 的投影功能檢查點擊位置是否接近標記座標
    // 這是更可靠的方法，因為它直接使用地圖座標系統
    if (e.point && e.lngLat && appState.markers && appState.markers.length > 0 && appState.map) {
        const clickPoint = e.point;
        
        // 根據當前縮放級別計算合理的閾值（像素）
        const currentZoom = appState.map.getZoom();
        // 在較高縮放級別時使用更小的閾值，在較低縮放級別時使用較大的閾值
        // 基準：zoom 10 時使用 30 像素，每縮小一級增加 50%
        const baseZoom = 10;
        const baseThresholdPixels = 30;
        const thresholdPixels = baseThresholdPixels * Math.pow(1.5, baseZoom - currentZoom);
        
        for (const markerInfo of appState.markers) {
            if (!markerInfo.coordinates || markerInfo.coordinates.length < 2) continue;
            
            try {
                // 將標記座標投影到像素座標
                const markerLngLat = markerInfo.coordinates;
                const markerPoint = appState.map.project(markerLngLat);
                
                // 計算點擊位置與標記位置的像素距離
                const pixelDistance = Math.sqrt(
                    Math.pow(clickPoint.x - markerPoint.x, 2) + 
                    Math.pow(clickPoint.y - markerPoint.y, 2)
                );
                
                // 如果點擊位置在閾值範圍內，認為是點擊了標記
                if (pixelDistance < thresholdPixels) {
                    return true;
                }
            } catch (err) {
                // 忽略檢查錯誤，繼續其他方法
                console.warn('Error checking marker position:', err);
            }
        }
    }
    
    return false;
}

/**
 * Handle Map Click - IMPROVED VERSION
 * Tries all boundary levels (city → state → country) to find what was clicked
 */
function handleMapClick(e) {
    // 如果正在拖曳中文标签，跳过处理（避免干扰拖曳）
    if (appState.labelDragState && appState.labelDragState.isDragging) {
        console.log('📍 正在拖曳中文標籤，跳過地圖點擊處理');
        return;
    }

    // 如果正在拖曳文字标签，跳过处理（避免干扰拖曳）
    if (appState.textLabelDragState && appState.textLabelDragState.isDragging) {
        console.log('📍 正在拖曳文字標籤，跳過地圖點擊處理');
        return;
    }

    // 如果正在移动中文标签（点击放置），跳过处理（避免触发填色 popup）
    if (appState._isMovingLabel || (appState.labelSelectState && appState.labelSelectState.selectedLabelId)) {
        console.log('📍 正在移動中文標籤，跳過地圖點擊處理');
        return;
    }

    // 優先檢查：是否點擊了標記元素
    // 使用專門的函數進行多層檢測
    if (isClickOnMarker(e)) {
        console.log('📍 檢測到點擊標記，跳過地圖點擊處理');
        return; // 直接返回，不執行後續邏輯（包括邊界檢測）
    }
    
    // 優先檢查：是否點擊了文字標籤（用於拖拽）
    try {
        const textLabelFeatures = appState.map.queryRenderedFeatures(e.point, {
            layers: ['map-text-labels-hit-area']
        });
        if (textLabelFeatures.length > 0) {
            console.log('📍 檢測到點擊文字標籤，跳過地圖點擊處理（由拖拽處理）');
            return; // 讓拖拽事件處理，不執行地圖點擊邏輯
        }
    } catch (error) {
        // 如果 hit-area 層不存在，忽略錯誤
    }
    
    // 優先檢查：是否點擊了中文標籤（用於拖拽）
    try {
        const labelFeatures = appState.map.queryRenderedFeatures(e.point, {
            layers: ['custom-chinese-labels-hit-area']
        });
        if (labelFeatures.length > 0) {
            console.log('📍 檢測到點擊中文標籤，跳過地圖點擊處理（由拖拽處理）');
            return; // 讓拖拽事件處理，不執行地圖點擊邏輯
        }
    } catch (error) {
        // 如果 hit-area 層不存在，忽略錯誤
    }
    
    console.log('🖱️ Map clicked at:', e.point);
    
    // Text Mode: Add text label when enabled
    if (appState.textMode) {
        const text = prompt('请输入文字内容:', '');
        if (text && text.trim()) {
            addMapTextLabel([e.lngLat.lng, e.lngLat.lat], text);
            showToast('文字已添加', 'success');
        }
        return;
    }
    
    // Marker Mode: Always add marker when enabled
    if (appState.markerMode) {
        addMarkerAtLocation(e);
        return;
    }
    
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
        // No boundary detected - check if AI results preview is visible
        const aiResultsPreview = document.getElementById('ai-results-preview');
        const isAIResultsVisible = aiResultsPreview && aiResultsPreview.style.display !== 'none';
        
        if (isAIResultsVisible) {
            console.log('📍 AI結果預覽正在顯示，跳過自動添加標記（請使用AI結果列表中的標記）');
            showToast('AI結果預覽正在顯示，請使用列表中的標記或切換到標記模式', 'info', 3000);
            return;
        }
        
        // No boundary detected - add marker at click location
        console.log('📍 No boundary detected - adding marker at click location');
        addMarkerAtLocation(e);
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
    // 如果正在拖曳中文标签，跳过处理（避免干扰拖曳）
    if (appState.labelDragState && appState.labelDragState.isDragging) {
        return;
    }

    // 如果正在拖曳文字标签，跳过处理（避免干扰拖曳）
    if (appState.textLabelDragState && appState.textLabelDragState.isDragging) {
        return;
    }

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
// Development mode flag (only log detailed info in dev)
const IS_DEV_MODE = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname === '';

function queryFeaturesAtPoint(point, areaType) {
    const layerId = `visible-boundaries-${areaType}`;
    const lineLayerId = `${layerId}-lines`;
    
    // Only log in development mode
    if (IS_DEV_MODE) {
    console.log(`🔍 Querying for ${areaType} at point:`, point);
    console.log(`   Looking for layer: ${layerId}`);
    }
    
    try {
        // Step 1: Check if GADM source exists and query directly from GADM layers
        const gadmSourceId = `gadm-${areaType}`;
        if (appState.map.getSource(gadmSourceId)) {
            if (IS_DEV_MODE) console.log(`   ✅ GADM source exists: ${gadmSourceId}`);
            
            // Query from single boundary layer (line layer works for click detection)
            if (appState.map.getLayer(layerId)) {
                // Query even if not visible - line layers can be queried for click detection
                const layerFeatures = appState.map.queryRenderedFeatures(point, {
                    layers: [layerId],
                    radius: 100 // Increased radius for better click detection on line layers
                });
                
                if (layerFeatures.length > 0) {
                    // Verify these are actually GADM features
                    const gadmFeatures = layerFeatures.filter(f => {
                        const props = f.properties || {};
                        const hasGID = props.GID_0 || props.GID_1 || props.GID_2;
                        return hasGID && f.source === gadmSourceId;
                    });
                    
                    if (gadmFeatures.length > 0) {
                        if (IS_DEV_MODE) console.log(`✅ Found ${gadmFeatures.length} GADM features from layer ${layerId}`);
                        return gadmFeatures;
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
                if (IS_DEV_MODE) console.log(`✅ Found ${gadmFeatures.length} features from GADM source ${gadmSourceId}`);
                return gadmFeatures;
            } else {
                if (IS_DEV_MODE) console.warn(`⚠️ GADM source exists but no features found at point`);
                // For line layers, queryRenderedFeatures only finds features when clicking on the line
                // We need to use querySourceFeatures and point-in-polygon test for clicks inside polygons
                const source = appState.map.getSource(gadmSourceId);
                if (source && source._data && source._data.features) {
                    const lngLat = appState.map.unproject(point);
                    if (IS_DEV_MODE) console.log(`   🔍 Using point-in-polygon test for GADM source with ${source._data.features.length} features at [${lngLat.lng}, ${lngLat.lat}]`);
                    
                    // Use point-in-polygon test (need to implement or import from unified-interface)
                    const containingFeatures = source._data.features.filter(f => {
                        if (!f.geometry) return false;
                        
                        // Check level match
                        const props = f.properties || {};
                        if (areaType === 'country' && !props.GID_0) return false;
                        if (areaType === 'state' && !props.GID_1) return false;
                        if (areaType === 'city' && !props.GID_2) return false;
                        
                        // Point-in-polygon test
                        return isPointInPolygonGADM([lngLat.lng, lngLat.lat], f.geometry);
                    });
                    
                    if (containingFeatures.length > 0) {
                        if (IS_DEV_MODE) console.log(`✅ Found ${containingFeatures.length} features using point-in-polygon test`);
                        // Convert to format expected by Mapbox (add layer and source info)
                        return containingFeatures.map(f => ({
                            ...f,
                            source: gadmSourceId,
                            layer: { id: layerId }
                        }));
                    }
                }
            }
        }
        
        // Step 2: Query from visible boundary layer (single line layer works for both display and click detection)
        let features = [];
        
        if (appState.map.getLayer(layerId)) {
            const visibility = appState.map.getLayoutProperty(layerId, 'visibility');
            if (IS_DEV_MODE) console.log(`   Checking layer ${layerId}: visibility = ${visibility}`);
            
            // Query even if visibility is 'none' for click detection (but prioritize visible layers)
            // Line layers can be queried even when not visible, but it's better to show visible ones
            const layerFeatures = appState.map.queryRenderedFeatures(point, {
                layers: [layerId],
                radius: 100 // Increased radius for better click detection on line layers
            });
            
            if (IS_DEV_MODE) console.log(`   Layer ${layerId} query returned ${layerFeatures.length} features`);
            
            if (layerFeatures.length > 0) {
                if (IS_DEV_MODE) console.log(`✅ Found ${layerFeatures.length} features from layer ${layerId}`);
                features = layerFeatures;
            }
        }
        
        // Step 3: If no features from specific layers, query all and filter
        if (features.length === 0) {
            if (IS_DEV_MODE) console.log(`   No features from specific layers, querying all features...`);
            const allFeatures = appState.map.queryRenderedFeatures(point, {
                radius: 100 // Increased radius for better click detection
            });
            
            if (IS_DEV_MODE) {
            console.log(`📊 Total features found: ${allFeatures.length}`);
            // Debug: Log all sources found
            const sourcesFound = [...new Set(allFeatures.map(f => f.source).filter(Boolean))];
            console.log(`   Sources found: ${sourcesFound.join(', ')}`);
            }
            
            // Filter for features from our boundary layers
            features = allFeatures.filter(f => {
                const props = f.properties || {};
                
                // Priority 1: Accept if from our visible boundary layer
                if (f.layer && f.layer.id === layerId) {
                    if (IS_DEV_MODE) console.log(`   ✅ MATCHED: Our layer (${f.layer.id})`);
                    return true;
                }
                
                // Priority 2: Accept if from GADM source (for all levels)
                if (f.source && f.source === gadmSourceId) {
                    if (IS_DEV_MODE) console.log(`   ✅ MATCHED: GADM source (${f.source})`);
                    return true;
                }
                
                // Priority 3: Accept if has GID properties (GADM data - all levels)
                if (props.GID_0 || props.GID_1 || props.GID_2) {
                    // Check level match
                    if (areaType === 'country' && props.GID_0) {
                        if (IS_DEV_MODE) console.log(`   ✅ MATCHED: GADM country feature (GID_0: ${props.GID_0})`);
                        return true;
                    }
                    if (areaType === 'state' && props.GID_1) {
                        if (IS_DEV_MODE) console.log(`   ✅ MATCHED: GADM state feature (GID_1: ${props.GID_1})`);
                        return true;
                    }
                    if (areaType === 'city' && props.GID_2) {
                        if (IS_DEV_MODE) console.log(`   ✅ MATCHED: GADM city feature (GID_2: ${props.GID_2})`);
                        return true;
                    }
                }
                
                // Priority 4: Accept if from country-specific source (for state/city)
                if ((areaType === 'state' || areaType === 'city') && 
                    appState.selectedCountry &&
                    f.source && f.source.includes(`country-${areaType}-${appState.selectedCountry.id}`)) {
                    if (IS_DEV_MODE) console.log(`   ✅ MATCHED: Country-specific source (${f.source})`);
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
        
        if (IS_DEV_MODE) console.log(`📊 Filtered to ${features.length} ${areaType} features`);
        
        // Debug: Log first feature if found (only in dev mode)
        if (features.length > 0 && IS_DEV_MODE) {
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
        
        // If still no features, provide helpful diagnostic info (only in dev mode or on click)
        // Note: This is called from handleMapClick, so we show user-friendly message
        if (features.length === 0) {
            // Only show detailed diagnostics in dev mode
            if (IS_DEV_MODE) {
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
        }
        
        return features || [];
        
    } catch (error) {
        console.error('Error querying features:', error);
        return [];
    }
}

/**
 * Point-in-polygon test using ray casting algorithm
 * Used for GADM GeoJSON data when queryRenderedFeatures fails (click inside polygon, not on line)
 */
function isPointInPolygonGADM(point, geometry) {
    const [lng, lat] = point;
    let inside = false;
    
    if (geometry.type === 'Polygon') {
        const coordinates = geometry.coordinates[0]; // Outer ring
        for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
            const xi = coordinates[i][0]; // lng
            const yi = coordinates[i][1]; // lat
            const xj = coordinates[j][0]; // lng
            const yj = coordinates[j][1]; // lat
            
            // Ray casting algorithm: check if ray from point going east intersects edge
            const intersect = ((yi > lat) !== (yj > lat)) &&
                            (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
    } else if (geometry.type === 'MultiPolygon') {
        // Check if point is in any polygon
        for (const polygon of geometry.coordinates) {
            inside = false; // Reset for each polygon
            const coordinates = polygon[0]; // Outer ring of polygon
            for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
                const xi = coordinates[i][0]; // lng
                const yi = coordinates[i][1]; // lat
                const xj = coordinates[j][0]; // lng
                const yj = coordinates[j][1]; // lat
                
                // Ray casting algorithm
                const intersect = ((yi > lat) !== (yj > lat)) &&
                                (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            if (inside) break; // Found in one polygon, no need to check others
        }
    }
    
    return inside;
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
    const applyHandler = async () => {
        const selectedColor = colorPicker.value;
        await applyColorToArea(areaId, areaName, areaType, selectedColor);
        hideColorPickerPopup();
    };
    
    const cancelHandler = () => {
        hideColorPickerPopup();
    };
    
    // ESC 键取消
    const escHandler = (e) => {
        if (e.key === 'Escape' && popup.style.display !== 'none') {
            cancelHandler();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
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
        popupHexInput.addEventListener('input', function () {
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
async function applyColorToArea(areaId, areaName, areaType, color) {
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
        // Add new area (store boundaryMode used when coloring)
        appState.selectedAreas.push({
            id: areaId,
            name: areaName,
            type: areaType,
            color: color,
            layerId: layerId,
            boundaryMode: appState.boundaryMode || 'fill' // Store the boundary mode used when this area was colored
        });
        
        // Pass boundaryMode to createAreaLayer to preserve the mode
        await createAreaLayer(areaId, areaName, areaType, color, layerId, appState.boundaryMode || 'fill');
        updateSelectedAreasList();
    }
    
    // Update current color
    appState.currentColor = color;
    const colorPicker = document.getElementById('color-picker');
    if (colorPicker) {
        // Normalize color format: #F0F → #FF00FF (3-digit to 6-digit hex)
        let normalizedColor = color;
        if (/^#([0-9A-Fa-f]{3})$/.test(color)) {
            normalizedColor = '#' + color.slice(1).split('').map(c => c + c).join('');
        }
        colorPicker.value = normalizedColor;
    }
    
    // Don't show toast - less annoying
    // showToast(`${areaName} colored successfully`, 'success');
}

/**
 * Create Area Layer with Overlay Support
 * @param {string} areaId - Area identifier
 * @param {string} areaName - Area name
 * @param {string} areaType - Area type (country/state/city)
 * @param {string} color - Color to apply
 * @param {string} layerId - Layer ID
 * @param {string} boundaryMode - Optional: 'fill' or 'outline'. If not provided, uses appState.boundaryMode
 */
async function createAreaLayer(areaId, areaName, areaType, color, layerId, boundaryMode = null) {
    // 强制使用 GADM 源 - 不再使用 Mapbox 源
    const gadmSourceId = `gadm-${areaType}`;
    
    // 等待 GADM 源加载（更长的等待时间和更好的检测）
    let hasGADMSource = appState.map.getSource(gadmSourceId);
    if (!hasGADMSource) {
        console.log(`⚠️ GADM source ${gadmSourceId} not found, attempting to reload...`);
        if (typeof loadBoundarySourceForType === 'function') {
            try {
                // 触发加载
                await loadBoundarySourceForType(areaType, false);
                
                // 等待源真正添加到地图（更长的等待时间，最多 15 秒）
                let waited = 0;
                const maxWait = 15000;
                const checkInterval = 200;
                
                while (waited < maxWait) {
                    await new Promise(resolve => setTimeout(resolve, checkInterval));
                    waited += checkInterval;
                    
                    hasGADMSource = appState.map.getSource(gadmSourceId);
                    if (hasGADMSource) {
                        console.log(`✅ GADM source ${gadmSourceId} reloaded and available after ${waited}ms`);
                        // 额外等待 500ms 确保源完全就绪
                        await new Promise(resolve => setTimeout(resolve, 500));
                        break;
                    }
                }
                
                if (!hasGADMSource) {
                    throw new Error(`GADM source ${gadmSourceId} failed to load after ${maxWait}ms`);
                }
            } catch (reloadError) {
                console.error(`Failed to reload GADM source ${gadmSourceId}:`, reloadError);
                throw new Error(`无法加载边界数据源：${reloadError.message}。请刷新页面重试。`);
            }
        } else {
            throw new Error(`loadBoundarySourceForType 函数不可用`);
        }
    }
    
    // 确保使用 GADM 源（不再检查 Mapbox）
    if (!hasGADMSource) {
        throw new Error(`GADM 数据源不可用：${gadmSourceId}。系统仅使用 GADM 数据进行填色，请确保数据已加载。`);
    }
    
    // 检查 areaId 是否为有效的 GADM ID
    if (areaId.includes('place.') || areaId.includes('region.') || areaId.includes('_place.') || areaId.includes('_region.')) {
        console.error(`❌ [createAreaLayer] 无法使用 Mapbox ID "${areaId}" 与 GADM 源。ID 转换失败。`);
        throw new Error(`ID 转换失败：无法使用 Mapbox ID "${areaId}" 与 GADM 源。请在地图上直接点击选择区域。`);
    }
    
    const sourceId = gadmSourceId;
    const sourceLayer = undefined; // GeoJSON 源不需要 source-layer
    const filter = createFilterForArea(areaId, areaType, true); // true = GADM 格式
    console.log(`🎨 使用 GADM 创建填色图层: ${sourceId}, areaId: ${areaId}`);
    
    try {
        // Determine if this is an admin layer (for overlay mode)
        const isAdmin = areaType === 'state' || areaType === 'city';
        const isCountry = areaType === 'country';
        
        // Determine layer insertion point for z-ordering
        // Always use z-ordering to ensure admin fills are above country fills
        let insertBefore = undefined;
        // Always enable z-ordering (not just in overlay mode) to ensure correct layer order
            insertBefore = getInsertionPoint(isAdmin ? 'admin' : 'country');
            console.log(`   Z-order: ${isAdmin ? 'admin' : 'country'} layer, insertBefore: ${insertBefore || 'end'}`);
        
        // Set opacity based on overlay mode and layer type
        // All fills should have transparency to see underlying map
        let fillOpacity = 0.5; // Default - 50% transparency for better visibility of underlying map
        let lineOpacity = 0.9;
        
        if (appState.overlayMode) {
            if (isAdmin) {
                fillOpacity = 0.6; // 40% transparency for admin overlays (more visible but still transparent)
                lineOpacity = 0.95;
            } else if (isCountry) {
                fillOpacity = 0.5; // 50% transparency for country base layer
                lineOpacity = 0.85;
            }
        } else {
            // Non-overlay mode - use semi-transparent opacity (50% = 0.5)
            fillOpacity = 0.5; // 50% transparency - always transparent
            lineOpacity = 0.8;
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
        
        // Use provided boundaryMode or fall back to appState.boundaryMode
        // CRITICAL FIX: Ensure boundaryMode defaults to 'fill' if not set
        if (!appState.boundaryMode) {
            appState.boundaryMode = 'fill';
        }
        const areaBoundaryMode = boundaryMode !== null ? boundaryMode : (appState.boundaryMode || 'fill');
        
        // Add layer
        const paint = areaBoundaryMode === 'fill' 
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
            type: areaBoundaryMode === 'fill' ? 'fill' : 'line',
            source: sourceId,
            filter: filter,
            paint: paint
        };
        
        // Only add source-layer for vector sources (not GeoJSON)
        if (sourceLayer) {
            layerDef['source-layer'] = sourceLayer;
        }
        
        // Add layer with proper z-ordering
        // Strategy: Admin fills above country fills, boundary lines above all fills
        const boundaryLayerId = `visible-boundaries-${areaType}`;
        const hasBoundaryLayer = appState.map.getLayer(boundaryLayerId);
        
        try {
            // Priority 1: Use overlay mode insertion point (ensures admin above country)
            // This takes precedence to ensure correct country/admin ordering
            if (insertBefore && appState.map.getLayer(insertBefore)) {
                appState.map.addLayer(layerDef, insertBefore);
                console.log(`✅ Created ${isAdmin ? 'admin' : 'country'} fill layer: ${layerId} (inserted before ${insertBefore} - admin above country)`);
            }
            // Priority 2: Insert fill layer BEFORE boundary layer if it exists (boundary lines on top)
            else if (hasBoundaryLayer) {
                appState.map.addLayer(layerDef, boundaryLayerId);
                console.log(`✅ Created fill layer: ${layerId} (inserted before boundary layer ${boundaryLayerId} - boundary lines will be on top)`);
            }
            // Priority 3: Before labels if they exist
            else {
                const labelLayers = appState.labelLayerIds;
                if (labelLayers.length > 0) {
                    appState.map.addLayer(layerDef, labelLayers[0]);
                    console.log(`✅ Created color layer: ${layerId} (inserted before labels)`);
                } else {
                    appState.map.addLayer(layerDef);
                    console.log(`✅ Created color layer: ${layerId} (added to top)`);
                }
            }
            
            // Note: Boundary layers are now inserted after fill layers, not moved to top
        } catch (err) {
            console.error(`Error adding layer ${layerId}:`, err);
            // Fallback: try to insert before boundary layer if it exists
            if (hasBoundaryLayer) {
                try {
                    appState.map.addLayer(layerDef, boundaryLayerId);
                    console.log(`✅ Created color layer: ${layerId} (fallback - inserted before boundary)`);
                    // Boundary layers are now inserted after fill layers, not moved to top
                } catch (fallbackErr) {
                    // Last resort: just add the layer
                    appState.map.addLayer(layerDef);
                    console.log(`✅ Created color layer: ${layerId} (fallback - added to end)`);
                }
            } else {
                // Last resort: just add the layer
                appState.map.addLayer(layerDef);
                console.log(`✅ Created color layer: ${layerId} (fallback - added to end)`);
            }
        }
        
        // Track layer IDs for z-ordering (always track, not just in overlay mode)
        // This ensures admin fills are always above country fills
            if (isAdmin) {
                if (!appState.adminLayerIds.includes(layerId)) {
                    appState.adminLayerIds.push(layerId);
                }
            } else if (isCountry) {
                if (!appState.countryLayerIds.includes(layerId)) {
                    appState.countryLayerIds.push(layerId);
            }
        }
        
        // Ensure boundary layers are always on top of fill layers
        // After adding a fill layer, move boundary layer to be after all fill layers
        if (hasBoundaryLayer && areaBoundaryMode === 'fill') {
            // Find the last fill layer (should be the one we just added)
            const lastFillLayerId = findLastFillLayer();
            if (lastFillLayerId) {
                try {
                    // Move boundary layer right after the last fill layer
                    const allLayers = appState.map.getStyle().layers;
                    const lastFillLayerIndex = allLayers.findIndex(l => l.id === lastFillLayerId);
                    const boundaryIndex = allLayers.findIndex(l => l.id === boundaryLayerId);
                    
                    if (lastFillLayerIndex >= 0 && boundaryIndex >= 0) {
                        // Only move if boundary is not already right after the last fill layer
                        if (boundaryIndex <= lastFillLayerIndex) {
                            // Boundary is before or at the last fill layer, move it after
                            if (lastFillLayerIndex < allLayers.length - 1) {
                                // There's a layer after the last fill layer
                                const insertBeforeId = allLayers[lastFillLayerIndex + 1].id;
                                // Don't move if the next layer is already the boundary
                                if (insertBeforeId !== boundaryLayerId) {
                                    appState.map.moveLayer(boundaryLayerId, insertBeforeId);
                                    console.log(`🔄 Moved boundary layer ${boundaryLayerId} to be after fill layer ${lastFillLayerId} (boundary lines on top of fills)`);
                                }
                            } else {
                                // Last fill layer is at the end, move boundary to after it
                                appState.map.moveLayer(boundaryLayerId);
                                console.log(`🔄 Moved boundary layer ${boundaryLayerId} to be after fill layer ${lastFillLayerId} (boundary lines on top of fills)`);
                            }
                        } else if (boundaryIndex === lastFillLayerIndex + 1) {
                            // Boundary is already right after the last fill layer - perfect!
                            console.log(`✅ Boundary layer ${boundaryLayerId} is already in correct position (after fill layer ${lastFillLayerId})`);
                        }
                        // If boundaryIndex > lastFillLayerIndex + 1, boundary is already after fills, no need to move
                    }
                } catch (moveErr) {
                    console.warn(`⚠️ Could not move boundary layer:`, moveErr);
                }
            }
        }
        
        console.log(`   Filter:`, filter);
        console.log(`   Color: ${color}`);
        console.log(`   Opacity: ${fillOpacity} (fill) / ${lineOpacity} (line)`);
        console.log(`   Layer type: ${areaBoundaryMode}`);
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
    
    // 更新自定义标签（在区域创建后）
    setTimeout(() => {
        updateCustomChineseLabels();
    }, 500);
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
 * Find the last fill layer (either country or admin) in z-order
 * Used to determine where to insert boundary layers (after all fill layers)
 */
function findLastFillLayer() {
    const allLayers = appState.map.getStyle().layers;
    
    // Collect all fill layer IDs
    const allFillLayerIds = [...appState.countryLayerIds, ...appState.adminLayerIds];
    
    if (allFillLayerIds.length === 0) {
        return null;
    }
    
    // Find the fill layer with the highest index (last in z-order)
    let lastFillLayerId = null;
    let lastFillLayerIndex = -1;
    
    allFillLayerIds.forEach(layerId => {
        const index = allLayers.findIndex(l => l.id === layerId);
        if (index > lastFillLayerIndex) {
            lastFillLayerIndex = index;
            lastFillLayerId = layerId;
        }
    });
    
    return lastFillLayerId;
}

/**
 * Determine the correct layer insertion point for z-ordering (overlay mode)
 * This ensures admin fill layers are ALWAYS above country fill layers
 * Order: Country fills (bottom) -> Admin fills (middle) -> Boundary lines (top)
 */
function getInsertionPoint(layerType) {
    const labelLayers = appState.labelLayerIds;
    const allLayers = appState.map.getStyle().layers;
    
    if (layerType === 'admin') {
        // Admin areas go above ALL country layers, below labels and boundary lines
        // Find the highest country layer to insert above it
        if (appState.countryLayerIds.length > 0) {
            // Get the last country layer (highest in z-order)
            const lastCountryLayer = appState.countryLayerIds[appState.countryLayerIds.length - 1];
            const countryLayerIndex = allLayers.findIndex(l => l.id === lastCountryLayer);

            if (countryLayerIndex >= 0) {
                // Find the next layer after the last country layer
                // Skip any other country layers, but include boundary lines
                for (let i = countryLayerIndex + 1; i < allLayers.length; i++) {
                    const nextLayer = allLayers[i];
                    // If we hit a boundary layer or label, insert before it
                    if (nextLayer.id.startsWith('visible-boundaries-') ||
                        labelLayers.includes(nextLayer.id)) {
                        console.log(`   Inserting admin layer above country layer: ${lastCountryLayer}, before ${nextLayer.id}`);
                        return nextLayer.id;
                    }
                    // If we hit another admin layer, insert before it (maintain order)
                    if (appState.adminLayerIds.includes(nextLayer.id)) {
                        console.log(`   Inserting admin layer above country layer: ${lastCountryLayer}, before admin layer ${nextLayer.id}`);
                        return nextLayer.id;
                    }
                }
                // If no suitable layer found, insert after last country layer
                if (countryLayerIndex < allLayers.length - 1) {
                    console.log(`   Inserting admin layer above country layer: ${lastCountryLayer}, after it`);
                return allLayers[countryLayerIndex + 1].id;
            }
        }
        }
        // If no country layers, insert before labels or boundary lines
        // Find first boundary layer or label
        for (let i = 0; i < allLayers.length; i++) {
            const layer = allLayers[i];
            if (layer.id.startsWith('visible-boundaries-') || labelLayers.includes(layer.id)) {
                return layer.id;
            }
        }
        return labelLayers.length > 0 ? labelLayers[0] : undefined;
    } else if (layerType === 'country') {
        // Country layers go below admin layers
        // If there are admin layers, insert before the first one
        if (appState.adminLayerIds.length > 0) {
            const firstAdminLayer = appState.adminLayerIds[0];
            const adminLayerIndex = allLayers.findIndex(l => l.id === firstAdminLayer);
            if (adminLayerIndex >= 0) {
            console.log(`   Inserting country layer below admin layer: ${firstAdminLayer}`);
            return firstAdminLayer;
        }
        }
        // If no admin layers, insert before labels or boundary lines
        for (let i = 0; i < allLayers.length; i++) {
            const layer = allLayers[i];
            if (layer.id.startsWith('visible-boundaries-') || labelLayers.includes(layer.id)) {
                return layer.id;
            }
        }
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
            // GADM uses GID_0 which is the ISO 3-letter country code (same format as areaId)
            // Exclude Taiwan (TWN) from China (CHN) boundaries
            if (areaId === 'CHN' || areaId === 'China') {
                return [
                    'all',
                    ['==', ['get', 'GID_0'], 'CHN']
                    // Note: Taiwan has its own GID_0='TWN', so it won't be included in CHN filter
                ];
            }
            // For GADM, GID_0 is the ISO 3-letter code (e.g., 'AZE', 'ARM', 'RUS', 'USA')
            // areaId should already be in this format (e.g., 'AZE' from findAreaIdByName)
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
 * Hide Mapbox base map boundaries (admin-0-boundary, admin-1-boundary, etc.)
 */
function hideMapboxBaseMapBoundaries() {
    if (!appState.map) return;
    
    // Hide all Mapbox base map boundary layers
    const baseMapBoundaryLayers = [
        'admin-0-boundary',           // Country boundaries
        'admin-0-boundary-bg',        // Country boundary background
        'admin-0-boundary-disputed',  // Disputed country boundaries
        'admin-1-boundary',           // State boundaries
        'admin-1-boundary-bg'         // State boundary background
    ];
    
    baseMapBoundaryLayers.forEach(layerId => {
        if (appState.map.getLayer(layerId)) {
            appState.map.setLayoutProperty(layerId, 'visibility', 'none');
            console.log(`✅ Hidden Mapbox base map layer: ${layerId}`);
        }
    });
}

/**
 * Update Boundary Line Visibility
 */
function updateBoundaryLineVisibility() {
    if (!appState.map) return;
    
    // 底图样式自带的边界线图层 ID
    const baseMapBoundaryLayers = {
        admin: ['admin-1-boundary', 'admin-1-boundary-bg'],  // 行政區边界线
        country: ['admin-0-boundary', 'admin-0-boundary-bg', 'admin-0-boundary-disputed']  // 国家边界线
    };
    
    // Update all boundary layers (single line layer per area type)
    ['country', 'state', 'city'].forEach(areaType => {
        const layerId = `visible-boundaries-${areaType}`;
        if (appState.map.getLayer(layerId)) {
            if (areaType === 'country') {
                // Country boundaries: control visibility with toggle
                const shouldBeVisible = appState.countryBoundaryVisible;
                const finalVisibility = shouldBeVisible ? 'visible' : 'none';
                appState.map.setLayoutProperty(layerId, 'visibility', finalVisibility);
                console.log(`✅ Updated ${layerId} visibility to: ${finalVisibility} (country: ${appState.countryBoundaryVisible})`);
            } else if (areaType === 'state' || areaType === 'city') {
                // CRITICAL FIX: Admin boundaries must always be visible for click detection
                // When in administration mode, control opacity instead of visibility
                // This ensures layers are always clickable but can be visually hidden
                if (appState.currentAreaType === 'administration') {
                    // Always visible for click detection, control opacity with toggle
                    appState.map.setLayoutProperty(layerId, 'visibility', 'visible');
                    const opacity = appState.adminBoundaryVisible ? 0.8 : 0.01; // Nearly invisible but still clickable
                    appState.map.setPaintProperty(layerId, 'line-opacity', opacity);
                    console.log(`✅ Updated ${layerId} opacity to: ${opacity} (admin: ${appState.adminBoundaryVisible}, always visible for click detection)`);
                } else {
                    // Not in administration mode, hide completely
                    appState.map.setLayoutProperty(layerId, 'visibility', 'none');
                    console.log(`✅ Updated ${layerId} visibility to: none (not in administration mode)`);
                }
            }
        }
    });
    
    // 始终隐藏 Mapbox 底图的行政區边界线（使用 GADM 数据替代）
    baseMapBoundaryLayers.admin.forEach(layerId => {
        if (appState.map.getLayer(layerId)) {
            appState.map.setLayoutProperty(layerId, 'visibility', 'none');
            console.log(`✅ Hidden base map admin layer ${layerId} (using GADM instead)`);
        }
    });
    
    // 始终隐藏 Mapbox 底图的国家边界线（使用 GADM 数据替代）
    baseMapBoundaryLayers.country.forEach(layerId => {
        if (appState.map.getLayer(layerId)) {
            appState.map.setLayoutProperty(layerId, 'visibility', 'none');
            console.log(`✅ Hidden base map country layer ${layerId} (using GADM instead)`);
        }
    });
}

/**
 * Setup Boundary Line Visibility Toggles
 * Separate toggles for country and admin boundaries
 * Toggle checked = hide, unchecked = show (inverted logic)
 */
function setupBoundaryLineVisibilityToggle() {
    const countryToggle = document.getElementById('country-boundary-visibility-toggle');
    const adminToggle = document.getElementById('admin-boundary-visibility-toggle');
    
    if (!countryToggle || !adminToggle) {
        console.warn('⚠️ Boundary line visibility toggles not found');
        return;
    }
    
    // Sync toggle states with appState (inverted logic: checked = hide)
    countryToggle.checked = !appState.countryBoundaryVisible;
    adminToggle.checked = !appState.adminBoundaryVisible;
    
    // Country boundary toggle
    countryToggle.addEventListener('change', function () {
        appState.countryBoundaryVisible = !this.checked; // Inverted: checked = hide (false), unchecked = show (true)
        updateBoundaryLineVisibility();
        console.log(`✅ Country boundary visibility: ${appState.countryBoundaryVisible ? 'visible' : 'hidden'} (toggle checked: ${this.checked})`);
    });
    
    // Admin boundary toggle
    adminToggle.addEventListener('change', function () {
        appState.adminBoundaryVisible = !this.checked; // Inverted: checked = hide (false), unchecked = show (true)
        updateBoundaryLineVisibility();
        console.log(`✅ Admin boundary visibility: ${appState.adminBoundaryVisible ? 'visible' : 'hidden'} (toggle checked: ${this.checked})`);
    });
    
    // Initial update
    updateBoundaryLineVisibility();
    
    console.log('✅ Boundary line visibility toggles setup complete (separate controls for country and admin)');
}

/**
 * Initialize UI Components
 */
function initializeUI() {
    // Area type buttons
    setupAreaTypeButtons();
    
    // Color picker
    setupColorPicker();
    
    // Ocean color picker
    setupOceanColorPicker();
    
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
    
    // Boundary line visibility toggle
    if (typeof setupBoundaryLineVisibilityToggle === 'function') {
        setupBoundaryLineVisibilityToggle();
    } else {
        console.warn('⚠️ setupBoundaryLineVisibilityToggle not found, skipping...');
    }
    
    // Update boundary line visibility toggle visibility based on current area type
    updateBoundaryLineVisibilityToggleVisibility();
    
    // Setup image overlay feature
    if (typeof setupImageOverlay === 'function') {
        setupImageOverlay();
    }
}

/**
 * Setup Area Type Buttons
 */
function setupAreaTypeButtons() {
    // More precisely select the button group containing area type buttons
    // Look for the button group that contains buttons with data-type="country" or data-type="administration"
    const allButtonGroups = document.querySelectorAll('.button-group');
    let buttonGroup = null;
    
    // Find the button group that contains area type buttons
    for (const bg of allButtonGroups) {
        const hasAreaTypeButtons = bg.querySelector('.btn-toggle[data-type="country"]') || 
                                   bg.querySelector('.btn-toggle[data-type="administration"]');
        if (hasAreaTypeButtons) {
            buttonGroup = bg;
            break;
        }
    }
    
    // Fallback: try to find by label text
    if (!buttonGroup) {
        const areaTypeLabels = Array.from(document.querySelectorAll('.control-label'))
            .filter(label => label.textContent.includes('區域類型') || label.textContent.includes('區域類型'));
        
        if (areaTypeLabels.length > 0) {
            const label = areaTypeLabels[0];
            buttonGroup = label.nextElementSibling?.querySelector('.button-group') ||
                         label.parentElement?.querySelector('.button-group');
        }
    }
    
    // Last fallback: use first button group
    if (!buttonGroup && allButtonGroups.length > 0) {
        buttonGroup = allButtonGroups[1] || allButtonGroups[0]; // Try second one first (usually area type)
    }
    
    if (!buttonGroup) {
        console.error('❌ Button group not found!');
        return;
    }
    
    console.log(`🔧 Setting up area type buttons using event delegation`);
    
    // Remove existing listeners by cloning (if button group has parent)
    if (buttonGroup.parentNode) {
        const newButtonGroup = buttonGroup.cloneNode(true);
        buttonGroup.parentNode.replaceChild(newButtonGroup, buttonGroup);
        buttonGroup = newButtonGroup;
    }
    
    const buttons = buttonGroup.querySelectorAll('.btn-toggle[data-type]');
    console.log(`   Found ${buttons.length} buttons:`, Array.from(buttons).map(b => b.dataset.type));
    
    // Use event delegation on the button group
    buttonGroup.addEventListener('click', function (e) {
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
    
    // Step 3: Update overlay toggle, admin level selector, and boundary line visibility toggle visibility
    updateOverlayToggleVisibility();
    updateAdminLevelSelectorVisibility();
    updateBoundaryLineVisibilityToggleVisibility();
    
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
            loadBoundarySourceForType('state', true).then(() => {
                ensureBoundaryLayerExists('state');
                showBoundaryLayer('state');
            }).catch(err => {
                console.log('ℹ️ State boundaries not available:', err.message);
            });
            
            // Try to load city level (layers will be created automatically when source loads)
            loadBoundarySourceForType('city', true).then(() => {
                ensureBoundaryLayerExists('city');
                showBoundaryLayer('city');
            }).catch(err => {
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
        
        if (appState.map.getLayer(layerId)) {
            appState.map.setLayoutProperty(layerId, 'visibility', 'none');
        }
    });
}

/**
 * Show boundary layer for specific type
 * Single line layer approach
 */
function showBoundaryLayer(areaType) {
    const layerId = `visible-boundaries-${areaType}`;
    
    // Show line layer (single layer for both display and click detection)
    if (appState.map.getLayer(layerId)) {
        // CRITICAL FIX: For click detection, layers must always be visible when active
        // The boundary line visibility toggle should only control visual appearance (opacity), not clickability
        // When in administration mode, state/city layers must be visible for click detection
        if (areaType === 'state' || areaType === 'city') {
            // For administrative areas, always make visible when active (regardless of toggle)
            // This ensures they can be clicked for selection
            if (appState.currentAreaType === 'administration') {
                appState.map.setLayoutProperty(layerId, 'visibility', 'visible');
                // Set low opacity if boundary line toggle is off (visual only, still clickable)
                if (!appState.adminBoundaryVisible) {
                    appState.map.setPaintProperty(layerId, 'line-opacity', 0.01); // Nearly invisible but still clickable
                } else {
                    appState.map.setPaintProperty(layerId, 'line-opacity', 0.8); // Normal visibility
                }
                console.log(`✅ Made ${layerId} visible for click detection (administration mode)`);
            } else {
                // Not in administration mode, use toggle state
                updateBoundaryLineVisibility();
            }
        } else {
            // For country layer, use toggle state
            updateBoundaryLineVisibility();
        }
        return true;
    } else {
        // Layer doesn't exist yet - this is normal during data loading
        // Don't log as error, just return false silently
        return false;
    }
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
 * Add map controls (scale bar and compass) to the main map
 */
function addMapControls() {
    if (!appState.map) return;
    
    try {
        // Add scale control (bottom-left)
        const scaleControl = new mapboxgl.ScaleControl({
            maxWidth: 100,
            unit: 'metric' // or 'imperial'
        });
        appState.map.addControl(scaleControl, 'bottom-left');
        console.log('✅ Added scale control to map');
        
        // Add navigation control (includes compass) - top-right
        const navControl = new mapboxgl.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: false
        });
        appState.map.addControl(navControl, 'top-right');
        console.log('✅ Added navigation control (with compass) to map');
    } catch (error) {
        console.error('⚠️ Failed to add map controls:', error);
    }
}

/**
 * Calculate scale bar distance based on map zoom and latitude
 * Returns object with { distance, unit, pixels }
 */
function calculateScaleBar(map) {
    if (!map) return null;
    
    const zoom = map.getZoom();
    const center = map.getCenter();
    const lat = center.lat;
    const canvas = map.getCanvas();
    const width = canvas.width;
    
    // Calculate meters per pixel
    // This formula accounts for latitude (Mercator projection distortion)
    const metersPerPixel = (156543.03392 * Math.cos(lat * Math.PI / 180)) / Math.pow(2, zoom);
    
    // Target scale bar width in pixels (about 20% of canvas width)
    const targetPixels = width * 0.2;
    const targetMeters = targetPixels * metersPerPixel;
    
    // Round to nice numbers
    let distance = 1;
    let unit = 'm';
    
    if (targetMeters < 1000) {
        // Use meters
        if (targetMeters < 1) {
            distance = 1;
        } else if (targetMeters < 10) {
            distance = Math.round(targetMeters);
        } else if (targetMeters < 100) {
            distance = Math.round(targetMeters / 10) * 10;
        } else {
            distance = Math.round(targetMeters / 100) * 100;
        }
        unit = 'm';
    } else {
        // Use kilometers
        const targetKm = targetMeters / 1000;
        if (targetKm < 10) {
            distance = Math.round(targetKm * 10) / 10;
        } else if (targetKm < 100) {
            distance = Math.round(targetKm);
        } else if (targetKm < 1000) {
            distance = Math.round(targetKm / 10) * 10;
        } else {
            distance = Math.round(targetKm / 100) * 100;
        }
        unit = 'km';
    }
    
    // Calculate actual pixels for the rounded distance
    const pixels = (distance * (unit === 'km' ? 1000 : 1)) / metersPerPixel;
    
    return { distance, unit, pixels };
}

/**
 * Setup Ocean Color Picker
 */
function setupOceanColorPicker() {
    const oceanColorPicker = document.getElementById('ocean-color-picker');
    const oceanHexInput = document.getElementById('ocean-color-hex-input');
    const resetOceanColorBtn = document.getElementById('reset-ocean-color');
    
    if (!oceanColorPicker) return;
    
    // Ocean color picker change
    oceanColorPicker.addEventListener('change', function () {
        const color = this.value;
        if (oceanHexInput) {
            oceanHexInput.value = color.toUpperCase();
        }
        setWaterColor(color);
    });
    
    oceanColorPicker.addEventListener('input', function () {
        const color = this.value;
        if (oceanHexInput) {
            oceanHexInput.value = color.toUpperCase();
        }
        setWaterColor(color);
    });
    
    // Hex input change
    if (oceanHexInput) {
        oceanHexInput.addEventListener('input', function () {
            let value = this.value.trim();
            
            // Add # if missing
            if (value && !value.startsWith('#')) {
                value = '#' + value;
            }
            
            // Validate hex color
            if (/^#[0-9A-F]{6}$/i.test(value)) {
                oceanColorPicker.value = value;
                setWaterColor(value);
                this.style.borderColor = '';
            } else if (value.length > 0) {
                this.style.borderColor = '#d32f2f';
            }
        });
        
        oceanHexInput.addEventListener('blur', function () {
            // Format value on blur
            let value = this.value.trim().toUpperCase();
            if (value && !value.startsWith('#')) {
                value = '#' + value;
            }
            if (/^#[0-9A-F]{6}$/i.test(value)) {
                this.value = value;
                oceanColorPicker.value = value;
                setWaterColor(value);
                this.style.borderColor = '';
            } else {
                this.value = oceanColorPicker.value.toUpperCase();
                this.style.borderColor = '';
            }
        });
    }
    
    // Reset button
    if (resetOceanColorBtn) {
        resetOceanColorBtn.addEventListener('click', function () {
            oceanColorPicker.value = '#C1D3E2';
            if (oceanHexInput) {
                oceanHexInput.value = '#C1D3E2';
            }
            setWaterColor(null); // Reset to default
        });
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
    colorPicker.addEventListener('change', function () {
        const color = this.value;
        appState.currentColor = color;
        if (hexInput) {
            hexInput.value = color.toUpperCase();
        }
        updateActivePreset(color);
    });
    
    colorPicker.addEventListener('input', function () {
        const color = this.value;
        appState.currentColor = color;
        if (hexInput) {
            hexInput.value = color.toUpperCase();
        }
        updateActivePreset(color);
    });
    
    // Hex input change
    if (hexInput) {
        hexInput.addEventListener('input', function () {
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
        
        hexInput.addEventListener('blur', function () {
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
        preset.addEventListener('click', function () {
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
    // Use ElementCache if available, fallback to document.getElementById
    const getElement = (typeof ElementCache !== 'undefined') 
        ? (id) => ElementCache.get(id)
        : document.getElementById.bind(document);
    
    const searchInput = getElement('area-search');
    const resultsContainer = getElement('search-results');
    
    if (!searchInput || !resultsContainer) return;
    
    // Use debounce utility if available
    if (typeof debounce !== 'undefined') {
        const debouncedPerformSearch = debounce(function () {
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                performSearch(query);
            } else {
                resultsContainer.style.display = 'none';
            }
        }, 300);
        
        searchInput.addEventListener('input', debouncedPerformSearch);
    } else {
        // Fallback to original implementation
        let searchTimeout = null;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            if (query.length >= 2) {
                searchTimeout = setTimeout(() => performSearch(query), 300);
            } else {
                resultsContainer.style.display = 'none';
            }
        });
    }
}

/**
 * Perform Search
 */
function performSearch(query) {
    // Use ElementCache if available
    const getElement = (typeof ElementCache !== 'undefined') 
        ? (id) => ElementCache.get(id)
        : document.getElementById.bind(document);
    
    const resultsContainer = getElement('search-results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    if (query.length < 2) {
        resultsContainer.style.display = 'none';
        return;
    }
    
    // Search will be executed immediately (debounced in setupSearch)
    searchAreas(query, resultsContainer);
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
        // Use more specific types for better results
        // country: countries
        // region: states, provinces, regions
        // place: cities, towns, villages
        // district: districts within cities
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${CONFIG.MAPBOX.TOKEN}&types=country,region,place,district&limit=10&language=zh,en`;
        const response = await fetch(geocodeUrl);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            console.log(`📍 [Search] Found ${data.features.length} results from Mapbox Geocoding`);
            
            data.features.forEach(feature => {
                const placeTypes = feature.place_type || [];
                const primaryType = placeTypes[0]; // 'country', 'region', 'place', 'district'
                
                // Map Mapbox types to our area types
                let areaType;
                if (primaryType === 'country') {
                    areaType = 'country';
                } else if (primaryType === 'region') {
                    areaType = 'state'; // Region usually means state/province
                } else if (primaryType === 'place' || primaryType === 'district') {
                    areaType = 'city'; // Place/district usually means city
                } else {
                    // Skip unknown types
                    return;
                }
                
                const name = feature.text || feature.place_name;
                const context = feature.context || [];
                
                // Extract country code for better identification
                const countryContext = context.find(c => c.id && c.id.startsWith('country'));
                const countryCode = countryContext ? countryContext.short_code.toUpperCase() : null;
                
                // Use feature.id as unique identifier, or combine with country code if available
                const areaId = countryCode ? `${countryCode}_${feature.id}` : feature.id;
                
                results.push({
                    id: areaId,
                    name: name,
                    type: areaType,
                    geometry: feature.geometry,
                    center: feature.center,
                    countryCode: countryCode,
                    fullName: feature.place_name // Full name with context (e.g., "Taipei, Taiwan")
                });
            });
        }
    } catch (error) {
        console.warn('Geocoding error:', error);
    }
    
    // Display results with better formatting
    if (results.length === 0) {
        container.innerHTML = '<div class="search-result-item">No results found</div>';
    } else {
        // Remove duplicates (same name and type)
        const uniqueResults = [];
        const seen = new Set();
        
        results.forEach(result => {
            const key = `${result.name}_${result.type}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueResults.push(result);
            }
        });
        
        // Limit to 10 results
        const displayResults = uniqueResults.slice(0, 10);
        
        container.innerHTML = displayResults.map(result => {
            // Escape HTML in names to prevent XSS
            const escapedName = result.name.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
            const escapedFullName = (result.fullName || result.name).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
            const escapedId = String(result.id).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
            
            // Create type label with icon
            const typeLabels = {
                'country': '🌍 Country',
                'state': '🗺️ State/Region',
                'city': '🏙️ City'
            };
            const typeLabel = typeLabels[result.type] || result.type;
            
            return `
                <div class="search-result-item" onclick="selectAreaFromSearch('${escapedId}', '${escapedName}', '${result.type}', ${result.center ? JSON.stringify(result.center) : 'null'})" title="${escapedFullName}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${escapedName}</strong>
                            ${result.fullName && result.fullName !== result.name ? `<div style="color: #666; font-size: 11px; margin-top: 2px;">${escapedFullName}</div>` : ''}
                        </div>
                        <span style="color: #999; font-size: 11px; white-space: nowrap; margin-left: 8px;">${typeLabel}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log(`✅ [Search] Displaying ${displayResults.length} unique results`);
    }
}

/**
 * Select area from search results
 */
async function selectAreaFromSearch(areaId, areaName, areaType, center) {
    // Hide search results
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('area-search').value = areaName;
    
    console.log(`🔍 [Search] Selecting area from search: ${areaName} (${areaType})`);
    
    // Convert areaId to match source format (similar to handleUnifiedSearchResult)
    let convertedAreaId = areaId;
    
    // For country type, try to extract country code from various ID formats
    if (areaType === 'country') {
        // Case 1: ID contains underscore (e.g., "TWN_mapbox.123")
        if (areaId.includes('_')) {
            const parts = areaId.split('_');
            if (parts.length > 0 && (parts[0].length === 2 || parts[0].length === 3)) {
                convertedAreaId = parts[0].toUpperCase();
                console.log(`🔍 [Search] Extracted country code from underscore: ${areaId} -> ${convertedAreaId}`);
            }
        }
        // Case 2: ID starts with "country." (Mapbox feature ID format, e.g., "country.8935")
        else if (areaId.startsWith('country.')) {
            console.log(`🔍 [Search] Detected Mapbox country feature ID format: ${areaId}, attempting to resolve from name: "${areaName}"`);
            
            // Try COUNTRY_CODES lookup
            const COUNTRY_CODES_REF = (typeof window !== 'undefined' && window.COUNTRY_CODES) || (typeof COUNTRY_CODES !== 'undefined' ? COUNTRY_CODES : null);
            let found = false;
            
            if (COUNTRY_CODES_REF) {
                const nameTrimmed = areaName.trim();
                
                // Special mappings for simplified to traditional Chinese
                const specialMappings = {
                    '台湾': '台灣',
                    '英国': '英國',
                    '美国': '美國',
                    '中国': '中國'
                };
                
                let searchName = specialMappings[nameTrimmed] || nameTrimmed;
                
                // Try exact match
                for (const code in COUNTRY_CODES_REF) {
                    const country = COUNTRY_CODES_REF[code];
                    if (country.name === searchName || country.nameEn === nameTrimmed || 
                        country.nameEn?.toLowerCase() === nameTrimmed.toLowerCase()) {
                        convertedAreaId = code;
                        console.log(`✅ [Search] Found country code: "${areaName}" -> ${convertedAreaId}`);
                        found = true;
                        break;
                    }
                }
            }
            
            // If not found, try findAreaIdByName (async)
            if (!found && typeof window.findAreaIdByName === 'function') {
                try {
                    const resolvedId = await window.findAreaIdByName(areaName, 'country');
                    if (resolvedId && (resolvedId.length === 2 || resolvedId.length === 3)) {
                        convertedAreaId = resolvedId.toUpperCase();
                        console.log(`✅ [Search] Resolved country code via findAreaIdByName: "${areaName}" -> ${convertedAreaId}`);
                        found = true;
                    }
                } catch (error) {
                    console.warn(`⚠️ [Search] Error in findAreaIdByName:`, error);
                }
            }
            
            if (!found) {
                console.warn(`❌ [Search] Could not resolve country code for "${areaName}" (ID: ${areaId}), will try with original ID`);
            }
        }
        // Case 3: ID might already be a country code (3 letters)
        else if (areaId.length === 3 && /^[A-Z]{3}$/i.test(areaId)) {
            convertedAreaId = areaId.toUpperCase();
            console.log(`🔍 [Search] Using ID as country code: ${convertedAreaId}`);
        }
    }
    
    // For city/state type, if using GADM source, convert Mapbox ID to GADM GID
    if ((areaType === 'city' || areaType === 'state') && center && center.length === 2) {
        const gadmSourceId = `gadm-${areaType}`;
        
        // Check if Mapbox ID format needs conversion
        const needsConversion = convertedAreaId.includes('place.') || convertedAreaId.includes('region.') || 
                                convertedAreaId.includes('_place.') || convertedAreaId.includes('_region.');
        
        // Check if GADM source exists or needs to be loaded
        let hasGADMSource = appState.map.getSource(gadmSourceId);
        if (needsConversion && !hasGADMSource) {
            console.log(`🔄 [Search] GADM source not loaded, loading it first...`);
            if (typeof loadBoundarySourceForType === 'function') {
                await loadBoundarySourceForType(areaType, false);
                await new Promise(resolve => setTimeout(resolve, 1500));
                hasGADMSource = appState.map.getSource(gadmSourceId);
            }
        }
        
        if (hasGADMSource && needsConversion) {
            console.log(`🔄 [Search] Converting Mapbox ID to GADM GID using coordinates...`);
            console.log(`   Mapbox ID: ${convertedAreaId}, Coordinates: [${center[0]}, ${center[1]}]`);
            
            try {
                // Zoom to location first
                appState.map.flyTo({
                    center: center,
                    zoom: areaType === 'state' ? 6 : 10,
                    duration: 1000
                });
                await new Promise(resolve => setTimeout(resolve, 1100));
                
                // Query GADM feature at coordinates
                const visibleLayerId = `visible-boundaries-${areaType}`;
                if (appState.map.getLayer(visibleLayerId)) {
                    const point = appState.map.project(center);
                    const features = appState.map.queryRenderedFeatures([point.x, point.y], {
                        layers: [visibleLayerId],
                        radius: 100
                    });
                    
                    if (features && features.length > 0) {
                        const gadmFeature = features.find(f => {
                            const props = f.properties || {};
                            return (f.source === gadmSourceId) && (props.GID_2 || props.GID_1);
                        }) || features[0];
                        
                        const props = gadmFeature.properties || {};
                        const gadmId = areaType === 'city' ? props.GID_2 : props.GID_1;
                        
                        if (gadmId) {
                            console.log(`✅ [Search] Found GADM GID: ${gadmId} for ${areaName}`);
                            convertedAreaId = gadmId;
                        }
                    }
                }
            } catch (error) {
                console.warn(`⚠️ [Search] Error converting Mapbox ID to GADM GID:`, error);
                console.log(`   Will try with original ID: ${convertedAreaId}`);
            }
        }
    }
    
    // Map areaType to appState.currentAreaType format
    // 'country' -> 'country'
    // 'state' or 'city' -> 'administration'
    const targetMode = (areaType === 'state' || areaType === 'city') ? 'administration' : 'country';
    
    // Switch to correct area type mode if needed
    if (appState.currentAreaType !== targetMode) {
        console.log(`🔄 [Search] Switching from ${appState.currentAreaType} to ${targetMode} mode`);
        switchAreaType(targetMode);
        
        // For state/city, set the administration level
        if (areaType === 'state' || areaType === 'city') {
            appState.administrationLevel = areaType;
            console.log(`📍 [Search] Set administration level to: ${areaType}`);
        }
        
        // Wait for switch to complete and data to load
        await new Promise(resolve => setTimeout(resolve, 800));
    } else {
        // If already in correct mode, just set administration level for state/city
        if (areaType === 'state' || areaType === 'city') {
            appState.administrationLevel = areaType;
        }
    }
    
    // Zoom to area if center provided (if not already zoomed above)
    if (center && center.length === 2) {
        const currentZoom = appState.map.getZoom();
        const targetZoom = areaType === 'country' ? 4 : areaType === 'state' ? 6 : 10;
        
        if (Math.abs(currentZoom - targetZoom) > 1) {
            appState.map.flyTo({
                center: center,
                zoom: targetZoom,
                duration: 1000
            });
            await new Promise(resolve => setTimeout(resolve, 1100));
        }
    }
    
    // Apply color to the selected area (use converted ID)
    console.log(`🎨 [Search] Applying color to ${areaName} (${areaType}) with ID: ${convertedAreaId}`);
    await applyColorToArea(convertedAreaId, areaName, areaType, appState.currentColor);
}

// Make function globally available
window.selectAreaFromSearch = selectAreaFromSearch;

/**
 * Setup Export
 */
function setupExport() {
    const exportBtn = document.getElementById('export-btn');
    exportBtn.addEventListener('click', function () {
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
    overlay.addEventListener('click', function (e) {
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
    
    /**
     * Update Export Preview
     * Generates a scaled-down preview of the map for display in the export dialog
     */
    function updateExportPreview() {
        const previewContainer = document.getElementById('export-preview');
        if (!previewContainer) {
            return; // Container not found, silently return
        }
        if (!appState.map || !appState.map.loaded()) {
            // Map not ready yet, use polling mechanism (already handled in showExportDialog)
            previewContainer.innerHTML = '<div class="export-preview-loading">Waiting for map...</div>';
            return;
        }
        
        // Show loading state
        previewContainer.innerHTML = '<div class="export-preview-loading">Generating preview...</div>';
        
        // Trigger map repaint to ensure canvas is ready
        appState.map.triggerRepaint();
        
        // Use setTimeout to allow map to render
        setTimeout(() => {
            try {
                const mapCanvas = appState.map.getCanvas();
                if (!mapCanvas) {
                    throw new Error('Map canvas not available');
                }
                if (mapCanvas.width === 0 || mapCanvas.height === 0) {
                    throw new Error('Map canvas has zero dimensions');
                }
                
                // For preview, use a reasonable size (max 400px width to keep it small)
                const maxPreviewWidth = 400;
                const maxPreviewHeight = 300;
                
                let previewWidth, previewHeight;
                let aspectRatio = mapCanvas.width / mapCanvas.height;
                
                if (aspectRatio > (maxPreviewWidth / maxPreviewHeight)) {
                    previewWidth = maxPreviewWidth;
                    previewHeight = maxPreviewWidth / aspectRatio;
                } else {
                    previewHeight = maxPreviewHeight;
                    previewWidth = maxPreviewHeight * aspectRatio;
                }
                
                // Get the current map image
                const mapImageData = mapCanvas.toDataURL('image/png');
                if (!mapImageData || mapImageData === 'data:,') {
                    throw new Error('Failed to generate image data');
                }
                
                // Create a canvas to draw map + controls (scale bar + compass)
                const previewCanvas = document.createElement('canvas');
                previewCanvas.width = previewWidth;
                previewCanvas.height = previewHeight;
                const previewCtx = previewCanvas.getContext('2d');
                
                // Draw map image onto preview canvas (scaled)
                const mapImg = new Image();
                mapImg.onload = function () {
                    // Draw map
                    previewCtx.drawImage(mapImg, 0, 0, previewWidth, previewHeight);
                    
                    // Create a temporary map instance for calculating controls
                    // Since we can't directly draw on the original canvas, we'll calculate controls
                    // based on the current map state and draw them on the preview
                    
                    // For preview, we need to scale the controls to match preview size
                    const scaleX = previewWidth / mapCanvas.width;
                    const scaleY = previewHeight / mapCanvas.height;
                    
                    // Calculate scale bar for preview
                    const scaleBar = calculateScaleBar(appState.map);
                    
                    if (scaleBar) {
                        // Draw scale bar (bottom left, scaled for preview)
                        const margin = 20 * scaleX;
                        const barHeight = 4 * scaleY;
                        const barY = previewHeight - margin - 20 * scaleY;
                        const barX = margin;
                        const barWidth = scaleBar.pixels * scaleX;
                        
                        // Background box
                        previewCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                        previewCtx.fillRect(barX - 5 * scaleX, barY - 15 * scaleY, barWidth + 10 * scaleX, 25 * scaleY);
                        
                        // Scale bar line
                        previewCtx.fillStyle = '#000';
                        previewCtx.fillRect(barX, barY, barWidth, barHeight);
                        
                        // Ticks
                        previewCtx.fillRect(barX, barY - 5 * scaleY, 2 * scaleX, barHeight + 10 * scaleY);
                        previewCtx.fillRect(barX + barWidth - 2 * scaleX, barY - 5 * scaleY, 2 * scaleX, barHeight + 10 * scaleY);
                        
                        // Label
                        previewCtx.fillStyle = '#000';
                        previewCtx.font = `${12 * scaleX}px Arial, sans-serif`;
                        previewCtx.textAlign = 'center';
                        previewCtx.fillText(`${scaleBar.distance} ${scaleBar.unit}`, barX + barWidth / 2, barY - 8 * scaleY);
                    }
                    
                    // Draw compass (top right, scaled for preview)
                    const compassSize = 60 * scaleX;
                    const compassMargin = 20 * scaleX;
                    const compassX = previewWidth - compassMargin - compassSize;
                    const compassY = compassMargin;
                    const centerX = compassX + compassSize / 2;
                    const centerY = compassY + compassSize / 2;
                    
                    // Background circle
                    previewCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    previewCtx.beginPath();
                    previewCtx.arc(centerX, centerY, compassSize / 2, 0, Math.PI * 2);
                    previewCtx.fill();
                    previewCtx.strokeStyle = '#000';
                    previewCtx.lineWidth = 2 * scaleX;
                    previewCtx.stroke();
                    
                    // Get map bearing
                    const bearing = appState.map.getBearing();
                    
                    // Draw compass needle
                    previewCtx.save();
                    previewCtx.translate(centerX, centerY);
                    previewCtx.rotate(-bearing * Math.PI / 180);
                    
                    // North arrow
                    previewCtx.fillStyle = '#d32f2f';
                    previewCtx.beginPath();
                    previewCtx.moveTo(0, -compassSize / 2 + 5 * scaleY);
                    previewCtx.lineTo(-8 * scaleX, 0);
                    previewCtx.lineTo(0, -compassSize / 2 + 15 * scaleY);
                    previewCtx.lineTo(8 * scaleX, 0);
                    previewCtx.closePath();
                    previewCtx.fill();
                    
                    // South arrow
                    previewCtx.fillStyle = '#666';
                    previewCtx.beginPath();
                    previewCtx.moveTo(0, compassSize / 2 - 5 * scaleY);
                    previewCtx.lineTo(-6 * scaleX, 0);
                    previewCtx.lineTo(0, compassSize / 2 - 12 * scaleY);
                    previewCtx.lineTo(6 * scaleX, 0);
                    previewCtx.closePath();
                    previewCtx.fill();
                    
                    // N label
                    previewCtx.fillStyle = '#d32f2f';
                    previewCtx.font = `bold ${14 * scaleX}px Arial, sans-serif`;
                    previewCtx.textAlign = 'center';
                    previewCtx.fillText('N', 0, -compassSize / 2 + 25 * scaleY);
                    
                    previewCtx.restore();
                    
                    // Store preview canvas dimensions for text label positioning
                    appState.previewCanvasWidth = previewWidth;
                    appState.previewCanvasHeight = previewHeight;
                    appState.previewCanvasScaleX = scaleX;
                    appState.previewCanvasScaleY = scaleY;
                    appState.previewMapCanvasWidth = mapCanvas.width;
                    appState.previewMapCanvasHeight = mapCanvas.height;
                    
                    // Convert preview canvas to image for display
                    const previewImageData = previewCanvas.toDataURL('image/png');
                    const img = document.createElement('img');
                    img.src = previewImageData;
                    img.style.width = '100%';
                    img.style.height = 'auto';
                    img.style.maxWidth = `${previewWidth}px`;
                    img.style.maxHeight = `${previewHeight}px`;
                    img.style.display = 'block';
                    img.style.border = '1px solid #ddd';
                    img.style.borderRadius = '4px';
                    img.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    
                    previewContainer.innerHTML = '';
                    previewContainer.appendChild(img);
                    console.log('✅ Export preview generated with scale bar and compass');
                };
                
                mapImg.onerror = function () {
                    console.error('Preview image failed to load');
                    previewContainer.innerHTML = '<div class="export-preview-error">Preview image failed to load</div>';
                };
                
                mapImg.src = mapImageData;
            } catch (error) {
                console.error('Error generating export preview:', error);
                previewContainer.innerHTML = '<div class="export-preview-error">Preview unavailable: ' + (error.message || 'Unknown error') + '</div>';
            }
        }, 500);
    }
    
    // Show/hide quality slider for JPEG
    formatRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            qualityGroup.style.display = this.value === 'jpeg' ? 'block' : 'none';
            updateExportPreview();
        });
    });
    
    // Update quality value display
    qualitySlider.addEventListener('input', function () {
        qualityValue.textContent = this.value + '%';
    });
    
    // Update dimensions when options change
    paperSizeSelect.addEventListener('change', function () {
        updateDimensionsPreview();
        setTimeout(() => updateExportPreview(), 100);
    });
    orientationRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            updateDimensionsPreview();
            setTimeout(() => updateExportPreview(), 100);
        });
    });
    dpiSelect.addEventListener('change', function () {
        updateDimensionsPreview();
        // DPI change doesn't affect preview image, but update anyway
        setTimeout(() => updateExportPreview(), 100);
    });
    
    // Export button handler
    exportBtn.addEventListener('click', function () {
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
    setTimeout(() => {
        updateDimensionsPreview();
        updateExportPreview();
    }, 100);
}

/**
 * Show Export Dialog
 */
function showExportDialog() {
    const overlay = document.getElementById('export-dialog-overlay');
    overlay.style.display = 'flex';
    
    // Update dimensions preview and export preview
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
        
        // Update export preview - wait for map to be loaded
        const previewContainer = document.getElementById('export-preview');
        if (previewContainer) {
            previewContainer.innerHTML = '<div class="export-preview-loading">Waiting for map to load...</div>';
            
            // Wait for map to load before generating preview
            let checkCount = 0;
            const maxChecks = 50; // Maximum 10 seconds (50 * 200ms)
            
            const checkMapAndGeneratePreview = () => {
                checkCount++;
                
                if (checkCount > maxChecks) {
                    previewContainer.innerHTML = '<div class="export-preview-error">Preview timeout - map may not be ready</div>';
                    return;
                }
                
                if (appState.map && appState.map.loaded() && appState.map.getCanvas()) {
                    const mapCanvas = appState.map.getCanvas();
                    if (mapCanvas && mapCanvas.width > 0 && mapCanvas.height > 0) {
                        previewContainer.innerHTML = '<div class="export-preview-loading">Generating preview...</div>';
                        
                        // Wait for map to finish rendering before capturing canvas
                        // Use once('render') to ensure map is fully rendered
                        appState.map.once('render', () => {
                            try {
                                // Get canvas reference after render event
                                const currentCanvas = appState.map.getCanvas();
                                if (!currentCanvas || currentCanvas.width === 0 || currentCanvas.height === 0) {
                                    previewContainer.innerHTML = '<div class="export-preview-error">Canvas not ready</div>';
                                    return;
                                }
                                
                                // Create a low-resolution preview by scaling down the canvas
                                // Use a smaller canvas for preview to reduce file size and improve performance
                                const previewScale = 0.5; // 50% of original size
                                const previewCanvas = document.createElement('canvas');
                                const previewCtx = previewCanvas.getContext('2d');
                                previewCanvas.width = Math.floor(currentCanvas.width * previewScale);
                                previewCanvas.height = Math.floor(currentCanvas.height * previewScale);
                                
                                // Wait for canvas to be ready, then draw
                                try {
                                    // Draw the map canvas onto the smaller preview canvas
                                    // Use the scaled dimensions for both source and destination
                                    previewCtx.drawImage(
                                        currentCanvas, 
                                        0, 0, currentCanvas.width, currentCanvas.height,  // Source rectangle
                                        0, 0, previewCanvas.width, previewCanvas.height  // Destination rectangle
                                    );
                                    
                                    // Draw scale bar and compass on preview
                                    const scaleBar = calculateScaleBar(appState.map);
                                    const scaleX = previewCanvas.width / currentCanvas.width;
                                    const scaleY = previewCanvas.height / currentCanvas.height;
                                    
                                    if (scaleBar) {
                                        // Draw scale bar (bottom left)
                                        const margin = 20 * scaleX;
                                        const barHeight = 4 * scaleY;
                                        const barY = previewCanvas.height - margin - 20 * scaleY;
                                        const barX = margin;
                                        const barWidth = scaleBar.pixels * scaleX;
                                        
                                        // Background box
                                        previewCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                                        previewCtx.fillRect(barX - 5 * scaleX, barY - 15 * scaleY, barWidth + 10 * scaleX, 25 * scaleY);
                                        
                                        // Scale bar line
                                        previewCtx.fillStyle = '#000';
                                        previewCtx.fillRect(barX, barY, barWidth, barHeight);
                                        
                                        // Ticks
                                        previewCtx.fillRect(barX, barY - 5 * scaleY, 2 * scaleX, barHeight + 10 * scaleY);
                                        previewCtx.fillRect(barX + barWidth - 2 * scaleX, barY - 5 * scaleY, 2 * scaleX, barHeight + 10 * scaleY);
                                        
                                        // Label
                                        previewCtx.fillStyle = '#000';
                                        previewCtx.font = `${12 * scaleX}px Arial, sans-serif`;
                                        previewCtx.textAlign = 'center';
                                        previewCtx.fillText(`${scaleBar.distance} ${scaleBar.unit}`, barX + barWidth / 2, barY - 8 * scaleY);
                                    }
                                    
                                    // Draw compass (top right)
                                    const compassSize = 60 * scaleX;
                                    const compassMargin = 20 * scaleX;
                                    const compassX = previewCanvas.width - compassMargin - compassSize;
                                    const compassY = compassMargin;
                                    const centerX = compassX + compassSize / 2;
                                    const centerY = compassY + compassSize / 2;
                                    
                                    // Background circle
                                    previewCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                                    previewCtx.beginPath();
                                    previewCtx.arc(centerX, centerY, compassSize / 2, 0, Math.PI * 2);
                                    previewCtx.fill();
                                    previewCtx.strokeStyle = '#000';
                                    previewCtx.lineWidth = 2 * scaleX;
                                    previewCtx.stroke();
                                    
                                    // Get map bearing
                                    const bearing = appState.map.getBearing();
                                    
                                    // Draw compass needle
                                    previewCtx.save();
                                    previewCtx.translate(centerX, centerY);
                                    previewCtx.rotate(-bearing * Math.PI / 180);
                                    
                                    // North arrow
                                    previewCtx.fillStyle = '#d32f2f';
                                    previewCtx.beginPath();
                                    previewCtx.moveTo(0, -compassSize / 2 + 5 * scaleY);
                                    previewCtx.lineTo(-8 * scaleX, 0);
                                    previewCtx.lineTo(0, -compassSize / 2 + 15 * scaleY);
                                    previewCtx.lineTo(8 * scaleX, 0);
                                    previewCtx.closePath();
                                    previewCtx.fill();
                                    
                                    // South arrow
                                    previewCtx.fillStyle = '#666';
                                    previewCtx.beginPath();
                                    previewCtx.moveTo(0, compassSize / 2 - 5 * scaleY);
                                    previewCtx.lineTo(-6 * scaleX, 0);
                                    previewCtx.lineTo(0, compassSize / 2 - 12 * scaleY);
                                    previewCtx.lineTo(6 * scaleX, 0);
                                    previewCtx.closePath();
                                    previewCtx.fill();
                                    
                                    // N label
                                    previewCtx.fillStyle = '#d32f2f';
                                    previewCtx.font = `bold ${14 * scaleX}px Arial, sans-serif`;
                                    previewCtx.textAlign = 'center';
                                    previewCtx.fillText('N', 0, -compassSize / 2 + 25 * scaleY);
                                    
                                    previewCtx.restore();
                                    
                                    // Convert to image data with lower quality (JPEG at 0.7 quality for smaller file size)
                                    const mapImageData = previewCanvas.toDataURL('image/jpeg', 0.7);
                                    
                                    if (!mapImageData || mapImageData === 'data:,' || mapImageData.length < 100) {
                                        throw new Error('Failed to generate preview image data');
                                    }
                                    
                                    // Create and display the preview image
                                    const img = document.createElement('img');
                                    img.src = mapImageData;
                                    
                                    // Auto-fit to container using CSS
                                    img.style.width = '100%';
                                    img.style.height = '100%';
                                    img.style.maxWidth = '100%';
                                    img.style.maxHeight = '100%';
                                    img.style.display = 'block';
                                    img.style.border = '1px solid #ddd';
                                    img.style.borderRadius = '4px';
                                    img.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                    img.style.margin = '0 auto';
                                    img.style.objectFit = 'contain'; // This ensures the image scales to fit while maintaining aspect ratio
                                    
                                    img.onerror = function () {
                                        console.error('Preview image failed to load');
                                        previewContainer.innerHTML = '<div class="export-preview-error">Failed to load preview image</div>';
                                    };
                                    
                                    img.onload = function () {
                                        console.log('✅ Preview image loaded successfully');
                                        console.log('   Preview canvas:', previewCanvas.width, 'x', previewCanvas.height, '(low-res)');
                                        console.log('   Display size:', img.offsetWidth, 'x', img.offsetHeight);
                                    };
                                    
                                    // Clear container first
                                    previewContainer.innerHTML = '';
                                    previewContainer.style.display = 'flex';
                                    previewContainer.style.alignItems = 'center';
                                    previewContainer.style.justifyContent = 'center';
                                    previewContainer.appendChild(img);
                                    console.log('✅ Export preview generated successfully with scale bar and compass (low-res for quick preview)');
                                    console.log('   Original canvas:', currentCanvas.width, 'x', currentCanvas.height);
                                    console.log('   Preview canvas:', previewCanvas.width, 'x', previewCanvas.height, '(50% scale)');
                                    console.log('   Image data length:', mapImageData.length, 'bytes (JPEG 70% quality)');
                                } catch (drawError) {
                                    console.error('Error drawing preview canvas:', drawError);
                                    // Fallback: use original canvas directly at lower quality
                                    try {
                                        const fallbackImageData = currentCanvas.toDataURL('image/jpeg', 0.6);
                                        if (fallbackImageData && fallbackImageData !== 'data:,' && fallbackImageData.length > 100) {
                                            const img = document.createElement('img');
                                            img.src = fallbackImageData;
                                            img.style.maxWidth = '100%';
                                            img.style.maxHeight = '100%';
                                            img.style.objectFit = 'contain';
                                            img.style.display = 'block';
                                            previewContainer.innerHTML = '';
                                            previewContainer.appendChild(img);
                                            console.log('✅ Used fallback preview (original canvas, JPEG 60%)');
                                        } else {
                                            throw new Error('Fallback also failed');
                                        }
                                    } catch (fallbackError) {
                                        console.error('Fallback preview also failed:', fallbackError);
                                        previewContainer.innerHTML = '<div class="export-preview-error">Preview unavailable</div>';
                                    }
                                }
                            } catch (error) {
                                console.error('Error generating export preview:', error);
                                previewContainer.innerHTML = '<div class="export-preview-error">Error: ' + (error.message || 'Unknown error') + '</div>';
                            }
                        });
                        
                        // Trigger repaint to fire the render event
                        appState.map.triggerRepaint();
                    } else {
                        // Canvas not ready yet, try again
                        setTimeout(checkMapAndGeneratePreview, 200);
                    }
                } else {
                    // Map not loaded yet, try again
                    previewContainer.innerHTML = '<div class="export-preview-loading">Waiting for map... (' + checkCount + '/' + maxChecks + ')</div>';
                    setTimeout(checkMapAndGeneratePreview, 200);
                }
            };
            
            // Start checking after a short delay
            setTimeout(checkMapAndGeneratePreview, 500);
        } else {
            console.warn('Export preview container not found');
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
                appState.map.once('render', function () {
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
                    
                    exportCanvas.toBlob(function (blob) {
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
                appState.map.once('render', function () {
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
                                
                                exportCanvas.toBlob(function (blob) {
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
        appState.map.once('idle', function () {
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
    
    toggle.addEventListener('click', function () {
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
    
    toggle.addEventListener('click', function () {
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
    overlayToggle.addEventListener('change', function (e) {
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
    
    // Initialize default to 'city' (maximum detail level)
    appState.preferredAdminLevel = 'city';
    
    // Set initial active button state
    const cityBtn = adminLevelGroup.querySelector('.btn-toggle[data-level="city"]');
    if (cityBtn) {
        cityBtn.classList.add('active');
        // Remove active from other buttons
        adminLevelGroup.querySelectorAll('.btn-toggle').forEach(b => {
            if (b !== cityBtn) b.classList.remove('active');
        });
    }
    
    // Use event delegation for button clicks
    adminLevelGroup.addEventListener('click', function (e) {
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
                message = '已切換到「市」模式（預設最大層級）：點擊地圖選擇各個城市';
            } else {
                message = '已切換到「自動」模式：優先選擇最小級別';
            }
            showToast(message, 'info', 2000);
        }
    });
    
    // Initialize visibility
    updateAdminLevelSelectorVisibility();
    updateBoundaryLineVisibilityToggleVisibility();
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
 * Update Boundary Line Visibility Toggle Visibility
 * Always show (not restricted to administration mode)
 */
function updateBoundaryLineVisibilityToggleVisibility() {
    const boundaryLineGroup = document.getElementById('boundary-line-visibility-group');
    if (!boundaryLineGroup) return;
    
    // Always show - not restricted to any mode
    boundaryLineGroup.style.display = 'block';
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
    clearBtn.addEventListener('click', function () {
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
    
    // 移除自定义标签
    removeCustomChineseLabels();
    
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
        
        // 更新自定义标签（移除区域后）
        setTimeout(() => {
            updateCustomChineseLabels();
        }, 100);
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
        styleSelect.addEventListener('change', function () {
            switchMapStyle(this.value);
        });
    }
    
    // Labels toggle
    const labelsToggle = document.getElementById('toggle-labels');
    if (labelsToggle) {
        labelsToggle.addEventListener('change', function () {
            toggleLabels(this.checked);
        });
    }
    
    // Boundary mode
    const modeButtons = document.querySelectorAll('.btn-toggle[data-mode]');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const mode = this.dataset.mode;
            switchBoundaryMode(mode);
        });
    });
    
    // Setup markers functionality
    setupMarkers();
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
        // setFog() only affects the sky/space behind the globe, not the map layers
        appState.map.setFog({
            'range': [0.8, 8],
            'color': 'rgba(10, 10, 10, 0)', // Transparent at horizon
            'horizon-blend': 0,
            'high-color': 'rgba(10, 10, 10, 0.7)', // Dark at high altitude
            'space-color': 'rgba(10, 10, 10, 1)', // Pure dark space color (#0a0a0a)
            'star-intensity': 0.5 // Subtle star effect
        });
        console.log('✅ Globe Sky background set using setFog() - water layers should be visible');
        
        // 应用自定义海洋颜色（如果设置了）
        if (appState.waterColor) {
            setTimeout(() => {
                extractAndModifyWaterColor(appState.waterColor);
            }, 1000);
        }
    } catch (err) {
        console.warn('⚠️ Globe Sky background setup (setFog) failed:', err.message);
        // Fallback: try setting background layer
        // IMPORTANT: Background layer should be the FIRST layer (before water/land layers)
        // This ensures it doesn't cover water/land layers
        try {
            const style = appState.map.getStyle();
            if (!style || !style.layers) return;

            const skyBgColor = '#0a0a0a';
            const existingBg = appState.map.getLayer('background');
            
            if (existingBg) {
                // Background layer already exists, just update color
                appState.map.setPaintProperty('background', 'background-color', skyBgColor);
                console.log('✅ Updated existing background layer color');
            } else {
                // Find the first layer (should be background or water layer)
                const firstLayerId = style.layers.length > 0 ? style.layers[0].id : null;
                
                // Check if first layer is already a background layer (shouldn't be, but check anyway)
                const firstLayer = firstLayerId ? appState.map.getLayer(firstLayerId) : null;
                
                if (firstLayer && firstLayer.type === 'background') {
                    // First layer is already a background layer, just update it
                    appState.map.setPaintProperty(firstLayerId, 'background-color', skyBgColor);
                    console.log('✅ Updated first layer (background) color');
                } else {
                    // Add background layer as the FIRST layer (before all other layers)
                    // This ensures water/land layers are rendered on top
                    appState.map.addLayer({
                        id: 'background',
                        type: 'background',
                        paint: {
                            'background-color': skyBgColor
                        }
                    }, firstLayerId); // Insert before first layer (if exists)
                    console.log('✅ Added background layer as first layer (before water/land layers)');
                }
            }
        } catch (bgErr) {
            console.warn('⚠️ Fallback background setup also failed:', bgErr.message);
        }
    }
}

/**
 * 提取并修改水层颜色
 */
function extractAndModifyWaterColor(waterColor = '#C1D3E2') {
    if (!appState.map) return;
    
    try {
        const style = appState.map.getStyle();
        if (!style || !style.layers) return;
        
        // 提取所有水层（多种策略）
        const waterLayers = style.layers.filter(layer => {
            const id = layer.id.toLowerCase();
            // 策略1: 通过图层ID匹配
            if (id.includes('water') || id.includes('ocean') || id.includes('sea')) {
                return true;
            }
            // 策略2: 通过source-layer匹配
            if (layer['source-layer'] && typeof layer['source-layer'] === 'string' && 
                layer['source-layer'].toLowerCase().includes('water')) {
                return true;
            }
            // 策略3: 通过图层类型匹配fill类型的水层
            if (layer.type === 'fill' && layer.paint && layer.paint['fill-color']) {
                const fillColor = layer.paint['fill-color'];
                // 检查是否是常见的水色（浅蓝色）
                if (typeof fillColor === 'string' && 
                    (fillColor.includes('#a8') || fillColor.includes('#7e') || 
                     fillColor.includes('#4d') || fillColor.includes('#a0') ||
                     fillColor.includes('#b3') || fillColor.includes('#c8'))) {
                    return true;
                }
            }
            return false;
        });
        
        // 修改水层颜色
        let modifiedCount = 0;
        waterLayers.forEach(layer => {
            try {
                if (layer.type === 'fill') {
                    appState.map.setPaintProperty(layer.id, 'fill-color', waterColor);
                    modifiedCount++;
                }
            } catch (err) {
                // 忽略错误（可能图层不支持颜色修改）
            }
        });
        
        if (modifiedCount > 0) {
            console.log(`✅ 已修改 ${modifiedCount} 个水层颜色为 ${waterColor}`);
        }
        return modifiedCount;
    } catch (error) {
        console.warn('⚠️ 提取水层失败:', error);
        return 0;
    }
}

/**
 * 设置海洋颜色
 */
function setWaterColor(color) {
    appState.waterColor = color;
    if (appState.map && appState.map.loaded()) {
        if (color) {
            extractAndModifyWaterColor(color);
        } else {
            // Reset to default - need to reload style or extract default water color
            // For now, just clear the custom color
            extractAndModifyWaterColor('#C1D3E2');
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
    
    // Set a timeout to hide loading if style.load doesn't fire (safety net)
    const loadingTimeout = setTimeout(() => {
        console.warn('⚠️  Style load timeout - hiding loading overlay anyway');
        hideLoading();
        showToast('Map style switched (some features may take a moment to load)', 'info');
        // Even if timeout, still try to reapply areas after a delay
        setTimeout(async () => {
            try {
                await reapplySelectedAreas();
                updateMarkersScale();
            } catch (error) {
                console.error('Error reapplying areas after timeout:', error);
            }
        }, 2000);
    }, 15000); // 15 second timeout (increased from 10)
    
    appState.map.setStyle(styleUrl);
    
    appState.map.once('style.load', function () {
        clearTimeout(loadingTimeout); // Clear timeout since style loaded successfully
        
        try {
            // CRITICAL: Clear source state when style changes
            // All sources are removed when style changes, so reset our tracking
            console.log('🔄 Clearing source state after style change...');
            appState.sources = {
                adm0: null,
                adm1: null,
                adm2: null
            };
            
            // Ensure globe projection is maintained after style change
            appState.map.setProjection('globe');
            
            // Set space-like background for Globe Sky (behind the earth only)
            setGlobeSkyBackground();
            
            // 应用自定义海洋颜色（如果设置了）
            if (appState.waterColor) {
                setTimeout(() => {
                    extractAndModifyWaterColor(appState.waterColor);
                }, 1000);
            }
            
            // Reload boundaries after style change and wait for them to load before reapplying
            setTimeout(async () => {
                try {
                    // Load boundary sources first
                    console.log('🔄 Reloading GADM sources after style change...');
                    if (typeof loadBoundarySources === 'function') {
                        loadBoundarySources();
                    }
                    
                    // Wait for GADM sources to actually load (not just start loading)
                    let maxWaitTime = 10000; // 10 seconds max
                    let waited = 0;
                    const checkInterval = 200;
                    
                    while (waited < maxWaitTime) {
                        const hasCountrySource = appState.map && appState.map.getSource('gadm-country');
                        const hasStateSource = appState.map && appState.map.getSource('gadm-state');
                        
                        if (hasCountrySource || hasStateSource) {
                            console.log(`✅ GADM sources reloaded after ${waited}ms`);
                            // Give it a bit more time to be fully ready
                            await new Promise(resolve => setTimeout(resolve, 500));
                            break;
                        }
                        
                        await new Promise(resolve => setTimeout(resolve, checkInterval));
                        waited += checkInterval;
                    }
                    
                    if (waited >= maxWaitTime) {
                        console.warn('⚠️ Timeout waiting for GADM sources to reload after style change');
                    }
                    
                    // Reapply selected areas (will wait for sources if needed)
                    await reapplySelectedAreas();
                    
                    // Also reapply markers scale after style change
                    updateMarkersScale();
                } catch (error) {
                    console.error('Error loading boundary sources or reapplying areas:', error);
                    // Still try to reapply areas even if source loading fails
                    try {
                        await reapplySelectedAreas();
                    } catch (reapplyError) {
                        console.error('Error reapplying selected areas:', reapplyError);
                    }
                }
            }, 100);
            
            // Refresh label layer cache (new style = new label layers)
            try {
                refreshLabelLayerCache();
            } catch (error) {
                console.error('Error refreshing label cache:', error);
            }
            
            // 重新应用预设的标签隐藏
            setTimeout(() => {
                hideCountryAndPlaceLabels();
            }, 500);
            
            hideLoading();
            console.log('✅ Map style switched successfully');
        } catch (error) {
            console.error('Error during style switch:', error);
            hideLoading();
            showToast('Map style switched, but some features may need to reload', 'warning');
        }
    });
    
    // Also handle style errors
    appState.map.once('error', function (e) {
        clearTimeout(loadingTimeout);
        console.error('Map style error:', e);
        hideLoading();
        showToast('Error switching map style. Please try again.', 'error');
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
    
    // 重新应用预设的标签隐藏
    if (!appState.labelsVisible) {
        hideCountryAndPlaceLabels();
    }
}

/**
 * 隐藏国家和地名标签（更精确的控制）
 */
function hideCountryAndPlaceLabels() {
    if (!appState.map) return;
    
    try {
        const style = appState.map.getStyle();
        if (!style || !style.layers) return;
        
        // 查找国家和地名标签层
        const countryPlaceLabels = style.layers.filter(layer => {
            if (layer.type !== 'symbol') return false;
            const id = layer.id.toLowerCase();
            // 匹配国家和地名相关的标签
            return id.includes('country') || 
                   id.includes('place') || 
                   id.includes('city') ||
                   id.includes('state') ||
                   id.includes('settlement') ||
                   (layer.layout && layer.layout['text-field'] && 
                    (typeof layer.layout['text-field'] === 'string' &&
                     (layer.layout['text-field'].includes('{name_en}') || 
                      layer.layout['text-field'].includes('{name}') ||
                      layer.layout['text-field'].includes('name'))));
        });
        
        // 隐藏这些标签
        countryPlaceLabels.forEach(layer => {
            try {
                appState.map.setLayoutProperty(layer.id, 'visibility', 'none');
            } catch (err) {
                // 忽略错误（图层可能还不存在）
            }
        });
        
        if (countryPlaceLabels.length > 0) {
            console.log(`✅ 已隐藏 ${countryPlaceLabels.length} 个国家和地名标签`);
        }
    } catch (error) {
        // 忽略错误（可能是地图未完全加载）
    }
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
async function reapplySelectedAreas() {
    if (!appState.selectedAreas || appState.selectedAreas.length === 0) {
        return;
    }
    
    console.log(`🔄 Reapplying ${appState.selectedAreas.length} selected areas after style change...`);
    
    // Wait for GADM sources to be loaded (check every 200ms, max 10 seconds)
    let maxWaitTime = 10000; // 10 seconds max
    let waited = 0;
    const checkInterval = 200;
    
    while (waited < maxWaitTime) {
        // Check if GADM sources are loaded
        const hasCountrySource = appState.map && appState.map.getSource('gadm-country');
        const hasStateSource = appState.map && appState.map.getSource('gadm-state');
        
        // If we're using GADM (which is the default), wait for sources
        if (hasCountrySource || hasStateSource) {
            // Give it a bit more time for source to be fully ready
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log(`✅ GADM sources ready after ${waited}ms`);
            break;
        }
        
        // If sources don't exist yet, try to load them
        if (waited === 0 && typeof loadBoundarySources === 'function') {
            console.log('📥 Triggering GADM sources reload...');
            loadBoundarySources();
        }
        
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waited += checkInterval;
    }
    
    if (waited >= maxWaitTime) {
        console.warn('⚠️ Timeout waiting for GADM sources to reload');
    }
    
    for (const area of appState.selectedAreas) {
        try {
            // Normalize color format if needed (#F0F → #FF00FF)
            let normalizedColor = area.color;
            if (/^#([0-9A-Fa-f]{3})$/.test(area.color)) {
                normalizedColor = '#' + area.color.slice(1).split('').map(c => c + c).join('');
            }
            
            // Ensure source is loaded before creating layer (double-check)
            const gadmSourceId = `gadm-${area.type}`;
            if (!appState.map.getSource(gadmSourceId) && typeof loadBoundarySourceForType === 'function') {
                await loadBoundarySourceForType(area.type, false);
                // Wait a bit more for source to be ready
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Use the area's stored boundaryMode if available, otherwise use current mode
            const areaBoundaryMode = area.boundaryMode || appState.boundaryMode || 'fill';
            
            // Small delay between areas to ensure proper loading
            // Pass the area's original boundaryMode to preserve its style
            await createAreaLayer(area.id, area.name, area.type, normalizedColor, area.layerId, areaBoundaryMode);
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error(`Error reapplying area ${area.name} (${area.type}):`, error);
            // Continue with next area even if one fails
        }
    }
    
    console.log('✅ Finished reapplying selected areas');
    
    // 重新应用自定义标签
    setTimeout(() => {
        updateCustomChineseLabels();
    }, 1000);
}

/**
 * 计算几何中心点（使用真正的几何中心算法 - 质心）
 */
function calculateCentroid(geometry) {
    if (!geometry) return null;
    
    if (geometry.type === 'Point') {
        return geometry.coordinates;
    } else if (geometry.type === 'Polygon') {
        // 使用真正的几何中心算法（质心）
        const coords = geometry.coordinates[0]; // 外环
        if (!coords || coords.length === 0) return null;
        
        // 移除最后一个点（如果与第一个点重复）
        const ring = coords.length > 1 && 
                     coords[coords.length - 1][0] === coords[0][0] && 
                     coords[coords.length - 1][1] === coords[0][1]
                     ? coords.slice(0, -1) : coords;
        
        if (ring.length < 3) {
            // 如果点太少，回退到算术平均
            const count = ring.length;
            const lngSum = ring.reduce((sum, c) => sum + c[0], 0);
            const latSum = ring.reduce((sum, c) => sum + c[1], 0);
            return [lngSum / count, latSum / count];
        }
        
        let area = 0;
        let lngSum = 0;
        let latSum = 0;
        
        // 使用 Shoelace 公式计算质心
        for (let i = 0; i < ring.length; i++) {
            const j = (i + 1) % ring.length;
            const xi = ring[i][0];
            const yi = ring[i][1];
            const xj = ring[j][0];
            const yj = ring[j][1];
            
            const cross = xi * yj - xj * yi;
            area += cross;
            lngSum += (xi + xj) * cross;
            latSum += (yi + yj) * cross;
        }
        
        area = area / 2;
        if (Math.abs(area) < 1e-9) {
            // 如果面积太小（可能是退化多边形），回退到算术平均
            const count = ring.length;
            lngSum = ring.reduce((sum, c) => sum + c[0], 0);
            latSum = ring.reduce((sum, c) => sum + c[1], 0);
            return [lngSum / count, latSum / count];
        }
        
        return [lngSum / (6 * area), latSum / (6 * area)];
    } else if (geometry.type === 'MultiPolygon') {
        // 对于 MultiPolygon，使用第一个（通常是最大的）多边形的中心
        if (geometry.coordinates && geometry.coordinates[0] && geometry.coordinates[0][0]) {
            return calculateCentroid({ type: 'Polygon', coordinates: geometry.coordinates[0] });
        }
    }
    return null;
}

/**
 * 获取区域中心点
 */
function getAreaCenter(area) {
    if (!area || !area.id || !area.type) return null;
    
    try {
        const gadmSource = appState.map.getSource(`gadm-${area.type}`);
        if (gadmSource && gadmSource._data && gadmSource._data.features) {
            // 查找对应的feature
            const feature = gadmSource._data.features.find(f => {
                if (!f || !f.properties) return false;
                const properties = f.properties;
                
                if (area.type === 'country') {
                    return properties.GID_0 === area.id;
                } else if (area.type === 'state') {
                    return properties.GID_1 === area.id;
                } else if (area.type === 'city') {
                    return properties.GID_2 === area.id;
                }
                return false;
            });
            
            if (feature && feature.geometry) {
                // 计算多边形中心点
                const center = calculateCentroid(feature.geometry);
                if (center && center.length >= 2) {
                    return center;
                }
            }
        }
    } catch (error) {
        console.warn(`⚠️ 无法找到区域 ${area.name} 的中心点:`, error);
    }
    
    return null;
}

/**
 * 检查两个区域是否相邻且颜色相同
 */
function areAdjacentAndSameColor(area1, area2) {
    if (!area1 || !area2) return false;
    
    // 检查颜色是否相同
    if (area1.color !== area2.color) return false;
    
    // 只检查国家级别的相邻关系
    if (area1.type !== 'country' || area2.type !== 'country') return false;
    
    // 检查是否相邻（使用 country-adjacency.js 中的逻辑）
    if (typeof window.areCountriesAdjacent === 'function') {
        const iso1 = area1.id; // GADM中使用ISO代码作为ID
        const iso2 = area2.id;
        return window.areCountriesAdjacent(iso1, iso2);
    }
    
    return false;
}

/**
 * 获取邻近国家列表（从GADM数据中查找）
 * @param {Array} selectedAreas - 已选区域列表
 * @param {number} depth - 递归深度（1 = 邻近国, 2 = 邻近国的邻近国, 默认1）
 */
function getAdjacentCountriesFromGADM(selectedAreas, depth = 1) {
    if (!appState.map || !selectedAreas || selectedAreas.length === 0) {
        return [];
    }
    
    const adjacentCountries = [];
    const processedIsoCodes = new Set(); // 已处理的ISO代码（避免重复）
    const selectedIsoCodes = new Set(selectedAreas.filter(a => a.type === 'country' && a.id).map(a => a.id));
    
    // 将已选国家加入已处理集合
    selectedIsoCodes.forEach(iso => processedIsoCodes.add(iso));
    
    if (selectedIsoCodes.size === 0) {
        return [];
    }
    
    try {
        const gadmSource = appState.map.getSource('gadm-country');
        if (!gadmSource || !gadmSource._data || !gadmSource._data.features) {
            return [];
        }
        
        // 递归函数：获取指定ISO代码集合的邻近国家
        const getAdjacentForIsoSet = (isoSet, currentDepth) => {
            if (currentDepth > depth) {
                return [];
            }
            
            const result = [];
            const nextLevelIsoSet = new Set();
            
            // 遍历所有国家，找出与isoSet中任何国家相邻的国家
            gadmSource._data.features.forEach(feature => {
                if (!feature || !feature.properties) return;
                
                const props = feature.properties;
                const isoCode = props.GID_0; // ISO代码
                
                // 跳过已处理的国家
                if (processedIsoCodes.has(isoCode)) {
                    return;
                }
                
                // 检查是否与isoSet中任何国家相邻
                const isAdjacent = Array.from(isoSet).some(selectedIso => {
                    if (typeof window.areCountriesAdjacent === 'function') {
                        return window.areCountriesAdjacent(selectedIso, isoCode);
                    }
                    return false;
                });
                
                if (isAdjacent) {
                    // 标记为已处理
                    processedIsoCodes.add(isoCode);
                    nextLevelIsoSet.add(isoCode);
                    
                    // 获取国家名称（优先使用中文名称，如果没有则使用英文名称）
                    let countryName = props.NAME_CHN || props.NAME_0 || props.COUNTRY || isoCode;
                    
                    // 如果没有中文名称，尝试从 COUNTRY_CODES 映射表获取
                    if (typeof COUNTRY_CODES !== 'undefined' && COUNTRY_CODES[isoCode]) {
                        const countryInfo = COUNTRY_CODES[isoCode];
                        // 优先使用中文名称
                        countryName = countryInfo.name || countryInfo.nameEn || countryName;
                    } else {
                        // 如果没有映射表，尝试使用 getAreaName 函数获取（它会处理中文名称转换）
                        if (typeof getAreaName === 'function') {
                            try {
                                const areaName = getAreaName(feature, 'country');
                                if (areaName && areaName !== 'Unknown Country') {
                                    countryName = areaName;
                                }
                            } catch (err) {
                                // 忽略错误，使用默认名称
                            }
                        }
                    }
                    
                    // 获取中心点
                    const center = calculateCentroid(feature.geometry);
                    if (center && center.length >= 2) {
                        result.push({
                            isoCode: isoCode,
                            name: countryName,
                            center: center,
                            feature: feature,
                            depth: currentDepth // 记录深度
                        });
                    }
                }
            });
            
            // 如果还有下一层，递归获取
            if (currentDepth < depth && nextLevelIsoSet.size > 0) {
                const nextLevel = getAdjacentForIsoSet(nextLevelIsoSet, currentDepth + 1);
                result.push(...nextLevel);
            }
            
            return result;
        };
        
        // 从第一层开始递归
        const allAdjacent = getAdjacentForIsoSet(selectedIsoCodes, 1);
        
        console.log(`📍 找到 ${allAdjacent.length} 个邻近国家（深度 ${depth}）`);
        return allAdjacent;
    } catch (error) {
        console.warn('⚠️ 获取邻近国家失败:', error);
        return [];
    }
}

/**
 * 获取邻近海域列表
 * 基于已选国家的海岸线，识别邻近的海域/海洋
 */
function getAdjacentSeas(selectedAreas) {
    if (!appState.map || !selectedAreas || selectedAreas.length === 0) {
        return [];
    }
    
    const adjacentSeas = [];
    const selectedIsoCodes = new Set(selectedAreas.filter(a => a.type === 'country' && a.id).map(a => a.id));
    
    if (selectedIsoCodes.size === 0) {
        return [];
    }
    
    // 海域名称映射（基于地理位置）
    const seaNames = {
        // 亚洲海域
        'CHN': ['東海', '南海', '黃海', '渤海'],
        'JPN': ['太平洋', '日本海', '東海'],
        'KOR': ['日本海', '黃海', '東海'],
        'TWN': ['東海', '南海', '太平洋'],
        'PHL': ['南海', '太平洋', '蘇祿海'],
        'VNM': ['南海', '東海'],
        'THA': ['泰國灣', '安達曼海', '南海'],
        'MYS': ['南海', '馬六甲海峽', '蘇祿海'],
        'SGP': ['南海', '馬六甲海峽'],
        'IDN': ['南海', '爪哇海', '蘇拉威西海', '班達海', '太平洋', '印度洋'],
        'IND': ['阿拉伯海', '孟加拉灣', '印度洋', '安達曼海'],
        'BGD': ['孟加拉灣'],
        'PAK': ['阿拉伯海'],
        'IRN': ['波斯灣', '阿曼灣', '裏海'],
        'SAU': ['紅海', '波斯灣', '阿拉伯海'],
        'ARE': ['波斯灣', '阿曼灣'],
        'TUR': ['黑海', '地中海', '愛琴海', '馬爾馬拉海'],
        'GRC': ['地中海', '愛琴海', '愛奧尼亞海'],
        'RUS': ['太平洋', '北冰洋', '波羅的海', '黑海', '日本海', '白令海', '鄂霍次克海'],
        // 欧洲海域
        'GBR': ['北海', '大西洋', '愛爾蘭海', '英吉利海峽'],
        'FRA': ['大西洋', '地中海', '英吉利海峽'],
        'ESP': ['大西洋', '地中海', '比斯開灣'],
        'ITA': ['地中海', '亞得里亞海', '第勒尼安海', '愛奧尼亞海'],
        'DEU': ['北海', '波羅的海'],
        'NLD': ['北海', '大西洋'],
        'BEL': ['北海', '大西洋'],
        'NOR': ['北海', '挪威海', '巴倫支海', '北冰洋'],
        'SWE': ['波羅的海', '波的尼亞灣'],
        'FIN': ['波羅的海', '波的尼亞灣'],
        'DNK': ['北海', '波羅的海', '卡特加特海峽'],
        'POL': ['波羅的海'],
        // 美洲海域
        'USA': ['太平洋', '大西洋', '墨西哥灣', '五大湖'],
        'CAN': ['太平洋', '大西洋', '北冰洋', '五大湖', '哈德遜灣'],
        'MEX': ['太平洋', '大西洋', '墨西哥灣', '加勒比海'],
        'BRA': ['大西洋', '南大西洋'],
        'ARG': ['大西洋', '南大西洋'],
        'CHL': ['太平洋', '南太平洋'],
        'PER': ['太平洋', '南太平洋'],
        'COL': ['太平洋', '大西洋', '加勒比海'],
        'VEN': ['加勒比海', '大西洋'],
        // 非洲海域
        'EGY': ['地中海', '紅海'],
        'LBY': ['地中海'],
        'TUN': ['地中海'],
        'DZA': ['地中海', '大西洋'],
        'MAR': ['地中海', '大西洋'],
        'ZAF': ['大西洋', '印度洋'],
        'SOM': ['印度洋', '亞丁灣'],
        'KEN': ['印度洋'],
        'TZA': ['印度洋'],
        // 大洋洲
        'AUS': ['太平洋', '印度洋', '塔斯曼海', '珊瑚海', '阿拉弗拉海'],
        'NZL': ['太平洋', '塔斯曼海'],
        // 中东
        'ISR': ['地中海', '紅海'],
        'LBN': ['地中海'],
        'SYR': ['地中海'],
        'YEM': ['紅海', '阿拉伯海', '亞丁灣'],
        'OMN': ['阿拉伯海', '阿曼灣', '波斯灣'],
        'KWT': ['波斯灣'],
        'QAT': ['波斯灣'],
        'BHR': ['波斯灣'],
        'IRQ': ['波斯灣'],
        // 高加索地区
        'AZE': ['裏海'],
        'GEO': ['黑海'],
        'ARM': [], // 内陆国家
        // 其他
        'UKR': ['黑海', '亞速海'],
        'ROU': ['黑海'],
        'BGR': ['黑海'],
        'HRV': ['亞得里亞海'],
        'ALB': ['亞得里亞海', '愛奧尼亞海'],
        'MNE': ['亞得里亞海']
    };
    
    // 为每个已选国家查找邻近海域
    selectedIsoCodes.forEach(isoCode => {
        const seas = seaNames[isoCode] || [];
        seas.forEach((seaName, index) => {
            // 计算海域标签位置（基于国家中心点向海岸方向偏移）
            const countryArea = selectedAreas.find(a => a.id === isoCode);
            if (countryArea) {
                const center = getAreaCenter(countryArea);
                if (center && center.length >= 2) {
                    // 根据国家位置和海域类型，计算标签位置
                    // 简化处理：在国家中心点附近偏移
                    const offset = getSeaLabelOffset(isoCode, seaName, index, seas.length);
                    const seaCenter = [
                        center[0] + offset[0],
                        center[1] + offset[1]
                    ];
                    
                    // 检查是否已存在相同海域的标签
                    const existingSea = adjacentSeas.find(s => 
                        s.name === seaName && 
                        Math.abs(s.center[0] - seaCenter[0]) < 1 &&
                        Math.abs(s.center[1] - seaCenter[1]) < 1
                    );
                    
                    if (!existingSea) {
                        adjacentSeas.push({
                            id: `sea_${isoCode}_${seaName}`,
                            name: seaName,
                            center: seaCenter,
                            countryIso: isoCode
                        });
                    }
                }
            }
        });
    });
    
    console.log(`🌊 找到 ${adjacentSeas.length} 个邻近海域`);
    return adjacentSeas;
}

/**
 * 获取海域标签的偏移量（相对于国家中心点）
 */
function getSeaLabelOffset(isoCode, seaName, index, totalSeas) {
    // 根据海域名称和国家位置，计算合适的标签位置
    // 改进版：使用更精确的偏移量，基于实际地理位置
    
    const offsets = {
        // 亚洲
        'CHN': {
            '東海': [1.2, 0.2],      // 中国东部，东海在东南方向
            '南海': [0.8, -1.2],     // 中国南部，南海在正南方向
            '黃海': [0.9, 0.7],       // 中国东北，黄海在东北方向
            '渤海': [0.3, 0.4]        // 中国北部，渤海在正北方向
        },
        'JPN': {
            '太平洋': [2.0, 0],       // 日本东部，太平洋在正东方向
            '日本海': [-0.8, 0],      // 日本西部，日本海在正西方向
            '東海': [-1.0, -0.4]      // 日本西南，东海在西南方向
        },
        'KOR': {
            '日本海': [0.8, 0.3],     // 韩国东部，日本海在东北方向
            '黃海': [-0.5, -0.3],     // 韩国西部，黄海在西北方向
            '東海': [-0.7, -0.5]      // 韩国西南，东海在西南方向
        },
        'TWN': {
            '東海': [0.5, 0.6],       // 台湾北部，东海在东北方向
            '南海': [0.2, -0.8],      // 台湾南部，南海在正南方向
            '太平洋': [1.5, 0]        // 台湾东部，太平洋在正东方向
        },
        // 欧洲
        'GBR': {
            '北海': [0.3, -0.5],      // 英国东部，北海在东北方向
            '大西洋': [-1.2, 0],      // 英国西部，大西洋在正西方向
            '愛爾蘭海': [-0.5, 0.3],  // 英国西部，爱尔兰海在西北方向
            '英吉利海峽': [0.2, -0.8] // 英国南部，英吉利海峡在正南方向
        },
        'FRA': {
            '大西洋': [-1.0, 0],      // 法国西部，大西洋在正西方向
            '地中海': [0.5, -0.8],    // 法国南部，地中海在正南方向
            '英吉利海峽': [-0.3, -0.5] // 法国北部，英吉利海峡在西北方向
        },
        'ESP': {
            '大西洋': [-1.2, 0],      // 西班牙西部，大西洋在正西方向
            '地中海': [0.8, -0.5],    // 西班牙东部，地中海在东南方向
            '比斯開灣': [-0.5, -0.3]  // 西班牙北部，比斯开湾在西北方向
        },
        'ITA': {
            '地中海': [0, -1.0],       // 意大利南部，地中海在正南方向
            '亞得里亞海': [0.8, 0],    // 意大利东部，亚得里亚海在正东方向
            '第勒尼安海': [-0.5, -0.3], // 意大利西部，第勒尼安海在西南方向
            '愛奧尼亞海': [0.5, -0.8]  // 意大利东南，爱奥尼亚海在东南方向
        },
        'TUR': {
            '黑海': [0.5, 0.5],        // 土耳其北部，黑海在东北方向
            '地中海': [0, -1.0],        // 土耳其南部，地中海在正南方向
            '愛琴海': [-0.5, -0.5],    // 土耳其西部，爱琴海在西南方向
            '馬爾馬拉海': [0.2, 0.2]   // 土耳其西北，马尔马拉海在西北方向
        },
        'RUS': {
            '太平洋': [3.0, 0],        // 俄罗斯东部，太平洋在正东方向
            '北冰洋': [0, 2.0],        // 俄罗斯北部，北冰洋在正北方向
            '波羅的海': [-0.8, -0.3],  // 俄罗斯西部，波罗的海在西北方向
            '黑海': [-0.5, -0.8],      // 俄罗斯西南，黑海在西南方向
            '日本海': [2.5, -0.5],     // 俄罗斯东南，日本海在东南方向
            '白令海': [3.5, 0.5],      // 俄罗斯东北，白令海在东北方向
            '鄂霍次克海': [2.8, 0.2]   // 俄罗斯东部，鄂霍次克海在正东方向
        },
        // 其他常见模式
        'default': { 'default': [0.8, 0] } // 默认：向东偏移
    };
    
    const countryOffsets = offsets[isoCode] || offsets['default'];
    const seaOffset = countryOffsets[seaName] || countryOffsets['default'] || [0.8, 0];
    
    // 如果有多个海域，稍微分散标签位置（避免重叠）
    if (totalSeas > 1) {
        const angle = (index / totalSeas) * Math.PI * 2;
        const radius = 0.4; // 增加分散半径，使标签更分散
        return [
            seaOffset[0] + Math.cos(angle) * radius,
            seaOffset[1] + Math.sin(angle) * radius
        ];
    }
    
    return seaOffset;
}

/**
 * 检查标签位置是否与其他标签重叠（基于像素距离）
 * @param {Array<number>} newLabelPos - 新标签位置 [lng, lat]
 * @param {Array} existingLabels - 已存在的标签数组
 * @param {number} minDistance - 最小距离（像素），默认50px
 * @returns {boolean} - true表示重叠
 */
function checkLabelOverlap(newLabelPos, existingLabels, minDistance = 50) {
    if (!appState.map || !existingLabels || existingLabels.length === 0) {
        return false;
    }
    
    try {
        const newPoint = appState.map.project(newLabelPos);
        if (!newPoint) return false;
        
        for (const existing of existingLabels) {
            if (!existing.geometry || !existing.geometry.coordinates || existing.geometry.coordinates.length < 2) {
                continue;
            }
            
            const existingPoint = appState.map.project(existing.geometry.coordinates);
            if (!existingPoint) continue;
            
            const distance = Math.sqrt(
                Math.pow(newPoint.x - existingPoint.x, 2) +
                Math.pow(newPoint.y - existingPoint.y, 2)
            );
            
            if (distance < minDistance) {
                return true; // 重叠
            }
        }
    } catch (error) {
        console.warn('⚠️ 检查标签重叠时出错:', error);
        return false;
    }
    
    return false;
}

/**
 * 检查标签位置是否在对应区域的边界内
 * @param {string} areaId - 区域ID
 * @param {Array<number>} coordinates - 坐标 [lng, lat]
 * @param {string} labelType - 标签类型 'main' | 'adjacent' | 'sea'
 * @returns {boolean} - true表示在边界内
 */
function isLabelPositionWithinArea(areaId, coordinates, labelType) {
    if (!appState.map || !coordinates || coordinates.length < 2) {
        return false;
    }
    
    // 海域标签暂时允许（边界复杂，难以精确检查）
    if (labelType === 'sea') {
        return true;
    }
    
    if (labelType === 'main') {
        // 主要区域：检查是否在 selectedAreas 中对应区域的边界内
        const area = appState.selectedAreas.find(a => a.id === areaId);
        if (!area) return false;
        
        const gadmSource = appState.map.getSource(`gadm-${area.type}`);
        if (!gadmSource || !gadmSource._data || !gadmSource._data.features) {
            return false;
        }
        
        // 查找对应的 feature
        const feature = gadmSource._data.features.find(f => {
            if (!f || !f.properties) return false;
            if (area.type === 'country') {
                return f.properties.GID_0 === areaId;
            } else if (area.type === 'state') {
                return f.properties.GID_1 === areaId;
            }
            return false;
        });
        
        if (feature && feature.geometry) {
            return isPointInPolygonGADM(coordinates, feature.geometry);
        }
    } else if (labelType === 'adjacent') {
        // 邻近国家：检查是否在该国家的 GADM 边界内
        const gadmSource = appState.map.getSource('gadm-country');
        if (!gadmSource || !gadmSource._data || !gadmSource._data.features) {
            return false;
        }
        
        const feature = gadmSource._data.features.find(f => {
            if (!f || !f.properties) return false;
            return f.properties.GID_0 === areaId;
        });
        
        if (feature && feature.geometry) {
            return isPointInPolygonGADM(coordinates, feature.geometry);
        }
    }
    
    return false;
}

/**
 * 检查新位置是否跨越到其他区域的边界内
 * @param {string} areaId - 标签对应的区域ID
 * @param {Array<number>} coordinates - 坐标 [lng, lat]
 * @param {string} labelType - 标签类型 'main' | 'adjacent' | 'sea'
 * @param {Array} allLabels - 所有标签的数组
 * @returns {boolean} - true表示跨越到其他区域
 */
function isPositionCrossingOtherBoundaries(areaId, coordinates, labelType, allLabels) {
    if (!appState.map || !coordinates || !allLabels) {
        return false;
    }
    
    // 对于海域标签，暂时允许（边界复杂）
    if (labelType === 'sea') {
        return false;
    }
    
    // 检查是否在其他标签对应区域的边界内
    for (const label of allLabels) {
        if (!label.properties || label.properties.areaId === areaId) {
            continue; // 跳过自己
        }
        
        const otherAreaId = label.properties.areaId;
        const otherLabelType = label.properties.labelType;
        
        // 检查新位置是否在这个其他区域的边界内
        if (isLabelPositionWithinArea(otherAreaId, coordinates, otherLabelType)) {
            return true; // 跨越到其他区域
        }
    }
    
    return false;
}

/**
 * 使用螺旋搜索算法寻找不重叠且不跨边界的位置
 * @param {Array<number>} center - 区域中心点 [lng, lat]
 * @param {Array} existingLabels - 已存在的标签数组
 * @param {string} areaId - 区域ID
 * @param {string} labelType - 标签类型 'main' | 'adjacent' | 'sea'
 * @param {number} maxAttempts - 最大尝试次数，默认20
 * @returns {Array<number>} - 合法位置 [lng, lat]，如果未找到则返回原始中心
 */
function findNonOverlappingPosition(center, existingLabels, areaId, labelType, maxAttempts = 20) {
    if (!center || center.length < 2) {
        return center;
    }
    
    const spiralRadius = 0.1; // 初始搜索半径（度）
    const angleStep = Math.PI / 6; // 角度步长（30度）
    const radiusStep = 0.05; // 半径增长步长
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const angle = (attempt * angleStep) % (Math.PI * 2);
        const radius = spiralRadius + (attempt * radiusStep);
        
        const candidatePos = [
            center[0] + radius * Math.cos(angle),
            center[1] + radius * Math.sin(angle)
        ];
        
        // 检查重叠
        if (checkLabelOverlap(candidatePos, existingLabels)) {
            continue;
        }
        
        // 检查边界
        if (!isLabelPositionWithinArea(areaId, candidatePos, labelType)) {
            continue;
        }
        
        // 检查跨边界
        if (isPositionCrossingOtherBoundaries(areaId, candidatePos, labelType, existingLabels)) {
            continue;
        }
        
        return candidatePos; // 找到合法位置
    }
    
    return center; // 未找到，返回原始中心
}

/**
 * 更新自定义繁中标签
 * 为已填充的区域添加中文标签
 */
function updateCustomChineseLabels() {
    console.log('🔍 [updateCustomChineseLabels] 函数被调用');
    console.log('   - appState.map:', !!appState.map);
    console.log('   - appState.selectedAreas:', appState.selectedAreas ? appState.selectedAreas.length : 'null/undefined');
    
    if (!appState.map || !appState.selectedAreas || appState.selectedAreas.length === 0) {
        console.log('⚠️ [updateCustomChineseLabels] 没有选中的区域，移除标签层');
        // 如果没有选中的区域，移除标签层
        removeCustomChineseLabels();
        return;
    }
    
    console.log(`📋 [updateCustomChineseLabels] 找到 ${appState.selectedAreas.length} 个选中区域`);
    
    // 不移除标签层，而是更新数据源（保留样式和拖拽功能）
    // removeCustomChineseLabels(); // 注释掉，改为更新现有数据源
    
    // 创建标签数据（只包含有填充颜色的区域）
    const areasWithColors = appState.selectedAreas.filter(area => area.color && area.layerId);
    console.log(`🎨 [updateCustomChineseLabels] 有颜色的区域: ${areasWithColors.length} 个`);
    
    if (areasWithColors.length === 0) {
        console.warn('⚠️ [updateCustomChineseLabels] 没有找到有颜色的区域（需要 color 和 layerId）');
        // 显示每个区域的属性以便调试
        appState.selectedAreas.forEach((area, index) => {
            console.log(`   区域 ${index + 1}:`, {
                name: area.name,
                id: area.id,
                type: area.type,
                hasColor: !!area.color,
                color: area.color,
                hasLayerId: !!area.layerId,
                layerId: area.layerId
            });
        });
    }
    
    // 过滤掉相邻且颜色相同的区域
    const labelFeatures = areasWithColors
        .filter((area, index, areas) => {
            // 检查是否有相邻且颜色相同的区域
            const hasAdjacentSameColor = areas.some(otherArea => 
                otherArea.id !== area.id && 
                areAdjacentAndSameColor(area, otherArea)
            );
            
            // 如果有相邻且颜色相同的区域，不添加标签
            if (hasAdjacentSameColor) {
                console.log(`📍 跳过标签: ${area.name} (与相邻国家颜色相同)`);
                return false;
            }
            
            return true;
        })
        .map(area => {
            // 获取区域中心点
            const center = getAreaCenter(area);
            if (!center || center.length < 2) {
                console.warn(`⚠️ 无法获取区域 ${area.name} 的中心点，跳过标签`);
                return null;
            }
            
            // 尝试查询 Mapbox 英文标签的位置，对齐到英文标签
            let finalCenter = center;
            let textAnchor = 'center';
            let textOffset = [0, 0];

            try {
                // 查询 Mapbox 标签层（country-label, place-label, state-label 等）
                const labelLayers = ['country-label', 'place-label', 'place-city-label',
                    'place-state-label', 'place-country-label', 'place-town-label'];

                // 在区域中心点附近查询英文标签
                // 使用 queryRenderedFeatures 查询当前视图中渲染的标签
                const centerPoint = appState.map.project(center);
                const mapboxLabels = appState.map.queryRenderedFeatures(
                    centerPoint,
                    {
                        layers: labelLayers,
                        radius: 100 // 100像素范围内查找 Mapbox 标签
                    }
                );

                if (mapboxLabels.length > 0) {
                    // 找到最接近的标签
                    const closestLabel = mapboxLabels[0];
                    const labelCoords = closestLabel.geometry.coordinates;

                    if (labelCoords && labelCoords.length >= 2) {
                        // 使用 Mapbox 标签的位置
                        finalCenter = [labelCoords[0], labelCoords[1]];
                        console.log(`📍 对齐到 Mapbox 标签: ${area.name} -> [${finalCenter[0].toFixed(4)}, ${finalCenter[1].toFixed(4)}]`);

                        // 获取 Mapbox 标签的对齐方式（如果有）
                        const labelLayer = appState.map.getLayer(closestLabel.layer.id);
                        if (labelLayer && labelLayer.layout) {
                            if (labelLayer.layout['text-anchor']) {
                                textAnchor = labelLayer.layout['text-anchor'];
                            }
                            if (labelLayer.layout['text-offset']) {
                                const offset = labelLayer.layout['text-offset'];
                                if (Array.isArray(offset) && offset.length >= 2) {
                                    textOffset = [offset[0], offset[1]];
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.warn(`⚠️ 查询 Mapbox 标签失败: ${error.message}`);
            }

            // 获取自定义标签位置偏移（如果有，优先级高于 Mapbox 对齐）
            const labelPosition = appState.labelPositions[area.id];
            if (labelPosition && Array.isArray(labelPosition.offset) && labelPosition.offset.length === 2) {
                const offsetX = typeof labelPosition.offset[0] === 'number' ? labelPosition.offset[0] : 0;
                const offsetY = typeof labelPosition.offset[1] === 'number' ? labelPosition.offset[1] : 0;
                
                // 将像素偏移转换为地理坐标偏移
                if (appState.map && (offsetX !== 0 || offsetY !== 0)) {
                    try {
                        const originalPoint = appState.map.project(finalCenter);
                        const newPoint = {
                            x: originalPoint.x + offsetX,
                            y: originalPoint.y + offsetY
                        };
                        const newCoordinates = appState.map.unproject([newPoint.x, newPoint.y]);
                        finalCenter = [newCoordinates.lng, newCoordinates.lat];
                    } catch (error) {
                        console.warn('⚠️ 无法转换偏移量到坐标:', error);
                    }
                }
            }
            
            return {
                type: 'Feature',
                properties: {
                    name: area.name, // 已经是中文名称
                    areaId: area.id,
                    areaType: area.type,
                    labelType: 'main', // 主要国家标签
                    _originalCenter: center, // 存储原始中心点，用于拖拽时计算偏移
                    _textAnchor: textAnchor, // 存储文本对齐方式（对齐到 Mapbox 标签）
                    _textOffset: textOffset   // 存储文本偏移（对齐到 Mapbox 标签）
                },
                geometry: {
                    type: 'Point',
                    coordinates: finalCenter // 使用对齐到 Mapbox 标签或应用偏移后的坐标
                }
            };
        })
        .filter(f => f !== null); // 过滤掉null值
    
    // 添加邻近海域的标签
    const adjacentSeas = getAdjacentSeas(appState.selectedAreas);
    adjacentSeas.forEach(sea => {
        // 检查是否已经有相同名称的标签（避免重复）
        const existingLabel = labelFeatures.find(f => 
            f.properties.name === sea.name && 
            Math.abs(f.geometry.coordinates[0] - sea.center[0]) < 0.1 &&
            Math.abs(f.geometry.coordinates[1] - sea.center[1]) < 0.1
        );
        
        if (!existingLabel) {
            // 尝试对齐到 Mapbox 海域标签位置
            let finalCenter = sea.center;
            let textAnchor = 'center';
            let textOffset = [0, 0];

            try {
                // 查询 Mapbox 海域/海洋标签层
                const seaLabelLayers = ['water-name-ocean', 'water-name-sea', 'water-name-lake',
                    'place-ocean', 'place-sea', 'waterway-label'];

                // 在海域中心点附近查询 Mapbox 标签
                const centerPoint = appState.map.project(sea.center);
                const mapboxLabels = appState.map.queryRenderedFeatures(
                    centerPoint,
                    {
                        layers: seaLabelLayers,
                        radius: 150 // 150像素范围内查找 Mapbox 海域标签
                    }
                );

                if (mapboxLabels.length > 0) {
                    // 找到最接近的海域标签
                    let closestLabel = null;
                    let minDistance = Infinity;

                    mapboxLabels.forEach(label => {
                        const labelCoords = label.geometry.coordinates;
                        if (labelCoords && labelCoords.length >= 2) {
                            // 计算距离
                            const labelPoint = appState.map.project(labelCoords);
                            const distance = Math.sqrt(
                                Math.pow(labelPoint.x - centerPoint.x, 2) +
                                Math.pow(labelPoint.y - centerPoint.y, 2)
                            );

                            if (distance < minDistance) {
                                minDistance = distance;
                                closestLabel = label;
                            }
                        }
                    });

                    if (closestLabel && closestLabel.geometry.coordinates) {
                        const labelCoords = closestLabel.geometry.coordinates;
                        // 使用 Mapbox 标签的位置
                        finalCenter = [labelCoords[0], labelCoords[1]];
                        console.log(`🌊 对齐到 Mapbox 海域标签: ${sea.name} -> [${finalCenter[0].toFixed(4)}, ${finalCenter[1].toFixed(4)}]`);

                        // 获取 Mapbox 标签的对齐方式（如果有）
                        const labelLayer = appState.map.getLayer(closestLabel.layer.id);
                        if (labelLayer && labelLayer.layout) {
                            if (labelLayer.layout['text-anchor']) {
                                textAnchor = labelLayer.layout['text-anchor'];
                            }
                            if (labelLayer.layout['text-offset']) {
                                const offset = labelLayer.layout['text-offset'];
                                if (Array.isArray(offset) && offset.length >= 2) {
                                    textOffset = [offset[0], offset[1]];
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.warn(`⚠️ 查询 Mapbox 海域标签失败: ${error.message}`);
            }

            // 获取自定义标签位置偏移（如果有，优先级高于 Mapbox 对齐）
            const labelPosition = appState.labelPositions[sea.id];
            if (labelPosition && Array.isArray(labelPosition.offset) && labelPosition.offset.length === 2) {
                const offsetX = typeof labelPosition.offset[0] === 'number' ? labelPosition.offset[0] : 0;
                const offsetY = typeof labelPosition.offset[1] === 'number' ? labelPosition.offset[1] : 0;
                
                // 将像素偏移转换为地理坐标偏移
                if (appState.map && (offsetX !== 0 || offsetY !== 0)) {
                    try {
                        const originalPoint = appState.map.project(finalCenter);
                        const newPoint = {
                            x: originalPoint.x + offsetX,
                            y: originalPoint.y + offsetY
                        };
                        const newCoordinates = appState.map.unproject([newPoint.x, newPoint.y]);
                        finalCenter = [newCoordinates.lng, newCoordinates.lat];
                    } catch (error) {
                        console.warn('⚠️ 无法转换偏移量到坐标:', error);
                    }
                }
            }
            
            labelFeatures.push({
                type: 'Feature',
                properties: {
                    name: sea.name,
                    areaId: sea.id,
                    areaType: 'sea',
                    labelType: 'sea', // 临海标签
                    isAdjacent: true,
                    _originalCenter: sea.center, // 存储原始中心点
                    _textAnchor: textAnchor, // 存储文本对齐方式（对齐到 Mapbox 标签）
                    _textOffset: textOffset   // 存储文本偏移（对齐到 Mapbox 标签）
                },
                geometry: {
                    type: 'Point',
                    coordinates: finalCenter // 使用对齐到 Mapbox 标签或应用偏移后的坐标
                }
            });
        }
    });
    
    // 添加邻近国家的标签（包括邻近国的邻近国，深度=2）
    const adjacentCountries = getAdjacentCountriesFromGADM(appState.selectedAreas, 2);
    const selectedIsoCodes = new Set(areasWithColors.filter(a => a.type === 'country').map(a => a.id));
    
    adjacentCountries.forEach(adjCountry => {
        // 跳过已经被填充的国家（避免重复标签）
        if (selectedIsoCodes.has(adjCountry.isoCode)) {
            return;
        }
        
        // 检查是否有相邻的已填充国家使用相同颜色
        // 如果有，则不显示标签（避免标签重叠）
        let shouldSkip = false;
        const adjacentFilledAreas = areasWithColors.filter(area => {
            if (area.type !== 'country') return false;
            if (typeof window.areCountriesAdjacent !== 'function') return false;
            return window.areCountriesAdjacent(area.id, adjCountry.isoCode);
        });
        
        // 如果只有一个相邻的已填充国家，且颜色明显不同，则显示标签
        // 如果有多个相邻的已填充国家使用相同颜色，则不显示标签
        if (adjacentFilledAreas.length > 0) {
            const colors = new Set(adjacentFilledAreas.map(a => a.color));
            // 如果所有相邻的已填充国家都使用相同颜色，则不显示标签
            if (colors.size === 1 && adjacentFilledAreas.length > 1) {
                shouldSkip = true;
            }
        }
        
        if (!shouldSkip) {
            // 获取自定义标签位置偏移（如果有）
            // 如果有偏移，直接应用到坐标上
            const labelPosition = appState.labelPositions[adjCountry.isoCode];
            let finalCenter = adjCountry.center;
            
            if (labelPosition && Array.isArray(labelPosition.offset) && labelPosition.offset.length === 2) {
                const offsetX = typeof labelPosition.offset[0] === 'number' ? labelPosition.offset[0] : 0;
                const offsetY = typeof labelPosition.offset[1] === 'number' ? labelPosition.offset[1] : 0;
                
                // 将像素偏移转换为地理坐标偏移
                if (appState.map && (offsetX !== 0 || offsetY !== 0)) {
                    try {
                        const originalPoint = appState.map.project(adjCountry.center);
                        const newPoint = {
                            x: originalPoint.x + offsetX,
                            y: originalPoint.y + offsetY
                        };
                        const newCoordinates = appState.map.unproject([newPoint.x, newPoint.y]);
                        finalCenter = [newCoordinates.lng, newCoordinates.lat];
                    } catch (error) {
                        console.warn('⚠️ 无法转换偏移量到坐标:', error);
                    }
                }
            }
            
            // 尝试对齐到 Mapbox 英文标签位置
            let textAnchor = 'center';
            let textOffset = [0, 0];
            
            try {
                const labelLayers = ['country-label', 'place-label', 'place-country-label'];
                const centerPoint = appState.map.project(adjCountry.center);
                const mapboxLabels = appState.map.queryRenderedFeatures(
                    centerPoint,
                    {
                        layers: labelLayers,
                        radius: 100
                    }
                );

                if (mapboxLabels.length > 0) {
                    const closestLabel = mapboxLabels[0];
                    const labelCoords = closestLabel.geometry.coordinates;
                    if (labelCoords && labelCoords.length >= 2) {
                        finalCenter = [labelCoords[0], labelCoords[1]];
                        const labelLayer = appState.map.getLayer(closestLabel.layer.id);
                        if (labelLayer && labelLayer.layout) {
                            if (labelLayer.layout['text-anchor']) {
                                textAnchor = labelLayer.layout['text-anchor'];
                            }
                            if (labelLayer.layout['text-offset']) {
                                const offset = labelLayer.layout['text-offset'];
                                if (Array.isArray(offset) && offset.length >= 2) {
                                    textOffset = [offset[0], offset[1]];
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.warn(`⚠️ 查询邻近国家 Mapbox 标签失败: ${error.message}`);
            }
            
            labelFeatures.push({
                type: 'Feature',
                properties: {
                    name: adjCountry.name,
                    areaId: adjCountry.isoCode,
                    areaType: 'country',
                    labelType: 'adjacent', // 邻近国家标签
                    isAdjacent: true, // 标记为邻近国家
                    _originalCenter: adjCountry.center, // 存储原始中心点
                    _textAnchor: textAnchor,
                    _textOffset: textOffset
                },
                geometry: {
                    type: 'Point',
                    coordinates: finalCenter // 使用对齐到 Mapbox 标签或应用偏移后的坐标
                }
            });
        }
    });
    
    if (labelFeatures.length === 0) {
        console.log('📝 [updateCustomChineseLabels] 没有需要显示标签的区域（labelFeatures为空）');
        return;
    }
    
    console.log(`✅ [updateCustomChineseLabels] 准备创建 ${labelFeatures.length} 个中文标签`);
    
    // 添加重叠检测和避免算法：调整所有标签的位置以避免重叠和跨边界
    // 遍历所有标签，检查重叠，如果重叠则调整位置
    for (let i = 0; i < labelFeatures.length; i++) {
        const currentLabel = labelFeatures[i];
        const currentPos = currentLabel.geometry.coordinates;
        const areaId = currentLabel.properties.areaId;
        const labelType = currentLabel.properties.labelType;
        const originalCenter = currentLabel.properties._originalCenter || currentPos;
        
        // 获取已处理的标签（在当前标签之前的标签）
        const existingLabels = labelFeatures.slice(0, i);
        
        // 检查是否与已处理的标签重叠
        if (checkLabelOverlap(currentPos, existingLabels)) {
            // 如果重叠，使用螺旋搜索算法寻找新位置
            const newPos = findNonOverlappingPosition(
                originalCenter,
                existingLabels,
                areaId,
                labelType,
                20
            );
            
            // 如果找到了新位置，更新标签坐标
            if (newPos && newPos !== currentPos) {
                currentLabel.geometry.coordinates = newPos;
                console.log(`📍 调整标签位置避免重叠: ${currentLabel.properties.name} -> [${newPos[0].toFixed(4)}, ${newPos[1].toFixed(4)}]`);
            }
        }
        
        // 检查是否跨越到其他区域边界（即使不重叠也要检查）
        // 只检查已处理的标签（existingLabels）
        if (isPositionCrossingOtherBoundaries(areaId, currentPos, labelType, existingLabels)) {
            // 如果跨边界，使用螺旋搜索算法寻找新位置
            const newPos = findNonOverlappingPosition(
                originalCenter,
                existingLabels,
                areaId,
                labelType,
                20
            );
            
            // 如果找到了新位置，更新标签坐标
            if (newPos && newPos !== currentPos) {
                currentLabel.geometry.coordinates = newPos;
                console.log(`📍 调整标签位置避免跨边界: ${currentLabel.properties.name} -> [${newPos[0].toFixed(4)}, ${newPos[1].toFixed(4)}]`);
            }
        }
    }
    
    try {
        const source = appState.map.getSource('custom-chinese-labels');
        const layer = appState.map.getLayer('custom-chinese-labels');
        const hitAreaLayer = appState.map.getLayer('custom-chinese-labels-hit-area');
        
        // 如果源和图层都存在，只更新数据
        if (source && layer && hitAreaLayer) {
            // 数据源和图层已存在，只更新数据
            source.setData({
                type: 'FeatureCollection',
                features: labelFeatures
            });
            
            // 确保三层格式样式正确应用（可能在更新后被覆盖）
            appState.map.setPaintProperty('custom-chinese-labels', 'text-color', [
                'case',
                ['==', ['get', 'labelType'], 'adjacent'], '#888888',  // 邻近国：灰色
                ['==', ['get', 'labelType'], 'sea'], '#003366',        // 临海：深蓝色
                '#333333'  // 主要国家：深灰色（默认）
            ]);
            appState.map.setPaintProperty('custom-chinese-labels', 'text-halo-color', [
                'case',
                ['==', ['get', 'labelType'], 'adjacent'], 'transparent',  // 邻近国：无框
                ['==', ['get', 'labelType'], 'sea'], 'transparent',      // 临海：无框
                '#ffffff'  // 主要国家：白色光晕（有框）
            ]);
            appState.map.setPaintProperty('custom-chinese-labels', 'text-halo-width', [
                'case',
                ['==', ['get', 'labelType'], 'adjacent'], 0,  // 邻近国：无框
                ['==', ['get', 'labelType'], 'sea'], 0,       // 临海：无框
                2  // 主要国家：有框
            ]);
            appState.map.setPaintProperty('custom-chinese-labels', 'text-halo-blur', [
                'case',
                ['==', ['get', 'labelType'], 'adjacent'], 0,
                ['==', ['get', 'labelType'], 'sea'], 0,
                1
            ]);
            
            // 确保 updateLabelHighlight 被调用以应用正确的样式（如果标签被选中，保持选中状态；否则使用三层格式）
            // 注意：updateLabelHighlight 函数在 setupLabelDragging 中定义，需要从那里调用
            // 但由于我们在更新数据，应该重置选择状态以确保三层格式正确显示
            const selectState = appState.labelSelectState;
            if (selectState && selectState.selectedLabelId) {
                // 如果之前有选中的标签，检查它是否还在新数据中
                const stillExists = labelFeatures.some(f => f.properties.areaId === selectState.selectedLabelId);
                if (!stillExists) {
                    // 如果选中的标签不在新数据中，取消选择
                    selectState.selectedLabelId = null;
                    selectState.selectedLabelName = null;
                }
            }
            
            // 通过重新设置样式来确保三层格式正确应用
            // 使用 setTimeout 确保 setData 完成后再应用样式
            setTimeout(() => {
                if (appState.map.getLayer('custom-chinese-labels')) {
                    // 如果没有选中的标签，确保使用三层格式
                    if (!selectState || !selectState.selectedLabelId) {
                        appState.map.setPaintProperty('custom-chinese-labels', 'text-color', [
                            'case',
                            ['==', ['get', 'labelType'], 'adjacent'], '#888888',
                            ['==', ['get', 'labelType'], 'sea'], '#003366',
                            '#333333'
                        ]);
                        appState.map.setPaintProperty('custom-chinese-labels', 'text-halo-color', [
                            'case',
                            ['==', ['get', 'labelType'], 'adjacent'], 'transparent',
                            ['==', ['get', 'labelType'], 'sea'], 'transparent',
                            '#ffffff'
                        ]);
                        appState.map.setPaintProperty('custom-chinese-labels', 'text-halo-width', [
                            'case',
                            ['==', ['get', 'labelType'], 'adjacent'], 0,
                            ['==', ['get', 'labelType'], 'sea'], 0,
                            2
                        ]);
                        appState.map.setPaintProperty('custom-chinese-labels', 'text-halo-blur', [
                            'case',
                            ['==', ['get', 'labelType'], 'adjacent'], 0,
                            ['==', ['get', 'labelType'], 'sea'], 0,
                            1
                        ]);
                    }
                }
            }, 0);
            
            console.log(`✅ 已更新 ${labelFeatures.length} 个中文标签（保留三层格式样式）`);
        } else {
            // 数据源或图层不存在，先清理再创建新的
            try {
                if (appState.map.getLayer('custom-chinese-labels-hit-area')) {
                    appState.map.removeLayer('custom-chinese-labels-hit-area');
                }
                if (appState.map.getLayer('custom-chinese-labels')) {
                    appState.map.removeLayer('custom-chinese-labels');
                }
                if (appState.map.getSource('custom-chinese-labels')) {
                    appState.map.removeSource('custom-chinese-labels');
                }
            } catch (cleanupError) {
                // 忽略清理错误
                console.warn('清理旧标签层时出错:', cleanupError);
            }
            
            // 创建新的
        appState.map.addSource('custom-chinese-labels', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: labelFeatures
            }
        });
        
        // 添加一个不可见的点层用于捕获点击事件（用于拖拽）
        // 必须在标签层之前添加，使用 circle 类型
        appState.map.addLayer({
            id: 'custom-chinese-labels-hit-area',
            type: 'circle',
            source: 'custom-chinese-labels',
            paint: {
                'circle-radius': 30, // 点击区域半径（像素），增大以提高可点击性
                'circle-opacity': 0, // 完全透明
                'circle-stroke-width': 0
            }
        });
        
        // 添加标签层（放在所有图层之上）
        // 使用数据驱动的属性来对齐 Mapbox 标签，并应用三层格式样式
        appState.map.addLayer({
            id: 'custom-chinese-labels',
            type: 'symbol',
            source: 'custom-chinese-labels',
            layout: {
                'text-field': '{name}',
                'text-font': ['Noto Sans TC Regular', 'Arial Unicode MS Regular'], // 繁体中文字体
                'text-size': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    3, 10,  // zoom 3 时 10px
                    10, 14  // zoom 10 时 14px
                ],
                'text-anchor': 'center',
                'text-allow-overlap': true, // 允许重叠以便手动调整
                'text-ignore-placement': false
            },
            paint: {
                // 三层格式：主要国家（默认深色有框）/ 邻近国（灰色无框）/ 临海（深蓝无框）
                'text-color': [
                    'case',
                    ['==', ['get', 'labelType'], 'adjacent'], '#888888',  // 邻近国：灰色
                    ['==', ['get', 'labelType'], 'sea'], '#003366',        // 临海：深蓝色
                    '#333333'  // 主要国家：深灰色（默认）
                ],
                'text-halo-color': [
                    'case',
                    ['==', ['get', 'labelType'], 'adjacent'], 'transparent',  // 邻近国：无框
                    ['==', ['get', 'labelType'], 'sea'], 'transparent',      // 临海：无框
                    '#ffffff'  // 主要国家：白色光晕（有框）
                ],
                'text-halo-width': [
                    'case',
                    ['==', ['get', 'labelType'], 'adjacent'], 0,  // 邻近国：无框
                    ['==', ['get', 'labelType'], 'sea'], 0,       // 临海：无框
                    2  // 主要国家：有框
                ],
                'text-halo-blur': [
                    'case',
                    ['==', ['get', 'labelType'], 'adjacent'], 0,
                    ['==', ['get', 'labelType'], 'sea'], 0,
                    1
                ]
            }
        });
        
        // 设置标签拖拽功能
        setupLabelDragging();
        
        console.log(`✅ 已为 ${labelFeatures.length} 个填充区域添加繁中标签`);
        }
    } catch (error) {
        console.error('❌ 创建/更新自定义标签失败:', error);
    }
}

/**
 * 设置标签点击移动功能 - 简化版：点击选择，再点击放置
 * 1. 点击标签选中它（高亮显示）
 * 2. 点击地图任意位置将标签移动到那里
 * 3. 再次点击标签或按 ESC 取消选择
 */
function setupLabelDragging() {
    if (!appState.map) return;
    
    // 初始化选择状态
    if (!appState.labelSelectState) {
        appState.labelSelectState = {
            selectedLabelId: null,
            selectedLabelName: null
        };
    }

    const selectState = appState.labelSelectState;

    // 移除旧的事件监听器
    if (appState.map._labelClickHandler) {
        appState.map.off('click', 'custom-chinese-labels-hit-area', appState.map._labelClickHandler);
    }
    if (appState.map._labelHoverEnterHandler) {
        appState.map.off('mouseenter', 'custom-chinese-labels', appState.map._labelHoverEnterHandler);
    }
    if (appState.map._labelHoverLeaveHandler) {
        appState.map.off('mouseleave', 'custom-chinese-labels', appState.map._labelHoverLeaveHandler);
    }
    if (appState.map._mapClickForLabelHandler) {
        appState.map.off('click', appState.map._mapClickForLabelHandler);
    }

    // 更新标签高亮样式（保持三层格式）
    function updateLabelHighlight() {
        if (!appState.map.getLayer('custom-chinese-labels')) return;

        if (selectState.selectedLabelId) {
            // 高亮选中的标签（基于labelType的三层格式 + 选中状态）
            appState.map.setPaintProperty('custom-chinese-labels', 'text-color', [
                'case',
                ['==', ['get', 'areaId'], selectState.selectedLabelId],
                '#0066CC',  // 选中：蓝色
                // 未选中：根据labelType应用三层格式
                ['==', ['get', 'labelType'], 'adjacent'], '#888888',  // 邻近国：灰色
                ['==', ['get', 'labelType'], 'sea'], '#003366',        // 临海：深蓝色
                '#333333'  // 主要国家：深灰色（默认）
            ]);
            appState.map.setPaintProperty('custom-chinese-labels', 'text-halo-color', [
                'case',
                ['==', ['get', 'areaId'], selectState.selectedLabelId],
                '#FFD700',  // 选中：金色光晕
                // 未选中：根据labelType应用三层格式
                ['==', ['get', 'labelType'], 'adjacent'], 'transparent',  // 邻近国：无框
                ['==', ['get', 'labelType'], 'sea'], 'transparent',      // 临海：无框
                '#ffffff'  // 主要国家：白色光晕（有框）
            ]);
            appState.map.setPaintProperty('custom-chinese-labels', 'text-halo-width', [
                'case',
                ['==', ['get', 'areaId'], selectState.selectedLabelId],
                4,  // 选中：更大光晕
                // 未选中：根据labelType应用三层格式
                ['==', ['get', 'labelType'], 'adjacent'], 0,  // 邻近国：无框
                ['==', ['get', 'labelType'], 'sea'], 0,       // 临海：无框
                2   // 主要国家：有框
            ]);
            appState.map.setPaintProperty('custom-chinese-labels', 'text-halo-blur', [
                'case',
                ['==', ['get', 'areaId'], selectState.selectedLabelId],
                2,  // 选中：更大模糊
                // 未选中：根据labelType应用三层格式
                ['==', ['get', 'labelType'], 'adjacent'], 0,
                ['==', ['get', 'labelType'], 'sea'], 0,
                1   // 主要国家：正常
            ]);
        } else {
            // 恢复默认三层格式样式（使用与初始创建时相同的表达式）
            appState.map.setPaintProperty('custom-chinese-labels', 'text-color', [
                'case',
                ['==', ['get', 'labelType'], 'adjacent'], '#888888',  // 邻近国：灰色
                ['==', ['get', 'labelType'], 'sea'], '#003366',        // 临海：深蓝色
                '#333333'  // 主要国家：深灰色（默认）
            ]);
            appState.map.setPaintProperty('custom-chinese-labels', 'text-halo-color', [
                'case',
                ['==', ['get', 'labelType'], 'adjacent'], 'transparent',  // 邻近国：无框
                ['==', ['get', 'labelType'], 'sea'], 'transparent',      // 临海：无框
                '#ffffff'  // 主要国家：白色光晕（有框）
            ]);
            appState.map.setPaintProperty('custom-chinese-labels', 'text-halo-width', [
                'case',
                ['==', ['get', 'labelType'], 'adjacent'], 0,  // 邻近国：无框
                ['==', ['get', 'labelType'], 'sea'], 0,       // 临海：无框
                2   // 主要国家：有框
            ]);
            appState.map.setPaintProperty('custom-chinese-labels', 'text-halo-blur', [
                'case',
                ['==', ['get', 'labelType'], 'adjacent'], 0,
                ['==', ['get', 'labelType'], 'sea'], 0,
                1
            ]);
        }
    }

    // 取消选择
    function deselectLabel() {
        if (selectState.selectedLabelId) {
            console.log(`🔘 取消选择标签: ${selectState.selectedLabelName}`);
            selectState.selectedLabelId = null;
            selectState.selectedLabelName = null;
            updateLabelHighlight();

            // 恢复鼠标样式
            const canvas = appState.map.getCanvas();
            if (canvas) canvas.style.cursor = '';
        }
    }

    // 移动标签到新位置
    function moveLabelTo(lngLat) {
        if (!selectState.selectedLabelId) return;

        const source = appState.map.getSource('custom-chinese-labels');
        if (!source || !source._data) return;

        const feature = source._data.features.find(f => f.properties.areaId === selectState.selectedLabelId);
        if (!feature) return;
        
        const areaId = feature.properties.areaId;
        const labelType = feature.properties.labelType || 'main';
        const coordinates = [lngLat.lng, lngLat.lat];
        
        // 获取所有标签数据（用于跨边界检查）
        const allLabels = source._data.features || [];
        
        // 边界检查 1：是否在对应区域的边界内
        if (!isLabelPositionWithinArea(areaId, coordinates, labelType)) {
            showToast('标签不能移动到该位置（超出区域边界）', 'error', 3000);
            return; // 拒绝移动
        }
        
        // 边界检查 2：是否跨越到其他区域
        if (isPositionCrossingOtherBoundaries(areaId, coordinates, labelType, allLabels)) {
            showToast('标签不能跨越到其他区域', 'error', 3000);
            return; // 拒绝移动
        }

        // 保存原始中心点（如果还没有）
        if (!feature.properties._originalCenter) {
            feature.properties._originalCenter = [...feature.geometry.coordinates];
        }

        const originalCenter = feature.properties._originalCenter;

        // 计算新的偏移量（像素）
        const originalPoint = appState.map.project(originalCenter);
        const newPoint = appState.map.project([lngLat.lng, lngLat.lat]);
                const newOffset = [
            newPoint.x - originalPoint.x,
            newPoint.y - originalPoint.y
        ];

        // 更新坐标
        feature.geometry.coordinates = [lngLat.lng, lngLat.lat];

        // 更新数据源
        source.setData(source._data);

        // 保存偏移量
        appState.labelPositions[selectState.selectedLabelId] = {
            offset: newOffset
        };

        showToast('标签已移动到新位置', 'success');
        console.log(`✅ 已将标签 "${selectState.selectedLabelName}" 移动到新位置`);

        // 取消选择
        deselectLabel();
    }

    // 标签点击处理器
    const onLabelClick = (e) => {
        e.preventDefault();

        const feature = e.features && e.features[0];
        if (!feature || !feature.properties || !feature.properties.areaId) return;

        const areaId = feature.properties.areaId;
        const labelName = feature.properties.name || areaId;

        // 如果点击的是已选中的标签，取消选择
        if (selectState.selectedLabelId === areaId) {
            deselectLabel();
                    return;
                }
                
        // 选择新标签
        selectState.selectedLabelId = areaId;
        selectState.selectedLabelName = labelName;
        updateLabelHighlight();

        showToast('已选择标签，点击地图任意位置移动它（按 ESC 取消）', 'info', 3000);
        console.log(`🔵 已选择标签: ${labelName} - 点击地图任意位置移动它，或再次点击取消`);

        // 改变鼠标样式
        const canvas = appState.map.getCanvas();
        if (canvas) canvas.style.cursor = 'crosshair';
    };

    // 地图点击处理器（用于放置标签）
    const onMapClick = (e) => {
        if (!selectState.selectedLabelId) return;

        // 检查是否点击了标签（让标签点击处理器处理）
        const labelFeatures = appState.map.queryRenderedFeatures(e.point, {
            layers: ['custom-chinese-labels-hit-area']
        });
        if (labelFeatures.length > 0) return;

        // 阻止事件继续传播，避免触发填色 popup
        if (e.originalEvent) {
            e.originalEvent.stopImmediatePropagation();
            e.originalEvent.preventDefault();
        }
        
        // 标记正在移动标签，防止 handleMapClick 触发
        appState._isMovingLabel = true;
        setTimeout(() => {
            appState._isMovingLabel = false;
        }, 100);

        // 移动标签到点击位置
        moveLabelTo(e.lngLat);
    };

    // 悬停效果
    const onMouseEnter = (e) => {
        if (selectState.selectedLabelId) return; // 已选择时不改变样式

        const canvas = appState.map.getCanvas();
        if (canvas) canvas.style.cursor = 'pointer';

        const feature = e.features && e.features[0];
        if (feature && feature.properties) {
            const areaId = feature.properties.areaId;
            // 悬停高亮（保持三层格式，只增加光晕宽度）
            appState.map.setPaintProperty('custom-chinese-labels', 'text-halo-width', [
                'case',
                ['==', ['get', 'areaId'], areaId],
                3,  // 悬停：更大光晕
                // 其他：根据labelType应用三层格式
                ['==', ['get', 'labelType'], 'adjacent'], 0,  // 邻近国：无框
                ['==', ['get', 'labelType'], 'sea'], 0,       // 临海：无框
                2   // 主要国家：有框
            ]);
        }
    };

    const onMouseLeave = () => {
        if (selectState.selectedLabelId) return; // 已选择时不改变样式

        const canvas = appState.map.getCanvas();
        if (canvas) canvas.style.cursor = '';

        // 恢复默认三层格式样式
        appState.map.setPaintProperty('custom-chinese-labels', 'text-halo-width', [
            'case',
            ['==', ['get', 'labelType'], 'adjacent'], 0,  // 邻近国：无框
            ['==', ['get', 'labelType'], 'sea'], 0,       // 临海：无框
            2   // 主要国家：有框
        ]);
    };

    // 删除标签功能
    function deleteLabel(labelId) {
        const source = appState.map.getSource('custom-chinese-labels');
        if (!source || !source._data) return false;

        const index = source._data.features.findIndex(f => f.properties.areaId === labelId);
        if (index === -1) return false;

        const labelName = source._data.features[index].properties.name || labelId;
        source._data.features.splice(index, 1);
                    source.setData(source._data);
                    
        // 清除保存的偏移量
        delete appState.labelPositions[labelId];

        console.log(`🗑️ 已删除标签: ${labelName}`);
        return true;
    }

    // ESC 键取消选择，Delete 键删除选中的标签
    const onKeyDown = (e) => {
        if (e.key === 'Escape' && selectState.selectedLabelId) {
            deselectLabel();
        } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectState.selectedLabelId) {
            const labelName = selectState.selectedLabelName;
            const labelId = selectState.selectedLabelId;
            deselectLabel();
            deleteLabel(labelId);
        }
    };

    // 右键点击删除标签
    const onRightClick = (e) => {
        e.preventDefault();

        const feature = e.features && e.features[0];
        if (!feature || !feature.properties || !feature.properties.areaId) return;

        const areaId = feature.properties.areaId;
        const labelName = feature.properties.name || areaId;

        // 确认删除
        if (confirm(`确定要删除标签 "${labelName}" 吗？`)) {
            deleteLabel(areaId);
            // 如果删除的是当前选中的标签，取消选择
            if (selectState.selectedLabelId === areaId) {
                selectState.selectedLabelId = null;
                selectState.selectedLabelName = null;
                updateLabelHighlight();
            }
        }
    };

    // 注册事件
    appState.map.on('click', 'custom-chinese-labels-hit-area', onLabelClick);
    appState.map.on('contextmenu', 'custom-chinese-labels-hit-area', onRightClick);
    appState.map.on('click', onMapClick);
    appState.map.on('mouseenter', 'custom-chinese-labels', onMouseEnter);
    appState.map.on('mouseleave', 'custom-chinese-labels', onMouseLeave);
    document.addEventListener('keydown', onKeyDown);

    // 保存引用
    appState.map._labelClickHandler = onLabelClick;
    appState.map._labelRightClickHandler = onRightClick;
    appState.map._mapClickForLabelHandler = onMapClick;
    appState.map._labelHoverEnterHandler = onMouseEnter;
    appState.map._labelHoverLeaveHandler = onMouseLeave;
    appState.map._labelKeyHandler = onKeyDown;

    console.log('✅ 中文标签功能已设置（点击移动，右键/Delete删除）');
}

/**
 * Setup map text label tool
 * Allows users to add text labels by clicking on the map
 */
function setupMapTextTool() {
    if (!appState.map) return;
    
    // Initialize text labels source and layer if not exists
    if (!appState.map.getSource('map-text-labels')) {
        appState.map.addSource('map-text-labels', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });
        
        // Add hit-area layer for dragging (circle layer) - add to top
        appState.map.addLayer({
            id: 'map-text-labels-hit-area',
            type: 'circle',
            source: 'map-text-labels',
            paint: {
                'circle-radius': 30, // Increase radius for easier clicking
                'circle-opacity': 0,
                'circle-stroke-width': 0
            }
        });
        
        // Add text label layer - add to top
        appState.map.addLayer({
            id: 'map-text-labels',
            type: 'symbol',
            source: 'map-text-labels',
            layout: {
                'text-field': ['get', 'text'],
                'text-font': ['Noto Sans TC Regular', 'Arial Unicode MS Regular'],
                'text-size': ['get', 'fontSize'],
                'text-anchor': 'center',
                'text-allow-overlap': true,
                'text-ignore-placement': true // Allow overlap to ensure visibility
            },
            paint: {
                'text-color': ['get', 'color'],
                'text-halo-color': '#ffffff',
                'text-halo-width': 2,
                'text-halo-blur': 1
            }
        });
        
        // Ensure text label layers are at the top (move to end = topmost)
        try {
            // Move hit-area to top (should be above text for click detection)
            appState.map.moveLayer('map-text-labels-hit-area');
            // Move text layer to top
            appState.map.moveLayer('map-text-labels');
            console.log('✅ 文字标签层已移至最上层');
        } catch (error) {
            console.warn('⚠️ 移动文字标签层到顶层时出错:', error);
        }
    } else {
        // If layers already exist, ensure they are at the top
        try {
            if (appState.map.getLayer('map-text-labels-hit-area')) {
                appState.map.moveLayer('map-text-labels-hit-area');
            }
            if (appState.map.getLayer('map-text-labels')) {
                appState.map.moveLayer('map-text-labels');
            }
            console.log('✅ 文字标签层已在最上层');
        } catch (error) {
            console.warn('⚠️ 确保文字标签层在顶层时出错:', error);
        }
    }
    
    // Update text labels on map
    updateMapTextLabels();
    
    // Setup text label dragging (only once, check if handlers already exist)
    if (!appState.map._textLabelDragHandlers) {
        setupMapTextLabelDragging();
    }
}

/**
 * Update text labels on map from appState.mapTextLabels
 */
function updateMapTextLabels() {
    if (!appState.map || !appState.map.getSource('map-text-labels')) return;
    
    const features = appState.mapTextLabels.map(label => ({
        type: 'Feature',
        properties: {
            id: label.id,
            text: label.text,
            fontSize: label.fontSize || 16,
            color: label.color || '#000000',
            align: label.align || 'center'
        },
        geometry: {
            type: 'Point',
            coordinates: label.coordinates
        }
    }));
    
    const source = appState.map.getSource('map-text-labels');
    source.setData({
        type: 'FeatureCollection',
        features: features
    });
    
    // Ensure text label layers stay at the top after update
    try {
        if (appState.map.getLayer('map-text-labels-hit-area')) {
            appState.map.moveLayer('map-text-labels-hit-area');
        }
        if (appState.map.getLayer('map-text-labels')) {
            appState.map.moveLayer('map-text-labels');
        }
    } catch (error) {
        // Silently fail - layer might not exist yet or moveLayer might fail
    }
}

/**
 * Add text label to map
 */
function addMapTextLabel(coordinates, text) {
    if (!coordinates || !text || !text.trim()) return;
    
    const labelId = 'text_' + Date.now();
    appState.mapTextLabels.push({
        id: labelId,
        text: text.trim(),
        coordinates: coordinates,
        fontSize: 16,
        color: '#000000',
        align: 'center'
    });
    
    updateMapTextLabels();
    return labelId;
}

/**
 * Remove text label from map
 */
function removeMapTextLabel(labelId) {
    appState.mapTextLabels = appState.mapTextLabels.filter(label => label.id !== labelId);
    updateMapTextLabels();
}

/**
 * Setup text label dragging functionality
 */
function setupMapTextLabelDragging() {
    if (!appState.map) return;
    
    // Check if layer exists
    try {
        if (!appState.map.getLayer('map-text-labels-hit-area')) {
            console.warn('⚠️ map-text-labels-hit-area layer not found, skipping drag setup');
            return;
        }
    } catch (error) {
        console.warn('⚠️ Error checking for map-text-labels-hit-area layer:', error);
        return;
    }
    
    // Use appState to store drag state (persistent across function calls)
    if (!appState.textLabelDragState) {
        appState.textLabelDragState = {
            isDragging: false,
            draggedLabelId: null,
            dragStartPoint: null,
            dragStartCoordinates: null
        };
    }
    
    const dragState = appState.textLabelDragState;
    
    // Remove old event listeners if exist
    if (appState.map._textLabelDragDOMHandlers) {
        try {
            const mapCanvas = appState.map.getCanvasContainer();
            if (mapCanvas) {
                mapCanvas.removeEventListener('mousedown', appState.map._textLabelDragDOMHandlers.mousedown, true);
                mapCanvas.removeEventListener('mousemove', appState.map._textLabelDragDOMHandlers.mousemove, true);
                mapCanvas.removeEventListener('mouseup', appState.map._textLabelDragDOMHandlers.mouseup, true);
            }
        } catch (e) {
            console.warn('⚠️ Error removing old DOM event handlers:', e);
        }
        delete appState.map._textLabelDragDOMHandlers;
    }
    
    if (appState.map._textLabelDragHandlers) {
        try {
            appState.map.off('mouseenter', 'map-text-labels-hit-area', appState.map._textLabelDragHandlers.mouseenter);
            appState.map.off('mouseleave', 'map-text-labels-hit-area', appState.map._textLabelDragHandlers.mouseleave);
        } catch (e) {
            console.warn('⚠️ Error removing old Mapbox event handlers:', e);
        }
    }
    
    // Create event handlers
    const handlers = {
        mousedown: (e) => {
            // 注意：事件已经在 DOM 处理器中被检测和阻止传播
            // DOM 处理器已经确认这是文字标签点击，这里直接处理拖曳逻辑
            try {
                if (!appState.map) return;
                
                // 不再重复查询，直接使用 DOM 处理器传递的 feature
                if (e.feature && e.feature.properties && e.feature.properties.id) {
                    const labelId = e.feature.properties.id;

                        // Stop any ongoing map interactions immediately
                        appState.map.stop();
                        
                        // Disable drag pan before Mapbox processes the event
                        if (appState.map.dragPan) {
                            appState.map.dragPan.disable();
                        }
                        
                        // Stop event propagation at DOM level (this is critical)
                        if (e.originalEvent) {
                            e.originalEvent.preventDefault();
                            e.originalEvent.stopPropagation();
                            if (e.originalEvent.stopImmediatePropagation) {
                                e.originalEvent.stopImmediatePropagation();
                            }
                        }
                        
                        dragState.isDragging = true;
                        dragState.draggedLabelId = labelId;
                        dragState.dragStartPoint = e.point;
                        dragState.dragStartCoordinates = [e.lngLat.lng, e.lngLat.lat];
                        
                        // Change cursor
                        const canvas = appState.map.getCanvas();
                        if (canvas) canvas.style.cursor = 'grabbing';
                        
                    console.log(`🖱️ 开始拖拽文字标签: ${e.feature.properties.text || labelId}`);
                }
            } catch (error) {
                console.warn('⚠️ 处理文字标签拖曳失败:', error);
            }
        },
        
        mousemove: (e) => {
            try {
                if (!appState.map || !dragState.isDragging || !dragState.draggedLabelId) return;
                
                // Stop event propagation at DOM level first (before map.stop to prevent map handling)
                if (e.originalEvent) {
                    e.originalEvent.preventDefault();
                    e.originalEvent.stopPropagation();
                    if (e.originalEvent.stopImmediatePropagation) {
                        e.originalEvent.stopImmediatePropagation();
                    }
                }
                
                // Keep stopping map to prevent movement during drag
                appState.map.stop();
                
                // Ensure dragPan is disabled
                if (appState.map.dragPan) {
                    appState.map.dragPan.disable();
                }
                
                // Update label coordinates directly
                const label = appState.mapTextLabels.find(l => l.id === dragState.draggedLabelId);
                if (label) {
                    label.coordinates = [e.lngLat.lng, e.lngLat.lat];
                    updateMapTextLabels();
                }
            } catch (error) {
                console.warn('⚠️ 拖拽文字标签失败:', error);
            }
        },
        
        mouseup: (e) => {
            try {
                if (!appState.map || !dragState.isDragging) return;
                
                // Stop event propagation at DOM level first
                if (e.originalEvent) {
                    e.originalEvent.preventDefault();
                    e.originalEvent.stopPropagation();
                    if (e.originalEvent.stopImmediatePropagation) {
                        e.originalEvent.stopImmediatePropagation();
                    }
                }
                
                // Stop map movement
                appState.map.stop();
                
                // Re-enable drag pan
                if (appState.map.dragPan) {
                    appState.map.dragPan.enable();
                }
                
                console.log(`🖱️ 结束拖拽文字标签: ${dragState.draggedLabelId}`);
                dragState.isDragging = false;
                dragState.draggedLabelId = null;
                dragState.dragStartPoint = null;
                dragState.dragStartCoordinates = null;
                
                // Restore cursor
                const canvas = appState.map.getCanvas();
                if (canvas) canvas.style.cursor = appState.textMode ? 'crosshair' : '';
            } catch (error) {
                console.warn('⚠️ 结束拖拽文字标签失败:', error);
                // Reset drag state on error
                dragState.isDragging = false;
                dragState.draggedLabelId = null;
                
                // Ensure map drag is re-enabled
                if (appState.map && appState.map.dragPan) {
                    appState.map.dragPan.enable();
                }
            }
        },
        
        mouseenter: () => {
            try {
                if (!appState.map || dragState.isDragging) return;
                const canvas = appState.map.getCanvas();
                if (canvas) canvas.style.cursor = 'grab';
            } catch (error) {
                console.warn('⚠️ mouseenter 处理失败:', error);
            }
        },
        
        mouseleave: () => {
            try {
                if (!appState.map || dragState.isDragging) return;
                const canvas = appState.map.getCanvas();
                if (canvas) canvas.style.cursor = appState.textMode ? 'crosshair' : '';
            } catch (error) {
                console.warn('⚠️ mouseleave 处理失败:', error);
            }
        }
    };
    
    // Save handlers reference
    appState.map._textLabelDragHandlers = handlers;
    
    // Get map canvas element for DOM event listeners
    const mapCanvas = appState.map.getCanvasContainer();
    if (!mapCanvas) {
        console.error('❌ 无法获取地图 canvas 容器');
        return;
    }
    
    // Wrapper functions to convert DOM events to Mapbox-style events
    // 关键：在捕获阶段立即检测并阻止事件，防止 Mapbox 处理
    const domMousedownHandler = (domEvent) => {
        try {
            // 检查地图是否已加载
            if (!appState.map || !appState.map.loaded() || !appState.map.isStyleLoaded()) {
                return; // 地图未加载，忽略事件
            }

        const rect = mapCanvas.getBoundingClientRect();
            const pointX = domEvent.clientX - rect.left;
            const pointY = domEvent.clientY - rect.top;

            // 立即检测是否是文字标签点击（在阻止事件之前）
            // Mapbox queryRenderedFeatures 接受 [x, y] 数组格式
            let features = [];
            try {
                // 确保坐标是有效数字
                if (typeof pointX === 'number' && typeof pointY === 'number' &&
                    !isNaN(pointX) && !isNaN(pointY) &&
                    isFinite(pointX) && isFinite(pointY)) {
                    // 使用数组格式 [x, y]
                    features = appState.map.queryRenderedFeatures([pointX, pointY], {
                        layers: ['map-text-labels-hit-area']
                    });
                } else {
                    return; // 无效坐标，忽略
                }
            } catch (error) {
                // 如果查询失败（可能是地图未完全加载），静默失败
                // 不输出警告，避免控制台噪音
                return;
            }

            if (features.length > 0) {
                const feature = features[0];
                console.log('🔒 检测到文字标签点击，阻止事件传播');

                // 立即阻止事件传播，防止 Mapbox 处理
                domEvent.preventDefault();
                domEvent.stopPropagation();
                if (domEvent.stopImmediatePropagation) {
                    domEvent.stopImmediatePropagation();
                }

                // 立即停止地图交互
                appState.map.stop();
                if (appState.map.dragPan) {
                    appState.map.dragPan.disable();
                    console.log('🔒 已禁用地图拖曳');
                }

                // 创建 point 对象用于后续处理
                const point = { x: pointX, y: pointY };
                const lngLat = appState.map.unproject([pointX, pointY]);
        const mapboxEvent = {
            point: point,
            lngLat: lngLat,
            originalEvent: domEvent,
                    feature: feature, // 传递 feature 避免重复查询
            preventDefault: () => domEvent.preventDefault(),
            stopPropagation: () => domEvent.stopPropagation()
        };
        
        handlers.mousedown(mapboxEvent);
            }
        } catch (error) {
            console.warn('⚠️ DOM mousedown 处理失败:', error);
        }
    };
    
    const domMousemoveHandler = (domEvent) => {
        try {
            // 检查地图是否已加载
            if (!appState.map || !appState.map.loaded() || !appState.map.isStyleLoaded()) {
                return; // 地图未加载，忽略事件
            }

        const rect = mapCanvas.getBoundingClientRect();
            const pointX = domEvent.clientX - rect.left;
            const pointY = domEvent.clientY - rect.top;
            const point = { x: pointX, y: pointY };
            const lngLat = appState.map.unproject([pointX, pointY]);
        
        const mapboxEvent = {
            point: point,
            lngLat: lngLat,
            originalEvent: domEvent,
            preventDefault: () => domEvent.preventDefault(),
            stopPropagation: () => domEvent.stopPropagation()
        };
        
        handlers.mousemove(mapboxEvent);
        } catch (error) {
            // 静默失败，避免控制台噪音
        }
    };
    
    const domMouseupHandler = (domEvent) => {
        try {
            // 检查地图是否已加载
            if (!appState.map || !appState.map.loaded() || !appState.map.isStyleLoaded()) {
                return; // 地图未加载，忽略事件
            }

        const rect = mapCanvas.getBoundingClientRect();
            const pointX = domEvent.clientX - rect.left;
            const pointY = domEvent.clientY - rect.top;
            const point = { x: pointX, y: pointY };
            const lngLat = appState.map.unproject([pointX, pointY]);
        
        const mapboxEvent = {
            point: point,
            lngLat: lngLat,
            originalEvent: domEvent,
            preventDefault: () => domEvent.preventDefault(),
            stopPropagation: () => domEvent.stopPropagation()
        };
        
        handlers.mouseup(mapboxEvent);
        } catch (error) {
            // 静默失败，避免控制台噪音
        }
    };
    
    // Store DOM handlers for cleanup
    appState.map._textLabelDragDOMHandlers = {
        mousedown: domMousedownHandler,
        mousemove: domMousemoveHandler,
        mouseup: domMouseupHandler
    };
    
    // Add DOM event listeners (these work even when map.stop() is called)
    try {
        // Use capture phase to ensure we get events before Mapbox
        // 使用 { passive: false } 确保 preventDefault 生效
        mapCanvas.addEventListener('mousedown', domMousedownHandler, { capture: true, passive: false });
        mapCanvas.addEventListener('mousemove', domMousemoveHandler, { capture: true, passive: false });
        mapCanvas.addEventListener('mouseup', domMouseupHandler, { capture: true, passive: false });
        
        // Still use Mapbox events for mouseenter/mouseleave on layer
        appState.map.on('mouseenter', 'map-text-labels-hit-area', handlers.mouseenter);
        appState.map.on('mouseleave', 'map-text-labels-hit-area', handlers.mouseleave);
        
        console.log('✅ 文字标签拖拽功能已设置（使用 DOM 事件）');
    } catch (error) {
        console.error('❌ 设置文字标签拖拽功能失败:', error);
    }
}

/**
 * 移除自定义繁中标签
 */
function removeCustomChineseLabels() {
    if (!appState.map) return;
    
    try {
        // 移除 DOM 事件监听器
        if (appState.map._labelDragDOMHandlers) {
            try {
                const mapCanvas = appState.map.getCanvasContainer();
                if (mapCanvas) {
                    mapCanvas.removeEventListener('mousedown', appState.map._labelDragDOMHandlers.mousedown, true);
                    mapCanvas.removeEventListener('mousemove', appState.map._labelDragDOMHandlers.mousemove, true);
                    mapCanvas.removeEventListener('mouseup', appState.map._labelDragDOMHandlers.mouseup, true);
                }
            } catch (e) {
                console.warn('⚠️ 移除 DOM 事件监听器失败:', e);
            }
            delete appState.map._labelDragDOMHandlers;
        }

        // 移除 Mapbox 事件监听器
        if (appState.map._labelDragHandlers) {
            appState.map.off('mouseenter', 'custom-chinese-labels', appState.map._labelDragHandlers.mouseenter);
            appState.map.off('mouseleave', 'custom-chinese-labels', appState.map._labelDragHandlers.mouseleave);
            delete appState.map._labelDragHandlers;
        }

        // 确保地图拖曳被重新启用（如果之前被禁用）
        if (appState.map.dragPan) {
            appState.map.dragPan.enable();
        }
        
        const hitAreaLayer = appState.map.getLayer('custom-chinese-labels-hit-area');
        if (hitAreaLayer) {
            appState.map.removeLayer('custom-chinese-labels-hit-area');
        }
        
        const labelLayer = appState.map.getLayer('custom-chinese-labels');
        if (labelLayer) {
            appState.map.removeLayer('custom-chinese-labels');
        }
        
        const labelSource = appState.map.getSource('custom-chinese-labels');
        if (labelSource) {
            appState.map.removeSource('custom-chinese-labels');
        }
    } catch (error) {
        // 忽略错误（可能图层或源不存在）
    }
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
function showToast(message, type = 'info', duration = 3000) {
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
    
    // Auto remove after specified duration (default 3 seconds)
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
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

/**
 * Parse coordinate string and return {lng, lat}
 * Automatically detects format: "lat,lng" or "lng,lat"
 */
function parseCoordinates(coordString) {
    if (!coordString || typeof coordString !== 'string') {
        return null;
    }
    
    // Clean up the string
    const cleaned = coordString.trim().replace(/\s+/g, '');
    
    // Split by comma
    const parts = cleaned.split(',');
    if (parts.length !== 2) {
        return null;
    }
    
    const num1 = parseFloat(parts[0]);
    const num2 = parseFloat(parts[1]);
    
    if (isNaN(num1) || isNaN(num2)) {
        return null;
    }
    
    // Auto-detect format based on value ranges
    // Latitude is always between -90 and 90
    // Longitude is always between -180 and 180
    let lat, lng;
    
    if (num1 >= -90 && num1 <= 90 && (num2 < -90 || num2 > 90)) {
        // num1 is latitude (in range), num2 is longitude (out of range)
        lat = num1;
        lng = num2;
    } else if (num2 >= -90 && num2 <= 90 && (num1 < -90 || num1 > 90)) {
        // num2 is latitude (in range), num1 is longitude (out of range)
        lng = num1;
        lat = num2;
    } else if (num1 >= -90 && num1 <= 90 && num2 >= -180 && num2 <= 180) {
        // Both in valid ranges, assume lat,lng format (most common)
        lat = num1;
        lng = num2;
    } else if (num2 >= -90 && num2 <= 90 && num1 >= -180 && num1 <= 180) {
        // Both in valid ranges, assume lng,lat format
        lng = num1;
        lat = num2;
    } else {
        // Default: assume lat,lng (more common format)
        lat = num1;
        lng = num2;
    }
    
    return { lng: lng, lat: lat };
}

/**
 * Parse and fill coordinates into input fields, then auto-add marker
 */
function parseAndFillCoordinates(coordString) {
    const parsed = parseCoordinates(coordString);
    
    if (!parsed) {
        showToast('Invalid coordinate format. Use: lat,lng or lng,lat', 'error');
        return;
    }
    
    // Fill individual input fields
    const lngInput = document.getElementById('marker-lng-input');
    const latInput = document.getElementById('marker-lat-input');
    
    if (lngInput) lngInput.value = parsed.lng;
    if (latInput) latInput.value = parsed.lat;
    
    // Auto-add marker after a short delay
    setTimeout(() => {
        const name = `Marker (${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)})`;
        addMarker([parsed.lng, parsed.lat], name);
        
        // Clear the paste input
        const coordPaste = document.getElementById('marker-coord-paste');
        if (coordPaste) coordPaste.value = '';
        
        // Clear individual inputs
        if (lngInput) lngInput.value = '';
        if (latInput) latInput.value = '';
    }, 300);
}

/**
 * Check if input looks like coordinates
 */
function looksLikeCoordinates(input) {
    if (!input || typeof input !== 'string') return false;
    
    const cleaned = input.trim().replace(/\s+/g, '');
    
    // Must contain a comma to be coordinates
    if (!cleaned.includes(',')) return false;
    
    const parts = cleaned.split(',');
    if (parts.length !== 2) return false;
    
    const num1 = parseFloat(parts[0]);
    const num2 = parseFloat(parts[1]);
    
    // Both parts must be valid numbers
    if (isNaN(num1) || isNaN(num2)) return false;
    
    // At least one number should be in valid coordinate range
    // Latitude: -90 to 90, Longitude: -180 to 180
    const hasLatRange = (num1 >= -90 && num1 <= 90) || (num2 >= -90 && num2 <= 90);
    const hasLngRange = (num1 >= -180 && num1 <= 180) || (num2 >= -180 && num2 <= 180);
    
    // Both should be in valid ranges to be considered coordinates
    return hasLatRange && hasLngRange;
}

/**
 * Setup Marker Icon Selector - Apple Style with Color Selection
 */
function setupMarkerIconSelector() {
    const selectorContainer = document.getElementById('marker-icon-selector');
    if (!selectorContainer) return;
    
    // Check if Apple colors are available
    if (typeof APPLE_COLORS === 'undefined' || !APPLE_COLORS) {
        selectorContainer.style.display = 'none';
        return;
    }
    
    selectorContainer.innerHTML = '';
    selectorContainer.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap;';
    
    // Create color buttons using Apple color palette
    const colors = Object.keys(APPLE_COLORS);
    colors.forEach(colorKey => {
        const colorBtn = document.createElement('button');
        colorBtn.className = 'marker-color-btn';
        colorBtn.dataset.color = colorKey;
        colorBtn.dataset.colorValue = APPLE_COLORS[colorKey];
        colorBtn.style.cssText = `
            width: 36px;
            height: 36px;
            border: 2px solid transparent;
            border-radius: 6px;
            background: ${APPLE_COLORS[colorKey]};
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        colorBtn.title = colorKey.charAt(0).toUpperCase() + colorKey.slice(1);
        
        // Click handler
        colorBtn.addEventListener('click', function () {
            // Remove selected from all buttons
            document.querySelectorAll('.marker-color-btn').forEach(b => {
                b.classList.remove('selected');
                b.style.borderColor = 'transparent';
                b.style.transform = 'scale(1)';
            });
            
            // Add selected to clicked button
            this.classList.add('selected');
            this.style.borderColor = '#007AFF';
            this.style.borderWidth = '3px';
            this.style.transform = 'scale(1.1)';
            
            // Update current marker color
            appState.currentMarkerColor = APPLE_COLORS[colorKey];
        });
        
        // Hover effects
        colorBtn.addEventListener('mouseenter', function () {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'scale(1.1)';
            }
        });
        
        colorBtn.addEventListener('mouseleave', function () {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'scale(1)';
            }
        });
        
        selectorContainer.appendChild(colorBtn);
    });
    
    // Set default (blue) as selected
    const defaultBtn = selectorContainer.querySelector('[data-color="blue"]');
    if (defaultBtn) {
        defaultBtn.click();
    }
}

/**
 * Setup Marker Shape Selector
 */
function setupMarkerShapeSelector() {
    const selectorContainer = document.getElementById('marker-shape-selector');
    if (!selectorContainer) return;
    
    // Use Material Icons for marker shapes
    const shapes = (typeof MATERIAL_ICON_SHAPES !== 'undefined') ? MATERIAL_ICON_SHAPES : 
                   (typeof APPLE_ICON_SHAPES !== 'undefined') ? APPLE_ICON_SHAPES : {
        pin: { icon: 'place', name: 'Pin' },
        circle: { icon: 'circle', name: 'Circle' },
        square: { icon: 'crop_square', name: 'Square' },
        star: { icon: 'star', name: 'Star' }
    };
    
    selectorContainer.innerHTML = '';
    selectorContainer.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap;';
    
    // Create shape buttons
    Object.keys(shapes).forEach(shapeKey => {
        const shapeBtn = document.createElement('button');
        shapeBtn.className = 'marker-shape-btn';
        shapeBtn.dataset.shape = shapeKey;
        shapeBtn.style.cssText = `
            width: 48px;
            height: 48px;
            border: 2px solid transparent;
            border-radius: 6px;
            background: #f5f5f5;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        `;
        const shapeConfig = shapes[shapeKey];
        const displayName = (typeof shapeConfig === 'object' && shapeConfig.name) ? shapeConfig.name : shapeKey;
        shapeBtn.title = displayName;
        
        // Create shape preview
        const preview = createShapePreview(shapeKey, '#007AFF', 32);
        shapeBtn.appendChild(preview);
        
        // Check if this is the current selected shape
        const isSelected = shapeKey === appState.currentMarkerShape;
        if (isSelected) {
            shapeBtn.classList.add('selected');
            shapeBtn.style.borderColor = '#007AFF';
            shapeBtn.style.borderWidth = '3px';
            shapeBtn.style.backgroundColor = '#E3F2FD';
        }
        
        // Click handler
        shapeBtn.addEventListener('click', function () {
            // Remove selected from all buttons
            document.querySelectorAll('.marker-shape-btn').forEach(b => {
                b.classList.remove('selected');
                b.style.borderColor = 'transparent';
                b.style.borderWidth = '2px';
                b.style.transform = 'scale(1)';
                b.style.backgroundColor = '#f5f5f5';
            });
            
            // Add selected to clicked button
            this.classList.add('selected');
            this.style.borderColor = '#007AFF';
            this.style.borderWidth = '3px';
            this.style.transform = 'scale(1.05)';
            this.style.backgroundColor = '#E3F2FD';
            
            // Update current marker shape
            appState.currentMarkerShape = shapeKey;
        });
        
        // Hover effects
        shapeBtn.addEventListener('mouseenter', function () {
            if (!this.classList.contains('selected')) {
                this.style.backgroundColor = '#e0e0e0';
                this.style.transform = 'scale(1.05)';
            }
        });
        
        shapeBtn.addEventListener('mouseleave', function () {
            if (!this.classList.contains('selected')) {
                this.style.backgroundColor = '#f5f5f5';
                this.style.transform = 'scale(1)';
            }
        });
        
        selectorContainer.appendChild(shapeBtn);
    });
}

/**
 * Create a shape preview element using Material Icons
 */
function createShapePreview(shape, color, size) {
    const el = document.createElement('div');
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.pointerEvents = 'none';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    
    // Check if shape exists in MATERIAL_ICON_SHAPES (now uses SVG files)
    const iconShapes = (typeof MATERIAL_ICON_SHAPES !== 'undefined') ? MATERIAL_ICON_SHAPES : 
                       (typeof APPLE_ICON_SHAPES !== 'undefined') ? APPLE_ICON_SHAPES : {};
    const shapeConfig = iconShapes[shape];
    
    if (shapeConfig && typeof shapeConfig === 'object' && shapeConfig.svgPath) {
        // Check if we have a cached SVG template
        if (!window._svgIconCache) {
            window._svgIconCache = {};
        }
        
        // Try to load from cache first
        const cacheKey = shapeConfig.svgPath;
        let svgTemplate = window._svgIconCache[cacheKey];
        
        if (svgTemplate) {
            // Use cached template
            let svgString = svgTemplate.replace(/fill="#e3e3e3"/gi, `fill="${color}"`);
            svgString = svgString.replace(/#e3e3e3/gi, color);
            const svgEl = document.createElement('div');
            svgEl.innerHTML = svgString;
            const svg = svgEl.querySelector('svg');
            if (svg) {
                svg.style.width = size + 'px';
                svg.style.height = size + 'px';
                svg.style.display = 'block';
            }
            el.appendChild(svgEl.firstChild);
        } else {
            // Load SVG and cache it
        const iconImg = document.createElement('img');
        iconImg.style.width = size + 'px';
        iconImg.style.height = size + 'px';
        iconImg.style.maxWidth = size + 'px';
        iconImg.style.maxHeight = size + 'px';
        iconImg.style.objectFit = 'contain';
        iconImg.style.display = 'block';
        iconImg.style.userSelect = 'none';
        iconImg.style.pointerEvents = 'none';
        iconImg.style.flexShrink = '0';
        
        // Load SVG and replace fill color
        fetch(shapeConfig.svgPath)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response.text();
                })
            .then(svgText => {
                    // Cache the template
                    window._svgIconCache[cacheKey] = svgText;
                    // Replace fill color
                let svgString = svgText.replace(/fill="#e3e3e3"/gi, `fill="${color}"`);
                svgString = svgString.replace(/#e3e3e3/gi, color);
                    // Create inline SVG instead of blob URL
                    const svgEl = document.createElement('div');
                    svgEl.innerHTML = svgString;
                    const svg = svgEl.querySelector('svg');
                    if (svg) {
                        svg.style.width = size + 'px';
                        svg.style.height = size + 'px';
                        svg.style.display = 'block';
                    }
                    el.innerHTML = '';
                    el.appendChild(svgEl.firstChild);
            })
            .catch(err => {
                    // Only log in development mode
                    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                        console.warn('Failed to load SVG icon:', shapeConfig.svgPath, err.message);
                    }
                    // Fallback to CSS-based icon
                    createFallbackShapePreview(el, shape, color, size);
            });
        
        el.appendChild(iconImg);
        }
        
        return el;
    }
    
    // Helper function for fallback
    function createFallbackShapePreview(container, shape, color, size) {
        container.innerHTML = '';
        if (shape === 'pin') {
            container.style.background = `radial-gradient(circle at 50% 50%, ${color} 0%, ${color} 60%, ${adjustBrightness(color, -20)} 100%)`;
            container.style.borderRadius = '50% 50% 50% 0';
            container.style.transform = 'rotate(-45deg)';
        } else if (shape === 'circle') {
            container.style.background = color;
            container.style.borderRadius = '50%';
        } else if (shape === 'square') {
            container.style.background = color;
            container.style.borderRadius = '6px';
        } else {
            container.style.background = color;
            container.style.borderRadius = '50%';
        }
        container.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    }
    
    // Legacy fallback: Helper to adjust color brightness
    const adjustBrightness = (hex, percent) => {
        const num = parseInt(hex.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, Math.max(0, (num >> 16) + amt));
        const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
        const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    };
    
    // Legacy pin shape
    if (shape === 'pin') {
        el.style.background = `radial-gradient(circle at 50% 50%, ${color} 0%, ${color} 60%, ${adjustBrightness(color, -20)} 100%)`;
        el.style.borderRadius = '50% 50% 50% 0';
        el.style.transform = 'rotate(-45deg)';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    } else if (shape === 'circle') {
        el.style.background = color;
        el.style.borderRadius = '50%';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    } else if (shape === 'square') {
        el.style.background = color;
        el.style.borderRadius = '6px';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    } else if (shape === 'star') {
        el.style.background = color;
        el.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    }
    
    return el;
}

/**
 * Create an icon button for the selector
 */
function createIconButton(iconKey, iconConfig) {
    const btn = document.createElement('button');
    btn.className = 'marker-icon-btn';
    btn.dataset.iconKey = iconKey;
    btn.style.cssText = `
        width: 36px;
        height: 36px;
        border: 2px solid transparent;
        border-radius: 4px;
        background: #f5f5f5;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        padding: 0;
    `;
    btn.title = iconConfig.name;
    
    // Create icon preview
    if (typeof createMarkerElement !== 'undefined') {
        const iconEl = createMarkerElement(iconConfig);
        iconEl.style.transform = 'scale(0.5)';
        iconEl.style.pointerEvents = 'none';
        btn.appendChild(iconEl);
    } else {
        // Fallback: simple icon
        const iconSpan = document.createElement('span');
        iconSpan.className = 'material-icons';
        iconSpan.textContent = iconConfig.icon;
        iconSpan.style.color = iconConfig.color;
        iconSpan.style.fontSize = '20px';
        btn.appendChild(iconSpan);
    }
    
    // Click handler
    btn.addEventListener('click', function () {
        // Remove selected class from all buttons
        document.querySelectorAll('.marker-icon-btn').forEach(b => {
            b.classList.remove('selected');
            b.style.borderColor = 'transparent';
            b.style.backgroundColor = '#f5f5f5';
        });
        
        // Add selected class to clicked button
        this.classList.add('selected');
        this.style.borderColor = '#2196F3';
        this.style.backgroundColor = '#E3F2FD';
        
        // Update current marker icon
        appState.currentMarkerIcon = iconKey;
    });
    
    // Hover effects
    btn.addEventListener('mouseenter', function () {
        if (!this.classList.contains('selected')) {
            this.style.backgroundColor = '#e0e0e0';
        }
    });
    
    btn.addEventListener('mouseleave', function () {
        if (!this.classList.contains('selected')) {
            this.style.backgroundColor = '#f5f5f5';
        }
    });
    
    return btn;
}

/**
 * Setup Markers Functionality
 */
function setupMarkers() {
    // Use ElementCache if available, fallback to document.getElementById
    const getElement = (typeof ElementCache !== 'undefined') 
        ? (id) => ElementCache.get(id)
        : document.getElementById.bind(document);
    
    // Setup marker icon selector (colors)
    setupMarkerIconSelector();
    
    // Setup marker shape selector
    setupMarkerShapeSelector();
    
    // Setup marker mode toggle
    const markerModeToggle = getElement('marker-mode-toggle');
    if (markerModeToggle) {
        markerModeToggle.checked = appState.markerMode;
        markerModeToggle.addEventListener('change', function () {
            appState.markerMode = this.checked;
            if (this.checked) {
                showToast('Marker Mode: Click map to add markers', 'info', 2000);
            } else {
                showToast('Area Selection Mode: Click boundaries to select areas', 'info', 2000);
            }
        });
    }
    
    // Setup color picker on add toggle
    const colorPickerToggle = getElement('show-color-picker-on-add');
    if (colorPickerToggle) {
        colorPickerToggle.checked = appState.showColorPickerOnAdd;
        colorPickerToggle.addEventListener('change', function () {
            appState.showColorPickerOnAdd = this.checked;
        });
    }
    
    // Smart search input - handles both coordinates and names
    const smartSearchInput = getElement('marker-smart-search');
    if (!smartSearchInput) return;
    
    const resultsDiv = getElement('marker-search-results');
    
    let pasteTimeout;
    
    // Handle paste event
    smartSearchInput.addEventListener('paste', function (e) {
        clearTimeout(pasteTimeout);
        
        // Wait for paste to complete
        pasteTimeout = setTimeout(() => {
            const text = this.value.trim();
            if (looksLikeCoordinates(text)) {
                // Looks like coordinates - parse and add marker
                const parsed = parseCoordinates(text);
                if (parsed) {
                    const name = `Marker (${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)})`;
                    addMarker([parsed.lng, parsed.lat], name);
                    this.value = '';
                }
            } else if (text.length >= 2 && resultsDiv) {
                // Looks like a name - search for location
                searchLocationForMarker(text, resultsDiv);
            }
        }, 50);
    });
    
    // Handle input event - use debounce for name searches
    if (typeof debounce !== 'undefined') {
        // Use debounce utility for name searches
        const debouncedNameSearch = debounce(function (query) {
            if (!resultsDiv) return;
            
            if (query.length >= 2) {
                resultsDiv.style.display = 'block';
                searchLocationForMarker(query, resultsDiv);
            } else {
                resultsDiv.innerHTML = '';
                resultsDiv.style.display = 'none';
            }
        }, 500);
        
        smartSearchInput.addEventListener('input', function () {
            const query = this.value.trim();
            clearTimeout(pasteTimeout);
            
            if (query.length === 0) {
                if (resultsDiv) {
                    resultsDiv.innerHTML = '';
                    resultsDiv.style.display = 'none';
                }
                return;
            }
            
            // Check if input looks like coordinates
            if (looksLikeCoordinates(query)) {
                // Show coordinate preview immediately (no debounce needed)
                if (resultsDiv) {
                    resultsDiv.style.display = 'block';
                    const parsed = parseCoordinates(query);
                    if (parsed) {
                        resultsDiv.innerHTML = `
                            <div class="search-result-item" style="padding: 12px; border-bottom: 1px solid #e0e0e0; cursor: pointer; background: #f5f5f5;">
                                <div style="font-weight: 500; color: #212121;">
                                    <span class="material-icons" style="font-size: 18px; vertical-align: middle;">location_on</span>
                                    Add marker at ${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)}
                                </div>
                                <div style="font-size: 12px; color: #757575; margin-top: 4px;">
                                    Press Enter to add
                                </div>
                            </div>
                        `;
                        
                        // Add click handler
                        const previewItem = resultsDiv.querySelector('.search-result-item');
                        if (previewItem) {
                            previewItem.addEventListener('click', function () {
                                const name = `Marker (${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)})`;
                                handleMarkerAddition([parsed.lng, parsed.lat], name);
                                smartSearchInput.value = '';
                                resultsDiv.innerHTML = '';
                                resultsDiv.style.display = 'none';
                            });
                        }
                    }
                }
            } else {
                // Use debounced search for names
                debouncedNameSearch(query);
            }
        });
    } else {
        // Fallback to original implementation
        let searchTimeout;
        smartSearchInput.addEventListener('input', function () {
            const query = this.value.trim();
            clearTimeout(searchTimeout);
            clearTimeout(pasteTimeout);
            
            if (query.length === 0) {
                if (resultsDiv) resultsDiv.innerHTML = '';
                return;
            }
            
            // Check if input looks like coordinates
            if (looksLikeCoordinates(query)) {
                // Show coordinate preview
                if (resultsDiv) {
                    resultsDiv.style.display = 'block';
                    const parsed = parseCoordinates(query);
                    if (parsed) {
                        resultsDiv.innerHTML = `
                            <div class="search-result-item" style="padding: 12px; border-bottom: 1px solid #e0e0e0; cursor: pointer; background: #f5f5f5;">
                                <div style="font-weight: 500; color: #212121;">
                                    <span class="material-icons" style="font-size: 18px; vertical-align: middle;">location_on</span>
                                    Add marker at ${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)}
                                </div>
                                <div style="font-size: 12px; color: #757575; margin-top: 4px;">
                                    Press Enter to add
                                </div>
                            </div>
                        `;
                        
                        // Add click handler
                        const previewItem = resultsDiv.querySelector('.search-result-item');
                        if (previewItem) {
                            previewItem.addEventListener('click', function () {
                                const name = `Marker (${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)})`;
                                handleMarkerAddition([parsed.lng, parsed.lat], name);
                                smartSearchInput.value = '';
                                resultsDiv.innerHTML = '';
                                resultsDiv.style.display = 'none';
                            });
                        }
                    }
                }
            } else if (query.length >= 2) {
                // Looks like a name - search for location
                if (resultsDiv) {
                    resultsDiv.style.display = 'block';
                }
                searchTimeout = setTimeout(() => {
                    searchLocationForMarker(query, resultsDiv);
                }, 500);
            } else {
                if (resultsDiv) {
                    resultsDiv.innerHTML = '';
                    resultsDiv.style.display = 'none';
                }
            }
        });
    }
    
    // Handle Enter key
    smartSearchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(pasteTimeout);
            
            const query = this.value.trim();
            if (!query) return;
            
            // Check if it's coordinates
            if (looksLikeCoordinates(query)) {
                const parsed = parseCoordinates(query);
                if (parsed) {
                    const name = `Marker (${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)})`;
                    handleMarkerAddition([parsed.lng, parsed.lat], name);
                    this.value = '';
                    if (resultsDiv) {
                        resultsDiv.innerHTML = '';
                        resultsDiv.style.display = 'none';
                    }
                }
            }
            // For names, user can click on search results
        }
    });
    
    // Clear all markers button
    const clearMarkersBtn = document.getElementById('clear-markers-btn');
    if (clearMarkersBtn) {
        clearMarkersBtn.addEventListener('click', function () {
            clearAllMarkers();
        });
    }
    
    // Update markers list
    updateMarkersList();
}

/**
 * Add a marker to the map
 */
function addMarker(coordinates, name, color = null, shape = 'pin') {
    if (!appState.map) {
        showToast('Map not initialized', 'error');
        return;
    }
    
    const markerId = 'marker-' + Date.now();
    
    // Use provided color or current selected color
    const markerColor = color || appState.currentMarkerColor || '#007AFF';
    const markerShape = shape || appState.currentMarkerShape || 'pin';
    
    // Create Apple-style marker element
    let el;
    if (typeof createAppleMarker !== 'undefined') {
        el = createAppleMarker(markerColor, markerShape, 24);
    } else {
        // Fallback: create simple Apple-style pin
        el = createAppleMarkerFallback(markerColor, markerShape, 24);
    }
    
    // 添加標記類名以便識別
    el.classList.add('apple-marker', 'marker-element');
    el.dataset.markerId = markerId;
    // 設置 pointer-events 確保點擊事件正確處理
    el.style.pointerEvents = 'auto';
    
    // Add click event to marker element (before creating Mapbox marker)
    // 使用捕獲階段來提前攔截事件
    el.addEventListener('mousedown', function (e) {
        e.stopPropagation();
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
    }, true); // 使用捕獲階段
    
    el.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        e.stopImmediatePropagation();
        console.log(`📍 Marker clicked: ${markerId} at [${coordinates[0]}, ${coordinates[1]}]`);
        // Store marker ID for later update
        showMarkerIconPickerPopup(coordinates, { x: e.clientX, y: e.clientY }, markerId);
        return false;
    }, true); // 使用捕獲階段
    
    // Create Mapbox marker
    const marker = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`<strong>${name}</strong><br>${coordinates[0].toFixed(4)}, ${coordinates[1].toFixed(4)}`);
    
    // Get anchor point based on marker shape
    const anchor = (typeof getMarkerAnchor !== 'undefined') 
        ? getMarkerAnchor(markerShape) 
        : 'center';
    
    const mapboxMarker = new mapboxgl.Marker({
        element: el,
        draggable: false,
        anchor: anchor  // Set anchor point for accurate positioning
    })
    .setLngLat(coordinates)
    .setPopup(marker)
    .addTo(appState.map);
    
    // Store marker info
    const markerInfo = {
        id: markerId,
        name: name,
        coordinates: coordinates,
        marker: mapboxMarker,
        popup: marker,
        color: markerColor,
        shape: markerShape,
            baseSize: 24,  // Store base size for scaling
        element: el  // Store element reference for scaling
    };
    
    appState.markers.push(markerInfo);
    
    // Apply initial scale based on current zoom
    if (appState.map) {
        updateMarkersScale();
    }
    
    // Update UI
    updateMarkersList();
    
    // Fly to marker location
    appState.map.flyTo({
        center: coordinates,
        zoom: Math.max(appState.map.getZoom(), 8),
        duration: 1000
    });
    
    showToast(`Marker "${name}" added`, 'success');
    
    return markerId;
}

/**
 * Fallback function to create Apple-style marker if createAppleMarker is not available
 */
function createAppleMarkerFallback(color = '#007AFF', shape = 'pin', size = 24) {
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
    
    // Helper to darken color
    const darkenColor = (hex, percent) => {
        const num = parseInt(hex.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, Math.max(0, (num >> 16) + amt));
        const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
        const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    };
    
    // Apple-style pin shape
    if (shape === 'pin') {
        el.style.background = `radial-gradient(circle at 50% 50%, ${color} 0%, ${color} 60%, ${darkenColor(color, -20)} 100%)`;
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
 * Show marker icon picker popup
 */
function showMarkerIconPickerPopup(coordinates, point, markerId) {
    const popup = document.getElementById('marker-icon-picker-popup');
    if (!popup) return;
    
    // Store current marker ID being edited
    appState.editingMarkerId = markerId;
    
    // Position popup near click point
    if (point && point.x && point.y) {
        popup.style.left = point.x + 'px';
        popup.style.top = point.y + 'px';
        popup.style.transform = 'translate(-50%, -50%)';
    } else {
        popup.style.left = '50%';
        popup.style.top = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
    }
    
    // Get current marker info
    const markerInfo = appState.markers.find(m => m.id === markerId);
    const currentColor = markerInfo ? markerInfo.color : appState.currentMarkerColor;
    const currentShape = markerInfo ? markerInfo.shape : appState.currentMarkerShape;
    
    // Populate color selector
    const colorSelectorContainer = popup.querySelector('#marker-edit-color-selector');
    if (!colorSelectorContainer) return;
    
    colorSelectorContainer.innerHTML = '';
    colorSelectorContainer.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0;';
    
    // Check if Apple colors are available
    const colors = (typeof APPLE_COLORS !== 'undefined') ? APPLE_COLORS : {
        red: '#FF3B30',
        orange: '#FF9500',
        yellow: '#FFCC00',
        green: '#34C759',
        teal: '#5AC8FA',
        blue: '#007AFF',
        indigo: '#5856D6',
        purple: '#AF52DE',
        pink: '#FF2D55',
        gray: '#8E8E93'
    };
    
    let selectedColor = currentColor;
    let selectedShape = currentShape || 'pin';
    
    // Create color buttons
    Object.keys(colors).forEach(colorKey => {
        const colorBtn = document.createElement('button');
        colorBtn.className = 'marker-color-btn';
        colorBtn.dataset.color = colors[colorKey];
        const isSelected = colors[colorKey] === currentColor;
        
        colorBtn.style.cssText = `
            width: 40px;
            height: 40px;
            border: ${isSelected ? '3px solid #007AFF' : '2px solid transparent'};
            border-radius: 6px;
            background: ${colors[colorKey]};
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
        `;
        colorBtn.title = colorKey.charAt(0).toUpperCase() + colorKey.slice(1);
        
        if (isSelected) {
            colorBtn.classList.add('selected');
        }
        
        // Click handler
        colorBtn.addEventListener('click', function () {
            // Remove selected from all buttons
            colorSelectorContainer.querySelectorAll('.marker-color-btn').forEach(b => {
                b.classList.remove('selected');
                b.style.borderColor = 'transparent';
                b.style.borderWidth = '2px';
                b.style.transform = 'scale(1)';
            });
            
            // Add selected to clicked button
            this.classList.add('selected');
            this.style.borderColor = '#007AFF';
            this.style.borderWidth = '3px';
            this.style.transform = 'scale(1.1)';
            
            // Update selected color
            selectedColor = colors[colorKey];
            
            // Update marker immediately
            updateMarkerIcon(markerId, selectedColor, selectedShape);
        });
        
        // Hover effects
        colorBtn.addEventListener('mouseenter', function () {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'scale(1.15)';
            }
        });
        
        colorBtn.addEventListener('mouseleave', function () {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'scale(1)';
            }
        });
        
        colorSelectorContainer.appendChild(colorBtn);
    });
    
    // Populate shape selector
    const shapeSelectorContainer = popup.querySelector('#marker-edit-shape-selector');
    if (shapeSelectorContainer) {
        shapeSelectorContainer.innerHTML = '';
        shapeSelectorContainer.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0;';
        
        const shapes = (typeof MATERIAL_ICON_SHAPES !== 'undefined') ? MATERIAL_ICON_SHAPES : 
                       (typeof APPLE_ICON_SHAPES !== 'undefined') ? APPLE_ICON_SHAPES : {
            pin: { icon: 'place', name: 'Pin' },
            circle: { icon: 'circle', name: 'Circle' },
            square: { icon: 'crop_square', name: 'Square' },
            star: { icon: 'star', name: 'Star' }
        };
        
        // Create shape buttons
        Object.keys(shapes).forEach(shapeKey => {
            const shapeBtn = document.createElement('button');
            shapeBtn.className = 'marker-shape-btn-popup';
            shapeBtn.dataset.shape = shapeKey;
            const isSelected = shapeKey === currentShape;
            
            shapeBtn.style.cssText = `
                width: 48px;
                height: 48px;
                border: ${isSelected ? '3px solid #007AFF' : '2px solid transparent'};
                border-radius: 6px;
                background: #f5f5f5;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            shapeBtn.title = shapeKey.charAt(0).toUpperCase() + shapeKey.slice(1);
            
            // Create shape preview
            const preview = createShapePreview(shapeKey, currentColor, 32);
            shapeBtn.appendChild(preview);
            
            if (isSelected) {
                shapeBtn.classList.add('selected');
                shapeBtn.style.backgroundColor = '#E3F2FD';
            }
            
            // Click handler
            shapeBtn.addEventListener('click', function () {
                // Remove selected from all buttons
                shapeSelectorContainer.querySelectorAll('.marker-shape-btn-popup').forEach(b => {
                    b.classList.remove('selected');
                    b.style.borderColor = 'transparent';
                    b.style.borderWidth = '2px';
                    b.style.transform = 'scale(1)';
                    b.style.backgroundColor = '#f5f5f5';
                });
                
                // Add selected to clicked button
                this.classList.add('selected');
                this.style.borderColor = '#007AFF';
                this.style.borderWidth = '3px';
                this.style.transform = 'scale(1.05)';
                this.style.backgroundColor = '#E3F2FD';
                
                // Update selected shape
                selectedShape = shapeKey;
                
                // Update marker immediately
                updateMarkerIcon(markerId, selectedColor, selectedShape);
            });
            
            // Hover effects
            shapeBtn.addEventListener('mouseenter', function () {
                if (!this.classList.contains('selected')) {
                    this.style.backgroundColor = '#e0e0e0';
                    this.style.transform = 'scale(1.05)';
                }
            });
            
            shapeBtn.addEventListener('mouseleave', function () {
                if (!this.classList.contains('selected')) {
                    this.style.backgroundColor = '#f5f5f5';
                    this.style.transform = 'scale(1)';
                }
            });
            
            shapeSelectorContainer.appendChild(shapeBtn);
        });
    }
    
    // Show popup
    popup.style.display = 'block';
    
    // Close button handler
    const closeBtn = popup.querySelector('#close-marker-picker-btn');
    if (closeBtn) {
        closeBtn.onclick = function () {
            popup.style.display = 'none';
        };
    }
    
    // Close popup when clicking outside
    setTimeout(() => {
        const closeOnOutsideClick = function (e) {
            if (!popup.contains(e.target) && !e.target.closest('.apple-marker')) {
                popup.style.display = 'none';
                document.removeEventListener('click', closeOnOutsideClick);
            }
        };
        document.addEventListener('click', closeOnOutsideClick);
    }, 100);
}

/**
 * Show color picker popup when adding a new marker
 */
function showMarkerColorPickerOnAdd(coordinates, name) {
    const popup = document.getElementById('marker-color-picker-on-add-popup');
    if (!popup) return;
    
    // Store pending marker data
    appState.pendingMarkerData = {
        coordinates: coordinates,
        name: name
    };
    
    // Update location display
    const locationDisplay = popup.querySelector('#marker-add-popup-location');
    if (locationDisplay) {
        locationDisplay.textContent = name;
    }
    
    // Position popup in center of screen
    popup.style.left = '50%';
    popup.style.top = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    
    // Populate color selector
    const selectorContainer = popup.querySelector('#marker-color-selector-on-add');
    if (!selectorContainer) return;
    
    selectorContainer.innerHTML = '';
    selectorContainer.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0;';
    
    // Get Apple colors
    const colors = (typeof APPLE_COLORS !== 'undefined') ? APPLE_COLORS : {
        red: '#FF3B30',
        orange: '#FF9500',
        yellow: '#FFCC00',
        green: '#34C759',
        teal: '#5AC8FA',
        blue: '#007AFF',
        indigo: '#5856D6',
        purple: '#AF52DE',
        pink: '#FF2D55',
        gray: '#8E8E93'
    };
    
    let selectedColor = appState.currentMarkerColor || '#007AFF';
    
    // Create color buttons
    Object.keys(colors).forEach(colorKey => {
        const colorBtn = document.createElement('button');
        colorBtn.className = 'marker-color-btn';
        colorBtn.dataset.color = colors[colorKey];
        const isSelected = colors[colorKey] === selectedColor;
        
        colorBtn.style.cssText = `
            width: 40px;
            height: 40px;
            border: ${isSelected ? '3px solid #007AFF' : '2px solid transparent'};
            border-radius: 6px;
            background: ${colors[colorKey]};
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
        `;
        colorBtn.title = colorKey.charAt(0).toUpperCase() + colorKey.slice(1);
        
        if (isSelected) {
            colorBtn.classList.add('selected');
        }
        
        // Click handler to select color
        colorBtn.addEventListener('click', function () {
            // Remove selected from all buttons
            selectorContainer.querySelectorAll('.marker-color-btn').forEach(b => {
                b.classList.remove('selected');
                b.style.borderColor = 'transparent';
                b.style.borderWidth = '2px';
                b.style.transform = 'scale(1)';
            });
            
            // Add selected to clicked button
            this.classList.add('selected');
            this.style.borderColor = '#007AFF';
            this.style.borderWidth = '3px';
            this.style.transform = 'scale(1.1)';
            
            // Update selected color
            selectedColor = colors[colorKey];
        });
        
        // Hover effects
        colorBtn.addEventListener('mouseenter', function () {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'scale(1.15)';
            }
        });
        
        colorBtn.addEventListener('mouseleave', function () {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'scale(1)';
            }
        });
        
        selectorContainer.appendChild(colorBtn);
    });
    
    // Populate shape selector
    const shapeSelectorContainer = popup.querySelector('#marker-shape-selector-on-add');
    let selectedShape = appState.currentMarkerShape || 'pin';
    
    if (shapeSelectorContainer) {
        shapeSelectorContainer.innerHTML = '';
        shapeSelectorContainer.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0;';
        
        const shapes = (typeof MATERIAL_ICON_SHAPES !== 'undefined') ? MATERIAL_ICON_SHAPES : 
                       (typeof APPLE_ICON_SHAPES !== 'undefined') ? APPLE_ICON_SHAPES : {
            pin: { icon: 'place', name: 'Pin' },
            circle: { icon: 'circle', name: 'Circle' },
            square: { icon: 'crop_square', name: 'Square' },
            star: { icon: 'star', name: 'Star' }
        };
        
        // Create shape buttons
        Object.keys(shapes).forEach(shapeKey => {
            const shapeBtn = document.createElement('button');
            shapeBtn.className = 'marker-shape-btn-popup';
            shapeBtn.dataset.shape = shapeKey;
            const isSelected = shapeKey === selectedShape;
            
            shapeBtn.style.cssText = `
                width: 48px;
                height: 48px;
                border: ${isSelected ? '3px solid #007AFF' : '2px solid transparent'};
                border-radius: 6px;
                background: #f5f5f5;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            shapeBtn.title = shapeKey.charAt(0).toUpperCase() + shapeKey.slice(1);
            
            // Create shape preview
            const preview = createShapePreview(shapeKey, selectedColor, 32);
            shapeBtn.appendChild(preview);
            
            if (isSelected) {
                shapeBtn.classList.add('selected');
                shapeBtn.style.backgroundColor = '#E3F2FD';
            }
            
            // Click handler
            shapeBtn.addEventListener('click', function () {
                // Remove selected from all buttons
                shapeSelectorContainer.querySelectorAll('.marker-shape-btn-popup').forEach(b => {
                    b.classList.remove('selected');
                    b.style.borderColor = 'transparent';
                    b.style.borderWidth = '2px';
                    b.style.transform = 'scale(1)';
                    b.style.backgroundColor = '#f5f5f5';
                });
                
                // Add selected to clicked button
                this.classList.add('selected');
                this.style.borderColor = '#007AFF';
                this.style.borderWidth = '3px';
                this.style.transform = 'scale(1.05)';
                this.style.backgroundColor = '#E3F2FD';
                
                // Update selected shape
                selectedShape = shapeKey;
            });
            
            // Hover effects
            shapeBtn.addEventListener('mouseenter', function () {
                if (!this.classList.contains('selected')) {
                    this.style.backgroundColor = '#e0e0e0';
                    this.style.transform = 'scale(1.05)';
                }
            });
            
            shapeBtn.addEventListener('mouseleave', function () {
                if (!this.classList.contains('selected')) {
                    this.style.backgroundColor = '#f5f5f5';
                    this.style.transform = 'scale(1)';
                }
            });
            
            shapeSelectorContainer.appendChild(shapeBtn);
        });
    }
    
    // Show popup
    popup.style.display = 'block';
    
    // Button handlers - create fresh handlers each time
    const confirmBtn = popup.querySelector('#confirm-add-marker-btn');
    const useDefaultBtn = popup.querySelector('#use-default-color-btn');
    const cancelBtn = popup.querySelector('#cancel-add-marker-btn');
    
    // Helper to create handler
    const createConfirmHandler = () => {
        const handler = function () {
            if (appState.pendingMarkerData) {
                const currentSelectedColor = selectorContainer.querySelector('.marker-color-btn.selected');
                const finalColor = currentSelectedColor ? currentSelectedColor.dataset.color : selectedColor;
                const currentSelectedShape = shapeSelectorContainer ? shapeSelectorContainer.querySelector('.marker-shape-btn-popup.selected') : null;
                const finalShape = currentSelectedShape ? currentSelectedShape.dataset.shape : selectedShape;
                addMarker(
                    appState.pendingMarkerData.coordinates,
                    appState.pendingMarkerData.name,
                    finalColor,
                    finalShape
                );
                popup.style.display = 'none';
                appState.pendingMarkerData = null;
            }
        };
        return handler;
    };
    
    const createUseDefaultHandler = () => {
        const handler = function () {
            if (appState.pendingMarkerData) {
                addMarker(
                    appState.pendingMarkerData.coordinates,
                    appState.pendingMarkerData.name,
                    appState.currentMarkerColor,
                    appState.currentMarkerShape
                );
                popup.style.display = 'none';
                appState.pendingMarkerData = null;
            }
        };
        return handler;
    };
    
    const createCancelHandler = () => {
        const handler = function () {
            popup.style.display = 'none';
            appState.pendingMarkerData = null;
        };
        return handler;
    };
    
    // Remove old listeners and add new ones
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    useDefaultBtn.replaceWith(useDefaultBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    
    // Get new references
    const newConfirmBtn = popup.querySelector('#confirm-add-marker-btn');
    const newUseDefaultBtn = popup.querySelector('#use-default-color-btn');
    const newCancelBtn = popup.querySelector('#cancel-add-marker-btn');
    
    newConfirmBtn.addEventListener('click', createConfirmHandler());
    newUseDefaultBtn.addEventListener('click', createUseDefaultHandler());
    newCancelBtn.addEventListener('click', createCancelHandler());
    
    // Close popup when clicking outside
    setTimeout(() => {
        const closeOnOutsideClick = function (e) {
            if (!popup.contains(e.target) && popup.style.display !== 'none') {
                popup.style.display = 'none';
                appState.pendingMarkerData = null;
                document.removeEventListener('click', closeOnOutsideClick);
            }
        };
        document.addEventListener('click', closeOnOutsideClick);
    }, 100);
}

/**
 * Add marker at clicked location on map
 */
function addMarkerAtLocation(e) {
    const coordinates = [e.lngLat.lng, e.lngLat.lat];
    const name = `Marker (${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)})`;
    
    if (appState.showColorPickerOnAdd) {
        // Show color picker popup
        showMarkerColorPickerOnAdd(coordinates, name);
    } else {
        // Add marker directly with sidebar default color and shape
        addMarker(coordinates, name, appState.currentMarkerColor, appState.currentMarkerShape);
    }
}

/**
 * Handle marker addition - checks if color picker should be shown or add directly
 */
function handleMarkerAddition(coordinates, name) {
    if (appState.showColorPickerOnAdd) {
        // Show color picker popup
        showMarkerColorPickerOnAdd(coordinates, name);
    } else {
        // Add marker directly with sidebar default color and shape
        addMarker(coordinates, name, appState.currentMarkerColor, appState.currentMarkerShape);
    }
}

/**
 * Update markers scale based on map zoom level
 * Scales markers proportionally - smaller when zoomed out, larger when zoomed in
 * Uses actual size changes instead of CSS transform to maintain accurate positioning
 */
function updateMarkersScale() {
    if (!appState || !appState.map || !appState.markers || appState.markers.length === 0) {
        return;
    }
    
    const currentZoom = appState.map.getZoom();
    
    // Base zoom level for normal size (marker size = baseSize)
    // Zoom 10 = 1.0x scale (normal size)
    const baseZoom = 10;
    
    // Calculate scale factor to maintain zoom 10 proportion
    // Scale changes exponentially with zoom level
    // Formula: scale = 2^((currentZoom - baseZoom) / 3)
    // This makes zoom 10 = 1.0x, zoom 7 = 0.5x, zoom 13 = 1.6x
    const scaleFactor = Math.pow(2, (currentZoom - baseZoom) / 3);
    
    // Clamp scale between reasonable bounds (0.15x to 3x)
    const clampedScale = Math.max(0.15, Math.min(3.0, scaleFactor));
    
    // Only log if markers actually changed or on zoomend (reduce log spam)
    // Remove verbose logging during zoom operations
    
    // Update all markers
    let updatedCount = 0;
    appState.markers.forEach(markerInfo => {
        if (!markerInfo.element || !markerInfo.marker) {
            console.warn('⚠️ Marker missing element or marker reference:', markerInfo.id);
            return;
        }
        
        const element = markerInfo.element;
        const shape = markerInfo.shape || 'pin';
        
        // Get base transform (rotation for pin shape)
        let baseTransform = '';
        if (shape === 'pin') {
            baseTransform = 'rotate(-45deg)';
        }
        
        // CRITICAL: Match transform-origin with anchor point to prevent position drift
        // The anchor point determines where Mapbox positions the marker
        // The transform-origin determines where CSS transforms are applied from
        // They must match to prevent position drift during scaling
        let transformOrigin = 'center center';
        const anchor = (typeof getMarkerAnchor !== 'undefined') 
            ? getMarkerAnchor(shape) 
            : 'center';
        
        // Match transform-origin with anchor point
        if (anchor === 'bottom') {
            transformOrigin = 'bottom center'; // Scale from bottom center (the anchor point)
        } else if (anchor === 'center') {
            transformOrigin = 'center center'; // Scale from center (the anchor point)
        } else {
            transformOrigin = 'center center'; // Default
        }
        
        // Store the scale on the element for hover effects
        element.dataset.currentScale = clampedScale;
        
        // CRITICAL FIX: Use direct width/height instead of transform: scale()
        // Transform: scale() causes position drift because Mapbox calculates anchor position
        // based on element size, but CSS transform doesn't change the element's layout size
        const baseSize = markerInfo.baseSize || 24;
        const newSize = baseSize * clampedScale;
        
        // Apply size directly to element (this preserves Mapbox's anchor calculations)
        element.style.width = `${newSize}px`;
        element.style.height = `${newSize}px`;
        
        // Apply rotation transform separately (if needed for pin shape)
        if (baseTransform) {
            element.style.transform = baseTransform;
            element.style.transformOrigin = transformOrigin;
        } else {
            element.style.transform = '';
            element.style.transformOrigin = '';
        }
        
        // CRITICAL: Force marker position update after size change
        // Mapbox needs to recalculate position based on new element size
        const currentCoords = markerInfo.coordinates;
        if (currentCoords && markerInfo.marker) {
            // Use requestAnimationFrame to ensure size changes are applied first
            requestAnimationFrame(() => {
                // Force position recalculation with updated element size
                markerInfo.marker.setLngLat(currentCoords);
            });
        }
        
        // Force repaint to ensure changes are visible
        void element.offsetHeight; // Trigger reflow
        
        updatedCount++;
    });
    
    console.log(`✅ Updated ${updatedCount} markers`);
}

/**
 * Update marker icon/color
 */
function updateMarkerIcon(markerId, color, shape = 'pin') {
    const markerInfo = appState.markers.find(m => m.id === markerId);
    if (!markerInfo || !markerInfo.marker) return;
    
    // Create new marker element
    let newEl;
    if (typeof createAppleMarker !== 'undefined') {
        newEl = createAppleMarker(color, shape, 24);
    } else {
        newEl = createAppleMarkerFallback(color, shape, 24);
    }
    
    // Add click event to new element (same as in addMarker)
    // Use mousedown to prevent map click event from firing
    newEl.addEventListener('mousedown', function (e) {
        e.stopPropagation();
        e.preventDefault();
    });
    
    newEl.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        const markerInfo = appState.markers.find(m => m.id === markerId);
        if (markerInfo && markerInfo.popup) {
            markerInfo.popup.remove();
        }
        console.log(`📍 Marker clicked (after update): ${markerId} at [${markerInfo.coordinates[0]}, ${markerInfo.coordinates[1]}]`);
        showMarkerIconPickerPopup(markerInfo.coordinates, { x: e.clientX, y: e.clientY }, markerId);
    });
    
    // Remove old marker from map
    markerInfo.marker.remove();
    
    // Get anchor point based on marker shape
    const anchor = (typeof getMarkerAnchor !== 'undefined') 
        ? getMarkerAnchor(shape) 
        : 'center';
    
    // Create new marker
    const newMarker = new mapboxgl.Marker({
        element: newEl,
        draggable: false,
        anchor: anchor  // Set anchor point for accurate positioning
    })
    .setLngLat(markerInfo.coordinates)
    .setPopup(markerInfo.popup)
    .addTo(appState.map);
    
    // Update marker info
    markerInfo.marker = newMarker;
    markerInfo.color = color;
    markerInfo.shape = shape;
    markerInfo.element = newEl; // Update element reference
    
    // Apply current scale to updated marker
    if (appState.map) {
        updateMarkersScale();
    }
    
    showToast('Marker updated', 'success');
}

/**
 * Search location using Mapbox Geocoding API
 */
async function searchLocationForMarker(query, resultsDiv) {
    if (!CONFIG.MAPBOX.TOKEN) {
        showToast('Mapbox token not configured', 'error');
        return;
    }
    
    if (!resultsDiv) return;
    
    // Show results container
    resultsDiv.style.display = 'block';
    
    try {
        resultsDiv.innerHTML = '<div style="padding: 8px; color: #666;">Searching...</div>';
        
        // Use Mapbox Geocoding API
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${CONFIG.MAPBOX.TOKEN}&limit=5`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.features || data.features.length === 0) {
            resultsDiv.innerHTML = '<div style="padding: 8px; color: #666;">No results found</div>';
            return;
        }
        
        // Display results
        resultsDiv.innerHTML = '';
        data.features.forEach((feature) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.style.cssText = 'padding: 12px; border-bottom: 1px solid #e0e0e0; cursor: pointer; transition: background 0.2s;';
            
            // Mapbox returns coordinates as [lng, lat]
            const coords = feature.geometry.coordinates;
            const lng = coords[0];
            const lat = coords[1];
            
            resultItem.innerHTML = `
                <div style="font-weight: 500; color: #212121;">${feature.place_name}</div>
                <div style="font-size: 12px; color: #757575; margin-top: 4px;">${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
            `;
            
            resultItem.addEventListener('mouseenter', function () {
                this.style.backgroundColor = '#f5f5f5';
            });
            
            resultItem.addEventListener('mouseleave', function () {
                this.style.backgroundColor = 'white';
            });
            
            resultItem.addEventListener('click', function () {
                const name = feature.place_name;
                
                // Mapbox returns [lng, lat], which is what addMarker expects
                handleMarkerAddition(coords, name);
                
                // Clear search
                const searchInput = document.getElementById('marker-smart-search');
                if (searchInput) searchInput.value = '';
                resultsDiv.innerHTML = '';
                resultsDiv.style.display = 'none';
            });
            
            resultsDiv.appendChild(resultItem);
        });
        
    } catch (error) {
        console.error('Search error:', error);
        if (resultsDiv) {
            resultsDiv.innerHTML = `<div style="padding: 8px; color: #d32f2f;">Search failed: ${error.message}. Please try again.</div>`;
        }
    }
}

/**
 * Update markers list in UI
 */
function updateMarkersList() {
    const markersList = document.getElementById('markers-list');
    const markersCount = document.getElementById('markers-count');
    const clearMarkersBtn = document.getElementById('clear-markers-btn');
    
    if (!markersList) return;
    
    if (appState.markers.length === 0) {
        markersList.innerHTML = '<p class="empty-state">No markers added yet</p>';
        if (clearMarkersBtn) clearMarkersBtn.style.display = 'none';
        if (markersCount) markersCount.textContent = '0';
        return;
    }
    
    // Show clear button
    if (clearMarkersBtn) clearMarkersBtn.style.display = 'block';
    if (markersCount) markersCount.textContent = appState.markers.length.toString();
    
    // Build markers list
    markersList.innerHTML = '';
    appState.markers.forEach((markerInfo) => {
        const markerItem = document.createElement('div');
        markerItem.className = 'selected-area-item';
        markerItem.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #e0e0e0;';
        markerItem.innerHTML = `
            <div style="flex: 1;">
                <div style="font-weight: 500; color: #212121;">${markerInfo.name}</div>
                <div style="font-size: 11px; color: #757575;">${markerInfo.coordinates[0].toFixed(4)}, ${markerInfo.coordinates[1].toFixed(4)}</div>
            </div>
            <button class="icon-btn" data-marker-id="${markerInfo.id}" style="padding: 4px; color: #d32f2f;" title="Remove marker">
                <span class="material-icons" style="font-size: 18px;">delete</span>
            </button>
        `;
        
        // Add delete button event
        const deleteBtn = markerItem.querySelector('button[data-marker-id]');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                removeMarker(markerInfo.id);
            });
        }
        
        // Add click to fly to marker
        markerItem.style.cursor = 'pointer';
        markerItem.addEventListener('click', function (e) {
            if (e.target.closest('button')) return; // Don't fly if clicking delete button
            
            appState.map.flyTo({
                center: markerInfo.coordinates,
                zoom: Math.max(appState.map.getZoom(), 10),
                duration: 1000
            });
        });
        
        markersList.appendChild(markerItem);
    });
}

/**
 * Remove a marker
 */
function removeMarker(markerId) {
    const markerIndex = appState.markers.findIndex(m => m.id === markerId);
    if (markerIndex === -1) return;
    
    const markerInfo = appState.markers[markerIndex];
    
    // Remove from map
    if (markerInfo.marker) {
        markerInfo.marker.remove();
    }
    
    // Remove from array
    appState.markers.splice(markerIndex, 1);
    
    // Update UI
    updateMarkersList();
    
    showToast(`Marker "${markerInfo.name}" removed`, 'success');
}

/**
 * Clear all markers
 */
function clearAllMarkers() {
    if (appState.markers.length === 0) return;
    
    // Remove all markers from map
    appState.markers.forEach(markerInfo => {
        if (markerInfo.marker) {
            markerInfo.marker.remove();
        }
    });
    
    // Clear array
    appState.markers = [];
    
    // Update UI
    updateMarkersList();
    
    showToast('All markers cleared', 'success');
}

/**
 * Show color picker popup when adding a new marker
 */
function showMarkerColorPickerOnAdd(coordinates, name) {
    const popup = document.getElementById('marker-color-picker-on-add-popup');
    if (!popup) return;
    
    // Store pending marker data
    appState.pendingMarkerData = {
        coordinates: coordinates,
        name: name
    };
    
    // Update location display
    const locationDisplay = popup.querySelector('#marker-add-popup-location');
    if (locationDisplay) {
        locationDisplay.textContent = name;
    }
    
    // Position popup in center of screen
    popup.style.left = '50%';
    popup.style.top = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    
    // Populate color selector
    const selectorContainer = popup.querySelector('#marker-color-selector-on-add');
    if (!selectorContainer) return;
    
    selectorContainer.innerHTML = '';
    selectorContainer.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0;';
    
    // Get Apple colors
    const colors = (typeof APPLE_COLORS !== 'undefined') ? APPLE_COLORS : {
        red: '#FF3B30',
        orange: '#FF9500',
        yellow: '#FFCC00',
        green: '#34C759',
        teal: '#5AC8FA',
        blue: '#007AFF',
        indigo: '#5856D6',
        purple: '#AF52DE',
        pink: '#FF2D55',
        gray: '#8E8E93'
    };
    
    let selectedColor = appState.currentMarkerColor || '#007AFF';
    
    // Create color buttons
    Object.keys(colors).forEach(colorKey => {
        const colorBtn = document.createElement('button');
        colorBtn.className = 'marker-color-btn';
        colorBtn.dataset.color = colors[colorKey];
        const isSelected = colors[colorKey] === selectedColor;
        
        colorBtn.style.cssText = `
            width: 40px;
            height: 40px;
            border: ${isSelected ? '3px solid #007AFF' : '2px solid transparent'};
            border-radius: 6px;
            background: ${colors[colorKey]};
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
        `;
        colorBtn.title = colorKey.charAt(0).toUpperCase() + colorKey.slice(1);
        
        if (isSelected) {
            colorBtn.classList.add('selected');
        }
        
        // Click handler to select color
        colorBtn.addEventListener('click', function () {
            // Remove selected from all buttons
            selectorContainer.querySelectorAll('.marker-color-btn').forEach(b => {
                b.classList.remove('selected');
                b.style.borderColor = 'transparent';
                b.style.borderWidth = '2px';
                b.style.transform = 'scale(1)';
            });
            
            // Add selected to clicked button
            this.classList.add('selected');
            this.style.borderColor = '#007AFF';
            this.style.borderWidth = '3px';
            this.style.transform = 'scale(1.1)';
            
            // Update selected color
            selectedColor = colors[colorKey];
        });
        
        // Hover effects
        colorBtn.addEventListener('mouseenter', function () {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'scale(1.15)';
            }
        });
        
        colorBtn.addEventListener('mouseleave', function () {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'scale(1)';
            }
        });
        
        selectorContainer.appendChild(colorBtn);
    });
    
    // Show popup
    popup.style.display = 'block';
    
    // Button handlers
    const confirmBtn = popup.querySelector('#confirm-add-marker-btn');
    const useDefaultBtn = popup.querySelector('#use-default-color-btn');
    const cancelBtn = popup.querySelector('#cancel-add-marker-btn');
    
    // Remove old event listeners by cloning
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newUseDefaultBtn = useDefaultBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    useDefaultBtn.parentNode.replaceChild(newUseDefaultBtn, useDefaultBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    // Confirm: Add marker with selected color
    newConfirmBtn.addEventListener('click', function () {
        if (appState.pendingMarkerData) {
            addMarker(
                appState.pendingMarkerData.coordinates,
                appState.pendingMarkerData.name,
                selectedColor
            );
            popup.style.display = 'none';
            appState.pendingMarkerData = null;
        }
    });
    
    // Use Default: Add marker with sidebar default color
    newUseDefaultBtn.addEventListener('click', function () {
        if (appState.pendingMarkerData) {
            addMarker(
                appState.pendingMarkerData.coordinates,
                appState.pendingMarkerData.name,
                appState.currentMarkerColor
            );
            popup.style.display = 'none';
            appState.pendingMarkerData = null;
        }
    });
    
    // Cancel: Close popup without adding marker
    newCancelBtn.addEventListener('click', function () {
        popup.style.display = 'none';
        appState.pendingMarkerData = null;
    });
    
    // Close popup when clicking outside
    setTimeout(() => {
        const closeOnOutsideClick = function (e) {
            if (!popup.contains(e.target) && popup.style.display !== 'none') {
                popup.style.display = 'none';
                appState.pendingMarkerData = null;
                document.removeEventListener('click', closeOnOutsideClick);
            }
        };
        document.addEventListener('click', closeOnOutsideClick);
    }, 100);
}

// Expose appState and key functions to global scope for testing
window.appState = appState;
window.handleMapClick = handleMapClick;
window.detectClickedBoundary = detectClickedBoundary;
window.getAreaName = getAreaName;
window.switchAreaType = switchAreaType;
window.clearAllAreas = clearAllAreas;
window.applyColorToArea = applyColorToArea;
window.addMarker = addMarker;
window.removeMarker = removeMarker;
window.clearAllMarkers = clearAllMarkers;
window.setWaterColor = setWaterColor;
window.updateCustomChineseLabels = updateCustomChineseLabels;
window.removeCustomChineseLabels = removeCustomChineseLabels;

