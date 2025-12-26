
# ✅ GADM 數據屬性字段檢查結果

## 📊 檢查結果

### 原始 GADM 數據（gadm_level0.geojson）

**台灣 (TWN) 特徵的屬性**：
```json
{
  "GID_0": "TWN",
  "COUNTRY": "Taiwan"
}
```

**結論**：
- ✅ **有屬性資料**
- ✅ 包含 `GID_0`: 國家代碼（ISO 3166-1 alpha-3）
- ✅ 包含 `COUNTRY`: 國家名稱（英文）
- ❌ **不包含** `NAME_0`、`ISO`、`NAME_EN` 等其他字段

### 優化版本（gadm_level0_optimized.geojson）

**台灣 (TWN) 特徵的屬性**：
```json
{
  "GID_0": "TWN",
  "COUNTRY": "Taiwan"
}
```

**結論**：
- ✅ 優化版本保留了關鍵字段 `GID_0` 和 `COUNTRY`
- ✅ 與原始數據一致

## 🔍 發現

### 1. GADM 數據結構簡潔

GADM Level 0（國家級）數據只包含兩個必要字段：
- `GID_0`: 國家代碼（例如 "TWN"）
- `COUNTRY`: 國家名稱（例如 "Taiwan"）

這是**正常**的，因為 Level 0 數據只需要這兩個字段就足夠了。

### 2. 為什麼沒有 NAME_0？

`NAME_0` 可能在其他級別（Level 1, Level 2）使用，但在 Level 0：
- 使用 `COUNTRY` 字段存儲國家名稱
- 這是 GADM 數據的標準格式

### 3. 代碼應該能正確工作

由於數據包含 `COUNTRY` 字段，代碼邏輯應該能夠正確獲取：
```javascript
const name = props.COUNTRY ||  // ✅ 應該能找到 "Taiwan"
            props.NAME_0 ||    // ❌ 不存在，但沒關係
            // ... 其他備選
```

## ✅ 解決方案

### 如果顯示 "Unknown Country"

可能的原因：
1. **查詢時沒有找到正確的特徵**
   - 查詢到了其他圖層的特徵（不是 GADM 特徵）
   - 圖層不可見或不可查詢

2. **屬性讀取有問題**
   - 特徵對象結構不正確
   - `feature.properties` 為空或 undefined

3. **使用了不同的數據源**
   - 可能使用了 Mapbox 數據而不是 GADM 數據

### 已實施的備選方案

即使 `COUNTRY` 字段不存在或讀取失敗，代碼也會：
1. 嘗試從 `COUNTRY_CODES` 映射表獲取名稱（使用 `GID_0`）
2. 如果映射表也沒有，使用 `GID_0` 作為顯示名稱
3. 最後才顯示 "Unknown Country"

## 📝 總結

**回答你的問題**：
- ✅ **原始 GADM 數據有屬性資料**
- ✅ 包含 `GID_0` 和 `COUNTRY` 兩個關鍵字段
- ✅ 這些字段足夠識別和顯示國家名稱
- ✅ 優化版本保留了這些字段

如果仍然顯示 "Unknown Country"，問題可能在於：
1. 數據加載失敗
2. 查詢時沒有找到 GADM 特徵
3. 屬性讀取邏輯有問題

