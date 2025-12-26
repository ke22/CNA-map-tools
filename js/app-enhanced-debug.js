/**
 * Debug Helper Functions
 * Add these to console to diagnose issues
 */

// Check what sources are loaded
window.checkSources = function() {
    console.log('=== Sources Status ===');
    ['adm0', 'adm1', 'adm2'].forEach(type => {
        const sourceId = type === 'adm0' ? 'boundaries-adm0' : `boundaries-${type}`;
        const source = appState.map.getSource(sourceId);
        console.log(`${type}:`, {
            exists: !!source,
            loaded: appState.sources[type]?.loaded,
            id: sourceId
        });
    });
};

// Check what layers exist
window.checkLayers = function() {
    console.log('=== Layers Status ===');
    ['country', 'state', 'city'].forEach(type => {
        const layerId = `visible-boundaries-${type}`;
        const layer = appState.map.getLayer(layerId);
        console.log(`${type}:`, {
            exists: !!layer,
            visible: layer ? appState.map.getLayoutProperty(layerId, 'visibility') : 'N/A',
            id: layerId
        });
    });
};

// Check source layers
window.checkSourceLayers = function(sourceId) {
    const source = appState.map.getSource(sourceId);
    if (source && source.vectorLayerIds) {
        console.log(`Source ${sourceId} layers:`, source.vectorLayerIds);
    } else {
        console.log(`Source ${sourceId} not found or no vectorLayerIds`);
    }
};

// Test click detection
window.testClick = function(x, y) {
    const point = { x, y };
    const features = appState.map.queryRenderedFeatures(point, {
        layers: [],
        radius: 10
    });
    console.log('Features at point:', features);
    return features;
};


