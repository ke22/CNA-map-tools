# 地圖工具系統運作邏輯完整說明

## 一、系統架構概覽

### 1.1 技術棧
- **前端框架**: 純 JavaScript (Vanilla JS)
- **地圖引擎**: Mapbox GL JS v3.2.0
- **UI 設計**: Material Design 原則
- **數據格式**: GeoJSON, Vector Tiles
- **樣式**: 自定義 CSS

### 1.2 文件結構
```
map/
├── index-enhanced.html          # 主 HTML 文件
├── config.js                    # 配置文件（API Token, 地圖樣式等）
├── js/
│   ├── app-enhanced.js         # 主應用邏輯（核心文件）
│   ├── app-gadm.js             # GADM 數據加載器
│   ├── app-country-loader.js   # 國家特定數據加載器
│   └── utils/
│       └── country-codes.js    # 國家代碼映射表
├── css/
│   └── styles-enhanced.css     # 樣式文件
└── data/
    └── gadm/                   # GADM 地理數據
```

---

## 二、初始化流程

### 2.1 應用啟動流程

```
1. DOMContentLoaded 事件觸發
   ↓
2. 驗證 Mapbox Token (config.js)
   ↓
3. 設置 mapboxgl.accessToken
   ↓
4. 調用 initializeApp()
   ├── initializeMap()       # 初始化地圖
   ├── initializeUI()        # 初始化 UI 控件
   └── setupEventListeners() # 設置事件監聽器
```

### 2.2 地圖初始化

**`initializeMap()`** 函數執行：

1. **創建 Mapbox 地圖實例**
   - 使用 `config.js` 中的樣式 URL
   - 設置中心點、縮放級別、最小/最大縮放

2. **等待地圖加載完成** (`map.on('load')`)
   - 調用 `loadBoundarySources()` - 加載邊界數據源
   - 調用 `cacheLabelLayerIds()` - 緩存標籤圖層 ID
   - 隱藏加載動畫
   - 延遲 500ms 後創建可見邊界圖層

3. **綁定地圖事件**
   - `click` → `handleMapClick()` - 處理地圖點擊
   - `mousemove` → `handleMapHover()` - 處理鼠標懸停
   - `error` → 錯誤處理

---

## 三、應用狀態管理

### 3.1 全局狀態對象 (`appState`)

```javascript
appState = {
    map: null,                    // Mapbox 地圖實例
    currentAreaType: 'country',   // 當前邊界類型: 'country' | 'administration'
    administrationLevel: null,    // 行政區級別: 'state' | 'city' | null
    selectedAreas: [],            // 已選區域數組 [{ id, name, type, color, layerId }]
    selectedCountry: null,        // 兩層模式下的選定國家 { id, name }
    currentColor: '#6CA7A1',      // 當前選中的顏色
    mapStyle: 'light',            // 地圖樣式: 'light' | 'satellite' | 'streets' | 'dark'
    labelsVisible: true,          // 標籤是否可見
    labelLayerIds: [],            // 緩存的標籤圖層 ID
    boundaryMode: 'fill',         // 邊界模式: 'fill' | 'line'
    sources: {                    // 數據源狀態
        adm0: null,               // 國家級 (Administrative Level 0)
        adm1: null,               // 州/省級 (Administrative Level 1)
        adm2: null                // 縣/市級 (Administrative Level 2)
    }
}
```

---

## 四、數據加載系統

### 4.1 邊界數據源策略

系統採用**混合數據源策略**，優先級順序：

#### 策略 1: Mapbox 矢量瓦片（國家級）
- **源**: `mapbox://mapbox.country-boundaries-v1`
- **用途**: 國家邊界（ADM0）
- **優點**: 自動更新、免費、快速
- **限制**: Mapbox 免費帳戶不提供行政區數據

#### 策略 2: 國家特定 GeoJSON（行政區）
- **源**: `./data/countries/{countryCode}/{areaType}.geojson`
- **用途**: 特定國家的州/省、縣/市邊界
- **優點**: 文件小、加載快、精度高
- **限制**: 需要為每個國家準備數據文件

#### 策略 3: GADM 數據（全局行政區，備選）
- **源**: `./data/gadm/optimized/gadm_level{0|1|2}_optimized.geojson`
- **用途**: 全局行政區邊界（如果國家特定數據不可用）
- **優點**: 覆蓋全球、統一格式
- **限制**: 文件大（121MB+）、加載慢

