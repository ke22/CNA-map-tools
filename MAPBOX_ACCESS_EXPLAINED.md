# Mapbox Boundaries Access - Explained

## 🚨 The 402 Error Explained

When you see **402 errors**, it means:
- **Your Mapbox token doesn't have permission** to access those boundaries
- **402 = "Payment Required"** - It's a paid feature

---

## 📊 What's Included in Free vs Paid

### ✅ **Free Tier (What You Have Now)**
- `mapbox.country-boundaries-v1` (adm0) - **Country boundaries ONLY**
- Basic map styles (Light, Dark, Satellite, Streets)
- Limited API calls

### 💰 **Paid Tier (What You Need for State/City)**
- `mapbox.boundaries-adm1-v3` - **State/Province boundaries**
- `mapbox.boundaries-adm2-v3` - **City/County boundaries**
- Requires paid Mapbox account (usually $5-50/month minimum)
- Need to contact Mapbox sales to enable Boundaries dataset

---

## 💡 **Better Solution for Small Team (0-10 users)**

Instead of paying Mapbox, use **FREE alternative data**:

### **Option 1: GADM Data (FREE & Complete)**
- ✅ **FREE** worldwide boundary data
- ✅ Includes country, state, AND city boundaries
- ✅ No monthly fees
- ✅ Download once, use forever

**How it works:**
1. Download GADM GeoJSON files (we already have guide: `MANUAL_TASKS_GUIDE.md`)
2. Convert to optimized format if needed
3. Host locally or on GitHub Pages
4. Use as custom Mapbox sources

**Perfect for:**
- Small teams (0-10 users)
- News editors making infographics
- One-time or low-volume usage

---

## 🔄 **Comparison**

| Solution | Cost | Setup Time | Quality |
|----------|------|------------|---------|
| **Mapbox Paid Boundaries** | $5-50/month | 1 day (contact sales) | Excellent |
| **GADM Data (Free)** | $0 | 2-3 hours | Excellent |
| **Country Only** | Free | Already done | Limited |

---

## ✅ **Recommended: Use GADM Data**

**For your use case (news editor, small team, infographics):**
1. ✅ **FREE** - No monthly costs
2. ✅ **Complete** - All boundary levels
3. ✅ **High quality** - Professional grade data
4. ✅ **One-time setup** - Download once, use forever

**The only downside:**
- Need to download and convert files (we have guides for this)
- Files are large (need to optimize for web)

---

## 🎯 **What You Should Do**

### **Short Term (Now):**
- Use country boundaries only (already working)
- Test the tool with country-level coloring

### **Medium Term (This Week):**
1. Download GADM worldwide data
2. Convert to optimized GeoJSON
3. Host files (GitHub Pages, Netlify, or local)
4. Update code to use GADM instead of Mapbox Boundaries

### **Long Term (If Needed):**
- Consider paid Mapbox only if:
  - You need frequent updates
  - You have budget
  - You need Mapbox's automatic updates

---

## 📝 **Action Items**

**For FREE state/city boundaries:**

1. ✅ Download GADM data (see `WORLDWIDE_DATA_GUIDE.md`)
2. ✅ Convert to GeoJSON (we can help with this)
3. ✅ Update code to load GADM files instead of Mapbox Boundaries
4. ✅ Test with state/city selection

**I can help you set this up - it's much better for a small team!**


