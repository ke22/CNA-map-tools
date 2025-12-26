# 準備 GADM 文件指南

## 📋 **當前狀態**

### **已有的文件：**
- ✅ `data/gadm/gadm_410-levels.gpkg` (4.6GB) - 源文件
- ✅ `data/gadm/gadm_410.gpkg` (2.6GB) - 源文件

### **缺少的文件：**
- ❌ `data/gadm/gadm_level0.geojson` - 國家邊界
- ❌ `data/gadm/gadm_level1.geojson` - 第一級行政區
- ❌ `data/gadm/gadm_level2.geojson` - 第二級行政區

---

## 🔧 **準備步驟**

### **步驟 1：檢查工具**

確認已安裝必要工具：
```bash
# 檢查 GDAL (ogr2ogr)
ogr2ogr --version

# 檢查 mapshaper (可選，用於優化)
mapshaper --version
```

如果未安裝，請安裝：
```bash
# macOS
brew install gdal
brew install mapshaper

# 或使用 npm
npm install -g mapshaper
```

---

### **步驟 2：提取層級（如果需要的話）**

如果使用的是 `gadm_410-levels.gpkg`，可能需要先提取：
```bash
./scripts/extract-levels.sh
```

---

### **步驟 3：轉換為 GeoJSON**

使用轉換腳本：
```bash
node scripts/convert-gadm.js
```

或手動轉換：
```bash
# 轉換 Level 0 (國家)
ogr2ogr -f GeoJSON \
  -lco COORDINATE_PRECISION=6 \
  data/gadm/gadm_level0.geojson \
  data/gadm/gadm_410-levels.gpkg \
  -where "GID_1 IS NULL AND GID_2 IS NULL"

# 轉換 Level 1 (第一級行政區)
ogr2ogr -f GeoJSON \
  -lco COORDINATE_PRECISION=6 \
  data/gadm/gadm_level1.geojson \
  data/gadm/gadm_410-levels.gpkg \
  -where "GID_1 IS NOT NULL AND GID_2 IS NULL"

# 轉換 Level 2 (第二級行政區)
ogr2ogr -f GeoJSON \
  -lco COORDINATE_PRECISION=6 \
  data/gadm/gadm_level2.geojson \
  data/gadm/gadm_410-levels.gpkg \
  -where "GID_2 IS NOT NULL"
```

---

### **步驟 4：優化文件（可選，減少文件大小）**

使用 mapshaper 優化：
```bash
# 優化 Level 0
mapshaper data/gadm/gadm_level0.geojson \
  -simplify 1% \
  -o data/gadm/optimized/gadm_level0_optimized.geojson

# 優化 Level 1
mapshaper data/gadm/gadm_level1.geojson \
  -simplify 1% \
  -o data/gadm/optimized/gadm_level1_optimized.geojson

# 優化 Level 2
mapshaper data/gadm/gadm_level2.geojson \
  -simplify 1% \
  -o data/gadm/optimized/gadm_level2_optimized.geojson
```

---

## ⚠️ **注意事項**

1. **文件大小：**
   - GeoJSON 文件可能會很大（幾 GB）
   - 優化可以減少文件大小
   - 需要足夠的磁盤空間

2. **轉換時間：**
   - 轉換可能需要幾分鐘到幾小時
   - 取決於數據大小和計算機性能

3. **內存使用：**
   - 轉換過程可能使用大量內存
   - 確保有足夠的可用內存

---

## 🚀 **快速開始**

如果只想快速測試，可以：

1. **只轉換需要的層級：**
   - 如果只需要國家：只轉換 Level 0
   - 如果需要行政區：轉換 Level 1 和 Level 2

2. **使用簡化的區域：**
   - 可以只轉換特定國家/地區
   - 減少文件大小和處理時間

---

## ✅ **完成後**

轉換完成後，文件應該在：
- `data/gadm/gadm_level0.geojson`
- `data/gadm/gadm_level1.geojson`
- `data/gadm/gadm_level2.geojson`

或優化版本：
- `data/gadm/optimized/gadm_level0_optimized.geojson`
- `data/gadm/optimized/gadm_level1_optimized.geojson`
- `data/gadm/optimized/gadm_level2_optimized.geojson`

然後刷新頁面，應用就會自動使用 GADM 文件了！


