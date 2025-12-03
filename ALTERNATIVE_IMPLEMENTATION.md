# 替代方案實施指南

## 🎯 推薦方案：按國家分割 GeoJSON

### 為什麼推薦這個方案？

1. **文件極小**
   - GADM 全球數據：88MB（每個級別）
   - 單個國家（台灣）：~500KB
   - **減少 99%+**

2. **加載快速**
   - 全球數據：30-60秒
   - 單個國家：<1秒
   - **提升 30-60倍**

3. **按需加載**
   - 用戶選擇國家後才加載該國家的行政區
   - 不需要加載全球數據

## 🚀 快速開始

### 步驟 1：提取特定國家的行政區

```bash
# 提取台灣的州/省和縣市
./scripts/extract-country.sh TWN

# 只提取州/省（level 1）
./scripts/extract-country.sh TWN 1

# 只提取縣市（level 2）
./scripts/extract-country.sh TWN 2
```

### 步驟 2：檢查提取的文件

```bash
# 查看文件大小
ls -lh data/countries/TWN/

# 應該看到：
# - states.geojson (~500KB)
# - cities.geojson (~1MB)
```

### 步驟 3：可選 - 簡化數據

如果文件還是太大，可以進一步簡化：

```bash
# 簡化州/省數據
mapshaper data/countries/TWN/states.geojson \
  -simplify 10% \
  -o data/countries/TWN/states-simple.geojson

# 簡化縣市數據
mapshaper data/countries/TWN/cities.geojson \
  -simplify 10% \
  -o data/countries/TWN/cities-simple.geojson
```

## 📋 其他替代方案

### 方案 A：Natural Earth Data

**下載地址**：
- Admin 0 (Countries): https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_admin_0_countries.zip
- Admin 1 (States): https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_admin_1_states_provinces.zip

**優點**：
- 文件較小
- 完全免費
- 易於使用

**缺點**：
- 精度較 GADM 低
- 某些國家/地區的行政區可能不完整

### 方案 B：OpenStreetMap (OSM)

**數據來源**：
- Overpass API: https://overpass-turbo.eu/
- Geofabrik Downloads: https://download.geofabrik.de/

**優點**：
- 數據非常詳細
- 定期更新
- 免費開源

**缺點**：
- 文件很大
- 需要複雜的處理

### 方案 C：在線 API

**可用的 API**：
1. **GeoNames API**（需要註冊）
   - 提供多級行政區數據
   - 有免費額度

2. **REST Countries API**
   - 只提供國家級數據
   - 不包含州/省和縣市

## 💡 實施建議

### 最佳實踐：

1. **常用國家預提取**
   - 台灣 (TWN)
   - 中國 (CHN)
   - 美國 (USA)
   - 日本 (JPN)
   - 等常用國家

2. **按需提取其他國家**
   - 用戶選擇不常見國家時
   - 自動提取並緩存

3. **文件命名規範**
   ```
   data/countries/{COUNTRY_CODE}/
   ├── states.geojson      (州/省)
   └── cities.geojson      (縣市)
   ```

## 🔧 下一步

我可以幫您：
1. ✅ 創建提取腳本（已完成）
2. ⏳ 實施簡化的加載器（按國家加載）
3. ⏳ 實現兩層疊加功能（國家 + 行政區）

**您想要我現在開始實施嗎？**


