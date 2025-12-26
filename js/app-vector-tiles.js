/**
 * Vector Tiles Integration
 * 使用矢量瓦片替代原始 GeoJSON
 * 
 * 優點：
 * - 最佳性能
 * - 只加載可見區域
 * - 自動簡化
 */

// Mapbox Tilesets 配置
const VECTOR_TILES_CONFIG = {
    // 使用 Mapbox Tilesets API
    // 格式：mapbox://username.tileset-id
    TILESETS: {
        country: 'mapbox://your-username.gadm-level0',  // 更新為您的 Tileset ID
        state: 'mapbox://your-username.gadm-level1',
        city: 'mapbox://your-username.gadm-level2'
    },
    
    // 或使用自建瓦片服務器
    // TILESETS: {
    //     country: 'http://localhost:8080/data/gadm-level0/{z}/{x}/{y}.pbf',
    //     state: 'http://localhost:8080/data/gadm-level1/{z}/{x}/{y}.pbf',
    //     city: 'http://localhost:8080/data/gadm-level2/{z}/{x}/{y}.pbf'
    // }
};

/**
 * 加載矢量瓦片源
 */
async function loadVectorTilesSource(areaType) {
    const sourceTypeKey = areaType === 'country' ? 'adm0' : 
                         areaType === 'state' ? 'adm1' : 'adm2';
    const sourceId = `vector-${areaType}`;
    const tilesetId = VECTOR_TILES_CONFIG.TILESETS[areaType];
    
    // 檢查是否已加載
    if (appState.sources[sourceTypeKey] && appState.sources[sourceTypeKey].loaded) {
        return Promise.resolve();
    }
    
    console.log(`🗺️  加載矢量瓦片: ${areaType} from ${tilesetId}`);
    
    try {
        // 檢查源是否已存在
        if (appState.map.getSource(sourceId)) {
            console.log(`  ℹ️  源 ${sourceId} 已存在`);
            appState.sources[sourceTypeKey] = {
                id: sourceId,
                loaded: true,
                type: 'vector'
            };
            return Promise.resolve();
        }
        
        // 判斷是 Mapbox Tilesets 還是自建服務器
        const isMapboxTileset = tilesetId.startsWith('mapbox://');
        
        if (isMapboxTileset) {
            // 使用 Mapbox Tilesets API
            appState.map.addSource(sourceId, {
                'type': 'vector',
                'url': tilesetId
            });
        } else {
            // 使用自建瓦片服務器
            appState.map.addSource(sourceId, {
                'type': 'vector',
                'tiles': [tilesetId],
                'minzoom': 0,
                'maxzoom': 14
            });
        }
        
        // 標記為已加載
        appState.sources[sourceTypeKey] = {
            id: sourceId,
            loaded: true,
            type: 'vector'
        };
        
        console.log(`  ✅ 矢量瓦片源加載成功: ${sourceId}`);
        
        // 如果這是當前活動的邊界類型，創建可見層
        if (appState.currentAreaType === areaType || 
            (appState.currentAreaType === 'administration' && (areaType === 'state' || areaType === 'city'))) {
            createVectorTilesVisibleLayer(areaType, sourceId);
        }
        
    } catch (error) {
        console.error(`❌ 加載矢量瓦片失敗 (${areaType}):`, error);
        
        appState.sources[sourceTypeKey] = {
            id: sourceId,
            loaded: false,
            error: error.message
        };
        
        throw error;
    }
}

/**
 * 創建可見的矢量瓦片層
 */
function createVectorTilesVisibleLayer(areaType, sourceId) {
    const layerId = `visible-vector-${areaType}`;
    const sourceLayer = areaType === 'country' ? 'country' : 
                       areaType === 'state' ? 'state' : 'city';
    
    // 移除現有層（如果存在）
    if (appState.map.getLayer(layerId)) {
        appState.map.removeLayer(layerId);
    }
    
    // 創建填充層（透明，用於點擊檢測）
    appState.map.addLayer({
        'id': layerId,
        'type': 'fill',
        'source': sourceId,
        'source-layer': sourceLayer,
        'paint': {
            'fill-color': '#000',
            'fill-opacity': 0.01  // 幾乎透明，但仍可查詢
        }
    }, 'country-label');  // 放在標籤層之前
    
    // 創建線條層（顯示邊界）
    const lineLayerId = `${layerId}-line`;
    if (!appState.map.getLayer(lineLayerId)) {
        appState.map.addLayer({
            'id': lineLayerId,
            'type': 'line',
            'source': sourceId,
            'source-layer': sourceLayer,
            'paint': {
                'line-color': '#888',
                'line-width': 1,
                'line-opacity': 0.5
            }
        }, 'country-label');
    }
    
    console.log(`  ✅ 創建可見矢量層: ${layerId}`);
}

/**
 * 查詢矢量瓦片中的要素
 */
function queryVectorTilesFeatures(point, areaType) {
    const sourceId = `vector-${areaType}`;
    const layerId = `visible-vector-${areaType}`;
    const sourceLayer = areaType === 'country' ? 'country' : 
                       areaType === 'state' ? 'state' : 'city';
    
    // 查詢可見層
    const features = appState.map.queryRenderedFeatures(point, {
        layers: [layerId],
        radius: 15
    });
    
    if (features.length > 0) {
        // 從矢量瓦片獲取完整屬性
        const feature = features[0];
        
        // 查詢源層獲取完整數據
        const sourceFeatures = appState.map.querySourceFeatures(sourceId, {
            sourceLayer: sourceLayer,
            filter: ['==', ['get', 'GID_0'], feature.properties.GID_0 || '']
        });
        
        if (sourceFeatures.length > 0) {
            return sourceFeatures[0];
        }
        
        return feature;
    }
    
    return null;
}

/**
 * 獲取區域 ID（適配矢量瓦片）
 */
function getVectorTilesAreaId(feature, areaType) {
    // 矢量瓦片中可能使用不同的屬性名稱
    // 根據實際的 Tileset 屬性調整
    
    if (areaType === 'country') {
        return feature.properties.GID_0 || 
               feature.properties.ISO_A3 || 
               feature.properties.iso_a3;
    } else if (areaType === 'state') {
        return feature.properties.GID_1 || 
               feature.properties.NAME_1;
    } else {
        return feature.properties.GID_2 || 
               feature.properties.NAME_2;
    }
}

/**
 * 獲取區域名稱（適配矢量瓦片）
 */
function getVectorTilesAreaName(feature, areaType) {
    if (areaType === 'country') {
        return feature.properties.NAME_0 || 
               feature.properties.NAME || 
               feature.properties.name;
    } else if (areaType === 'state') {
        return feature.properties.NAME_1 || 
               feature.properties.name;
    } else {
        return feature.properties.NAME_2 || 
               feature.properties.name;
    }
}

// 導出函數（如果在模塊環境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadVectorTilesSource,
        createVectorTilesVisibleLayer,
        queryVectorTilesFeatures,
        getVectorTilesAreaId,
        getVectorTilesAreaName
    };
}


