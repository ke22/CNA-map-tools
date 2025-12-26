/**
 * Map Download Tool - Main Application
 * Phase 1: Standalone tool matching old tool functionality
 */

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Validate Mapbox token
    if (!CONFIG.MAPBOX.TOKEN || CONFIG.MAPBOX.TOKEN === 'YOUR_MAPBOX_ACCESS_TOKEN') {
        alert('請在 config.js 中設定您的 Mapbox access token！\nPlease set your Mapbox access token in config.js!');
        return;
    }

    // Set Mapbox access token
    mapboxgl.accessToken = CONFIG.MAPBOX.TOKEN;

    // Initialize country datalist
    initializeCountryDatalist();

    // Initialize map
    initializeMap();

    // Initialize UI controls
    initializeUIControls();
});

// Global variables
let map = null;
let marker = null;
let countryLayers = []; // Track active country layers
let currentMapType = CONFIG.MAP_TYPES.DEFAULT;

/**
 * Initialize country datalist
 */
function initializeCountryDatalist() {
    const datalist = document.getElementById('countries');
    if (datalist && typeof generateCountryDatalist === 'function') {
        datalist.innerHTML = generateCountryDatalist();
    }
}

/**
 * Initialize Mapbox map
 */
function initializeMap() {
    const style = CONFIG.MAPBOX.STYLES[currentMapType] || 
                  CONFIG.MAPBOX.FALLBACK_STYLES[currentMapType] || 
                  CONFIG.MAPBOX.STYLE;
    
    map = new mapboxgl.Map({
        container: CONFIG.MAP.CONTAINER_ID,
        style: style,
        center: CONFIG.MAP.DEFAULT_CENTER,
        zoom: getDefaultZoomForMapType(currentMapType),
        minZoom: CONFIG.MAP.MIN_ZOOM,
        maxZoom: CONFIG.MAP.MAX_ZOOM,
        localIdeographFontFamily: "'Noto Sans', 'Noto Sans CJK TC', sans-serif"
    });

    // Handle style loading errors
    map.on('error', function(e) {
        console.error('Map style error:', e);
        // Fallback to default style if custom style fails
        if (e.error && e.error.message && e.error.message.includes('style')) {
            const fallbackStyle = CONFIG.MAPBOX.FALLBACK_STYLES[currentMapType] || CONFIG.MAPBOX.STYLE;
            if (map.getStyle().name !== fallbackStyle) {
                map.setStyle(fallbackStyle);
            }
        }
    });

    // Wait for map to load
    map.on('load', function() {
        // Initialize marker at hidden location
        initializeMarker();
        
        // Auto-refresh boundaries if enabled in config
        if (CONFIG.MAPBOX.AUTO_REFRESH_BOUNDARIES) {
            // Small delay to ensure map is fully ready
            setTimeout(function() {
                refreshBoundariesData();
            }, 1000);
        }
    });
}

/**
 * Get default zoom level based on map type
 */
function getDefaultZoomForMapType(mapType) {
    const zoomLevels = {
        'country': 4,
        'state': 4,
        'county': 13,
        'world': 2
    };
    return zoomLevels[mapType] || CONFIG.MAP.DEFAULT_ZOOM;
}

/**
 * Initialize location marker
 */
function initializeMarker() {
    // Create marker element
    function createMarkerElement() {
        var el = document.createElement('div');
        el.style.width = '5px';
        el.style.height = '5px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#000000';
        return el;
    }

    // Create marker at hidden location (off screen)
    marker = new mapboxgl.Marker({
        color: '#000000',
        element: createMarkerElement()
    }).setLngLat([180, -90]).addTo(map); // Hidden location
}

/**
 * Initialize UI controls and event handlers
 */
function initializeUIControls() {
    // Map type selection
    setupMapTypeSelection();

    // Country selection
    setupCountrySelection();

    // Coordinate input
    setupCoordinateInput();

    // Clear buttons
    setupClearButtons();

    // Color selection (handled automatically by addCountryLayer)
}

/**
 * Setup map type selection buttons
 */
function setupMapTypeSelection() {
    const mapTypeButtons = {
        'map-type-country': 'country',
        'map-type-state': 'state',
        'map-type-county': 'county',
        'map-type-world': 'world'
    };

    const subtitles = {
        'country': '國界版',
        'state': '省州界版（適合美國中國等）',
        'county': '縣市界版（適合台灣小區域）',
        'world': '小地圖用'
    };

    for (const [buttonId, mapType] of Object.entries(mapTypeButtons)) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                switchMapType(mapType);
                updateMapTypeSubtitle(subtitles[mapType]);
            });
        }
    }
}

