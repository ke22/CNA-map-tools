# Worldview Filter Explanation

## Why Ukraine (UKR) Can Be Colored

Ukraine can be colored because the worldview filter includes `'all'`, which means **all countries** are included.

### How It Works:

The worldview filter in `config.js` is:
```javascript
WORLDVIEW_FILTER: [
  'all',  // <-- This includes ALL countries
  'JP', 
  'AR,JP,MA,RU,TR,US', 
  // ... other specific worldview groups
]
```

When a country is added, the filter checks:
```javascript
['in', 'worldview', 'all', 'JP', 'AR,JP,MA,RU,TR,US', ...]
```

This means: "Show this country if its worldview is 'all' OR 'JP' OR 'AR,JP,MA,RU,TR,US' OR ..."

### Why 'all' Exists:

- **'all'**: Standard countries that are recognized by all worldviews (like Ukraine, USA, etc.)
- **Specific worldviews**: For disputed territories that different countries view differently
  - Example: Taiwan/China borders may vary by worldview

### Countries That Can Be Colored:

✅ **All countries** in the 'all' worldview (most countries, including Ukraine)
✅ **Countries** in specific worldview groups listed

### If You Want to Restrict Countries:

If you need to exclude certain countries, you would need to:
1. Remove 'all' from the worldview filter (not recommended - would break most countries)
2. Or add country-specific exceptions in the filter logic

### Current Behavior:

- ✅ Ukraine (UKR) → Can be colored (in 'all' worldview)
- ✅ Taiwan (TWN) → Can be colored (in 'all' and specific worldviews)
- ✅ All standard countries → Can be colored

This matches the old tool's behavior.
