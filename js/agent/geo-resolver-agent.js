/**
 * Geo Resolver Agent
 * 
 * 將地點/區域名稱解析為標準化的地理識別碼和座標
 * 
 * 輸入：GeoTargets（含原始名稱）
 * 輸出：GeoTargets（含解析後的 ISO code、GADM ID、lat/lon 等）
 */

class GeoResolverAgent {
    constructor() {
        this.countryMap = this.buildCountryMap();
        // 可以載入 gazetteer 資料
        this.gazetteer = null;
        
        // 初始化 GADM 驗證器
        this.gadmValidator = null;
        if (typeof window !== 'undefined' && window.getGADMValidator) {
            this.gadmValidator = window.getGADMValidator();
        }
        
        // 初始化語義映射（如果可用）
        this.synonymResolver = null;
        if (typeof window !== 'undefined' && window.resolveSynonym) {
            this.synonymResolver = window.resolveSynonym;
        }
    }

    /**
     * 解析地理目標
     * 
     * @param {GeoTarget[]} targets - 候選目標清單
     * @returns {Promise<GeoTarget[]>}
     */
    async resolve(targets) {
        console.log('🔍 [GeoResolver] 開始解析地理位置...');

        const resolved = await Promise.all(
            targets.map(target => this.resolveSingle(target))
        );

        console.log(`✅ [GeoResolver] 解析完成：${resolved.length} 個目標`);
        return resolved;
    }

    /**
     * 解析單一目標
     */
    async resolveSingle(target) {
        if (target.type === 'region') {
            return await this.resolveRegion(target);
        } else if (target.type === 'place') {
            return await this.resolvePlace(target);
        }
        return target;
    }

    /**
     * 解析區域（國家/行政區）
     */
    async resolveRegion(target) {
        const name = target.name.trim();
        let isoCode = null;
        let entities = null; // 可能有多個實體（如納卡區 → ARM, AZE）
        
        // 步驟 1：嘗試語義映射（處理別名）
        if (this.synonymResolver) {
            const synonym = this.synonymResolver(name);
            if (synonym) {
                if (synonym.entities && synonym.entities.length > 0) {
                    entities = synonym.entities;
                    isoCode = synonym.entities[0]; // 先使用第一個實體
                    console.log(`✅ [GeoResolver] 語義映射: ${name} → ${synonym.canonical} (實體: ${entities.join(', ')})`);
                    
                    // 如果是多實體（如納卡區），需要特殊處理
                    if (entities.length > 1) {
                        // 標記為需要分解，但先使用第一個實體
                        target.resolved = {
                            ...target.resolved,
                            iso_code: isoCode,
                            entities: entities, // 保存所有相關實體
                            canonical: synonym.canonical,
                            admin_level: target.resolved.admin_level || 'admin0',
                            needs_decomposition: true, // 標記需要分解
                            suggestion: `${name} 涉及多個國家 (${entities.join(', ')}），當前使用 ${isoCode}`
                        };
                        
                        // 仍然進行驗證
                        await this.validateAndUpdate(target, isoCode, 'admin0');
                        return target;
                    }
                }
            }
        }
        
        // 步驟 2：如果語義映射沒有結果，嘗試從 countryMap 查找
        if (!isoCode) {
            isoCode = this.countryMap[name] || 
                     this.countryMap[name.toLowerCase()] ||
                     this.findCountryByAlias(name);
        }

        if (isoCode) {
            target.resolved = {
                ...target.resolved,
                iso_code: isoCode,
                admin_level: target.resolved.admin_level || 'admin0'
            };
            
            // 步驟 3：驗證 ISO 代碼（GADM Grounding）
            await this.validateAndUpdate(target, isoCode, target.resolved.admin_level || 'admin0');
            
            return target;
        }

        // 如果都找不到，標記為需要人工處理
        target.resolved = {
            ...target.resolved,
            needs_review: true,
            suggestion: `無法自動解析 "${name}"，請檢查拼寫或手動指定 ISO 代碼`
        };
        console.warn(`⚠️ [GeoResolver] 無法解析區域: ${name}`);
        return target;
    }
    
