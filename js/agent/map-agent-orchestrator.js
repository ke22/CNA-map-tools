/**
 * Map Agent Orchestrator
 * 
 * 編排整個 Agent 工作流：讀取新聞 → 抽取 → 解析 → 使用者選擇 → 生成 Spec → 渲染
 * 
 * 這是整個 Agent 流程的入口點
 */

class MapAgentOrchestrator {
    constructor(geminiService) {
        this.geminiService = geminiService;
        this.referenceRetrieval = new MapReferenceRetrievalAgent();
        this.extractor = new GeoExtractorAgent(geminiService);
        this.resolver = new GeoResolverAgent();
        this.validator = new ValidationAgent();
        this.specGenerator = new MapSpecGenerator();
        
        // 狀態管理
        this.currentGeoTargets = null;
        this.currentMapSpec = null;
    }

    /**
     * 完整工作流：從新聞稿到地圖規格
     * 
     * @param {string} newsText - 新聞稿文本
     * @param {string} [sourceUrl] - 來源 URL
     * @returns {Promise<GeoTargets>} - 候選清單（等待使用者選擇）
     */
    async processNewsText(newsText, sourceUrl = null) {
        console.log('🚀 [Orchestrator] 開始處理新聞稿...');

        try {
            // Step 0: 檢索相似地圖參考（如果找到，直接使用；如果沒有，繼續 AI 生成）
            console.log('🔍 Step 0: 檢索相似地圖參考');
            const referenceResult = await this.referenceRetrieval.retrieveSimilarReference(newsText);
            
            if (referenceResult && referenceResult.areas && referenceResult.areas.length > 0 && referenceResult.similarity > 0.7) {
                // 找到高度相似參考（相似度 > 70%），直接使用
                console.log(`✅ [Orchestrator] 找到高度相似地圖參考 (相似度: ${(referenceResult.similarity * 100).toFixed(1)}%)，使用參考數據`);
                
                // 將參考結果轉換為 GeoTargets 格式
                if (typeof window !== 'undefined' && window.convertLegacyFormatToGeoTargets) {
                    try {
                        const geoTargetsFromReference = window.convertLegacyFormatToGeoTargets(
                            {
                                areas: referenceResult.areas,
                                locations: referenceResult.locations,
                                mapDesign: referenceResult.mapDesign
                            },
                            newsText
                        );
                        
                        // 標記為來自參考
                        geoTargetsFromReference.from_reference = true;
                        geoTargetsFromReference.reference_similarity = referenceResult.similarity;
                        
                        // 仍然進行解析和驗證（但跳過抽取步驟）
                        console.log('🔍 Step 2: 解析參考地理位置');
                        geoTargetsFromReference.candidates = await this.resolver.resolve(
                            geoTargetsFromReference.candidates
                        );
                        
                        // Step 3: 確保只保留核心項目（confidence >= 0.75，只保留事件直接參與方）
                        // 新的評分標準：
                        // - 0.9-1.0: 事件直接發生地
                        // - 0.85-0.9: 直接參與方
                        // - 0.75-0.85: 重要地緣政治關聯方
                        // - < 0.75: 排除（噪音）
                        console.log('📊 Step 3: 過濾參考數據，只保留核心項目（confidence >= 0.75）');
                        geoTargetsFromReference.candidates = this.extractor.filterByConfidence(
                            geoTargetsFromReference.candidates,
                            0.75 // 只保留事件直接發生地、直接參與方或重要地緣政治關聯方
                        );
                        
                        // Step 4: 去重參考數據中的區域
                        console.log('🔄 Step 4: 去重參考數據中的區域（基於 ISO 代碼）');
                        geoTargetsFromReference.candidates = this.extractor.deduplicateRegions(
                            geoTargetsFromReference.candidates
                        );
                        
                        this.currentGeoTargets = geoTargetsFromReference;
                        console.log(`✅ [Orchestrator] 使用參考數據完成，找到 ${this.currentGeoTargets.candidates.length} 個核心候選項目`);
                        return this.currentGeoTargets;
                    } catch (error) {
                        console.warn('⚠️ [Orchestrator] 轉換參考數據失敗，改用 AI 生成:', error);
                        // 繼續使用 AI 生成
                    }
                } else {
                    console.warn('⚠️ [Orchestrator] 適配器未載入，改用 AI 生成');
                    // 繼續使用 AI 生成
                }
            } else if (referenceResult) {
                console.log(`💡 [Orchestrator] 找到參考但相似度較低 (${(referenceResult.similarity * 100).toFixed(1)}%)，使用 AI 生成以確保準確性`);
            }

            // Step 1: 抽取地理位置
            console.log('📍 Step 1: 抽取地理位置');
            this.currentGeoTargets = await this.extractor.extractGeoTargets(newsText, sourceUrl);

            // Step 2: 驗證提取結果格式
            console.log('✅ Step 2: 驗證提取結果格式');
            const formatValidation = this.validator.validateGeoTargets(this.currentGeoTargets);
            if (!formatValidation.valid) {
                console.warn('⚠️ [Orchestrator] 提取結果格式驗證失敗:', formatValidation.errors);
                // 繼續處理，但記錄錯誤
            }

            // Step 3: 解析地理位置（國家代碼、座標等）
            console.log('🔍 Step 3: 解析地理位置');
            this.currentGeoTargets.candidates = await this.resolver.resolve(
                this.currentGeoTargets.candidates
            );

            // Step 4: 驗證解析後的結果
            console.log('✅ Step 4: 驗證解析結果');
            const resolvedValidation = this.validator.validateGeoTargets(this.currentGeoTargets);
            if (!resolvedValidation.valid) {
                console.warn('⚠️ [Orchestrator] 解析結果驗證失敗:', resolvedValidation.errors);
            }

               // Step 5: 過濾低信心度項目（只保留事件直接參與方，confidence >= 0.75）
               // 新的評分標準：
               // - 0.9-1.0: 事件直接發生地（明確提到"在XX發生"、"XX爆發"等）
               // - 0.85-0.9: 直接參與方（簽署協議的國家、直接交戰方、被制裁的直接目標國）
               // - 0.75-0.85: 重要地緣政治關聯方（提供軍事基地的國家、重要外交斡旋國）
               // - < 0.75: 排除（受訪單位、消息來源、記者位置、背景提及、比較對象等噪音）
               console.log('📊 Step 5: 過濾低信心度項目（只保留 confidence >= 0.75 的核心項目）');
               this.currentGeoTargets.candidates = this.extractor.filterByConfidence(
                   this.currentGeoTargets.candidates,
                   0.75 // 只保留事件直接發生地、直接參與方或重要地緣政治關聯方（排除所有噪音類型）
               );

            // Step 6: 去重區域（基於 ISO 代碼，避免重複）
            console.log('🔄 Step 6: 去重區域（基於 ISO 代碼）');
            this.currentGeoTargets.candidates = this.extractor.deduplicateRegions(
                this.currentGeoTargets.candidates
            );

            console.log(`✅ [Orchestrator] 處理完成，找到 ${this.currentGeoTargets.candidates.length} 個候選項目`);
            console.log(`📊 [Orchestrator] 驗證統計:`, this.validator.getStats());

            // 保存結果到參考數據庫（供後續檢索使用）
            // 注意：這裡需要先轉換為標準格式再保存
            // 可以通過適配器轉換，但為了避免循環依賴，暫時註釋
            // TODO: 實現結果保存功能
            // this.saveResultsToReference(newsText);

            return this.currentGeoTargets;

        } catch (error) {
            console.error('❌ [Orchestrator] 處理失敗:', error);
            throw error;
        }
    }

