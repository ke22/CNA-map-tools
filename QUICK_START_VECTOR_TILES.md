# 矢量瓦片快速開始指南

## 🚀 5 分鐘快速開始

### 前提條件

1. **安裝 Tippecanoe**（轉換工具）
   ```bash
   # macOS
   brew install tippecanoe
   
   # Linux
   sudo apt-get install tippecanoe
   ```

2. **準備 Mapbox Token**
   - 登錄 [mapbox.com](https://account.mapbox.com/)
   - 複製 Access Token
   - 記下用戶名（在帳號設置中）

**注意：** 上傳到 Mapbox 有兩種方式：
- **方式 A：使用 Mapbox Upload API（推薦，無需額外安裝）**
- **方式 B：使用 Mapbox CLI（需要安裝 Python）**

---

## 步驟 1: 轉換 GeoJSON 為矢量瓦片

```bash
# 運行轉換腳本
./scripts/create-vector-tiles.sh
```

**時間預估：**
- Level 0: 10-30 分鐘
- Level 1: 15-40 分鐘  
- Level 2: 20-60 分鐘

**輸出：** `data/gadm/tiles/*.mbtiles` 文件

---

## 步驟 2: 上傳到 Mapbox

### 方式 A: 使用 curl（推薦，無需安裝）

```bash
# 設置 Token
export MAPBOX_ACCESS_TOKEN=your_token_here

# 使用 curl 腳本上傳
./scripts/upload-to-mapbox-curl.sh
```

### 方式 B: 使用 Mapbox CLI（需要 Python）

```bash
# 安裝 Mapbox CLI
pip install mapbox

# 設置 Token
export MAPBOX_ACCESS_TOKEN=your_token_here

# 上傳
mapbox upload your-username.gadm-level0 data/gadm/tiles/gadm_level0.mbtiles
mapbox upload your-username.gadm-level1 data/gadm/tiles/gadm_level1.mbtiles
mapbox upload your-username.gadm-level2 data/gadm/tiles/gadm_level2.mbtiles
```

**或使用 Mapbox Studio 網頁上傳：**
1. 登錄 [Mapbox Studio](https://studio.mapbox.com/)
2. 進入 Tilesets 頁面
3. 點擊 "New tileset"
4. 上傳 .mbtiles 文件

---

## 步驟 3: 更新應用代碼

### 3.1 更新配置

編輯 `js/app-vector-tiles.js`，更新 Tileset ID：

```javascript
const VECTOR_TILES_CONFIG = {
    TILESETS: {
        country: 'mapbox://your-username.gadm-level0',  // 改為您的
        state: 'mapbox://your-username.gadm-level1',
        city: 'mapbox://your-username.gadm-level2'
    }
};
```

### 3.2 集成到應用

在 `index-enhanced.html` 中引入：

```html
<script src="js/app-vector-tiles.js"></script>
```

### 3.3 修改加載邏輯

在 `js/app-enhanced.js` 中，將 `loadBoundarySourceForType` 改為使用矢量瓦片：

```javascript
// 替換原來的 GADM 加載
if (CONFIG.GADM.USE_VECTOR_TILES) {
    await loadVectorTilesSource(areaType);
} else if (CONFIG.GADM.USE_GADM_DATA) {
    await loadGADMSource(areaType);
} else {
    // 使用 Mapbox Boundaries
}
```

---

## 🎯 完整流程示例

```bash
# 1. 轉換
./scripts/create-vector-tiles.sh

# 2. 等待完成（約 1 小時）

# 3. 上傳
export MAPBOX_ACCESS_TOKEN=pk.eyJ1...
./scripts/upload-to-mapbox.sh

# 4. 更新代碼中的 Tileset ID

# 5. 測試！
```

---

## 📊 預期結果

**轉換前：**
- GeoJSON: 2.1 GB
- 加載時間: 無法加載 ❌

**轉換後：**
- MBTiles: 100-500 MB（壓縮後）
- 實際加載: 5-10 MB（只加載可見瓦片）
- 加載時間: < 1 秒 ✅

---

## ❓ 常見問題

**Q: 轉換需要多長時間？**
A: 取決於文件大小，通常 1-2 小時。

**Q: MBTiles 文件大小？**
A: 通常比原始 GeoJSON 小 50-70%，但需要先上傳。

**Q: 可以本地測試嗎？**
A: 可以，使用 TileServer GL：
```bash
npm install -g tileserver-gl
tileserver-gl data/gadm/tiles/gadm_level0.mbtiles
```

**Q: Mapbox 費用？**
A: 免費額度通常足夠，超出後按使用量計費。

---

## 🔄 與優化 GeoJSON 對比

| 指標 | 優化 GeoJSON | 矢量瓦片 |
|------|-------------|---------|
| 初始加載 | 400 MB | 5-10 MB |
| 縮放性能 | 中等 | 優秀 |
| 實施難度 | ⭐⭐ | ⭐⭐⭐⭐ |
| 適合場景 | 小規模 | 生產環境 |

---

## 📚 更多信息

查看完整指南：`SOLUTION_VECTOR_TILES.md`

