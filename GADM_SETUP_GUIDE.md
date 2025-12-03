# GADM Setup Guide - Complete Step-by-Step

## 🎯 Goal
Replace Mapbox Boundaries (paid) with GADM data (FREE) for state/city boundaries.

---

## Step 1: Download GADM Files ⏱️ 30-60 min

### Option A: Download Worldwide Files (Recommended)

1. **Go to GADM Website:**
   ```
   https://gadm.org/download_world.html
   ```

2. **Download Files:**
   - **Level 0** (Countries): Click "Level 0" → Download GeoPackage (.gpkg)
   - **Level 1** (States/Provinces): Click "Level 1" → Download GeoPackage (.gpkg)
   - **Level 2** (Cities/Counties): Click "Level 2" → Download GeoPackage (.gpkg)

3. **Save Files:**
   - Create folder: `data/gadm/`
   - Save files as:
     - `gadm_level0.gpkg` (~50 MB)
     - `gadm_level1.gpkg` (~200 MB)
     - `gadm_level2.gpkg` (~500 MB)

**Total download time:** 30-60 minutes (depending on internet speed)

---

## Step 2: Install Conversion Tools ⏱️ 10 min

### Install GDAL (for conversion)

**Mac (using Homebrew):**
```bash
brew install gdal
```

**Windows:**
- Download from: https://www.lfd.uci.edu/~gohlke/pythonlibs/#gdal
- Or use Anaconda: `conda install gdal`

**Linux:**
```bash
sudo apt-get install gdal-bin
```

**Verify installation:**
```bash
ogr2ogr --version
```

---

## Step 3: Convert to GeoJSON ⏱️ 30-60 min

### Use the conversion script:

I'll create a script for you! Run:
```bash
node scripts/convert-gadm.js
```

**Or manually convert:**

```bash
# Convert Level 0 (Countries)
ogr2ogr -f GeoJSON data/gadm/gadm_level0.geojson data/gadm/gadm_level0.gpkg

# Convert Level 1 (States)
ogr2ogr -f GeoJSON data/gadm/gadm_level1.geojson data/gadm/gadm_level1.gpkg

# Convert Level 2 (Cities)
ogr2ogr -f GeoJSON data/gadm/gadm_level2.geojson data/gadm/gadm_level2.gpkg
```

**Note:** GeoJSON files will be LARGE (500MB - 2GB each). We'll optimize them next.

---

## Step 4: Optimize for Web ⏱️ 30-60 min

### Option A: Simplify Geometry (Recommended)

Use `mapshaper` to reduce file size:

**Install mapshaper:**
```bash
npm install -g mapshaper
```

**Simplify files:**
```bash
# Simplify Level 0 (countries) - reduce to 50% detail
mapshaper data/gadm/gadm_level0.geojson -simplify 50% -o data/gadm/gadm_level0_optimized.geojson

# Simplify Level 1 (states) - reduce to 30% detail  
mapshaper data/gadm/gadm_level1.geojson -simplify 30% -o data/gadm/gadm_level1_optimized.geojson

# Simplify Level 2 (cities) - reduce to 20% detail
mapshaper data/gadm/gadm_level2.geojson -simplify 20% -o data/gadm/gadm_level2_optimized.geojson
```

**File size reduction:** 70-90% smaller, still looks good for maps!

### Option B: Create Mapbox Vector Tiles (Advanced)

For even better performance, create vector tiles:
```bash
# Install tippecanoe
brew install tippecanoe  # Mac
# Or download from: https://github.com/mapbox/tippecanoe

# Create tiles
tippecanoe -o data/gadm/gadm_level0.mbtiles data/gadm/gadm_level0_optimized.geojson
tippecanoe -o data/gadm/gadm_level1.mbtiles data/gadm/gadm_level1_optimized.geojson
tippecanoe -o data/gadm/gadm_level2.mbtiles data/gadm/gadm_level2_optimized.geojson
```

---

## Step 5: Host Files ⏱️ 15 min

### Option A: GitHub Pages (Easiest)

1. **Create GitHub repository** (if you don't have one)
2. **Upload optimized GeoJSON files** to `data/gadm/` folder
3. **Enable GitHub Pages** in repository settings
4. **Files will be available at:**
   ```
   https://[username].github.io/[repo]/data/gadm/gadm_level0_optimized.geojson
   ```

### Option B: Netlify (Fast CDN)

1. **Create `netlify.toml`** in project root
2. **Deploy folder** with GeoJSON files
3. **Netlify auto-hosts** with CDN

### Option C: Local Testing

For development, use a local server:
```bash
# Python
python3 -m http.server 8000

# Node.js
npx http-server -p 8000
```

---

## Step 6: Update Code ⏱️ 30 min

I'll update the code to:
1. Load GADM GeoJSON files instead of Mapbox Boundaries
2. Keep the same UI/UX
3. Work with all three boundary levels

**See:** `js/app-gadm.js` (will be created)

---

## ⏱️ **Total Time Breakdown**

| Step | Time | Status |
|------|------|--------|
| 1. Download GADM | 30-60 min | You do this |
| 2. Install tools | 10 min | You do this |
| 3. Convert to GeoJSON | 30-60 min | Script helps |
| 4. Optimize files | 30-60 min | Script helps |
| 5. Host files | 15 min | You do this |
| 6. Update code | 30 min | I'll do this |

**Total:** 2-3 hours

---

## 📝 Checklist

- [ ] Step 1: Download GADM files
- [ ] Step 2: Install GDAL
- [ ] Step 3: Convert to GeoJSON
- [ ] Step 4: Optimize files
- [ ] Step 5: Host files
- [ ] Step 6: Update code (I'll do this)

---

**Let me know when you've completed Steps 1-5, and I'll update the code!** 🚀


