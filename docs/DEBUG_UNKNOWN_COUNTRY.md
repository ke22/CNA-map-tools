
# 🔍 為什麼顯示 "Unknown Country" - 診斷指南

## 問題說明

如果地圖上顯示 "Unknown Country"，說明名稱獲取邏輯沒有找到正確的國家名稱。

## 可能的原因

### 1. 查詢時沒有找到 GADM 特徵

**症狀**：
- 控制台顯示 "No features found" 或 "Filtered to 0 features"
- 查詢到的特徵來自 Mapbox composite 圖層，而不是 GADM

**解決方法**：
- 確保 GADM 數據已正確加載
- 檢查圖層是否可見
- 嘗試增加查詢半徑

### 2. 查詢到的特徵沒有 GID 屬性

**症狀**：
- 控制台顯示查詢到了特徵，但特徵沒有 `GID_0` 屬性
- 特徵的 `source` 是 `composite` 而不是 `gadm-country`

**原因**：
- 查詢到了 Mapbox 的基礎圖層特徵，而不是 GADM 特徵

**解決方法**：
- 確保 GADM 圖層已創建並可見
- 確保點擊位置在 GADM 圖層的可見區域內

### 3. 特徵屬性中沒有名稱字段

**症狀**：
- 控制台顯示 "Got name from GADM_LOADER: Unknown Country"
- 特徵有 `GID_0` 但沒有 `COUNTRY` 或 `NAME_0`

**原因**：
- GADM 數據可能不完整
- 或者數據格式與預期不符

**解決方法**：
- 檢查 GADM GeoJSON 文件是否包含名稱字段
- 查看控制台中的屬性列表

### 4. GADM_LOADER 沒有正確加載

**症狀**：
- 控制台顯示 "GADM_LOADER not available"
- `window.GADM_LOADER` 為 undefined

**原因**：
- `app-gadm.js` 沒有正確加載
- 或加載順序錯誤

**解決方法**：
- 檢查 `index-enhanced.html` 中是否包含 `<script src="js/app-gadm.js"></script>`
- 檢查控制台是否有 JavaScript 錯誤

## 診斷步驟

1. **打開瀏覽器控制台**（F12 或 Cmd+Option+I）

2. **點擊地圖上的國家**

3. **查看控制台輸出**，尋找以下關鍵信息：
   - `🔍 Querying for country at point:` - 查詢開始
   - `✅ GADM source exists:` - GADM 源是否存在
   - `✅ Found X features from GADM source` - 是否找到 GADM 特徵
   - `🔍 getAreaName called for country:` - 名稱獲取過程
   - `✅ Got name from GADM_LOADER:` - 名稱獲取結果

4. **檢查特徵屬性**：
   ```javascript
   // 在控制台中運行：
   console.log(appState.map.getSource('gadm-country'));
   ```

5. **檢查圖層狀態**：
   ```javascript
   // 在控制台中運行：
   console.log(appState.map.getLayer('visible-boundaries-country'));
   console.log(appState.map.getLayoutProperty('visible-boundaries-country', 'visibility'));
   ```

## 常見解決方法

### 方法 1：刷新瀏覽器
硬刷新瀏覽器（Cmd+Shift+R 或 Ctrl+Shift+R），確保最新代碼已加載。

### 方法 2：檢查數據加載
確保 GADM 數據文件存在並已正確加載：
- 檢查 Network 標籤頁，查看是否有加載錯誤
- 確認文件路徑正確

### 方法 3：清除已選區域
如果已有選中的區域，先清除它們，然後重新點擊。

### 方法 4：檢查控制台錯誤
查看是否有 JavaScript 錯誤阻止了正確執行。

## 如果問題仍然存在

請提供以下信息：
1. 控制台的完整輸出（從點擊地圖開始）
2. 瀏覽器控制台是否有錯誤
3. Network 標籤頁中 GADM 文件的加載狀態

