# 方案 3: 矢量瓦片（Vector Tiles）完整實施指南

## 🎯 為什麼選擇矢量瓦片？

**優點：**
- ✅ **最佳性能**：只傳輸可見區域的數據
- ✅ **自動簡化**：根據縮放級別自動調整細節
- ✅ **標準做法**：Mapbox 官方推薦方式
- ✅ **節省帶寬**：大幅減少數據傳輸量
- ✅ **可擴展**：支持無限大的數據集

**適用場景：**
- 生產環境
- 大規模應用
- 需要高性能的場景
- 需要支持大量用戶

---

## 📚 基礎概念

### 什麼是矢量瓦片？

矢量瓦片（Vector Tiles）是將地圖數據切成小塊（瓦片），每個瓦片只包含特定區域和縮放級別的數據。

**工作原理：**
```
全球數據 (2.1 GB)
    ↓
切成瓦片 (每個約 100-500 KB)
    ↓
按需加載 (只載入可見的瓦片)
    ↓
瀏覽器只接收幾 MB 的數據
```

---

## 🛠️ 實施方案選擇

### 方案 A: 使用 Tippecanoe（推薦）

**優點：**
- Mapbox 官方工具
- 功能強大
- 支持大型數據集

### 方案 B: 使用 Mapbox Tilesets API（最簡單）

**優點：**
- 無需服務器
- 自動處理
- Mapbox 託管

### 方案 C: 自建瓦片服務器

**優點：**
- 完全控制
- 可自定義
- 無依賴外部服務

---

## 方案 A: 使用 Tippecanoe（推薦）

### 步驟 1: 安裝 Tippecanoe

**macOS:**
```bash
brew install tippecanoe
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install tippecanoe

# 或從源代碼編譯
git clone https://github.com/felt/tippecanoe.git
cd tippecanoe
make -j
make install
```

**Windows:**
使用 WSL 或 Docker

**驗證安裝:**
```bash
tippecanoe --version
```

### 步驟 2: 轉換 GeoJSON 為 MBTiles

```bash
# 創建輸出目錄
mkdir -p data/gadm/tiles

# 轉換 Level 0 (國家)
tippecanoe \
  -o data/gadm/tiles/gadm_level0.mbtiles \
  -L country:data/gadm/gadm_level0.geojson \
  -z14 -Z0 \
  --minimum-zoom=0 \
  --maximum-zoom=14 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping

# 轉換 Level 1 (州/省)
tippecanoe \
  -o data/gadm/tiles/gadm_level1.mbtiles \
  -L state:data/gadm/gadm_level1.geojson \
  -z14 -Z0 \
  --minimum-zoom=0 \
  --maximum-zoom=14 \
  --drop-densest-as-still-dropping \
  --extend-zooms-if-still-dropping

# 轉換 Level 2 (城市/縣)
tippecanoe \
  -o data/gadm/tiles/gadm_level2.mbtiles \
  -L city:data/gadm/gadm_level2.geojson \
  -z14 -Z0 \
  --minimum-zoom=0 \
  --maximum-zoom=14 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping
```

**參數說明：**
- `-z14`: 最大縮放級別（14 級 = 街道級別）
- `-Z0`: 最小縮放級別（0 級 = 全球視圖）
- `--drop-densest-as-needed`: 自動丟棄過密的點以適應限制
- `--extend-zooms-if-still-dropping`: 如果仍需要丟棄，擴展縮放級別

### 步驟 3: 上傳到 Mapbox

**方式 A: 使用 curl（推薦，無需安裝額外工具）**

```bash
# 設置 Token
export MAPBOX_ACCESS_TOKEN=your_access_token

# 使用提供的腳本
./scripts/upload-to-mapbox-curl.sh
```

**方式 B: 使用 Python Mapbox CLI**

```bash
# 安裝 Mapbox CLI (Python)
pip install mapbox

# 設置 token
export MAPBOX_ACCESS_TOKEN=your_access_token

# 上傳瓦片集
mapbox upload your-username.gadm-level0 data/gadm/tiles/gadm_level0.mbtiles
mapbox upload your-username.gadm-level1 data/gadm/tiles/gadm_level1.mbtiles
mapbox upload your-username.gadm-level2 data/gadm/tiles/gadm_level2.mbtiles
```