    /**
     * 驗證 ISO 代碼並更新目標的驗證狀態
     * @param {Object} target - 地理目標
     * @param {string} isoCode - ISO 代碼
     * @param {string} adminLevel - 管理級別
     */
    async validateAndUpdate(target, isoCode, adminLevel) {
        if (!this.gadmValidator) {
            // 如果驗證器不可用，仍然標記為已解析
            console.log(`✅ [GeoResolver] ${target.name} → ISO:${isoCode} (未驗證，驗證器不可用)`);
            return;
        }

        try {
            // 先檢查 ISO 代碼格式（必須是3個字母）
            if (!isoCode || isoCode.length !== 3 || !/^[A-Z]{3}$/i.test(isoCode)) {
                target.resolved.validated = false;
                target.resolved.needs_review = true;
                target.resolved.suggestion = `ISO 代碼格式無效: "${isoCode}"。應為 3 個字母的 ISO 3166-1 alpha-3 代碼（如 TWN, USA, CHN）`;
                console.warn(`⚠️ [GeoResolver] ${target.name} → ISO 代碼格式無效: ${isoCode}`);
                return;
            }

            // 特殊處理：EU 是區域代碼，不是國家
            if (isoCode.toUpperCase() === 'EU') {
                target.resolved.validated = false;
                target.resolved.needs_review = true;
                target.resolved.suggestion = `"EU" 是區域代碼，不是單一國家。請分解為具體國家（如 FRA, DEU, ITA 等）或跳過此區域`;
                console.warn(`⚠️ [GeoResolver] ${target.name} → ISO:${isoCode} (驗證失敗: ${target.resolved.suggestion})`);
                return;
            }

            const validation = await this.gadmValidator.validateGADMCode(isoCode, adminLevel);
            
            if (validation.valid) {
                target.resolved.validated = true;
                console.log(`✅ [GeoResolver] ${target.name} → ISO:${isoCode} (已驗證)`);
            } else {
                // 驗證失敗，標記需要審查
                target.resolved.validated = false;
                target.resolved.needs_review = true;
                target.resolved.suggestion = validation.suggestion || `ISO 代碼 ${isoCode} 驗證失敗`;
                
                if (validation.similar && validation.similar.length > 0) {
                    target.resolved.suggestion += `。建議: ${validation.similar.join(', ')}`;
                }
                
                console.warn(`⚠️ [GeoResolver] ${target.name} → ISO:${isoCode} (驗證失敗: ${validation.suggestion})`);
            }
        } catch (error) {
            // 驗證過程出錯，但不算失敗
            console.warn(`⚠️ [GeoResolver] 驗證過程出錯:`, error);
            target.resolved.validated = false;
        }
    }

