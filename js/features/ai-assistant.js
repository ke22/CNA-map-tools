/**
 * AI Assistant Feature
 * Integrates Gemini AI for automatic news analysis and map annotation
 */

// Store AI results temporarily
let aiExtractionResults = null;

// Preset colors for areas (matching app-enhanced.js color presets)
const PRESET_COLORS = ['#6CA7A1', '#496F96', '#E05C5A', '#EDBD76', '#E8DFCF', '#B5CBCD'];

/**
 * Initialize AI Assistant UI and event handlers
 */
let aiAssistantInitialized = false; // Prevent duplicate initialization

function setupAIAssistant() {
    // Prevent duplicate initialization
    if (aiAssistantInitialized) {
        console.warn('⚠️ [AI Assistant] Already initialized, skipping duplicate setup');
        return;
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupAIAssistant);
        return;
    }

    const newsInput = document.getElementById('news-input');
    const analyzeBtn = document.getElementById('analyze-news-btn');
    const testBtn = document.getElementById('test-ai-btn');
    const loadingDiv = document.getElementById('ai-loading');
    const resultsPreview = document.getElementById('ai-results-preview');
    const resultsContent = document.getElementById('ai-results-content');
    const applyBtn = document.getElementById('apply-ai-results-btn');
    const discardBtn = document.getElementById('discard-ai-results-btn');

    if (!newsInput || !analyzeBtn) {
        console.warn('AI Assistant UI elements not found');
        return;
    }
    
    // Mark as initialized BEFORE adding event listeners to prevent race conditions
    aiAssistantInitialized = true;

    // Helper function to fetch article content from URL
    async function fetchArticleFromURL(url) {
        try {
            // Try to fetch the URL - this will work for some APIs or CORS-enabled sites
            // For most news sites, you'll need a backend proxy due to CORS
            const response = await fetch(url, {
                mode: 'cors',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            
            // Simple extraction - try to get main content
            // This is a basic implementation - for production, use a proper article extraction library
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Try common article selectors
            const articleSelectors = [
                'article',
                '[role="article"]',
                '.article-content',
                '.post-content',
                '.entry-content',
                'main',
                '.content'
            ];
            
            let articleText = '';
            for (const selector of articleSelectors) {
                const element = doc.querySelector(selector);
                if (element) {
                    articleText = element.innerText || element.textContent;
                    if (articleText.length > 200) break; // Got substantial content
                }
            }
            
            // Fallback: get body text
            if (!articleText || articleText.length < 200) {
                articleText = doc.body.innerText || doc.body.textContent;
            }
            
            // Limit article length to prevent excessive token usage (20,000 chars = ~10,000 tokens)
            const MAX_ARTICLE_LENGTH = 20000;
            let trimmedText = articleText.trim();
            
            if (trimmedText.length > MAX_ARTICLE_LENGTH) {
                console.warn(`⚠️ [AI Assistant] 文章内容过长 (${trimmedText.length.toLocaleString()} 字符)，已截断至 ${MAX_ARTICLE_LENGTH.toLocaleString()} 字符`);
                trimmedText = trimmedText.substring(0, MAX_ARTICLE_LENGTH) + '\n\n[... 文章过长已截断 ...]';
            }
            
            return trimmedText;
        } catch (error) {
            console.error('Failed to fetch article from URL:', error);
            throw new Error(`无法获取文章内容: ${error.message}。请直接粘贴文章文本。`);
        }
    }
    
    // Helper function to detect if input is a URL
    function isURL(str) {
        try {
            const url = new URL(str);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    }
    
    // Analyze function (shared by button click and Enter key)
    let isAnalyzing = false; // Prevent concurrent analysis
    
    async function performAnalysis() {
        // Prevent concurrent analysis requests
        if (isAnalyzing) {
            console.warn('⚠️ [AI Assistant] Analysis already in progress, ignoring duplicate request');
            showToast('分析正在進行中，請稍候...', 'info');
            return;
        }
        
        let newsText = newsInput.value.trim();

        if (!newsText) {
            showToast('请先粘贴新闻文章内容或链接', 'error');
            return;
        }
        
        // Warn if input is very long (before any processing)
        const MAX_RECOMMENDED_LENGTH = 20000;
        if (newsText.length > MAX_RECOMMENDED_LENGTH) {
            const charCount = newsText.length.toLocaleString();
            console.warn(`⚠️ [AI Assistant] 输入的文本较长 (${charCount} 字符)，系统将自动截断以节省配额`);
            showToast(`文本較長 (${charCount} 字符)，將僅分析前 20,000 字符`, 'info', 3000);
        }
        
        // Check if input is a URL
        if (isURL(newsText)) {
            showToast('正在获取文章内容...', 'info');
            analyzeBtn.disabled = true;
            loadingDiv.style.display = 'block';
            
            try {
                newsText = await fetchArticleFromURL(newsText);
                newsInput.value = newsText; // Update input with fetched content
                showToast('文章內容已獲取，正在分析...', 'success');
            } catch (error) {
                showToast(error.message || '无法获取文章内容，请直接粘贴文本', 'error');
                analyzeBtn.disabled = false;
                loadingDiv.style.display = 'none';
                return;
            }
        }

        // Check if Gemini is enabled
        if (!CONFIG?.GEMINI?.ENABLED) {
            showToast('AI Assistant is not enabled. Please configure Gemini API key in config.js', 'error');
            analyzeBtn.disabled = false;
            loadingDiv.style.display = 'none';
            return;
        }

        // Mark as analyzing
        isAnalyzing = true;
        
        // Show loading
        analyzeBtn.disabled = true;
        loadingDiv.style.display = 'block';
        resultsPreview.style.display = 'none';
        aiExtractionResults = null;

        try {
            // 使用 Agent 架構進行分析
            // 檢查 Agent 組件是否可用
            if (!window.MapAgentOrchestrator) {
                throw new Error('MapAgentOrchestrator 未載入，請確保 Agent 腳本已正確載入');
            }
            
            if (!window.convertGeoTargetsToLegacyFormat) {
                throw new Error('Agent 適配器未載入，請確保 js/utils/agent-adapter.js 已正確載入');
            }
            
            // 確保 geminiService 可用
            let geminiService = window.geminiService;
            if (!geminiService && window.analyzeNewsWithGemini) {
                geminiService = {
                    analyzeNewsWithGemini: window.analyzeNewsWithGemini
                };
                window.geminiService = geminiService;
            }
            
            if (!geminiService || !geminiService.analyzeNewsWithGemini) {
                throw new Error('Gemini Service 未載入，請確保 js/services/gemini-service.js 已正確載入');
            }
            
            // 創建 Orchestrator
            const orchestrator = new window.MapAgentOrchestrator(geminiService);
            
            // 使用 Agent 工作流處理新聞文本
            console.log('🚀 [AI Assistant] 使用 Agent 架構分析新聞...');
            const geoTargets = await orchestrator.processNewsText(newsText, isURL(newsText) ? newsText : null);
            
            // 轉換為現有格式
            const legacyResults = window.convertGeoTargetsToLegacyFormat(geoTargets);
            
            // 保存結果到參考數據庫（供後續檢索使用）
            if (window.MapReferenceRetrievalAgent) {
                try {
                    const retrievalAgent = new window.MapReferenceRetrievalAgent();
                    retrievalAgent.saveReference(newsText, legacyResults);
                } catch (error) {
                    console.warn('⚠️ [AI Assistant] 保存參考失敗:', error);
                }
            }
            
            // Resolve coordinates for locations without coordinates (保持向後兼容)
            // 注意：只解析列表中的locations，不會添加額外的locations
            const locationsWithCoords = await resolveLocationsBatch(legacyResults.locations);
            
            // 過濾掉噪音地點（白宮、華盛頓等簽署地點和新聞發稿地點）
            const filteredLocations = locationsWithCoords.filter(location => {
                const name = (location.name || '').toLowerCase();
                const context = (location.context || '').toLowerCase();
                
                // 排除簽署地點和新聞發稿地點
                const noiseKeywords = ['白宮', '白宫', 'white house', 'whitehouse', '華盛頓', '华盛顿', 'washington', 'dc', 'd.c.'];
                const isNoiseLocation = noiseKeywords.some(keyword => 
                    name.includes(keyword.toLowerCase())
                );
                
                if (isNoiseLocation) {
                    // 檢查上下文是否表明這是簽署地點或新聞發稿地點
                    const signingPatterns = [
                        /簽署儀式/gi,
                        /協議簽署/gi,
                        /見證下/gi,
                        /綜合外電報導/gi,
                        /中央社.*?報導/gi,
                        /報導/gi,
                        /報導/gi,
                        /在.*?舉行/gi,
                        /川普.*?表示/gi,
                        /trump.*?said/gi
                    ];
                    
                    const isSigningOrNewsLocation = signingPatterns.some(pattern => 
                        pattern.test(context) || pattern.test(location.context || '')
                    );
                    
                    if (isSigningOrNewsLocation) {
                        console.log(`🚫 [AI Assistant] 過濾噪音地點: ${location.name} (${context.substring(0, 50)}...)`);
                        return false;
                    }
                }
                
                return true;
            });
            
            // Store results (保留原始 geoTargets 以便後續使用)
            aiExtractionResults = {
                locations: filteredLocations, // 使用過濾後的 locations
                areas: legacyResults.areas,
                mapDesign: legacyResults.mapDesign || null,
                _geoTargets: geoTargets  // 保存原始 GeoTargets 供驗證信息使用
            };
            
            // 獲取驗證統計信息
            const validationStats = window.getValidationStats ? window.getValidationStats(geoTargets) : null;
            if (validationStats && validationStats.needsReview > 0) {
                console.warn(`⚠️ [AI Assistant] ${validationStats.needsReview} 個項目需要審查`);
            }

            // Display results preview
            displayResultsPreview(aiExtractionResults, resultsContent);
            resultsPreview.style.display = 'block';

            // Auto-apply results to map (直接预览标记与填色)
            showToast('分析完成，正在自動應用結果到地圖...', 'info');
            
            // Auto-select all items and apply
            try {
                // 過濾掉非核心國家（如美國，除非是事件直接發生地）
                // 這裡根據ISO代碼過濾，只保留核心事件參與方
                const coreCountries = ['ARM', 'AZE']; // 亞美尼亞、亞塞拜然是核心參與方
                let filteredAreas = aiExtractionResults.areas.filter(area => {
                    const isoCode = area.iso_code;
                    if (!isoCode) return true; // 如果沒有ISO代碼，保留（讓用戶決定）
                    
                    // 如果不在核心國家列表中，檢查confidence是否足夠高（>= 0.85）
                    if (!coreCountries.includes(isoCode)) {
                        const confidence = area._agent?.confidence ?? 0.5;
                        if (confidence < 0.85) {
                            console.log(`⚠️ [AI Assistant] 過濾掉非核心國家: ${area.name} (${isoCode}), confidence: ${confidence}`);
                            return false;
                        }
                    }
                    return true;
                });
                
                console.log(`📊 [AI Assistant] 過濾後: ${filteredAreas.length} 個核心區域 (原: ${aiExtractionResults.areas.length} 個)`);
                
                // 使用相鄰國家顏色分配邏輯
                let areasToApply = filteredAreas;
                if (typeof window.assignColorsToAdjacentCountries === 'function') {
                    areasToApply = window.assignColorsToAdjacentCountries([...areasToApply], PRESET_COLORS);
                    console.log('✅ [AI Assistant] 已為相鄰國家分配不同顏色');
                } else {
                    // 回退：使用索引分配顏色
                    areasToApply = areasToApply.map((area, index) => ({
                        ...area,
                        presetColor: area.suggestedColor || PRESET_COLORS[index % PRESET_COLORS.length]
                    }));
                }
                
                // Select all areas and locations by default (只使用列表中的locations，不會添加額外的)
                const allResults = {
                    areas: areasToApply,
                    locations: aiExtractionResults.locations, // 只使用列表中的locations
                    mapDesign: aiExtractionResults.mapDesign
                };
                
                // Apply directly to map
                await applyAIResultsToMap(allResults);
                
                // 顯示驗證統計信息（如果有）
                if (validationStats && validationStats.needsReview > 0) {
                    showToast(`✅ 結果已自動應用到地圖 (${validationStats.needsReview} 個項目需要審查)`, 'warning');
                } else {
                    showToast('✅ 結果已自動應用到地圖', 'success');
                }
            } catch (error) {
                console.error('Auto-apply error:', error);
                showToast('自動應用部分失敗，請檢查預覽並手動應用', 'warning');
            }

        } catch (error) {
            console.error('AI analysis error:', error);
            showToast(`Analysis failed: ${error.message}`, 'error');
        } finally {
            isAnalyzing = false; // Reset analyzing flag
            analyzeBtn.disabled = false;
            loadingDiv.style.display = 'none';
        }
    }
    
    // Analyze button click handler
    analyzeBtn.addEventListener('click', performAnalysis);
    
    // Test button click handler - 一键测试功能
    if (testBtn) {
        testBtn.addEventListener('click', function() {
            // 预设测试文本（亚塞拜然和亚美尼亚的新闻）
            const testNewsText = `（中央社亞塞拜然首都巴庫13日綜合外電報導）高加索地區鄰國亞塞拜然和亞美尼亞今天表示，他們為了解決彼此間數十年來衝突所進行的談判已經完成，雙方對於1份條約的內文已達成同意，就待簽署。

法新社報導，包括俄羅斯、歐洲聯盟（EU）、美國和土耳其都在爭奪高加索地區（Caucasus）的影響力。若是亞塞拜然與亞美尼亞能夠達成協議讓關係正常化，將是區域情勢的一大突破。

雙亞為了爭奪現於亞塞拜然境內的亞美尼亞人聚居地區納戈爾諾．卡拉巴赫（Nagorno-Karabakh，簡稱納卡區），曾分別在蘇聯時代末期及2020年進行過戰爭。亞塞拜然在2023年9月發動24小時閃電攻擊後，奪下整個納卡區。

亞塞拜然與亞美尼亞先前曾數度表示，雙方達成結束彼此長期衝突的全面性和平協議指日可待。但兩國先前的談判都未能就任何協議草案達成共識。

不過，亞塞拜然外交部長拜拉莫夫（Jeyhun Bayramov）今天對媒體記者表示：「針對（我方）與亞美尼亞的和平協議內文，相關談判程序已完成。...有關先前未達共識的2條款，亞美尼亞已接受亞塞拜然的提議。」

亞美尼亞外交部隨後也發布聲明證實消息，表示「協議草案的談判已經完成」，「和平協議已準備好簽署」。

透過 Google News
追蹤中央社
亞美尼亞總理帕辛揚（Nikol Pashinyan）對這起「重大事件」予以喝采。他並告訴媒體記者，亞美尼亞「已準備好對於和平協議的簽署地點和時間展開討論」。

儘管如此，亞塞拜然單方面發表聲明而非與亞美尼亞發表聯合聲明，遭到葉里凡（Yerevan，亞美尼亞首都）批評，暗示彼此間仍存在緊張關係。（譯者：林沂鋒/核稿：張正芊）1140314`;

            // 填充测试文本到输入框
            if (newsInput) {
                newsInput.value = testNewsText;
                // 滚动到输入框
                newsInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // 聚焦输入框
                newsInput.focus();
                // 将光标移到文本末尾
                newsInput.setSelectionRange(testNewsText.length, testNewsText.length);
            }
            
            // 显示提示
            showToast('已載入測試文本，開始分析...', 'info', 2000);
            
            // 延迟一小段时间后自动触发分析（让用户看到文本已填充）
            setTimeout(() => {
                performAnalysis();
            }, 500);
        });
    }
    
    // Enter key support for textarea
    if (newsInput) {
        newsInput.addEventListener('keydown', function(e) {
            // Enter key (but allow Shift+Enter for new lines)
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                performAnalysis();
            }
        });
    }

    // Apply results button
    if (applyBtn) {
        applyBtn.addEventListener('click', async function() {
            if (!aiExtractionResults) {
                showToast('没有可应用的结果', 'error');
                return;
            }

            // Disable button during application
            applyBtn.disabled = true;
            applyBtn.textContent = '正在应用...';

            try {
                // Get selected items from checkboxes
                const selectedAreas = [];
                const selectedLocations = [];
                
                // Get selected areas (使用相鄰國家顏色分配邏輯)
                const checkedAreaIndices = [];
                document.querySelectorAll('.ai-result-checkbox[data-type="area"]:checked').forEach(checkbox => {
                    const index = parseInt(checkbox.dataset.index);
                    checkedAreaIndices.push(index);
                });
                
                // 獲取選中的區域
                const checkedAreas = checkedAreaIndices.map(index => {
                    const area = aiExtractionResults.areas[index];
                    if (area) {
                        const colorSelector = document.querySelector(`.ai-area-color-selector[data-index="${index}"]`);
                        const presetColor = colorSelector ? colorSelector.value : (area.presetColor || PRESET_COLORS[index % PRESET_COLORS.length]);
                        return {
                            ...area,
                            presetColor: presetColor
                        };
                    }
                    return null;
                }).filter(Boolean);
                
                // 如果有相鄰國家顏色分配函數，重新分配顏色確保相鄰國家不同色
                if (typeof window.assignColorsToAdjacentCountries === 'function' && checkedAreas.length > 0) {
                    const reassignedAreas = window.assignColorsToAdjacentCountries(checkedAreas, PRESET_COLORS);
                    // 更新預覽中的顏色選擇器（如果需要）
                    reassignedAreas.forEach((area, idx) => {
                        const originalIndex = checkedAreaIndices[idx];
                        const colorSelector = document.querySelector(`.ai-area-color-selector[data-index="${originalIndex}"]`);
                        if (colorSelector && area.presetColor !== colorSelector.value) {
                            colorSelector.value = area.presetColor;
                        }
                    });
                    selectedAreas.push(...reassignedAreas);
                } else {
                    selectedAreas.push(...checkedAreas);
                }
                
                // Get selected locations
                document.querySelectorAll('.ai-result-checkbox[data-type="location"]:checked').forEach(checkbox => {
                    const index = parseInt(checkbox.dataset.index);
                    const location = aiExtractionResults.locations[index];
                    if (location) {
                        selectedLocations.push(location);
                    }
                });
                
                // Create filtered results with selected items
                const filteredResults = {
                    areas: selectedAreas,
                    locations: selectedLocations,
                    mapDesign: aiExtractionResults.mapDesign
                };
                
                // Apply results to map (this is async)
                await applyAIResultsToMap(filteredResults);
                
                // Hide preview and clear input after successful application
                resultsPreview.style.display = 'none';
                newsInput.value = '';
                aiExtractionResults = null;
                
            } catch (error) {
                console.error('Error applying results:', error);
                showToast(`应用失败: ${error.message}`, 'error');
            } finally {
                // Re-enable button
                applyBtn.disabled = false;
                applyBtn.innerHTML = '<span class="material-icons" style="font-size: 18px; vertical-align: middle;">check</span>應用到地圖';
            }
        });
    }

    // Discard results button
    if (discardBtn) {
        discardBtn.addEventListener('click', function() {
            resultsPreview.style.display = 'none';
            aiExtractionResults = null;
        });
    }
}

/**
 * Display extracted results in preview panel
 */
function displayResultsPreview(results, container) {
    if (!container || !results) return;

    let html = '';

    // Display map design suggestions if available
    if (results.mapDesign) {
        html += '<div style="margin-bottom: 16px; padding: 12px; background: #e3f2fd; border-radius: 4px; border-left: 3px solid #2196F3;">';
        html += '<strong style="font-size: 13px; color: #1976D2; display: block; margin-bottom: 8px;">🗺️ 地圖設計建議</strong>';
        
        if (results.mapDesign.title) {
            html += `<div style="font-size: 12px; margin-bottom: 4px;"><strong>標題:</strong> ${results.mapDesign.title}</div>`;
        }
        if (results.mapDesign.description) {
            html += `<div style="font-size: 12px; margin-bottom: 4px; color: #555;"><strong>說明:</strong> ${results.mapDesign.description}</div>`;
        }
        if (results.mapDesign.suggestedStyle) {
            html += `<div style="font-size: 12px; margin-bottom: 4px;"><strong>建議樣式:</strong> ${results.mapDesign.suggestedStyle}</div>`;
        }
        if (results.mapDesign.suggestedZoom) {
            html += `<div style="font-size: 12px;"><strong>建議縮放級別:</strong> ${results.mapDesign.suggestedZoom}</div>`;
        }
        html += '</div>';
    }

    // Preset colors for areas (from app-enhanced.js color presets)
    const PRESET_COLORS = ['#6CA7A1', '#496F96', '#E05C5A', '#EDBD76', '#E8DFCF', '#B5CBCD'];
    
    // 為區域分配顏色（確保相鄰國家使用不同顏色）
    let areasToDisplay = [...(results.areas || [])];
    if (typeof window.assignColorsToAdjacentCountries === 'function' && areasToDisplay.length > 0) {
        areasToDisplay = window.assignColorsToAdjacentCountries(areasToDisplay, PRESET_COLORS);
        console.log('✅ [AI Assistant] 已為預覽區域分配顏色（考慮相鄰國家）');
    } else {
        // 回退：使用索引分配顏色
        areasToDisplay = areasToDisplay.map((area, index) => ({
            ...area,
            presetColor: area.presetColor || area.suggestedColor || PRESET_COLORS[index % PRESET_COLORS.length]
        }));
    }
    
    // Display areas (countries/regions) with checkboxes and preset color selector
    if (areasToDisplay && areasToDisplay.length > 0) {
        html += '<div style="margin-bottom: 16px;">';
        html += '<strong style="font-size: 13px; color: #333; display: block; margin-bottom: 8px;">🎨 主要標註地區 (' + areasToDisplay.length + ' 個) - 選擇要應用的項目</strong>';
        html += '<div style="max-height: 200px; overflow-y: auto;">';
        const sortedAreas = sortByPriority(areasToDisplay);
        sortedAreas.forEach((area, index) => {
            const areaId = `area-${index}`;
            const priorityBadge = area.priority <= 2 
                ? `<span style="background: #ff5722; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-right: 6px;">重要</span>`
                : '';
            
            // Agent 驗證狀態標記
            let validationBadge = '';
            if (area._agent) {
                if (area._agent.validated === true) {
                    validationBadge = `<span style="background: #4caf50; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-right: 6px;" title="已驗證">✓</span>`;
                } else if (area._agent.needs_review === true) {
                    validationBadge = `<span style="background: #ff9800; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-right: 6px;" title="需要審查">⚠</span>`;
                }
            }
            
            // 信心度顯示
            const confidencePercent = area._agent && area._agent.confidence 
                ? Math.round(area._agent.confidence * 100) 
                : null;
            const confidenceBadge = confidencePercent !== null
                ? `<span style="font-size: 10px; color: #757575; margin-left: 6px;" title="信心度: ${confidencePercent}%">(${confidencePercent}%)</span>`
                : '';
            
            // ISO 代碼顯示
            const isoBadge = area.iso_code
                ? `<span style="font-size: 10px; color: #1976d2; margin-left: 6px; font-family: monospace;" title="ISO 代碼">[${area.iso_code}]</span>`
                : '';
            
            const reasonText = area.reason ? `<div style="font-size: 11px; color: #757575; margin-left: 56px; margin-top: 2px;">${area.reason}</div>` : '';
            
            // 驗證建議（如果需要審查）
            let suggestionText = '';
            if (area._agent && area._agent.needs_review && area._agent.suggestion) {
                suggestionText = `<div style="font-size: 11px; color: #ff9800; margin-left: 56px; margin-top: 2px; font-style: italic;">⚠️ ${area._agent.suggestion}</div>`;
            }
            
            // Use preset color (already assigned by assignColorsToAdjacentCountries if available)
            const presetColor = area.presetColor || PRESET_COLORS[index % PRESET_COLORS.length];
            
            html += `<div style="padding: 8px; margin-bottom: 6px; background: #f9f9f9; border-radius: 4px; border-left: 3px solid ${presetColor};">`;
            html += `<div style="display: flex; align-items: center;">`;
            html += `<input type="checkbox" class="ai-result-checkbox" data-type="area" data-index="${index}" checked style="margin-right: 8px; cursor: pointer;">`;
            html += `<div style="display: inline-flex; align-items: center; margin-right: 8px;">`;
            html += `<select class="ai-area-color-selector" data-index="${index}" style="width: 60px; height: 24px; border: 1px solid #ddd; border-radius: 3px; cursor: pointer; margin-right: 8px;">`;
            PRESET_COLORS.forEach(color => {
                const selected = color === presetColor ? 'selected' : '';
                html += `<option value="${color}" ${selected} style="background: ${color};">${color}</option>`;
            });
            html += `</select>`;
            html += `</div>`;
            html += `${validationBadge}<span style="font-weight: 500; font-size: 13px;">${area.name}</span>`;
            html += `${isoBadge}<span style="font-size: 11px; color: #757575; margin-left: 8px;">(${area.type})</span>${priorityBadge}${confidenceBadge}`;
            html += `</div>`;
            html += reasonText;
            html += suggestionText;
            html += '</div>';
        });
        html += '</div>';
        html += '</div>';
    }

    // Display locations (markers) with checkboxes
    if (results.locations && results.locations.length > 0) {
        html += '<div>';
        html += '<strong style="font-size: 13px; color: #333; display: block; margin-bottom: 8px;">📍 地點標記 (' + results.locations.length + ' 個) - 選擇要應用的項目</strong>';
        html += '<div style="max-height: 200px; overflow-y: auto;">';
        const sortedLocations = sortByPriority(results.locations);
        sortedLocations.forEach((loc, index) => {
            const priorityBadge = loc.priority <= 2 
                ? `<span style="background: #ff5722; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-right: 6px;">重要</span>`
                : '';
            
            // Agent 驗證狀態標記
            let validationBadge = '';
            if (loc._agent) {
                if (loc._agent.validated === true) {
                    validationBadge = `<span style="background: #4caf50; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-right: 6px;" title="已驗證">✓</span>`;
                } else if (loc._agent.needs_review === true) {
                    validationBadge = `<span style="background: #ff9800; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-right: 6px;" title="需要審查">⚠</span>`;
                }
            }
            
            // 信心度顯示
            const confidencePercent = loc._agent && loc._agent.confidence 
                ? Math.round(loc._agent.confidence * 100) 
                : null;
            const confidenceBadge = confidencePercent !== null
                ? `<span style="font-size: 10px; color: #757575; margin-left: 6px;" title="信心度: ${confidencePercent}%">(${confidencePercent}%)</span>`
                : '';
            
            const statusIcon = loc.coords 
                ? `<span style="color: #4caf50; font-size: 16px; margin-right: 6px;">✓</span>`
                : `<span style="color: #ff9800; font-size: 16px; margin-right: 6px; animation: pulse 1.5s infinite;">⏳</span>`;
            const coordText = loc.coords 
                ? `<div style="font-size: 11px; color: #757575; margin-top: 2px; margin-left: 32px;">座標: ${loc.coords[1].toFixed(4)}, ${loc.coords[0].toFixed(4)}</div>`
                : '<div style="font-size: 11px; color: #ff9800; margin-top: 2px; margin-left: 32px;">正在解析座標...</div>';
            const contextText = loc.context ? `<div style="font-size: 11px; color: #555; margin-top: 2px; margin-left: 32px; font-style: italic;">${loc.context}</div>` : '';
            
            // 驗證建議（如果需要審查）
            let suggestionText = '';
            if (loc._agent && loc._agent.needs_review && loc._agent.suggestion) {
                suggestionText = `<div style="font-size: 11px; color: #ff9800; margin-top: 2px; margin-left: 32px; font-style: italic;">⚠️ ${loc._agent.suggestion}</div>`;
            }
            
            html += `<div style="padding: 8px; margin-bottom: 6px; background: #f9f9f9; border-radius: 4px; border-left: 3px solid #007AFF;">`;
            html += `<div style="display: flex; align-items: center;">`;
            html += `<input type="checkbox" class="ai-result-checkbox" data-type="location" data-index="${index}" checked style="margin-right: 8px; cursor: pointer;">`;
            html += `${validationBadge}${statusIcon}<span style="font-weight: 500; font-size: 13px;">${formatLocationForDisplay(loc)}</span>${priorityBadge}${confidenceBadge}`;
            html += `</div>`;
            html += coordText;
            html += contextText;
            html += suggestionText;
            html += '</div>';
        });
        html += '</div>';
        html += '</div>';
    }

    if (!html) {
        html = '<p style="color: #757575; font-size: 13px; padding: 16px; text-align: center;">未在新闻文本中找到地点信息。请检查文本是否包含地理位置相关内容。</p>';
    }

    // Add summary stats
    const totalAreas = areasToDisplay ? areasToDisplay.length : 0;
    const totalLocations = results.locations ? results.locations.length : 0;
    if (totalAreas > 0 || totalLocations > 0) {
        html += `<div style="margin-top: 16px; padding: 8px; background: #f0f0f0; border-radius: 4px; font-size: 12px; color: #555; text-align: center;">`;
        html += `📊 提取总结: ${totalAreas} 个标注地区, ${totalLocations} 个地点标记`;
        html += `</div>`;
    }

    container.innerHTML = html;

    // 添加 checkbox 和 color selector 的實時事件監聽器
    // 使用更新後的 areasToDisplay 而不是原始的 results.areas
    setupAIResultCheckboxListeners({
        ...results,
        areas: areasToDisplay
    });
}

/**
 * Setup event listeners for AI result checkboxes and color selectors
 * This enables real-time updates when user unchecks/checks items or changes colors
 */
function setupAIResultCheckboxListeners(results) {
    if (!results || !appState) return;

    // 為所有 checkbox 添加 change 事件監聽器
    document.querySelectorAll('.ai-result-checkbox').forEach(checkbox => {
        const type = checkbox.dataset.type; // 'area' or 'location'
        const index = parseInt(checkbox.dataset.index);
        
        checkbox.addEventListener('change', async function() {
            const isChecked = this.checked;
            
            if (type === 'area') {
                const area = results.areas && results.areas[index];
                if (!area) return;
                
                // 構建 areaId 和 areaType
                const areaType = area.type || 'country';
                let areaId = area.iso_code || area.areaId;
                
                // 如果沒有 areaId，嘗試從已應用的區域中查找
                if (!areaId) {
                    const appliedArea = appState.selectedAreas.find(a => 
                        a.name === area.name && a.type === areaType
                    );
                    if (appliedArea) {
                        areaId = appliedArea.id;
                    }
                }
                
                if (areaId) {
                    if (isChecked) {
                        // 勾選：應用區域到地圖
                        const colorSelector = document.querySelector(`.ai-area-color-selector[data-index="${index}"]`);
                        const color = colorSelector ? colorSelector.value : (area.presetColor || area.suggestedColor || '#6CA7A1');
                        
                        try {
                            await applyColorToArea(areaId, area.name, areaType, color);
                            console.log(`✅ [AI Assistant] 已應用區域: ${area.name}`);
                        } catch (error) {
                            console.error(`❌ [AI Assistant] 應用區域失敗: ${area.name}`, error);
                            showToast(`應用區域失敗: ${area.name}`, 'error');
                            this.checked = false; // 回退checkbox狀態
                        }
                    } else {
                        // 取消勾選：從地圖移除區域
                        try {
                            if (typeof window.removeArea === 'function') {
                                window.removeArea(areaId, areaType);
                                console.log(`✅ [AI Assistant] 已移除區域: ${area.name}`);
                            } else {
                                // 備選方案：直接移除圖層
                                const layerId = `area-${areaType}-${areaId}`;
                                if (appState.map && appState.map.getLayer(layerId)) {
                                    appState.map.removeLayer(layerId);
                                    // 從 selectedAreas 中移除
                                    const areaIndex = appState.selectedAreas.findIndex(
                                        a => a.id === areaId && a.type === areaType
                                    );
                                    if (areaIndex >= 0) {
                                        appState.selectedAreas.splice(areaIndex, 1);
                                        if (typeof updateSelectedAreasList === 'function') {
                                            updateSelectedAreasList();
                                        }
                                    }
                                    console.log(`✅ [AI Assistant] 已移除區域圖層: ${area.name}`);
                                }
                            }
                        } catch (error) {
                            console.error(`❌ [AI Assistant] 移除區域失敗: ${area.name}`, error);
                            this.checked = true; // 回退checkbox狀態
                        }
                    }
                } else {
                    console.warn(`⚠️ [AI Assistant] 無法找到區域 ID: ${area.name}`);
                    if (!isChecked) {
                        this.checked = true; // 回退checkbox狀態
                    }
                }
            } else if (type === 'location') {
                // TODO: 實現 location marker 的實時添加/移除
                const location = results.locations && results.locations[index];
                if (location) {
                    console.log(`📍 [AI Assistant] Location checkbox changed: ${location.name} (${isChecked ? 'checked' : 'unchecked'})`);
                }
            }
        });
    });
    
    // 為所有 color selector 添加 change 事件監聽器（實時更新顏色）
    document.querySelectorAll('.ai-area-color-selector').forEach(selector => {
        const index = parseInt(selector.dataset.index);
        
        selector.addEventListener('change', async function() {
            const area = results.areas && results.areas[index];
            if (!area) return;
            
            // 檢查對應的 checkbox 是否被勾選
            const checkbox = document.querySelector(`.ai-result-checkbox[data-type="area"][data-index="${index}"]`);
            if (!checkbox || !checkbox.checked) return;
            
            const areaType = area.type || 'country';
            let areaId = area.iso_code || area.areaId;
            
            if (!areaId) {
                const appliedArea = appState.selectedAreas.find(a => 
                    a.name === area.name && a.type === areaType
                );
                if (appliedArea) {
                    areaId = appliedArea.id;
                }
            }
            
            if (areaId) {
                const newColor = this.value;
                try {
                    await applyColorToArea(areaId, area.name, areaType, newColor);
                    console.log(`✅ [AI Assistant] 已更新區域顏色: ${area.name} -> ${newColor}`);
                } catch (error) {
                    console.error(`❌ [AI Assistant] 更新區域顏色失敗: ${area.name}`, error);
                }
            }
        });
    });
}

/**
 * Apply AI extraction results to the map
 */
async function applyAIResultsToMap(results) {
    console.log('🚀 Starting to apply AI results to map:', results);
    
    if (!results) {
        console.error('❌ No results provided');
        showToast('没有可应用的结果', 'error');
        return;
    }
    
    if (!appState) {
        console.error('❌ appState not available');
        showToast('应用状态未就绪', 'error');
        return;
    }
    
    if (!appState.map) {
        console.error('❌ Map not available');
        showToast('地图未就绪，请等待地图加载完成', 'error');
        return;
    }

    // Show loading toast
    showToast('正在应用结果到地图...', 'info');
    console.log('📋 Results to apply:', {
        areas: results.areas?.length || 0,
        locations: results.locations?.length || 0,
        mapDesign: !!results.mapDesign
    });

    let areasApplied = 0;
    let markersApplied = 0;
    const errors = [];

    // Apply map design suggestions (跳过样式切换，避免源重新加载问题)
    if (results.mapDesign) {
        try {
            // 跳过样式切换 - 避免清除 GADM 源
            // 用户可以手动在右上角切换地图样式
            if (results.mapDesign.suggestedStyle) {
                console.log(`💡 AI 建议使用 ${results.mapDesign.suggestedStyle} 样式，但已跳过自动切换以避免数据源问题`);
                // 可选：显示提示（暂时注释掉，避免干扰）
                // showToast(`AI 建议使用 ${results.mapDesign.suggestedStyle} 样式。您可以在右上角手动切换。`, 'info', 5000);
            }

            // 只应用视角和缩放建议（不切换样式）
            if (results.mapDesign.suggestedCenter && results.mapDesign.suggestedZoom) {
                if (appState.map && appState.map.isStyleLoaded()) {
                    // 直接飞行到建议位置（不需要等待样式切换）
                    appState.map.flyTo({
                        center: results.mapDesign.suggestedCenter,
                        zoom: results.mapDesign.suggestedZoom,
                        duration: 2000
                    });
                }
            }
        } catch (error) {
            console.warn('Failed to apply map view suggestions:', error);
        }
    }

    // Apply areas (countries/regions) - sorted by priority
    // 過濾掉非核心事件參與方的國家（如美國、俄羅斯等，除非是事件直接發生地）
    if (results.areas && results.areas.length > 0) {
        // 過濾邏輯：排除特定國家（如果不是事件直接發生地）
        // 注意：這裡假設如果某個國家在列表中，說明AI已經判斷它與事件相關
        // 但如果用戶明確要求排除，可以在這裡添加過濾邏輯
        // 目前暫時不過濾，讓用戶通過取消勾選來排除
        // 确保边界源已加载（不切换样式，源应该已经存在）
        console.log('⏳ Checking boundary sources availability...');
        if (typeof loadBoundarySources === 'function') {
            loadBoundarySources();
        }
        
        // 等待 GADM 源加载（检查现有源，不需要重新加载）
        // 由于跳过了样式切换，源应该已经存在，等待时间可以缩短
        let maxWaitTime = 5000; // 5 秒足够（源应该已经加载了）
        let waited = 0;
        const checkInterval = 200;
        
        while (waited < maxWaitTime) {
            // 检查 GADM 源是否已加载
            const hasCountrySource = appState.map && appState.map.getSource('gadm-country');
            const hasStateSource = appState.map && appState.map.getSource('gadm-state');
            
            if (hasCountrySource || hasStateSource) {
                console.log(`✅ GADM sources available`);
                // 额外等待 500ms 确保源完全就绪
                await new Promise(resolve => setTimeout(resolve, 500));
                break;
            }
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waited += checkInterval;
        }
        
        if (waited >= maxWaitTime) {
            console.warn('⚠️ GADM sources may still be loading, but continuing anyway...');
        }
        
        const sortedAreas = sortByPriority(results.areas);
        for (const area of sortedAreas) {
            try {
                // Handle unsupported area types (e.g., 'region' -> convert to 'country')
                let areaType = area.type || 'country';
                if (areaType === 'region') {
                    console.warn(`Converting 'region' type to 'country' for ${area.name}`);
                    areaType = 'country';
                }
                if (!['country', 'state', 'city'].includes(areaType)) {
                    console.warn(`Skipping unsupported area type: ${area.type} for ${area.name}`);
                    continue;
                }
                
                // Update area type for this iteration
                const originalType = area.type;
                area.type = areaType;
                
                // 優先使用 AI 輸出的 ISO 代碼
                let areaId = null;
                
                // 方法1：優先使用 AI 直接輸出的 ISO 代碼
                if (area.iso_code && typeof area.iso_code === 'string' && area.iso_code.length === 3) {
                    areaId = area.iso_code.toUpperCase();
                    console.log(`✅ 使用 AI 輸出的 ISO 代碼: ${area.name} -> ${areaId}`);
                } else {
                    // 方法2：向後兼容 - 如果 AI 沒有輸出 ISO 代碼，使用名稱匹配
                    console.log(`⚠️ AI 未輸出 ISO 代碼，嘗試使用名稱匹配: ${area.name}`);
                    areaId = await findAreaIdByName(area.name, areaType);
                }
                
                // 如果還是找不到，嘗試從座標檢測
                if (!areaId && results.locations && results.locations.length > 0) {
                    // Look for locations in this area to get coordinates
                    const areaLocation = results.locations.find(loc => 
                        loc.name.toLowerCase().includes(area.name.toLowerCase()) ||
                        area.name.toLowerCase().includes(loc.name.toLowerCase())
                    );
                    
                    if (areaLocation && areaLocation.coords) {
                        // Try to detect boundary at that location
                        areaId = await findAreaIdByCoordinates(areaLocation.coords, area.type);
                    }
                }
                
                if (areaId) {
                    console.log(`✅ 應用顏色到區域: ${area.name} (${area.type}) -> ${areaId}`);
                    // Use preset color if available, otherwise fall back to suggested color or default
                    const colorToUse = area.presetColor || area.suggestedColor || '#6CA7A1';
                    
                    try {
                        // AI分析应用时，强制使用填充模式（fill），而不是outline
                        // 临时设置boundaryMode为'fill'，确保使用填充模式
                        const originalBoundaryMode = appState.boundaryMode;
                        appState.boundaryMode = 'fill';
                        
                        // Try to apply color - createAreaLayer will handle source loading internally
                        // No need to wait for source to load first
                        await applyColorToArea(areaId, area.name, area.type, colorToUse);
                        
                        // 恢复原来的boundaryMode（如果需要）
                        // appState.boundaryMode = originalBoundaryMode;
                        
                        areasApplied++;
                        // Small delay between area applications to allow processing
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (applyError) {
                        // Handle application errors gracefully
                        const errorMsg = applyError.message || String(applyError);
                        
                        // 如果 Agent 提供了建議，優先使用
                        let detailedError = `應用區域失敗: ${area.name} (${area.type}) - ${errorMsg}`;
                        if (area._agent && area._agent.suggestion) {
                            detailedError += `。建議: ${area._agent.suggestion}`;
                        }
                        
                        errors.push(detailedError);
                        console.error(`Failed to apply color to ${area.name}:`, {
                            error: applyError,
                            iso_code: area.iso_code,
                            validated: area._agent?.validated,
                            suggestion: area._agent?.suggestion
                        });
                        // Continue with next area even if this one fails
                    }
                } else {
                    // 更詳細的錯誤訊息（使用 Agent 驗證信息）
                    let errorMsg = '';
                    if (area._agent) {
                        // 使用 Agent 提供的驗證信息
                        if (area._agent.needs_review && area._agent.suggestion) {
                            errorMsg = `無法找到區域: ${area.name} (ISO: ${area.iso_code || '未提供'}) - ${area._agent.suggestion}`;
                        } else if (area._agent.validated === false) {
                            errorMsg = `區域驗證失敗: ${area.name} (ISO: ${area.iso_code || '未提供'}) - ISO 代碼可能無效`;
                        } else {
                            errorMsg = `無法找到區域: ${area.name} (ISO: ${area.iso_code || '未提供'}) - 請檢查 ISO 代碼或手動點擊地圖選擇`;
                        }
                    } else {
                        // 沒有 Agent 信息，使用通用錯誤訊息
                        if (area.iso_code) {
                            errorMsg = `無法找到區域: ${area.name} (ISO: ${area.iso_code}) - 請檢查 ISO 代碼是否正確或手動點擊地圖選擇`;
                        } else {
                            errorMsg = `無法找到區域: ${area.name} (${area.type}) - 請手動點擊地圖選擇`;
                        }
                    }
                    
                    errors.push(errorMsg);
                    console.warn(`Could not find area: ${area.name}`, {
                        iso_code: area.iso_code,
                        validated: area._agent?.validated,
                        needs_review: area._agent?.needs_review,
                        suggestion: area._agent?.suggestion
                    });
                    
                    // Only show first error to avoid spam
                    if (errors.filter(e => e.includes('無法找到區域') || e.includes('區域驗證失敗')).length === 1) {
                        if (area._agent && area._agent.suggestion) {
                            showToast(`部分區域驗證失敗：${area._agent.suggestion}`, 'warning', 5000);
                        } else {
                            showToast(`部分區域無法自動定位，請手動點擊地圖選擇`, 'warning');
                        }
                    }
                }
            } catch (error) {
                let errorMsg = `應用區域失敗: ${area.name}`;
                if (area._agent && area._agent.suggestion) {
                    errorMsg += ` - ${area._agent.suggestion}`;
                }
                errors.push(errorMsg);
                console.error(`Failed to apply area ${area.name}:`, {
                    error: error,
                    iso_code: area.iso_code,
                    validated: area._agent?.validated,
                    suggestion: area._agent?.suggestion
                });
            }
        }
    }

    // Apply locations (markers) - sorted by priority
    if (results.locations && results.locations.length > 0) {
        const sortedLocations = sortByPriority(results.locations);
        let firstMarkerApplied = false;

        for (const location of sortedLocations) {
            try {
                // Use resolved coordinates or try to resolve again
                let coords = location.coords;
                if (!coords) {
                    coords = await resolveLocationCoordinates(location.name, location.country);
                }

                if (coords && coords.length >= 2) {
                    const name = location.context 
                        ? `${location.name} - ${location.context}`
                        : location.name;
                    
                    // Use priority-based marker color
                    const markerColor = getMarkerColorByPriority(location.priority);
                    addMarker(coords, name, markerColor, appState.currentMarkerShape || 'pin');
                    markersApplied++;

                    // Fly to first (highest priority) location
                    if (!firstMarkerApplied && location.priority === 1) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        appState.map.flyTo({
                            center: coords,
                            zoom: results.mapDesign?.suggestedZoom || 10,
                            duration: 2000
                        });
                        firstMarkerApplied = true;
                    }
                } else {
                    // 使用 Agent 驗證信息
                    let errorMsg = `無法解析座標: ${location.name}`;
                    if (location._agent && location._agent.suggestion) {
                        errorMsg += ` - ${location._agent.suggestion}`;
                    }
                    errors.push(errorMsg);
                    console.warn(`Could not resolve coordinates for: ${location.name}`, {
                        validated: location._agent?.validated,
                        needs_review: location._agent?.needs_review,
                        suggestion: location._agent?.suggestion
                    });
                }
            } catch (error) {
                let errorMsg = `添加標記失敗: ${location.name}`;
                if (location._agent && location._agent.suggestion) {
                    errorMsg += ` - ${location._agent.suggestion}`;
                }
                errors.push(errorMsg);
                console.error(`Failed to add marker for ${location.name}:`, {
                    error: error,
                    validated: location._agent?.validated,
                    suggestion: location._agent?.suggestion
                });
            }
        }
    }

    // Show completion message
    const message = `✅ 已應用 ${areasApplied} 個標註地區, ${markersApplied} 個地點標記${errors.length > 0 ? ` (${errors.length} 個錯誤)` : ''}`;
    showToast(message, errors.length > 0 ? 'warning' : 'success');
    
    if (errors.length > 0) {
        console.warn('Errors during application:', errors);
    }

    console.log(`✅ Applied ${areasApplied} areas and ${markersApplied} markers to map`);
    
    // Update Chinese labels after all areas are applied
    if (areasApplied > 0) {
        console.log(`🔍 Checking for updateCustomChineseLabels function...`);
        console.log(`   - typeof window.updateCustomChineseLabels: ${typeof window.updateCustomChineseLabels}`);
        console.log(`   - window.updateCustomChineseLabels exists: ${!!window.updateCustomChineseLabels}`);
        
        if (typeof window.updateCustomChineseLabels === 'function') {
            setTimeout(() => {
                console.log(`🔄 Calling updateCustomChineseLabels()...`);
                try {
                    window.updateCustomChineseLabels();
                    console.log('✅ Updated Chinese labels after AI analysis');
                } catch (error) {
                    console.error('❌ Error calling updateCustomChineseLabels:', error);
                }
            }, 1500); // Wait for all areas to be fully rendered (increased to 1.5s)
        } else {
            console.warn('⚠️ updateCustomChineseLabels function not found on window object');
        }
    }
    
    // Zoom to all applied results (areas and markers)
    // Always try to zoom if we have any results, even if areasApplied is 0
    // (markers might have been applied, or we should zoom to mapDesign suggestions)
    if (areasApplied > 0 || markersApplied > 0 || (results.mapDesign && results.mapDesign.suggestedCenter)) {
        try {
            const bounds = new mapboxgl.LngLatBounds();
            let hasBounds = false;
            
            // If we have mapDesign suggestions but no areas/markers, use suggested center
            if ((areasApplied === 0 && markersApplied === 0) && results.mapDesign && results.mapDesign.suggestedCenter) {
                console.log('📍 Using mapDesign suggested center for zoom');
                appState.map.flyTo({
                    center: results.mapDesign.suggestedCenter,
                    zoom: results.mapDesign.suggestedZoom || 6,
                    duration: 2000
                });
                return; // Early return after zooming to suggested center
            }
            
            // Helper function to extend bounds with geometry coordinates
            const extendBoundsWithGeometry = (geometry) => {
                if (!geometry || !geometry.coordinates) return;
                
                const coords = geometry.coordinates;
                
                // Recursively flatten coordinates based on geometry type
                const flattenCoords = (arr) => {
                    if (typeof arr[0] === 'number') {
                        // This is a coordinate pair [lng, lat]
                        if (arr.length >= 2 && typeof arr[0] === 'number' && typeof arr[1] === 'number') {
                            bounds.extend(arr);
                            hasBounds = true;
                        }
                        return;
                    }
                    // This is a nested array, recurse
                    arr.forEach(item => flattenCoords(item));
                };
                
                flattenCoords(coords);
            };
            
            // Add all applied areas to bounds by getting their coordinates from GADM sources
            if (appState.selectedAreas && appState.selectedAreas.length > 0) {
                // Get recently applied areas (assuming they're at the end of selectedAreas)
                const recentAreas = appState.selectedAreas.slice(-areasApplied);
                
                for (const area of recentAreas) {
                    if (area.id) {
                        try {
                            // Try to get bounds from GADM source
                            const sourceId = area.type === 'country' ? 'gadm-country' : 
                                           (area.type === 'state' ? 'gadm-state' : 'gadm-city');
                            const source = appState.map.getSource(sourceId);
                            
                            if (source && source._data && source._data.features) {
                                // Find feature matching this area ID
                                const areaFeature = source._data.features.find(f => {
                                    const props = f.properties || {};
                                    const gid = props.GID_0 || props.GID_1 || props.GID_2;
                                    return gid === area.id;
                                });
                                
                                if (areaFeature && areaFeature.geometry) {
                                    extendBoundsWithGeometry(areaFeature.geometry);
                                }
                            }
                        } catch (e) {
                            console.warn(`Could not get bounds for area ${area.name}:`, e);
                        }
                    }
                }
            }
            
            // Add all applied markers to bounds
            if (appState.markers && appState.markers.length > 0) {
                // Get recently applied markers (assuming they're at the end of markers array)
                const recentMarkers = appState.markers.slice(-markersApplied);
                recentMarkers.forEach(marker => {
                    if (marker.coordinates && marker.coordinates.length >= 2) {
                        bounds.extend(marker.coordinates);
                        hasBounds = true;
                    }
                });
            }
            
            // Also add locations from results if they have coords
            if (results.locations && results.locations.length > 0) {
                for (const location of results.locations) {
                    if (location.coords && location.coords.length >= 2) {
                        bounds.extend(location.coords);
                        hasBounds = true;
                    }
                }
            }
            
            // Fly to bounds if we have any
            if (hasBounds) {
                setTimeout(() => {
                    appState.map.fitBounds(bounds, {
                        padding: { top: 50, bottom: 50, left: 50, right: 50 },
                        duration: 2000,
                        maxZoom: 12
                    });
                    console.log('✅ Zoomed to all applied results');
                }, 1500); // Wait for all layers to render
            } else {
                console.warn('⚠️ No bounds calculated for zoom, skipping fitBounds');
            }
        } catch (error) {
            console.warn('⚠️ Failed to zoom to results:', error);
        }
    }
}

/**
 * Get marker color based on priority
 */
function getMarkerColorByPriority(priority) {
    const colors = {
        1: '#FF3B30', // Red - highest priority
        2: '#FF9500', // Orange - high priority
        3: '#FFCC00', // Yellow - medium-high priority
        4: '#34C759', // Green - medium priority
        5: '#007AFF'  // Blue - normal priority
    };
    return colors[priority] || colors[5];
}

/**
 * Find area ID by name (enhanced with geocoding)
 */
async function findAreaIdByName(areaName, areaType) {
    // Try to find in country codes mapping first
    if (areaType === 'country') {
        // First, try to find in COUNTRY_CODES using full mapping
        if (typeof COUNTRY_CODES !== 'undefined') {
            // Try exact match by code
            if (COUNTRY_CODES[areaName.toUpperCase()]) {
                return areaName.toUpperCase();
            }
            
            // Try to find by Chinese name
            const codeByChineseName = Object.keys(COUNTRY_CODES).find(
                code => COUNTRY_CODES[code].name === areaName
            );
            if (codeByChineseName) return codeByChineseName;
            
            // Try to find by English name (exact match)
            const codeByEnglishName = Object.keys(COUNTRY_CODES).find(
                code => COUNTRY_CODES[code].nameEn === areaName || 
                        COUNTRY_CODES[code].nameEn.toLowerCase() === areaName.toLowerCase()
            );
            if (codeByEnglishName) return codeByEnglishName;
            
            // Try partial match (contains)
            const normalizedName = areaName.toLowerCase();
            const codeByPartialMatch = Object.keys(COUNTRY_CODES).find(code => {
                const country = COUNTRY_CODES[code];
                return country.name.toLowerCase().includes(normalizedName) ||
                       country.nameEn.toLowerCase().includes(normalizedName) ||
                       normalizedName.includes(country.name.toLowerCase()) ||
                       normalizedName.includes(country.nameEn.toLowerCase());
            });
            if (codeByPartialMatch) return codeByPartialMatch;
        }

        // Fallback: Try common variations for special cases (including simplified Chinese)
        const specialCases = {
            'Taiwan': 'TWN', '台灣': 'TWN', '臺灣': 'TWN', '台湾': 'TWN', 'Taiwan, Province of China': 'TWN',
            'China': 'CHN', '中国': 'CHN', '中國': 'CHN', 'People\'s Republic of China': 'CHN',
            'United States': 'USA', 'USA': 'USA', 'US': 'USA', '美国': 'USA', '美國': 'USA', 'United States of America': 'USA',
            'United Kingdom': 'GBR', 'UK': 'GBR', 'Britain': 'GBR', '英国': 'GBR', '英國': 'GBR',
            'Japan': 'JPN', '日本': 'JPN',
            'Korea': 'KOR', 'South Korea': 'KOR', '韩国': 'KOR', '韓國': 'KOR', 'Republic of Korea': 'KOR',
            'Poland': 'POL', '波兰': 'POL', '波蘭': 'POL',
            'Romania': 'ROU', '罗马尼亚': 'ROU', '羅馬尼亞': 'ROU',
            'Ukraine': 'UKR', '乌克兰': 'UKR', '烏克蘭': 'UKR',
            'Germany': 'DEU', '德国': 'DEU', '德國': 'DEU', 'Federal Republic of Germany': 'DEU',
            // Add more country mappings
            'Azerbaijan': 'AZE', '亚塞拜然': 'AZE', '亞塞拜然': 'AZE', '阿塞拜疆': 'AZE', '阿塞拜疆': 'AZE',
            'Armenia': 'ARM', '亚美尼亚': 'ARM', '亞美尼亞': 'ARM', '亚美尼亚': 'ARM',
            'Russia': 'RUS', '俄罗斯': 'RUS', '俄羅斯': 'RUS', 'Russian Federation': 'RUS',
            'France': 'FRA', '法国': 'FRA', '法國': 'FRA',
            'Italy': 'ITA', '意大利': 'ITA', '義大利': 'ITA',
            'Spain': 'ESP', '西班牙': 'ESP',
            'India': 'IND', '印度': 'IND',
            'Brazil': 'BRA', '巴西': 'BRA',
            'Canada': 'CAN', '加拿大': 'CAN',
            'Australia': 'AUS', '澳大利亚': 'AUS', '澳洲': 'AUS',
            'Mexico': 'MEX', '墨西哥': 'MEX',
            'Turkey': 'TUR', '土耳其': 'TUR',
            'Iran': 'IRN', '伊朗': 'IRN',
            'Egypt': 'EGY', '埃及': 'EGY',
            'Saudi Arabia': 'SAU', '沙特阿拉伯': 'SAU', '沙烏地阿拉伯': 'SAU',
            'Indonesia': 'IDN', '印度尼西亚': 'IDN', '印尼': 'IDN',
            'Thailand': 'THA', '泰国': 'THA', '泰國': 'THA',
            'Vietnam': 'VNM', '越南': 'VNM',
            'Philippines': 'PHL', '菲律宾': 'PHL', '菲律賓': 'PHL',
            'Malaysia': 'MYS', '马来西亚': 'MYS', '馬來西亞': 'MYS',
            'Singapore': 'SGP', '新加坡': 'SGP',
            'South Africa': 'ZAF', '南非': 'ZAF',
            'Argentina': 'ARG', '阿根廷': 'ARG',
            'Chile': 'CHL', '智利': 'CHL',
        };
        
        // Check exact match in special cases
        if (specialCases[areaName]) return specialCases[areaName];
        
        // Check case-insensitive match in special cases
        const normalizedName = areaName.toLowerCase();
        for (const [key, value] of Object.entries(specialCases)) {
            if (key.toLowerCase() === normalizedName) return value;
        }
        
        // Also try simplified to traditional mapping for Chinese names
        const simplifiedToTraditional = {
            '台湾': '台灣',
            '英国': '英國',
            '美国': '美國',
            '中国': '中國'
        };
        
        if (simplifiedToTraditional[areaName] && specialCases[simplifiedToTraditional[areaName]]) {
            return specialCases[simplifiedToTraditional[areaName]];
        }

        // Last resort: Try first 3 letters as country code (might work for some)
        const threeLetterCode = areaName.toUpperCase().substring(0, 3);
        if (threeLetterCode.length === 3 && COUNTRY_CODES && COUNTRY_CODES[threeLetterCode]) {
            return threeLetterCode;
        }
        
        // Return null if not found (will trigger error handling)
        console.warn(`Could not find country code for: ${areaName}`);
        return null;
    }

    // For states/cities, try to use geocoding to find coordinates first
    // Then we can try to detect the boundary at those coordinates
    if (CONFIG && CONFIG.MAPBOX && CONFIG.MAPBOX.TOKEN) {
        try {
            const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(areaName)}.json?access_token=${CONFIG.MAPBOX.TOKEN}&types=region,place&limit=1`;
            const response = await fetch(geocodeUrl);
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                // Extract area code from context or properties
                const context = feature.context || [];
                const countryContext = context.find(c => c.id && c.id.startsWith('country'));
                if (countryContext && countryContext.short_code) {
                    // Return country code + area name for now
                    return countryContext.short_code.toUpperCase();
                }
            }
        } catch (error) {
            console.warn(`Geocoding failed for ${areaName}:`, error);
        }
    }

    // Fallback: return name as ID (will try to match by name in detectClickedBoundary)
    return areaName;
}

/**
 * Find area ID by coordinates (by detecting boundary at that location)
 */
async function findAreaIdByCoordinates(coords, areaType) {
    if (!appState || !appState.map || !coords || coords.length < 2) {
        return null;
    }
    
    try {
        // Simulate a click at those coordinates to detect boundary
        // This is a workaround - in production, should query the map directly
        const point = appState.map.project(coords);
        
        // Query rendered features at that point
        const features = appState.map.queryRenderedFeatures(point, {
            layers: ['visible-boundaries-country', 'visible-boundaries-state', 'visible-boundaries-city']
        });
        
        if (features && features.length > 0) {
            const feature = features[0];
            const props = feature.properties;
            
            // Extract area ID based on type
            if (areaType === 'country') {
                return props.GID_0 || props.COUNTRY || props.ISO_A3;
            } else if (areaType === 'state') {
                return props.GID_1 || props.NAME_1;
            } else if (areaType === 'city') {
                return props.GID_2 || props.NAME_2;
            }
        }
    } catch (error) {
        console.warn(`Failed to find area by coordinates:`, error);
    }
    
    return null;
}

/**
 * Wait for boundary sources to load
 */
async function waitForBoundarySourcesToLoad(maxWait = 15000) {
    if (!appState || !appState.map) {
        console.warn('⚠️ Map not ready, skipping boundary source wait');
        return false;
    }
    
    // First, ensure loading is triggered
    if (typeof loadBoundarySources === 'function') {
        loadBoundarySources();
    }
    
    // Check if source is already loaded (check actual Mapbox source, not just state flag)
    const boundariesSourceId = 'boundaries-adm0';
    const sourceExists = appState.map.getSource(boundariesSourceId);
    
    if (sourceExists) {
        console.log('✅ Boundary source already exists');
        return true;
    }
    
    // Check state flag as backup
    if (appState.sources && appState.sources.adm0 && appState.sources.adm0.loaded) {
        console.log('✅ Boundary source marked as loaded');
        return true;
    }
    
    // Wait for source to load using Promise-based event listener
    return new Promise((resolve) => {
        const startTime = Date.now();
        const checkInterval = 200;
        let timeoutId;
        
        // Set up event listener for source loading
        const onData = (e) => {
            if (e.sourceId === boundariesSourceId && e.isSourceLoaded) {
                console.log('✅ Boundary source loaded via event');
                cleanup();
                resolve(true);
            }
        };
        
        const cleanup = () => {
            if (timeoutId) clearInterval(timeoutId);
            appState.map.off('data', onData);
        };
        
        // Listen for data events
        appState.map.on('data', onData);
        
        // Also poll as backup
        timeoutId = setInterval(() => {
            // Check actual source
            const source = appState.map.getSource(boundariesSourceId);
            if (source) {
                console.log('✅ Boundary source found via polling');
                cleanup();
                resolve(true);
                return;
            }
            
            // Check state flag
            if (appState.sources && appState.sources.adm0 && appState.sources.adm0.loaded) {
                console.log('✅ Boundary source marked as loaded via polling');
                cleanup();
                resolve(true);
                return;
            }
            
            // Check timeout
            if (Date.now() - startTime > maxWait) {
                console.warn(`⚠️ Boundary sources did not load within ${maxWait}ms timeout, proceeding anyway...`);
                cleanup();
                resolve(false);
            }
        }, checkInterval);
    });
}

/**
 * Ensure boundary source is loaded for a specific area type
 */
async function ensureBoundarySourceLoaded(areaType) {
    if (!appState || !appState.map) return false;
    
    // Map area type to source key
    const sourceKeyMap = {
        'country': 'adm0',
        'state': 'adm1',
        'city': 'adm2'
    };
    
    const sourceKey = sourceKeyMap[areaType] || 'adm0';
    
    // Check if source is already loaded
    if (appState.sources && appState.sources[sourceKey] && appState.sources[sourceKey].loaded) {
        return true;
    }
    
    // Check if GADM source exists (might be faster)
    const gadmSourceId = `gadm-${areaType}`;
    const hasGADMSource = appState.map.getSource(gadmSourceId);
    if (hasGADMSource) {
        console.log(`✅ GADM source for ${areaType} already exists`);
        return true;
    }
    
    // Try to load the source
    console.log(`⏳ Loading boundary source for ${areaType}...`);
    
    // Check if loadBoundarySourceForType function exists and call it
    if (typeof loadBoundarySourceForType === 'function') {
        try {
            // Trigger loading
            await loadBoundarySourceForType(areaType, false);
        } catch (error) {
            console.warn(`Failed to trigger load for ${areaType}:`, error);
        }
        
        // Wait for source to load - longer timeout for large files (city data can be 80+ MB)
        const maxWait = areaType === 'city' ? 30000 : areaType === 'state' ? 15000 : 10000; // 30s for city, 15s for state, 10s for country
        const startTime = Date.now();
        const checkInterval = 200;
        
        while (Date.now() - startTime < maxWait) {
            // Check both regular source and GADM source
            const regularSourceLoaded = appState.sources && appState.sources[sourceKey] && appState.sources[sourceKey].loaded;
            const gadmSourceLoaded = appState.map.getSource(gadmSourceId);
            
            if (regularSourceLoaded || gadmSourceLoaded) {
                console.log(`✅ Boundary source for ${areaType} loaded (${regularSourceLoaded ? 'regular' : 'GADM'})`);
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
    }
    
    console.warn(`⚠️ Boundary source for ${areaType} did not load within timeout (may still be loading in background)`);
    // Return false but don't block - the source might still load
    return false;
}

// Initialize when script loads
setupAIAssistant();

