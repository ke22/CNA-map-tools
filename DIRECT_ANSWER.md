# Direct Answer: Can Mapbox Load GeoPackage Directly?

## ❌ No, Mapbox GL JS doesn't support GeoPackage (.gpkg) directly

---

## ✅ Solution: Convert to GeoJSON First

### Simple Workflow:

1. **Download** GADM files (.gpkg format)
2. **Convert** to GeoJSON (one-time conversion)
3. **Load** GeoJSON directly into Mapbox

---

## 🚀 Easiest Method: Online Converter

### Step 1: Download GADM Files
- Visit: https://gadm.org/download_world.html
- Download Level 1 and Level 2 (.gpkg files)

### Step 2: Convert to GeoJSON
- Visit: https://mygeodata.cloud/converter/gpkg-to-geojson
- Upload each .gpkg file
- Download converted .geojson files

### Step 3: Save to Project
```
data/boundaries/gadm_worldwide/
├── gadm_world_level1.geojson  ← Converted
└── gadm_world_level2.geojson  ← Converted
```

**Time:** ~30-60 minutes total

---

## 💡 What I'll Do

Once you have the GeoJSON files, I'll:

1. ✅ Load them directly into Mapbox (native support)
2. ✅ Create layers for Level 1 and Level 2
3. ✅ Add country filtering
4. ✅ Optimize performance

**Mapbox supports GeoJSON natively - no special setup needed!**

---

## 🔧 Alternative: Automated Conversion Script

**Want me to create a script?**
- I can create a Node.js script
- Automatically converts .gpkg → .geojson
- Saves to correct location
- Just run: `node convert-gpkg.js`

**Should I create this script for you?**

---

## ✅ Summary

**Question:** Can Mapbox load GeoPackage directly?
**Answer:** ❌ No, but ✅ GeoJSON works perfectly!

**What to do:**
1. Download .gpkg files
2. Convert to .geojson (online converter is easiest)
3. Save to `data/boundaries/gadm_worldwide/`
4. Say "ready" - I'll load them into Mapbox!

---

**See `CONVERSION_OPTIONS.md` for detailed conversion methods.**


