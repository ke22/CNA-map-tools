/**
 * Validation Agent
 * 
 * 格式驗證 Agent：驗證 JSON/GeoJSON 格式，並提供自檢機制
 */

class ValidationAgent {
    constructor() {
        // 驗證錯誤統計
        this.stats = {
            jsonErrors: 0,
            geojsonErrors: 0,
            autoFixed: 0
        };
    }

    /**
     * 驗證 JSON 字符串
     * @param {string} jsonString - JSON 字符串
     * @returns {Object} - {valid: boolean, parsed?: any, error?: string, autoFixed?: string}
     */
    validateJSON(jsonString) {
        if (!jsonString || typeof jsonString !== 'string') {
            return {
                valid: false,
                error: '輸入不是字符串'
            };
        }

        try {
            // 嘗試直接解析
            const parsed = JSON.parse(jsonString);
            return {
                valid: true,
                parsed: parsed
            };
        } catch (error) {
            // 嘗試自動修復常見錯誤
            const fixed = this.autoFixCommonErrors(jsonString);
            if (fixed && fixed !== jsonString) {
                try {
                    const parsed = JSON.parse(fixed);
                    this.stats.autoFixed++;
                    this.stats.jsonErrors++;
                    return {
                        valid: true,
                        parsed: parsed,
                        autoFixed: fixed,
                        originalError: error.message
                    };
                } catch (fixError) {
                    // 修復後仍然失敗
                    this.stats.jsonErrors++;
                    return {
                        valid: false,
                        error: `JSON 解析失敗: ${error.message}。自動修復也失敗: ${fixError.message}`
                    };
                }
            }

            this.stats.jsonErrors++;
            return {
                valid: false,
                error: `JSON 解析失敗: ${error.message}`
            };
        }
    }

