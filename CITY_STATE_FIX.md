# City/State Selection Fix

## 🔧 Problem
- Couldn't select city or state boundaries
- Only country selection worked

## ✅ Fix Applied

### 1. **Auto-Detection of All Levels**
**Before:** Only queried selected area type  
**After:** Tries all levels automatically (city → state → country)

**How it works:**
- Click on map
- System tries to detect:
  1. City level first (most specific)
  2. State level if no city
  3. Country level if nothing else

### 2. **Improved Click Detection**
- Larger click radius (15px)
- Multiple fallback methods
- Better feature filtering

### 3. **Better Source Layer Discovery**
- Discovers actual layer names
- Tries multiple potential names
- Falls back to defaults if needed

---

## 🧪 How to Test

1. **Switch to State or City:**
   - Click "State" or "City" button
   - Wait for boundaries to load

2. **Click on boundaries:**
   - Click anywhere on state/city boundaries
   - Should detect and show color picker

3. **Check console:**
   - Should see: "✅ Detected: [Name] ([Type])"
   - If errors, see what's wrong

---

## 🔍 Debug Commands

**In browser console:**
```javascript
// Check sources
checkSources()

// Check layers
checkLayers()

// Check specific source layers
checkSourceLayers('boundaries-adm1')
checkSourceLayers('boundaries-adm2')
```

---

**The fix should allow selecting city and state now!** ✅


