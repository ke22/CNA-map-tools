# Mapbox Built-in Sources Research

## Current Situation

### ✅ What We Currently Have:
- **Country Boundaries (Level 0):**
  - Source: `mapbox://mapbox.country-boundaries-v1`
  - Free and available to all users
  - Works perfectly ✅

### ❌ What We Need:
- **State/Province Boundaries (Level 1):**
  - Need worldwide state/province boundaries
  - Mapbox source: Unknown/Not publicly available

- **County/City Boundaries (Level 2):**
  - Need worldwide county/city boundaries
  - Mapbox source: Unknown/Not publicly available

---

## Mapbox Boundaries Product

### What Mapbox Offers:

**Mapbox Boundaries** is a comprehensive dataset that includes:
- ✅ Administrative boundaries (adm0, adm1, adm2)
- ✅ Over 4 million boundaries
- ✅ Multiple administrative levels
- ✅ Cartographically matched and georeferenced

**BUT:**
- ⚠️ Requires **special access/permissions**
- ⚠️ May require **contacting Mapbox sales**
- ⚠️ Not free/available to all users
- ⚠️ Tileset IDs not publicly documented

---

## Available Mapbox Sources

### Free/Public Sources:

1. **Country Boundaries:**
   - `mapbox://mapbox.country-boundaries-v1` ✅
   - Free, available to all
   - Only country level (adm0)

2. **Mapbox Countries v1:**
   - Similar to country boundaries
   - Free alternative
   - Country polygons only

### Paid/Special Access Sources:

1. **Mapbox Boundaries (Full Dataset):**
   - Includes adm0, adm1, adm2 levels
   - Requires special access
   - Contact Mapbox sales

---

## Recommendation

### Option 1: Check Your Mapbox Account (Recommended First Step)

**Check if you have access:**
1. Log into Mapbox Studio
2. Go to "Tilesets" section
3. Check if you see "Boundaries" tilesets
4. Look for tilesets with names like:
   - `mapbox.boundaries-adm0-v3` (countries)
   - `mapbox.boundaries-adm1-v3` (states/provinces)
   - `mapbox.boundaries-adm2-v3` (counties/cities)

**If you see them:**
- ✅ You have access!
- Use them directly
- No conversion needed

### Option 2: Request Access from Mapbox

**If you don't have access:**
1. Contact Mapbox sales
2. Request access to Mapbox Boundaries
3. May require paid plan or special arrangement

### Option 3: Use GADM Data (Current Plan)

**If Mapbox doesn't have what you need:**
- Download GADM worldwide files
- Convert to GeoJSON
- Load as custom sources
- Works for sure ✅

---

## Quick Test: Check Your Mapbox Account

### Try These Tileset IDs:

```javascript
// Try these sources (may or may not work depending on access):
const possibleSources = [
    'mapbox://mapbox.boundaries-adm1-v3',  // States/Provinces
    'mapbox://mapbox.boundaries-adm2-v3',  // Counties/Cities
    'mapbox://mapbox.boundaries-adm0-v3',  // Countries (alternative)
];

// Test if they work:
map.addSource('test-boundaries-adm1', {
    type: 'vector',
    url: 'mapbox://mapbox.boundaries-adm1-v3'
});
```

**If these work:**
- ✅ You have access!
- Use them instead of GADM
- Much simpler!

**If these don't work:**
- ❌ Need GADM data
- Continue with conversion plan

---

## Next Steps

1. **Check Mapbox Studio:**
   - Log in and check available tilesets
   - See if Boundaries tilesets are listed

2. **Try Test Code:**
   - Try loading adm1 and adm2 sources
   - See if they work

3. **Decide:**
   - **If Mapbox has it:** Use Mapbox sources directly
   - **If not:** Continue with GADM conversion

---

## Summary

**Question:** Does Mapbox have state/county boundary sources?

**Answer:** 
- ✅ Mapbox HAS "Mapbox Boundaries" with adm1/adm2
- ⚠️ BUT requires special access (not free)
- ✅ **Solution:** Check your account first, then decide

**Action Items:**
1. Check your Mapbox Studio account
2. Try loading boundaries-adm1/adm2 sources
3. If available → Use Mapbox (simpler!)
4. If not → Use GADM (works for sure)

---

**Let me create a test script to check if you have access!**


