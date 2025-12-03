# Solution: Extract Levels from Your File

## 🎯 **Good News!**

You already have the GADM data! The file `gadm_410.gpkg` contains **ALL levels** (356,508 features).

We just need to **extract** the 3 levels into separate files.

---

## 🚀 **Quick Solution**

### **Step 1: Extract Levels**

```bash
bash scripts/extract-levels.sh
```

This will:
- ✅ Extract Level 0 (Countries) → `gadm_level0.gpkg`
- ✅ Extract Level 1 (States) → `gadm_level1.gpkg`
- ✅ Extract Level 2 (Cities) → `gadm_level2.gpkg`

**Time:** 10-30 minutes (depending on file size)

---

### **Step 2: Convert to GeoJSON**

After extraction, run:

```bash
node scripts/convert-gadm.js
```

This will:
- ✅ Convert .gpkg → .geojson
- ✅ Optimize file sizes
- ✅ Ready for hosting!

---

### **Step 3: Host Files**

Use local server:

```bash
python3 -m http.server 8000
```

Or use the script:

```bash
bash start-server.sh
```

---

## ✅ **What This Means**

**Before:**
- ❌ Script couldn't find `gadm_level0.gpkg`, etc.
- ✅ But you have the data in `gadm_410.gpkg`!

**After extraction:**
- ✅ All 3 level files will exist
- ✅ Conversion script will work
- ✅ Everything ready to go!

---

## 📋 **Complete Workflow**

```bash
# 1. Extract levels (10-30 min)
bash scripts/extract-levels.sh

# 2. Convert to GeoJSON (30-60 min)
node scripts/convert-gadm.js

# 3. Start local server (for testing)
bash start-server.sh

# 4. Tell me when ready - I'll update the code!
```

---

**Run the extraction script now: `bash scripts/extract-levels.sh`** 🚀


