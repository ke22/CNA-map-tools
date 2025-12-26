# Systematic Review - Senior Engineer & Mapbox Expert

## 🔍 **Problem Analysis**

### **Current Issues:**
1. ✅ GADM data loads successfully (state: 769 features, city: 355k features)
2. ✅ Visible layers created (`visible-boundaries-state`, etc.)
3. ❌ Click detection returns 0 features after filtering
4. ❌ Cannot select boundaries by clicking

---

## 🔬 **Root Cause Analysis**

### **Issue 1: Layer Visibility vs Query Mismatch**

**Problem:**
- Layers are created but may not be visible or queryable
- `queryRenderedFeatures` queries rendered features, but transparent layers might not be rendered

**Evidence:**
- Console shows: "Created GADM visible layer: visible-boundaries-state"
- But no features found when clicking

**Solution Needed:**
- Ensure layers are actually visible and rendered
- Add explicit line styles for boundaries (not just transparent fill)
- Verify layer is queryable

---

### **Issue 2: Query Method**

**Current Approach:**
```javascript
// Query from layer
queryRenderedFeatures(point, { layers: [layerId] })
```

**Problem:**
- Transparent fill layers might not be "rendered" → can't query
- Need to ensure features are actually rendered

**Better Approach:**
1. Query directly from GeoJSON source
2. Use spatial queries with bounds/point-in-polygon
3. Add visible line layer for querying

---

### **Issue 3: GADM Feature Structure**

**GADM Features Have:**
- `GID_0`, `GID_1`, `GID_2` properties
- `NAME_0`, `NAME_1`, `NAME_2` properties
- Geometry: MultiPolygon

**Current Filter:**
- Checks for GID properties
- But might miss features due to query method

---

## 🛠️ **Comprehensive Fix Strategy**

### **Fix 1: Add Visible Boundary Lines**

Instead of only transparent fill, add visible line layer:

```javascript
// Create visible line layer for boundaries
appState.map.addLayer({
    id: `boundaries-${areaType}-lines`,
    type: 'line',
    source: sourceId,
    paint: {
        'line-color': '#888',
        'line-width': 1,
        'line-opacity': 0.6
    },
    layout: {
        visibility: 'visible' // Always visible
    }
});
```

### **Fix 2: Query from Source Directly**

For GeoJSON sources, query features directly:

```javascript
// Query from GeoJSON source using point-in-polygon
const source = appState.map.getSource(`gadm-${areaType}`);
if (source && source._data) {
    // Point-in-polygon check
    const features = source._data.features.filter(f => {
        return pointInPolygon(point, f.geometry);
    });
}
```

### **Fix 3: Improve Layer Creation**

Ensure layers are:
1. Visible
2. Queryable
3. Properly styled

---

## 📋 **Action Plan**

1. **Add visible boundary lines** (so features are rendered)
2. **Improve query method** (query from source directly if layer query fails)
3. **Add point-in-polygon check** (for GeoJSON features)
4. **Better error handling** (log what's actually happening)

---

## ✅ **Expected Outcome**

After fixes:
- ✅ Boundaries visible on map
- ✅ Click detection works
- ✅ Can select and color areas
- ✅ All three levels work (country, state, city)


