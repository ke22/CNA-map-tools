# Gemini API 優化指南

## 優化目標

減少 API 配額消耗，避免 429 Too Many Requests 錯誤。

## 已實現的優化

### 1. 緩存機制

- **自動緩存**：相同的新聞文本會使用緩存結果，不會重複調用 API
- **緩存過期**：緩存有效期 24 小時
- **緩存大小限制**：最多緩存 50 個請求結果

### 2. 請求間隔控制

- **最小間隔**：2 秒（可配置）
- **自動延遲**：如果請求過快，會自動等待

### 3. 防止重複請求

- **請求去重**：相同的請求同時發起時，會合併為一個
- **等待機制**：如果檢測到相同請求正在進行，會等待其完成並共享結果

## 使用方法

### 自動使用（無需額外代碼）

優化已自動集成到 `analyzeNewsWithGemini` 函數中，無需修改現有代碼。

### 手動管理緩存

```javascript
// 查看緩存統計
console.log(window.geminiCache.getStats());

// 清除所有緩存
window.geminiCache.clear();

// 清除過期緩存
window.geminiCache.clearExpired();
```

### 調整配置

如果需要調整緩存參數，可以在 `gemini-service-cache.js` 中修改：

```javascript
class GeminiServiceCache {
    constructor() {
        this.maxCacheSize = 50; // 最多緩存數量
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 緩存過期時間（毫秒）
        this.minRequestInterval = 2000; // 最小請求間隔（毫秒）
    }
}
```

## 配額管理建議

### 免費配額限制

根據 Gemini API 文檔，免費配額通常包括：
- **每分鐘請求數限制**
- **每天請求數限制**
- **每分鐘 token 數限制**

### 最佳實踐

1. **使用緩存**：相同內容只請求一次
2. **控制頻率**：避免短時間內大量請求
3. **監控使用**：定期檢查配額使用情況
   - https://ai.dev/usage?tab=rate-limit
   - https://aistudio.google.com/app/apikey

### 處理 429 錯誤

當遇到 429 錯誤時：

1. **等待重試**：錯誤訊息中會提示等待時間
2. **檢查配額**：查看配額使用情況
3. **升級計劃**：如果經常超限，考慮升級到付費計劃

## 緩存統計示例

```javascript
// 查看緩存狀態
const stats = window.geminiCache.getStats();
console.log('緩存統計:', {
    緩存數量: stats.cacheSize,
    進行中請求: stats.pendingRequests,
    上次請求時間: new Date(stats.lastRequestTime).toLocaleString()
});
```

## 測試緩存效果

```javascript
// 第一次請求（會調用 API）
const result1 = await analyzeNewsWithGemini('測試新聞');

// 第二次請求相同內容（使用緩存，不調用 API）
const result2 = await analyzeNewsWithGemini('測試新聞');
// 控制台會顯示：💾 [Cache] 使用緩存結果（避免 API 調用）
```

## 注意事項

- 緩存基於文本內容的哈希，內容相同才會使用緩存
- 緩存存儲在內存中，刷新頁面後會清除
- 如果需要持久化緩存，可以擴展為使用 localStorage