### 4.2 數據加載流程

```
loadBoundarySources()
   ↓
loadBoundarySourceForType(areaType)
   ├── 檢查數據源是否已加載
   ├── 根據 areaType 選擇數據源策略
   │   ├── 'country' → 嘗試 Mapbox 或 GADM Level 0
   │   ├── 'state' → 優先國家特定數據 → GADM Level 1
   │   └── 'city' → 優先國家特定數據 → GADM Level 2
   ├── 加載數據源（addSource）
   └── 創建可見圖層（createVisibleBoundaryLayer）
```

### 4.3 圖層創建流程

**`createVisibleBoundaryLayer(areaType)`**:

1. 確定源 ID 和圖層 ID
2. 檢查源是否已存在
3. 創建兩個圖層：
   - **填充圖層** (`visible-boundaries-{areaType}`)
     - 類型: `fill`
     - 初始可見性: `visible`
     - 顏色: 透明（等待用戶選擇）
   - **線條圖層** (`visible-boundaries-{areaType}-lines`)
     - 類型: `line`
     - 初始可見性: `visible`
     - 顏色: 深灰色

---

## 五、用戶交互流程

### 5.1 區域選擇流程

```
用戶點擊地圖
   ↓
handleMapClick(e)
   ↓
detectBoundaryAtPoint(e.lngLat)
   ├── 根據 currentAreaType 決定查詢策略
   │   ├── 'country' → tryBoundaryLevel(point, 'country')
   │   └── 'administration' → 先試 city → 再試 state
   ↓
tryBoundaryLevel(point, areaType)
   ├── queryFeaturesAtPoint(point, areaType)
   │   ├── 優先查詢特定圖層
   │   ├── 如果沒有結果，查詢所有圖層並過濾
   │   └── 過濾 GADM 特徵（通過 source 和 GID 屬性）
   ├── 如果找到特徵：
   │   ├── getAreaId(feature, areaType)    # 獲取區域 ID
   │   ├── getAreaName(feature, areaType)  # 獲取區域名稱
   │   └── 返回 { feature, areaType, areaId, areaName }
   └── 返回 null（未找到）
   ↓
如果找到區域：
   ├── 檢查是否已選擇（防止重複）
   ├── 如果未選擇：
   │   ├── applyColorToArea()  # 應用顏色到區域
   │   ├── addAreaToSelected() # 添加到已選列表
   │   ├── updateSelectedAreasList() # 更新 UI
   │   └── 如果是 'administration' 模式且選擇的是國家：
   │       └── 加載該國的行政區數據
```

### 5.2 兩層選擇模式（行政區模式）

當用戶切換到 "行政區" 模式時：

1. **第一層：選擇國家**
   - 用戶點擊地圖上的國家
   - 系統記錄 `selectedCountry`
   - 自動加載該國的行政區數據（state/city）
   - 顯示該國的州/省、縣/市邊界

2. **第二層：選擇行政區**
   - 用戶在選定的國家內點擊
   - 系統只查詢該國範圍內的行政區
   - 過濾邏輯確保只選擇該國內的區域

### 5.3 特徵查詢邏輯

**`queryFeaturesAtPoint(point, areaType)`**:

1. **優先查詢策略**：
   - 先從特定圖層查詢 (`visible-boundaries-{areaType}`)
   - 如果沒有結果，從線條圖層查詢

2. **備選查詢策略**：
   - 查詢所有圖層（半徑 50px）
   - 過濾出目標特徵：
     - GADM 源 (`gadm-{areaType}`)
     - 包含 GID 屬性的特徵
     - 國家特定源
     - 排除 Mapbox 基礎圖層（landuse, water, building 等）

3. **返回匹配的特徵數組**

### 5.4 名稱獲取邏輯

**`getAreaName(feature, areaType)`** 優先級：

1. **國家級 (`country`)**:
   - 直接從 `COUNTRY` 屬性獲取（最可靠）
   - 嘗試 `GADM_LOADER.getAreaName()`
   - 嘗試 `NAME_0`、`name_en` 等屬性
   - 使用 `COUNTRY_CODES` 映射表（通過 GID_0）
   - 最後使用 GID_0 本身

2. **州/省級 (`state`)**:
   - 優先使用 `COUNTRY_LOADER.getAreaName()`（國家特定）
   - 嘗試 `GADM_LOADER.getAreaName()`
   - 嘗試 `NL_NAME_1`（中文名）、`NAME_1`（英文名）

