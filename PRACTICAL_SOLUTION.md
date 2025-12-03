# Practical Solution for State/City Boundaries

## 🎯 **The Problem**
- You get **402 errors** when trying to use state/city boundaries
- This means Mapbox wants you to **pay monthly** for access
- Not practical for a small team (0-10 users)

## ✅ **The FREE Solution: GADM Data**

### **What is GADM?**
- **Global Administrative Areas** - FREE worldwide boundary data
- Used by researchers, NGOs, and developers worldwide
- **Completely free** - no subscription needed
- Includes country, state, AND city boundaries

### **Why Use GADM?**
- ✅ **FREE** forever
- ✅ **Complete** (all countries, all levels)
- ✅ **Professional quality** (used by universities, UN, etc.)
- ✅ **One-time download** (no monthly fees)

---

## 🚀 **How to Set It Up**

### **Step 1: Download GADM Data**
```bash
# Download worldwide boundaries
# Level 0 = Countries
# Level 1 = States/Provinces  
# Level 2 = Cities/Counties

# You can download from:
# https://gadm.org/download_world.html
```

### **Step 2: Convert to GeoJSON** (if needed)
```bash
# GADM provides GeoPackage (.gpkg) files
# Need to convert to GeoJSON for web use
# We can create a script for this
```

### **Step 3: Optimize for Web**
```bash
# Large files need optimization
# Use tools like:
# - mapshaper (simplify geometry)
# - tippecanoe (create tiles)
```

### **Step 4: Host Files**
- GitHub Pages (free)
- Netlify (free)
- Local server

### **Step 5: Update Code**
- Load GADM GeoJSON files instead of Mapbox Boundaries
- Same functionality, free data!

---

## 💡 **Recommendation**

**For your team (news editor, small team):**

1. **Now**: Use country boundaries only (works today)
2. **This week**: Set up GADM data (free, complete)
3. **Never**: Pay for Mapbox Boundaries (unnecessary cost)

**GADM is perfect because:**
- You make infographics (static images)
- Small team (no need for frequent updates)
- Free is better than $5-50/month

---

## ❓ **Questions?**

**Q: How long does setup take?**
A: 2-3 hours for download + conversion + code update

**Q: Is GADM data quality good?**
A: Yes! Used by universities, UN, research institutions

**Q: Do I need to update it?**
A: Only if boundaries change (countries merge/split). Rarely needed.

**Q: Can I do this myself?**
A: Yes, or I can help with the code changes!

---

**Want me to help set up GADM? Say "set up GADM" and I'll create the code!** 🚀


