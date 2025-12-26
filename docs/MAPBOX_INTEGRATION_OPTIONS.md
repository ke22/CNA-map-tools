# Mapbox Integration Options for GADM Worldwide Files

## Question: Can we directly load GeoPackage files into Mapbox?

**Short Answer:** No, Mapbox GL JS doesn't support GeoPackage (.gpkg) directly, but we have several good options.

---

## ✅ Recommended Approaches

### Option 1: Convert to GeoJSON (Best for Client-Side)

**How:**
1. Convert GeoPackage → GeoJSON (one-time conversion)
2. Load GeoJSON directly into Mapbox GL JS
3. Filter by country using Mapbox expressions

**Pros:**
- ✅ Direct Mapbox support (native)
- ✅ No server needed
- ✅ Works with client-side filtering
- ✅ Simple implementation

**Cons:**
- ⚠️ File size larger (GeoJSON is bigger than GeoPackage)
- ⚠️ May need simplification for web

**Implementation:**
```javascript
// Load GeoJSON directly
map.addSource('world-level1', {
    type: 'geojson',
    data: 'data/boundaries/gadm_worldwide/gadm_world_level1.geojson'
});

// Add layer
map.addLayer({
    id: 'world-states',
    type: 'fill',
    source: 'world-level1',
    paint: {
        'fill-color': '#004e98',
        'fill-opacity': 0.5
    },
    filter: ['==', ['get', 'GID_0'], 'TWN'] // Filter by country
});
```

**Tools for Conversion:**
- GDAL (command line): `ogr2ogr -f GeoJSON output.geojson input.gpkg`
- Online: https://mygeodata.cloud/converter/gpkg-to-geojson
- Node.js: `@mapbox/togeojson` or `ogr2ogr` via `node-ogr2ogr`

---

### Option 2: Convert to Vector Tiles (Best for Performance)

**How:**
1. Convert GeoPackage → Vector Tiles (MBTiles)
2. Upload to Mapbox as custom tileset
3. Use as Mapbox vector source

**Pros:**
- ✅ Best performance (tiled, optimized)
- ✅ Scales to large datasets
- ✅ Same format as current country boundaries
- ✅ Efficient filtering

**Cons:**
- ⚠️ Requires Mapbox account (upload tileset)
- ⚠️ Conversion takes time
- ⚠️ Need to update tileset for data changes

**Implementation:**
```javascript
// After uploading to Mapbox, use as vector source
map.addSource('world-level1', {
    type: 'vector',
    url: 'mapbox://your-username.world-level1-tileset'
});

map.addLayer({
    id: 'world-states',
    type: 'fill',
    source: 'world-level1',
    'source-layer': 'gadm', // Layer name in tileset
    paint: {
        'fill-color': '#004e98',
        'fill-opacity': 0.5
    },
    filter: ['==', ['get', 'GID_0'], 'TWN']
});
```

**Tools for Conversion:**
- Tippecanoe: `tippecanoe -o output.mbtiles input.geojson`
- Mapbox Tiling Service (MTS)
- Mapbox Studio (upload GeoJSON, auto-converts)

---

### Option 3: Client-Side GeoPackage Reader (Advanced)

**How:**
1. Use JavaScript library to read GeoPackage in browser
2. Extract features as GeoJSON on-the-fly
3. Load into Mapbox

**Pros:**
- ✅ Keep original GeoPackage format
- ✅ No pre-conversion needed
- ✅ Can load specific countries only

**Cons:**
- ⚠️ Requires JavaScript library (larger bundle size)
- ⚠️ Slower than pre-converted GeoJSON
- ⚠️ More complex implementation

**Libraries:**
- `@ngageoint/geopackage-js` - Browser GeoPackage reader
- `sql.js` + custom GeoPackage parser

---

## 🎯 Recommended Approach for Your Use Case

### Phase 1: Start with GeoJSON (Simplest)

**Why:**
- Fastest to implement
- No additional tools/services needed
- Works immediately
- Can optimize later