3. **縣/市級 (`city`)**:
   - 優先使用 `COUNTRY_LOADER.getAreaName()`（國家特定）
   - 嘗試 `GADM_LOADER.getAreaName()`
   - 嘗試 `NL_NAME_2`（中文名）、`NAME_2`（英文名）

---

## 六、顏色應用系統

### 6.1 顏色選擇

用戶可以通過以下方式選擇顏色：

1. **側邊欄顏色選擇器**
   - 顏色輸入框（點擊選擇）
   - 十六進制輸入框
   - 預設顏色按鈕

2. **彈出式顏色選擇器**（點擊區域時）
   - 顯示預設顏色
   - 自定義顏色選擇器

### 6.2 顏色應用流程

```
applyColorToArea(areaId, areaType, color)
   ↓
createAreaLayer(areaId, areaType, color)
   ├── 生成唯一的圖層 ID
   ├── 創建過濾器（createFilterForArea）
   │   ├── Mapbox 源: 使用 iso_3166_1_alpha_3 等屬性
   │   └── GADM 源: 使用 GID_0, GID_1, GID_2 屬性
   ├── 添加填充圖層（如果 boundaryMode === 'fill'）
   │   └── 設置顏色、透明度、圖層順序
   └── 添加線條圖層（可選，用於邊框）
```

### 6.3 過濾器創建

**`createFilterForArea(areaId, areaType)`**:

根據數據源類型創建不同的過濾器：

- **Mapbox 源**: `['==', ['get', 'iso_3166_1_alpha_3'], areaId]`
- **GADM 源**: `['==', ['get', 'GID_0'], areaId]`（國家級）
- **國家特定源**: 使用相應的 ID 屬性

---

## 七、UI 控制系統

### 7.1 邊界類型切換

```
用戶點擊 "國家" 或 "行政區" 按鈕
   ↓
switchAreaType(newType)
   ├── 更新 appState.currentAreaType
   ├── 更新 UI 按鈕狀態
   ├── 清除當前選擇（可選）
   ├── 如果切換到 'administration' 且有已選國家：
   │   └── 加載該國的行政區數據
   └── 重新加載邊界源
```

### 7.2 地圖樣式切換

```
用戶選擇地圖樣式（Gray/Satellite/Standard/Dark）
   ↓
switchMapStyle(newStyle)
   ├── 更新 appState.mapStyle
   ├── 獲取對應的樣式 URL (getMapStyleUrl)
   └── 調用 map.setStyle(newStyleUrl)
   ↓
地圖樣式加載完成
   ├── 重新加載邊界源
   ├── 重新應用已選區域的顏色
   └── 重新緩存標籤圖層 ID
```

### 7.3 標籤顯示/隱藏

```
用戶切換標籤顯示開關
   ↓
toggleLabels(visible)
   ├── 更新 appState.labelsVisible
   ├── 遍歷 labelLayerIds 數組
   └── 設置每個圖層的 visibility 屬性
```

### 7.4 邊界模式切換（填充/線條）

```
用戶切換 "Fill" / "Line" 模式
   ↓
switchBoundaryMode(mode)
   ├── 更新 appState.boundaryMode
   ├── 如果切換到 'line'：
   │   └── 顯示線條圖層，隱藏填充圖層
   └── 如果切換到 'fill'：
       └── 顯示填充圖層，隱藏線條圖層
```

---

## 八、搜索功能

### 8.1 搜索流程

```
用戶在搜索框輸入
   ↓
handleSearchInput(e)
   ├── 獲取搜索關鍵詞
   ├── 如果關鍵詞長度 < 2: 清空結果
   ├── 如果關鍵詞長度 >= 2:
   │   ├── 從數據源查詢匹配的特徵
   │   │   ├── 查詢所有已加載的邊界源
   │   │   ├── 過濾名稱匹配的特徵
   │   │   └── 支持中英文搜索
   │   ├── 顯示搜索結果列表
   │   └── 綁定點擊事件（跳轉到該區域）
   └── 更新搜索結果 UI
```

### 8.2 搜索匹配邏輯

- 支持中文和英文名稱
- 不區分大小寫
- 部分匹配（包含關鍵詞即可）
- 優先顯示精確匹配的結果

---

## 九、導出功能

### 9.1 地圖導出流程

