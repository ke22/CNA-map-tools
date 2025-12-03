# Quick Conversion Guide

## 🎯 Answer to Your Question

**Q: Can we directly load GeoPackage into Mapbox?**  
**A: ❌ No, but ✅ Convert to GeoJSON first - it's simple!**

---

## ✅ Simplest Solution

### Step 1: Download GADM Files
Visit: https://gadm.org/download_world.html
- Download Level 1 (States/Provinces)
- Download Level 2 (Counties/Cities)

### Step 2: Convert Online (Easiest!)
Visit: https://mygeodata.cloud/converter/gpkg-to-geojson
- Upload Level 1 .gpkg → Download .geojson
- Upload Level 2 .gpkg → Download .geojson

### Step 3: Save Files
```
data/boundaries/gadm_worldwide/
├── gadm_world_level1.geojson  ← Save here
└── gadm_world_level2.geojson  ← Save here
```

### Step 4: Done!
Say "ready" and I'll load them into Mapbox! ✅

---

## 🔧 Alternative: Command Line (If You Have GDAL)

```bash
# Install GDAL (macOS)
brew install gdal

# Convert files
ogr2ogr -f GeoJSON data/boundaries/gadm_worldwide/gadm_world_level1.geojson data/boundaries/gadm_worldwide/gadm_world_level1.gpkg

ogr2ogr -f GeoJSON data/boundaries/gadm_worldwide/gadm_world_level2.geojson data/boundaries/gadm_worldwide/gadm_world_level2.gpkg
```

---

## ✅ Summary

1. Download .gpkg files from GADM
2. Convert to .geojson (online converter is easiest)
3. Save to project folder
4. I'll load them into Mapbox!

**Mapbox supports GeoJSON natively - works perfectly!** 🚀

---

**See `CONVERSION_OPTIONS.md` for more details.**


