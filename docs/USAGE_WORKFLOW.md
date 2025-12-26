# Agent-Ready 地圖工具 - 使用流程

## 完整工作流程

### 步驟 1：啟動應用

```bash
# 確保服務器運行
./start-preview.sh

# 或手動啟動
node server-combined.js
```

然後在瀏覽器打開：http://localhost:8000/index-enhanced.html``

---

### 步驟 2：初始化 Agent 系統

在瀏覽器控制台運行：

```javascript
// 初始化 Agent 系統（只需運行一次）
await initializeAgentSystem();
```

或者，Agent 系統會在第一次使用時自動初始化。

---

### 步驟 3：輸入新聞稿

#### 方式 A：使用現有 AI Assistant UI

1. 在側邊欄找到 "AI Assistant" 區域
2. 在文本框中輸入或粘貼新聞稿內容
3. 點擊 "分析新聞" 按鈕

#### 方式 B：直接在控制台調用

```javascript
const newsText = `
烏克蘭衝突持續，俄羅斯軍隊向基輔推進。
波蘭和德國宣布提供軍事援助。
美國和英國也考慮提供額外支援。
`;

// 處理新聞稿
const geoTargets = await processNewsWithAgent(newsText);
console.log('抽取結果:', geoTargets);
```

---

### 步驟 4：查看候選清單

Agent 會自動：

1. **抽取地理位置**：從新聞稿中找出所有提及的地點和區域
2. **解析地理資訊**：將名稱轉換為 ISO code、座標等
3. **顯示候選清單**：在 UI 中顯示結果

```javascript
// 查看候選清單
console.log('候選區域:', geoTargets.candidates.filter(t => t.type === 'region'));
console.log('候選地點:', geoTargets.candidates.filter(t => t.type === 'place'));
```

每個候選項目包含：
- **名稱**：從新聞稿中提取的名稱
- **類型**：區域（可上色）或地點（可標註）
- **信心度**：Agent 的信心值（0-1）
- **證據片段**：新聞稿中提到的原文
- **解析結果**：ISO code、座標等（如果成功解析）

---

### 步驟 5：使用者選擇與修正

#### 在 UI 中（如果整合了 UI）：

1. 查看候選清單
2. ✅ **勾選**要標註的項目
3. 🎨 **選擇顏色**（區域可選顏色）
4. ✏️ **修正命名**（如果需要）
5. 點擊 "應用到地圖"

#### 在控制台：

```javascript
// 手動選擇要應用的項目
const selectedIds = geoTargets.candidates
    .filter(t => t.confidence > 0.7) // 只選高信心度的
    .map(t => t.id);

// 設置顏色
const colors = {
    'region_xxx': '#ff6b6b', // 烏克蘭 - 紅色
    'region_yyy': '#4c6ef5', // 波蘭 - 藍色
};

// 應用選擇
await applySelectedGeoTargets(geoTargets);
```

---

### 步驟 6：生成並渲染地圖

系統會自動：

1. **生成 Map Spec**：根據選擇創建可重跑的地圖規格
2. **渲染到地圖**：在 Mapbox 地圖上顯示
   - 區域上色（choropleth）
   - 地點標註（點位 + 標籤）

```javascript
// 查看生成的 Map Spec
const orchestrator = window.mapAgentOrchestrator;
const mapSpec = orchestrator.generateMapSpec(selectedIds, {
    colors: colors,
    title: '烏克蘭衝突地圖'
});

console.log('Map Spec:', mapSpec);
```

---

### 步驟 7：保存與重跑

#### 保存 Map Spec：

```javascript
// 導出為 JSON
const specJson = orchestrator.exportMapSpec();
console.log(specJson);

// 保存到 localStorage
localStorage.setItem('last_map_spec', specJson);

// 或下載為文件
const blob = new Blob([specJson], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'map-spec.json';
a.click();
```

#### 重跑之前的 Map Spec：

```javascript
// 從 localStorage 載入
const savedSpec = localStorage.getItem('last_map_spec');
await rerunMapSpec(savedSpec);

// 或從 JSON 字符串載入
const specJson = `{...}`; // 你的 JSON 字符串
await rerunMapSpec(specJson);
```

