/**
 * Gemini AI Service
 * Handles communication with Google Gemini API for news text analysis
 */

/**
 * Truncate news text to prevent exceeding token limits
 * @param {string} text - The news text to truncate
 * @param {number} maxLength - Maximum length in characters (default: 15000)
 * @returns {string} - Truncated text with ellipsis if needed
 */
function truncateNewsText(text, maxLength = 15000) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    
    // Truncate and add ellipsis
    const truncated = text.substring(0, maxLength);
    return truncated + '\n\n[... 文本过长已截断，仅分析前 ' + maxLength.toLocaleString() + ' 个字符 ...]';
}

/**
 * Build prompt for Gemini API
 */
function buildGeminiPrompt(newsText) {
    // 添加 GADM 数据可用性说明
    const GADM_INFO = `
## 重要提示 - 数据可用性：
- 系统使用 GADM (Global Administrative Areas) 数据作为填色图层的唯一数据源
- GADM 包含所有国家的国家级别（country）和大部分国家的州/省级别（state/administration）数据
- **请直接输出 ISO 3166-1 alpha-3 代码**（如 USA, CHN, TWN, JPN, AZE, ARM 等）
- 对于区域名称（如"南高加索地区"、"中东地区"），请分解为具体的国家并输出各自的 ISO 代码
- 城市级别数据可能不完整，优先使用国家或州/省级别
`;

    // Truncate news text to prevent token limit issues (roughly 10,000 tokens)
    const truncatedText = truncateNewsText(newsText, 15000);
    
    // Log warning if text was truncated
    if (newsText && newsText.length > 15000) {
        console.warn(`⚠️ [Gemini] 新聞文本過長 (${newsText.length.toLocaleString()} 字符)，已截斷至 15,000 字符以節省配額`);
    }
    
    return `${GADM_INFO}

你是一個專業的新聞地圖數據提取助手。請仔細分析新聞文本，提取所有相關的地理資訊。

## 任務要求：

### 1. 標註地區 (Areas) - 需要在地圖上著色顯示的區域
   - 提取所有提到的國家、省份/州、行政區劃
   - **必須輸出 ISO 3166-1 alpha-3 代碼**（如 USA, CHN, TWN, AZE, ARM 等）
   - **gadm_level**: 0 = 國家, 1 = 省/州, 2 = 城市（優先使用 0 或 1）
   - **不要使用區域名稱**（如"南高加索地區"應分解為"亞美尼亞(ARM)"、"亞塞拜然(AZE)"等具體國家）
   - 根據新聞內容的重要性，給出優先級（1-5，1為最重要）
   - 為每個區域建議一個顏色（使用十六進制顏色代碼，如 #FF3B30, #007AFF, #34C759）
   - 說明為什麼這個區域需要標註（reason字段）

### 2. 地點標記 (Locations) - 需要在地圖上添加標記的位置
   - 提取所有具體地點：城市、具體地址、座標
   - 如果文本中提到明確的座標（緯度, 經度），請提取並包含
   - 如果沒有座標，只提供地點名稱，系統會自動查詢
   - 每個地點的優先級（1-5）
   - 地點在新聞中的上下文說明

### 3. 地圖設計建議 (MapDesign) - 可選
   - 分析新聞主題，建議適合的地圖樣式（standard/satellite/dark/light）
   - 建議是否需要特定視角或縮放級別
   - 建議地圖標題或說明文字

## 輸出格式（必須返回有效的 JSON，不要包含任何其他文字）：

{
  "areas": [
    {
      "name": "台灣",
      "iso_code": "TWN",
      "type": "country",
      "gadm_level": 0,
      "priority": 1,
      "suggestedColor": "#007AFF",
      "reason": "新聞主要涉及的區域"
    },
    {
      "name": "台北市",
      "iso_code": "TWN",
      "type": "city",
      "gadm_level": 2,
      "priority": 2,
      "suggestedColor": "#34C759",
      "reason": "事件發生的具體城市"
    }
  ],
  "locations": [
    {
      "name": "台北",
      "type": "city",
      "country": "台灣",
      "coordinates": [121.5654, 25.0330],
      "priority": 1,
      "context": "主要事件發生地，新聞焦點"
    }
  ],
  "mapDesign": {
    "suggestedStyle": "standard",
    "suggestedZoom": 10,
    "suggestedCenter": [121.5654, 25.0330],
    "title": "新聞標題或主題",
    "description": "地圖說明文字"
  }
}

## 注意事項：
- **iso_code 是必填字段**，請為每個地區輸出對應的 ISO 3166-1 alpha-3 代碼
- 座標格式：[經度, 緯度]（注意順序）
- 地區名稱使用標準名稱（如"台灣"而非"ROC"）
- 只提取新聞文本中明確提到的地點
- 優先級1為最重要的地點/區域
- 如果找不到座標，coordinates字段設為null
- 如果無法確定 ISO 代碼，請使用 null，但盡量避免

## 新聞文本：
${truncatedText}

請開始分析並返回JSON結果：`;
}

