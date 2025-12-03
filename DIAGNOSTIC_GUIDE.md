# Diagnostic Guide - City/State Selection

## 🔍 If You Can't Select City/State

### Step 1: Check Console
Open browser console (F12) and check:

**Expected messages:**
- `✅ Source boundaries-adm1 loaded successfully`
- `✅ Source boundaries-adm2 loaded successfully`
- `✅ Created visible boundary layer for state`
- `✅ Created visible boundary layer for city`

**Error messages to watch for:**
- `Source not loaded`
- `Layer does not exist`
- `Source layer not found`

---

### Step 2: Run Diagnostic Commands

In browser console, run:

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

### Step 3: Test Click Detection

1. Switch to "State" or "City"
2. Wait a few seconds
3. Click on a boundary
4. Check console for:
   - `🖱️ Map clicked at:`
   - `✅ Detected: [Name] ([Type])`
   - Or error messages

---

## 🔧 Common Issues

### Issue 1: Source Not Loading
**Symptom:** Console shows "Source not loaded"

**Fix:** 
- Check Mapbox token
- Verify you have access to Boundaries
- Wait for source to load (may take time)

### Issue 2: Layer Not Created
**Symptom:** "Layer does not exist"

**Fix:**
- Switch area type again
- Wait for source to load first
- Check source layer names

### Issue 3: Wrong Source Layer Name
**Symptom:** Features found but wrong data

**Fix:**
- Check discovered source layers in console
- Update source layer names in code if needed

---

## ✅ Quick Fix Checklist

- [ ] Mapbox token is valid
- [ ] Sources are loading (check console)
- [ ] Layers are created (check console)
- [ ] Layers are visible (check with checkLayers())
- [ ] Click detection works (check console on click)

---

**Run diagnostics and share results if still not working!**


