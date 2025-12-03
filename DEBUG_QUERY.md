# Debug Query Issue

## 🔍 **Current Problem**

- ✅ GADM data loads successfully
- ✅ Layers are created
- ❌ Click queries return 0 GADM features
- ❌ Only finding Mapbox composite layers (admin-1-boundary-bg, landuse)

## 💡 **Root Cause**

The issue is likely that:
1. **Layer is not visible** when querying
2. **GeoJSON features need to be queried differently** than vector tiles
3. **Layer might not be fully rendered** when query happens

## 🛠️ **Solution Approach**

1. **Ensure layer is visible before querying**
2. **Query ALL features at point, then filter by source**
3. **Use direct GeoJSON source query as primary method**
4. **Add better error handling and logging**


