/**
 * Geo Extractor Agent
 * 
 * 從新聞稿中抽取地理位置和區域
 * 
 * 輸入：新聞稿文本
 * 輸出：GeoTargets（候選地點/區域清單）
 */

class GeoExtractorAgent {
    constructor(geminiService) {
        this.geminiService = geminiService;
    }

    /**
     * 從新聞稿抽取地理位置和區域
     * 
     * @param {string} newsText - 新聞稿文本
     * @param {string} [sourceUrl] - 來源 URL
     * @returns {Promise<GeoTargets>}
     */
    async extractGeoTargets(newsText, sourceUrl = null) {
        console.log('🔍 [GeoExtractor] 開始抽取地理位置...');

        // 使用自己的 Prompt（Agent 格式：regions, places）
        const prompt = this.buildExtractionPrompt(newsText);
        
        try {
            // 直接調用 Gemini API，不使用 analyzeNewsWithGemini（因為格式不同）
            // Agent 需要 {regions, places} 格式，而 analyzeNewsWithGemini 返回 {areas, locations} 格式
            
            // 檢查配置
            const config = (typeof window !== 'undefined' && window.CONFIG) || {};
            const geminiConfig = config.GEMINI || {};
            const useBackendProxy = geminiConfig.USE_BACKEND_PROXY !== false;
            let proxyEndpoint = geminiConfig.PROXY_ENDPOINT || '/api/gemini/generateContent';
            const timeout = geminiConfig.TIMEOUT || 30000;

            // 處理 proxy endpoint URL
            if (useBackendProxy) {
                if (proxyEndpoint.startsWith('/')) {
                    const currentPort = window.location.port;
                    if (currentPort && currentPort !== '8000') {
                        proxyEndpoint = `http://localhost:8000${proxyEndpoint}`;
                    }
                }
            }

            // 構建 URL 和 headers
            let url, headers = {
                'Content-Type': 'application/json'
            };
            
            if (useBackendProxy) {
                url = proxyEndpoint;
            } else {
                const apiKey = geminiConfig.API_KEY;
                if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
                    throw new Error('Gemini API key is not set. Please add your API key in config.js or use backend proxy');
                }
                url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            }

            // 調用 API（帶超時控制）
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Gemini API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!responseText) {
                throw new Error('No content in Gemini API response');
            }

            // 解析響應（字符串格式）
            let extracted = this.parseExtractionResponse(responseText, newsText);
            
            // 後處理：過濾噪音
            extracted = this.filterNoiseTargets(extracted, newsText);
            
