# Old Tool Analysis - Useful Patterns for New Tool

This document extracts useful patterns, code, and approaches from the 2023Maps tool that should be incorporated into the new implementation.

## ✅ Critical Patterns to Keep

### 1. **Mapbox Vector Tiles (NOT GeoJSON)**

The old tool uses Mapbox's built-in vector tile source instead of loading GeoJSON files. This is **much better**:

```javascript
source: {
    type: 'vector',
    url: 'mapbox://mapbox.country-boundaries-v1'
},
'source-layer': 'country_boundaries',
filter: [
    'all',
    ['==', 'iso_3166_1_alpha_3', countryCode],
    ['in', 'worldview', 'all', 'JP', 'AR,JP,MA,RU,TR,US', ...]
]
```

**Why this is better:**
- No need to load large GeoJSON files
- Faster performance
- Built-in boundary data
- Supports worldview filtering for disputed territories

**Action:** Use this approach instead of loading GeoJSON files!

---

### 2. **Worldview Filtering**

The old tool handles Mapbox worldview filtering for disputed territories. This is critical:

```javascript
['in', 'worldview', 'all', 'JP', 'AR,JP,MA,RU,TR,US', 'US', 
 'AR,IN,JP,MA,RU,TR,US', 'AR,CN,IN,JP,MA,TR,US', 
 'AR,CN,JP,MA,RU,TR,US', 'AR,CN,IN,JP,RU,TR,US', 
 'CN,JP', 'CN,IN,JP,MA,RU,TR,US', 
 'AR,IN,JP,MA,RS,RU,TR,US', 'IN']
// 2024.6.7發現mapbox有一些世界觀修正，台灣菲律賓等改為AR,IN,JP,MA,RS,RU,TR,US，中國改為IN by綱
```

**Action:** Include worldview filtering in territory layer creation.

---

### 3. **Complete Country Code List**

The old tool has a complete ISO 3166-1 alpha-3 country code datalist with:
- Country codes (e.g., `TWN`, `USA`)
- Chinese names (e.g., `台灣`)
- English names (e.g., `Taiwan`)

**Location:** Lines 61-311 in each HTML file

**Action:** Extract this country list and use it for territory selection by name.

---

### 4. **Color Values**

The old tool uses these specific color values:

| Color | Hex | Use |
|-------|-----|-----|
| Blue (藍) | `#004e98` | Primary/default |
| Red (紅) | `#980000` | Important/highlighted |
| Orange (橙) | `#FF6B00` | Secondary |
| Dark Gray (深灰) | `#000000` | Neutral |
| Light Gray (淺灰) | `#777777` | Subtle |

**Note:** Different from our config.js colors. We should **update config.js** to match these exact values for consistency.

---

### 5. **Export Method - Canvas with Manual Marker Drawing**

The old tool uses a clever approach for export:
1. Capture map canvas
2. Manually draw markers on the canvas (since Mapbox markers might not export properly)
3. Export the combined canvas

```javascript
function captureMap() {
    var canvas = document.createElement('canvas');
    var width = map.getCanvas().clientWidth;
    var height = map.getCanvas().clientHeight;
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');

    map.once('render', function() {
        // Draw map
        context.drawImage(map.getCanvas(), 0, 0, width, height);

        // Manually draw marker on canvas
        var markerSize = 2;
        var markerColor = '#000000';
        var coordinates = marker.getLngLat();
        var pixel = map.project(coordinates);
        context.beginPath();
        context.arc(pixel.x, pixel.y, markerSize, 0, 2 * Math.PI, false);
        context.fillStyle = markerColor;
        context.fill();

        // Export
        canvas.toBlob(function(blob) {
            var link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'map_capture.png';
            link.click();
        });
    });

    map.triggerRepaint();
}
```

**Action:** Use this export method - it's better than html2canvas!

---

### 6. **Coordinate Input Handling**

The old tool handles coordinate input with validation:

```javascript
document.getElementById('coordinates').addEventListener('change', function(e) {
    var coordinates = e.target.value.split(',');
    if (coordinates.length === 2) {
        var lat = parseFloat(coordinates[0].trim());
        var lng = parseFloat(coordinates[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
            updateMarker([lng, lat]);
            map.flyTo({
                center: [lng, lat],
                zoom: 13  // or 4 for country view
            });
        } else {
            document.getElementById('coordinates').value = '';
        }
    } else {
        document.getElementById('coordinates').value = '';
    }
});
```

**Features:**
- Accepts "lat,lng" format
- Validates numeric values
- Auto-centers map on coordinates
- Clears invalid input

**Action:** Use this pattern for coordinate input.

---

### 7. **Layer Management Pattern**

The old tool maintains a list of active layers for easy clearing:

