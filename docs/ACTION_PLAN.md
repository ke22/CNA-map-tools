# GADM Setup - Your Action Plan

## ✅ **What I've Created for You**

### 📚 **Guides**
- `GADM_SETUP_GUIDE.md` - Complete step-by-step instructions
- `QUICK_START_GADM.md` - Fast track version
- `ACTION_PLAN.md` - This file (your roadmap)

### 🛠️ **Scripts**
- `scripts/setup-gadm.sh` - Automated tool installation
- `scripts/convert-gadm.js` - Converts & optimizes files

### 💻 **Code**
- `js/app-gadm.js` - Code to load GADM data (ready to integrate)

---

## 🚀 **Your Action Plan**

### **Phase 1: Setup Tools** ⏱️ 10 minutes

```bash
# Run the setup script (Mac/Linux)
bash scripts/setup-gadm.sh

# Or manually install:
# Mac:
brew install gdal
npm install -g mapshaper

# Linux:
sudo apt-get install gdal-bin
npm install -g mapshaper
```

**Check:** Run `ogr2ogr --version` to verify GDAL installed

---

### **Phase 2: Download GADM Files** ⏱️ 30-60 minutes

1. **Go to:** https://gadm.org/download_world.html

2. **Download 3 files:**
   - Level 0 (Countries) → Save as `data/gadm/gadm_level0.gpkg`
   - Level 1 (States) → Save as `data/gadm/gadm_level1.gpkg`
   - Level 2 (Cities) → Save as `data/gadm/gadm_level2.gpkg`

3. **Total download size:** ~750 MB

**Tip:** Download may take 30-60 minutes depending on internet speed

---

### **Phase 3: Convert & Optimize** ⏱️ 30-60 minutes

```bash
# Run conversion script
node scripts/convert-gadm.js
```

**What it does:**
- ✅ Converts .gpkg → .geojson
- ✅ Optimizes file sizes (70-90% smaller!)
- ✅ Saves to `data/gadm/optimized/`

**Expected output:**
- `gadm_level0_optimized.geojson` (~20-50 MB)
- `gadm_level1_optimized.geojson` (~50-100 MB)
- `gadm_level2_optimized.geojson` (~100-200 MB)

---

### **Phase 4: Host Files** ⏱️ 15 minutes

**Option A: GitHub Pages (Recommended)**

1. **Create GitHub repo** (if you don't have one)
2. **Upload optimized files** to `data/gadm/optimized/`
3. **Enable GitHub Pages** in repo settings → Pages
4. **Files accessible at:**
   ```
   https://[username].github.io/[repo]/data/gadm/optimized/gadm_level0_optimized.geojson
   ```

**Option B: Netlify**

1. Create `netlify.toml`:
   ```toml
   [build]
   publish = "."
   
   [[headers]]
     for = "/data/**"
     [headers.values]
       Access-Control-Allow-Origin = "*"
   ```

2. Deploy folder with files
3. Netlify auto-hosts with CDN

**Option C: Local Testing**

```bash
# Simple HTTP server
python3 -m http.server 8000
# Or
npx http-server -p 8000
```

---

### **Phase 5: Update Code** ⏱️ 30 minutes

**I'll do this!** Just tell me:

1. ✅ Files are converted
2. ✅ Files are hosted (and give me the URL)
3. ✅ Ready for code update

**I'll then:**
- Update `config.js` with GADM URLs
- Integrate `app-gadm.js` into main app
- Test state/city selection
- Make sure everything works!

---

## 📋 **Quick Checklist**

Print this and check off as you go:

- [ ] **Phase 1:** Installed GDAL and mapshaper
- [ ] **Phase 2:** Downloaded GADM files (all 3 levels)
- [ ] **Phase 3:** Converted and optimized files
- [ ] **Phase 4:** Hosted files (GitHub Pages/Netlify/local)
- [ ] **Phase 5:** Ready for code update (tell me!)

---

## ⏱️ **Time Estimate**

| Phase | Time | Who |
|-------|------|-----|
| Setup Tools | 10 min | You |
| Download Files | 30-60 min | You |
| Convert & Optimize | 30-60 min | Script (you run it) |
| Host Files | 15 min | You |
| Update Code | 30 min | Me! |

**Total:** 2-3 hours (mostly waiting for downloads)

---

## ❓ **Troubleshooting**

### Problem: GDAL not found
**Solution:** 
- Mac: `brew install gdal`
- Linux: `sudo apt-get install gdal-bin`
- Windows: Download from https://www.lfd.uci.edu/~gohlke/pythonlibs/#gdal

### Problem: Conversion fails
**Solution:** 
- Check file paths in `data/gadm/`
- Ensure files are named correctly
- Check GDAL installation: `ogr2ogr --version`

### Problem: Files too large
**Solution:** 
- Use optimization (mapshaper)
- Simplify geometry more (reduce % in script)
- Consider splitting by country (advanced)

### Problem: Hosting issues
**Solution:**
- GitHub Pages has file size limits (100MB)
- Use Netlify or self-host for larger files
- Or use Mapbox Vector Tiles (advanced)

---

## 🎯 **Expected Result**

After completion:
- ✅ Country boundaries work (already working)
- ✅ State boundaries work (NEW!)
- ✅ City boundaries work (NEW!)
- ✅ All FREE - no monthly costs!
- ✅ Works with your existing UI

---

## 💡 **Next Steps Right Now**

**Start with Phase 1:**

```bash
# Run setup script
bash scripts/setup-gadm.sh
```

Then proceed to Phase 2 (download files).

**Questions?** Check `GADM_SETUP_GUIDE.md` for detailed instructions!

---

**When you're ready for Phase 5, just say "files are ready" and I'll update the code!** 🚀