/**
 * Switch map type
 */
function switchMapType(newMapType) {
    if (newMapType === currentMapType) return;

    currentMapType = newMapType;
    const style = CONFIG.MAPBOX.STYLES[newMapType] || 
                  CONFIG.MAPBOX.FALLBACK_STYLES[newMapType] || 
                  CONFIG.MAPBOX.STYLE;

    // Clear existing layers
    clearCountryLayers();

    // Update map style
    map.setStyle(style);
    
    // Handle style loading errors with fallback
    map.once('error', function(e) {
        if (e.error && e.error.message && e.error.message.includes('style')) {
            const fallbackStyle = CONFIG.MAPBOX.FALLBACK_STYLES[newMapType] || CONFIG.MAPBOX.STYLE;
            map.setStyle(fallbackStyle);
        }
    });

    // Re-add country layers when new style loads
    map.once('style.load', function() {
        // Re-add all active country layers
        const activeCodes = [...countryLayers];
        countryLayers = [];
        activeCodes.forEach(code => {
            addCountryLayer(code);
        });
    });

    // Update zoom
    const newZoom = getDefaultZoomForMapType(newMapType);
    map.setZoom(newZoom);
}

/**
 * Update map type subtitle
 */
function updateMapTypeSubtitle(subtitle) {
    const subtitleEl = document.getElementById('map-type-subtitle');
    if (subtitleEl) {
        subtitleEl.textContent = subtitle + ' v20240607';
    }
}

/**
 * Setup country selection
 */
function setupCountrySelection() {
    const countrySelect = document.getElementById('country-select');
    if (countrySelect) {
        countrySelect.addEventListener('change', function() {
            const countryCode = this.value.trim().toUpperCase();
            if (countryCode && COUNTRY_CODES[countryCode]) {
                toggleCountryLayer(countryCode);
            }
        });
    }
}

/**
 * Toggle country layer (add if not exists, remove if exists)
 */
function toggleCountryLayer(countryCode) {
    if (countryLayers.includes(countryCode)) {
        removeCountryLayer(countryCode);
    } else {
        addCountryLayer(countryCode, true); // Pass true to enable zoom
    }
}

/**
 * Add country layer with color and optionally zoom to country
 */
function addCountryLayer(countryCode, shouldZoom = false) {
    if (countryLayers.includes(countryCode)) return;

    const selectedColor = document.querySelector('input[type=radio][name=colorselect]:checked').value;

    function doAddLayer() {
        try {
            // Check if source exists, if not add it
            // Mapbox vector tiles automatically use the latest data from servers
            if (!map.getSource('country-boundaries')) {
                map.addSource('country-boundaries', {
                    type: 'vector',
                    url: CONFIG.MAPBOX.VECTOR_TILE_SOURCE,
                    // Vector tiles are automatically updated by Mapbox
                    // No cache needed - always fetches latest data
                });
            }

            // Build filter expression
            // Option to disable worldview filter if countries like Ukraine can't be colored
            let filterExpression;
            if (CONFIG.MAPBOX.USE_WORLDVIEW_FILTER !== false) {
                // With worldview filter (default)
                filterExpression = [
                    'all',
                    ['==', 'iso_3166_1_alpha_3', countryCode],
                    ['in', 'worldview', ...CONFIG.MAPBOX.WORLDVIEW_FILTER]
                ];
            } else {
                // Without worldview filter (more permissive - allows all countries)
                filterExpression = [
                    '==', 'iso_3166_1_alpha_3', countryCode
                ];
            }
            
            // Add layer
            map.addLayer({
                id: countryCode,
                type: 'fill',
                source: 'country-boundaries',
                'source-layer': 'country_boundaries',
                filter: filterExpression,
                paint: {
                    'fill-color': selectedColor,
                    'fill-opacity': CONFIG.COLORS.TERRITORY_OPACITY
                }
            });

            countryLayers.push(countryCode);
            
            // Check if layer actually renders data (debugging)
            map.once('idle', function() {
                // Try querying rendered features
                let renderedFeatures = [];
                try {
                    renderedFeatures = map.queryRenderedFeatures({
                        layers: [countryCode]
                    });
                } catch (e) {
                    // Layer might not be visible yet
                }
                
                // Also try querying source features
                let sourceFeatures = [];
                try {
                    sourceFeatures = map.querySourceFeatures('country-boundaries', {
                        sourceLayer: 'country_boundaries',
                        filter: ['==', 'iso_3166_1_alpha_3', countryCode]
                    });
                } catch (e) {
                    console.warn('Could not query source features:', e);
                }
                
                // Debug output
                if (renderedFeatures.length === 0 && sourceFeatures.length === 0) {
                    console.warn(`⚠️ Country ${countryCode} (${COUNTRY_CODES[countryCode]?.nameEn || 'Unknown'}) cannot be colored.`);
                    console.warn('Possible reasons:');
                    console.warn('1. Worldview filter is too restrictive');
                    console.warn('2. Country not in Mapbox boundaries data');
                    console.warn('3. Country code mismatch');
                    console.warn('💡 Try setting USE_WORLDVIEW_FILTER: false in config.js');
                } else if (renderedFeatures.length === 0 && sourceFeatures.length > 0) {
                    console.warn(`⚠️ Country ${countryCode} exists in data but worldview filter is blocking it.`);
                    console.warn('💡 Try setting USE_WORLDVIEW_FILTER: false in config.js');
                } else {
                    console.log(`✅ Successfully colored ${countryCode} (${COUNTRY_CODES[countryCode]?.nameEn || 'Unknown'})`);
                }
            });
            
            // Zoom to country after layer is added (if requested)
            if (shouldZoom) {
                zoomToCountry(countryCode);
            }
        } catch (error) {
            console.error('Error adding country layer:', error);
            console.error('Country code:', countryCode);
            console.error('Try: 1. Check country code is correct 2. Set USE_WORLDVIEW_FILTER: false');
            // If error, try again after source loads
            if (!map.getSource('country-boundaries')) {
                map.once('sourcedata', function(e) {
                    if (e.sourceId === 'country-boundaries' && e.isSourceLoaded) {
                        doAddLayer();
                    }
                });
            }
        }
    }

    // Ensure map is loaded
    if (map.loaded()) {
        doAddLayer();
    } else {
        map.once('load', doAddLayer);
    }
}

