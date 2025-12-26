# Manual Tasks Guide - Step by Step

## Quick Reference: What You Need To Do

### ✅ BEFORE DEVELOPMENT STARTS

1. **Verify Mapbox Token** (5 minutes)
   - Check config.js has valid token
   - Test current tool works

2. **Download GADM Boundary Data** (30-60 minutes)
   - Download Taiwan data (required)
   - Download other countries (as needed)
   - See detailed instructions below

3. **Organize Files** (5 minutes)
   - Create folders
   - Place files correctly

---

## 📥 Detailed Instructions

### Step 1: Download GADM Data (REQUIRED)

#### What is GADM?
GADM = Global Administrative Areas
- Free boundary data for all countries
- Multiple administrative levels
- GeoJSON format

#### Where to Download:
**Website:** https://gadm.org/download_country.html

#### Step-by-Step:

**1. Go to GADM Website**
```
https://gadm.org/download_country.html
```

**2. Select Country:**
- Use dropdown to select country (e.g., "Taiwan")
- Or browse by region

**3. Choose Format:**
- Select **"GeoJSON"** (NOT Shapefile)

**4. Download Files:**
- Download **Level 1** (States/Provinces)
  - File name will be like: `gadm41_TWN_1.json`
- Download **Level 2** (Counties/Cities)
  - File name will be like: `gadm41_TWN_2.json`

**5. Rename Files (Optional but Recommended):**
```
gadm41_TWN_1.json  →  TWN_level1.geojson
gadm41_TWN_2.json  →  TWN_level2.geojson
```

**6. Repeat for Other Countries:**
- USA: Download USA_level1.geojson, USA_level2.geojson
- China: Download CHN_level1.geojson, CHN_level2.geojson
- etc.

#### File Size Guidelines:

**Acceptable Sizes:**
- Level 1: 1-10MB ✅
- Level 2: 5-25MB ✅

**Too Large (Need Simplification):**
- Level 1: >50MB ⚠️
- Level 2: >100MB ⚠️

**If files are too large:**
- We'll simplify them during implementation
- Or use pre-simplified versions if available

---

### Step 2: Create Folder Structure

**Option A: I'll Create It Automatically**
- Code will create folders if missing
- You just need files

**Option B: You Create Manually**

Run these commands in terminal:

```bash
cd /Users/yulincho/Documents/GitHub/map
mkdir -p data/boundaries/gadm_states
mkdir -p data/boundaries/gadm_counties
mkdir -p data/rivers
```

---

### Step 3: Place Files

**Copy downloaded files to:**

```
data/boundaries/gadm_states/
  └── TWN_level1.geojson
  └── USA_level1.geojson (if you downloaded)
  └── ...

data/boundaries/gadm_counties/
  └── TWN_level2.geojson
  └── USA_level2.geojson (if you downloaded)
  └── ...
```

**Verify files are there:**
```bash
ls -lh data/boundaries/gadm_states/
ls -lh data/boundaries/gadm_counties/
```

---

### Step 4: Verify File Format

**Check file is valid GeoJSON:**

Open file in text editor - first few lines should look like:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "...",
        ...
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[...]]
      }
    }
  ]
}
```

**If file doesn't open or looks wrong:**
- Re-download from GADM
- Make sure format is GeoJSON (not Shapefile)

---

## 🎯 Minimum Required Downloads

### For Basic Functionality:

**Required:**
- ✅ Taiwan Level 1 (States/Provinces)
- ✅ Taiwan Level 2 (Counties/Cities)

**File names:**
- `TWN_level1.geojson`
- `TWN_level2.geojson`

**Location:**
- `data/boundaries/gadm_states/TWN_level1.geojson`
- `data/boundaries/gadm_counties/TWN_level2.geojson`

---

## 📋 Checklist

### Before Development:

- [ ] Mapbox token verified
- [ ] GADM website visited
- [ ] Taiwan Level 1 downloaded
- [ ] Taiwan Level 2 downloaded
- [ ] Files renamed (optional)
- [ ] Files placed in correct folders
- [ ] Files verified (can open in text editor)

### Optional (Can Do Later):

- [ ] Additional countries downloaded
- [ ] River data downloaded (if needed)
- [ ] Files simplified (if too large)

---

## 🆘 Troubleshooting

### Problem: Files Won't Download
**Solution:**
- Try different browser
- Check internet connection
- Try direct download link

### Problem: Files Are Too Large
**Solution:**
- Use as-is initially
- We'll optimize during implementation
- Or download pre-simplified versions

### Problem: Can't Find Files
**Solution:**
- Check Downloads folder
- Search for "gadm" or "TWN"
- Verify file extension is `.json` or `.geojson`

### Problem: Wrong File Format
**Solution:**
- Make sure you selected "GeoJSON" not "Shapefile"
- Re-download if needed

---

## 📞 When You're Ready

Once you have:
1. ✅ Mapbox token (likely already done)
2. ✅ Taiwan GADM data downloaded and in place

**Say "ready" and I'll start building!** 🚀

---

## 🔄 Alternative: I Can Help You Download

If you want, I can:
1. Provide exact download links
2. Guide you through the process
3. Help verify files are correct

Just ask!


