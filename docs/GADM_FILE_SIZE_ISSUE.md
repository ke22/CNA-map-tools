# GADM 文件大小問題

## 問題說明

當前的 GADM GeoJSON 文件非常大：
- `gadm_level0.geojson`: 約 925 MB
- `gadm_level1.geojson`: 約 1.1 GB  
- `gadm_level2.geojson`: 約 2.1 GB

這些文件太大，無法直接在瀏覽器中加載，會導致：
- ❌ 內存不足錯誤
- ❌ JSON 解析失敗（"Unexpected end of JSON input"）
- ❌ 網絡超時
- ❌ 瀏覽器崩潰

## 解決方案

### 方案 1: 使用簡化/優化版本（推薦）

使用 `mapshaper` 簡化 GeoJSON 文件，減少文件大小：

```bash
# 簡化 Level 0 (國家邊界)
npx mapshaper data/gadm/gadm_level0.geojson \
  -simplify 10% \
  -o data/gadm/optimized/gadm_level0_optimized.geojson format=geojson

# 簡化 Level 1 (州/省邊界)
npx mapshaper data/gadm/gadm_level1.geojson \
  -simplify 5% \
  -o data/gadm/optimized/gadm_level1_optimized.geojson format=geojson

# 簡化 Level 2 (城市/縣邊界)
npx mapshaper data/gadm/gadm_level2.geojson \
  -simplify 2% \
  -o data/gadm/optimized/gadm_level2_optimized.geojson format=geojson
```

**簡化比例說明**：
- Level 0 (國家): 可以簡化較多（10-20%），因為國家邊界不需要太精細
- Level 1 (州/省): 適度簡化（5-10%）
- Level 2 (城市): 少量簡化（2-5%），保持較高的精度

### 方案 2: 按地區分割數據

將全球數據按區域分割（例如：亞洲、歐洲、美洲等），然後按需加載。

### 方案 3: 使用服務器端處理

在服務器端將 GeoJSON 轉換為 Mapbox Vector Tiles (MVT)，然後使用 Mapbox 的瓦片服務。

## 當前狀態

- ✅ 已改進錯誤處理，會顯示文件大小警告
- ✅ 已添加 JSON 完整性檢查
- ⚠️ 需要創建優化版本的文件

## 下一步

1. 運行簡化命令創建優化版本
2. 或者考慮其他方案（分割、服務器端處理等）

