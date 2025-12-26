/**
 * Location Resolver
 * Resolves location names to coordinates using Mapbox Geocoding API
 */

/**
 * 中文地名的特殊映射表（用于纠正常见的地名解析错误）
 */
const LOCATION_NAME_MAPPINGS = {
    '白宮': 'White House, Washington DC, USA',
    '白宫': 'White House, Washington DC, USA',
    '華盛頓': 'Washington DC, USA',
    '华盛顿': 'Washington DC, USA',
    '華盛頓特區': 'Washington DC, USA',
    '华盛顿特区': 'Washington DC, USA',
    '紐約': 'New York, USA',
    '纽约': 'New York, USA',
    '洛杉磯': 'Los Angeles, USA',
    '洛杉矶': 'Los Angeles, USA',
    '舊金山': 'San Francisco, USA',
    '旧金山': 'San Francisco, USA',
    '倫敦': 'London, UK',
    '伦敦': 'London, UK',
    '巴黎': 'Paris, France',
    '東京': 'Tokyo, Japan',
    '东京': 'Tokyo, Japan',
    '北京': 'Beijing, China',
    '上海': 'Shanghai, China',
    '廣州': 'Guangzhou, China',
    '广州': 'Guangzhou, China',
    '深圳': 'Shenzhen, China',
    '香港': 'Hong Kong',
    '澳門': 'Macau',
    '澳门': 'Macau',
    '台北': 'Taipei, Taiwan',
    '臺北': 'Taipei, Taiwan',
    '高雄': 'Kaohsiung, Taiwan',
    '臺中': 'Taichung, Taiwan',
    '台中': 'Taichung, Taiwan'
};

/**
 * Resolve location name to coordinates using Mapbox Geocoding
 * @param {string} locationName - Name of the location
 * @param {string} countryCode - Optional country code for better results
 * @returns {Promise<Array|null>} - [lng, lat] coordinates or null if not found
 */
async function resolveLocationCoordinates(locationName, countryCode = null) {
    if (!CONFIG || !CONFIG.MAPBOX || !CONFIG.MAPBOX.TOKEN) {
        console.warn('Mapbox token not configured');
        return null;
    }

    const token = CONFIG.MAPBOX.TOKEN;
    const baseUrl = CONFIG.GEOCODING?.BASE_URL || 'https://api.mapbox.com/geocoding/v5/mapbox.places';
    const limit = CONFIG.GEOCODING?.LIMIT || 5;

    // 检查是否有特殊映射
    const mappedName = LOCATION_NAME_MAPPINGS[locationName] || LOCATION_NAME_MAPPINGS[locationName.trim()];
    
    // Build query
    let query = mappedName || locationName;
    if (countryCode && !mappedName) {
        query = `${locationName}, ${countryCode}`;
    }

    const url = `${baseUrl}/${encodeURIComponent(query)}.json?access_token=${token}&limit=${limit}`;

    try {
        console.log(`🌍 Resolving coordinates for: ${locationName}${mappedName ? ` (mapped to: ${mappedName})` : ''}`);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Geocoding API error: ${response.status}`);
        }

        const data = await response.json();
        const features = data.features || [];

        if (features.length === 0) {
            console.warn(`No coordinates found for: ${locationName}`);
            return null;
        }

        // 如果有多个结果，尝试找到最相关的结果
        // 对于映射的名称，优先选择精确匹配的结果
        let bestFeature = features[0];
        if (mappedName && features.length > 1) {
            // 查找最精确匹配的结果（通常是第一个，但可以进一步验证）
            const exactMatch = features.find(f => 
                f.place_type && 
                (f.place_type.includes('place') || f.place_type.includes('poi'))
            );
            if (exactMatch) {
                bestFeature = exactMatch;
            }
        }

        const coords = bestFeature.center; // [lng, lat]
        
        // 验证坐标合理性（可选，用于发现明显错误）
        const [lng, lat] = coords;
        if (Math.abs(lng) > 180 || Math.abs(lat) > 90) {
            console.warn(`⚠️ Invalid coordinates returned for ${locationName}: [${lng}, ${lat}]`);
            return null;
        }

        console.log(`✅ Resolved ${locationName} to: [${coords[0]}, ${coords[1]}]`);
        return coords;

    } catch (error) {
        console.error(`Failed to resolve coordinates for ${locationName}:`, error);
        return null;
    }
}

/**
 * Resolve multiple locations in batch (with rate limiting)
 * @param {Array} locations - Array of location objects with name property
 * @param {number} delay - Delay between requests (ms)
 * @returns {Promise<Array>} - Array of locations with resolved coordinates
 */
async function resolveLocationsBatch(locations, delay = 200) {
    const results = [];

    for (const location of locations) {
        // If coordinates already exist, skip
        if (location.coords) {
            results.push(location);
            continue;
        }

        // Resolve coordinates
        const coords = await resolveLocationCoordinates(location.name, location.country);
        
        results.push({
            ...location,
            coords: coords
        });

        // Rate limiting delay
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    return results;
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.resolveLocationCoordinates = resolveLocationCoordinates;
    window.resolveLocationsBatch = resolveLocationsBatch;
}





