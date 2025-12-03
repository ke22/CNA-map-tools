# Manual Tasks Checklist - Quick Copy/Paste

## ✅ Pre-Development Checklist

Copy and check off as you complete:

```
[ ] STEP 1: Mapbox Token
    [ ] Open config.js
    [ ] Verify token exists (line ~18)
    [ ] Test current tool works
    Status: ✅ DONE (already in config)

[ ] STEP 2: Download Taiwan GADM Data
    [ ] Visit https://gadm.org/download_country.html
    [ ] Select "Taiwan"
    [ ] Download Level 1 (States/Provinces)
    [ ] Download Level 2 (Counties/Cities)
    [ ] Verify files downloaded successfully
    Status: ⬜ TODO

[ ] STEP 3: Rename Files (Optional)
    [ ] Rename: gadm41_TWN_1.json → TWN_level1.geojson
    [ ] Rename: gadm41_TWN_2.json → TWN_level2.geojson
    Status: ⬜ TODO

[ ] STEP 4: Create Folders (Auto-created if missing)
    [ ] data/boundaries/gadm_states/
    [ ] data/boundaries/gadm_counties/
    Status: ⬜ TODO (I'll create automatically)

[ ] STEP 5: Move Files
    [ ] Copy TWN_level1.geojson → data/boundaries/gadm_states/
    [ ] Copy TWN_level2.geojson → data/boundaries/gadm_counties/
    Status: ⬜ TODO

[ ] STEP 6: Verify Files
    [ ] Files are 1-10MB each
    [ ] Can open in text editor (valid JSON)
    [ ] File names match exactly
    Status: ⬜ TODO

[ ] STEP 7: Ready to Start
    [ ] All above tasks completed
    [ ] Ready to tell me "ready to start"
    Status: ⬜ TODO
```

---

## 📥 Download Links

### Taiwan Boundary Data:

**Level 1 (States/Provinces):**
- Direct link: https://gadm.org/download_country.html
- Select: Taiwan → Level 1 → GeoJSON
- Download file

**Level 2 (Counties/Cities):**
- Same page
- Select: Taiwan → Level 2 → GeoJSON
- Download file

---

## 📂 File Locations

### Current Folder Structure:
```
/Users/yulincho/Documents/GitHub/map/
├── data/
│   └── boundaries/
│       ├── gadm_states/     ← Need to create or verify
│       │   └── TWN_level1.geojson  ← Place file here
│       └── gadm_counties/   ← Need to create or verify
│           └── TWN_level2.geojson  ← Place file here
```

### Quick Commands to Create Folders:
```bash
cd /Users/yulincho/Documents/GitHub/map
mkdir -p data/boundaries/gadm_states
mkdir -p data/boundaries/gadm_counties
```

---

## 🎯 Minimum Required Before Development

**Critical (Must Have):**
- [x] Mapbox token (already done)
- [ ] Taiwan Level 1 data downloaded
- [ ] Taiwan Level 2 data downloaded
- [ ] Files in correct locations

**Optional (Can Do Later):**
- [ ] Additional countries' data
- [ ] Custom river data
- [ ] Custom map styles

---

## ⏰ Time Estimates

- Step 1 (Mapbox): ✅ Already done
- Step 2 (Download): ~30 minutes
- Step 3 (Rename): ~2 minutes
- Step 4 (Folders): ~1 minute (or auto-created)
- Step 5 (Move files): ~2 minutes
- Step 6 (Verify): ~2 minutes

**Total:** ~35-40 minutes

---

## ✅ When You're Done

Once all checkboxes are marked:
1. Verify files are in correct locations
2. Test by opening a file in text editor
3. Say: **"ready to start"** or **"all done"**

---

## 🆘 Stuck?

**Problem: Can't download files**
→ Check internet connection, try different browser

**Problem: Files too large**
→ Use as-is, we'll optimize during development

**Problem: Wrong file format**
→ Make sure you selected "GeoJSON" not "Shapefile"

**Problem: Can't find folders**
→ I'll create them automatically if missing

**Still stuck?**
→ Ask me and I'll help step-by-step!


