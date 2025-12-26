# Conversion Options - Quick Reference

## Question: How to get GADM files into Mapbox?

**Answer:** Convert GeoPackage → GeoJSON, then load into Mapbox.

---

## 🎯 Simplest Option: Online Converter

### Step 1: Download GADM Files
- Visit: https://gadm.org/download_world.html
- Download Level 1 and Level 2 (.gpkg files)

### Step 2: Convert Online
- Visit: https://mygeodata.cloud/converter/gpkg-to-geojson
- Upload .gpkg file
- Download .geojson file
- Repeat for both files

### Step 3: Save to Project
```
data/boundaries/gadm_worldwide/
├── gadm_world_level1.geojson  ← Converted from .gpkg
└── gadm_world_level2.geojson  ← Converted from .gpkg
```

**Time:** 30-60 minutes (download + conversion)

---

## 🚀 Automated Option: Conversion Script

I can create a Node.js script that:
- Reads your .gpkg files
- Converts to GeoJSON
- Optionally simplifies (reduces file size)
- Saves to correct location

**Would you like me to create this?**

---

## ⚡ Command Line Option: GDAL

If you have GDAL installed:

```bash
# Install GDAL (macOS)
brew install gdal

# Convert Level 1
ogr2ogr -f GeoJSON gadm_world_level1.geojson gadm_world_level1.gpkg

# Convert Level 2
ogr2ogr -f GeoJSON gadm_world_level2.geojson gadm_world_level2.gpkg

# With simplification (smaller files)
ogr2ogr -f GeoJSON -simplify 0.0001 gadm_world_level1.geojson gadm_world_level1.gpkg
```

---

## ✅ Recommended: Online Converter

**Why:**
- No installation needed
- Easy to use
- Works immediately

**Just convert the 2 files and save as .geojson!**

---

**See `MAPBOX_INTEGRATION_OPTIONS.md` for detailed technical information.**