---

## 完整示例代碼

```javascript
// ========================================
// 完整工作流程示例
// ========================================

async function completeWorkflow() {
    try {
        // 1. 初始化
        await initializeAgentSystem();
        
        // 2. 準備新聞稿
        const newsText = `
        烏克蘭衝突持續升級，俄羅斯軍隊從多個方向向基輔推進。
        波蘭和德國宣布提供軍事援助，包括武器和醫療物資。
        美國和英國也考慮提供額外支援。北約成員國正在討論應對措施。
        `;
        
        // 3. 處理新聞稿
        console.log('📰 處理新聞稿...');
        const geoTargets = await processNewsWithAgent(newsText);
        console.log(`✅ 找到 ${geoTargets.candidates.length} 個候選項目`);
        
        // 4. 顯示候選清單（在 UI 中）
        displayGeoTargetsPreview(geoTargets);
        
        // 5. 選擇要應用的項目（這裡簡化為全部選擇）
        const selectedIds = geoTargets.candidates.map(t => t.id);
        
        // 6. 設置顏色
        const colors = {
            // 可以根據 ID 設置不同顏色
        };
        
        // 7. 應用到地圖
        console.log('🗺️ 應用到地圖...');
        await applySelectedGeoTargets(geoTargets);
        
        // 8. 保存 Spec
        const orchestrator = window.mapAgentOrchestrator;
        const specJson = orchestrator.exportMapSpec();
        localStorage.setItem('last_map_spec', specJson);
        
        console.log('✅ 完成！');
        
    } catch (error) {
        console.error('❌ 錯誤:', error);
    }
}

// 運行完整流程
// await completeWorkflow();
```

---

## 整合到現有 AI Assistant UI

如果要將新架構整合到現有的 `ai-assistant.js`：

### 修改 `performAnalysis` 函數：

```javascript
async function performAnalysis() {
    const newsInput = document.getElementById('news-input');
    const newsText = newsInput.value.trim();
    
    if (!newsText) {
        alert('請輸入新聞稿內容');
        return;
    }
    
    showLoading();
    
    try {
        // 使用新的 Agent 系統
        const geoTargets = await processNewsWithAgent(newsText);
        
        // 顯示結果（使用新的顯示函數）
        displayGeoTargetsPreview(geoTargets);
        
        // 顯示結果區域
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

---

## 高級用法

### 1. 自定義風格

```javascript
const customStyle = {
    colors: {
        palette: ['#custom1', '#custom2'],
        semantic: {
            primary: '#custom1',
            highlight: '#custom2'
        }
    },
    typography: {
        font_family: 'Arial',
        label_size: 14
    }
};

const mapSpec = orchestrator.generateMapSpec(selectedIds, {
    styleTokens: customStyle
});
```

### 2. 批量處理

```javascript
const newsTexts = [
    '新聞稿 1...',
    '新聞稿 2...',
    '新聞稿 3...'
];

for (const text of newsTexts) {
    const geoTargets = await processNewsWithAgent(text);
    // 處理每個結果...
}
```

### 3. 錯誤處理與降級

```javascript
try {
    const geoTargets = await processNewsWithAgent(newsText);
} catch (error) {
    // 如果 Agent 失敗，可以使用舊的邏輯作為降級
    console.warn('Agent 失敗，使用降級方案');
    // 使用原有的分析邏輯...
}
```

---

## 常見問題

### Q: 如何提高抽取準確度？

A: 
1. 調整 `confidence` 閾值（在 `filterByConfidence` 中）
2. 改進新聞稿格式（明確的地理名稱）
3. 使用更好的 LLM 模型

### Q: 如何處理同名地點（如 Georgia 州/國家）？

A: Agent 會標記 `needs_review: true`，由使用者手動選擇和修正。

### Q: 如何添加更多地理資料來源？

A: 在 `GeoResolverAgent` 中添加新的解析邏輯，或使用自建的 Gazetteer。

---

## 下一步

- 查看 `AGENT_ARCHITECTURE.md` 了解完整架構
- 查看 `AGENT_QUICK_START.md` 快速開始
- 在瀏覽器控制台測試示例代碼



