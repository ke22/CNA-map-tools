# ⚠️ 免費帳號重要提示

## 🚨 關鍵限制

### Mapbox Studio 網頁上傳限制

**單個文件最大：300 MB**

您的文件都超過了這個限制：
- ❌ Level 0: 8.4 GB (> 300 MB)
- ❌ Level 1: 6.4 GB (> 300 MB)
- ❌ Level 2: 6.6 GB (> 300 MB)

**結論：❌ 不能使用網頁上傳！**

---

## ✅ 解決方案：必須使用 API 上傳

### 方式 1: 使用提供的 curl 腳本（推薦）

**這是唯一可行的方法！**

```bash
# 1. 設置 Token
export MAPBOX_ACCESS_TOKEN=pk.eyJ1...

# 2. 運行上傳腳本
./scripts/upload-to-mapbox-curl.sh
```

這個腳本使用 Mapbox Uploads API，支持：
- ✅ 單個文件最大 25 GB（您的文件符合）
- ✅ 免費帳號可用
- ✅ 自動化上傳流程

---

## 🎯 免費帳號上傳步驟（正確方式）

### 步驟 1: 獲取信息

1. **Mapbox Access Token**
   - 訪問：https://account.mapbox.com/
   - 複製您的 Default public token
   - 或在 config.js 中已有：`pk.eyJ1IjoiY25hZ3Jhc...`

2. **Mapbox 用戶名**
   - 訪問：https://studio.mapbox.com/
   - 查看右上角或用戶名 : cnagraphicdesign
   - 或在 URL 中：`https://studio.mapbox.com/your-username/`

### 步驟 2: 設置環境變量

```bash
export MAPBOX_ACCESS_TOKEN=your_token_here
```

### 步驟 3: 運行上傳腳本

```bash
./scripts/upload-to-mapbox-curl.sh
```

腳本會：
- 提示輸入用戶名
- 自動上傳所有三個文件
- 使用 API（支持大文件）

---

## ⏱️ 處理時間

使用 API 上傳後：
- 上傳時間：取決於網速（可能 30-60 分鐘/文件）
- 處理時間：2-6 小時/文件（免費帳號）

**總計：可能需要一整天**

---

## 💡 替代方案：使用優化 GeoJSON（更快）

如果不想等待長時間處理，可以使用方案 1（簡化 GeoJSON）：

```bash
# 生成優化的 GeoJSON（無需上傳）
./scripts/optimize-gadm.sh
```

這會生成：
- Level 0: 約 50-100 MB
- Level 1: 約 100-200 MB
- Level 2: 約 200-400 MB

這些文件：
- ✅ 可以直接在應用中使用
- ✅ 無需上傳到 Mapbox
- ✅ 無需等待處理
- ⚠️ 性能略低於矢量瓦片（但仍可用）

---

## 🎯 兩個方案對比

| 特性 | 矢量瓦片 (API上傳) | 優化 GeoJSON |
|------|------------------|-------------|
| **文件大小** | 21.4 GB | 350-700 MB |
| **上傳時間** | 2-3 小時 | 0（無需上傳） |
| **處理時間** | 5-10 小時 | 0（直接使用） |
| **性能** | ✅ 最佳 | ⚠️ 良好 |
| **適合** | 生產環境 | 快速開始 |

---

## 📋 我的建議

### 對於免費帳號：

**選項 1: 快速開始（推薦）**
```bash
# 生成優化 GeoJSON
./scripts/optimize-gadm.sh
# 立即使用，無需等待
```

**選項 2: 最佳性能（需要等待）**
```bash
# 使用 API 上傳矢量瓦片
export MAPBOX_ACCESS_TOKEN=...
./scripts/upload-to-mapbox-curl.sh
# 等待 5-10 小時處理
```

---

## 🚀 立即開始

### 快速方案（推薦）

```bash
./scripts/optimize-gadm.sh
```

### 最佳性能方案

```bash
export MAPBOX_ACCESS_TOKEN=pk.eyJ1...
./scripts/upload-to-mapbox-curl.sh
```

您想使用哪個方案？