    /**
     * 解析地點（城市/地標）
     */
    async resolvePlace(target) {
        const name = target.name.trim();

        // 先嘗試使用現有的 resolveLocationCoordinates 函數（如果有的話）
        // 這個函數在 ai-assistant.js 中使用，可以通過全局訪問
        if (typeof window !== 'undefined' && typeof resolveLocationCoordinates === 'function') {
            try {
                const coords = await resolveLocationCoordinates(name, target.resolved?.country_code || null);
                if (coords && Array.isArray(coords) && coords.length >= 2) {
                    // coords 格式應該是 [lng, lat]
                    const coordValidation = this.validateCoordinates(coords);
                    if (coordValidation.valid) {
                        target.resolved = {
                            ...target.resolved,
                            lat: coords[1],
                            lon: coords[0],
                            coordinates: coords,
                            validated: true
                        };
                        console.log(`✅ [GeoResolver] ${name} → ${coords[1]},${coords[0]} (使用 resolveLocationCoordinates, 已驗證)`);
                        return target;
                    } else {
                        target.resolved = {
                            ...target.resolved,
                            lat: coords[1],
                            lon: coords[0],
                            coordinates: coords,
                            validated: false,
                            needs_review: true,
                            suggestion: coordValidation.suggestion
                        };
                        console.warn(`⚠️ [GeoResolver] ${name} → 座標驗證失敗: ${coordValidation.suggestion}`);
                        return target;
                    }
                }
            } catch (error) {
                console.warn(`⚠️ [GeoResolver] resolveLocationCoordinates 失敗:`, error);
            }
        }

        // 備選：嘗試使用 LocationResolver（如果有的話）
        if (window.LocationResolver) {
            try {
                const result = await window.LocationResolver.resolveLocation(name);
                if (result && result.lat && result.lon) {
                    const coords = [result.lon, result.lat]; // [lng, lat] 格式
                    
                    // 驗證座標
                    const coordValidation = this.validateCoordinates(coords);
                    if (coordValidation.valid) {
                        target.resolved = {
                            ...target.resolved,
                            lat: result.lat,
                            lon: result.lon,
                            coordinates: coords,
                            country_code: result.country_code,
                            validated: true
                        };
                        console.log(`✅ [GeoResolver] ${name} → ${result.lat},${result.lon} (使用 LocationResolver, 已驗證)`);
                    } else {
                        target.resolved = {
                            ...target.resolved,
                            lat: result.lat,
                            lon: result.lon,
                            coordinates: coords,
                            country_code: result.country_code,
                            validated: false,
                            needs_review: true,
                            suggestion: coordValidation.suggestion
                        };
                        console.warn(`⚠️ [GeoResolver] ${name} → 座標驗證失敗: ${coordValidation.suggestion}`);
                    }
                    return target;
                }
            } catch (error) {
                console.warn(`⚠️ [GeoResolver] LocationResolver 失敗:`, error);
            }
        }

        // 備選方案：使用 Nominatim（需要遵守使用政策）
        // 注意：這裡只是示例，實際使用需要處理速率限制
        try {
            const coords = await this.geocodeWithNominatim(name);
            if (coords) {
                const coordArray = [coords.lon, coords.lat]; // [lng, lat] 格式
                const coordValidation = this.validateCoordinates(coordArray);
                
                target.resolved = {
                    ...target.resolved,
                    lat: coords.lat,
                    lon: coords.lon,
                    coordinates: coordArray,
                    validated: coordValidation.valid
                };
                
                if (!coordValidation.valid) {
                    target.resolved.needs_review = true;
                    target.resolved.suggestion = coordValidation.suggestion;
                }
                
                return target;
            }
        } catch (error) {
            console.warn(`⚠️ [GeoResolver] Nominatim geocoding 失敗:`, error);
        }

        // 如果都失敗，標記為需要人工處理
        target.resolved = {
            ...target.resolved,
            needs_review: true,
            suggestion: `無法自動解析座標 "${name}"，請手動指定座標`
        };
        console.warn(`⚠️ [GeoResolver] 無法解析地點: ${name}`);
        return target;
    }
    
    /**
     * 驗證座標有效性
     * @param {Array} coords - 座標 [lng, lat] 或 [lat, lng]
     * @returns {Object} - {valid: boolean, suggestion?: string}
     */
    validateCoordinates(coords) {
        if (!coords || !Array.isArray(coords) || coords.length < 2) {
            return {
                valid: false,
                suggestion: '座標格式無效，應為 [經度, 緯度] 或 [緯度, 經度] 格式'
            };
        }

        // 嘗試兩種順序
        let lng, lat;
        
        // 先假設是 [lng, lat]
        lng = coords[0];
        lat = coords[1];
        
        // 如果看起來不對（lng 在 -90 到 90 之間，lat 不在），可能是 [lat, lng]
        if (Math.abs(lng) <= 90 && (Math.abs(lat) > 90 || Math.abs(lat) < 90)) {
            // 可能是 [lat, lng]，交換
            [lat, lng] = [lng, lat];
        }

        // 驗證範圍
        if (isNaN(lng) || isNaN(lat)) {
            return {
                valid: false,
                suggestion: '座標必須為數字'
            };
        }

        if (lng < -180 || lng > 180) {
            return {
                valid: false,
                suggestion: `經度 ${lng} 超出有效範圍 (-180 到 180)`
            };
        }

        if (lat < -90 || lat > 90) {
            return {
                valid: false,
                suggestion: `緯度 ${lat} 超出有效範圍 (-90 到 90)`
            };
        }

        return { valid: true };
    }

    /**
     * 使用 Nominatim 進行地理編碼
     * 注意：由於 CORS 限制，瀏覽器直接調用會失敗
     * 目前禁用，改為標記為需要審查
     */
    async geocodeWithNominatim(query) {
        // 由於 CORS 限制，瀏覽器無法直接調用 Nominatim API
        // 如果需要使用，應該通過後端代理
        // 目前禁用此功能，改為在 resolvePlace 中標記為需要審查
        
        console.warn(`⚠️ [GeoResolver] Nominatim geocoding 已禁用（CORS 限制），${query} 將標記為需要審查`);
        return null;
        
        /* 如果需要通過後端代理使用，可以這樣：
        try {
            const proxyUrl = '/api/nominatim/search?q=' + encodeURIComponent(query);
            const response = await fetch(proxyUrl);
            const data = await response.json();
            
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon)
                };
            }
        } catch (error) {
            console.error('Nominatim geocoding error:', error);
        }
        */
    }