```
用戶點擊 "Export Image" 按鈕
   ↓
exportMapAsImage()
   ├── 隱藏 UI 控件（側邊欄、按鈕等）
   ├── 設置地圖容器為導出尺寸（高分辨率）
   ├── 等待地圖重新渲染
   ├── 使用 map.getCanvas() 獲取畫布
   ├── 轉換為圖片數據 (canvas.toDataURL)
   ├── 創建下載鏈接
   ├── 觸發下載
   └── 恢復 UI 控件顯示
```

### 9.2 導出設置

- **格式**: PNG
- **分辨率**: 高分辨率（2x 或 3x）
- **透明度**: 支持透明背景
- **質量**: 適合印刷和網路使用

---

## 十、數據加載器模塊

### 10.1 GADM 加載器 (`app-gadm.js`)

**功能**:
- 加載 GADM GeoJSON 數據文件
- 創建 GADM 數據源和圖層
- 提供名稱獲取方法 (`getAreaName`)

**流程**:
```
loadGADMSource(level, sourceId)
   ├── 構建文件路徑
   ├── 獲取文件大小（警告大文件）
   ├── Fetch GeoJSON 數據
   ├── 添加數據源到地圖
   ├── 創建可見圖層
   └── 暴露 GADM_LOADER 對象到 window
```

### 10.2 國家特定加載器 (`app-country-loader.js`)

**功能**:
- 加載特定國家的行政區數據（小文件）
- 按需加載（只加載選定國家的數據）
- 提供更精確的邊界和名稱

**流程**:
```
loadCountryBoundarySource(countryCode, areaType)
   ├── 構建文件路徑: ./data/countries/{countryCode}/{areaType}.geojson
   ├── Fetch GeoJSON 數據
   ├── 添加數據源到地圖
   ├── 創建可見圖層（fill + line）
   └── 暴露 COUNTRY_LOADER 對象到 window
```

---

## 十一、錯誤處理與調試

### 11.1 錯誤類型

1. **數據加載錯誤**
   - 文件不存在
   - 網絡錯誤
   - 數據格式錯誤

2. **地圖渲染錯誤**
   - 圖層創建失敗
   - 源添加失敗
   - 樣式錯誤

3. **用戶交互錯誤**
   - 未找到區域
   - 顏色應用失敗
   - 重複選擇

### 11.2 調試機制

- **控制台日誌**: 使用 emoji 標記（✅ ❌ ⚠️ 🔍）
- **Toast 通知**: 用戶友好的錯誤提示
- **加載動畫**: 顯示數據加載狀態
- **詳細日誌**: 記錄完整的執行流程

---

## 十二、性能優化

### 12.1 優化策略

1. **數據緩存**
   - 已加載的數據源不重複加載
   - 標籤圖層 ID 緩存

2. **按需加載**
   - 只加載當前需要的邊界數據
   - 國家特定數據按需加載

3. **圖層管理**
   - 使用 `setFilter` 而非創建多個圖層
   - 合理的圖層順序

4. **查詢優化**
   - 優先查詢特定圖層
   - 使用合理的查詢半徑

### 12.2 文件大小優化

- GADM 數據已簡化（去除不必要的屬性）
- 國家特定數據文件分離（更小）
- 支持數據壓縮（GeoJSON）

---

## 十三、系統工作流程圖

