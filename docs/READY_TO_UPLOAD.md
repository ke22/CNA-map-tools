# ✅ 準備完成 - 可以開始上傳！

## 🎯 當前狀態

### ✅ 已準備好

- ✅ **Token**: 已從 config.js 自動讀取
- ✅ **用戶名**: cnagraphicdesign
- ✅ **文件**: 3 個瓦片文件（21.4 GB）
- ✅ **腳本**: API 上傳腳本已就緒

### 📦 準備上傳的文件

- `data/gadm/tiles/gadm_level0.mbtiles` (8.4 GB)
- `data/gadm/tiles/gadm_level1.mbtiles` (6.4 GB)
- `data/gadm/tiles/gadm_level2.mbtiles` (6.6 GB)

---

## 🚀 開始上傳（一步到位）

### 命令

```bash
./scripts/upload-api-ready.sh
```

腳本會自動：
1. ✅ 從 config.js 讀取 Token
2. ✅ 使用用戶名: cnagraphicdesign
3. ✅ 依次上傳三個文件
4. ✅ 顯示上傳進度

### 或者手動設置 Token

```bash
export MAPBOX_ACCESS_TOKEN=pk.eyJ1...
./scripts/upload-api-ready.sh
```

---

## ⏱️ 時間估算

### 上傳時間（取決於網速）

| 文件 | 大小 | 上傳時間 |
|------|------|---------|
| Level 0 | 8.4 GB | 30-60 分鐘 |
| Level 1 | 6.4 GB | 20-40 分鐘 |
| Level 2 | 6.6 GB | 20-40 分鐘 |

**總上傳時間：約 1-2 小時**

### 處理時間（Mapbox 後台）

每個文件處理時間：**2-6 小時**（免費帳號）

**總處理時間：約 6-18 小時**（可以同時處理）

---

## 📋 上傳後

### 1. 記錄 Tileset ID

上傳完成後，記下這些 ID：
- `cnagraphicdesign.gadm-level0`
- `cnagraphicdesign.gadm-level1`
- `cnagraphicdesign.gadm-level2`

### 2. 查看處理狀態

訪問：https://studio.mapbox.com/tilesets/

查看每個 tileset 的狀態：
- ⏳ Processing - 正在處理
- ✅ Ready - 已完成，可以使用

### 3. 更新應用代碼

處理完成後，編輯 `js/app-vector-tiles.js`：

```javascript
const VECTOR_TILES_CONFIG = {
    TILESETS: {
        country: 'mapbox://cnagraphicdesign.gadm-level0',
        state: 'mapbox://cnagraphicdesign.gadm-level1',
        city: 'mapbox://cnagraphicdesign.gadm-level2'
    }
};
```

---

## 💡 提示

- 上傳過程可以中斷（Ctrl+C），不會損壞文件
- 上傳完成後可以關閉終端，Mapbox 會在後台處理
- 處理完成後會顯示在 Mapbox Studio 中
- 可以隨時查看處理進度

---

## 🎯 現在就開始！

運行命令：

```bash
./scripts/upload-api-ready.sh
```

準備好了嗎？🚀


