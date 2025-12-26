# Agent-Ready 全球地圖工具架構

## 概述

本架構實現了一個**工程化、可重跑**的全球地圖生成流程，結合 Agent 自動化與 Human-in-the-Loop 的混合工作流。

## 核心概念

### 1. 內容即 API（Content as API）

- **輸入層**：新聞稿文本 → Agent 抽取/解析
- **規格層**：`map_spec.json`（可重跑的規格）
- **渲染層**：穩定渲染器（Mapbox/Canvas）
- **輸出層**：最終圖片（PNG/SVG）+ 可追溯的 Spec

### 2. Agent 工作流

```
新聞稿 
  → GeoExtractorAgent（抽取地點/區域）
  → GeoResolverAgent（解析 ISO code、座標）
  → Human-in-the-Loop（使用者勾選/修正/選色）
  → MapSpecGenerator（生成規格）
  → MapRenderer（渲染地圖）
  → TemplateApplier（套版輸出）
```

## 資料結構

### GeoTargets（候選清單）

```javascript
{
  source_text: "新聞稿原文",
  source_url: "來源 URL",
  timestamp: "2024-01-01T00:00:00Z",
  candidates: [
    {
      id: "region_1234567890_0",
      type: "region", // 或 "place"
      name: "烏克蘭",
      confidence: 0.95,
      evidence_span: "烏克蘭在...",
      evidence_start: 120,
      evidence_end: 125,
      resolved: {
        iso_code: "UKR",
        admin_level: "admin0"
      }
    }
  ],
  selected_ids: ["region_1234567890_0"] // 使用者選中的 ID
}
```

### MapSpec（地圖規格）

```javascript
{
  version: "1.0",
  map_id: "map_1234567890",
  bounds: {
    west: -180,
    east: 180,
    south: -85,
    north: 85
  },
  layers: [
    {
      id: "boundaries",
      type: "boundary",
      source: { type: "mapbox", source_id: "boundaries-adm0" },
      style: { stroke_color: "#cccccc" }
    },
    {
      id: "regions_highlight",
      type: "choropleth",
      filter: { field: "iso_code", operator: "in", values: ["UKR", "POL"] }
    }
  ],
  style: { /* StyleTokens */ },
  metadata: {
    title: "地圖標題",
    source: "資料來源",
    date: "2024-01-01"
  }
}
```

## 使用方式

### 基本流程

```javascript
// 1. 初始化 Orchestrator
const orchestrator = new MapAgentOrchestrator(geminiService);

// 2. 處理新聞稿
const geoTargets = await orchestrator.processNewsText(newsText, sourceUrl);

// 3. 顯示候選清單，讓使用者勾選
// UI 顯示 geoTargets.candidates，使用者選擇後得到 selectedIds

// 4. 使用者自訂（選色、修正命名）
const customizations = {
  colors: { "region_xxx": "#ff6b6b" },
  names: { "region_xxx": "烏克蘭（修正後名稱）" },
  title: "地圖標題"
};

// 5. 生成 Map Spec
const mapSpec = orchestrator.generateMapSpec(selectedIds, customizations);

// 6. 渲染地圖（使用現有的 Mapbox renderer）
renderMapFromSpec(mapSpec);

// 7. 保存 Spec（可重跑）
const specJson = orchestrator.exportMapSpec();
localStorage.setItem('last_map_spec', specJson);
```

### 重跑機制

```javascript
// 載入之前保存的 Spec
const savedSpec = localStorage.getItem('last_map_spec');
const mapSpec = orchestrator.loadMapSpec(savedSpec);

// 直接渲染（不需要重新處理新聞稿）
renderMapFromSpec(mapSpec);
```

## 整合現有系統

### 與現有 AI Assistant 整合

現有的 `ai-assistant.js` 可以改用新的 Orchestrator：

```javascript
// 在 ai-assistant.js 中
const orchestrator = new MapAgentOrchestrator(window.geminiService);

async function performAnalysis() {
  const newsText = newsInput.value;
  const geoTargets = await orchestrator.processNewsText(newsText);
  
  // 顯示候選清單（使用現有的 displayResultsPreview）
  displayGeoTargetsPreview(geoTargets);
}

function applyToMap() {
  const selectedIds = getSelectedIds(); // 從 UI 獲取
  const customizations = getUserCustomizations(); // 顏色、命名等
  const mapSpec = orchestrator.generateMapSpec(selectedIds, customizations);
  
  // 使用現有的地圖渲染功能
  applyMapSpecToMapbox(mapSpec);
}
```

### 與現有地圖渲染整合

```javascript
function applyMapSpecToMapbox(mapSpec) {
  // 根據 MapSpec 的 layers 配置現有地圖
  mapSpec.layers.forEach(layer => {
    if (layer.type === 'choropleth') {
      // 使用現有的 createAreaLayer / applyColorToArea
      applyColorToArea(layer.filter.values, layer.style.fill_color);
    } else if (layer.type === 'point') {
      // 使用現有的 addMarker
      layer.source.data.features.forEach(feature => {
        addMarker(
          feature.geometry.coordinates,
          feature.properties.name,
          layer.style.marker_color
        );
      });
    }
  });
}
```

## 擴展點

### 1. 添加更多 Agent

- **StyleReferenceAgent**：從網頁參考圖中提取風格特徵
- **ValidationAgent**：驗證地圖的準確性和完整性
- **ExportAgent**：處理不同格式的導出

### 2. 支持更多資料來源

- Natural Earth（全球邊界資料）
- OSM Nominatim（地理編碼）
- 自建 Gazetteer（地名別名表）

### 3. 模板系統

```javascript
const template = {
  layout: {
    title_position: "top",
    legend_position: "bottom-right",
    source_position: "bottom-left"
  },
  styles: {
    // 預定義風格
  }
};

applyTemplate(mapSpec, template);
```

## 最佳實踐

1. **保持 Spec 與渲染分離**：Spec 是規格，渲染是實現
2. **所有狀態可序列化**：`mapSpec` 可以 JSON 化並保存
3. **可重跑性**：相同的 Spec 應該產生相同的輸出
4. **Human-in-the-Loop**：關鍵決策（選擇、命名、選色）由使用者控制
5. **錯誤處理**：Agent 失敗時提供降級方案

## 文件位置

- `js/data/specs/schema.json` - 資料結構定義
- `js/agent/geo-extractor-agent.js` - 地理位置抽取 Agent
- `js/agent/geo-resolver-agent.js` - 地理解析 Agent
- `js/agent/map-spec-generator.js` - 規格生成器
- `js/agent/map-agent-orchestrator.js` - 工作流編排器



