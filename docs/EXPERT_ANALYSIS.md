# Expert Analysis - Area Type Switching Issue
**Senior Engineer + Mapbox Specialist Review**

## 🔍 Problem Analysis

### Current Issue:
- Area type switching (Country/State/City) doesn't work
- Click detection fails because wrong layers are active

---

## 🏗️ Architecture Issues Identified

### Issue 1: **Multiple Visible Layers Active Simultaneously**

**Problem:**
- All boundary layers (country, state, city) are created and remain active
- When switching, old layers aren't hidden
- Click detection queries all layers, causing confusion

**Impact:** High - Core functionality broken

**Solution:**
```javascript
// When switching area type:
1. Hide all visible boundary layers except current type
2. Show only the layer for selected type
3. Update click detection to query only active layer
```

---

### Issue 2: **Source Layer Names May Be Incorrect**

**Problem:**
- Assumes source layer names without verification
- `boundaries_adm1` may not be correct
- Need to discover actual layer names

**Impact:** High - Features won't load

**Solution:**
```javascript
// Discover actual source layer names
function discoverSourceLayers(sourceId) {
    const source = map.getSource(sourceId);
    if (source.type === 'vector' && source.vectorLayerIds) {
        return source.vectorLayerIds; // Actual layer names
    }
    // Fallback: query source features to discover
}
```

---

### Issue 3: **Click Detection Queries Wrong Layers**

**Problem:**
- Queries from `visible-boundaries-${areaType}` layer
- But that layer may not exist or may not be visible
- No fallback mechanism

**Impact:** High - Clicking doesn't work

**Solution:**
```javascript
// Query from active visible layer only
function queryFeaturesAtPoint(point, areaType) {
    const layerId = `visible-boundaries-${areaType}`;
    
    // Ensure layer exists and is visible
    if (!map.getLayer(layerId)) {
        return [];
    }
    
    // Query only this layer
    return map.queryRenderedFeatures(point, {
        layers: [layerId],
        radius: 10
    });
}
```

---

## 🗺️ Mapbox-Specific Issues

### Issue 4: **Mapbox Boundaries Source Layer Structure**

**Problem:**
- Mapbox Boundaries may have different layer structure
- `boundaries-adm1-v3` source may have layers like:
  - `boundaries_admin_1`
  - `boundaries_admin_1_disputed`
  - `boundaries_admin_1_claimed`

**Impact:** High - Wrong layer names = no data

**Solution:**
```javascript
// Discover and use correct layer names
const actualLayerName = discoverActualLayerName(sourceId, areaType);
```

---

### Issue 5: **Layer Visibility Management**

**Problem:**
- No mechanism to show/hide layers based on area type
- All layers visible simultaneously
- Performance issues

**Impact:** Medium - UX confusion

**Solution:**
```javascript
// Hide/show layers based on active area type
function updateLayerVisibility(activeType) {
    ['country', 'state', 'city'].forEach(type => {
        const layerId = `visible-boundaries-${type}`;
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(
                layerId, 
                'visibility', 
                type === activeType ? 'visible' : 'none'
            );
        }
    });
}
```

---

## ✅ Recommended Fixes (Priority Order)

### Fix 1: Layer Visibility Management (CRITICAL)
**What:** Hide inactive boundary layers, show only active
**Why:** Enables proper switching and click detection
**Effort:** Low (1-2 hours)

### Fix 2: Source Layer Discovery (CRITICAL)
**What:** Dynamically discover actual source layer names
**Why:** Assumed names may be wrong
**Effort:** Medium (2-3 hours)

### Fix 3: Click Detection Fix (CRITICAL)
**What:** Query only from active visible layer
**Why:** Current queries wrong/multiple layers
**Effort:** Low (1 hour)

### Fix 4: State Management (IMPORTANT)
**What:** Track active area type and layer states
**Why:** Prevents conflicts and confusion
**Effort:** Medium (2 hours)

---

## 🔧 Implementation Plan

### Step 1: Fix Layer Visibility (Immediate)
```javascript
function switchAreaType(type) {
    appState.currentAreaType = type;
    
    // 1. Hide all visible boundary layers
    hideAllBoundaryLayers();
    
    // 2. Ensure source is loaded
    if (!isSourceLoaded(type)) {
        loadBoundarySourceForType(type, true);
        return; // Will continue after load
    }
    
    // 3. Show only active layer
    showBoundaryLayer(type);
    
    // 4. Update UI
    updateAreaTypeButtons(type);
}
```

### Step 2: Discover Source Layers (Critical)
```javascript
async function discoverSourceLayers(sourceId, areaType) {
    return new Promise((resolve) => {
        const source = map.getSource(sourceId);
        
        if (source && source.type === 'vector') {
            // Try to get vector layer IDs
            if (source.vectorLayerIds && source.vectorLayerIds.length > 0) {
                const layerNames = source.vectorLayerIds;
                console.log(`Source ${sourceId} layers:`, layerNames);
                
                // Find appropriate layer for area type
                const appropriateLayer = findAppropriateLayer(layerNames, areaType);
                resolve(appropriateLayer);
                return;
            }
        }
        
        // Fallback: Query features to discover structure
        try {
            const sample = map.querySourceFeatures(sourceId, { limit: 1 });
            if (sample.length > 0) {
                const props = Object.keys(sample[0].properties);
                console.log('Sample feature properties:', props);
                resolve(deduceLayerName(props, areaType));
            }
        } catch (err) {
            console.warn('Could not discover layers:', err);
            resolve(getDefaultLayerName(areaType)); // Fallback
        }
    });
}
```

### Step 3: Fix Click Detection (Critical)
```javascript
function queryFeaturesAtPoint(point, areaType) {
    // Only query from active visible layer
    const layerId = `visible-boundaries-${areaType}`;
    
    // Verify layer exists and is visible
    if (!map.getLayer(layerId)) {
        console.warn(`Layer ${layerId} does not exist`);
        return [];
    }
    
    const visibility = map.getLayoutProperty(layerId, 'visibility');
    if (visibility !== 'visible') {
        console.warn(`Layer ${layerId} is not visible`);
        return [];
    }
    
    // Query features
    try {
        const features = map.queryRenderedFeatures(point, {
            layers: [layerId],
            radius: 10
        });
        
        return features;
    } catch (error) {
        console.error('Query error:', error);
        return [];
    }
}
```

---

## 🎯 Root Cause Summary

### Primary Issues:
1. **No layer visibility management** - All layers active simultaneously
2. **Incorrect source layer names** - Assumed names may not exist
3. **Poor click detection** - Queries wrong/multiple layers

### Secondary Issues:
4. **No layer state tracking** - Can't tell which layer is active
5. **Missing error recovery** - Failures not handled gracefully

---

## ✅ Solution Implementation

**Implement fixes in this order:**
1. Layer visibility management (hides/shows layers)
2. Source layer discovery (finds correct layer names)
3. Click detection fix (queries only active layer)

**This will resolve the switching issue.**

---

## 🚀 Next Steps

1. Implement layer visibility management
2. Add source layer discovery
3. Fix click detection
4. Test area type switching
5. Verify click functionality

**Expected Result:** Area type switching works, clicking works for each type.


