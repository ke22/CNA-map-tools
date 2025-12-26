/**
 * FIXED VERSION - Area Type Switching & Click Detection
 * Senior Engineer + Mapbox Expert Review Implementation
 */

// ... existing code up to switchAreaType function ...

/**
 * Switch Area Type - FIXED VERSION
 */
function switchAreaType(type) {
    console.log(`Switching to ${type} area type...`);
    
    appState.currentAreaType = type;
    
    // Step 1: Hide all visible boundary layers
    hideAllBoundaryLayers();
    
    // Step 2: Update button states
    document.querySelectorAll('.btn-toggle[data-type]').forEach(btn => {
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Step 3: Ensure source is loaded
    const sourceTypeKey = getSourceTypeKey(type);
    if (!appState.sources[sourceTypeKey] || !appState.sources[sourceTypeKey].loaded) {
        console.log(`Loading source for ${type}...`);
        loadBoundarySourceForType(type, true);
        // Will continue after source loads
        return;
    }
    
    // Step 4: Show only the active layer
    showBoundaryLayer(type);
    
    console.log(`✅ Switched to ${type} boundaries`);
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
 */
function showBoundaryLayer(areaType) {
    const layerId = `visible-boundaries-${areaType}`;
    
    // Check if layer exists
    if (!appState.map.getLayer(layerId)) {
        // Create it if it doesn't exist
        console.log(`Creating layer ${layerId}...`);
        createVisibleBoundaryLayer(areaType);
        
        // Wait a bit for layer to be created, then show it
        setTimeout(() => {
            if (appState.map.getLayer(layerId)) {
                appState.map.setLayoutProperty(layerId, 'visibility', 'visible');
            }
        }, 200);
    } else {
        // Layer exists, just make it visible
        appState.map.setLayoutProperty(layerId, 'visibility', 'visible');
    }
}

/**
 * Query features at point - FIXED VERSION
 * Only queries from active visible layer
 */
function queryFeaturesAtPoint(point, areaType) {
    const layerId = `visible-boundaries-${areaType}`;
    
    // Check if layer exists
    if (!appState.map.getLayer(layerId)) {
        return [];
    }
    
    // Check if layer is visible
    const visibility = appState.map.getLayoutProperty(layerId, 'visibility');
    if (visibility !== 'visible') {
        return [];
    }
    
    try {
        // Query features from active layer only
        const features = appState.map.queryRenderedFeatures(point, {
            layers: [layerId],
            radius: 10
        });
        
        return features || [];
        
    } catch (error) {
        console.error('Error querying features:', error);
        return [];
    }
}

/**
 * Create visible boundary layer - IMPROVED VERSION
 * Uses discovered source layer names
 */
function createVisibleBoundaryLayer(areaType) {
    const layerId = `visible-boundaries-${areaType}`;
    
    // Check if layer already exists
    if (appState.map.getLayer(layerId)) {
        return true;
    }
    
    const sourceId = getSourceIdForType(areaType);
    
    // Check if source exists
    if (!appState.map.getSource(sourceId)) {
        console.error(`Source ${sourceId} does not exist`);
        return false;
    }
    
    // Get actual source layer name (discovered or default)
    const sourceLayer = getActualSourceLayerName(areaType, sourceId);
    
    if (!sourceLayer) {
        console.error(`Could not determine source layer for ${areaType}`);
        return false;
    }
    
    try {
        // Create transparent fill layer
        appState.map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            'source-layer': sourceLayer,
            paint: {
                'fill-color': 'rgba(0,0,0,0)',
                'fill-opacity': 0
            }
        });
        
        // Initially hide it - will be shown when area type is active
        appState.map.setLayoutProperty(layerId, 'visibility', 'none');
        
        console.log(`✅ Created visible boundary layer for ${areaType} with source layer: ${sourceLayer}`);
        return true;
    } catch (error) {
        console.error(`Error creating layer ${layerId}:`, error.message);
        return false;
    }
}

/**
 * Get actual source layer name (with discovery fallback)
 */
function getActualSourceLayerName(areaType, sourceId) {
    const sourceTypeKey = getSourceTypeKey(areaType);
    
    // Check if we discovered layers
    if (appState.sources[sourceTypeKey] && appState.sources[sourceTypeKey].layers) {
        const discoveredLayers = appState.sources[sourceTypeKey].layers;
        
        // Find appropriate layer
        if (areaType === 'country') {
            return discoveredLayers.find(l => l.includes('country') || l.includes('boundaries')) || 'country_boundaries';
        } else if (areaType === 'state') {
            return discoveredLayers.find(l => l.includes('adm1') || l.includes('admin_1')) || 'boundaries_adm1';
        } else {
            return discoveredLayers.find(l => l.includes('adm2') || l.includes('admin_2')) || 'boundaries_adm2';
        }
    }
    
    // Fallback to defaults
    return getSourceLayerForType(areaType);
}