**方式 C: 使用 Mapbox Studio 網頁上傳**

1. 登錄 [Mapbox Studio](https://studio.mapbox.com/)
2. 進入 "Tilesets" 頁面
3. 點擊 "New tileset" → "Upload file"
4. 選擇 .mbtiles 文件上傳

### 步驟 4: 在應用中使用

更新代碼以使用 Mapbox 瓦片源：

```javascript
// 使用 Mapbox Tilesets API
map.addSource('gadm-country', {
    'type': 'vector',
    'url': 'mapbox://your-username.gadm-level0'
});

map.addLayer({
    'id': 'gadm-country-layer',
    'type': 'fill',
    'source': 'gadm-country',
    'source-layer': 'country',
    'paint': {
        'fill-color': '#088',
        'fill-opacity': 0.4
    }
});
```

---

## 方案 B: 使用 Mapbox Tilesets API（最簡單）

### 步驟 1: 上傳 GeoJSON 到 Mapbox

使用 Mapbox Tilesets API 自動轉換：

```bash
# 使用 Mapbox CLI
npm install -g @mapbox/mapbox-cli-py

# 設置 token
export MAPBOX_ACCESS_TOKEN=your_access_token

# 上傳並自動轉換
mapbox upload gadm-level0 --tileset data/gadm/gadm_level0.geojson
mapbox upload gadm-level1 --tileset data/gadm/gadm_level1.geojson
mapbox upload gadm-level2 --tileset data/gadm/gadm_level2.geojson
```

**注意：** 文件大小限制為 5GB，需要處理大文件時可能需要先優化。

### 步驟 2: 在應用中使用

同方案 A 的步驟 4。

---

## 方案 C: 自建瓦片服務器

### 選項 1: 使用 TileServer GL（推薦）

**安裝:**
```bash
npm install -g tileserver-gl
```

**啟動服務器:**
```bash
# 創建配置文件 config.json
tileserver-gl data/gadm/tiles/gadm_level0.mbtiles \
  --port 8080 \
  --host 0.0.0.0
```

**在應用中使用:**
```javascript
map.addSource('gadm-country', {
    'type': 'vector',
    'tiles': ['http://localhost:8080/data/gadm-level0/{z}/{x}/{y}.pbf'],
    'minzoom': 0,
    'maxzoom': 14
});
```

### 選項 2: 使用 PostGIS + MapServer

適合已有 PostgreSQL 數據庫的情況。

---

## 🚀 快速實施腳本

我已經為您創建了自動化腳本：

### 1. 轉換腳本: `scripts/create-vector-tiles.sh`

自動將 GeoJSON 轉換為 MBTiles。

### 2. 上傳腳本: `scripts/upload-to-mapbox.sh`

自動上傳到 Mapbox（如果使用方案 B）。

---

## 📊 性能對比

| 方案 | 初始加載 | 縮放性能 | 所需服務器 | 成本 |
|------|---------|---------|-----------|------|
| **原始 GeoJSON** | 2.1 GB | ❌ 慢 | 無 | $0 |
| **優化 GeoJSON** | 400 MB | ⚠️ 中等 | 無 | $0 |
| **矢量瓦片 (Tippecanoe)** | 5-10 MB | ✅ 快 | 需要 | $0-低 |
| **Mapbox Tilesets** | 5-10 MB | ✅ 快 | 無 | 低-中 |

---

## 🎯 推薦的實施路徑

### 階段 1: 快速測試（1小時）
1. 使用方案 B（Mapbox Tilesets API）
2. 上傳 Level 0 測試
3. 驗證功能

### 階段 2: 完整實施（1天）
1. 使用方案 A（Tippecanoe）
2. 轉換所有級別
3. 部署到服務器

### 階段 3: 生產優化（按需）
1. 監控性能
2. 調整縮放級別
3. 優化瓦片參數

---

## 📝 下一步

1. **查看自動化腳本**：`scripts/create-vector-tiles.sh`
2. **選擇實施方案**：A、B 或 C
3. **開始轉換**：運行腳本

需要我幫您創建自動化腳本嗎？