/**
 * Helper function to extract retry delay from error response
 * @param {Object} errorData - Error response data
 * @returns {number} - Retry delay in seconds
 */
function extractRetryDelay(errorData) {
    try {
        // Try to find RetryInfo in error details
        const retryInfo = errorData.error?.details?.find(d => d['@type']?.includes('RetryInfo'));
        if (retryInfo && retryInfo.retryDelay) {
            // retryDelay is in seconds (e.g., "12s", "12.45s", or just 12)
            let delayStr = String(retryInfo.retryDelay).replace('s', '').trim();
            const delay = parseFloat(delayStr);
            if (!isNaN(delay) && delay > 0) {
                return Math.min(delay * 1000, 60000); // Convert to milliseconds, max 60 seconds
            }
        }
        
        // Fallback: check error message for retry delay
        const errorMessage = errorData.error?.message || '';
        const retryMatch = errorMessage.match(/retry in ([\d.]+)s/i);
        if (retryMatch && retryMatch[1]) {
            const delay = parseFloat(retryMatch[1]);
            if (!isNaN(delay) && delay > 0) {
                return Math.min(delay * 1000, 60000);
            }
        }
    } catch (e) {
        console.warn('⚠️ [Gemini] Error extracting retry delay:', e);
    }
    return 2000; // Default 2 seconds if extraction fails
}

/**
 * Call Gemini API with retry logic for 429 errors
 * @param {string} newsText - The news article text to analyze
 * @param {number} maxRetries - Maximum number of retries (default: 2)
 * @param {number} retryAttempt - Current retry attempt (internal use)
 * @param {Function} onRetry - Optional callback for retry notifications (retryAttempt, delay)
 * @returns {Promise<Object>} - Extracted location data
 */
