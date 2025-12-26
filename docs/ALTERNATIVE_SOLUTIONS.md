# 行政區疊加替代方案（不使用 GADM）

## 📊 方案對比

| 方案 | 優點 | 缺點 | 適用場景 |
|------|------|------|----------|
| **Natural Earth Data** | 免費、文件小、易處理 | 精度較低 | 一般用途、概覽地圖 |
| **OpenStreetMap (OSM)** | 免費、數據豐富 | 需要處理、文件大 | 需要詳細數據 |
| **按國家分割** | 文件小、加載快 | 需要準備數據 | 只關注特定國家 |
| **在線 GeoJSON API** | 無需本地存儲 | 依賴網路 | 網路良好的環境 |

## 🎯 推薦方案：Natural Earth Data

### 方案 1：Natural Earth Data（最簡單）

**優點**：
- ✅ 完全免費
- ✅ 文件較小（相對於 GADM）
- ✅ 提供多級行政區
- ✅ 可直接下載 GeoJSON 格式

**數據下載**：
- Admin 0 (Countries): https://www.naturalearthdata.com/downloads/10m-cultural-vectors/
- Admin 1 (States/Provinces): https://www.naturalearthdata.com/downloads/10m-cultural-vectors/
- Admin 2 (Counties): https://www.naturalearthdata.com/downloads/10m-cultural-vectors/

**實施步驟**：
1. 下載 Natural Earth 數據（10m 精度）
2. 轉換為 GeoJSON（如果需要）
3. 放置在 `data/natural-earth/` 目錄
4. 創建加載器（類似 GADM loader）

### 方案 2：按國家分割 GeoJSON（最實用）

**優點**：
- ✅ 文件極小（只包含需要的國家）
- ✅ 加載速度快
- ✅ 可以使用現有的 GADM 數據，但只提取特定國家

**實施步驟**：
1. 從 GADM 數據中提取特定國家的行政區
2. 保存為單獨的 GeoJSON 文件
3. 按需加載（例如：只加載台灣的州/省和縣市）

**文件結構**：
```
data/countries/
├── TWN/
│   ├── states.geojson    (~500KB)
│   └── cities.geojson    (~1MB)
├── USA/
│   ├── states.geojson
│   └── cities.geojson
└── ...
```

### 方案 3：在線 GeoJSON API

**使用第三方 API**：
- REST Countries API（國家級）
- GeoNames API（多級行政區，需要註冊）

**優點**：
- ✅ 無需本地存儲
- ✅ 數據自動更新

**缺點**：
- ⚠️ 依賴網路
- ⚠️ 可能有 API 限制

## 🚀 快速實施：按國家分割方案

### 步驟 1：提取特定國家的行政區

```bash
# 使用 Python 提取台灣的行政區
python3 scripts/extract-country.py TWN
```

### 步驟 2：簡化數據

```bash
# 使用 mapshaper 簡化（如果需要）
mapshaper data/countries/TWN/states.geojson -simplify 10% -o data/countries/TWN/states-simple.geojson
```

### 步驟 3：按需加載

當用戶選擇國家後，只加載該國家的行政區數據。

**優勢**：
- 文件大小：從 88MB → ~500KB（減少 99%）
- 加載速度：從 30秒 → <1秒
- 只加載需要的數據

## 💡 最佳實踐建議

### 推薦組合方案：

1. **國家邊界**：使用 Mapbox Boundaries（免費、穩定）
2. **行政區**：使用按國家分割的 GeoJSON
   - 預先提取常用國家（台灣、美國、中國等）
   - 其他國家按需提取

### 數據準備流程：

```bash
# 1. 提取特定國家的行政區
python3 scripts/extract-country.py TWN --output data/countries/TWN/

# 2. 簡化數據（可選）
mapshaper data/countries/TWN/states.geojson -simplify 10% \
  -o data/countries/TWN/states-simple.geojson

# 3. 檢查文件大小
ls -lh data/countries/TWN/
```

## 📝 實施建議

**最快速方案**：
1. 提取常用國家的行政區數據（如：台灣、中國、美國）
2. 創建簡化的加載器
3. 按國家動態加載

**文件大小對比**：
- GADM 全球數據：~88MB × 2 = 176MB
- 單個國家（台灣）：~500KB × 2 = 1MB
- 減少：99.4%

## 🔧 下一步

我可以幫您：
1. 創建提取腳本（從 GADM 提取特定國家）
2. 實施簡化的加載器
3. 實現按需加載邏輯

您想先實施哪個方案？


