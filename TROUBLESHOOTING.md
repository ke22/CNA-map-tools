# Troubleshooting Guide

## Country Can't Be Colored (UK, Ukraine, etc.)

If a country can't be colored, it's usually a **worldview filter** issue.

### Quick Fix

In `config.js`, find this line:
```javascript
USE_WORLDVIEW_FILTER: true,
```

Change it to:
```javascript
USE_WORLDVIEW_FILTER: false,
```

This will disable the worldview filter and allow ALL countries to be colored.

### Why This Happens

The worldview filter restricts which countries can be colored based on Mapbox's "worldview" system. Some countries (like UK, Ukraine, etc.) might not match the worldview values in the filter.

### Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to add the country
4. Look for warning messages that explain the issue

### Verify Country Code

Make sure you're using the correct ISO code:
- **UK** → Use **"GBR"** (not "UK" or "GB")
- **USA** → Use **"USA"**
- **Taiwan** → Use **"TWN"**

See `js/utils/country-codes.js` for all country codes.

### Test Steps

1. Set `USE_WORLDVIEW_FILTER: false` in config.js
2. Refresh the page
3. Try adding the country again
4. If it works → worldview filter was the problem
5. If it still doesn't work → might be Mapbox data issue

### Mapbox Data Issue?

If disabling worldview filter doesn't help:
- The country might not be in Mapbox boundaries data
- Or the country code in Mapbox is different
- Check browser console for error messages


