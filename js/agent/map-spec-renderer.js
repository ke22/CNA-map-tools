/**
 * Map Spec Renderer
 * 
 * 將 MapSpec 應用到現有的 Mapbox 地圖
 * 這是連接新 Agent 架構與現有地圖渲染系統的橋樑
 */

class MapSpecRenderer {
    constructor(mapInstance, appState) {
        this.map = mapInstance;
        this.appState = appState;
    }

    /**
     * 將 MapSpec 渲染到地圖
     * 
     * @param {MapSpec} mapSpec - 地圖規格
     */
    async render(mapSpec) {
        console.log('🎨 [MapSpecRenderer] 開始渲染地圖規格...');

        // 設置地圖視角
        this.setMapBounds(mapSpec.bounds);

        // 按順序渲染圖層
        for (const layer of mapSpec.layers) {
            await this.renderLayer(layer);
        }

        console.log('✅ [MapSpecRenderer] 渲染完成');
    }

    /**
     * 設置地圖邊界
     */
    setMapBounds(bounds) {
        if (this.map && bounds) {
            this.map.fitBounds(
                [[bounds.west, bounds.south], [bounds.east, bounds.north]],
                { padding: 50, duration: 1000 }
            );
        }
    }

    /**
     * 渲染單一圖層
     */
    async renderLayer(layer) {
        switch (layer.type) {
            case 'boundary':
                // 邊界圖層通常已經存在，只需確保可見
                await this.ensureBoundaryLayer(layer);
                break;

            case 'choropleth':
                // 區域上色
                await this.renderChoropleth(layer);
                break;

            case 'point':
                // 地點標註（點位）
                await this.renderPoints(layer);
                break;

            case 'label':
                // 文字標註
                await this.renderLabels(layer);
                break;

            case 'highlight':
                // 重點高亮
                await this.renderHighlight(layer);
                break;

            default:
                console.warn(`⚠️ [MapSpecRenderer] 未知圖層類型: ${layer.type}`);
        }
    }

    /**
     * 確保邊界圖層存在
     */
    async ensureBoundaryLayer(layer) {
        // 使用現有的 loadBoundarySourceForType
        if (typeof loadBoundarySourceForType === 'function') {
            const areaType = layer.source.source_id.includes('admin0') ? 'country' :
                           layer.source.source_id.includes('admin1') ? 'state' : 'city';
            await loadBoundarySourceForType(areaType, true);
        }
    }

    /**
     * 渲染區域上色（choropleth）
     */
    async renderChoropleth(layer) {
        if (!layer.filter || !layer.filter.values) {
            console.warn('⚠️ [MapSpecRenderer] Choropleth layer 缺少 filter.values');
            return;
        }

        const isoCodes = layer.filter.values;
        const fillColor = layer.style.fill_color || '#ff6b6b';
        const strokeColor = layer.style.stroke_color || '#c92a2a';

        // 使用現有的 applyColorToArea 功能
        for (const isoCode of isoCodes) {
            try {
                // 需要找到對應的區域 ID（根據 ISO code）
                const areaId = await this.resolveAreaIdFromIsoCode(isoCode);
                if (areaId) {
                    // 使用現有的函數
                    if (typeof applyColorToArea === 'function') {
                        await applyColorToArea(areaId, 'country', fillColor);
                    } else {
                        // 降級：直接使用 createAreaLayer
                        console.warn('applyColorToArea 不可用，嘗試其他方法');
                    }
                }
            } catch (error) {
                console.error(`❌ [MapSpecRenderer] 無法為 ${isoCode} 上色:`, error);
            }
        }
    }

    /**
     * 渲染地點標註（點位）
     */
    async renderPoints(layer) {
        if (!layer.source || !layer.source.data) {
            console.warn('⚠️ [MapSpecRenderer] Point layer 缺少 source.data');
            return;
        }

        const features = layer.source.data.features || [];
        const markerColor = layer.style.marker_color || '#4c6ef5';
        const markerSize = layer.style.marker_size || 12;

        // 使用現有的 addMarker 功能
        features.forEach(feature => {
            const coords = feature.geometry.coordinates; // [lon, lat]
            const name = feature.properties.name;

            if (typeof addMarker === 'function') {
                addMarker(
                    [coords[1], coords[0]], // Mapbox 使用 [lat, lon]
                    name,
                    markerColor,
                    'circle' // shape
                );
            } else {
                console.warn('addMarker 不可用');
            }
        });
    }

    /**
     * 渲染文字標註
     */
    async renderLabels(layer) {
        // 標註通常與點位一起顯示
        // 這裡可以擴展現有的 marker label 功能
        console.log('📝 [MapSpecRenderer] Label layer 渲染（可擴展）');
    }

    /**
     * 渲染重點高亮
     */
    async renderHighlight(layer) {
        // 類似 choropleth，但使用不同的樣式
        await this.renderChoropleth(layer);
    }

    /**
     * 從 ISO code 解析區域 ID
     */
    async resolveAreaIdFromIsoCode(isoCode) {
        // 這裡需要對應 ISO code 到實際的區域 ID
        // 可以使用現有的 findAreaIdByName 或類似功能
        if (typeof findAreaIdByName === 'function') {
            // 嘗試查找
            return findAreaIdByName(isoCode);
        }
        // 如果找不到，返回 ISO code 本身（某些系統可能直接使用）
        return isoCode;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.MapSpecRenderer = MapSpecRenderer;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapSpecRenderer;
}



