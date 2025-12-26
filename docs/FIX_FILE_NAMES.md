# Fix: File Name Issue

## 🔍 **What I Found**

You have a file called:
- `gadm_410.gpkg` (2.6 GB)

But the script is looking for:
- `gadm_level0.gpkg`
- `gadm_level1.gpkg`  
- `gadm_level2.gpkg`

---

## 💡 **Two Possibilities**

### **Option 1: File Contains All Levels**

The `gadm_410.gpkg` file might contain all three levels (country, state, city) in one file!

**If so, we can:**
1. Extract each level from this file
2. Save them as separate files with correct names
3. Then convert them

### **Option 2: Wrong File Downloaded**

You might have downloaded a single combined file instead of separate level files.

**If so:**
1. Need to download the 3 separate level files
2. Or extract levels from this file

---

## 🛠️ **Solution: Extract Levels from Existing File**

If the file contains all levels, we can extract them:

```bash
# Extract Level 0 (Countries)
ogr2ogr -f GPKG data/gadm/gadm_level0.gpkg data/gadm/gadm_410.gpkg -sql "SELECT * FROM gadm_410 WHERE level = 0"

# Extract Level 1 (States)
ogr2ogr -f GPKG data/gadm/gadm_level1.gpkg data/gadm/gadm_410.gpkg -sql "SELECT * FROM gadm_410 WHERE level = 1"

# Extract Level 2 (Cities)
ogr2ogr -f GPKG data/gadm/gadm_level2.gpkg data/gadm/gadm_410.gpkg -sql "SELECT * FROM gadm_410 WHERE level = 2"
```

**OR** if layers are named differently:

```bash
# Check what layers exist first
ogrinfo -al -so data/gadm/gadm_410.gpkg

# Then extract based on layer names
# (Common names: gadm_410_0, gadm_410_1, gadm_410_2 or similar)
```

---

## 🎯 **Quick Fix: Rename If It's Already Level 0**

If `gadm_410.gpkg` is actually Level 0 data, you can rename it:

```bash
cp data/gadm/gadm_410.gpkg data/gadm/gadm_level0.gpkg
```

But you'll still need Level 1 and Level 2 files.

---

## ✅ **Recommended: Check File First**

Let me help you check what's in the file, then we can extract the levels!

**Tell me what you see when we check the file contents, and I'll help extract the right levels!**