    /**
     * 構建國家名稱映射表
     */
    buildCountryMap() {
        // 這裡應該載入完整的國家代碼對照表
        // 示例：使用現有的 COUNTRY_CODES 或擴展
        const map = {};
        
        // 如果全局有 COUNTRY_CODES，使用它
        if (typeof window !== 'undefined' && window.COUNTRY_CODES) {
            Object.entries(window.COUNTRY_CODES).forEach(([code, names]) => {
                if (Array.isArray(names)) {
                    names.forEach(name => {
                        map[name] = code;
                        map[name.toLowerCase()] = code;
                    });
                } else if (typeof names === 'string') {
                    map[names] = code;
                    map[names.toLowerCase()] = code;
                }
            });
        }

        // 添加常見別名（擴展）
        const commonAliases = {
            '台灣': 'TWN', '臺灣': 'TWN', 'Taiwan': 'TWN',
            '中國': 'CHN', 'China': 'CHN',
            '美國': 'USA', 'United States': 'USA', 'US': 'USA',
            '英國': 'GBR', 'United Kingdom': 'GBR', 'UK': 'GBR',
            '日本': 'JPN', 'Japan': 'JPN',
            '韓國': 'KOR', 'South Korea': 'KOR', 'Korea': 'KOR',
            '烏克蘭': 'UKR', 'Ukraine': 'UKR',
            '德國': 'DEU', 'Germany': 'DEU',
            '法國': 'FRA', 'France': 'FRA',
            '俄羅斯': 'RUS', 'Russia': 'RUS', 'Russian Federation': 'RUS',
            '波蘭': 'POL', 'Poland': 'POL',
            // 高加索地區
            '亞塞拜然': 'AZE', '亞塞拜然': 'AZE', 'Azerbaijan': 'AZE', '阿塞拜疆': 'AZE', '阿塞拜疆': 'AZE',
            '亞美尼亞': 'ARM', '亞美尼亞': 'ARM', 'Armenia': 'ARM',
            '喬治亞': 'GEO', 'Georgia': 'GEO', '格鲁吉亚': 'GEO', '格魯吉亞': 'GEO',
            // 中東地區
            '土耳其': 'TUR', 'Turkey': 'TUR',
            '伊朗': 'IRN', 'Iran': 'IRN', 'Islamic Republic of Iran': 'IRN',
            '伊拉克': 'IRQ', 'Iraq': 'IRQ',
            '沙烏地阿拉伯': 'SAU', '沙特阿拉伯': 'SAU', 'Saudi Arabia': 'SAU',
            '以色列': 'ISR', 'Israel': 'ISR',
            '約旦': 'JOR', 'Jordan': 'JOR',
            '黎巴嫩': 'LBN', 'Lebanon': 'LBN',
            '敘利亞': 'SYR', 'Syria': 'SYR',
            // 歐洲
            '歐洲': 'EU', // 注意：這是區域，不是國家
            '歐盟': 'EU',
            '歐洲聯盟': 'EU',
            // 其他
            '印度': 'IND', 'India': 'IND',
            '巴基斯坦': 'PAK', 'Pakistan': 'PAK',
            '阿富汗': 'AFG', 'Afghanistan': 'AFG',
            '哈薩克': 'KAZ', 'Kazakhstan': 'KAZ', '哈薩克斯坦': 'KAZ',
            '烏茲別克': 'UZB', 'Uzbekistan': 'UZB', '烏茲別克斯坦': 'UZB'
        };

        Object.entries(commonAliases).forEach(([alias, code]) => {
            map[alias] = code;
            map[alias.toLowerCase()] = code;
        });

        return map;
    }

    /**
     * 通過別名查找國家
     */
    findCountryByAlias(name) {
        // 先檢查語義映射表（如果可用）
        if (this.synonymResolver) {
            const synonym = this.synonymResolver(name);
            if (synonym && synonym.entities && synonym.entities.length > 0) {
                return synonym.entities[0]; // 返回第一個實體
            }
        }
        
        // 然後檢查 countryMap（已經在 resolveRegion 中檢查了，這裡作為後備）
        return this.countryMap[name] || this.countryMap[name.toLowerCase()] || null;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.GeoResolverAgent = GeoResolverAgent;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeoResolverAgent;
}



