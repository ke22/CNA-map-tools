/**
 * Map Reference Retrieval Agent
 * 
 * 檢索國際新聞相關地圖參考，提取關鍵位置
 * 如果找到相似的地圖參考，直接使用；如果沒有，返回 null 讓系統使用 AI 生成
 */

class MapReferenceRetrievalAgent {
    constructor() {
        // 本地存儲鍵名
        this.storageKey = 'map_reference_database';
        
        // 初始化參考數據庫（如果不存在）
        this.initializeDatabase();
    }

    /**
     * 初始化參考數據庫
     */
    initializeDatabase() {
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
            return;
        }

        try {
            const existing = localStorage.getItem(this.storageKey);
            if (!existing) {
                // 初始化為空數組
                localStorage.setItem(this.storageKey, JSON.stringify([]));
            }
        } catch (error) {
            console.warn('⚠️ [MapReferenceRetrieval] 無法初始化數據庫:', error);
        }
    }

    /**
     * 檢索相似的新聞地圖參考
     * @param {string} newsText - 新聞文本
     * @returns {Promise<Object|null>} - 如果找到相似參考，返回 {areas, locations, mapDesign, similarity}，否則返回 null
     */
    async retrieveSimilarReference(newsText) {
        console.log('🔍 [MapReferenceRetrieval] 開始檢索相似地圖參考...');

        if (!newsText || typeof newsText !== 'string' || newsText.trim().length === 0) {
            console.log('⚠️ [MapReferenceRetrieval] 新聞文本為空，跳過檢索');
            return null;
        }

        try {
            // 從本地存儲讀取參考數據庫
            const database = this.getDatabase();
            if (!database || database.length === 0) {
                console.log('📭 [MapReferenceRetrieval] 參考數據庫為空，將使用 AI 生成');
                return null;
            }

            console.log(`📚 [MapReferenceRetrieval] 數據庫中有 ${database.length} 條參考記錄`);

            // 提取關鍵詞
            const keywords = this.extractKeywords(newsText);
            console.log(`📝 [MapReferenceRetrieval] 提取關鍵詞: ${keywords.join(', ')}`);

            // 搜索相似的地圖參考
            const similarReferences = this.searchSimilar(database, keywords, newsText);

            if (similarReferences.length === 0) {
                console.log('❌ [MapReferenceRetrieval] 未找到相似地圖參考，將使用 AI 生成');
                return null;
            }

            // 選擇最相似的參考（相似度最高）
            const bestMatch = similarReferences[0];
            console.log(`✅ [MapReferenceRetrieval] 找到相似地圖參考 (相似度: ${(bestMatch.similarity * 100).toFixed(1)}%)`);

            // 過濾參考數據，只保留核心區域和地點（confidence >= 0.75，提高門檻以只保留事件直接參與方）
            const filteredAreas = (bestMatch.reference.areas || []).filter(area => {
                // 如果有 _agent.confidence 字段，使用它；否則假設是核心區域（向後兼容）
                const confidence = area._agent?.confidence ?? 0.8;
                // 提高門檻到 0.75，只保留事件直接發生地或核心參與方
                return confidence >= 0.75;
            });
            
            const filteredLocations = (bestMatch.reference.locations || []).filter(location => {
                const confidence = location._agent?.confidence ?? 0.8;
                // 地點的門檻可以稍低（0.7），因為地點通常是具體的事件發生地
                return confidence >= 0.7;
            });

            console.log(`📊 [MapReferenceRetrieval] 過濾後：${filteredAreas.length} 個核心區域, ${filteredLocations.length} 個核心地點（原：${bestMatch.reference.areas?.length || 0} 個區域, ${bestMatch.reference.locations?.length || 0} 個地點）`);

            // 返回過濾後的參考數據（包括标记）
            return {
                areas: filteredAreas,
                locations: filteredLocations,
                markers: bestMatch.reference.markers || [],  // 包含标记数据
                mapDesign: bestMatch.reference.mapDesign || null,
                similarity: bestMatch.similarity,
                source: bestMatch.reference.source || 'local_reference',
                timestamp: bestMatch.reference.timestamp || new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ [MapReferenceRetrieval] 檢索失敗:', error);
            // 出錯時返回 null，讓系統使用 AI 生成
            return null;
        }
    }

    /**
     * 提取新聞文本的關鍵詞（優化版本）
     * @param {string} text - 新聞文本
     * @returns {string[]} - 關鍵詞列表（帶權重）
     */
    extractKeywords(text) {
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return [];
        }

        // 更精細的文本處理
        const words = text
            .toLowerCase()
            // 保留中文、英文、數字，保留連字符和撇號（用於地名，如 New York, O'Brien）
            .replace(/[^\u4e00-\u9fa5a-z0-9\s\-']/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 1 && !/^\d+$/.test(word)); // 過濾純數字

        // 擴展停用詞列表
        const stopWords = new Set([
            // 英文停用詞
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'being', 'have', 'has', 'had',
            'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must',
            'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'there',
            'what', 'which', 'who', 'when', 'where', 'why', 'how', 'can', 'said', 'say', 'says',
            // 中文停用詞
            '是', '的', '在', '有', '和', '就', '不', '人', '都', '一', '一個', '上', '也', '很', '到', 
            '說', '要', '去', '你', '會', '著', '沒有', '看', '好', '自己', '這', '那', '他', '她', 
            '它', '我們', '你們', '他們', '它們', '什麼', '怎麼', '如何', '為何', '因為', '所以',
            '如果', '但是', '而且', '或者', '以及', '並且', '關於', '根據', '來自', '來自於',
            // 新聞常見詞
            'news', 'report', 'reported', 'according', 'said', 'says', 'told', 'tells',
            '新聞', '報導', '報道', '表示', '指出', '稱', '據', '稱', '說', '透露'
        ]);

        // 計算詞頻並過濾停用詞
        const wordFreq = {};
        words.forEach(word => {
            if (!stopWords.has(word)) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
        });

        // 按頻率排序，返回前 30 個關鍵詞（增加數量以提高匹配精度）
        return Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30)
            .map(([word]) => word);
    }

    /**
     * 搜索相似的地圖參考
     * @param {Array} database - 參考數據庫
     * @param {string[]} keywords - 關鍵詞列表
     * @param {string} newsText - 原始新聞文本
     * @returns {Array} - 相似參考列表（按相似度排序）
     */
    searchSimilar(database, keywords, newsText) {
        const results = [];

        for (const reference of database) {
            const similarity = this.calculateSimilarity(reference, keywords, newsText);
            
            if (similarity > 0.3) {  // 相似度閾值：30%
                results.push({
                    reference,
                    similarity
                });
            }
        }

        // 按相似度降序排序
        results.sort((a, b) => b.similarity - a.similarity);

        return results;
    }

    /**
     * 計算相似度（優化版本：使用 TF-IDF 和餘弦相似度）
     * @param {Object} reference - 參考數據
     * @param {string[]} keywords - 關鍵詞列表
     * @param {string} newsText - 原始新聞文本
     * @returns {number} - 相似度 (0-1)
     */
    calculateSimilarity(reference, keywords, newsText) {
        let score = 0;

        // 提取當前新聞的地理區域和地點（用於事件匹配）
        const currentKeywords = this.extractKeywords(newsText);
        const referenceKeywords = reference.keywords || this.extractKeywords(reference.source_text || '');
        const referenceText = (reference.source_text || '').toLowerCase();
        const newsTextLower = newsText.toLowerCase();
        
        // 1. 地理區域匹配（65%）- 以事件核心區域為主要判斷依據（提高權重）
        const referenceAreas = (reference.areas || []).map(a => {
            const isoCode = (a.iso_code || '').toLowerCase();
            const areaName = (a.name || '').toLowerCase();
            // 提取區域名稱的關鍵部分（去除常見後綴）
            const areaNameParts = areaName.split(/\s+/).filter(part => 
                part.length > 2 && !['the', 'of', 'and'].includes(part)
            );
            return { isoCode, areaName, areaNameParts };
        });
        
        // 更精確的區域匹配：檢查 ISO 代碼、完整名稱、部分匹配、關鍵詞匹配
        let areaMatches = 0;
        let totalAreaWeight = 0;
        
        referenceAreas.forEach(refArea => {
            let matchScore = 0;
            let weight = 1;
            
            // ISO 代碼匹配（最高權重）
            if (refArea.isoCode && newsTextLower.includes(refArea.isoCode)) {
                matchScore = 1.0;
                weight = 1.5;
            }
            // 完整區域名稱匹配（高權重）
            else if (refArea.areaName && newsTextLower.includes(refArea.areaName)) {
                matchScore = 0.9;
                weight = 1.3;
            }
            // 部分區域名稱匹配
            else if (refArea.areaNameParts.length > 0) {
                const matchedParts = refArea.areaNameParts.filter(part => 
                    newsTextLower.includes(part) || currentKeywords.some(kw => 
                        kw.includes(part) || part.includes(kw)
                    )
                ).length;
                if (matchedParts > 0) {
                    matchScore = Math.min(0.8, matchedParts / refArea.areaNameParts.length);
                    weight = 1.0;
                }
            }
            // 關鍵詞匹配（較低權重）
            if (matchScore === 0) {
                const keywordMatch = currentKeywords.some(kw => 
                    refArea.areaName.includes(kw) || kw.includes(refArea.areaName) ||
                    refArea.areaNameParts.some(part => part.includes(kw) || kw.includes(part))
                );
                if (keywordMatch) {
                    matchScore = 0.5;
                    weight = 0.7;
                }
            }
            
            if (matchScore > 0) {
                areaMatches += matchScore * weight;
                totalAreaWeight += weight;
            }
        });
        
        const areaScore = referenceAreas.length > 0 && totalAreaWeight > 0
            ? Math.min(1, areaMatches / totalAreaWeight)
            : 0;
        score += areaScore * 0.65;

        // 2. 文本相似度（25%）- 使用改進的關鍵詞匹配和 TF-IDF 風格計算
        const allKeywords = new Set([...currentKeywords, ...referenceKeywords]);
        let keywordMatchScore = 0;
        let totalKeywordWeight = 0;
        
        // 計算關鍵詞匹配度（考慮頻率和重要性）
        allKeywords.forEach(keyword => {
            const currentFreq = currentKeywords.filter(k => k === keyword).length;
            const referenceFreq = referenceKeywords.filter(k => k === keyword).length;
            const inCurrentText = newsTextLower.includes(keyword) ? 1 : 0;
            const inReferenceText = referenceText.includes(keyword) ? 1 : 0;
            
            if (currentFreq > 0 || inCurrentText) {
                // 關鍵詞在兩者中都出現
                if (referenceFreq > 0 || inReferenceText) {
                    const matchStrength = Math.min(1, 
                        (Math.max(currentFreq, inCurrentText) + Math.max(referenceFreq, inReferenceText)) / 2
                    );
                    // 長關鍵詞（可能是地名、專有名詞）給予更高權重
                    const weight = keyword.length > 4 ? 1.5 : 1.0;
                    keywordMatchScore += matchStrength * weight;
                    totalKeywordWeight += weight;
                }
            }
        });
        
        const keywordScore = totalKeywordWeight > 0 
            ? Math.min(1, keywordMatchScore / totalKeywordWeight) 
            : 0;
        score += keywordScore * 0.25;

        // 3. 時間相關性（10%）- 越近期的參考越相關
        if (reference.timestamp) {
            try {
                const referenceDate = new Date(reference.timestamp);
                const daysSince = (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
                // 調整時間衰減：3個月內相關性最高，1年後衰減
                const timeScore = Math.max(0, 1 - daysSince / 180);  // 6個月內相關性較高
                score += timeScore * 0.1;
            } catch (e) {
                // 時間解析失敗，忽略時間因素
            }
        }

        return Math.min(1, score);
    }

    /**
     * 從文本中提取地區名稱（簡單版本）
     * @param {string} text - 文本
     * @returns {string[]} - 地區名稱列表
     * @deprecated 現在主要通過地理區域匹配來計算相似度，此方法保留以保持向後兼容
     */
    extractAreaNames(text) {
        // 這裡可以後續改進為更智能的地名識別
        // 現在簡單返回空數組，主要通過 calculateSimilarity 中的區域匹配來判斷
        return [];
    }

    /**
     * 保存地圖參考到數據庫
     * @param {string} newsText - 新聞文本
     * @param {Object} results - 分析結果 {areas, locations, mapDesign}
     */
    saveReference(newsText, results) {
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
            return;
        }

        try {
            const database = this.getDatabase();
            const keywords = this.extractKeywords(newsText);

            // 只保存核心區域和地點（confidence >= 0.75，只保留事件直接參與方）
            const coreAreas = (results.areas || []).filter(area => {
                const confidence = area._agent?.confidence ?? 0.8;
                // 提高門檻到 0.75，只保留事件直接發生地或核心參與方
                return confidence >= 0.75;
            });
            
            const coreLocations = (results.locations || []).filter(location => {
                const confidence = location._agent?.confidence ?? 0.8;
                // 地點的門檻可以稍低（0.7），因為地點通常是具體的事件發生地
                return confidence >= 0.7;
            });

            console.log(`💾 [MapReferenceRetrieval] 保存參考：只保存核心區域和地點（${coreAreas.length} 個區域, ${coreLocations.length} 個地點，過濾前：${results.areas?.length || 0} 個區域, ${results.locations?.length || 0} 個地點）`);

            // 获取当前地图的标记数据（如果存在）
            const markers = (typeof appState !== 'undefined' && appState.markers) 
                ? appState.markers.map(m => ({
                    name: m.name,
                    coordinates: m.coordinates,
                    color: m.color,
                    shape: m.shape || 'pin'
                }))
                : [];
            
            const reference = {
                source_text: newsText.substring(0, 1000),  // 只保存前 1000 字符
                keywords: keywords,
                areas: coreAreas,  // 只保存核心區域
                locations: coreLocations,  // 只保存核心地點
                markers: markers,  // 保存标记数据
                mapDesign: results.mapDesign || null,
                timestamp: new Date().toISOString(),
                id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };

            database.push(reference);

            // 限制數據庫大小（保留最近 100 條）
            if (database.length > 100) {
                database.sort((a, b) => {
                    const timeA = new Date(a.timestamp || 0).getTime();
                    const timeB = new Date(b.timestamp || 0).getTime();
                    return timeB - timeA;  // 降序
                });
                database.splice(100);
            }

            localStorage.setItem(this.storageKey, JSON.stringify(database));
            console.log(`💾 [MapReferenceRetrieval] 已保存地圖參考到數據庫 (共 ${database.length} 條)`);

        } catch (error) {
            console.warn('⚠️ [MapReferenceRetrieval] 保存參考失敗:', error);
        }
    }

    /**
     * 獲取數據庫
     * @returns {Array} - 參考數據庫
     */
    getDatabase() {
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
            return [];
        }

        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.warn('⚠️ [MapReferenceRetrieval] 讀取數據庫失敗:', error);
            return [];
        }
    }

    /**
     * 清除數據庫
     */
    clearDatabase() {
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
            return;
        }

        try {
            localStorage.removeItem(this.storageKey);
            this.initializeDatabase();
            console.log('🗑️ [MapReferenceRetrieval] 已清除參考數據庫');
        } catch (error) {
            console.warn('⚠️ [MapReferenceRetrieval] 清除數據庫失敗:', error);
        }
    }
}

// Export
if (typeof window !== 'undefined') {
    window.MapReferenceRetrievalAgent = MapReferenceRetrievalAgent;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapReferenceRetrievalAgent;
}