/**
 * Zoom map to show the selected country
 * Uses Mapbox Geocoding API to find country center and approximate zoom
 */
function zoomToCountry(countryCode) {
    const countryInfo = COUNTRY_CODES[countryCode];
    if (!countryInfo) return;
    
    // Use country name to geocode and get center coordinates
    const countryName = countryInfo.nameEn || countryInfo.name;
    
    // Build geocoding URL
    const query = encodeURIComponent(countryName);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${CONFIG.MAPBOX.TOKEN}&types=country&limit=1`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                const center = feature.center; // [lng, lat]
                
                // Get bounding box if available, or use center with default zoom
                let bounds = null;
                if (feature.bbox) {
                    bounds = [
                        [feature.bbox[0], feature.bbox[1]], // southwest
                        [feature.bbox[2], feature.bbox[3]]  // northeast
                    ];
                }
                
                if (bounds) {
                    // Use bounding box for more accurate zoom (faster animation)
                    map.fitBounds(bounds, {
                        padding: { top: 50, bottom: 50, left: 50, right: 50 },
                        maxZoom: 8,  // Don't zoom in too much for countries
                        duration: 400  // Faster zoom (400ms instead of default ~1000ms)
                    });
                } else {
                    // Fallback: center on country with appropriate zoom
                    // Use different zoom levels based on country size (approximate)
                    let zoom = 5; // Default zoom for countries
                    
                    // Small countries get higher zoom
                    const smallCountries = ['SGP', 'MCO', 'VAT', 'SMR', 'LIE', 'MCO'];
                    if (smallCountries.includes(countryCode)) {
                        zoom = 10;
                    }
                    
                    map.flyTo({
                        center: center,
                        zoom: zoom,
                        duration: 400  // Faster zoom (400ms instead of 1000ms)
                    });
                }
            }
        })
        .catch(error => {
            console.warn('Could not geocode country for zoom:', error);
        });
}

/**
 * Remove country layer
 */
function removeCountryLayer(countryCode) {
    if (!countryLayers.includes(countryCode)) return;

    try {
        // Only remove layer, not source (source is shared)
        if (map.getLayer(countryCode)) {
            map.removeLayer(countryCode);
        }
        const index = countryLayers.indexOf(countryCode);
        if (index > -1) {
            countryLayers.splice(index, 1);
        }
    } catch (error) {
        console.error('Error removing country layer:', error);
        // Remove from array even if layer removal failed
        const index = countryLayers.indexOf(countryCode);
        if (index > -1) {
            countryLayers.splice(index, 1);
        }
    }
}

/**
 * Clear all country layers
 */
function clearCountryLayers() {
    const codes = [...countryLayers];
    codes.forEach(code => {
        removeCountryLayer(code);
    });
    document.getElementById('country-select').value = '';
}

/**
 * Setup coordinate input
 */
function setupCoordinateInput() {
    const coordinateInput = document.getElementById('coordinates');
    if (coordinateInput) {
        coordinateInput.addEventListener('change', function(e) {
            handleCoordinateInput(e.target.value);
        });

        // Also handle Enter key
        coordinateInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleCoordinateInput(e.target.value);
            }
        });
    }
}

/**
 * Handle coordinate input
 */
function handleCoordinateInput(value) {
    const coordinates = value.split(',');
    if (coordinates.length === 2) {
        const lat = parseFloat(coordinates[0].trim());
        const lng = parseFloat(coordinates[1].trim());
        
        if (!isNaN(lat) && !isNaN(lng)) {
            updateMarker([lng, lat]);
            const zoom = getDefaultZoomForMapType(currentMapType);
            map.flyTo({
                center: [lng, lat],
                zoom: zoom,
                duration: 400  // Faster zoom
            });
        } else {
            document.getElementById('coordinates').value = '';
        }
    } else {
        document.getElementById('coordinates').value = '';
    }
}

/**
 * Update marker position
 */
function updateMarker(coordinates) {
    if (marker) {
        marker.setLngLat(coordinates);
    }
}

/**
 * Clear marker
 */
function clearMarker() {
    document.getElementById('coordinates').value = '';
    if (marker) {
        marker.setLngLat([180, -90]); // Move to hidden location
    }
}

/**
 * Clear country input
 */
function clearCountryInput() {
    document.getElementById('country-select').value = '';
}


/**
 * Setup clear buttons
 */
function setupClearButtons() {
    const clearButton = document.getElementById('clear-button');
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            clearCountryLayers();
        });
    }
}

/**
 * Refresh map boundaries data to get latest updates
 * This reloads the vector tile source to ensure latest data
 */
function refreshBoundariesData() {
    if (!map || !map.loaded()) {
        console.warn('Map not loaded yet');
        return;
    }
    
    try {
        // Remove existing source
        if (map.getSource('country-boundaries')) {
            // Remove all layers using this source first
            const layersToRemove = [];
            map.getStyle().layers.forEach(layer => {
                if (layer.source === 'country-boundaries') {
                    layersToRemove.push(layer.id);
                }
            });
            
            layersToRemove.forEach(layerId => {
                if (map.getLayer(layerId)) {
                    map.removeLayer(layerId);
                }
            });
            
            // Remove source
            map.removeSource('country-boundaries');
        }
        
        // Clear country layers array
        countryLayers = [];
        
        // Re-add source (will fetch latest data from Mapbox)
        map.addSource('country-boundaries', {
            type: 'vector',
            url: CONFIG.MAPBOX.VECTOR_TILE_SOURCE
        });
        
        console.log('✅ Boundaries data refreshed - using latest Mapbox data');
        
        // Show user feedback
        if (typeof showMessage === 'function') {
            showMessage('地圖資料已更新 / Map data refreshed');
        } else {
            console.log('Map boundaries refreshed to latest version');
        }
        
    } catch (error) {
        console.error('Error refreshing boundaries:', error);
    }
}

/**
 * Capture and download map as image
 * Using canvas method from old tool for better quality
 */
function captureMap() {
    if (!map || !map.loaded()) {
        alert('地圖尚未載入完成，請稍候再試。\nMap is not fully loaded, please try again.');
        return;
    }

    var canvas = document.createElement('canvas');
    var width = map.getCanvas().clientWidth;
    var height = map.getCanvas().clientHeight;
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');

    map.once('render', function() {
        // Draw map to canvas
        context.drawImage(map.getCanvas(), 0, 0, width, height);

        // Draw marker manually (since Mapbox markers might not export)
        if (marker) {
            var markerCoordinates = marker.getLngLat();
            // Check if marker is visible (not at hidden location)
            if (markerCoordinates.lng !== 180 || markerCoordinates.lat !== -90) {
                var pixel = map.project(markerCoordinates);
                if (pixel) {
                    var markerSize = 2;
                    var markerColor = '#000000';
                    context.beginPath();
                    context.arc(pixel.x, pixel.y, markerSize, 0, 2 * Math.PI, false);
                    context.fillStyle = markerColor;
                    context.fill();
                }
            }
        }

        // Convert to blob and download
        canvas.toBlob(function(blob) {
            var link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            link.download = `map_capture_${timestamp}.png`;
            
            link.click();
            
            // Clean up
            URL.revokeObjectURL(link.href);
        });
    });

    map.triggerRepaint();
}
