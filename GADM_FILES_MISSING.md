# GADM 文件缺失 - 解決方案

## 🚨 **問題**

應用嘗試載入 GADM GeoJSON 文件但找不到（404 錯誤）：
- `./data/gadm/optimized/gadm_level0_optimized.geojson` - 不存在
- `./data/gadm/gadm_level0.geojson` - 不存在

目前只有 .gpkg 文件，沒有轉換後的 .geojson 文件。

---

## ✅ **當前狀態**

### **已修復：**
- ✅ 錯誤處理已改進，不再拋出致命錯誤
- ✅ 國家模式：使用 Mapbox（正常工作）
- ✅ 行政區模式：優雅降級（顯示警告）

### **功能狀態：**
- ✅ **國家邊界**：可用（使用 Mapbox）
- ⚠️ **行政區邊界**：需要 GADM GeoJSON 文件

---

## 🔧 **解決方案選項**

### **選項 1：暫時使用國家模式（推薦）**
- 應用現在可以正常使用
- 只能選擇國家邊界
- 行政區功能暫時不可用

### **選項 2：轉換 GADM 文件**
如果需要使用行政區功能，需要：

1. **提取層級：**
   ```bash
   ./scripts/extract-levels.sh
   ```

2. **轉換為 GeoJSON：**
   ```bash
   node scripts/convert-gadm.js
   ```

3. **優化（可選）：**
   ```bash
   # 使用 mapshaper 簡化
   ```

---

## 📋 **文件檢查清單**

需要的文件：
- [ ] `data/gadm/gadm_level0.geojson` (或 optimized 版本)
- [ ] `data/gadm/gadm_level1.geojson` (或 optimized 版本)
- [ ] `data/gadm/gadm_level2.geojson` (或 optimized 版本)

當前有的文件：
- ✅ `data/gadm/gadm_410.gpkg` (2.6GB)
- ✅ `data/gadm/gadm_410-levels.gpkg` (4.6GB)

---

## 💡 **建議**

1. **現在**：使用國家模式，應用正常工作
2. **之後**：如果需要行政區功能，轉換 GADM 文件

---

**狀態**：應用現在可以正常使用（僅國家模式）


