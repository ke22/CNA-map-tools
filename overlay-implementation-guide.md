# Country + Administrative Area Overlay Implementation Guide

## Overview

This guide explains how to modify your Mapbox map system to support:
1. **Coloring any country** you want
2. **Overlaying administrative areas** on top of the colored country

---

## Solution: Modify `app-enhanced.js`

### Step 1: Add Overlay State

Add these properties to your `appState`:

```javascript
appState = {
    // ... existing properties ...
    
    // NEW: Overlay mode settings
    overlayMode: false,           // Whether admin areas overlay on country
    countryLayerIds: [],          // Track country color layers
    adminLayerIds: [],            // Track admin area overlay layers
    layerOrder: {
        base: 0,
        country: 1,
        admin: 2
    }
}
```

### Step 2: Create Layer Management Functions

```javascript
// Determine the correct layer insertion point for z-ordering
function getInsertionPoint(layerType) {
    const labelLayers = appState.labelLayerIds;
    
    if (layerType === 'admin') {
        // Admin areas go above country layers, below labels
        return labelLayers.length > 0 ? labelLayers[0] : undefined;
    } else if (layerType === 'country') {
        // Country layers go below admin layers
        const firstAdminLayer = appState.adminLayerIds[0];
        return firstAdminLayer || (labelLayers.length > 0 ? labelLayers[0] : undefined);
    }
    return undefined;
}

// Create colored layer with proper z-order
function createColoredLayer(areaId, areaType, color, sourceId) {
    const layerId = `colored-${areaType}-${areaId}`;
    const lineLayerId = `${layerId}-line`;
    
    // Determine if this is a country or admin layer
    const isAdmin = areaType === 'state' || areaType === 'city';
    const insertBefore = getInsertionPoint(isAdmin ? 'admin' : 'country');
    
    // Create filter for the specific area
    const filter = createFilterForArea(areaId, areaType);
    
    // Remove existing layer if present
    if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
    }
    if (map.getLayer(lineLayerId)) {
        map.removeLayer(lineLayerId);
    }
    
    // Add fill layer
    map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        'source-layer': getSourceLayer(sourceId, areaType),
        filter: filter,
        paint: {
            'fill-color': color,
            'fill-opacity': isAdmin ? 0.85 : 0.6  // Higher opacity for overlay
        }
    }, insertBefore);
    
    // Add border line
    map.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        'source-layer': getSourceLayer(sourceId, areaType),
        filter: filter,
        paint: {
            'line-color': isAdmin ? '#333' : '#666',
            'line-width': isAdmin ? 1.5 : 1,
            'line-opacity': 0.8
        }
    }, insertBefore);
    
    // Track layer IDs
    if (isAdmin) {
        appState.adminLayerIds.push(layerId, lineLayerId);
    } else {
        appState.countryLayerIds.push(layerId, lineLayerId);
    }
    
    return layerId;
}
```

### Step 3: Modify Area Selection Logic

```javascript
// Modified handleMapClick for overlay support
function handleMapClick(e) {
    const result = detectBoundaryAtPoint(e.lngLat);
    
    if (!result) {
        console.log('No boundary detected');
        return;
    }
    
    const { feature, areaType, areaId, areaName } = result;
    
    // Check if already selected
    const existingIndex = appState.selectedAreas.findIndex(a => a.id === areaId);
    if (existingIndex !== -1) {
        // Already selected - remove it
        removeAreaSelection(areaId, areaType);
        return;
    }
    
    // OVERLAY LOGIC: Handle based on current mode
    if (appState.overlayMode && appState.currentAreaType === 'administration') {
        // In overlay mode with admin type selected
        if (areaType === 'country') {
            // Clicking a country - color it as base layer
            applyColorAsCountry(areaId, areaType, feature);
        } else {
            // Clicking admin area - add as overlay on top
            applyColorAsOverlay(areaId, areaType, feature);
        }
    } else {
        // Standard mode - just color the clicked area
        applyColorToArea(areaId, areaType, appState.currentColor);
    }
    
    // Add to selected areas list
    addAreaToSelected(areaId, areaName, areaType, appState.currentColor);
    updateSelectedAreasList();
}

// Apply color to country (base layer)
function applyColorAsCountry(areaId, areaType, feature) {
    const sourceId = getSourceIdForArea(feature, areaType);
    const layerId = createColoredLayer(areaId, areaType, appState.currentColor, sourceId);
    
    // Store as selected country for overlay reference
    appState.selectedCountry = {
        id: areaId,
        name: getAreaName(feature, areaType),
        layerId: layerId
    };
    
    // Load admin boundaries for this country
    loadAdminBoundariesForCountry(areaId);
}

// Apply color as overlay (on top of country)
function applyColorAsOverlay(areaId, areaType, feature) {
    const sourceId = getSourceIdForArea(feature, areaType);
    createColoredLayer(areaId, areaType, appState.currentColor, sourceId);
}
```

