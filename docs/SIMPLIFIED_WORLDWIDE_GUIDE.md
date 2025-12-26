# Simplified Worldwide Data Guide

## Overview

Use **worldwide files directly** - no need to extract individual countries. Load the complete worldwide boundary files as single layers.

---

## 📥 What You Need to Download

### Website:
**https://gadm.org/download_world.html**

### Files to Download:
1. **Level 1** (States/Provinces worldwide)
   - Single file with ALL countries' states/provinces
   - Format: GeoPackage (.gpkg)
   - Size: ~500MB - 1GB

2. **Level 2** (Counties/Cities worldwide)
   - Single file with ALL countries' counties/cities
   - Format: GeoPackage (.gpkg)
   - Size: ~2-5GB

### Save Location:
```
data/boundaries/gadm_worldwide/
├── gadm_world_level1.gpkg
└── gadm_world_level2.gpkg
```

---

## ✅ Advantages of This Approach

1. **Simpler:** Just 2 files, no extraction needed
2. **Complete:** All countries in single files
3. **Flexible:** Can filter by country when needed
4. **Efficient:** Load entire layers at once

---

## 🔧 How It Will Work

### Technical Implementation:

1. **Load GeoPackage Files:**
   - Load Level 1 file as single Mapbox source
   - Load Level 2 file as single Mapbox source

2. **Filter by Country (When Needed):**
   - Use Mapbox expressions to filter boundaries
   - Show/hide based on selected countries
   - Filter: `['==', ['get', 'GID_0'], 'TWN']` for Taiwan

3. **Switch Between Levels:**
   - Toggle Level 1 (States) layer
   - Toggle Level 2 (Counties) layer
   - Both can be active simultaneously

4. **Optimize Performance:**
   - Use Mapbox expressions for filtering
   - Load visible regions only
   - Cache frequently used views

---

## 📋 Updated Checklist

### Step 1: Download Files (30-60 minutes)
- [ ] Visit https://gadm.org/download_world.html
- [ ] Download Level 1 worldwide file
- [ ] Download Level 2 worldwide file

### Step 2: Save Files (5 minutes)
- [ ] Create folder: `data/boundaries/gadm_worldwide/`
- [ ] Move Level 1 file → `gadm_world_level1.gpkg`
- [ ] Move Level 2 file → `gadm_world_level2.gpkg`

### Step 3: Verify (2 minutes)
- [ ] Files are .gpkg format
- [ ] Files are in correct location
- [ ] Disk space sufficient (5-10GB)

### Step 4: Done!
- [ ] Say "ready" when complete

---

## 🎯 Implementation Plan

### What I'll Build:

1. **GeoPackage Loader:**
   - Load .gpkg files directly into Mapbox
   - Convert to vector tiles if needed
   - Or use as GeoJSON source

2. **Layer System:**
   - Level 1 layer (States/Provinces worldwide)
   - Level 2 layer (Counties/Cities worldwide)
   - Toggle visibility independently

3. **Country Filtering:**
   - Filter boundaries by country code
   - Dynamic filtering based on user selection
   - Performance optimized with expressions

4. **Boundary Types:**
   - Switch between Country / State / County boundaries
   - Each uses appropriate worldwide file level
   - Smooth transitions

---

## 📊 File Usage

### Level 0 (Countries):
- Already available via Mapbox vector tiles
- No download needed

### Level 1 (States/Provinces):
- From: `gadm_world_level1.gpkg`
- Contains: All states/provinces worldwide
- Use when: User selects "State/Province" boundary type

### Level 2 (Counties/Cities):
- From: `gadm_world_level2.gpkg`
- Contains: All counties/cities worldwide
- Use when: User selects "County/City" boundary type

---

## ⚠️ Important Notes

### File Format:
- Files are **GeoPackage** (.gpkg), not GeoJSON
- **Important:** Mapbox doesn't support GeoPackage directly
- **Solution:** Convert to GeoJSON first (one-time conversion)
- **Conversion:** Use online converter or command line tool (see CONVERSION_OPTIONS.md)

### Performance:
- Large files (GB range) but loaded efficiently
- Mapbox handles large datasets well
- Filtering happens client-side efficiently

### Storage:
- Keep files as-is (no extraction)
- Use directly in application
- No preprocessing needed

---

## 🚀 Quick Start

### Download:
1. Go to: https://gadm.org/download_world.html
2. Download Level 1 file
3. Download Level 2 file

### Save:
```bash
mkdir -p data/boundaries/gadm_worldwide
# Move downloaded files to that folder
```

### Done:
Say "ready" when files are downloaded!

---

## ✅ Summary

**What You Do:**
- Download 2 worldwide files
- Save to `data/boundaries/gadm_worldwide/`

**What I'll Do:**
- Load files directly (no extraction)
- Create layers for each level
- Add filtering by country when needed
- Optimize performance

**Result:**
- Simple: Just 2 files
- Complete: All countries included
- Flexible: Filter as needed
- Efficient: Direct file usage

---

**Ready? Download the files and say "ready"!** 🚀

