# 處理 GADM 文件過大問題的解決方案

## 問題概述

當前 GADM GeoJSON 文件：
- `gadm_level0.geojson`: **925 MB**
- `gadm_level1.geojson`: **1.1 GB**
- `gadm_level2.geojson`: **2.1 GB**

這些文件太大，無法直接在瀏覽器中加載。

---

## 解決方案比較

| 方案 | 優點 | 缺點 | 難度 | 推薦度 |
|------|------|------|------|--------|
| **1. 簡化優化** | 簡單快速，大幅減少文件大小 | 可能損失細節 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **2. 按需加載** | 保持原始精度，只加載可見區域 | 需要服務器端支持 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **3. 轉換為瓦片** | 最佳性能，標準做法 | 需要服務器和工具 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **4. 按地區分割** | 靈活，可選擇性加載 | 管理多個文件 | ⭐⭐⭐ | ⭐⭐⭐ |

---

## 方案 1: 簡化優化（推薦開始使用）

使用 `mapshaper` 簡化幾何形狀，大幅減少文件大小。

### 步驟 1: 安裝 mapshaper

```bash
# 使用 npm (推薦，可以全局安裝)
npm install -g mapshaper

# 或者使用 npx (不需要安裝)
# 直接使用 npx mapshaper
```

### 步驟 2: 創建優化目錄

```bash
mkdir -p data/gadm/optimized
```

### 步驟 3: 簡化文件

```bash
# 簡化 Level 0 (國家邊界) - 可以簡化較多
mapshaper data/gadm/gadm_level0.geojson \
  -simplify 15% \
  -o data/gadm/optimized/gadm_level0_optimized.geojson format=geojson

# 簡化 Level 1 (州/省邊界) - 適度簡化
mapshaper data/gadm/gadm_level1.geojson \
  -simplify 8% \
  -o data/gadm/optimized/gadm_level1_optimized.geojson format=geojson

# 簡化 Level 2 (城市/縣邊界) - 少量簡化保持精度
mapshaper data/gadm/gadm_level2.geojson \
  -simplify 3% \
  -o data/gadm/optimized/gadm_level2_optimized.geojson format=geojson
```

**簡化比例指南**：
- `15%` = 保留 85% 的原始細節（Level 0 建議）
- `8%` = 保留 92% 的原始細節（Level 1 建議）
- `3%` = 保留 97% 的原始細節（Level 2 建議）

### 預期結果

- Level 0: 從 925 MB → **約 50-100 MB**
- Level 1: 從 1.1 GB → **約 100-200 MB**
- Level 2: 從 2.1 GB → **約 200-400 MB**

**注意**：如果還是太大，可以增加簡化比例（例如 20%、10%、5%）

### 自動化腳本

創建 `scripts/optimize-gadm.sh`：

```bash
#!/bin/bash

echo "🗜️  開始優化 GADM 文件..."

# 確保目錄存在
mkdir -p data/gadm/optimized

# Level 0
echo "📦 優化 Level 0 (國家)..."
mapshaper data/gadm/gadm_level0.geojson \
  -simplify 15% \
  -o data/gadm/optimized/gadm_level0_optimized.geojson format=geojson

# Level 1
echo "📦 優化 Level 1 (州/省)..."
mapshaper data/gadm/gadm_level1.geojson \
  -simplify 8% \
  -o data/gadm/optimized/gadm_level1_optimized.geojson format=geojson

# Level 2
echo "📦 優化 Level 2 (城市/縣)..."
mapshaper data/gadm/gadm_level2.geojson \
  -simplify 3% \
  -o data/gadm/optimized/gadm_level2_optimized.geojson format=geojson

echo "✅ 優化完成！檢查文件大小："
ls -lh data/gadm/optimized/*.geojson
```

運行：
```bash
chmod +x scripts/optimize-gadm.sh
./scripts/optimize-gadm.sh
```

---

## 方案 2: 按視圖範圍加載（進階）

只加載當前地圖視圖範圍內的數據。

### 優點
- 保持原始精度
- 只加載需要的數據
- 適合大規模應用

