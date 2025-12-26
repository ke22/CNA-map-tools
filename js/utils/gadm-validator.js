/**
 * GADM Validator
 * 
 * 驗證 ISO 代碼是否存在於實際 GADM 數據中
 * 提供候選建議（如果代碼不存在）
 */

class GADMValidator {
    constructor() {
        this.cache = new Map(); // 緩存驗證結果
        this.availableCodes = {
            admin0: new Set(), // 國家級別 ISO 代碼
            admin1: new Set(), // 省/州級別（使用 GID_1 格式）
            admin2: new Set()  // 城市級別（使用 GID_2 格式）
        };
        this.initialized = false;
    }

    /**
     * 初始化：從已加載的 GADM 源中提取可用的 ISO 代碼
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            // 檢查地圖是否已初始化
            if (typeof appState === 'undefined' || !appState.map) {
                console.warn('⚠️ [GADMValidator] appState.map 未初始化，無法驗證');
                return;
            }

            // 提取國家級別代碼
            await this.extractAdmin0Codes();
            
            // 注意：admin1 和 admin2 的提取可能需要完整加載數據
            // 這裡先實現 admin0，其他級別可以根據需要擴展
            
            this.initialized = true;
            console.log(`✅ [GADMValidator] 初始化完成，找到 ${this.availableCodes.admin0.size} 個國家代碼`);
        } catch (error) {
            console.error('❌ [GADMValidator] 初始化失敗:', error);
        }
    }

    /**
     * 從 GADM 源中提取國家級別的 ISO 代碼
     */
    async extractAdmin0Codes() {
        try {
            const source = appState.map.getSource('gadm-country');
            if (!source) {
                console.warn('⚠️ [GADMValidator] gadm-country 源未加載，無法提取代碼');
                return;
            }

            const geoJson = source._data || source._geojson;
            if (!geoJson || !geoJson.features) {
                console.warn('⚠️ [GADMValidator] GADM 數據不可用');
                return;
            }

            // 提取所有 GID_0（ISO 3166-1 alpha-3 代碼）
            const codes = new Set();
            for (const feature of geoJson.features) {
                const gid0 = feature.properties?.GID_0;
                if (gid0 && typeof gid0 === 'string' && gid0.length === 3) {
                    codes.add(gid0.toUpperCase());
                }
            }

            this.availableCodes.admin0 = codes;
            console.log(`✅ [GADMValidator] 提取了 ${codes.size} 個國家代碼`);
        } catch (error) {
            console.error('❌ [GADMValidator] 提取國家代碼失敗:', error);
        }
    }

    /**
     * 驗證 ISO 代碼是否存在於 GADM 數據中
     * @param {string} isoCode - ISO 3166-1 alpha-3 代碼
     * @param {string|number} adminLevel - 管理級別 ('admin0'|'admin1'|'admin2' 或 0|1|2)
     * @returns {Promise<{valid: boolean, suggestion?: string, similar?: string[]}>}
     */
    async validateGADMCode(isoCode, adminLevel = 'admin0') {
        // 確保已初始化
        if (!this.initialized) {
            await this.initialize();
        }

        // 標準化輸入
        const normalizedCode = isoCode ? isoCode.toUpperCase().trim() : '';
        const normalizedLevel = typeof adminLevel === 'number' 
            ? `admin${adminLevel}` 
            : adminLevel;

        // 特殊處理：EU 是區域代碼（2個字母），不是標準 ISO 3166-1 alpha-3
        if (normalizedCode === 'EU') {
            return {
                valid: false,
                suggestion: `"EU" 是區域代碼，不是單一國家。請分解為具體國家（如 FRA, DEU, ITA 等）或跳過此區域`
            };
        }

        if (!normalizedCode || normalizedCode.length !== 3) {
            return {
                valid: false,
                suggestion: `ISO 代碼格式無效: "${isoCode}"。應為 3 個字母（如 TWN, USA, CHN）`
            };
        }

        // 檢查緩存
        const cacheKey = `${normalizedCode}_${normalizedLevel}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let result;

        if (normalizedLevel === 'admin0') {
            // 驗證國家級別
            const isValid = this.availableCodes.admin0.has(normalizedCode);
            
            if (isValid) {
                result = { valid: true };
            } else {
                // 查找相似的代碼
                const similar = this.findSimilarCodes(normalizedCode);
                result = {
                    valid: false,
                    suggestion: `ISO 代碼 "${normalizedCode}" 不存在於 GADM 數據中`,
                    similar: similar
                };
                
                if (similar.length > 0) {
                    result.suggestion += `。建議使用: ${similar.join(', ')}`;
                }
            }
        } else {
            // admin1 和 admin2 的驗證需要更複雜的邏輯
            // 目前先標記為未驗證
            result = {
                valid: true, // 暫時假設有效，後續可以增強
                note: `admin1/admin2 驗證尚未實現`
            };
        }

        // 緩存結果
        this.cache.set(cacheKey, result);
        return result;
    }

    /**
     * 查找相似的 ISO 代碼（用於建議）
     * @param {string} isoCode - 輸入的代碼
     * @param {number} maxResults - 最多返回的結果數
     * @returns {string[]} - 相似的代碼列表
     */
    findSimilarCodes(isoCode, maxResults = 3) {
        const normalized = isoCode.toUpperCase();
        const candidates = [];

        // 計算編輯距離
        for (const code of this.availableCodes.admin0) {
            const distance = this.levenshteinDistance(normalized, code);
            if (distance <= 2) { // 編輯距離小於等於 2
                candidates.push({ code, distance });
            }
        }

        // 按距離排序並返回前 N 個
        return candidates
            .sort((a, b) => a.distance - b.distance)
            .slice(0, maxResults)
            .map(item => item.code);
    }

    /**
     * 計算兩個字符串的 Levenshtein 距離
     * @param {string} str1
     * @param {string} str2
     * @returns {number}
     */
    levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.min(
                        dp[i - 1][j] + 1,     // deletion
                        dp[i][j - 1] + 1,     // insertion
                        dp[i - 1][j - 1] + 1  // substitution
                    );
                }
            }
        }

        return dp[m][n];
    }

    /**
     * 獲取所有可用的 ISO 代碼（用於調試）
     * @param {string} adminLevel - 管理級別
     * @returns {string[]}
     */
    getAvailableCodes(adminLevel = 'admin0') {
        if (!this.initialized) {
            console.warn('⚠️ [GADMValidator] 尚未初始化，無法獲取代碼列表');
            return [];
        }

        const level = typeof adminLevel === 'number' 
            ? `admin${adminLevel}` 
            : adminLevel;

        return Array.from(this.availableCodes[level] || []);
    }

    /**
     * 清除緩存
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * 重新初始化（當 GADM 數據重新加載時調用）
     */
    async reinitialize() {
        this.initialized = false;
        this.clearCache();
        await this.initialize();
    }
}

// Export singleton instance
let validatorInstance = null;

function getGADMValidator() {
    if (!validatorInstance) {
        validatorInstance = new GADMValidator();
        // 預初始化（異步，不阻塞）
        validatorInstance.initialize().catch(err => {
            console.warn('⚠️ [GADMValidator] 預初始化失敗，將在使用時重試:', err);
        });
    }
    return validatorInstance;
}

if (typeof window !== 'undefined') {
    window.GADMValidator = GADMValidator;
    window.getGADMValidator = getGADMValidator;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GADMValidator, getGADMValidator };
}

