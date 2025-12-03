# 🐛 完整調試指南

## 快速調試步驟

### 1. 打開開發者工具
- Windows/Linux: `F12` 或 `Ctrl + Shift + I`
- Mac: `Cmd + Option + I`

### 2. 清除控制台
- 點擊清除按鈕 🚫 或按 `Ctrl + L` (Mac: `Cmd + K`)

### 3. 重現問題
- 點擊地圖上的國家
- 觀察控制台輸出

---

## 🔍 關鍵調試命令

在瀏覽器控制台中運行以下命令來診斷問題：

### 檢查 GADM 源是否加載

```javascript
// 檢查 GADM 國家源
console.log('GADM Country Source:', appState.map.getSource('gadm-country'));

// 檢查源數據
const source = appState.map.getSource('gadm-country');
if (source && source._data) {
    const features = source._data.features || [];
    console.log(`總共 ${features.length} 個國家`);
    // 查找台灣
    const taiwan = features.find(f => f.properties?.GID_0 === 'TWN');
    if (taiwan) {
        console.log('台灣特徵:', taiwan.properties);
    }
}
```

### 檢查圖層狀態

```javascript
// 檢查圖層是否存在
const layerId = 'visible-boundaries-country';
console.log('圖層存在:', !!appState.map.getLayer(layerId));
console.log('圖層可見性:', appState.map.getLayoutProperty(layerId, 'visibility'));

// 檢查圖層的源
const layer = appState.map.getLayer(layerId);
if (layer) {
    console.log('圖層源:', layer.source);
}
```

### 檢查 COUNTRY_CODES 映射表

```javascript
// 檢查映射表是否加載
console.log('COUNTRY_CODES 是否定義:', typeof COUNTRY_CODES !== 'undefined');

// 檢查台灣的映射
if (typeof COUNTRY_CODES !== 'undefined') {
    console.log('台灣映射:', COUNTRY_CODES['TWN']);
    console.log('總共國家數:', Object.keys(COUNTRY_CODES).length);
}
```

### 檢查 GADM_LOADER

```javascript
// 檢查 GADM_LOADER 是否加載
console.log('GADM_LOADER 存在:', !!window.GADM_LOADER);
console.log('getAreaName 方法存在:', !!(window.GADM_LOADER && window.GADM_LOADER.getAreaName));

// 測試獲取名稱
if (window.GADM_LOADER && window.GADM_LOADER.getAreaName) {
    // 創建一個測試特徵
    const testFeature = {
        properties: {
            GID_0: 'TWN',
            COUNTRY: 'Taiwan'
        }
    };
    const name = window.GADM_LOADER.getAreaName(testFeature, 'country');
    console.log('測試獲取名稱:', name);
}
```

### 手動測試查詢

```javascript
// 在地圖上點擊後，手動查詢特徵
const point = { x: 361, y: 406 }; // 替換為你點擊的座標

// 查詢所有特徵
const allFeatures = appState.map.queryRenderedFeatures(point, { radius: 50 });
console.log('所有特徵:', allFeatures.length);
console.log('特徵詳情:', allFeatures.map(f => ({
    source: f.source,
    layer: f.layer?.id,
    hasGID_0: !!f.properties?.GID_0,
    GID_0: f.properties?.GID_0,
    COUNTRY: f.properties?.COUNTRY,
    allKeys: Object.keys(f.properties || {})
})));

// 查找 GADM 特徵
const gadmFeatures = allFeatures.filter(f => 
    f.source === 'gadm-country' || 
    f.properties?.GID_0
);
console.log('GADM 特徵:', gadmFeatures);
```

### 檢查選中的區域

```javascript
// 檢查當前選中的區域
console.log('已選區域:', appState.selectedAreas);
console.log('當前顏色:', appState.currentColor);
console.log('當前區域類型:', appState.currentAreaType);
```

---

## 🎯 診斷常見問題

### 問題 1: 顯示 "Unknown Country"

**檢查步驟**：
```javascript
// 1. 檢查數據是否加載
const source = appState.map.getSource('gadm-country');
console.log('源加載狀態:', source ? '已加載' : '未加載');

// 2. 檢查圖層是否可見
const layerId = 'visible-boundaries-country';
const visibility = appState.map.getLayoutProperty(layerId, 'visibility');
console.log('圖層可見性:', visibility);

// 3. 檢查映射表
console.log('COUNTRY_CODES 加載:', typeof COUNTRY_CODES !== 'undefined');
console.log('TWN 映射:', COUNTRY_CODES?.['TWN']);
```

### 問題 2: 顏色無法應用

**檢查步驟**：
```javascript
// 檢查已選區域的圖層
appState.selectedAreas.forEach(area => {
    const layer = appState.map.getLayer(area.layerId);
    console.log(`區域 ${area.name}:`, {
        layerId: area.layerId,
        layer存在: !!layer,
        顏色: area.color,
        源: layer?.source
    });
});
```

### 問題 3: 無法點擊行政區

**檢查步驟**：
```javascript
// 檢查選中的國家
console.log('選中的國家:', appState.selectedCountry);

// 檢查國家特定的源是否加載
if (appState.selectedCountry) {
    const stateSourceId = `country-state-${appState.selectedCountry.id}`;
    const citySourceId = `country-city-${appState.selectedCountry.id}`;
    console.log('州源:', appState.map.getSource(stateSourceId) ? '已加載' : '未加載');
    console.log('城市源:', appState.map.getSource(citySourceId) ? '已加載' : '未加載');
}
```

