# 🚀 立即開始上傳

## 最快方式（推薦）

### 步驟 1: 打開 Mapbox Studio

**點擊這裡：** https://studio.mapbox.com/tilesets/

### 步驟 2: 上傳文件

1. 點擊右上角 **"New tileset"** 按鈕
2. 選擇 **"Upload file"**
3. 拖放或選擇文件：`data/gadm/tiles/gadm_level0.mbtiles`
4. 等待上傳完成（約 20-40 分鐘）

### 步驟 3: 記錄 Tileset ID

上傳完成後，記下生成的 Tileset ID：
- 例如：`your-username.gadm-level0`

### 步驟 4: 重複上傳其他兩個文件

- `gadm_level1.mbtiles` → 記錄 ID: `your-username.gadm-level1`
- `gadm_level2.mbtiles` → 記錄 ID: `your-username.gadm-level2`

---

## 📍 文件位置

所有文件都在這裡：
```
/Users/yulincho/Documents/GitHub/map/data/gadm/tiles/
├── gadm_level0.mbtiles  (8.4 GB)
├── gadm_level1.mbtiles  (6.4 GB)
└── gadm_level2.mbtiles  (6.6 GB)
```

---

## ⏱️ 時間估算

| 文件 | 大小 | 預計時間 |
|------|------|---------|
| Level 0 | 8.4 GB | 1-2 小時 |
| Level 1 | 6.4 GB | 1 小時 |
| Level 2 | 6.6 GB | 1 小時 |

**總計：約 3-4 小時**（可以同時上傳多個文件以加快速度）

---

## ✅ 上傳完成後

1. 記錄三個 Tileset ID
2. 更新 `js/app-vector-tiles.js` 中的配置
3. 測試應用

詳細步驟請查看其他指南文件。

---

## 🎯 現在就開始！

**點擊開始：** https://studio.mapbox.com/tilesets/


