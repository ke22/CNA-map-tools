/**
 * Map Spec Generator
 * 
 * 將使用者選定的 GeoTargets 轉換為 MapSpec（可重跑的規格）
 * 
 * 輸入：GeoTargets（含使用者選擇）+ StyleTokens
 * 輸出：MapSpec
 */

class MapSpecGenerator {
    constructor() {
        this.defaultStyleTokens = this.getDefaultStyleTokens();
    }

    /**
     * 生成 Map Spec
     * 
     * @param {GeoTargets} geoTargets - 地理目標（含使用者選擇）
     * @param {StyleTokens} [styleTokens] - 風格設定（可選）
     * @param {Object} [options] - 其他選項
     * @returns {MapSpec}
     */
    generate(geoTargets, styleTokens = null, options = {}) {
        const style = styleTokens || this.defaultStyleTokens;
        const selectedTargets = this.getSelectedTargets(geoTargets);
        
        // 計算地圖邊界
        const bounds = this.calculateBounds(selectedTargets);
        
        // 生成圖層
        const layers = this.generateLayers(selectedTargets, style);
        
        return {
            version: '1.0',
            map_id: `map_${Date.now()}`,
            bounds: bounds,
            layers: layers,
            style: style,
            metadata: {
                title: options.title || '地圖',
                source: geoTargets.source_url || '未知來源',
                date: new Date().toISOString().split('T')[0],
                generated_at: new Date().toISOString()
            }
        };
    }

    /**
     * 獲取使用者選定的目標
     */
    getSelectedTargets(geoTargets) {
        const selectedIds = new Set(geoTargets.selected_ids || []);
        return geoTargets.candidates.filter(t => selectedIds.has(t.id));
    }

    /**
     * 計算地圖邊界
     */
    calculateBounds(targets) {
        const regions = targets.filter(t => t.type === 'region');
        const places = targets.filter(t => t.type === 'place');

        let minLat = Infinity, maxLat = -Infinity;
        let minLon = Infinity, maxLon = -Infinity;

        // 從地點提取座標
        places.forEach(place => {
            if (place.resolved?.lat && place.resolved?.lon) {
                minLat = Math.min(minLat, place.resolved.lat);
                maxLat = Math.max(maxLat, place.resolved.lat);
                minLon = Math.min(minLon, place.resolved.lon);
                maxLon = Math.max(maxLon, place.resolved.lon);
            }
        });

        // 如果有區域但沒有地點，使用默認視角
        if (regions.length > 0 && places.length === 0) {
            // 這裡可以根據區域的 ISO code 查詢邊界
            // 簡化處理：使用全局視角
            return {
                west: -180,
                east: 180,
                south: -85,
                north: 85
            };
        }

        // 如果有地點，擴展邊界（添加 padding）
        if (places.length > 0) {
            const padding = 5; // 度
            return {
                west: minLon - padding,
                east: maxLon + padding,
                south: minLat - padding,
                north: maxLat + padding
            };
        }

        // 默認全局視角
        return {
            west: -180,
            east: 180,
            south: -85,
            north: 85
        };
    }

