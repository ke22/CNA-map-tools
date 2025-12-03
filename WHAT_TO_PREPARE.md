# What Mapbox Files You Need to Prepare

## 🎯 Simple Answer

### Best Case: NOTHING! ✅
If you have Mapbox Boundaries access, no files needed.

### Backup Plan: 2 GeoJSON Files
If you don't have access, download GADM and convert to GeoJSON.

---

## ✅ Step 1: Test First (5 minutes)

**Open:** `test-mapbox-sources.html`

**Click:** "Test All Sources"

**Check:** Do adm1 and adm2 sources work?

---

## 📋 Step 2A: If Mapbox Works ✅

**What you need:**
- ✅ **NOTHING!** 
- ✅ Ready to start!

**No files to prepare, no downloads needed.**

---

## 📋 Step 2B: If Mapbox Doesn't Work ❌

**What you need:**

### 1. Download GADM Files (30-60 min)

**From:** https://gadm.org/download_world.html

- Level 1 (States) - ~500MB-1GB
- Level 2 (Counties) - ~2-5GB

**Save to:** `data/boundaries/gadm_worldwide/`

### 2. Convert to GeoJSON (30-60 min)

**Easiest:** Online converter
- Visit: https://mygeodata.cloud/converter/gpkg-to-geojson
- Upload each .gpkg file
- Download .geojson files

**Final files:**
```
data/boundaries/gadm_worldwide/
├── gadm_world_level1.geojson  ← You need this
└── gadm_world_level2.geojson  ← You need this
```

---

## ✅ Quick Checklist

**Test Mapbox:**
- [ ] Open `test-mapbox-sources.html`
- [ ] Test adm1/adm2 sources

**If works:** ✅ DONE! Nothing else needed.

**If doesn't work:**
- [ ] Download GADM Level 1
- [ ] Download GADM Level 2
- [ ] Convert both to GeoJSON
- [ ] Save to `data/boundaries/gadm_worldwide/`

---

## 🚀 Start Here

**First:** Test Mapbox access with `test-mapbox-sources.html`

**Then:** Follow checklist above based on results!

---

**See `PREPARATION_CHECKLIST.md` for detailed instructions.**


