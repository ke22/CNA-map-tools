# Your Action Items - Quick Checklist

## 🎯 What You Need To Do (In Order)

### ✅ STEP 1: Verify Mapbox Token (5 minutes)

**Status Check:**
- Open `config.js`
- Look at line ~17: `TOKEN: 'pk.eyJ...'`
- If token is there → ✅ Done!
- If token is missing → Follow steps below

**If Token Missing:**
1. Go to: https://account.mapbox.com/access-tokens/
2. Copy your default public token
3. Paste into `config.js` line ~17
4. Save file

**Test:**
- Open `index.html` in browser
- Map should load
- Check console for errors

**Status:** ⬜ Not Started | ✅ Done

---

### ⚠️ STEP 2: Download Worldwide Boundary Data (30-60 minutes) - REQUIRED

**Why:** Phase 3 needs this data to show state/county boundaries for ALL countries.

**Where to Download:**
```
https://gadm.org/download_world.html
```

**What to Download:**
1. Download **Level 1** (States/Provinces worldwide)
   - Single file containing all countries
   - Format: GeoPackage (.gpkg)
   - Size: ~500MB - 1GB
2. Download **Level 2** (Counties/Cities worldwide)
   - Single file containing all countries
   - Format: GeoPackage (.gpkg)
   - Size: ~2-5GB

**Where to Save:**
```
/Users/yulincho/Documents/GitHub/map/data/boundaries/gadm_worldwide/gadm_world_level1.gpkg
/Users/yulincho/Documents/GitHub/map/data/boundaries/gadm_worldwide/gadm_world_level2.gpkg
```

**Note:** These are worldwide files containing ALL countries. I'll use them directly as single layers (no extraction needed)!

**Quick Commands (I'll create folders automatically, but you can create manually):**
```bash
cd /Users/yulincho/Documents/GitHub/map
mkdir -p data/boundaries/gadm_worldwide
# Then copy your downloaded files there
```

**Verify:**
- Files should be 500MB - 5GB each (large files)
- Files are GeoPackage format (.gpkg)
- File names: `gadm_world_level1.gpkg` and `gadm_world_level2.gpkg`

**Status:** ⬜ Not Started | ✅ Done

---

### 📦 STEP 3: Organize Files (5 minutes)

**Create folders (if not auto-created):**
```bash
mkdir -p data/boundaries/gadm_worldwide
```

**Copy files:**
- Move downloaded Level 1 file → `data/boundaries/gadm_worldwide/gadm_world_level1.gpkg`
- Move downloaded Level 2 file → `data/boundaries/gadm_worldwide/gadm_world_level2.gpkg`

**Verify structure:**
```
data/
└── boundaries/
    └── gadm_worldwide/
        ├── gadm_world_level1.gpkg  ← Should be here (States)
        └── gadm_world_level2.gpkg  ← Should be here (Counties)
```

**Note:** These are large files (GB range). Make sure you have enough disk space!

**Status:** ⬜ Not Started | ✅ Done

---

### 🎉 STEP 4: You're Ready!

**Before starting development, confirm:**

- [ ] Mapbox token is set in config.js
- [ ] Worldwide Level 1 data downloaded (States/Provinces)
- [ ] Worldwide Level 2 data downloaded (Counties/Cities)
- [ ] Files are in `data/boundaries/gadm_worldwide/` folder
- [ ] Files are .gpkg format (GeoPackage)
- [ ] Disk space available (5-10GB)

**Once all checked, tell me: "ready to start"** 🚀

---

## 📋 Optional Tasks (Can Do Later)

### How It Works:

Since we're using worldwide files directly:
- ✅ Load files as single layers (no extraction)
- ✅ Filter by country when needed using Mapbox expressions
- ✅ Switch between Level 1 (States) and Level 2 (Counties)
- ✅ Much simpler approach!

---

### Optional: Custom River Data

**Only if you want custom rivers:**
1. Go to: https://overpass-turbo.eu/
2. Query waterways for your region
3. Export as GeoJSON
4. Save to `data/rivers/`

**Default:** Will use automatic extraction (no manual work needed)

**Not urgent** - Can skip this.

---

## 🚨 Critical Timeline

### Before Phase 3 (Boundary System):
- ✅ Must have Taiwan GADM data
- ⏰ Need this by Day 10-12 of development
- 🎯 Best to have it before development starts

### Before Phase 1-2:
- ✅ Just need Mapbox token
- ⏰ Can verify in 5 minutes
- ✅ Already likely done

---

## 📞 Need Help?

**If stuck on any step:**
1. Tell me which step
2. Describe the problem
3. I'll provide detailed help

**Common Issues:**
- Files won't download → Try different browser
- Files too large → We'll optimize during build
- Can't find folders → I'll create them automatically
- Wrong format → Make sure it's GeoJSON not Shapefile

---

## ✅ Quick Status Check

Copy and fill this out:

```
[ ] Step 1: Mapbox token verified
[ ] Step 2: Taiwan data downloaded  
[ ] Step 3: Files organized
[ ] Ready to start development
```

**When all checked → Say "ready"!** ✅