```
┌─────────────────────────────────────────────────────────────┐
│                     系統初始化                                │
├─────────────────────────────────────────────────────────────┤
│  1. 加載 HTML + CSS                                         │
│  2. 加載配置文件 (config.js)                                 │
│  3. 加載工具庫 (country-codes.js)                            │
│  4. 加載數據加載器 (app-gadm.js, app-country-loader.js)     │
│  5. 初始化主應用 (app-enhanced.js)                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     地圖初始化                                │
├─────────────────────────────────────────────────────────────┤
│  1. 創建 Mapbox 地圖實例                                     │
│  2. 設置初始樣式、中心點、縮放                                │
│  3. 綁定地圖事件 (click, hover, error)                      │
│  4. 等待地圖加載完成                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     數據加載                                  │
├─────────────────────────────────────────────────────────────┤
│  1. 加載邊界數據源 (loadBoundarySources)                    │
│     ├── 國家級: Mapbox 或 GADM Level 0                     │
│     └── 行政區: 國家特定數據 或 GADM Level 1/2              │
│  2. 創建可見邊界圖層                                        │
│  3. 緩存標籤圖層 ID                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     用戶交互                                  │
├─────────────────────────────────────────────────────────────┤
│  點擊地圖                                                    │
│     ↓                                                       │
│  檢測邊界 (detectBoundaryAtPoint)                           │
│     ├── 查詢特徵 (queryFeaturesAtPoint)                    │
│     ├── 獲取區域信息 (getAreaId, getAreaName)              │
│     └── 應用顏色 (applyColorToArea)                        │
│                                                             │
│  切換邊界類型                                                │
│     ↓                                                       │
│  加載對應的數據源                                            │
│                                                             │
│  搜索區域                                                    │
│     ↓                                                       │
│  查詢匹配結果並跳轉                                          │
│                                                             │
│  導出地圖                                                    │
│     ↓                                                       │
│  生成高分辨率圖片並下載                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 十四、關鍵函數說明

### 14.1 初始化相關
- `initializeApp()` - 應用初始化入口
- `initializeMap()` - 地圖初始化
- `initializeUI()` - UI 初始化
- `setupEventListeners()` - 事件監聽器設置

### 14.2 數據加載相關
- `loadBoundarySources()` - 加載所有邊界數據源
- `loadBoundarySourceForType(areaType)` - 加載特定類型的數據源
- `createVisibleBoundaryLayer(areaType)` - 創建可見邊界圖層

### 14.3 交互相關
- `handleMapClick(e)` - 處理地圖點擊
- `detectBoundaryAtPoint(lngLat)` - 檢測點擊位置的邊界
- `tryBoundaryLevel(point, areaType)` - 嘗試在特定級別檢測邊界
- `queryFeaturesAtPoint(point, areaType)` - 查詢點擊位置的特徵

### 14.4 顏色應用相關
- `applyColorToArea(areaId, areaType, color)` - 應用顏色到區域
- `createAreaLayer(areaId, areaType, color)` - 創建區域圖層
- `createFilterForArea(areaId, areaType)` - 創建區域過濾器

### 14.5 工具函數
- `getAreaId(feature, areaType)` - 獲取區域 ID
- `getAreaName(feature, areaType)` - 獲取區域名稱
- `getMapStyleUrl(styleName)` - 獲取地圖樣式 URL

---

## 十五、配置說明

### 15.1 配置文件 (`config.js`)

主要配置項：
- `MAPBOX.TOKEN` - Mapbox API Token
- `MAPBOX.STYLE` - 默認地圖樣式
- `MAP.DEFAULT_CENTER` - 默認地圖中心點
- `MAP.DEFAULT_ZOOM` - 默認縮放級別
- `MAPBOX.USE_WORLDVIEW_FILTER` - 是否使用世界觀過濾器

### 15.2 數據路徑配置

- GADM 數據: `./data/gadm/optimized/`
- 國家特定數據: `./data/countries/{countryCode}/`

---

## 十六、已知限制與解決方案

### 16.1 Mapbox 免費帳戶限制
- ❌ 不提供行政區數據（state/city）
- ✅ 解決方案: 使用 GADM 或國家特定數據

### 16.2 GADM 數據文件大小
- ❌ 文件很大（121MB+）
- ✅ 解決方案: 使用優化後的 GeoJSON，按需加載

### 16.3 名稱顯示問題
- ❌ 某些區域名稱可能顯示為 "Unknown"
- ✅ 解決方案: 多層次名稱獲取邏輯，支持多種屬性

---

## 十七、未來擴展方向

1. **數據優化**
   - 使用向量瓦片替代大 GeoJSON 文件
   - 實現數據預加載和緩存機制

2. **功能增強**
   - 批量選擇區域
   - 自定義圖例
   - 導出多種格式（SVG, PDF）

3. **性能提升**
   - Web Workers 處理大數據
   - 虛擬滾動優化搜索結果

---

## 十八、調試建議

1. **檢查控制台日誌**
   - 查看 emoji 標記的日誌
   - 注意錯誤和警告信息

2. **驗證數據加載**
   - 檢查數據源是否成功加載
   - 確認圖層是否正確創建

3. **測試名稱獲取**
   - 使用調試腳本測試 `getAreaName`
   - 檢查特徵屬性是否完整

4. **檢查地圖交互**
   - 確認事件監聽器已綁定
   - 驗證查詢邏輯是否正確

---

**最後更新**: 2024年
**版本**: v1.0
