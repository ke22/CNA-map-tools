# GADM Download Instructions

## 📥 What You Need to Do

The conversion script ran, but it couldn't find the GADM files. **You need to download them first!**

---

## 🎯 Step-by-Step Download

### Step 1: Go to GADM Website

**Open in browser:**
```
https://gadm.org/download_world.html
```

### Step 2: Download 3 Files

You need to download **Level 0, Level 1, and Level 2**:

1. **Level 0 (Countries)**
   - Click the "Level 0" download button
   - Choose **"GeoPackage"** format (.gpkg)
   - Save the file

2. **Level 1 (States/Provinces)**
   - Click the "Level 1" download button
   - Choose **"GeoPackage"** format (.gpkg)
   - Save the file

3. **Level 2 (Cities/Counties)**
   - Click the "Level 2" download button
   - Choose **"GeoPackage"** format (.gpkg)
   - Save the file

---

## 💾 Where to Save Files

**Save all 3 files to this folder:**
```
/Users/yulincho/Documents/GitHub/map/data/gadm/
```

**File names must be exactly:**
- `gadm_level0.gpkg`
- `gadm_level1.gpkg`
- `gadm_level2.gpkg`

---

## ✅ After Downloading

Once files are downloaded:

1. **Verify files are in the right place:**
   ```bash
   ls -lh /Users/yulincho/Documents/GitHub/map/data/gadm/*.gpkg
   ```
   
   You should see 3 files with sizes like:
   - gadm_level0.gpkg (~50 MB)
   - gadm_level1.gpkg (~200 MB)
   - gadm_level2.gpkg (~500 MB)

2. **Run conversion again:**
   ```bash
   node scripts/convert-gadm.js
   ```

---

## ⏱️ Download Time

- **Level 0:** ~50 MB (5-10 minutes)
- **Level 1:** ~200 MB (15-30 minutes)
- **Level 2:** ~500 MB (30-60 minutes)

**Total time:** 50-100 minutes depending on internet speed

---

## 🎯 Quick Summary

**What the error means:**
- ❌ Script ran but found no `.gpkg` files
- ✅ Script is working correctly
- ✅ You just need to download the files first!

**What to do:**
1. Download 3 files from https://gadm.org/download_world.html
2. Save them to `/Users/yulincho/Documents/GitHub/map/data/gadm/`
3. Name them: `gadm_level0.gpkg`, `gadm_level1.gpkg`, `gadm_level2.gpkg`
4. Run conversion script again

---

**After downloading, tell me and I'll help with the next step!** 🚀


