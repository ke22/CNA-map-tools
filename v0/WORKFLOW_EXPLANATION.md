# Map Tool - Workflow and Building Logic Explanation

## Why UK (GBR) Couldn't Be Colored Before

### The Problem: Worldview Filter

The UK couldn't be colored because of **Mapbox's worldview filtering system**.

#### What is Worldview Filter?

Mapbox boundaries data includes a "worldview" property for each country boundary. This is used to handle **disputed territories** - different countries/regions see borders differently.

For example:
- **Taiwan**: Some countries see it as part of China, some see it as independent
- **Kashmir**: Disputed between India, Pakistan, and China
- **Crimea**: Disputed territory

#### How It Works

```javascript
// Mapbox stores boundaries with worldview tags:
{
  country: "UKR",
  worldview: "all"  // or "US", "CN", "EU", etc.
}
```

The worldview can be:
- `"all"` - Recognized by all countries
- `"US"` - US-specific view
- `"CN"` - China-specific view  
- `"AR,JP,MA,RU,TR,US"` - Specific country combinations

#### The Filter Issue

Our code was filtering countries like this:

```javascript
filter: [
    'all',
    ['==', 'iso_3166_1_alpha_3', 'GBR'],  // Match UK
    ['in', 'worldview', 'all', 'JP', 'AR,JP,MA,RU,TR,US', ...]  // Only show if worldview matches
]
```

**Problem**: UK's worldview in Mapbox data might be:
- `"GB"` (Great Britain specific)
- `"EU"` (European view)
- Something else not in our filter list

**Solution**: Disable worldview filter by setting:
```javascript
USE_WORLDVIEW_FILTER: false,
```

This removes the worldview restriction and shows ALL countries regardless of their worldview value.

---

## Tool Workflow and Building Logic

### Overall Architecture

```
┌─────────────────────────────────────────┐
│         User Browser (Client)           │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐      ┌──────────────┐ │
│  │     UI      │─────▶│   Mapbox     │ │
│  │  Controls   │      │   GL JS      │ │
│  └─────────────┘      └──────────────┘ │
│         │                    │          │
│         │                    ▼          │
│         │            ┌──────────────┐   │
│         │            │   Vector     │   │
│         │            │   Tiles      │   │
│         │            │  (Boundaries)│   │
│         │            └──────────────┘   │
│         │                    │          │
│         ▼                    ▼          │
│  ┌─────────────┐      ┌──────────────┐ │
│  │   State     │      │  Geocoding   │ │
│  │ Management  │      │     API      │ │
│  └─────────────┘      └──────────────┘ │
│                                         │
└─────────────────────────────────────────┘
         │                    │
         ▼                    ▼
    ┌─────────┐        ┌─────────────┐
    │ Export  │        │   Mapbox    │
    │ Canvas  │        │   Servers   │
    └─────────┘        └─────────────┘
```

---

### 1. Initialization Flow

```
Page Load
    ↓
DOM Ready Event
    ↓
Check Mapbox Token
    ↓
Initialize Map
    ├── Load Mapbox Style
    ├── Set Center/Zoom
    └── Wait for 'load' event
    ↓
Initialize Country List
    └── Populate datalist dropdown
    ↓
Setup Event Listeners
    ├── Map type selector
    ├── Country input
    ├── Color selector
    ├── Coordinate input
    └── Clear buttons
    ↓
Ready to Use
```

**Code Location**: `js/app.js` lines 7-25

---

### 2. Country Coloring Workflow

```
User Action: Select Country Code (e.g., "GBR")
    ↓
Event Listener Fires (change event)
    ↓
Extract Country Code: "GBR"
    ↓
Validate: Check if in COUNTRY_CODES
    ↓
Toggle Country Layer:
    ├── If already added → Remove
    └── If not added → Add
    ↓
ADD COUNTRY LAYER:
    ├── Check if map source exists
    │   └── If not: Create vector tile source
    ├── Build Filter Expression
    │   ├── Country code match: ['==', 'iso_3166_1_alpha_3', 'GBR']
    │   └── Worldview filter: ['in', 'worldview', ...]
    ├── Add Fill Layer to Map
    │   ├── Layer ID: 'GBR'
    │   ├── Source: 'country-boundaries'
    │   ├── Filter: [country + worldview]
    │   └── Paint: {fill-color, fill-opacity}
    ├── Track in countryLayers array
    └── Zoom to country (optional)
    ↓
Map Renders Colored Country
```