```javascript
const countryLayers = []; // 存放已添加的國家圖層

function addCountryLayer(countryCode) {
    // Add layer logic...
    countryLayers.push(countryCode);
}

function removeCountryLayer(countryCode) {
    map.removeLayer(countryCode);
    map.removeSource(countryCode);
    const index = countryLayers.indexOf(countryCode);
    countryLayers.splice(index, 1);
}

function clearCountryLayers() {
    countryLayers.forEach(function(countryCode) {
        removeCountryLayer(countryCode);
    });
}
```

**Action:** Use this state management pattern.

---

### 8. **Custom Map Styles**

Each map type uses a different Mapbox style:

- **國界版 (Country)**: `mapbox://styles/cnagraphicdesign/clts2b1mr018801r5flymg36h`
- **省州界版 (State)**: `mapbox://styles/cnagraphicdesign/cltqna92j01ig01pt1kvfexby`
- **縣市界版 (County)**: `mapbox://styles/cnagraphicdesign/cltqnf7vy01gw01ra4t5xewq0`
- **小地圖用 (World)**: Custom style for overview

**Action:** We should support custom style URLs per map type.

---

### 9. **UI Elements**

**Fonts:**
- Noto Sans TC for Chinese text
- Material Icons for UI icons

**Button Style:**
```css
.button {
    padding: 10px 10px;
    background-color: #555555;
    border: none;
    border-radius: 10px;
    color: #ffffff;
    font-size: 16px;
    font-family:'Noto Sans TC', sans-serif;
    cursor: pointer;
}
```

**Action:** Keep this UI style for consistency.

---

### 10. **Marker Initialization**

Markers are initialized at a hidden location and moved:

```javascript
var marker = new mapboxgl.Marker({
    color: '#000000',
    radius: 5,
    element: createMarkerElement()
}).setLngLat([180, -90]).addTo(map); // Hidden location

function updateMarker(coordinates) {
    marker.setLngLat(coordinates);
}
```

**Action:** Use this pattern - better than creating/destroying markers.

---

## 🔄 Patterns to Improve

### 1. **Multiple Clear Calls**

The old tool calls `clearCountryLayers()` three times - this is inefficient:

```javascript
clearButton.addEventListener('click', function() {
    clearCountryLayers();
    clearCountryLayers();  // Why?
    clearCountryLayers();  // Why?
});
```

**Action:** Fix this - one call is enough.

---

### 2. **Country Selection - Datalist Only**

The old tool only supports country selection via datalist (ISO codes). No name search.

**Action:** Add name-based search using geocoding API.

---

### 3. **No Territory Name Search**

The old tool doesn't search territories by name - only by ISO code.

**Action:** Add geocoding for territory name search.

---

### 4. **Fixed Map Sizes**

```css
#map {
    width: 1600px;
    height: 1600px;
}
```

**Action:** Make responsive.

---

## 📋 Code Snippets to Extract

### Country Code to Name Mapping

Extract the country datalist (lines 61-311) and create a mapping object:

```javascript
const COUNTRY_CODES = {
    'TWN': { name: '台灣', nameEn: 'Taiwan' },
    'USA': { name: '美國', nameEn: 'United States of America' },
    // ... etc
};
```

### Worldview Filter Array

Extract the worldview filter array for use in new tool:

```javascript
const WORLDVIEW_FILTER = [
    'all', 'JP', 'AR,JP,MA,RU,TR,US', 'US', 
    'AR,IN,JP,MA,RU,TR,US', 'AR,CN,IN,JP,MA,TR,US', 
    'AR,CN,JP,MA,RU,TR,US', 'AR,CN,IN,JP,RU,TR,US', 
    'CN,JP', 'CN,IN,JP,MA,RU,TR,US', 
    'AR,IN,JP,MA,RS,RU,TR,US', 'IN'
];
```

---

## ✅ Updated Implementation Plan

Based on old tool analysis:

1. **Use Mapbox Vector Tiles** instead of GeoJSON files
2. **Keep country code list** for quick selection
3. **Add geocoding** for name-based search
4. **Use canvas export method** from old tool
5. **Update color values** to match old tool
6. **Add worldview filtering** for territories
7. **Improve layer management** pattern
8. **Make responsive** (old tool was fixed size)

---

## 🎯 Priority Actions

1. **HIGH:** Switch to Mapbox Vector Tiles approach
2. **HIGH:** Use canvas export method (better than html2canvas)
3. **MEDIUM:** Extract country code list
4. **MEDIUM:** Update color values in config.js
5. **LOW:** Keep UI style similar for familiarity

---

## Summary

The old tool has several excellent patterns we should adopt:
- ✅ Vector tiles instead of GeoJSON
- ✅ Canvas export method
- ✅ Layer management pattern
- ✅ Worldview filtering
- ✅ Coordinate input handling

But we should improve:
- ⚠️ Add name-based territory search
- ⚠️ Make responsive
- ⚠️ Better state management
- ⚠️ Remove duplicate code


