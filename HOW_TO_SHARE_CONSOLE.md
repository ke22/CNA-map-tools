# 📋 如何提供控制台內容

## 方法 1：直接複製（推薦）

### Chrome / Edge / Brave

1. **打開開發者工具**
   - Windows/Linux: 按 `F12` 或 `Ctrl + Shift + I`
   - Mac: 按 `Cmd + Option + I`

2. **切換到 Console 標籤頁**
   - 點擊頂部的 "Console" 標籤

3. **清除舊日誌（可選）**
   - 點擊控制台左上角的 🚫 清除按鈕，或按 `Ctrl + L` (Mac: `Cmd + K`)

4. **重現問題**
   - 點擊地圖上的國家
   - 等待日誌出現

5. **複製日誌**
   - **方法 A**：右鍵點擊控制台 → 選擇 "Save as..." → 保存為 `.txt` 文件
   - **方法 B**：選中所有日誌文本 → 按 `Ctrl + C` (Mac: `Cmd + C`) → 貼到聊天框
   - **方法 C**：點擊控制台右上角的三個點 (⋮) → "Save as..." → 保存文件

### Firefox

1. **打開開發者工具**
   - Windows/Linux: 按 `F12` 或 `Ctrl + Shift + I`
   - Mac: 按 `Cmd + Option + I`

2. **切換到 Console 標籤頁**

3. **清除舊日誌（可選）**
   - 點擊控制台右上角的清除按鈕

4. **重現問題**
   - 點擊地圖上的國家

5. **複製日誌**
   - 選中日誌文本 → 按 `Ctrl + C` (Mac: `Cmd + C`) → 貼到聊天框
   - 或右鍵 → "Export visible messages to file"

### Safari

1. **先啟用開發者工具**
   - Safari → 偏好設置 → 進階 → 勾選 "在選單欄顯示開發選單"

2. **打開開發者工具**
   - Mac: 按 `Cmd + Option + I`

3. **切換到 Console 標籤頁**

4. **複製日誌**
   - 選中文本 → 複製

---

## 方法 2：截圖（如果文字太多）

如果日誌太多，可以截圖：

1. **截圖整個控制台**
   - Windows: `Windows + Shift + S`
   - Mac: `Cmd + Shift + 4`，然後選擇區域

2. **或使用瀏覽器截圖工具**
   - Chrome: 按 `F12` → 點擊控制台右上角的三個點 → "Capture screenshot"

---

## 方法 3：只複製關鍵日誌

如果日誌太多，可以只複製關鍵部分：

### 查找關鍵日誌

在控制台中查找以下關鍵字，然後複製相關的日誌：

```
🔍 Querying for country
✅ GADM source exists
🔍 getAreaName called
✅ Got country name
⚠️ No country name found
❌ Error
```

### 使用過濾器

1. **Chrome/Edge**
   - 在控制台頂部的過濾框輸入關鍵字，例如：`getAreaName` 或 `country`
   - 只會顯示包含該關鍵字的日誌

2. **Firefox**
   - 使用搜索框（`Ctrl + F` 或 `Cmd + F`）過濾日誌

---

## 方法 4：使用 console.log 保存

如果日誌很多，可以在控制台運行：

```javascript
// 複製所有控制台輸出
copy(console.memory);
```

然後貼到文本文件中。

---

## 📝 最佳實踐

### 推薦格式

當你提供控制台內容時，請包含：

1. **開始標記**：說明你要測試什麼
   ```
   我點擊了台灣（Taiwan）
   ```

2. **日誌內容**：從點擊開始的所有日誌

3. **結束標記**：說明結果
   ```
   結果：顯示了 "Unknown Country"
   ```

### 示例

```
=== 測試開始 ===
我點擊了地圖上的台灣

🔍 Querying for country at point: {x: 361, y: 406}
   Looking for layer: visible-boundaries-country
   ✅ GADM source exists: gadm-country
🔍 getAreaName called for country: {
  hasGID_0: true,
  GID_0: "TWN",
  COUNTRY: undefined,
  NAME_0: undefined,
  ...
}
⚠️ No country name found and GID_0 "TWN" not in COUNTRY_CODES mapping

=== 結果 ===
顯示了 "Unknown Country"
```

---

## 🎯 最簡單的方法

**推薦使用以下步驟**：

1. 打開瀏覽器控制台（F12）
2. 切換到 Console 標籤
3. **清空控制台**（重要！）
4. 點擊地圖上的國家
5. **全選所有日誌**（Ctrl+A 或 Cmd+A）
6. **複製**（Ctrl+C 或 Cmd+C）
7. **貼到這裡**

就是這麼簡單！ 🎉

---

## ⚠️ 注意事項

- **不要**截圖整個瀏覽器窗口（會太大）
- **盡量**只複製 Console 標籤的內容
- **如果**日誌太多，可以先過濾關鍵字
- **記得**清空控制台再測試，避免舊日誌混在一起


