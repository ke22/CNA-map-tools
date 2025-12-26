# Agent-Ready 地圖工具 - 快速開始

## 概述

這個 Agent 架構實現了「新聞稿 → 自動抽取地理位置 → 使用者選擇 → 生成地圖規格 → 渲染地圖」的完整流程。

## 核心概念

### 1. 工作流程

```
新聞稿文本
  ↓
GeoExtractorAgent（抽取地點/區域）
  ↓
GeoResolverAgent（解析 ISO code、座標）
  ↓
Human-in-the-Loop（使用者勾選/修正/選色）
  ↓
MapSpecGenerator（生成規格）
  ↓
MapSpecRenderer（渲染到地圖）
  ↓
最終地圖（可保存 Spec 重跑）
```

### 2. 關鍵數據結構

- **GeoTargets**：候選地點/區域清單（含信心度、證據片段）
- **MapSpec**：可重跑的地圖規格（JSON 格式）
- **StyleTokens**：固定的風格設定（色票、字體等）

## 快速使用

### 在瀏覽器控制台測試

```javascript
// 1. 初始化 Agent 系統
await initializeAgentSystem();

// 2. 處理新聞稿
const newsText = `
烏克蘭衝突持續，俄羅斯軍隊向基輔推進。
波蘭和德國宣布提供軍事援助。
`;

const geoTargets = await processNewsWithAgent(newsText);
console.log('候選清單:', geoTargets);

// 3. 顯示候選清單（會更新 UI）
displayGeoTargetsPreview(geoTargets);

// 4. 使用者選擇後，應用（在 UI 中點擊「應用」按鈕）
// 或手動調用：
const selectedIds = geoTargets.candidates.map(t => t.id);
await applySelectedGeoTargets(geoTargets);
```

### 整合到現有 AI Assistant

在 `js/features/ai-assistant.js` 中修改 `performAnalysis` 函數：

```javascript
async function performAnalysis() {
    const newsText = newsInput.value;
    const sourceUrl = isURL(newsText) ? newsText : null;
    
    showLoading();
    
    try {
        // 使用新的 Agent 系統
        const geoTargets = await processNewsWithAgent(newsText, sourceUrl);
        
        // 顯示候選清單
        displayGeoTargetsPreview(geoTargets);
        
        // 顯示結果預覽區域
        const resultsPreview = document.getElementById('ai-results-preview');
        if (resultsPreview) {
            resultsPreview.style.display = 'block';
        }
        
    } catch (error) {
        console.error('AI analysis error:', error);
        showError('分析失敗: ' + error.message);
    } finally {
        hideLoading();
    }
}
```

## 數據結構示例

### GeoTargets（候選清單）

```javascript
{
  source_text: "烏克蘭衝突持續...",
  source_url: null,
  timestamp: "2024-01-01T00:00:00Z",
  candidates: [
    {
      id: "region_1234567890_0",
      type: "region",
      name: "烏克蘭",
      confidence: 0.95,
      evidence_span: "烏克蘭衝突",
      evidence_start: 0,
      evidence_end: 4,
      resolved: {
        iso_code: "UKR",
        admin_level: "admin0"
      }
    },
    {
      id: "place_1234567890_0",
      type: "place",
      name: "基輔",
      confidence: 0.9,
      evidence_span: "向基輔推進",
      resolved: {
        lat: 50.4501,
        lon: 30.5234
      }
    }
  ],
  selected_ids: [] // 初始為空，等待使用者選擇
}
```

### MapSpec（地圖規格）

```javascript
{
  version: "1.0",
  map_id: "map_1234567890",
  bounds: {
    west: 20,
    east: 40,
    south: 45,
    north: 55
  },
  layers: [
    {
      id: "boundaries",
      type: "boundary",
      source: { type: "mapbox", source_id: "boundaries-adm0" }
    },
    {
      id: "regions_highlight",
      type: "choropleth",
      filter: {
        field: "iso_code",
        operator: "in",
        values: ["UKR", "POL", "DEU"]
      },
      style: {
        fill_color: "#ff6b6b",
        fill_opacity: 0.6
      }
    }
  ],
  metadata: {
    title: "地圖標題",
    source: "資料來源",
    date: "2024-01-01"
  }
}
```

## 重跑機制

所有生成的地圖規格都可以保存和重跑：

```javascript
// 保存當前 Spec
const orchestrator = window.mapAgentOrchestrator;
const specJson = orchestrator.exportMapSpec();
localStorage.setItem('last_map_spec', specJson);

// 稍後重跑（不需要重新處理新聞稿）
const savedSpec = localStorage.getItem('last_map_spec');
await rerunMapSpec(savedSpec);
```

## 擴展點

### 1. 添加自定義 Agent

```javascript
class CustomValidationAgent {
    async validate(mapSpec) {
        // 驗證邏輯
        return { valid: true, errors: [] };
    }
}
```

### 2. 自定義風格

```javascript
const customStyle = {
    colors: {
        palette: ['#custom1', '#custom2'],
        semantic: {
            primary: '#custom1'
        }
    }
};

const mapSpec = orchestrator.generateMapSpec(selectedIds, {
    styleTokens: customStyle
});
```

### 3. 整合其他資料來源

在 `GeoResolverAgent` 中可以添加：
- 自建 Gazetteer（地名別名表）
- 其他地理編碼服務
- 快取機制

## 文件位置

- `js/agent/` - 所有 Agent 和工具類
- `js/data/specs/schema.js` - 數據結構定義
- `docs/AGENT_ARCHITECTURE.md` - 完整架構文檔

## 常見問題

### Q: 如何處理同名地點（如 Georgia 州/國家）？

A: `GeoResolverAgent` 會標記 `needs_review: true`，由使用者手動選擇。

### Q: 如何提高抽取準確度？

A: 
1. 調整 `confidence` 閾值（在 `filterByConfidence` 中）
2. 改進提示詞（在 `buildExtractionPrompt` 中）
3. 使用更好的 LLM 模型

### Q: 如何支援更多語言？

A: 在 `buildCountryMap` 和 `buildExtractionPrompt` 中添加多語言支援。



