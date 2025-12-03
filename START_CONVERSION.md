# 🚀 開始 GADM 文件轉換

## 📋 **轉換步驟**

### **步驟 1：提取層級**（從 gadm_410-levels.gpkg）

從組合文件中提取三個層級：
- Level 0: 國家邊界
- Level 1: 第一級行政區
- Level 2: 第二級行政區

```bash
./scripts/extract-levels.sh
```

**預計時間：** 30-60 分鐘  
**輸出文件：** 
- `gadm_level0.gpkg`
- `gadm_level1.gpkg`
- `gadm_level2.gpkg`

---

### **步驟 2：轉換為 GeoJSON**

將提取的 .gpkg 文件轉換為 GeoJSON 格式：

```bash
node scripts/convert-gadm.js
```

**預計時間：** 1-3 小時（取決於文件大小）  
**輸出文件：**
- `gadm_level0.geojson`
- `gadm_level1.geojson`
- `gadm_level2.geojson`

---

### **步驟 3：優化（自動執行）**

如果 mapshaper 已安裝，會自動優化文件：

**預計時間：** 30-60 分鐘  
**輸出文件：**
- `gadm_level0_optimized.geojson`
- `gadm_level1_optimized.geojson`
- `gadm_level2_optimized.geojson`

---

## ⚠️ **重要提示**

1. **時間：** 整個過程可能需要 2-4 小時
2. **空間：** 需要至少 20-30 GB 的可用磁盤空間
3. **內存：** 轉換過程可能使用大量內存
4. **中斷：** 可以隨時中斷（Ctrl+C），已完成的文件會保留

---

## ✅ **開始轉換**

準備好後，執行：

```bash
# 步驟 1：提取層級
./scripts/extract-levels.sh

# 步驟 2：轉換（會自動優化）
node scripts/convert-gadm.js
```

---

**準備開始！** 🚀


