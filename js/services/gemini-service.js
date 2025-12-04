/**
 * Gemini AI Service
 * Handles communication with Google Gemini API for news text analysis
 */

/**
 * Build prompt for Gemini API
 */
function buildGeminiPrompt(newsText) {
    return `你是一个专业的新闻地图数据提取助手。请仔细分析新闻文本，提取所有相关的地理信息。

## 任务要求：

### 1. 标注地区 (Areas) - 需要在地图上着色显示的区域
   - 提取所有提到的国家、省份/州、行政区划
   - 根据新闻内容的重要性，给出优先级（1-5，1为最重要）
   - 为每个区域建议一个颜色（使用十六进制颜色代码，如 #FF3B30, #007AFF, #34C759）
   - 说明为什么这个区域需要标注（reason字段）

### 2. 地点标记 (Locations) - 需要在地图上添加标记的位置
   - 提取所有具体地点：城市、具体地址、坐标
   - 如果文本中提到明确的坐标（纬度, 经度），请提取并包含
   - 如果没有坐标，只提供地点名称，系统会自动查询
   - 每个地点的优先级（1-5）
   - 地点在新闻中的上下文说明

### 3. 地图设计建议 (MapDesign) - 可选
   - 分析新闻主题，建议适合的地图样式（standard/satellite/dark/light）
   - 建议是否需要特定视角或缩放级别
   - 建议地图标题或说明文字

## 输出格式（必须返回有效的 JSON，不要包含任何其他文字）：

{
  "areas": [
    {
      "name": "台湾",
      "type": "country",
      "priority": 1,
      "suggestedColor": "#007AFF",
      "reason": "新闻主要涉及的区域"
    },
    {
      "name": "台北市",
      "type": "city",
      "priority": 2,
      "suggestedColor": "#34C759",
      "reason": "事件发生的具体城市"
    }
  ],
  "locations": [
    {
      "name": "台北",
      "type": "city",
      "country": "台湾",
      "coordinates": [121.5654, 25.0330],
      "priority": 1,
      "context": "主要事件发生地，新闻焦点"
    }
  ],
  "mapDesign": {
    "suggestedStyle": "standard",
    "suggestedZoom": 10,
    "suggestedCenter": [121.5654, 25.0330],
    "title": "新闻标题或主题",
    "description": "地图说明文字"
  }
}

## 注意事项：
- 坐标格式：[经度, 纬度]（注意顺序）
- 地区名称使用标准名称（如"台湾"而非"ROC"）
- 只提取新闻文本中明确提到的地点
- 优先级1为最重要的地点/区域
- 如果找不到坐标，coordinates字段设为null

## 新闻文本：
${newsText}

请开始分析并返回JSON结果：`;
}

/**
 * Call Gemini API to analyze news text
 * @param {string} newsText - The news article text to analyze
 * @returns {Promise<Object>} - Extracted location data
 */
async function analyzeNewsWithGemini(newsText) {
    // Check if Gemini is enabled
    if (!CONFIG || !CONFIG.GEMINI || !CONFIG.GEMINI.ENABLED) {
        throw new Error('Gemini API is not enabled. Please set CONFIG.GEMINI.ENABLED = true');
    }

    const prompt = buildGeminiPrompt(newsText);
    const timeout = CONFIG.GEMINI.TIMEOUT || 30000;
    
    // Check if using backend proxy (production) or direct API (development)
    const useBackendProxy = CONFIG.GEMINI.USE_BACKEND_PROXY !== false; // Default to true
    const proxyEndpoint = CONFIG.GEMINI.PROXY_ENDPOINT || '/api/gemini/generateContent';

    let url, headers;

    if (useBackendProxy) {
        // Use backend proxy (production mode - API key is on server)
        url = proxyEndpoint;
        headers = {
            'Content-Type': 'application/json'
        };
        console.log(`🤖 Calling Gemini API via backend proxy: ${url}`);
    } else {
        // Direct API call (development mode - API key in config)
        const apiKey = CONFIG.GEMINI.API_KEY;
        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            throw new Error('Gemini API key is not set. Please add your API key in config.js (CONFIG.GEMINI.API_KEY) or use backend proxy');
        }

        // FORCE use gemini-2.0-flash - ignore config if it's using old model
        let model = 'gemini-2.0-flash'; // Always use latest model
        const configModel = CONFIG.GEMINI.MODEL;
        
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
        return result;

    } catch (error) {
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

// Export for use in other files
if (typeof window !== 'undefined') {
    window.analyzeNewsWithGemini = analyzeNewsWithGemini;
}

