# 混合方案：Mapbox + GADM

## 📊 方案說明

由於 Mapbox 免費帳號只提供國家邊界（adm0），州/省（adm1）和縣市（adm2）需要付費帳號，我們實施了混合方案：

### 數據來源

- **國家（country）** → Mapbox Boundaries（免費）
  - ✅ 穩定、快速
  - ✅ 免費帳號可用
  - ✅ 使用 `mapbox://mapbox.boundaries-adm0-v3`

- **州/省（state）** → GADM 數據（免費）
  - ✅ 完全免費
  - ✅ 避免 402 錯誤
  - ✅ 使用本地數據：`data/gadm/optimized/gadm_level1_optimized.geojson`

- **縣市（city）** → GADM 數據（免費）
  - ✅ 完全免費
  - ✅ 避免 402 錯誤
  - ✅ 使用本地數據：`data/gadm/optimized/gadm_level2_optimized.geojson`

## 🔧 技術實現

### 1. 加載邏輯（`loadBoundarySourceForType`）

```javascript
// 混合方案邏輯
if (areaType === 'state' || areaType === 'city') {
    // 使用 GADM 數據
    await window.GADM_LOADER.loadBoundarySourceForType(areaType, createVisibleLayer);
} else {
    // 使用 Mapbox Boundaries
    // ... Mapbox 加載邏輯
}
```

### 2. 查詢函數（`queryFeaturesAtPoint`）

函數已更新以支持兩種數據源：
- 優先查詢指定圖層
- 自動過濾 Mapbox 基礎圖層（landuse, water 等）
- 支持 GADM 特徵識別（通過 GID_0, GID_1, GID_2 屬性）

### 3. 名稱和 ID 獲取

`getAreaName` 和 `getAreaId` 函數已更新：
- 自動檢測 GADM 特徵（通過 GID 屬性）
- 優先使用 GADM_LOADER 的方法
- 備選方案：直接讀取屬性

## 📁 文件結構

```
data/gadm/optimized/
├── gadm_level0_optimized.geojson  (國家 - 目前未使用，使用 Mapbox)
├── gadm_level1_optimized.geojson  (州/省 - ✅ 使用中)
└── gadm_level2_optimized.geojson  (縣市 - ✅ 使用中)
```

## ✅ 優勢

1. **完全免費**：無需 Mapbox 付費帳號即可使用所有層級
2. **避免 402 錯誤**：行政區數據使用本地 GADM，不受 Mapbox 限制
3. **最佳性能**：國家邊界使用 Mapbox 的 CDN，快速穩定
4. **無縫切換**：用戶在不同層級間切換時，系統自動選擇合適的數據源

## 🚀 使用方法

1. 確保 GADM 數據文件存在於 `data/gadm/optimized/`
2. 確保 `app-gadm.js` 已加載（已在 `index-enhanced.html` 中引入）
3. 刷新瀏覽器頁面
4. 切換到"行政區"模式即可使用州/省和縣市邊界

## 📝 注意事項

- GADM 數據文件較大（每個約 88MB），首次加載可能需要一些時間
- 建議使用優化後的 GeoJSON 文件以減少加載時間
- 如果遇到問題，檢查瀏覽器控制台的錯誤訊息

## 🔄 未來優化

- [ ] 考慮使用矢量瓦片（MBTiles）進一步優化性能
- [ ] 實現數據預加載機制
- [ ] 添加加載進度指示器


