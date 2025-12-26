/**
 * Agent Integration Example
 * 
 * 完整的整合示例：展示如何使用 Agent 架構與現有系統
 * 
 * 這是 "context vibe code" - 可以直接運行和測試的代碼
 */

/**
 * 初始化 Agent 系統並整合到現有 AI Assistant
 */
async function initializeAgentSystem() {
    // 確保依賴已載入 - 檢查多種可能的格式
    let geminiService = window.geminiService;
    
    // 如果 geminiService 不存在，嘗試使用 analyzeNewsWithGemini
    if (!geminiService && window.analyzeNewsWithGemini) {
        geminiService = {
            analyzeNewsWithGemini: window.analyzeNewsWithGemini
        };
        window.geminiService = geminiService; // 創建並保存
    }
    
    if (!geminiService && !window.analyzeNewsWithGemini) {
        console.error('❌ geminiService 或 analyzeNewsWithGemini 未載入');
        console.error('請確保 js/services/gemini-service.js 已正確載入');
        return null;
    }

    // 創建 Orchestrator
    const orchestrator = new MapAgentOrchestrator(geminiService);
    window.mapAgentOrchestrator = orchestrator; // 全局暴露，方便調試

    console.log('✅ Agent 系統初始化完成');
    return orchestrator;
}

/**
 * 處理新聞稿（完整流程示例）
 */
async function processNewsWithAgent(newsText, sourceUrl = null) {
    try {
        // 1. 初始化（如果還沒初始化）
        if (!window.mapAgentOrchestrator) {
            await initializeAgentSystem();
        }

        const orchestrator = window.mapAgentOrchestrator;

        // 2. 處理新聞稿（抽取 + 解析）
        console.log('📰 開始處理新聞稿...');
        const geoTargets = await orchestrator.processNewsText(newsText, sourceUrl);

        // 3. 返回候選清單（供 UI 顯示）
        return geoTargets;

    } catch (error) {
        console.error('❌ 處理失敗:', error);
        throw error;
    }
}

/**
 * 顯示候選清單到 UI（整合現有 displayResultsPreview）
 */
function displayGeoTargetsPreview(geoTargets) {
    const resultsContent = document.getElementById('ai-results-content');
    if (!resultsContent) {
        console.warn('找不到 ai-results-content 元素');
        return;
    }

    // 清空現有內容
    resultsContent.innerHTML = '';

    // 創建區域和地點的分組
    const regions = geoTargets.candidates.filter(t => t.type === 'region');
    const places = geoTargets.candidates.filter(t => t.type === 'place');

    // 顯示區域
    if (regions.length > 0) {
        const regionsSection = document.createElement('div');
        regionsSection.className = 'ai-result-section';
        regionsSection.innerHTML = `<h4>區域 (${regions.length})</h4>`;

        regions.forEach(target => {
            const item = createGeoTargetItem(target, 'region');
            regionsSection.appendChild(item);
        });

        resultsContent.appendChild(regionsSection);
    }

    // 顯示地點
    if (places.length > 0) {
        const placesSection = document.createElement('div');
        placesSection.className = 'ai-result-section';
        placesSection.innerHTML = `<h4>地點 (${places.length})</h4>`;

        places.forEach(target => {
            const item = createGeoTargetItem(target, 'place');
            placesSection.appendChild(item);
        });

        resultsContent.appendChild(placesSection);
    }

    // 顯示應用按鈕
    const applyBtn = document.getElementById('apply-ai-results-btn');
    if (applyBtn) {
        applyBtn.style.display = 'block';
        applyBtn.onclick = () => applySelectedGeoTargets(geoTargets);
    }
}

/**
 * 創建單個地理目標項目的 UI
 */