---

## 📊 完整診斷腳本

將以下代碼複製到控制台運行，會自動執行所有診斷：

```javascript
(function() {
    console.log('═══════════════════════════════════════════');
    console.log('🔍 完整系統診斷');
    console.log('═══════════════════════════════════════════');
    
    // 1. 檢查 GADM 源
    console.log('\n1️⃣ GADM 源狀態:');
    const gadmSource = appState.map.getSource('gadm-country');
    if (gadmSource) {
        const data = gadmSource._data || gadmSource._geojson;
        const featureCount = data?.features?.length || 0;
        console.log(`  ✅ GADM 國家源已加載 (${featureCount} 個國家)`);
        if (featureCount > 0) {
            const taiwan = data.features.find(f => f.properties?.GID_0 === 'TWN');
            if (taiwan) {
                console.log('  ✅ 台灣特徵存在:', taiwan.properties);
            }
        }
    } else {
        console.log('  ❌ GADM 國家源未加載');
    }
    
    // 2. 檢查圖層
    console.log('\n2️⃣ 圖層狀態:');
    const layerId = 'visible-boundaries-country';
    const layer = appState.map.getLayer(layerId);
    if (layer) {
        const visibility = appState.map.getLayoutProperty(layerId, 'visibility');
        console.log(`  ✅ 圖層存在: ${layerId}`);
        console.log(`  📊 可見性: ${visibility}`);
        console.log(`  📍 源: ${layer.source}`);
    } else {
        console.log(`  ❌ 圖層不存在: ${layerId}`);
    }
    
    // 3. 檢查 COUNTRY_CODES
    console.log('\n3️⃣ COUNTRY_CODES 映射表:');
    if (typeof COUNTRY_CODES !== 'undefined') {
        const codeCount = Object.keys(COUNTRY_CODES).length;
        console.log(`  ✅ 映射表已加載 (${codeCount} 個國家)`);
        if (COUNTRY_CODES['TWN']) {
            console.log('  ✅ 台灣映射存在:', COUNTRY_CODES['TWN']);
        }
    } else {
        console.log('  ❌ 映射表未加載');
    }
    
    // 4. 檢查 GADM_LOADER
    console.log('\n4️⃣ GADM_LOADER:');
    if (window.GADM_LOADER) {
        console.log('  ✅ GADM_LOADER 已加載');
        if (window.GADM_LOADER.getAreaName) {
            console.log('  ✅ getAreaName 方法存在');
            // 測試
            const testFeature = {
                properties: { GID_0: 'TWN', COUNTRY: 'Taiwan' }
            };
            const name = window.GADM_LOADER.getAreaName(testFeature, 'country');
            console.log(`  ✅ 測試獲取名稱: "${name}"`);
        }
    } else {
        console.log('  ❌ GADM_LOADER 未加載');
    }
    
    // 5. 檢查應用狀態
    console.log('\n5️⃣ 應用狀態:');
    console.log(`  當前區域類型: ${appState.currentAreaType}`);
    console.log(`  選中的國家: ${appState.selectedCountry?.name || '無'}`);
    console.log(`  已選區域數: ${appState.selectedAreas.length}`);
    console.log(`  當前顏色: ${appState.currentColor}`);
    
    console.log('\n═══════════════════════════════════════════');
    console.log('✅ 診斷完成');
    console.log('═══════════════════════════════════════════');
})();
```

---

## 🚨 常見錯誤解決

### 錯誤: "GADM_LOADER is not defined"
- **原因**: `app-gadm.js` 未正確加載
- **解決**: 檢查 `index-enhanced.html` 中是否有 `<script src="js/app-gadm.js"></script>`

### 錯誤: "COUNTRY_CODES is not defined"
- **原因**: `country-codes.js` 未正確加載
- **解決**: 檢查 `index-enhanced.html` 中是否有 `<script src="js/utils/country-codes.js"></script>`

### 錯誤: "Source not found"
- **原因**: GADM 數據文件未加載
- **解決**: 檢查 Network 標籤頁，確認文件是否成功加載

---

## 📋 提供調試信息

如果需要幫助，請提供：

1. **控制台輸出**（按照 `HOW_TO_SHARE_CONSOLE.md` 的步驟）
2. **運行診斷腳本的輸出**（複製上面的診斷腳本運行）
3. **Network 標籤頁截圖**（查看文件加載狀態）
4. **具體錯誤信息**（如果有紅色的錯誤）

---

## 🔧 快速修復命令

如果發現問題，可以在控制台運行這些命令快速修復：

### 重新加載 GADM 數據
```javascript
// 重新加載 GADM 國家數據
if (window.GADM_LOADER) {
    window.GADM_LOADER.loadGADMBoundarySource('country');
}
```

### 強制顯示圖層
```javascript
// 強制顯示國家圖層
appState.map.setLayoutProperty('visible-boundaries-country', 'visibility', 'visible');
```

### 清除所有選中區域
```javascript
// 清除所有選中的區域
appState.selectedAreas = [];
updateSelectedAreasList();
```