    /**
     * 自動修復常見的 JSON 錯誤
     * @param {string} jsonString - 原始 JSON 字符串
     * @returns {string} - 修復後的 JSON 字符串
     */
    autoFixCommonErrors(jsonString) {
        let fixed = jsonString.trim();

        // 移除可能的 Markdown 代碼塊標記
        fixed = fixed.replace(/^```json\s*/i, '');
        fixed = fixed.replace(/^```\s*/i, '');
        fixed = fixed.replace(/\s*```$/i, '');

        // 移除開頭和結尾的多餘文字（通常是 AI 的回應說明）
        // 查找第一個 { 或 [
        const firstBrace = fixed.indexOf('{');
        const firstBracket = fixed.indexOf('[');
        
        if (firstBrace >= 0 || firstBracket >= 0) {
            const startIndex = firstBrace >= 0 && firstBracket >= 0
                ? Math.min(firstBrace, firstBracket)
                : firstBrace >= 0 ? firstBrace : firstBracket;
            
            if (startIndex > 0) {
                fixed = fixed.substring(startIndex);
            }
        }

        // 查找最後一個 } 或 ]
        const lastBrace = fixed.lastIndexOf('}');
        const lastBracket = fixed.lastIndexOf(']');
        
        if (lastBrace >= 0 || lastBracket >= 0) {
            const endIndex = lastBrace >= 0 && lastBracket >= 0
                ? Math.max(lastBrace, lastBracket)
                : lastBrace >= 0 ? lastBrace : lastBracket;
            
            if (endIndex >= 0 && endIndex < fixed.length - 1) {
                fixed = fixed.substring(0, endIndex + 1);
            }
        }

        // 修復常見的語法錯誤
        // 1. 修復尾隨逗號
        fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
        
        // 2. 修復單引號（如果有）
        // 注意：這可能不安全，但對於 AI 輸出通常是安全的
        fixed = fixed.replace(/'/g, '"');

        // 3. 修復未轉義的換行符（在字符串值中）
        // 這個比較複雜，先跳過

        return fixed;
    }

    /**
     * 驗證 GeoJSON 格式
     * @param {Object|string} geoJson - GeoJSON 對象或字符串
     * @returns {Object} - {valid: boolean, geoJson?: Object, error?: string}
     */
    validateGeoJSON(geoJson) {
        // 如果是字符串，先解析
        let parsed;
        if (typeof geoJson === 'string') {
            const jsonValidation = this.validateJSON(geoJson);
            if (!jsonValidation.valid) {
                return {
                    valid: false,
                    error: `JSON 格式錯誤: ${jsonValidation.error}`
                };
            }
            parsed = jsonValidation.parsed;
        } else {
            parsed = geoJson;
        }

        // 驗證 GeoJSON 結構
        if (!parsed || typeof parsed !== 'object') {
            this.stats.geojsonErrors++;
            return {
                valid: false,
                error: 'GeoJSON 必須是對象'
            };
        }

        // 檢查必需的類型字段
        if (!parsed.type) {
            this.stats.geojsonErrors++;
            return {
                valid: false,
                error: 'GeoJSON 缺少必需的 "type" 字段'
            };
        }

        const validTypes = ['FeatureCollection', 'Feature', 'Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'];
        if (!validTypes.includes(parsed.type)) {
            this.stats.geojsonErrors++;
            return {
                valid: false,
                error: `無效的 GeoJSON 類型: "${parsed.type}"。有效類型: ${validTypes.join(', ')}`
            };
        }

        // 根據類型驗證結構
        if (parsed.type === 'FeatureCollection') {
            if (!Array.isArray(parsed.features)) {
                this.stats.geojsonErrors++;
                return {
                    valid: false,
                    error: 'FeatureCollection 必須包含 "features" 數組'
                };
            }
        } else if (parsed.type === 'Feature') {
            if (!parsed.geometry || !parsed.geometry.type) {
                this.stats.geojsonErrors++;
                return {
                    valid: false,
                    error: 'Feature 必須包含 "geometry" 對象'
                };
            }
        } else {
            // Geometry 類型必須有 coordinates
            if (!parsed.coordinates) {
                this.stats.geojsonErrors++;
                return {
                    valid: false,
                    error: `Geometry 類型 "${parsed.type}" 必須包含 "coordinates" 字段`
                };
            }
        }

        return {
            valid: true,
            geoJson: parsed
        };
    }

    /**
     * 驗證 GeoTargets 數據結構
     * @param {Object} geoTargets - GeoTargets 對象
     * @returns {Object} - {valid: boolean, errors?: string[]}
     */
    validateGeoTargets(geoTargets) {
        const errors = [];

        if (!geoTargets || typeof geoTargets !== 'object') {
            return {
                valid: false,
                errors: ['GeoTargets 必須是對象']
            };
        }

        // 檢查必需的字段
        if (!geoTargets.candidates || !Array.isArray(geoTargets.candidates)) {
            errors.push('GeoTargets 必須包含 "candidates" 數組');
        } else {
            // 驗證每個候選項
            geoTargets.candidates.forEach((target, index) => {
                if (!target.id) {
                    errors.push(`候選項 ${index} 缺少 "id" 字段`);
                }
                if (!target.name) {
                    errors.push(`候選項 ${index} 缺少 "name" 字段`);
                }
                if (!target.type || !['region', 'place'].includes(target.type)) {
                    errors.push(`候選項 ${index} 的 "type" 必須是 "region" 或 "place"`);
                }
                if (typeof target.confidence !== 'number' || target.confidence < 0 || target.confidence > 1) {
                    errors.push(`候選項 ${index} 的 "confidence" 必須是 0 到 1 之間的數字`);
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    /**
     * 驗證 AI 提取結果（舊格式兼容）
     * @param {Object} aiResult - AI 提取結果
     * @returns {Object} - {valid: boolean, errors?: string[]}
     */
    validateAIResults(aiResult) {
        const errors = [];

        if (!aiResult || typeof aiResult !== 'object') {
            return {
                valid: false,
                errors: ['AI 結果必須是對象']
            };
        }

        // 驗證 areas
        if (aiResult.areas && Array.isArray(aiResult.areas)) {
            aiResult.areas.forEach((area, index) => {
                if (!area.name) {
                    errors.push(`區域 ${index} 缺少 "name" 字段`);
                }
                if (area.type && !['country', 'state', 'city'].includes(area.type)) {
                    errors.push(`區域 ${index} 的 "type" 必須是 "country"、"state" 或 "city"`);
                }
            });
        }

        // 驗證 locations
        if (aiResult.locations && Array.isArray(aiResult.locations)) {
            aiResult.locations.forEach((location, index) => {
                if (!location.name) {
                    errors.push(`地點 ${index} 缺少 "name" 字段`);
                }
                if (location.coordinates && Array.isArray(location.coordinates)) {
                    if (location.coordinates.length < 2) {
                        errors.push(`地點 ${index} 的 "coordinates" 必須至少包含 2 個元素`);
                    }
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    /**
     * 獲取驗證統計信息
     * @returns {Object}
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * 重置統計信息
     */
    resetStats() {
        this.stats = {
            jsonErrors: 0,
            geojsonErrors: 0,
            autoFixed: 0
        };
    }
}

// Export
if (typeof window !== 'undefined') {
    window.ValidationAgent = ValidationAgent;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationAgent;
}

