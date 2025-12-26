# Quick Start: GADM Setup

## ⚡ Fast Track (2-3 hours total)

### Step 1: Download (30-60 min) 📥
1. Go to: **https://gadm.org/download_world.html**
2. Download **Level 0, 1, 2** as GeoPackage (.gpkg)
3. Save to: `data/gadm/` folder

### Step 2: Setup Tools (10 min) 🛠️
**Run the setup script:**
```bash
bash scripts/setup-gadm.sh
```

**Or manually:**
```bash
# Mac
brew install gdal
npm install -g mapshaper

# Linux  
sudo apt-get install gdal-bin
npm install -g mapshaper
```

### Step 3: Convert & Optimize (30-60 min) 🔄
```bash
node scripts/convert-gadm.js
```

This will:
- ✅ Convert .gpkg → .geojson
- ✅ Optimize file sizes (70-90% reduction)
- ✅ Save to `data/gadm/optimized/`

### Step 4: Host Files (15 min) 🌐

**Option A: GitHub Pages** (Recommended)
1. Upload optimized files to GitHub
2. Enable GitHub Pages
3. Files available at: `https://[username].github.io/[repo]/data/gadm/optimized/`

**Option B: Local Testing**
```bash
# In project root
python3 -m http.server 8000
# Or
npx http-server -p 8000
```

### Step 5: Update Code (30 min) 💻
**I'll do this!** Just tell me when files are ready.

---

## 📋 Checklist

- [ ] Downloaded GADM files
- [ ] Installed GDAL and mapshaper
- [ ] Converted files
- [ ] Hosted files (GitHub Pages or local)
- [ ] Ready for code update

---

## ⚠️ **Important Notes**

1. **File sizes are LARGE** (even optimized: 50-200MB each)
   - Use GitHub Pages or CDN for hosting
   - Don't commit raw files to Git (use .gitignore)

2. **Optimization is important**
   - Without optimization: 500MB - 2GB per file
   - With optimization: 50-200MB per file
   - Still looks good on maps!

3. **For news infographics**
   - Simplified geometry is fine
   - Focus on recognizable boundaries
   - Not pixel-perfect, but professional

---

**Start with Step 1, then tell me when you're ready for Step 5!** 🚀