### 缺點
- 需要服務器端支持
- 需要 API 端點進行空間查詢
- 實現較複雜

### 基本實現思路

1. **服務器端 API**（使用 PostGIS 或類似的空間數據庫）：
   ```javascript
   // 客戶端請求
   GET /api/gadm/level0?bbox=120,22,122,25  // 左上右下座標
   
   // 服務器返回該範圍內的數據
   ```

2. **客戶端按需加載**：
   ```javascript
   // 監聽地圖移動
   map.on('moveend', async () => {
     const bounds = map.getBounds();
     const bbox = [bounds.getWest(), bounds.getSouth(), 
                   bounds.getEast(), bounds.getNorth()];
     await loadGADMByBounds('country', bbox);
   });
   ```

---

## 方案 3: 轉換為矢量瓦片（最佳性能）

將 GeoJSON 轉換為 Mapbox Vector Tiles (MVT)，這是 Mapbox 推薦的方式。

### 優點
- 最佳性能
- 只傳輸可見區域的數據
- 自動簡化（根據縮放級別）
- 標準做法

### 缺點
- 需要服務器和工具
- 初始設置較複雜

### 使用工具

**選項 A: Tippecanoe**（Mapbox 官方工具）

```bash
# 安裝
brew install tippecanoe  # macOS
# 或
apt-get install tippecanoe  # Linux

# 轉換
tippecanoe -o gadm.mbtiles \
  -L country:data/gadm/gadm_level0.geojson \
  -L state:data/gadm/gadm_level1.geojson \
  -L city:data/gadm/gadm_level2.geojson \
  -z14 -Z0
```

**選項 B: 在線服務**
- Mapbox Tilesets API
- MapTiler
- Geoserver

---

## 方案 4: 按地區分割（平衡方案）

將全球數據按地區分割，按需加載。

### 分割策略

1. **按大洲**：亞洲、歐洲、美洲、非洲、大洋洲
2. **按國家組**：東亞、東南亞、歐洲、北美等
3. **按經緯度**：劃分成網格

### 示例：按大洲分割

```bash
# 使用 mapshaper 按屬性分割
# 需要先添加大洲屬性，然後：
mapshaper data/gadm/gadm_level0.geojson \
  -split continent \
  -o data/gadm/regions/ format=geojson
```

### 客戶端實現

```javascript
// 根據地圖中心點判斷需要加載哪個區域
function getRegionByBounds(bounds) {
  const center = bounds.getCenter();
  const lat = center.lat;
  const lng = center.lng;
  
  if (lat > 10 && lat < 50 && lng > 70 && lng < 150) {
    return 'asia';
  }
  // ... 其他區域判斷
  return 'world'; // 默認
}
```

---

## 推薦的實施順序

### 階段 1: 快速解決（立即）
✅ **使用方案 1（簡化優化）**
- 快速見效
- 文件大小可接受（50-400 MB）
- 適用於大多數場景

### 階段 2: 優化性能（中期）
🔄 **結合方案 4（按地區分割）**
- 只在需要時加載特定區域
- 進一步減少初始加載時間

### 階段 3: 生產環境（長期）
🚀 **採用方案 3（矢量瓦片）**
- 最佳性能和用戶體驗
- 適合大規模應用

---

## 立即行動：創建優化腳本

我已經為您準備了自動化腳本，運行以下命令即可：

```bash
# 1. 創建優化腳本（我會為您創建）
# 2. 運行優化
./scripts/optimize-gadm.sh
# 3. 檢查結果
ls -lh data/gadm/optimized/
```

---

## 測試優化效果

優化後，檢查文件大小：

```bash
# 比較原始文件和優化文件
du -h data/gadm/*.geojson data/gadm/optimized/*.geojson 2>/dev/null
```

如果優化後的文件還是太大（> 500 MB），可以增加簡化比例。

---

## 需要幫助？

如果遇到問題，請檢查：
1. `mapshaper` 是否已安裝
2. 文件路徑是否正確
3. 磁盤空間是否足夠（優化過程需要臨時空間）