    /**
     * 使用者選擇後，生成地圖規格
     * 
     * @param {string[]} selectedIds - 使用者選中的 ID 列表
     * @param {Object} [userCustomizations] - 使用者自訂（顏色、命名等）
     * @returns {MapSpec}
     */
    generateMapSpec(selectedIds, userCustomizations = {}) {
        if (!this.currentGeoTargets) {
            throw new Error('請先處理新聞稿');
        }

        // 更新選中的 ID
        this.currentGeoTargets.selected_ids = selectedIds;

        // 應用使用者自訂（顏色、命名等）
        this.applyUserCustomizations(selectedIds, userCustomizations);

        // 生成 Map Spec
        this.currentMapSpec = this.specGenerator.generate(
            this.currentGeoTargets,
            userCustomizations.styleTokens,
            {
                title: userCustomizations.title
            }
        );

        console.log('✅ [Orchestrator] Map Spec 生成完成');
        return this.currentMapSpec;
    }

    /**
     * 應用使用者自訂（顏色、命名等）
     */
    applyUserCustomizations(selectedIds, customizations) {
        if (!this.currentGeoTargets) return;

        selectedIds.forEach(id => {
            const target = this.currentGeoTargets.candidates.find(t => t.id === id);
            if (!target) return;

            // 應用顏色（如果有指定）
            if (customizations.colors && customizations.colors[id]) {
                target.color = customizations.colors[id];
            }

            // 應用命名修正（如果有指定）
            if (customizations.names && customizations.names[id]) {
                target.display_name = customizations.names[id];
            }
        });
    }

    /**
     * 獲取當前狀態（用於 UI 顯示）
     */
    getCurrentState() {
        return {
            geoTargets: this.currentGeoTargets,
            mapSpec: this.currentMapSpec
        };
    }

    /**
     * 重置狀態
     */
    reset() {
        this.currentGeoTargets = null;
        this.currentMapSpec = null;
    }

    /**
     * 導出 Map Spec 為 JSON（用於保存/重跑）
     */
    exportMapSpec() {
        if (!this.currentMapSpec) {
            throw new Error('尚未生成 Map Spec');
        }

        return JSON.stringify(this.currentMapSpec, null, 2);
    }

    /**
     * 從 JSON 載入 Map Spec（用於重跑）
     */
    loadMapSpec(jsonString) {
        this.currentMapSpec = JSON.parse(jsonString);
        return this.currentMapSpec;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.MapAgentOrchestrator = MapAgentOrchestrator;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapAgentOrchestrator;
}



