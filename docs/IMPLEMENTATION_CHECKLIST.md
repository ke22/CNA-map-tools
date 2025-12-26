# 矢量瓦片實施檢查清單

## 📋 實施步驟

### 階段 1: 準備（30 分鐘）

- [ ] **安裝 Tippecanoe**
  ```bash
  brew install tippecanoe  # macOS
  # 或
  sudo apt-get install tippecanoe  # Linux
  ```
  
- [ ] **安裝 Mapbox CLI**（如果使用 Mapbox 託管）
  ```bash
  npm install -g @mapbox/mapbox-cli-py
  ```

- [ ] **準備 Mapbox Token**
  - 登錄 [mapbox.com](https://account.mapbox.com/)
  - 獲取 Access Token
  - 記下用戶名

### 階段 2: 轉換（1-2 小時）

- [ ] **運行轉換腳本**
  ```bash
  ./scripts/create-vector-tiles.sh
  ```
  
- [ ] **等待轉換完成**
  - Level 0: 10-30 分鐘
  - Level 1: 15-40 分鐘
  - Level 2: 20-60 分鐘
  - **總計約 1-2 小時**

- [ ] **驗證輸出文件**
  ```bash
  ls -lh data/gadm/tiles/*.mbtiles
  ```
  應該看到三個 .mbtiles 文件

### 階段 3: 上傳（30 分鐘）

- [ ] **設置環境變量**
  ```bash
  export MAPBOX_ACCESS_TOKEN=your_token_here
  ```

- [ ] **運行上傳腳本**
  ```bash
  ./scripts/upload-to-mapbox.sh
  ```
  或手動上傳每個文件：
  ```bash
  mapbox upload your-username.gadm-level0 data/gadm/tiles/gadm_level0.mbtiles
  mapbox upload your-username.gadm-level1 data/gadm/tiles/gadm_level1.mbtiles
  mapbox upload your-username.gadm-level2 data/gadm/tiles/gadm_level2.mbtiles
  ```

- [ ] **記下 Tileset ID**
  - `your-username.gadm-level0`
  - `your-username.gadm-level1`
  - `your-username.gadm-level2`

### 階段 4: 集成（1 小時）

- [ ] **更新配置**
  
  編輯 `js/app-vector-tiles.js`，更新 Tileset ID：
  ```javascript
  const VECTOR_TILES_CONFIG = {
      TILESETS: {
          country: 'mapbox://your-username.gadm-level0',
          state: 'mapbox://your-username.gadm-level1',
          city: 'mapbox://your-username.gadm-level2'
      }
  };
  ```

- [ ] **在 HTML 中引入**
  
  在 `index-enhanced.html` 中添加：
  ```html
  <script src="js/app-vector-tiles.js"></script>
  ```

- [ ] **修改加載邏輯**
  
  在 `js/app-enhanced.js` 中，修改 `loadBoundarySourceForType` 函數，優先使用矢量瓦片。

- [ ] **更新配置標誌**
  
  在 `config.js` 中添加：
  ```javascript
  GADM: {
      USE_VECTOR_TILES: true,  // 啟用矢量瓦片
      USE_GADM_DATA: false     // 禁用直接加載 GeoJSON
  }
  ```

### 階段 5: 測試（30 分鐘）

- [ ] **本地測試**
  - 打開應用
  - 切換邊界類型
  - 測試點擊選擇功能
  - 測試縮放和拖動

- [ ] **性能測試**
  - 檢查加載時間
  - 檢查內存使用
  - 檢查網絡請求

- [ ] **修復問題**
  - 調整屬性映射（如果需要）
  - 調整縮放級別
  - 調整樣式

### 階段 6: 部署（按需）

- [ ] **部署到生產環境**
- [ ] **監控性能**
- [ ] **收集用戶反饋**

---

## 🔍 問題排查

### 轉換失敗

**問題：** Tippecanoe 錯誤
- 檢查磁盤空間（需要足夠空間）
- 檢查內存（可能需要 8GB+ RAM）
- 嘗試先優化 GeoJSON 文件

### 上傳失敗

**問題：** Mapbox 上傳錯誤
- 檢查 Token 是否正確
- 檢查文件大小（Mapbox 有限制）
- 檢查網絡連接

### 瓦片不顯示

**問題：** 地圖上沒有顯示邊界
- 檢查 Tileset ID 是否正確
- 檢查 Token 權限
- 檢查瀏覽器控制台錯誤

### 點擊不工作

**問題：** 點擊選擇功能失效
- 檢查 source-layer 名稱是否正確
- 檢查屬性名稱映射
- 檢查查詢邏輯

---

## 📊 性能基準

轉換後應該達到：

| 指標 | 目標值 |
|------|--------|
| 初始加載 | < 10 MB |
| 加載時間 | < 2 秒 |
| 縮放流暢度 | 60 FPS |
| 內存使用 | < 200 MB |

---

## 📚 參考文檔

- 完整方案：`SOLUTION_VECTOR_TILES.md`
- 快速開始：`QUICK_START_VECTOR_TILES.md`
- Tippecanoe 文檔：https://github.com/felt/tippecanoe
- Mapbox Tilesets API：https://docs.mapbox.com/api/maps/

---

## ✅ 完成標準

實施完成後應該：
- ✅ 所有三級邊界都能正常顯示
- ✅ 點擊選擇功能正常
- ✅ 縮放和拖動流暢
- ✅ 加載速度快（< 2 秒）
- ✅ 無錯誤日誌


