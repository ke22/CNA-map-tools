/**
 * Agent Adapter
 * 
 * 適配器層：轉換 Agent 格式與現有格式
 * - GeoTargets (Agent 格式) ↔ {areas, locations, mapDesign} (現有格式)
 */

/**
 * 將 GeoTargets 格式轉換為現有的 {areas, locations, mapDesign} 格式
 * @param {Object} geoTargets - GeoTargets 對象
 * @returns {Object} - {areas, locations, mapDesign}
 */
function convertGeoTargetsToLegacyFormat(geoTargets) {
    if (!geoTargets || !geoTargets.candidates) {
        return {
            areas: [],
            locations: [],
            mapDesign: null
        };
    }

    const areas = [];
    const locations = [];

    geoTargets.candidates.forEach(target => {
        if (target.type === 'region') {
            // 轉換為 area 格式
            const area = {
                name: target.name,
                iso_code: target.resolved?.iso_code || null,
                type: target.resolved?.admin_level === 'admin0' ? 'country' :
                      target.resolved?.admin_level === 'admin1' ? 'state' :
                      target.resolved?.admin_level === 'admin2' ? 'city' : 'country',
                gadm_level: target.resolved?.admin_level === 'admin0' ? 0 :
                           target.resolved?.admin_level === 'admin1' ? 1 :
                           target.resolved?.admin_level === 'admin2' ? 2 : 0,
                priority: Math.max(1, Math.min(5, Math.round((1 - target.confidence) * 4 + 1))), // confidence 0-1 → priority 1-5
                suggestedColor: target.color || '#6CA7A1',
                reason: target.evidence_span || '',
                // Agent 特定字段
                _agent: {
                    id: target.id,
                    confidence: target.confidence,
                    validated: target.resolved?.validated || false,
                    needs_review: target.resolved?.needs_review || false,
                    suggestion: target.resolved?.suggestion || null,
                    entities: target.resolved?.entities || null, // 多實體（如納卡區）
                    canonical: target.resolved?.canonical || null
                }
            };

            areas.push(area);
        } else if (target.type === 'place') {
            // 轉換為 location 格式
            const location = {
                name: target.name,
                type: target.resolved?.type || 'city',
                country: target.resolved?.country_code || null,
                coordinates: target.resolved?.coordinates || 
                            (target.resolved?.lon && target.resolved?.lat 
                                ? [target.resolved.lon, target.resolved.lat] 
                                : null),
                priority: Math.max(1, Math.min(5, Math.round((1 - target.confidence) * 4 + 1))), // confidence 0-1 → priority 1-5
                context: target.evidence_span || '',
                // Agent 特定字段
                _agent: {
                    id: target.id,
                    confidence: target.confidence,
                    validated: target.resolved?.validated || false,
                    needs_review: target.resolved?.needs_review || false,
                    suggestion: target.resolved?.suggestion || null
                }
            };

            locations.push(location);
        }
    });

    // 按優先級排序
    areas.sort((a, b) => a.priority - b.priority);
    locations.sort((a, b) => a.priority - b.priority);

    // mapDesign 暫時為 null（Agent 架構中還沒有實現）
    const mapDesign = null;

    return {
        areas,
        locations,
        mapDesign
    };
}

/**
 * 將現有的 {areas, locations, mapDesign} 格式轉換為 GeoTargets 格式
 * @param {Object} legacyResults - 現有格式的結果
 * @param {string} sourceText - 原始新聞文本（可選）
 * @returns {Object} - GeoTargets 對象
 */
function convertLegacyFormatToGeoTargets(legacyResults, sourceText = '') {
    const candidates = [];
    let timestamp = Date.now();

    // 轉換 areas
    if (legacyResults.areas && Array.isArray(legacyResults.areas)) {
        legacyResults.areas.forEach((area, index) => {
            // 確定 admin_level
            let adminLevel = 'admin0';
            if (area.gadm_level !== undefined) {
                adminLevel = `admin${area.gadm_level}`;
            } else if (area.type === 'country') {
                adminLevel = 'admin0';
            } else if (area.type === 'state') {
                adminLevel = 'admin1';
            } else if (area.type === 'city') {
                adminLevel = 'admin2';
            }

            const target = {
                id: area._agent?.id || `region_${timestamp}_${index}`,
                type: 'region',
                name: area.name,
                confidence: area._agent?.confidence || (1 - (area.priority - 1) / 4), // priority 1-5 → confidence 1-0.25
                evidence_span: area.reason || '',
                evidence_start: -1,
                evidence_end: -1,
                resolved: {
                    admin_level: adminLevel,
                    iso_code: area.iso_code || null,
                    validated: area._agent?.validated || false,
                    needs_review: area._agent?.needs_review || false,
                    suggestion: area._agent?.suggestion || null,
                    entities: area._agent?.entities || null,
                    canonical: area._agent?.canonical || null
                }
            };

            if (area._agent?.color) {
                target.color = area._agent.color;
            }

            candidates.push(target);
        });
    }

    // 轉換 locations
    if (legacyResults.locations && Array.isArray(legacyResults.locations)) {
        legacyResults.locations.forEach((location, index) => {
            let coordinates = null;
            if (location.coordinates && Array.isArray(location.coordinates)) {
                coordinates = location.coordinates;
            } else if (location.coords && Array.isArray(location.coords)) {
                coordinates = location.coords;
            }

            const target = {
                id: location._agent?.id || `place_${timestamp}_${index}`,
                type: 'place',
                name: location.name,
                confidence: location._agent?.confidence || (1 - (location.priority - 1) / 4), // priority 1-5 → confidence 1-0.25
                evidence_span: location.context || '',
                evidence_start: -1,
                evidence_end: -1,
                resolved: {
                    coordinates: coordinates,
                    country_code: location.country || null,
                    validated: location._agent?.validated || false,
                    needs_review: location._agent?.needs_review || false,
                    suggestion: location._agent?.suggestion || null
                }
            };

            if (coordinates && coordinates.length >= 2) {
                target.resolved.lon = coordinates[0];
                target.resolved.lat = coordinates[1];
            }

            candidates.push(target);
        });
    }

    return {
        source_text: sourceText,
        source_url: null,
        timestamp: new Date().toISOString(),
        candidates: candidates,
        selected_ids: []
    };
}

/**
 * 從 GeoTargets 中提取驗證統計信息
 * @param {Object} geoTargets - GeoTargets 對象
 * @returns {Object} - {total, validated, needsReview, errors}
 */
function getValidationStats(geoTargets) {
    if (!geoTargets || !geoTargets.candidates) {
        return {
            total: 0,
            validated: 0,
            needsReview: 0,
            errors: []
        };
    }

    let validated = 0;
    let needsReview = 0;
    const errors = [];

    geoTargets.candidates.forEach(target => {
        if (target.resolved) {
            if (target.resolved.validated === true) {
                validated++;
            }
            if (target.resolved.needs_review === true) {
                needsReview++;
                if (target.resolved.suggestion) {
                    errors.push({
                        name: target.name,
                        type: target.type,
                        suggestion: target.resolved.suggestion
                    });
                }
            }
        }
    });

    return {
        total: geoTargets.candidates.length,
        validated,
        needsReview,
        errors
    };
}

// Export
if (typeof window !== 'undefined') {
    window.convertGeoTargetsToLegacyFormat = convertGeoTargetsToLegacyFormat;
    window.convertLegacyFormatToGeoTargets = convertLegacyFormatToGeoTargets;
    window.getValidationStats = getValidationStats;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        convertGeoTargetsToLegacyFormat,
        convertLegacyFormatToGeoTargets,
        getValidationStats
    };
}