function createGeoTargetItem(target, type) {
    const item = document.createElement('div');
    item.className = 'ai-result-item';
    item.dataset.targetId = target.id;

    // 選取框
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true; // 默認選中
    checkbox.id = `target-${target.id}`;

    // 名稱和資訊
    const label = document.createElement('label');
    label.htmlFor = `target-${target.id}`;
    label.innerHTML = `
        <strong>${target.name}</strong>
        <span class="target-type">${type === 'region' ? '區域' : '地點'}</span>
        <span class="confidence">信心度: ${(target.confidence * 100).toFixed(0)}%</span>
    `;

    // 解析資訊
    const resolvedInfo = document.createElement('div');
    resolvedInfo.className = 'resolved-info';
    if (target.resolved?.iso_code) {
        resolvedInfo.textContent = `ISO: ${target.resolved.iso_code}`;
    } else if (target.resolved?.lat && target.resolved?.lon) {
        resolvedInfo.textContent = `座標: ${target.resolved.lat.toFixed(2)}, ${target.resolved.lon.toFixed(2)}`;
    } else if (target.resolved?.needs_review) {
        resolvedInfo.innerHTML = `<span class="warning">⚠️ ${target.resolved.suggestion}</span>`;
    }

    // 顏色選擇器（僅區域）
    let colorPicker = null;
    if (type === 'region') {
        colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = '#ff6b6b';
        colorPicker.className = 'target-color-picker';
        colorPicker.dataset.targetId = target.id;
    }

    // 組合
    item.appendChild(checkbox);
    item.appendChild(label);
    item.appendChild(resolvedInfo);
    if (colorPicker) {
        item.appendChild(colorPicker);
    }

    return item;
}

/**
 * 應用選定的地理目標到地圖
 */
async function applySelectedGeoTargets(geoTargets) {
    try {
        // 1. 收集使用者選擇
        const selectedIds = [];
        const colors = {};
        const names = {};

        geoTargets.candidates.forEach(target => {
            const checkbox = document.getElementById(`target-${target.id}`);
            if (checkbox && checkbox.checked) {
                selectedIds.push(target.id);

                // 獲取顏色（如果有）
                const colorPicker = document.querySelector(`.target-color-picker[data-target-id="${target.id}"]`);
                if (colorPicker) {
                    colors[target.id] = colorPicker.value;
                }

                // 可以添加名稱編輯（這裡簡化）
            }
        });

        if (selectedIds.length === 0) {
            alert('請至少選擇一個項目');
            return;
        }

        // 2. 生成 Map Spec
        const orchestrator = window.mapAgentOrchestrator;
        const customizations = {
            colors: colors,
            names: names,
            title: 'AI 生成地圖'
        };

        const mapSpec = orchestrator.generateMapSpec(selectedIds, customizations);

        // 3. 渲染到地圖
        if (window.appState && window.appState.map) {
            const renderer = new MapSpecRenderer(window.appState.map, window.appState);
            await renderer.render(mapSpec);

            // 4. 保存 Spec（可重跑）
            const specJson = orchestrator.exportMapSpec();
            console.log('💾 Map Spec 已生成:', specJson);
            // 可以保存到 localStorage 或發送到後端
            localStorage.setItem('last_map_spec', specJson);
        } else {
            console.error('❌ 地圖實例不可用');
        }

        // 5. 隱藏結果預覽
        const resultsPreview = document.getElementById('ai-results-preview');
        if (resultsPreview) {
            resultsPreview.style.display = 'none';
        }

    } catch (error) {
        console.error('❌ 應用失敗:', error);
        alert('應用失敗: ' + error.message);
    }
}

/**
 * 重跑之前的 Map Spec
 */
async function rerunMapSpec(specJson) {
    try {
        // 1. 載入 Spec
        const orchestrator = window.mapAgentOrchestrator;
        if (!orchestrator) {
            await initializeAgentSystem();
        }

        const mapSpec = orchestrator.loadMapSpec(specJson);

        // 2. 渲染到地圖
        if (window.appState && window.appState.map) {
            const renderer = new MapSpecRenderer(window.appState.map, window.appState);
            await renderer.render(mapSpec);
        }

    } catch (error) {
        console.error('❌ 重跑失敗:', error);
        throw error;
    }
}

// ============================================================================
// 整合到現有 AI Assistant（可選）
// ============================================================================

/**
 * 修改現有的 performAnalysis 函數以使用新的 Agent
 * 
 * 在 ai-assistant.js 中可以這樣使用：
 * 
 * async function performAnalysis() {
 *   const newsText = newsInput.value;
 *   const sourceUrl = isURL(newsText) ? newsText : null;
 *   
 *   try {
 *     // 使用新的 Agent 系統
 *     const geoTargets = await processNewsWithAgent(newsText, sourceUrl);
 *     displayGeoTargetsPreview(geoTargets);
 *   } catch (error) {
 *     // 錯誤處理
 *   }
 * }
 */

// Export for global use
if (typeof window !== 'undefined') {
    window.processNewsWithAgent = processNewsWithAgent;
    window.displayGeoTargetsPreview = displayGeoTargetsPreview;
    window.applySelectedGeoTargets = applySelectedGeoTargets;
    window.rerunMapSpec = rerunMapSpec;
    window.initializeAgentSystem = initializeAgentSystem;
}

