# Preparation Checklist - What You Need to Prepare

## 🎯 Quick Answer

**It depends on whether you have Mapbox Boundaries access!**

---

## ✅ Option 1: If You Have Mapbox Boundaries Access (Best Case)

### What You Need:
**NOTHING!** ✅

Just test if these sources work:
- `mapbox://mapbox.boundaries-adm1-v3` (states/provinces)
- `mapbox://mapbox.boundaries-adm2-v3` (counties/cities)

**If they work:**
- ✅ No files to prepare
- ✅ No downloads needed
- ✅ Ready to start!

**Test:** Open `test-mapbox-sources.html` in browser

---

## ⚠️ Option 2: If You DON'T Have Mapbox Boundaries Access

### What You Need to Prepare:

#### Step 1: Download GADM Worldwide Files (30-60 minutes)

**Website:** https://gadm.org/download_world.html

**Download:**
1. **Level 1** (States/Provinces worldwide)
   - Size: ~500MB - 1GB
   - Format: GeoPackage (.gpkg)
   - File: `gadm_world_level1.gpkg` (or similar name)

2. **Level 2** (Counties/Cities worldwide)
   - Size: ~2-5GB
   - Format: GeoPackage (.gpkg)
   - File: `gadm_world_level2.gpkg` (or similar name)

**Save to:**
```
data/boundaries/gadm_worldwide/
├── gadm_world_level1.gpkg  ← Download here
└── gadm_world_level2.gpkg  ← Download here
```

#### Step 2: Convert to GeoJSON (30-60 minutes)

**Method 1: Online Converter (Easiest)**
1. Visit: https://mygeodata.cloud/converter/gpkg-to-geojson
2. Upload Level 1 .gpkg file → Download .geojson
3. Upload Level 2 .gpkg file → Download .geojson

**Method 2: Command Line (If you have GDAL)**
```bash
# Install GDAL (macOS)
brew install gdal

# Convert Level 1
ogr2ogr -f GeoJSON data/boundaries/gadm_worldwide/gadm_world_level1.geojson data/boundaries/gadm_worldwide/gadm_world_level1.gpkg

# Convert Level 2
ogr2ogr -f GeoJSON data/boundaries/gadm_worldwide/gadm_world_level2.geojson data/boundaries/gadm_worldwide/gadm_world_level2.gpkg
```

**Method 3: I Can Create Conversion Script**
- Let me know if you want an automated script!

**Final Files Needed:**
```
data/boundaries/gadm_worldwide/
├── gadm_world_level1.geojson  ← Converted file
└── gadm_world_level2.geojson  ← Converted file
```

---

## 📋 Complete Preparation Checklist

### First: Test Mapbox Access

- [ ] Open `test-mapbox-sources.html` in browser
- [ ] Click "Test All Sources"
- [ ] Check if adm1 and adm2 sources work

### If Mapbox Sources Work ✅

- [ ] Nothing else needed!
- [ ] Ready to start implementation

### If Mapbox Sources DON'T Work ❌

#### Download GADM Files:
- [ ] Visit https://gadm.org/download_world.html
- [ ] Download Level 1 file (States/Provinces)
- [ ] Download Level 2 file (Counties/Cities)
- [ ] Save to `data/boundaries/gadm_worldwide/`

#### Convert to GeoJSON:
- [ ] Convert Level 1 .gpkg → .geojson
- [ ] Convert Level 2 .gpkg → .geojson
- [ ] Save .geojson files to `data/boundaries/gadm_worldwide/`

#### Verify:
- [ ] Files are .geojson format (not .gpkg)
- [ ] Files are in correct location
- [ ] Files can be opened in text editor (should be JSON)

---

## ✅ What You DON'T Need to Prepare

- ❌ No Mapbox token changes needed (already set)
- ❌ No code files to create (I'll do that)
- ❌ No folder structure to create (I'll create automatically)
- ❌ No other data sources needed

---

## 🚀 Recommended Workflow

### Step 1: Test First (5 minutes)
1. Open `test-mapbox-sources.html`
2. Test Mapbox Boundaries access
3. See results

### Step 2A: If Mapbox Works ✅
- ✅ Done! Ready to start.
- ✅ No files needed.

### Step 2B: If Mapbox Doesn't Work ❌
1. Download GADM files (30-60 min)
2. Convert to GeoJSON (30-60 min)
3. Save to project folder
4. Ready to start!

---

## 📁 Final File Structure

### If Using Mapbox Boundaries:
```
✅ No additional files needed!
```

### If Using GADM Data:
```
data/
└── boundaries/
    └── gadm_worldwide/
        ├── gadm_world_level1.geojson  ← You prepare this
        └── gadm_world_level2.geojson  ← You prepare this
```

---

## ⏰ Time Estimates

### Option 1: Mapbox Access (Best Case)
- **Time:** 5 minutes (just test)
- **Files:** None needed ✅

### Option 2: GADM Data
- **Download:** 30-60 minutes
- **Conversion:** 30-60 minutes
- **Total:** 1-2 hours
- **Files:** 2 GeoJSON files

---

## 💡 Quick Decision Tree

```
Start
  ↓
Test Mapbox access (test-mapbox-sources.html)
  ↓
  ├─ Works? → ✅ DONE! No files needed.
  │
  └─ Doesn't work? → Download GADM files
                      ↓
                      Convert to GeoJSON
                      ↓
                      ✅ DONE! Ready to start.
```

---

## ✅ Summary

**What to prepare:**

**Best Case (Mapbox access):**
- ✅ Nothing! Just test access.

**Backup Plan (GADM data):**
- Download 2 GADM files (.gpkg)
- Convert to 2 GeoJSON files
- Save to `data/boundaries/gadm_worldwide/`

**First step:** Open `test-mapbox-sources.html` and test! 🚀

---

## 🆘 Need Help?

**Stuck on any step?**
- Check `CONVERSION_OPTIONS.md` for conversion help
- Check `MAPBOX_SOURCES_ANSWER.md` for Mapbox info
- Ask me questions!

**Ready when you are!** ✅


