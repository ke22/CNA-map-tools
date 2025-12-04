/**
 * Gemini AI Service
 * Handles communication with Google Gemini API for news text analysis
 */

/**
 * Build prompt for Gemini API
 */
function buildGeminiPrompt(newsText) {
    return `你是一个地理数据提取助手。分析新闻文本并提取：

1. 提到的地点（国家、城市、地区）
2. 如果提到明确的坐标，提取坐标（格式：纬度, 经度）
3. 每个地点的重要性（优先级 1-5，1 最重要）
4. 地点类型（country/city/region）

返回 JSON 格式（只返回 JSON，不要其他文字）：
{
  "locations": [
    {
      "name": "台北",
      "type": "city",
      "country": "台湾",
      "coordinates": [121.5654, 25.0330],
      "priority": 1,
      "context": "主要事件发生地"
    }
  ],
  "areas": [
    {
      "name": "台湾",
      "type": "country",
      "priority": 1,
      "suggestedColor": "#007AFF"
    }
  ]
}

新闻文本：
${newsText}`;
}

/**
 * Call Gemini API to analyze news text
 * @param {string} newsText - The news article text to analyze
 * @returns {Promise<Object>} - Extracted location data
 */
async function analyzeNewsWithGemini(newsText) {
    // Check if Gemini is enabled
    if (!CONFIG || !CONFIG.GEMINI || !CONFIG.GEMINI.ENABLED) {
        throw new Error('Gemini API is not enabled. Please set CONFIG.GEMINI.ENABLED = true and add your API key in config.js');
    }

    const apiKey = CONFIG.GEMINI.API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
        throw new Error('Gemini API key is not set. Please add your API key in config.js (CONFIG.GEMINI.API_KEY)');
    }

    const model = CONFIG.GEMINI.MODEL || 'gemini-pro';
    const baseUrl = CONFIG.GEMINI.BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
    const timeout = CONFIG.GEMINI.TIMEOUT || 30000;

    const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
    const prompt = buildGeminiPrompt(newsText);

    console.log('🤖 Calling Gemini API...');

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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