async function analyzeNewsWithGemini(newsText, maxRetries = 2, retryAttempt = 0, onRetry = null) {
    // 檢查緩存（如果可用）
    if (typeof window !== 'undefined' && window.geminiCache) {
        const cached = window.geminiCache.get(newsText);
        if (cached) {
            return cached;
        }

        // 檢查是否有正在進行的相同請求
        if (window.geminiCache.isPending(newsText)) {
            console.log('⏳ [Gemini] 檢測到重複請求，等待現有請求完成...');
            const pendingResult = await window.geminiCache.waitForPending(newsText);
            if (pendingResult) {
                return pendingResult;
            }
        }

        // 標記為進行中
        window.geminiCache.markPending(newsText);
        
        // 等待請求間隔
        await window.geminiCache.waitIfNeeded();
    }
    // Check if Gemini is enabled (with fallback)
    const config = (typeof window !== 'undefined' && window.CONFIG) || {};
    const geminiConfig = config.GEMINI || {};
    
    // Default to enabled if CONFIG is not available (use backend proxy)
    const isEnabled = geminiConfig.ENABLED !== false;
    
    if (!isEnabled) {
        throw new Error('Gemini API is not enabled. Please set CONFIG.GEMINI.ENABLED = true');
    }

    const prompt = buildGeminiPrompt(newsText);
    const timeout = geminiConfig.TIMEOUT || 30000;
    
    // Check if using backend proxy (production) or direct API (development)
    // Default to true (use backend proxy) if CONFIG not available
    const useBackendProxy = geminiConfig.USE_BACKEND_PROXY !== false; 
    let proxyEndpoint = geminiConfig.PROXY_ENDPOINT || '/api/gemini/generateContent';

    let url, headers;

    if (useBackendProxy) {
        // Use backend proxy (production mode - API key is on server)
        // If proxyEndpoint is a relative path, convert to absolute URL pointing to port 8000
        if (proxyEndpoint.startsWith('/')) {
            // Check if we're running on a different port (e.g., VS Code Live Server on 5500)
            const currentPort = window.location.port;
            if (currentPort && currentPort !== '8000') {
                // Use absolute URL to point to our Node.js server on port 8000
                proxyEndpoint = `http://localhost:8000${proxyEndpoint}`;
                console.log(`⚠️  Detected different port (${currentPort}), using absolute URL: ${proxyEndpoint}`);
            }
        }
        url = proxyEndpoint;
        headers = {
            'Content-Type': 'application/json'
        };
        console.log(`🤖 Calling Gemini API via backend proxy: ${url}`);
    } else {
        // Direct API call (development mode - API key in config)
        const apiKey = geminiConfig.API_KEY;
        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            throw new Error('Gemini API key is not set. Please add your API key in config.js (CONFIG.GEMINI.API_KEY) or use backend proxy');
        }

        // FORCE use gemini-2.0-flash - ignore config if it's using old model
        let model = 'gemini-2.0-flash'; // Always use latest model
        const configModel = geminiConfig.MODEL || null;
        
        // Warn if config has wrong model
        if (configModel && (configModel === 'gemini-pro' || configModel.includes('gemini-pro'))) {
            console.error(`❌ ERROR: Config has deprecated model "${configModel}". Using "gemini-2.0-flash" instead.`);
            console.warn(`⚠️ Please update config.js: MODEL: 'gemini-2.0-flash'`);
        }
        
        // Use v1beta endpoint for latest models
        const baseUrl = 'https://generativelanguage.googleapis.com/v1beta'; // Force use v1beta
        url = `${baseUrl}/models/${model}:generateContent`;
        headers = {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
        };
        console.log(`🤖 Calling Gemini API directly with model: ${model}`);
        console.log(`📡 API URL: ${baseUrl}/models/${model}:generateContent (using X-goog-api-key header)`);
    }

    try {
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
            
            // 處理 429 錯誤（配額限制）- 自動重試
            if (response.status === 429) {
                const retryDelay = extractRetryDelay(errorData);
                
                // 計算指數退避延遲（第 1 次重試：1x，第 2 次：2x，等等）
                const backoffMultiplier = Math.pow(2, retryAttempt);
                const actualDelay = retryDelay * backoffMultiplier;
                
                if (retryAttempt < maxRetries) {
                    const delaySeconds = (actualDelay / 1000).toFixed(1);
                    console.warn(`⚠️ [Gemini] API 配額限制 (429)，${delaySeconds} 秒後自動重試 (${retryAttempt + 1}/${maxRetries})...`);
                    console.warn(`💡 [Gemini] 提示：相同內容會使用緩存，避免重複請求可節省配額`);
                    
                    // 通知重试（如果提供了回调）
                    if (onRetry && typeof onRetry === 'function') {
                        try {
                            onRetry(retryAttempt + 1, delaySeconds, maxRetries);
                        } catch (e) {
                            console.warn('Retry callback error:', e);
                        }
                    }
                    
                    // 等待後重試（保持 pending 狀態，不標記為失敗）
                    await new Promise(resolve => setTimeout(resolve, actualDelay));
                    
                    // 遞歸重試（保持 pending 狀態）
                    return analyzeNewsWithGemini(newsText, maxRetries, retryAttempt + 1, onRetry);
                } else {
                    // 重試次數已達上限 - 移除進行中標記
                    if (typeof window !== 'undefined' && window.geminiCache) {
                        window.geminiCache.unmarkPending(newsText);
                    }
                    const waitSeconds = Math.max(1, Math.round(retryDelay / 1000));
                    const errorMsg = `Gemini API 配額限制，已重試 ${maxRetries} 次。請稍候再試（建議等待 ${waitSeconds} 秒）`;
                    console.error(`❌ [Gemini] ${errorMsg}`);
                    throw new Error(errorMsg);
                }
            }
            
            // 非 429 錯誤：移除進行中標記並拋出錯誤
            if (typeof window !== 'undefined' && window.geminiCache) {
                window.geminiCache.unmarkPending(newsText);
            }
            
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log('✅ Gemini API response received');

        // Extract text from response
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) {
            throw new Error('No content in Gemini API response');
        }

        // Parse JSON from response text
        // Remove markdown code blocks if present
        let jsonText = responseText.trim();
        jsonText = jsonText.replace(/^```json\n?/i, '').replace(/\n?```$/i, '');
        jsonText = jsonText.replace(/^```\n?/i, '').replace(/\n?```$/i, '');

        const result = JSON.parse(jsonText);
        
        // 保存到緩存（如果可用）
        if (typeof window !== 'undefined' && window.geminiCache) {
            window.geminiCache.set(newsText, result);
            window.geminiCache.unmarkPending(newsText);
        }
        
        return result;

    } catch (error) {
        // 移除進行中標記（如果可用）
        if (typeof window !== 'undefined' && window.geminiCache) {
            window.geminiCache.unmarkPending(newsText);
        }
        
        if (error.name === 'AbortError') {
            throw new Error('Gemini API request timed out');
        }
        if (error instanceof SyntaxError) {
            console.error('Failed to parse Gemini response as JSON:', error);
            throw new Error('Failed to parse AI response. Please try again.');
        }
        throw error;
    }
}