**Code Location**: `js/app.js` lines 224-306

---

### 3. Filter Expression Building Logic

The filter determines which boundaries are shown:

```javascript
// Step 1: Country Code Match
['==', 'iso_3166_1_alpha_3', 'GBR']
// This finds UK in the boundaries data

// Step 2: Worldview Filter (if enabled)
['in', 'worldview', 'all', 'JP', 'US', ...]
// This checks if UK's worldview matches allowed values

// Combined Filter
['all',
  ['==', 'iso_3166_1_alpha_3', 'GBR'],  // Must be UK
  ['in', 'worldview', ...]              // AND worldview must match
]
```

**Why UK Failed Before:**
- UK's worldview was `"GB"` or `"EU"` 
- Our filter only checked: `['all', 'JP', 'US', ...]`
- `"GB"` not in the list → Filter rejected UK → No layer added

**Solution:**
- Set `USE_WORLDVIEW_FILTER: false`
- Filter becomes: `['==', 'iso_3166_1_alpha_3', 'GBR']`
- No worldview check → UK always shows

---

### 4. Vector Tiles vs GeoJSON

#### Why Vector Tiles?

**Old Approach (GeoJSON):**
```javascript
// ❌ BAD: Load huge file
fetch('countries.geojson')  // 50MB file!
  .then(data => addToMap(data))
```

Problems:
- ❌ Slow loading (50MB+ file)
- ❌ Memory intensive
- ❌ Not dynamic (static file)

**New Approach (Vector Tiles):**
```javascript
// ✅ GOOD: Use Mapbox vector tiles
source: {
  type: 'vector',
  url: 'mapbox://mapbox.country-boundaries-v1'
}
```

Benefits:
- ✅ Fast (only loads visible tiles)
- ✅ Dynamic (always latest data)
- ✅ Efficient (tiled, cached)
- ✅ Supports worldview filtering

**How Vector Tiles Work:**
```
Map Request
    ↓
Mapbox Server
    ├── Divides world into tiles (256x256 pixels each)
    ├── Only sends tiles visible in current viewport
    └── Returns compressed vector data
    ↓
Map Renders Only What's Visible
```

---

### 5. Layer Management System

The tool tracks which countries are colored:

```javascript
// State Array
countryLayers = ['TWN', 'USA', 'JPN']

// When adding:
countryLayers.push('GBR')  // Add to tracking

// When removing:
const index = countryLayers.indexOf('GBR')
countryLayers.splice(index, 1)  // Remove from tracking

// Clear all:
countryLayers = []  // Empty array
// Then remove all layers from map
```

**Why Track This?**
- Know which countries are active
- Prevent duplicates
- Easy to clear all at once
- Re-add when switching map types

---

### 6. Color Selection Logic

```javascript
// User selects color radio button
<input type="radio" name="colorselect" value="#004e98" />

// When country is added:
const selectedColor = document.querySelector(
  'input[type=radio][name=colorselect]:checked'
).value;

// Apply to layer:
map.setPaintProperty(countryCode, 'fill-color', selectedColor);
```

**Color Flow:**
1. User clicks radio button → value stored in DOM
2. Country added → Read current radio button value
3. Apply color → Set paint property on layer

---

### 7. Map Type Switching

```
User Clicks "國界版" (Country Boundaries)
    ↓
switchMapType('country')
    ↓
Update currentMapType = 'country'
    ↓
Get Style URL:
    CONFIG.MAPBOX.STYLES['country']
    ↓
Clear All Current Layers
    └── countryLayers.forEach(removeLayer)
    ↓
Change Map Style
    map.setStyle(newStyleUrl)
    ↓
Wait for Style to Load
    map.once('style.load')
    ↓
Re-add All Country Layers
    └── countryLayers.forEach(addLayer)
    ↓
Update Zoom Level
    map.setZoom(4)  // Country view
```

**Code Location**: `js/app.js` lines 163-198

---

### 8. Coordinate Input & Marker System