    /**
     * 生成圖層配置
     */
    generateLayers(targets, style) {
        const layers = [];
        const regions = targets.filter(t => t.type === 'region');
        const places = targets.filter(t => t.type === 'place');

        // Layer 1: 邊界底圖
        layers.push({
            id: 'boundaries',
            type: 'boundary',
            source: {
                type: 'mapbox',
                source_id: 'boundaries-adm0' // 或根據需要選擇 admin1/admin2
            },
            style: {
                stroke_color: style.boundaries.stroke_color || '#cccccc',
                stroke_width: style.boundaries.stroke_width || 1,
                fill_color: style.boundaries.fill_color || 'transparent'
            }
        });

        // Layer 2: 區域上色（choropleth）
        if (regions.length > 0) {
            const regionIds = regions
                .map(r => r.resolved?.iso_code)
                .filter(Boolean);

            layers.push({
                id: 'regions_highlight',
                type: 'choropleth',
                source: {
                    type: 'mapbox',
                    source_id: 'boundaries-adm0'
                },
                style: {
                    fill_color: style.colors.semantic.highlight || '#ff6b6b',
                    fill_opacity: 0.6,
                    stroke_color: style.colors.semantic.primary || '#c92a2a',
                    stroke_width: 2
                },
                filter: {
                    field: 'iso_code',
                    operator: 'in',
                    values: regionIds
                }
            });
            
            // Layer 2.5: 為填充區域生成標記位置（計算中心點）
            // 如果沒有明確的地點標記，為區域生成中心點標記
            if (places.length === 0 || options.autoGenerateRegionMarkers !== false) {
                const regionMarkers = regions
                    .map(r => {
                        // 嘗試計算區域的中心點
                        const centroid = this.calculateRegionCentroid(r);
                        if (centroid) {
                            return {
                                type: 'Feature',
                                geometry: {
                                    type: 'Point',
                                    coordinates: [centroid.lon, centroid.lat]
                                },
                                properties: {
                                    name: r.name,
                                    id: r.id || `region_${r.resolved?.iso_code}`,
                                    type: 'region_marker',
                                    iso_code: r.resolved?.iso_code
                                }
                            };
                        }
                        return null;
                    })
                    .filter(Boolean);
                
                if (regionMarkers.length > 0) {
                    // 合併到 places 圖層中（如果有的話），或創建新的區域標記圖層
                    // 這裡先創建單獨的區域標記圖層
                    layers.push({
                        id: 'region_markers',
                        type: 'point',
                        source: {
                            type: 'geojson',
                            data: {
                                type: 'FeatureCollection',
                                features: regionMarkers
                            }
                        },
                        style: {
                            marker_color: style.colors.semantic.secondary || '#748ffc',
                            marker_size: 10,
                            marker_shape: 'circle'
                        }
                    });
                }
            }
        }

        // Layer 3: 地點標註（點位）
        if (places.length > 0) {
            layers.push({
                id: 'places',
                type: 'point',
                source: {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: places.map(place => ({
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [place.resolved.lon, place.resolved.lat]
                            },
                            properties: {
                                name: place.name,
                                id: place.id
                            }
                        }))
                    }
                },
                style: {
                    marker_color: style.colors.semantic.primary || '#4c6ef5',
                    marker_size: 12,
                    marker_shape: 'circle'
                }
            });
        }

        // Layer 4: 文字標註
        if (places.length > 0) {
            layers.push({
                id: 'labels',
                type: 'label',
                source: {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: places.map(place => ({
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [place.resolved.lon, place.resolved.lat]
                            },
                            properties: {
                                name: place.name,
                                id: place.id
                            }
                        }))
                    }
                },
                style: {
                    text_color: style.typography.text_color || '#333333',
                    text_size: style.typography.label_size || 12,
                    text_font: style.typography.font_family || 'Arial',
                    text_anchor: 'left',
                    text_offset: [8, 0] // 右側標註
                }
            });
        }

        return layers;
    }

    /**
     * 計算區域的中心點（centroid）
     * @param {Object} region - 區域對象
     * @returns {Object|null} - {lat, lon} 或 null
     */
    calculateRegionCentroid(region) {
        // 如果有預先計算的中心點，直接使用
        if (region.resolved?.centroid) {
            return {
                lat: region.resolved.centroid.lat,
                lon: region.resolved.centroid.lon
            };
        }
        
        // 如果有 ISO 代碼，嘗試從已知的中心點數據庫獲取
        const isoCode = region.resolved?.iso_code;
        if (isoCode) {
            const knownCentroids = this.getKnownCountryCentroids();
            const centroid = knownCentroids[isoCode.toUpperCase()];
            if (centroid) {
                return centroid;
            }
        }
        
        // 如果地圖實例可用，嘗試查詢區域幾何並計算中心點
        // 注意：這需要實際的地圖和數據源支持
        if (typeof window !== 'undefined' && window.appState && window.appState.map) {
            try {
                // 嘗試從 GADM 數據查詢區域幾何
                // 這是一個簡化版本，實際應該查詢完整的 GeoJSON 並計算 centroid
                // 暫時返回 null，讓調用者知道需要手動指定或使用已知數據
                console.log(`ℹ️ [MapSpecGenerator] 需要為區域 ${region.name} (${isoCode}) 計算中心點`);
            } catch (error) {
                console.warn(`⚠️ [MapSpecGenerator] 計算區域中心點失敗:`, error);
            }
        }
        
        return null;
    }
    
    /**
     * 獲取已知的國家中心點數據庫（主要國家）
     * @returns {Object} - {ISO_CODE: {lat, lon}}
     */
    getKnownCountryCentroids() {
        // 這是一個主要國家的中心點數據庫
        // 實際應用中應該從更完整的數據源獲取（如 Natural Earth 或 GADM）
        return {
            'USA': { lat: 39.8283, lon: -98.5795 },
            'CHN': { lat: 35.8617, lon: 104.1954 },
            'IND': { lat: 20.5937, lon: 78.9629 },
            'BRA': { lat: -14.2350, lon: -51.9253 },
            'RUS': { lat: 61.5240, lon: 105.3188 },
            'JPN': { lat: 36.2048, lon: 138.2529 },
            'DEU': { lat: 51.1657, lon: 10.4515 },
            'GBR': { lat: 55.3781, lon: -3.4360 },
            'FRA': { lat: 46.6034, lon: 1.8883 },
            'ITA': { lat: 41.8719, lon: 12.5674 },
            'ESP': { lat: 40.4637, lon: -3.7492 },
            'UKR': { lat: 48.3794, lon: 31.1656 },
            'POL': { lat: 51.9194, lon: 19.1451 },
            'TUR': { lat: 38.9637, lon: 35.2433 },
            'IRN': { lat: 32.4279, lon: 53.6880 },
            'SAU': { lat: 23.8859, lon: 45.0792 },
            'ISR': { lat: 31.0461, lon: 34.8516 },
            'EGY': { lat: 26.0975, lon: 31.2357 },
            'ZAF': { lat: -30.5595, lon: 22.9375 },
            'AUS': { lat: -25.2744, lon: 133.7751 },
            'CAN': { lat: 56.1304, lon: -106.3468 },
            'MEX': { lat: 23.6345, lon: -102.5528 },
            'ARG': { lat: -38.4161, lon: -63.6167 },
            'IDN': { lat: -0.7893, lon: 113.9213 },
            'THA': { lat: 15.8700, lon: 100.9925 },
            'VNM': { lat: 14.0583, lon: 108.2772 },
            'PHL': { lat: 12.8797, lon: 121.7740 },
            'KOR': { lat: 35.9078, lon: 127.7669 },
            'TWN': { lat: 23.6978, lon: 120.9605 },
            'AZE': { lat: 40.1431, lon: 47.5769 },
            'ARM': { lat: 40.0691, lon: 45.0382 },
            'GEO': { lat: 42.3154, lon: 43.3569 }
        };
    }

    /**
     * 獲取默認風格設定
     */
    getDefaultStyleTokens() {
        return {
            colors: {
                palette: [
                    '#4c6ef5', '#ff6b6b', '#51cf66', '#ffd43b', '#ff922b',
                    '#748ffc', '#ff8787', '#69db7c', '#ffd43b', '#ffa94d'
                ],
                semantic: {
                    primary: '#4c6ef5',
                    secondary: '#748ffc',
                    highlight: '#ff6b6b',
                    success: '#51cf66',
                    warning: '#ffd43b'
                }
            },
            typography: {
                font_family: 'Arial, sans-serif',
                title_size: 24,
                label_size: 12,
                text_color: '#333333'
            },
            annotations: {
                show_callout: true,
                callout_color: '#333333',
                callout_width: 1
            },
            boundaries: {
                stroke_color: '#cccccc',
                stroke_width: 1,
                fill_color: 'transparent'
            }
        };
    }
}

// Export
if (typeof window !== 'undefined') {
    window.MapSpecGenerator = MapSpecGenerator;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapSpecGenerator;
}



