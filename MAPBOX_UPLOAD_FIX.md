# Mapbox CLI 安裝問題修正

## ❌ 錯誤信息

```
npm error 404 Not Found - GET https://registry.npmjs.org/@mapbox%2fmapbox-cli-py
npm error 404 '@mapbox/mapbox-cli-py@*' is not in this registry.
```

## ✅ 解決方案

`@mapbox/mapbox-cli-py` 不是正確的 npm 包名。Mapbox CLI 實際上是 Python 工具。

### 正確的安裝方法

#### 方式 1: 使用 curl 腳本（推薦，無需安裝）✨

我已經為您創建了一個使用 curl 的腳本，無需安裝任何額外工具：

```bash
# 設置 Token
export MAPBOX_ACCESS_TOKEN=your_token_here

# 運行上傳腳本
./scripts/upload-to-mapbox-curl.sh
```

這個腳本會：
- ✅ 使用 Mapbox Upload API
- ✅ 無需安裝任何額外工具
- ✅ 自動處理上傳流程

#### 方式 2: 使用 Python Mapbox CLI

```bash
# 安裝 Python 版本的 Mapbox CLI
pip install mapbox

# 設置 Token
export MAPBOX_ACCESS_TOKEN=your_token_here

# 使用命令
mapbox upload your-username.gadm-level0 data/gadm/tiles/gadm_level0.mbtiles
```

#### 方式 3: 使用 Mapbox Studio 網頁（最簡單）🌟

不需要安裝任何工具：

1. **登錄 Mapbox Studio**
   - 訪問：https://studio.mapbox.com/
   - 使用您的 Mapbox 帳號登錄

2. **進入 Tilesets 頁面**
   - 點擊左側導航的 "Tilesets"

3. **上傳文件**
   - 點擊 "New tileset" 按鈕
   - 選擇 "Upload file"
   - 選擇您的 .mbtiles 文件
   - 等待上傳和處理完成

4. **獲取 Tileset ID**
   - 上傳完成後，在 Tilesets 列表中可以看到
   - 格式：`your-username.tileset-name`

---

## 📋 建議的工作流程

### 推薦方式（最簡單）

```bash
# 步驟 1: 轉換為 MBTiles
./scripts/create-vector-tiles.sh

# 步驟 2: 等待轉換完成（1-2小時）

# 步驟 3: 使用網頁上傳到 Mapbox Studio
#   訪問: https://studio.mapbox.com/tilesets/
#   上傳: data/gadm/tiles/*.mbtiles 文件

# 步驟 4: 記下 Tileset ID，更新代碼
```

### 或者使用腳本自動上傳

```bash
# 步驟 1: 轉換
./scripts/create-vector-tiles.sh

# 步驟 2: 上傳（使用 curl 腳本）
export MAPBOX_ACCESS_TOKEN=your_token_here
./scripts/upload-to-mapbox-curl.sh
```

---

## 🔍 驗證上傳

上傳完成後，您可以：

1. **在 Mapbox Studio 查看**
   - https://studio.mapbox.com/tilesets/
   - 查看 Tileset 狀態和詳細信息

2. **使用 Tileset ID**
   - 格式：`mapbox://your-username.tileset-name`
   - 在代碼中使用：`js/app-vector-tiles.js`

---

## 📝 已更新的文件

- ✅ `scripts/upload-to-mapbox-curl.sh` - 新的 curl 版本腳本
- ✅ `QUICK_START_VECTOR_TILES.md` - 更新了上傳說明
- ✅ `SOLUTION_VECTOR_TILES.md` - 更新了上傳方法

現在您可以使用最簡單的方式上傳了！