**Steps:**
1. Convert GADM GeoPackage → GeoJSON (one-time)
2. Optionally simplify GeoJSON for web
3. Load directly into Mapbox
4. Use Mapbox expressions for filtering

### Phase 2: Optimize to Vector Tiles (If Needed)

**Why:**
- Better performance for large datasets
- Matches current country boundaries approach
- More efficient

**Steps:**
1. Convert GeoJSON → Vector Tiles
2. Upload to Mapbox account
3. Use as vector source

---

## 📋 Implementation Plan

### Immediate: GeoJSON Approach

**What You Do:**
1. Download GADM worldwide files (.gpkg)
2. Convert to GeoJSON (see tools below)
3. Save to `data/boundaries/gadm_worldwide/`

**What I'll Build:**
1. GeoJSON loader for Mapbox
2. Layer management (Level 1, Level 2)
3. Country filtering using Mapbox expressions
4. Boundary type switching

### Conversion Script (I'll Create)

I can create a simple Node.js script to:
- Convert .gpkg → .geojson
- Optionally simplify GeoJSON (reduce file size)
- Split by level if needed
- Output ready-to-use files

---

## 🔧 Conversion Tools

### Option A: Online Converter (Easiest)

**Website:** https://mygeodata.cloud/converter/gpkg-to-geojson

**Steps:**
1. Upload .gpkg file
2. Select GeoJSON output
3. Download converted file
4. Save to project

**Limitations:**
- File size limits (may need to split)
- Online processing

### Option B: GDAL Command Line (Best)

**Install GDAL:**
```bash
# macOS
brew install gdal

# Windows
# Download from: https://gdal.org/download.html
```

**Convert:**
```bash
# Convert Level 1
ogr2ogr -f GeoJSON gadm_world_level1.geojson gadm_world_level1.gpkg

# Convert Level 2
ogr2ogr -f GeoJSON gadm_world_level2.geojson gadm_world_level2.gpkg

# With simplification (smaller file)
ogr2ogr -f GeoJSON -simplify 0.0001 gadm_world_level1_simplified.geojson gadm_world_level1.gpkg
```

### Option C: I'll Create Conversion Script

I can create a Node.js script that:
- Reads GeoPackage files
- Converts to GeoJSON
- Optionally simplifies
- Saves to correct location

**Would you like me to create this script?**

---

## 🚀 Recommended Workflow

### Step 1: Download (You)
- Download GADM worldwide files (.gpkg)

### Step 2: Convert (You or I)
- **Option A:** Use online converter (you)
- **Option B:** Use GDAL command line (you)
- **Option C:** I create conversion script (automated)

### Step 3: Implementation (I'll Do)
- Build Mapbox integration
- Add layer management
- Add filtering
- Optimize performance

---

## 💡 Best Practice Recommendation

**For Your Use Case:**

1. **Start:** Convert to GeoJSON, use directly
   - Simplest approach
   - Works immediately
   - Good performance for most cases

2. **Optimize Later:** If needed, convert to vector tiles
   - Only if GeoJSON is too slow
   - Better for very large datasets
   - Requires Mapbox account upload

3. **Smart Loading:**
   - Load Level 1 and Level 2 separately
   - Lazy load (only when user selects boundary type)
   - Use Mapbox expressions for country filtering

---

## ✅ Summary

**Can we directly load GeoPackage?** ❌ No, Mapbox doesn't support it natively.

**Best Solution:** ✅ Convert to GeoJSON first (one-time conversion), then load directly into Mapbox.

**Conversion Options:**
1. Online converter (easiest)
2. GDAL command line (best quality)
3. Node.js script (automated - I can create)

**Would you like me to:**
- Create a conversion script for you?
- Set up the GeoJSON loading in the code?
- Help you choose the best conversion method?

---

**Recommendation: Convert to GeoJSON (one-time), then load directly into Mapbox. Simple and effective!** ✅