```
User Input: "25.0330,121.5654"
    ↓
Parse Coordinates
    ├── Split by comma
    ├── Parse as floats
    └── Validate range (-90 to 90, -180 to 180)
    ↓
Update Marker
    └── marker.setLngLat([lng, lat])
    ↓
Zoom Map
    └── map.flyTo({center: [lng, lat], zoom: 13})
```

**Marker Management:**
- Created once at hidden location: `[180, -90]`
- Moved when coordinates entered
- Drawn manually in export (Mapbox markers don't export well)

---

### 9. Export/Download System

```
User Clicks "下載圖檔" (Download)
    ↓
captureMap()
    ↓
Wait for Map to Render
    map.once('render')
    ↓
Create Canvas
    └── Same size as map canvas
    ↓
Draw Map to Canvas
    context.drawImage(map.getCanvas(), ...)
    ↓
Draw Marker Manually
    ├── Get marker coordinates
    ├── Convert to pixel position
    └── Draw circle on canvas
    ↓
Convert to Blob
    canvas.toBlob()
    ↓
Create Download Link
    └── <a> tag with blob URL
    ↓
Trigger Download
    link.click()
    ↓
Clean Up
    URL.revokeObjectURL()
```

**Why Manual Marker Drawing?**
- Mapbox markers don't appear in canvas captures
- Must draw marker manually on canvas for export

**Code Location**: `js/app.js` lines 545-595

---

### 10. Data Flow Diagram

```
┌──────────────┐
│   config.js  │  Configuration & Settings
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  index.html  │  UI Structure
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   app.js     │  Main Application Logic
│              │
│  ┌─────────┐ │
│  │ Map     │ │  Mapbox GL JS Integration
│  │ Init    │ │
│  └─────────┘ │
│              │
│  ┌─────────┐ │
│  │Country  │ │  Country Layer Management
│  │Handler  │ │
│  └─────────┘ │
│              │
│  ┌─────────┐ │
│  │Marker   │ │  Location Marker System
│  │Handler  │ │
│  └─────────┘ │
│              │
│  ┌─────────┐ │
│  │Export   │ │  Image Export System
│  │Handler  │ │
│  └─────────┘ │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│country-codes │  Country Code Mappings
│    .js       │
└──────────────┘
```

---

## Building Logic - Key Design Decisions

### 1. Why Client-Side Only?

- ✅ No backend needed → $0 cost
- ✅ Fast deployment → Just HTML file
- ✅ Easy to share → Just send URL
- ✅ No server maintenance

### 2. Why Vector Tiles Over GeoJSON?

- ✅ Faster loading (tiled approach)
- ✅ Always latest data (Mapbox servers)
- ✅ Smaller memory footprint
- ✅ Better performance

### 3. Why Track Layers in Array?

- ✅ Easy to clear all
- ✅ Prevent duplicates
- ✅ Re-add when switching map types
- ✅ Simple state management

### 4. Why Separate Functions?

- ✅ Modular code
- ✅ Easy to debug
- ✅ Reusable functions
- ✅ Clear separation of concerns

### 5. Why Manual Marker Drawing in Export?

- ✅ Mapbox markers don't export in canvas
- ✅ Full control over appearance
- ✅ Consistent export quality

---

## Summary

### Why UK Couldn't Be Colored:

**Root Cause**: Worldview filter was too restrictive
- UK's worldview: `"GB"` or `"EU"`
- Filter checked: `['all', 'JP', 'US', ...]`
- Mismatch → Filter blocked UK

**Solution**: Disable worldview filter
```javascript
USE_WORLDVIEW_FILTER: false
```

### Tool Workflow:

1. **Init** → Load map, setup UI
2. **User Input** → Country code or coordinates
3. **Processing** → Add layer, apply filter, set color
4. **Render** → Mapbox renders colored boundaries
5. **Export** → Canvas capture with manual marker drawing

### Building Logic:

- **Modular**: Separate functions for each feature
- **Stateful**: Track active layers in array
- **Dynamic**: Vector tiles always latest data
- **Efficient**: Only load what's visible
- **Simple**: No backend, pure client-side

This architecture makes the tool fast, maintainable, and cost-effective!

