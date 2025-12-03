# Worldwide Countries Data Guide

## Overview

For worldwide coverage, GADM provides a **single worldwide download** option, which is much more efficient than downloading 200+ countries individually.

---

## 🌍 Option 1: GADM Worldwide Download (RECOMMENDED)

### Download Location:
**Website:** https://gadm.org/download_world.html

### What You Get:
- **Single file** containing all countries worldwide
- All administrative levels (Level 0, 1, 2)
- Format: **GeoPackage** (.gpkg) - more efficient than GeoJSON

### File Size:
- Level 1 (States): ~500MB - 1GB
- Level 2 (Counties): ~2-5GB
- **Large files, but single download instead of 200+ files**

### Advantages:
- ✅ Single download (no manual country-by-country)
- ✅ Consistent data format
- ✅ All countries included
- ✅ More efficient GeoPackage format

### Steps:

1. **Visit:** https://gadm.org/download_world.html

2. **Download Files:**
   - Download **Level 1** (States/Provinces worldwide)
     - File: `gadm_410-levels.gpkg` or similar
   - Download **Level 2** (Counties/Cities worldwide)
     - File: `gadm_410-levels.gpkg` or similar

3. **Save Files:**
   ```
   data/
   └── boundaries/
       ├── gadm_worldwide/
       │   ├── gadm_world_level1.gpkg
       │   └── gadm_world_level2.gpkg
   ```

4. **I'll Use Files Directly:**
   - Load worldwide files directly into Mapbox
   - Convert GeoPackage to format Mapbox can use (if needed)
   - Create layers for Level 1 and Level 2
   - Add country filtering when needed
   - **No extraction needed** - use files as single worldwide layers!

**Time Required:** 30-60 minutes (depends on download speed)

---

## 🌍 Option 2: Individual Country Downloads (Alternative)

If worldwide download doesn't work or you prefer individual files:

### Download Location:
**Website:** https://gadm.org/download_country.html

### Steps:

1. **Get Country List:**
   - GADM has ~250 countries/territories
   - Download each country individually

2. **Download Process:**
   - For each country:
     - Select country from dropdown
     - Download Level 1 (States)
     - Download Level 2 (Counties)
     - Save with naming: `{CODE}_level1.geojson`, `{CODE}_level2.geojson`

3. **File Organization:**
   ```
   data/
   └── boundaries/
       ├── gadm_states/
       │   ├── AFG_level1.geojson  (Afghanistan)
       │   ├── AUS_level1.geojson  (Australia)
       │   ├── BRA_level1.geojson  (Brazil)
       │   ├── ... (250+ files)
       │   └── ZWE_level1.geojson  (Zimbabwe)
       └── gadm_counties/
           ├── AFG_level2.geojson
           ├── AUS_level2.geojson
           ├── ... (250+ files)
           └── ZWE_level2.geojson
   ```

**Time Required:** 8-12 hours (manual work for each country)

**Recommendation:** ⚠️ **NOT RECOMMENDED** - Use Option 1 instead!

---

## 🎯 Recommended Approach

### Step 1: Download Worldwide File (30-60 min)

**Download from:** https://gadm.org/download_world.html

**Files to Download:**
- Level 1 worldwide (States/Provinces)
- Level 2 worldwide (Counties/Cities)

**Save to:**
```
data/boundaries/gadm_worldwide/
├── gadm_world_level1.gpkg
└── gadm_world_level2.gpkg
```

### Step 2: I'll Use Files Directly

**I'll handle:**
- Loading worldwide files directly as Mapbox sources
- Converting format if needed (GeoPackage → GeoJSON or vector tiles)
- Creating layers for Level 1 (States) and Level 2 (Counties)
- Adding country filtering using Mapbox expressions
- Optimizing performance

**No extraction needed!** We'll use the worldwide files as single layers and filter by country when needed.

---

## 📊 File Size Estimates

### Worldwide File (Single Download):
- Level 1: **~500MB - 1GB**
- Level 2: **~2-5GB**

### Individual Countries (If Needed):
- Average Level 1: 1-5MB per country
- Average Level 2: 5-20MB per country
- Total (250 countries): **~250MB - 500MB** (Level 1)
- Total (250 countries): **~1.25GB - 5GB** (Level 2)

**Storage Required:** ~5-10GB for complete worldwide dataset

---

## 🚀 Quick Start: Worldwide Download

### Step-by-Step:

1. **Visit GADM Worldwide Page:**
   ```
   https://gadm.org/download_world.html
   ```

2. **Download Files:**
   - Click "Download Level 1" (States/Provinces)
   - Click "Download Level 2" (Counties/Cities)
   - Wait for downloads (may take 10-30 minutes depending on speed)

3. **Create Folder:**
   ```bash
   mkdir -p data/boundaries/gadm_worldwide
   ```

4. **Move Files:**
   - Move downloaded files to `data/boundaries/gadm_worldwide/`
   - Keep original file names or rename to:
     - `gadm_world_level1.gpkg`
     - `gadm_world_level2.gpkg`

5. **Verify:**
   - Files should be hundreds of MB to several GB
   - File extension should be `.gpkg` (GeoPackage)

6. **Done!**
   - I'll handle all processing automatically
   - Tell me "ready" when files are downloaded

---

## 🔧 Technical Implementation Changes

### What I'll Need to Update:

1. **File Loading:**
   - Support GeoPackage format (.gpkg)
   - Extract individual countries from worldwide file
   - Cache extracted countries

2. **Data Organization:**
   - Create country index from worldwide file
   - Lazy-load countries as needed
   - Optimize file access

3. **Performance:**
   - Only load boundaries user requests
   - Cache frequently used countries
   - Optimize GeoJSON on-the-fly

---

## 📋 Updated Checklist

### For Worldwide Coverage:

- [ ] Visit https://gadm.org/download_world.html
- [ ] Download Level 1 worldwide file (States/Provinces)
- [ ] Download Level 2 worldwide file (Counties/Cities)
- [ ] Create folder: `data/boundaries/gadm_worldwide/`
- [ ] Move downloaded files to folder
- [ ] Verify files are .gpkg format
- [ ] Verify file sizes are reasonable (hundreds of MB to GB)
- [ ] Say "ready" when complete

**Time Required:** 30-60 minutes (mostly download time)

---

## ⚠️ Important Notes

### File Format:
- Worldwide download is **GeoPackage** (.gpkg), not GeoJSON
- This is actually better (more efficient, smaller)
- I'll handle conversion if needed

### File Size:
- Files will be **very large** (GB range)
- Make sure you have disk space (5-10GB)
- Consider download location (good internet connection)

### Processing:
- I'll extract countries from worldwide file
- This may take time initially
- We'll optimize with caching

### Alternative Approach:
- If worldwide file is too large, we can:
  - Use a subset of countries
  - Process on-demand (lazy loading)
  - Use server-side processing

---

## 🎯 Summary

**For Worldwide Coverage:**

1. ✅ Download worldwide files from GADM (30-60 min)
2. ✅ Save to `data/boundaries/gadm_worldwide/`
3. ✅ I'll handle all processing automatically
4. ✅ Much easier than downloading 200+ countries individually!

**Tell me "ready" when files are downloaded!** 🚀