// Export for use in other files - 立即執行，確保在任何情況下都導出
// 注意：這個導出必須在文件的最後，且不依賴任何外部變量
(function() {
    'use strict';
    if (typeof window !== 'undefined') {
        // 直接導出函數（不依賴任何外部變量，不檢查 CONFIG）
        try {
            window.analyzeNewsWithGemini = analyzeNewsWithGemini;
            window.geminiService = {
                analyzeNewsWithGemini: analyzeNewsWithGemini,
                buildPrompt: buildGeminiPrompt
            };
            console.log('✅ geminiService 已載入', {
                analyzeNewsWithGemini: typeof window.analyzeNewsWithGemini,
                geminiService: typeof window.geminiService,
                hasCONFIG: typeof window.CONFIG !== 'undefined'
            });
        } catch (error) {
            console.error('❌ geminiService 導出失敗:', error);
            // 強制導出（即使出錯）
            try {
                if (typeof analyzeNewsWithGemini === 'function') {
                    window.analyzeNewsWithGemini = analyzeNewsWithGemini;
                }
                if (typeof buildGeminiPrompt === 'function') {
                    window.geminiService = {
                        analyzeNewsWithGemini: analyzeNewsWithGemini,
                        buildPrompt: buildGeminiPrompt
                    };
                }
            } catch (e) {
                console.error('❌ 強制導出也失敗:', e);
            }
        }
    } else {
        console.warn('⚠️ window 對象不可用，無法導出 geminiService');
    }
})();