### Step 4: Add UI Toggle for Overlay Mode

```javascript
// Add to initializeUI()
function addOverlayToggle() {
    const controlPanel = document.querySelector('.control-panel');
    
    const overlayToggle = document.createElement('div');
    overlayToggle.className = 'overlay-toggle';
    overlayToggle.innerHTML = `
        <label class="toggle-container">
            <input type="checkbox" id="overlay-mode-toggle">
            <span class="toggle-label">Overlay Mode</span>
        </label>
        <p class="toggle-hint">Color country + admin areas</p>
    `;
    
    controlPanel.appendChild(overlayToggle);
    
    // Bind event
    document.getElementById('overlay-mode-toggle').addEventListener('change', (e) => {
        appState.overlayMode = e.target.checked;
        updateUIForOverlayMode();
    });
}

function updateUIForOverlayMode() {
    const hint = document.querySelector('.overlay-hint');
    if (appState.overlayMode) {
        hint.textContent = '1. Click country to color base, 2. Click admin areas to overlay';
        hint.style.color = '#4CAF50';
    } else {
        hint.textContent = 'Standard mode: click to color';
        hint.style.color = '#666';
    }
}
```

### Step 5: Add CSS for Overlay Toggle

```css
/* Add to styles-enhanced.css */

.overlay-toggle {
    margin-top: 16px;
    padding: 12px;
    background: #f5f5f5;
    border-radius: 8px;
}

.toggle-container {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.toggle-container input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #6CA7A1;
}

.toggle-label {
    font-weight: 500;
    color: #333;
}

.toggle-hint {
    margin-top: 4px;
    font-size: 12px;
    color: #666;
}

/* Visual indicator for overlay mode */
.overlay-mode-active .area-type-btn[data-type="administration"] {
    background: linear-gradient(135deg, #6CA7A1, #4CAF50);
    color: white;
}
```

---

## Complete Workflow

```
┌─────────────────────────────────────────────┐
│         USER ENABLES OVERLAY MODE           │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│     STEP 1: Click on a Country              │
│     • Country gets colored (base layer)     │
│     • Admin boundaries load automatically   │
│     • z-index: 1 (below admin areas)        │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│     STEP 2: Click on Admin Areas            │
│     • Admin area gets colored               │
│     • Appears ON TOP of country color       │
│     • z-index: 2 (above country)            │
│     • Can use different colors              │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│            LAYER STACK RESULT               │
│  ┌───────────────────────────────────────┐  │
│  │  Labels (top)                         │  │
│  ├───────────────────────────────────────┤  │
│  │  Admin Areas (colored, z-index: 2)    │  │
│  ├───────────────────────────────────────┤  │
│  │  Country (colored, z-index: 1)        │  │
│  ├───────────────────────────────────────┤  │
│  │  Base Map (bottom)                    │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## Key Points

1. **Layer Z-Order**: Country layers are inserted BELOW admin layers using Mapbox's `addLayer(layer, beforeId)` method

2. **Different Opacities**: Use higher opacity (0.85) for admin overlays so they're clearly visible on top of the country (0.6)

3. **Automatic Admin Loading**: When a country is clicked in overlay mode, automatically load its administrative boundaries

4. **Color Independence**: Each layer can have its own color - useful for visualizing data hierarchies

5. **Clean Removal**: Track all layer IDs so they can be cleanly removed when deselected

---

## Example Use Case

**Scenario**: Visualize Taiwan with Taipei highlighted

1. Enable Overlay Mode ✓
2. Click Taiwan → Colors with #6CA7A1 (teal)
3. Select different color → #E07B53 (coral)
4. Click 台北市 → Taipei overlays in coral on top of teal Taiwan
5. Result: Taiwan is teal, Taipei is coral on top