            return {
                source_text: newsText,
                source_url: sourceUrl,
                timestamp: new Date().toISOString(),
                candidates: extracted,
                selected_ids: [] // 初始為空，等待使用者勾選
            };

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Gemini API request timed out');
            }
            console.error('❌ [GeoExtractor] 抽取失敗:', error);
            throw error;
        }
    }

    /**
     * 構建抽取提示詞（優化版本：精準提取事件相關地理位置）
     */
    buildExtractionPrompt(newsText) {
        const GADM_INFO = `
## 重要提示 - 數據可用性：
- 系統使用 GADM (Global Administrative Areas) 數據作為填色圖層的唯一數據源
- GADM 包含所有國家的國家級別（country）和大部分國家的州/省級別（state/administration）數據
- **請直接輸出 ISO 3166-1 alpha-3 代碼**（如 USA, CHN, TWN, JPN, AZE, ARM 等）
- 對於區域名稱（如"南高加索地區"、"中東地區"），請分解為具體的國家並輸出各自的 ISO 代碼
- 城市級別數據可能不完整，優先使用國家或州/省級別
`;

        return `${GADM_INFO}

你是一個專業的地理資訊提取專家，專門從新聞稿中提取"事件發生地"和"地緣政治直接相關"的地理位置。

## 核心任務：精準提取事件相關地理位置

**你的目標是提取：**
1. **事件發生地**：事件直接發生的位置（如戰爭爆發地、協議簽署地、災難發生地等）
2. **地緣政治直接參與方**：直接交戰國、協議簽署方、直接制裁目標國、直接衝突方等

**你必須排除（噪音類型）：**
- ❌ 受訪單位/組織所在位置（如"XX組織在XX國表示"）
- ❌ 消息來源/發言人所在位置（如"據XX國消息人士透露"、"XX國政府發言人表示"）
- ❌ 記者/報道所在位置（如"本報記者從XX國發回的報道"、"XX國當地媒體報道"、"XX國綜合外電報導"）
- ❌ 新聞機構總部位置（如"路透社XX國分部"）
- ❌ 新聞發稿地點（如"中央社XX國X日報導"、"路透社XX國報導"）
- ❌ 協議簽署地點（如果簽署地點不是事件發生地，如"在XX國簽署協議"，但事件實際發生在其他國家）
- ❌ 斡旋者/調解者所在國家（如"由XX國斡旋"、"XX國協助調解"，但XX國不是直接參與方）
- ❌ 僅作為背景歷史提及的地點（如"歷史上曾在XX國發生"）
- ❌ 僅作為比較對象提及的地區（如"類似於XX國的情況"）
- ❌ 僅作為地理位置參考的鄰近地區（如"鄰近XX國的地區"、"與XX國接壤"）
- ❌ 僅提及但未直接參與的國家（如"XX國對此表示關注"、"XX國可能不滿"，但XX國不是事件直接參與方）

## 語義角色識別指導

### 識別核心事件位置（必須包含）：
- **事件發生地關鍵詞**：在XX發生、XX爆發、在XX舉行、XX遭遇、XX地區發生（僅限事件實際發生地）
- **直接參與方關鍵詞**：XX國與XX國簽署、XX國和XX國交戰、XX國對XX國實施制裁（必須是雙方都直接參與）
- **協議簽署方**：如果協議是雙邊或多邊協議，只有簽署協議的國家才算直接參與方（如"XX國與XX國簽署協議"）

### 區分直接參與方與斡旋者：
- **直接參與方**：協議簽署方、交戰雙方、被制裁的直接目標國 → 必須包含
- **斡旋者/調解者**：協助談判、提供場地、但未簽署協議的國家 → 必須排除
  - 例如："在XX國斡旋下"、"由XX國協助調解"、"在XX國見證下簽署" → XX國應排除（如果XX國不是協議簽署方）

### 識別噪音位置（必須排除）：
- **受訪/消息來源關鍵詞**：據XX報道、XX表示、XX透露、XX稱、XX發言人說、XX機構在XX國
- **記者/報道關鍵詞**：本報記者、XX國當地媒體、從XX國發回、XX國通訊社、XX國綜合外電報導、中央社XX國報導
- **協議簽署地點關鍵詞**：在XX國簽署、在XX國舉行簽署儀式、XX國見證下（如果XX國不是協議簽署方）
- **斡旋者關鍵詞**：由XX國斡旋、XX國協助、XX國調解、在XX國協助下、XX國促成（如果XX國不是直接參與方）
- **背景/比較關鍵詞**：歷史上、曾經、類似於、與XX國相比、鄰近XX國、XX國對此表示關注、XX國可能不滿（但不是直接參與）
- **間接引用關鍵詞**：引述、援引、轉述、根據XX的說法

## 新聞稿：
${newsText}

## 輸出格式（JSON）：

{
  "regions": [
    {
      "name": "區域名稱（如：台灣、烏克蘭、德國）",
      "iso_code": "ISO 3166-1 alpha-3 代碼（如：TWN, UKR, DEU）",
      "type": "country|state|city",
      "gadm_level": 0|1|2,
      "confidence": 0.0-1.0,
      "role": "event_location|direct_participant|geopolitical_stakeholder",
      "evidence": "新聞稿中提到的具體片段（必須能證明是事件發生地或直接參與方）"
    }
  ],
  "places": [
    {
      "name": "地點名稱（如：基輔、柏林、台北）",
      "type": "city|landmark|port|airport",
      "country": "所屬國家",
      "coordinates": [經度, 緯度] 或 null,
      "confidence": 0.0-1.0,
      "role": "event_location|direct_participant",
      "evidence": "新聞稿中提到的具體片段（必須能證明是事件發生地）"
    }
  ]
}

## 嚴格要求：

### 1. Confidence 評分標準（基於語義角色，而非頻率）：
- **0.9-1.0**：事件直接發生地（明確提到"在XX發生"、"XX爆發"、"XX遭遇襲擊"等）
- **0.85-0.9**：直接參與方（簽署協議的國家、直接交戰方、被制裁的直接目標國）
- **0.75-0.85**：重要地緣政治關聯方（提供軍事基地的國家、重要外交斡旋國）
- **< 0.75**：必須排除（受訪單位、消息來源、記者位置、背景提及、比較對象、鄰近地區等）

### 2. Role 字段說明：
- **event_location**：事件直接發生的地點（如戰爭爆發的城市、災難發生地）
- **direct_participant**：直接參與事件的國家（如簽署協議的國家、直接交戰方）
- **geopolitical_stakeholder**：地緣政治重要關聯方（僅當 confidence >= 0.75 時使用）

### 3. Evidence 驗證要求：
- evidence 必須是新聞稿中的**實際文本片段**，不能是概括或推測
- evidence 必須能**明確證明**該位置是事件發生地或直接參與方
- 如果 evidence 包含噪音關鍵詞（如"據XX報道"、"XX表示"），該位置應排除

### 4. 過濾原則（嚴格執行）：
- **只返回 confidence >= 0.75 的項目**
- **以下情況必須設 confidence < 0.75 並排除**：
  - 斡旋者/調解者（證據包含"由XX國斡旋"、"會晤XX國總統期間"等，但XX國不是協議簽署方）
  - 協議簽署地點（證據包含"在XX地簽署"、"在XX地舉行簽署儀式"等，但XX地不是事件發生地）
  - 新聞發稿地點（證據包含"XX社XX地報導"、"XX地綜合外電報導"等）
  - 見證者/協助者（證據包含"在XX國見證下"、"XX國協助"等，但XX國不是協議簽署方）
- 對於每個位置，明確標注其**語義角色**（role）
- 如果一個位置在多個語義角色中出現，選擇**最核心的角色**
- 如果無法確定有效證據支持高 confidence，應排除該位置
- **記住：只有直接參與事件的國家/地點才應該有 confidence >= 0.75**

### 5. ISO 代碼要求：
- **iso_code 是必填字段**，必須輸出有效的 ISO 3166-1 alpha-3 代碼（3個字母，如 USA, CHN, TWN）
- **禁止提取區域代碼**（如 EU, AU, APEC 等）
- 對於區域名稱，分解為具體國家並輸出各自的 ISO 代碼

### 6. 去重原則：
- 如果同一國家/地點多次提及，只記錄一次，使用**最高 confidence**和**最核心的 role**
- 如果同一國家既是事件發生地又是直接參與方，合併為一個記錄，role 標注為兩個角色

### 7. 示例分析：

**示例1**（應包含）：
- 文本："烏克蘭首都基輔遭遇導彈襲擊"
- 提取：基輔（place, confidence: 0.95, role: event_location）、烏克蘭（region, confidence: 0.95, role: event_location）

**示例2**（應包含）：
- 文本："美國和英國簽署雙邊貿易協議"
- 提取：美國（region, confidence: 0.9, role: direct_participant）、英國（region, confidence: 0.9, role: direct_participant）

**示例3**（應排除）：
- 文本："據路透社倫敦分部報道，法國政府發言人表示..."
- 排除：倫敦（這是新聞機構位置，不是事件相關位置）
- 如果法國是事件參與方，則包含法國；如果法國只是消息來源，則排除法國

**示例4**（應排除）：
- 文本："鄰近烏克蘭的波蘭表示關注"
- 排除：波蘭（僅作為地理位置參考，不是事件直接參與方）

**示例5**（應排除 - 斡旋者和簽署地點）：
- 文本："亞塞拜然與亞美尼亞元首會晤美國總統川普期間，共同簽署由美國斡旋、結束兩國數十年衝突的和平協議"
- 應提取：亞塞拜然（AZE, confidence: 0.9, direct_participant）、亞美尼亞（ARM, confidence: 0.9, direct_participant）
- **必須排除**：
  - 美國（USA - 證據是"會晤美國總統川普期間"和"由美國斡旋"，美國是斡旋者，不是協議簽署方，confidence 應設為 < 0.75 或直接排除）
  - 白宮/華盛頓（證據是"在白宮舉行的協議簽署儀式"或"中央社華盛頓報導"，這是簽署地點和新聞發稿地點，不是事件發生地，confidence 應設為 < 0.75 或直接排除）

**示例6**（應排除 - 新聞發稿地點）：
- 文本："（中央社華盛頓8日綜合外電報導）亞塞拜然與亞美尼亞..."
- 應提取：亞塞拜然（AZE, direct_participant）、亞美尼亞（ARM, direct_participant）
- **必須排除**：華盛頓（證據包含"中央社華盛頓8日綜合外電報導"，這是新聞發稿地點，confidence 必須設為 < 0.75）

**關鍵判斷原則**：
- **協議簽署**：只有**簽署協議的國家**才是直接參與方（如"XX國與XX國簽署協議"），斡旋者、見證者、簽署地點都必須排除
- **會晤/會見**：如果證據是"會晤XX國總統期間"、"在XX國協助下"，XX國通常是斡旋者，不是直接參與方，應排除
- **新聞發稿地點**：如果證據包含"XX社XX地報導"、"XX地綜合外電報導"，該地點是新聞發稿地，不是事件相關位置，應排除

只返回 JSON，不要其他文字。`;
    }

    /**
     * 解析 AI 回應並轉換為 GeoTargets 格式
     * @param {string|Object} response - API 響應（字符串或已解析的對象）
     * @param {string} sourceText - 原始新聞文本
     */
    parseExtractionResponse(response, sourceText) {
        let parsed;
        
        // 如果 response 已經是對象，直接使用
        if (typeof response === 'object' && response !== null) {
            parsed = response;
        } else if (typeof response === 'string') {
            // 如果是字符串，需要解析
            try {
                // 嘗試從回應中提取 JSON
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsed = JSON.parse(jsonMatch[0]);
                } else {
                    parsed = JSON.parse(response);
                }
            } catch (error) {
                console.warn('⚠️ [GeoExtractor] JSON 解析失敗，嘗試清理後再解析:', error);
                // 嘗試清理後再解析
                const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                parsed = JSON.parse(cleaned);
            }
        } else {
            throw new Error(`Invalid response type: ${typeof response}`);
        }

        const targets = [];

        // 處理區域
        if (parsed.regions && Array.isArray(parsed.regions)) {
            parsed.regions.forEach((region, index) => {
                const evidenceSpan = region.evidence || '';
                
                // 更嚴格的證據驗證：確保 evidence 實際存在於新聞文本中
                let evidenceStart = -1;
                let evidenceEnd = -1;
                
                if (evidenceSpan && evidenceSpan.trim().length > 0) {
                    // 嘗試精確匹配
                    evidenceStart = sourceText.indexOf(evidenceSpan);
                    
                    // 如果精確匹配失敗，嘗試模糊匹配（去除首尾空白）
                    if (evidenceStart < 0) {
                        const trimmedEvidence = evidenceSpan.trim();
                        evidenceStart = sourceText.indexOf(trimmedEvidence);
                        if (evidenceStart >= 0) {
                            evidenceEnd = evidenceStart + trimmedEvidence.length;
                        }
                    } else {
                        evidenceEnd = evidenceStart + evidenceSpan.length;
                    }
                    
                    // 如果仍然找不到，嘗試部分匹配（至少包含證據的核心部分）
                    if (evidenceStart < 0 && evidenceSpan.length > 10) {
                        const corePart = evidenceSpan.substring(0, Math.min(20, evidenceSpan.length));
                        evidenceStart = sourceText.indexOf(corePart);
                        if (evidenceStart >= 0) {
                            evidenceEnd = evidenceStart + evidenceSpan.length;
                        }
                    }
                }

                // 確定 admin_level
                let adminLevel = 'admin0';
                if (region.gadm_level !== undefined) {
                    adminLevel = `admin${region.gadm_level}`;
                } else if (region.type === 'country') {
                    adminLevel = 'admin0';
                } else if (region.type === 'state') {
                    adminLevel = 'admin1';
                } else if (region.type === 'city') {
                    adminLevel = 'admin2';
                }

                targets.push({
                    id: `region_${Date.now()}_${index}`,
                    type: 'region',
                    name: region.name,
                    confidence: region.confidence || 0.5,
                    evidence_span: evidenceSpan,
                    evidence_start: evidenceStart,
                    evidence_end: evidenceEnd,
                    resolved: {
                        admin_level: adminLevel,
                        iso_code: region.iso_code || null  // 保留 AI 輸出的 ISO 代碼（將由 GeoResolverAgent 驗證）
                    },
                    // 保留原始數據以便後續處理
                    _raw: {
                        iso_code: region.iso_code,
                        gadm_level: region.gadm_level,
                        type: region.type,
                        role: region.role || null  // 語義角色
                    }
                });
            });
        }

        // 處理地點
        if (parsed.places && Array.isArray(parsed.places)) {
            parsed.places.forEach((place, index) => {
                const evidenceSpan = place.evidence || '';
                
                // 更嚴格的證據驗證：確保 evidence 實際存在於新聞文本中
                let evidenceStart = -1;
                let evidenceEnd = -1;
                
                if (evidenceSpan && evidenceSpan.trim().length > 0) {
                    // 嘗試精確匹配
                    evidenceStart = sourceText.indexOf(evidenceSpan);
                    
                    // 如果精確匹配失敗，嘗試模糊匹配（去除首尾空白）
                    if (evidenceStart < 0) {
                        const trimmedEvidence = evidenceSpan.trim();
                        evidenceStart = sourceText.indexOf(trimmedEvidence);
                        if (evidenceStart >= 0) {
                            evidenceEnd = evidenceStart + trimmedEvidence.length;
                        }
                    } else {
                        evidenceEnd = evidenceStart + evidenceSpan.length;
                    }
                    
                    // 如果仍然找不到，嘗試部分匹配（至少包含證據的核心部分）
                    if (evidenceStart < 0 && evidenceSpan.length > 10) {
                        const corePart = evidenceSpan.substring(0, Math.min(20, evidenceSpan.length));
                        evidenceStart = sourceText.indexOf(corePart);
                        if (evidenceStart >= 0) {
                            evidenceEnd = evidenceStart + evidenceSpan.length;
                        }
                    }
                }

                // 處理座標（如果是 [lng, lat] 格式）
                let coordinates = null;
                if (place.coordinates && Array.isArray(place.coordinates) && place.coordinates.length >= 2) {
                    coordinates = place.coordinates; // 假設是 [lng, lat] 格式
                }

                targets.push({
                    id: `place_${Date.now()}_${index}`,
                    type: 'place',
                    name: place.name,
                    confidence: place.confidence || 0.5,
                    evidence_span: evidenceSpan,
                    evidence_start: evidenceStart,
                    evidence_end: evidenceEnd,
                    resolved: {
                        // 座標將由 GeoResolverAgent 驗證和填充
                        coordinates: coordinates,
                        country_code: place.country || null
                    },
                    // 保留原始數據
                    _raw: {
                        coordinates: place.coordinates,
                        country: place.country,
                        role: place.role || null  // 語義角色
                    }
                });
            });
        }

        // 按信心度排序
        targets.sort((a, b) => b.confidence - a.confidence);

        console.log(`✅ [GeoExtractor] 抽取完成：${targets.length} 個候選項目`);
        return targets;
    }

    /**
     * 過濾噪音目標（基於證據文本識別噪音模式）
     * @param {Array} targets - 候選目標列表
     * @param {string} newsText - 原始新聞文本
     * @returns {Array} - 過濾後的目標列表
     */
    filterNoiseTargets(targets, newsText) {
        if (!targets || targets.length === 0) {
            return targets;
        }

        const newsTextLower = newsText.toLowerCase();
        const noisePatterns = [
            // 受訪/消息來源模式（排除協議簽署方）
            /據.*?報道/gi,
            /.*?透露/gi,
            /.*?稱/gi,
            /.*?發言人/gi,
            /.*?在.*?國表示/gi,  // 但排除"XX和XX表示"（協議簽署方）
            /.*?機構在.*?國/gi,
            // 記者/報道模式
            /記者.*?從.*?國/gi,
            /.*?國當地媒體/gi,
            /從.*?國發回/gi,
            /.*?通訊社/gi,
            /本報記者/gi,
            /中央社.*?報導/gi,
            /.*?綜合外電報導/gi,
            /.*?國.*?日.*?報導/gi,
            // 協議簽署地點（但不是簽署方）
            /在.*?國簽署/gi,
            /在.*?國舉行.*?簽署/gi,
            /.*?國見證下/gi,
            /.*?國總統.*?期間/gi,  // 如"會晤XX國總統期間"
            // 斡旋者模式
            /由.*?國斡旋/gi,
            /.*?國協助/gi,
            /.*?國調解/gi,
            /在.*?國協助下/gi,
            /.*?國促成/gi,
            // 背景/比較模式
            /歷史上/gi,
            /曾經/gi,
            /類似於/gi,
            /與.*?相比/gi,
            /鄰近.*?國/gi,
            /與.*?國接壤/gi,
            /.*?國對此表示關注/gi,
            /.*?國可能不滿/gi,
            // 間接引用模式
            /引述/gi,
            /援引/gi,
            /轉述/gi,
            /根據.*?的說法/gi
        ];

        const filtered = targets.filter(target => {
            const evidence = (target.evidence_span || '').toLowerCase();
            const targetName = (target.name || '').toLowerCase();
            const combinedText = (evidence + ' ' + targetName).toLowerCase();
            
            if (!evidence || evidence.trim().length === 0) {
                // 如果沒有證據，根據 confidence 判斷
                // 只有高 confidence 的項目才保留
                return target.confidence >= 0.85;
            }

            // 特殊處理：檢查是否為協議簽署地點（白宮、華盛頓等）
            const signingLocationKeywords = ['白宮', '白宫', 'white house', 'whitehouse', '華盛頓', '华盛顿', 'washington', 'dc', 'd.c.'];
            const isSigningLocation = signingLocationKeywords.some(keyword => 
                targetName.includes(keyword.toLowerCase()) || evidence.includes(keyword.toLowerCase())
            );
            
            if (isSigningLocation) {
                // 檢查證據是否表明這是簽署地點而非事件發生地
                const signingLocationPatterns = [
                    /在.*?簽署/gi,
                    /在.*?舉行.*?簽署/gi,
                    /簽署儀式/gi,
                    /簽署協議/gi,
                    /見證下/gi,
                    /總統期間/gi,
                    /綜合外電報導/gi,
                    /中央社.*?報導/gi,
                    /川普.*?表示/gi,
                    /trump.*?said/gi
                ];
                
                const hasSigningContext = signingLocationPatterns.some(pattern => pattern.test(evidence));
                if (hasSigningContext) {
                    console.log(`🚫 [GeoExtractor] 過濾噪音（簽署地點）：${target.name} (證據: ${evidence.substring(0, 50)}...)`);
                    return false;
                }
            }
            
            // 特殊處理：檢查是否為美國（斡旋者）
            if (targetName.includes('美國') || targetName.includes('美国') || targetName.includes('usa') || targetName.includes('united states')) {
                // 檢查證據是否表明美國是斡旋者而非簽署方
                const mediatorPatterns = [
                    /會晤.*?美國總統/gi,
                    /會晤.*?川普/gi,
                    /美國總統.*?期間/gi,
                    /由美國斡旋/gi,
                    /美國.*?協助/gi,
                    /美國.*?調解/gi,
                    /美國.*?促成/gi,
                    /在.*?協助下/gi,
                    /見證下.*?簽署/gi
                ];
                
                const isMediator = mediatorPatterns.some(pattern => pattern.test(evidence));
                // 檢查是否同時是簽署方
                const isSignatory = /.*?國.*?簽署/gi.test(evidence) && !/會晤.*?美國總統/gi.test(evidence) && !/由美國斡旋/gi.test(evidence);
                
                if (isMediator && !isSignatory) {
                    console.log(`🚫 [GeoExtractor] 過濾噪音（斡旋者）：${target.name} (證據: ${evidence.substring(0, 50)}...)`);
                    return false;
                }
            }

            // 優先檢測：是否為協議簽署方（事件主角）
            // 這個檢測必須在其他過濾之前進行，確保事件主角不會被過濾
            const isSignatoryPattern = /.*?和.*?表示/gi.test(evidence) || 
                                      /.*?與.*?簽署/gi.test(evidence) ||
                                      /.*?和.*?簽署/gi.test(evidence) ||
                                      /.*?雙方.*?簽署/gi.test(evidence) ||
                                      /.*?兩國.*?簽署/gi.test(evidence) ||
                                      /.*?達成.*?協議/gi.test(evidence) ||
                                      /.*?國.*?和.*?國.*?表示/gi.test(evidence) ||
                                      /.*?國.*?與.*?國.*?簽署/gi.test(evidence) ||
                                      // 檢測目標名稱是否在協議簽署相關的上下文中
                                      (evidence.includes('簽署') && (evidence.includes('協議') || evidence.includes('條約'))) ||
                                      (evidence.includes('達成') && evidence.includes('協議'));
            
            // 如果是協議簽署方（事件主角），優先保留，跳過所有噪音過濾
            if (isSignatoryPattern) {
                console.log(`✅ [GeoExtractor] 保留協議簽署方（事件主角）：${target.name} (證據: ${evidence.substring(0, 80)}...)`);
                return true; // 直接返回 true，不進行後續過濾
            }

            // 檢查是否為新聞發稿地點（中央社XX報導等）
            // 但如果是協議簽署方，已經在上面返回了，不會執行到這裡
            const newsSourcePatterns = [
                /中央社.*?報導/gi,
                /.*?綜合外電報導/gi,
                /.*?日.*?報導/gi,
                /.*?國.*?報導/gi
            ];
            
            for (const pattern of newsSourcePatterns) {
                if (pattern.test(evidence)) {
                    console.log(`🚫 [GeoExtractor] 過濾噪音（新聞發稿地點）：${target.name} (證據: ${evidence.substring(0, 50)}...)`);
                    return false;
                }
            }

            // 檢查證據中是否包含噪音模式
            for (const pattern of noisePatterns) {
                if (pattern.test(evidence)) {
                    console.log(`🚫 [GeoExtractor] 過濾噪音：${target.name} (證據包含噪音模式: ${evidence.substring(0, 50)}...)`);
                    return false;
                }
            }
            
            // 特殊處理：檢查是否為斡旋者（會晤XX國總統期間、由XX國斡旋等）
            const mediatorPatterns = [
                /會晤.*?總統期間/gi,
                /會晤.*?國總統/gi,
                /由.*?國斡旋/gi,
                /.*?國協助/gi,
                /.*?國調解/gi,
                /.*?國促成/gi,
                /在.*?國協助下/gi
            ];
            
            for (const pattern of mediatorPatterns) {
                if (pattern.test(evidence)) {
                    // 檢查該國家是否同時是協議簽署方
                    // 如果證據只提到"會晤XX國總統"或"由XX國斡旋"，而不是"XX國與XX國簽署"，則是斡旋者
                    const isSignatory = /.*?國.*?簽署/gi.test(evidence) && 
                                       !/會晤.*?國總統/gi.test(evidence) &&
                                       !/由.*?國斡旋/gi.test(evidence);
                    
                    if (!isSignatory) {
                        console.log(`🚫 [GeoExtractor] 過濾噪音（斡旋者）：${target.name} (證據: ${evidence.substring(0, 50)}...)`);
                        return false;
                    }
                }
            }

            // 檢查證據的上下文（在原文中的位置）
            // 但如果是協議簽署方，已經在上面返回了，不會執行到這裡
            if (target.evidence_start >= 0) {
                // 檢查證據前後的上下文，看是否在引語或間接引用中
                const contextStart = Math.max(0, target.evidence_start - 50);
                const contextEnd = Math.min(newsText.length, target.evidence_end + 50);
                const context = newsTextLower.substring(contextStart, contextEnd);
                
                // 檢查上下文是否包含協議簽署相關內容（如果是，保留）
                const signatoryContextPatterns = [
                    /.*?和.*?表示/gi,
                    /.*?與.*?簽署/gi,
                    /.*?達成.*?協議/gi,
                    /.*?雙方.*?簽署/gi
                ];
                
                const hasSignatoryContext = signatoryContextPatterns.some(pattern => pattern.test(context));
                if (hasSignatoryContext) {
                    console.log(`✅ [GeoExtractor] 保留（上下文包含協議簽署）：${target.name}`);
                    return true; // 如果是協議簽署相關上下文，保留
                }
                
                // 檢查上下文是否包含噪音指示詞
                const contextNoiseIndicators = [
                    '據', '稱', '透露', '報道', '報導', '記者', '發言人',
                    '引述', '援引', '轉述', '類似', '相比', '鄰近', '會晤', '總統期間',
                    '斡旋', '協助', '調解', '促成', '簽署儀式',
                    '中央社', '綜合外電', '白宮', '華盛頓'
                    // 注意：移除了'表示'，因為"XX和XX表示"是協議簽署方的標誌
                ];
                
                for (const indicator of contextNoiseIndicators) {
                    if (context.includes(indicator) && 
                        context.indexOf(indicator) < (target.evidence_start - contextStart + 30)) {
                        // 如果噪音指示詞出現在證據之前，可能是間接引用
                        console.log(`🚫 [GeoExtractor] 過濾噪音（上下文）：${target.name} (上下文包含: ${indicator})`);
                        return false;
                    }
                }
            }

            // 驗證 confidence 是否與證據強度匹配
            // 如果 confidence 很高但證據很弱（很短的片段），可能是錯誤
            if (target.confidence >= 0.85 && evidence.length < 15) {
                console.log(`⚠️ [GeoExtractor] 警告：${target.name} confidence 高但證據片段很短，可能不準確`);
                // 不直接過濾，但記錄警告
            }
            
            // 額外檢查：如果目標名稱是已知的協議簽署地點或新聞機構所在地，且證據支持，則排除
            const knownSigningLocations = ['華盛頓', '华盛顿', 'washington', '白宮', '白宫', 'white house', 'dc'];
            const knownNewsCities = ['華盛頓', 'Washington', '紐約', 'New York', '倫敦', 'London'];
            
            for (const location of knownSigningLocations) {
                if (targetName.includes(location.toLowerCase())) {
                    // 如果證據包含簽署相關內容，則排除
                    if (evidence.includes('簽署') || evidence.includes('舉行') || evidence.includes('報導') || evidence.includes('報導')) {
                        console.log(`🚫 [GeoExtractor] 過濾噪音（已知簽署地點）：${target.name}`);
                        return false;
                    }
                }
            }

            return true;
        });

        const filteredCount = targets.length - filtered.length;
        if (filteredCount > 0) {
            console.log(`✅ [GeoExtractor] 噪音過濾完成：${targets.length} 個項目 → ${filtered.length} 個項目（過濾 ${filteredCount} 個噪音）`);
        }

        return filtered;
    }

    /**
     * 過濾低信心度的候選項目
     */
    filterByConfidence(targets, minConfidence = 0.3) {
        return targets.filter(t => t.confidence >= minConfidence);
    }

    /**
     * 去重區域（基於 ISO 代碼）
     * 如果多個區域有相同的 ISO 代碼，只保留 confidence 最高的
     * @param {Array} targets - 候選目標列表
     * @returns {Array} - 去重後的目標列表
     */
    deduplicateRegions(targets) {
        const regionMap = new Map(); // key: iso_code, value: target with highest confidence
        
        targets.forEach(target => {
            if (target.type === 'region') {
                const isoCode = target.resolved?.iso_code;
                
                // 跳過無效的 ISO 代碼（如 EU, AU 等區域代碼）
                if (!isoCode || isoCode.length !== 3) {
                    console.log(`⚠️ [GeoExtractor] 跳過無效 ISO 代碼: ${target.name} (${isoCode})`);
                    return;
                }
                
                if (isoCode) {
                    const existing = regionMap.get(isoCode);
                    if (!existing || (target.confidence > existing.confidence)) {
                        regionMap.set(isoCode, target);
                    } else {
                        console.log(`🔄 [GeoExtractor] 去重：跳過 ${target.name} (ISO: ${isoCode}, confidence: ${target.confidence} < ${existing.confidence})`);
                    }
                }
            }
        });
        
        // 合併去重後的區域和其他類型的目標
        const deduplicatedRegions = Array.from(regionMap.values());
        const otherTargets = targets.filter(t => t.type !== 'region');
        
        console.log(`✅ [GeoExtractor] 去重完成：${targets.filter(t => t.type === 'region').length} 個區域 → ${deduplicatedRegions.length} 個唯一區域`);
        
        return [...deduplicatedRegions, ...otherTargets];
    }
}

// Export
if (typeof window !== 'undefined') {
    window.GeoExtractorAgent = GeoExtractorAgent;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeoExtractorAgent;
}

