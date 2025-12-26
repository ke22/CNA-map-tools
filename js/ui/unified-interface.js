/**
 * Unified Interface for Map Tool
 * Handles unified search, mode switching, and content management
 */

// Unified UI state
const unifiedUI = {
    currentMode: 'area',
    initialized: false,
    activeFilter: 'all'
};

// Simplified/Traditional Chinese conversion map
const simplifiedToTraditionalMap = {
    '台湾': '台灣',
    '英国': '英國',
    '中国': '中國',
    '美国': '美國'
};

// Country codes reference
const COUNTRY_CODES_REF = (typeof window !== 'undefined' && window.COUNTRY_CODES) || (typeof COUNTRY_CODES !== 'undefined' ? COUNTRY_CODES : {});

/**
 * Initialize Unified Interface
 */
function initializeUnifiedInterface() {
    if (unifiedUI.initialized) {
        // Already initialized, silently return (avoid console spam)
        return;
    }
    
    console.log('🔧 Initializing unified interface...');
    
    // Setup unified search
    setupUnifiedSearch();
    
    // Setup work mode switching
    setupWorkModeSwitching();
    
    // Setup unified content list
    setupUnifiedContentList();
    
    // Setup boundary style selector
    setupBoundaryStyleSelector();
    
    // Sync with existing state
    syncWithExistingState();
    
    unifiedUI.initialized = true;
    console.log('✅ Unified interface initialized');
}

/**
 * Setup Unified Search
 */
function setupUnifiedSearch() {
    const unifiedSearchInput = document.getElementById('unified-search');
    const unifiedSearchResults = document.getElementById('unified-search-results');
    const clearSearchBtn = document.getElementById('clear-unified-search');
    
    if (!unifiedSearchInput || !unifiedSearchResults) {
        console.warn('⚠️ [Unified] Search elements not found');
        return;
    }
    
    // Clear button
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            unifiedSearchInput.value = '';
            unifiedSearchResults.style.display = 'none';
            clearSearchBtn.style.display = 'none';
        });
    }
    
    // Debounced search
    let searchTimeout;
    const performUnifiedSearch = debounce((query) => {
        if (!query || query.trim().length < 2) {
            unifiedSearchResults.style.display = 'none';
            if (clearSearchBtn) clearSearchBtn.style.display = 'none';
            return;
        }
        
        if (clearSearchBtn) clearSearchBtn.style.display = 'block';
        unifiedSearchResults.style.display = 'block';
        unifiedSearchResults.innerHTML = '<div class="search-result-item">搜索中...</div>';
        
        // Detect input type and route to appropriate search
        const input = query.trim();
        const isCoordinate = looksLikeCoordinates(input);
        
        if (isCoordinate) {
            // Coordinate input - handle as marker
            handleCoordinateSearch(input);
        } else {
            // Text input - search for both areas and places
            handleUnifiedTextSearch(input);
        }
    }, 300);
    
    unifiedSearchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        performUnifiedSearch(query);
    });
    
    unifiedSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.trim();
            
            // Check if there are search results visible
            const resultsContainer = document.getElementById('unified-search-results');
            const activeResult = resultsContainer?.querySelector('.search-result-item.active');
            const firstResult = resultsContainer?.querySelector('.search-result-item:not([style*="display: none"])');
            
            if (resultsContainer && resultsContainer.style.display !== 'none') {
                const resultToSelect = activeResult || firstResult;
                if (resultToSelect) {
                    console.log('🔍 [Unified] Enter key pressed, selecting result');
                    resultToSelect.click();
                    return;
                }
            }
            
            if (query.length >= 2) {
                performUnifiedSearch(query);
            }
        } else if (e.key === 'Escape') {
            unifiedSearchInput.value = '';
            unifiedSearchResults.style.display = 'none';
            if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const resultsContainer = document.getElementById('unified-search-results');
            if (!resultsContainer || resultsContainer.style.display === 'none') return;
            
            const results = resultsContainer.querySelectorAll('.search-result-item:not([style*="display: none"])');
            if (results && results.length > 0) {
                const currentActive = resultsContainer.querySelector('.search-result-item.active');
                let nextIndex = 0;
                if (currentActive) {
                    nextIndex = Array.from(results).indexOf(currentActive) + 1;
                    currentActive.classList.remove('active');
                }
                if (nextIndex < results.length) {
                    results[nextIndex].classList.add('active');
                    results[nextIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const resultsContainer = document.getElementById('unified-search-results');
            if (!resultsContainer || resultsContainer.style.display === 'none') return;
            
            const results = resultsContainer.querySelectorAll('.search-result-item:not([style*="display: none"])');
            if (results && results.length > 0) {
                const currentActive = resultsContainer.querySelector('.search-result-item.active');
                let prevIndex = results.length - 1;
                if (currentActive) {
                    prevIndex = Array.from(results).indexOf(currentActive) - 1;
                    currentActive.classList.remove('active');
                }
                if (prevIndex >= 0) {
                    results[prevIndex].classList.add('active');
                    results[prevIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }
        }
    });
    
    // Close results when clicking outside
    document.addEventListener('click', (e) => {
        if (!unifiedSearchInput.contains(e.target) && 
            !unifiedSearchResults.contains(e.target)) {
            unifiedSearchResults.style.display = 'none';
        }
    });
}

/**
 * Handle coordinate search (for markers)
 */
function handleCoordinateSearch(coordinateString) {
    const parsed = parseCoordinates(coordinateString);
    const resultsContainer = document.getElementById('unified-search-results');
    
    if (!parsed) {
        resultsContainer.innerHTML = '<div class="search-result-item">无效的坐标格式。请使用 lat,lng 或 lng,lat</div>';
        return;
    }
    
    const [lng, lat] = parsed;
    const name = `坐标: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const coordId = `coord_${Date.now()}`;
    
    // Store result for batch operations (even single coordinate)
    window.currentSearchResults = [{
        id: coordId,
        name: name,
        type: 'marker',
        center: [lng, lat]
    }];
    
    resultsContainer.innerHTML = `
        <div class="search-result-item active" data-result-index="0">
            <label style="display: flex; align-items: center; cursor: pointer; width: 100%; padding: 8px;">
                <input type="checkbox" class="search-result-checkbox" data-result-index="0" 
                       onchange="handleSearchResultCheckboxChange(this)" 
                       onclick="event.stopPropagation();"
                       style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer; flex-shrink: 0;">
                <div style="flex: 1; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" 
                     onclick="handleUnifiedSearchResult('marker', '${coordId}', '${name}', [${lng}, ${lat}])">
                    <div>
                        <strong>${name}</strong>
                        <div style="color: #666; font-size: 11px; margin-top: 2px;">点击添加到地图</div>
                    </div>
                    <span style="color: #999; font-size: 11px;">📍 坐标</span>
                </div>
            </label>
        </div>
        <div style="padding: 8px; border-top: 1px solid #e0e0e0; background: #f5f5f5; margin-top: 4px;">
            <button id="batch-add-markers-btn" class="btn-primary" style="width: 100%; padding: 10px; font-size: 14px;" onclick="handleBatchAddMarkers()">
                <span class="material-icons" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">add_location</span>
                批量添加標記 (<span id="selected-count">0</span>)
            </button>
            <small style="display: block; text-align: center; color: #666; margin-top: 4px; font-size: 11px;">
                勾選地點後點擊批量添加
            </small>
        </div>
    `;
}

/**
 * Parse coordinates from string
 */
function parseCoordinates(str) {
    const parts = str.split(/[,\s]+/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    if (parts.length !== 2) return null;
    
    const [a, b] = parts;
    // Assume lat,lng if both are reasonable (lat: -90 to 90, lng: -180 to 180)
    if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
        return [b, a]; // Convert to [lng, lat]
    } else {
        return [a, b]; // Assume [lng, lat]
    }
}

/**
 * Check if string looks like coordinates
 */
function looksLikeCoordinates(str) {
    const coordPattern = /^-?\d+\.?\d*[\s,]+-?\d+\.?\d*$/;
    return coordPattern.test(str.trim());
}

/**
 * Handle unified text search
 * Supports multiple keywords separated by spaces (e.g., "台北 東京")
 */
async function handleUnifiedTextSearch(query) {
    const resultsContainer = document.getElementById('unified-search-results');
    const results = [];
    
    // Split query into individual keywords (split by spaces, but preserve quoted strings)
    const keywords = query.trim().split(/\s+/).filter(k => k.length > 0);
    console.log(`🔍 [Unified] Searching for keywords:`, keywords);
    
    // Determine search priority based on current mode
    const currentMode = unifiedUI.currentMode || 'area';
    
    // Search for each keyword separately and combine results
    const allPlaceResults = [];
    const allAreaResults = [];
    
    for (const keyword of keywords) {
        if (currentMode === 'marker') {
            // In marker mode, prioritize marker/place results
            const placeResults = await searchPlacesForMarkers(keyword);
            allPlaceResults.push(...placeResults);
            
            // Also include area results, but with lower priority
            const areaResults = await searchAreasUnified(keyword);
            allAreaResults.push(...areaResults);
        } else {
            // In area mode, prioritize area results
            const areaResults = await searchAreasUnified(keyword);
            allAreaResults.push(...areaResults);
            
            // Also include marker results, but with lower priority
            const placeResults = await searchPlacesForMarkers(keyword);
            allPlaceResults.push(...placeResults);
        }
    }
    
    // Combine results with priority
    if (currentMode === 'marker') {
        results.push(...allPlaceResults);
        results.push(...allAreaResults);
    } else {
        results.push(...allAreaResults);
        results.push(...allPlaceResults);
    }
    
    // Display results
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="search-result-item">未找到結果</div>';
    } else {
        // Remove duplicates
        const uniqueResults = [];
        const seen = new Set();
        results.forEach(result => {
            const key = `${result.name}_${result.type}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueResults.push(result);
            }
        });
        
        const displayResults = uniqueResults.slice(0, 10);
        
        // Store results data for batch operations
        window.currentSearchResults = displayResults;
        
        const resultsHTML = displayResults.map((result, index) => {
            const escapedName = result.name.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
            const escapedId = String(result.id).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
            const centerJson = result.center ? JSON.stringify(result.center) : 'null';
            
            const typeLabels = {
                'country': '🌍 國家',
                'state': '🗺️ 州/省',
                'city': '🏙️ 城市',
                'marker': '📍 地點'
            };
            const typeLabel = typeLabels[result.type] || result.type;
            
            const activeClass = index === 0 ? 'active' : '';
            
            return `
                <div class="search-result-item ${activeClass}" data-result-index="${index}">
                    <label style="display: flex; align-items: center; cursor: pointer; width: 100%; padding: 8px;">
                        <input type="checkbox" class="search-result-checkbox" data-result-index="${index}" 
                               onchange="handleSearchResultCheckboxChange(this)" 
                               onclick="event.stopPropagation();"
                               style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer; flex-shrink: 0;">
                        <div style="flex: 1; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" 
                             onclick="handleUnifiedSearchResult('${result.type}', '${escapedId}', '${escapedName}', ${centerJson})">
                            <div>
                                <strong>${escapedName}</strong>
                                ${result.fullName && result.fullName !== result.name ? 
                                    `<div style="color: #666; font-size: 11px; margin-top: 2px;">${result.fullName.replace(/'/g, '&#39;').replace(/"/g, '&quot;')}</div>` : ''}
                            </div>
                            <span style="color: #999; font-size: 11px; white-space: nowrap; margin-left: 8px;">${typeLabel}</span>
                        </div>
                    </label>
                </div>
            `;
        }).join('');
        
        // Add batch add button if there are marker results (always show if there are any marker results)
        const hasMarkerResults = displayResults.some(r => r.type === 'marker');
        const markerCount = displayResults.filter(r => r.type === 'marker').length;
        
        // Always show batch button if there are any marker-type results
        const batchButtonHTML = hasMarkerResults ? `
            <div style="padding: 8px; border-top: 1px solid #e0e0e0; background: #f5f5f5; margin-top: 4px;">
                <button id="batch-add-markers-btn" class="btn-primary" style="width: 100%; padding: 10px; font-size: 14px; background-color: #004e98; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;" onclick="handleBatchAddMarkers()">
                    <span class="material-icons" style="font-size: 18px; vertical-align: middle;">add_location</span>
                    <span>批量添加標記 (<span id="selected-count">0</span>)</span>
                </button>
                <small style="display: block; text-align: center; color: #666; margin-top: 4px; font-size: 11px;">
                    勾選多個地點後點擊批量添加
                </small>
            </div>
        ` : '';
        
        resultsContainer.innerHTML = resultsHTML + batchButtonHTML;
        resultsContainer.style.display = 'block'; // Ensure results container is visible
        
        // Debug: Log button visibility
        console.log(`🔍 [Unified] Batch button visibility: hasMarkerResults=${hasMarkerResults}, markerCount=${markerCount}, totalResults=${displayResults.length}`);
    }
}

/**
 * Search areas (countries, states, cities) using unified approach
 */
async function searchAreasUnified(query) {
    const results = [];
    
    // Search country codes first
    if (COUNTRY_CODES_REF && Object.keys(COUNTRY_CODES_REF).length > 0) {
        const queryLower = query.toLowerCase().trim();
        
        for (const code in COUNTRY_CODES_REF) {
            const country = COUNTRY_CODES_REF[code];
            const nameEn = country.nameEn || '';
            const nameZh = country.name || '';
            const nameEnLower = nameEn.toLowerCase();
            const nameZhLower = nameZh.toLowerCase();
            
            // Check simplified Chinese conversion
            let nameToCheck = query;
            if (simplifiedToTraditionalMap[query]) {
                nameToCheck = simplifiedToTraditionalMap[query];
            }
            
            if (nameEnLower.includes(queryLower) || 
                nameZh.includes(nameToCheck) ||
                code.toLowerCase().includes(queryLower)) {
                results.push({
                    id: code,
                    name: nameZh || nameEn,
                    fullName: nameZh || nameEn,
                    type: 'country',
                    center: null // Will be set by geocoding if needed
                });
                
                if (results.length >= 10) break;
            }
        }
    }
    
    // Also try Mapbox Geocoding API for more results
    if (typeof CONFIG !== 'undefined' && CONFIG.MAPBOX && CONFIG.MAPBOX.TOKEN) {
        try {
            const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${CONFIG.MAPBOX.TOKEN}&types=country,region,place,district&limit=10&language=zh,en`;
            const response = await fetch(geocodeUrl);
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                data.features.forEach(feature => {
                    const placeTypes = feature.place_type || [];
                    const primaryType = placeTypes[0];
                    
                    // Map Mapbox types to our area types
                    let areaType;
                    if (primaryType === 'country') {
                        areaType = 'country';
                    } else if (primaryType === 'region') {
                        areaType = 'state';
                    } else if (primaryType === 'place' || primaryType === 'district') {
                        areaType = 'city';
                    } else {
                        return; // Skip unknown types
                    }
                    
                    const name = feature.text || feature.place_name;
                    const context = feature.context || [];
                    const countryContext = context.find(c => c.id && c.id.startsWith('country'));
                    const countryCode = countryContext ? countryContext.short_code.toUpperCase() : null;
                    const areaId = countryCode ? `${countryCode}_${feature.id}` : feature.id;
                    
                    results.push({
                        id: areaId,
                        name: name,
                        fullName: feature.place_name,
                        type: areaType,
                        center: feature.center,
                        countryCode: countryCode
                    });
                });
            }
        } catch (error) {
            console.warn('⚠️ [Unified] Geocoding error:', error);
        }
    }
    
    return results;
}

/**
 * Search places for markers using Mapbox Geocoding
 */
async function searchPlacesForMarkers(query) {
    const results = [];
    
    if (typeof CONFIG === 'undefined' || !CONFIG.MAPBOX || !CONFIG.MAPBOX.TOKEN) {
        return results;
    }
    
    try {
        // Remove types restriction to get maximum results
        // Mapbox will return all relevant results including POIs, landmarks, addresses, etc.
        // This ensures we can find places like "中正纪念堂" (Chiang Kai-shek Memorial Hall)
        // Then filter client-side to only include POI/place types (exclude country/region)
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${CONFIG.MAPBOX.TOKEN}&limit=10&language=zh,en`;
        console.log(`🔍 [Unified] Searching places/POIs for: "${query}"`);
        const response = await fetch(geocodeUrl);
        const data = await response.json();
        
        console.log(`📊 [Unified] Mapbox Geocoding returned ${data.features?.length || 0} results for "${query}"`);
        
        if (data.features && data.features.length > 0) {
            // Filter to only include POI, address, place types (exclude country, region)
            const validTypes = ['poi', 'address', 'place', 'district', 'locality', 'neighborhood'];
            
            data.features.forEach((feature, index) => {
                const placeTypes = feature.place_type || [];
                // Only include results that have at least one valid type
                const hasValidType = placeTypes.some(type => validTypes.includes(type));
                
                if (hasValidType) {
                    const name = feature.text || feature.place_name;
                    console.log(`  ✅ ${index + 1}. ${name} (types: ${placeTypes.join(', ')})`);
                    
                    results.push({
                        id: feature.id,
                        name: name,
                        fullName: feature.place_name,
                        type: 'marker',
                        center: feature.center,
                        placeTypes: placeTypes
                    });
                } else {
                    console.log(`  ⏭️  (Skipped: ${feature.text || feature.place_name} - types: ${placeTypes.join(', ')})`);
                }
            });
        } else {
            console.warn(`⚠️ [Unified] No results found for "${query}"`);
        }
    } catch (error) {
        console.error('❌ [Unified] Marker search error:', error);
    }
    
    return results;
}

/**
 * Handle unified search result selection
 */
window.handleUnifiedSearchResult = async function(type, id, name, center) {
    console.log('🔍 [Unified] Selected result:', { type, id, name, center });
    
    // Hide search results
    const resultsContainer = document.getElementById('unified-search-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
    
    const unifiedSearchInput = document.getElementById('unified-search');
    if (unifiedSearchInput) {
        unifiedSearchInput.value = '';
    }
    
    if (type === 'marker') {
        // Marker type: directly add marker
        let coordinates;
        if (typeof center === 'string') {
            const [lng, lat] = center.split(',').map(Number);
            coordinates = [lng, lat];
        } else if (Array.isArray(center) && center.length === 2) {
            coordinates = center;
        } else {
            console.error('❌ [Unified] Invalid coordinates:', center);
            return;
        }
        
        // Zoom to marker first
        if (appState.map && coordinates) {
            appState.map.flyTo({
                center: coordinates,
                zoom: 12,
                duration: 1000
            });
            
            setTimeout(() => {
                if (typeof addMarker === 'function') {
                    addMarker(coordinates, name, appState.currentMarkerColor, appState.currentMarkerShape);
                    
                    setTimeout(() => {
                        if (typeof window.updateMarkersList === 'function') {
                            window.updateMarkersList();
                        }
                        updateUnifiedContentList();
                    }, 200);
                }
            }, 1100);
        }
    } else {
        // Area type: automatically determine and switch to correct mode
        let targetAreaType;
        let targetAdminLevel = null;
        
        if (type === 'country') {
            targetAreaType = 'country';
            // No admin level needed for country
        } else if (type === 'state') {
            targetAreaType = 'administration';
            targetAdminLevel = 'state';
        } else if (type === 'city') {
            targetAreaType = 'administration';
            targetAdminLevel = 'city';
        } else {
            targetAreaType = 'country';
        }
        
        // ============================================
        // 方案 1：完全自动判断 - 同步所有 UI 状态
        // ============================================
        
        // Step 1: Switch area type (updates data source and button state)
        if (appState.currentAreaType !== targetAreaType) {
            if (typeof switchAreaType === 'function') {
                console.log(`🔄 [Unified] Auto-switching area type: ${appState.currentAreaType} → ${targetAreaType}`);
                switchAreaType(targetAreaType);
                
                // Also update unified interface button state explicitly (in case switchAreaType doesn't catch all buttons)
                updateAreaTypeButton(targetAreaType);
                
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Show user feedback
                if (targetAreaType === 'country') {
                    showToastIfAvailable('已自動切換到「國家」模式', 'info', 2000);
                } else {
                    showToastIfAvailable('已自動切換到「行政區」模式', 'info', 2000);
                }
            }
        } else {
            // Even if area type is already correct, ensure UI buttons are in sync
            updateAreaTypeButton(targetAreaType);
        }
        
        // Step 2: Set admin level if needed (for state/city)
        if (targetAdminLevel && appState.preferredAdminLevel !== targetAdminLevel) {
            console.log(`🔄 [Unified] Auto-switching admin level: ${appState.preferredAdminLevel} → ${targetAdminLevel}`);
            setAdminLevel(targetAdminLevel);
            
            // Show user feedback
            if (targetAdminLevel === 'state') {
                showToastIfAvailable('已自動切換到「省/州」層級', 'info', 2000);
            } else if (targetAdminLevel === 'city') {
                showToastIfAvailable('已自動切換到「市」層級', 'info', 2000);
            }
        } else if (targetAdminLevel) {
            // Even if admin level is already correct, ensure UI buttons are in sync
            setAdminLevel(targetAdminLevel);
        }
        
        // Step 3: Load boundary source if needed
        if (typeof loadBoundarySourceForType === 'function') {
            await loadBoundarySourceForType(targetAreaType, false);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Handle ID conversion for country
        let areaId = id;
        if (type === 'country') {
            // Try to extract country code
            if (id.startsWith('country.')) {
                // Try to resolve from name
                const countryCode = await resolveCountryCode(name);
                if (countryCode) {
                    areaId = countryCode;
                } else {
                    areaId = id;
                }
            } else if (id.length === 3 && /^[A-Z]{3}$/.test(id)) {
                // Already a country code
                areaId = id;
            }
        }
        
        // Handle ID conversion for state/city (GADM)
        let hasFlownTo = false;
        if ((type === 'state' || type === 'city') && center && center.length === 2) {
            const needsConversion = id.includes('place.') || id.includes('region.') || 
                                    id.includes('_place.') || id.includes('_region.');
            
            if (needsConversion) {
                // Fly to location first (for ID conversion)
                const targetZoom = type === 'state' ? 6 : 10;
                console.log(`🔄 [Unified] Flying to ${type} for ID conversion at [${center[0]}, ${center[1]}] with zoom ${targetZoom}`);
                appState.map.flyTo({
                    center: center,
                    zoom: targetZoom,
                    duration: 1000
                });
                await new Promise(resolve => setTimeout(resolve, 1100));
                hasFlownTo = true;
                
                // Try to find GADM feature at coordinates
                const convertedId = await convertMapboxIdToGADMGid(id, type, center);
                
                // Check if conversion was successful (GADM GID should start with country code, e.g., "CHN.1.1")
                if (convertedId && convertedId !== id && (convertedId.includes('.') || convertedId.length === 3)) {
                    areaId = convertedId;
                    console.log(`✅ [Unified] Successfully converted Mapbox ID "${id}" to GADM GID "${convertedId}"`);
                } else {
                    console.warn(`⚠️ [Unified] Failed to convert Mapbox ID "${id}" to GADM GID. Using original ID: "${convertedId}"`);
                    // If conversion failed, we can still try to use the original ID
                    // But it might not work with GADM source
                    areaId = convertedId;
                }
            }
        }
        
        // Fly to area center (if not already flown)
        let finalCenter = center;
        
        // If center is null (e.g., for country searches), try to get it
        if (!finalCenter || !Array.isArray(finalCenter) || finalCenter.length !== 2) {
            if (type === 'country' && areaId && areaId.length === 3) {
                // Use Mapbox Geocoding API to get country center (more reliable)
                console.log(`🔍 [Unified] Getting country center via Geocoding API for: ${name || areaId}`);
                try {
                    const countryName = name || (COUNTRY_CODES_REF[areaId]?.nameEn || COUNTRY_CODES_REF[areaId]?.name);
                    if (countryName && typeof CONFIG !== 'undefined' && CONFIG.MAPBOX && CONFIG.MAPBOX.TOKEN) {
                        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(countryName)}.json?access_token=${CONFIG.MAPBOX.TOKEN}&types=country&limit=1`;
                        const response = await fetch(geocodeUrl);
                        if (!response.ok) {
                            throw new Error(`Geocoding API returned ${response.status}`);
                        }
                        const data = await response.json();
                        if (data.features && data.features.length > 0 && data.features[0].center) {
                            finalCenter = data.features[0].center; // [lng, lat]
                            console.log(`✅ [Unified] Got country center from Geocoding API: [${finalCenter[0]}, ${finalCenter[1]}]`);
                        } else {
                            console.warn(`⚠️ [Unified] Geocoding API returned no features for: ${countryName}`);
                        }
                    } else {
                        console.warn(`⚠️ [Unified] Cannot use Geocoding API: countryName=${countryName}, hasToken=${!!(typeof CONFIG !== 'undefined' && CONFIG.MAPBOX && CONFIG.MAPBOX.TOKEN)}`);
                    }
                } catch (geocodeError) {
                    console.warn('⚠️ [Unified] Geocoding API failed:', geocodeError);
                }
            }
        }
        
        // Fly to center if available and not already flown
        if (!hasFlownTo && finalCenter && Array.isArray(finalCenter) && finalCenter.length === 2) {
            const targetZoom = type === 'country' ? 4 : type === 'state' ? 6 : 10;
            
            console.log(`🔄 [Unified] Flying to ${type} at [${finalCenter[0]}, ${finalCenter[1]}] with zoom ${targetZoom}`);
            appState.map.flyTo({
                center: finalCenter,
                zoom: targetZoom,
                duration: 1000
            });
            await new Promise(resolve => setTimeout(resolve, 1100));
        } else if (!hasFlownTo) {
            console.warn('⚠️ [Unified] No center available for flyTo');
        }
        
        // Show preview with color picker (use finalCenter if it was calculated)
        await showAreaPreviewWithColorPicker(areaId, name, type, finalCenter || center);
    }
};

/**
 * Resolve country code from name
 */
async function resolveCountryCode(name) {
    const nameTrimmed = name.trim();
    let nameToSearch = nameTrimmed;
    
    // Check simplified to traditional conversion
    if (simplifiedToTraditionalMap[nameTrimmed]) {
        nameToSearch = simplifiedToTraditionalMap[nameTrimmed];
    }
    
    // Try direct lookup in COUNTRY_CODES
    for (const code in COUNTRY_CODES_REF) {
        const country = COUNTRY_CODES_REF[code];
        if (country.name === nameToSearch || country.name === nameTrimmed ||
            country.nameEn === nameTrimmed || country.nameEn === nameToSearch) {
            return code;
        }
    }
    
    // Try async lookup if function exists
    if (typeof window.findAreaIdByName === 'function') {
        const code = await window.findAreaIdByName(nameTrimmed, 'country');
        if (code && code.length === 3) {
            return code;
        }
    }
    
    return null;
}

/**
 * Convert Mapbox ID to GADM GID
 */
async function convertMapboxIdToGADMGid(mapboxId, areaType, center) {
    if (!appState.map || !center || center.length !== 2) {
        return mapboxId;
    }
    
    try {
        // Ensure visible boundaries layer exists and is visible
        const layerId = `visible-boundaries-${areaType}`;
        if (!appState.map.getLayer(layerId)) {
            if (typeof ensureBoundaryLayerExists === 'function') {
                await ensureBoundaryLayerExists(areaType);
            }
            // Also ensure boundary layer is shown
            if (typeof showBoundaryLayer === 'function') {
                showBoundaryLayer(areaType);
            }
        } else {
            // Ensure layer is visible
            const visibility = appState.map.getLayoutProperty(layerId, 'visibility');
            if (visibility === 'none') {
                console.log(`⚠️ [Unified] Boundary layer ${layerId} is not visible, making it visible...`);
                if (typeof showBoundaryLayer === 'function') {
                    showBoundaryLayer(areaType);
                }
            }
        }
        
        // Wait for layer to be fully rendered (increased wait time and ensure map is idle)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Wait for map to be idle (rendering complete)
        await new Promise(resolve => {
            if (appState.map.loaded()) {
                appState.map.once('idle', resolve);
                // Timeout after 2 seconds
                setTimeout(resolve, 2000);
            } else {
                resolve();
            }
        });
        
        const projectedPoint = appState.map.project(center);
        console.log(`🔍 [Unified] Querying rendered features at [${center[0]}, ${center[1]}] (projected: [${projectedPoint.x}, ${projectedPoint.y}]) on layer ${layerId}`);
        
        // Use larger radius and query multiple times with different radii
        let features = [];
        for (const radius of [50, 100, 200, 500]) {
            const queried = appState.map.queryRenderedFeatures(projectedPoint, {
                layers: [layerId],
                radius: radius
            });
            if (queried && queried.length > 0) {
                features = queried;
                console.log(`✅ [Unified] Found ${features.length} features with radius ${radius}`);
                break;
            }
        }
        
        console.log(`📊 [Unified] Found ${features?.length || 0} rendered features`);
        
        if (features && features.length > 0) {
            const feature = features[0];
            const props = feature.properties || {};
            
            console.log(`🔍 [Unified] First feature properties:`, {
                hasGID_0: !!props.GID_0,
                hasGID_1: !!props.GID_1,
                hasGID_2: !!props.GID_2,
                GID_0: props.GID_0,
                GID_1: props.GID_1,
                GID_2: props.GID_2
            });
            
            if (areaType === 'city' && props.GID_2) {
                console.log(`✅ [Unified] Found GADM GID_2 from rendered features: ${props.GID_2}`);
                return props.GID_2;
            } else if (areaType === 'state' && props.GID_1) {
                console.log(`✅ [Unified] Found GADM GID_1 from rendered features: ${props.GID_1}`);
                return props.GID_1;
            } else {
                console.warn(`⚠️ [Unified] Feature found but missing required GID (type: ${areaType}):`, {
                    hasGID_1: !!props.GID_1,
                    hasGID_2: !!props.GID_2
                });
            }
        } else {
            console.warn(`⚠️ [Unified] No rendered features found at point. Layer ${layerId} visibility:`, 
                appState.map.getLayoutProperty(layerId, 'visibility'));
        }
        
        // Fallback: query source features using bbox around center point
        const sourceId = `gadm-${areaType}`;
        const source = appState.map.getSource(sourceId);
        if (source && source.type === 'geojson' && source._data && source._data.features) {
            console.log(`🔍 [Unified] Attempting fallback: searching in GeoJSON source ${sourceId} (${source._data.features.length} features) to find closest to center [${center[0]}, ${center[1]}]`);
            
            try {
                // Access GeoJSON features directly from source
                const sourceFeatures = source._data.features;
                console.log(`📊 [Unified] Found ${sourceFeatures?.length || 0} total features in ${sourceId}`);
                
                if (!sourceFeatures || sourceFeatures.length === 0) {
                    console.warn(`⚠️ [Unified] No features found in ${sourceId}`);
                    return mapboxId;
                }
                
                // Find closest feature to center
                let closestFeature = null;
                let minDistance = Infinity;
                let checkedCount = 0;
                
                // Use for...of instead of forEach to allow early break
                for (const f of sourceFeatures) {
                    if (f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')) {
                        checkedCount++;
                        try {
                            // Check if point is inside the polygon using ray casting algorithm
                            const isInside = pointInPolygon(center, f.geometry);
                            
                            if (isInside) {
                                // Point is inside this polygon - this is the correct feature, use it immediately
                                console.log(`✅ [Unified] Found feature containing point:`, {
                                    GID_1: f.properties?.GID_1,
                                    GID_2: f.properties?.GID_2,
                                    NAME_1: f.properties?.NAME_1,
                                    NAME_2: f.properties?.NAME_2
                                });
                                closestFeature = f;
                                minDistance = 0; // Inside polygon = distance 0
                                break; // Stop searching - we found the feature containing the point
                            } else {
                                // Calculate distance to feature centroid as fallback (only if no containing feature found yet)
                                if (!closestFeature || minDistance > 0) {
                                    let coords;
                                    if (f.geometry.type === 'Polygon') {
                                        coords = f.geometry.coordinates[0][0];
                                    } else {
                                        // MultiPolygon: use first polygon's first ring
                                        coords = f.geometry.coordinates[0][0][0];
                                    }
                                    
                                    if (coords && coords.length > 0) {
                                        const sumLng = coords.reduce((sum, c) => sum + (c[0] || 0), 0);
                                        const sumLat = coords.reduce((sum, c) => sum + (c[1] || 0), 0);
                                        const featureCenter = [sumLng / coords.length, sumLat / coords.length];
                                        
                                        const distance = Math.sqrt(
                                            Math.pow(center[0] - featureCenter[0], 2) +
                                            Math.pow(center[1] - featureCenter[1], 2)
                                        );
                                        
                                        if (distance < minDistance) {
                                            minDistance = distance;
                                            closestFeature = f;
                                        }
                                    }
                                }
                            }
                        } catch (calcError) {
                            console.warn(`⚠️ [Unified] Error processing feature:`, calcError);
                        }
                    }
                }
                
                console.log(`🔍 [Unified] Checked ${checkedCount} features, closest distance: ${minDistance.toFixed(6)}`);
                
                if (closestFeature) {
                    const props = closestFeature.properties || {};
                    console.log(`🔍 [Unified] Selected feature properties:`, {
                        GID_0: props.GID_0,
                        GID_1: props.GID_1,
                        GID_2: props.GID_2,
                        NAME_1: props.NAME_1,
                        NL_NAME_1: props.NL_NAME_1,
                        NAME_2: props.NAME_2,
                        NL_NAME_2: props.NL_NAME_2
                    });
                    
                    if (areaType === 'city' && props.GID_2) {
                        console.log(`✅ [Unified] Found GADM GID_2: ${props.GID_2}`);
                        return props.GID_2;
                    } else if (areaType === 'state' && props.GID_1) {
                        console.log(`✅ [Unified] Found GADM GID_1: ${props.GID_1}`);
                        return props.GID_1;
                    } else {
                        console.warn(`⚠️ [Unified] Closest feature found but missing required GID:`, {
                            areaType: areaType,
                            hasGID_1: !!props.GID_1,
                            hasGID_2: !!props.GID_2,
                            allProps: Object.keys(props).slice(0, 20)
                        });
                    }
                } else {
                    console.warn(`⚠️ [Unified] No valid feature found near center`);
                }
            } catch (queryError) {
                console.error(`❌ [Unified] Error querying source features:`, queryError);
            }
        } else {
            console.warn(`⚠️ [Unified] GADM source ${sourceId} not available`);
        }
    } catch (error) {
        console.warn('⚠️ [Unified] Error converting Mapbox ID to GADM GID:', error);
    }
    
    return mapboxId;
}

/**
 * Point in Polygon test using ray casting algorithm
 * @param {Array<number>} point - [lng, lat]
 * @param {Object} geometry - GeoJSON geometry (Polygon or MultiPolygon)
 * @returns {boolean} - true if point is inside polygon
 */
function pointInPolygon(point, geometry) {
    const [lng, lat] = point;
    let inside = false;
    
    if (geometry.type === 'Polygon') {
        const coordinates = geometry.coordinates[0]; // Outer ring
        for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
            const xi = coordinates[i][0]; // lng
            const yi = coordinates[i][1]; // lat
            const xj = coordinates[j][0]; // lng
            const yj = coordinates[j][1]; // lat
            
            // Ray casting algorithm: check if ray from point going east intersects edge
            const intersect = ((yi > lat) !== (yj > lat)) &&
                            (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
    } else if (geometry.type === 'MultiPolygon') {
        // Check if point is in any polygon
        for (const polygon of geometry.coordinates) {
            inside = false; // Reset for each polygon
            const coordinates = polygon[0]; // Outer ring of polygon
            for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
                const xi = coordinates[i][0]; // lng
                const yi = coordinates[i][1]; // lat
                const xj = coordinates[j][0]; // lng
                const yj = coordinates[j][1]; // lat
                
                // Ray casting algorithm
                const intersect = ((yi > lat) !== (yj > lat)) &&
                                (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            if (inside) break; // Found in one polygon, no need to check others
        }
    }
    
    return inside;
}

/**
 * Ensure boundary layer exists
 */
async function ensureBoundaryLayerExists(areaType) {
    if (typeof createVisibleBoundaryLayer === 'function') {
        await createVisibleBoundaryLayer(areaType);
    }
}

// Include preview functions from existing code
async function showAreaPreviewWithColorPicker(areaId, areaName, areaType, center) {
    const previewColor = appState.currentColor || '#6CA7A1';
    const previewLayerId = `preview-area-${areaType}-${areaId}`;
    
    if (appState.map.getLayer(previewLayerId)) {
        appState.map.removeLayer(previewLayerId);
    }
    if (appState.map.getSource(`preview-source-${previewLayerId}`)) {
        appState.map.removeSource(`preview-source-${previewLayerId}`);
    }
    
    try {
        let targetAreaType = areaType === 'country' ? 'country' : 'administration';
        if (appState.currentAreaType !== targetAreaType) {
            if (typeof switchAreaType === 'function') {
                switchAreaType(targetAreaType);
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
        
        if (typeof loadBoundarySourceForType === 'function') {
            await loadBoundarySourceForType(targetAreaType, false);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const tempLayerId = previewLayerId;
        const originalBoundaryMode = appState.boundaryMode || 'fill';
        appState.boundaryMode = 'fill';
        
        await createPreviewAreaLayer(areaId, areaName, areaType, previewColor, tempLayerId, 0.4);
        
        console.log(`✅ [Unified] Preview layer created: ${tempLayerId}`);
        
        const mapCenter = appState.map.getCenter();
        const point = center ? { lng: center[0], lat: center[1] } : { lng: mapCenter.lng, lat: mapCenter.lat };
        
        if (typeof showColorPickerPopupForArea === 'function') {
            showColorPickerPopupForArea(point, areaId, areaName, areaType, previewColor, tempLayerId);
        } else if (typeof showColorPickerPopup === 'function') {
            showColorPickerPopup(point, areaId, areaName, areaType, previewColor);
        }
        
    } catch (error) {
        console.error(`❌ [Unified] Error creating preview layer:`, error);
        const mapCenter = appState.map.getCenter();
        const point = center ? { lng: center[0], lat: center[1] } : { lng: mapCenter.lng, lat: mapCenter.lat };
        
        if (typeof showColorPickerPopup === 'function') {
            showColorPickerPopup(point, areaId, areaName, areaType, appState.currentColor);
        }
    }
}

async function createPreviewAreaLayer(areaId, areaName, areaType, color, layerId, opacity) {
    await createAreaLayer(areaId, areaName, areaType, color, layerId, appState.boundaryMode || 'fill');
    
    if (appState.map.getLayer(layerId)) {
        const layer = appState.map.getLayer(layerId);
        if (layer.type === 'fill') {
            appState.map.setPaintProperty(layerId, 'fill-opacity', opacity);
        } else if (layer.type === 'line') {
            appState.map.setPaintProperty(layerId, 'line-opacity', opacity);
        }
    }
}

function showColorPickerPopupForArea(point, areaId, areaName, areaType, currentColor, previewLayerId) {
    const popup = document.getElementById('color-picker-popup');
    if (!popup) {
        console.error('❌ Color picker popup not found');
        applyColorToArea(areaId, areaName, areaType, currentColor).then(() => {
            setTimeout(() => {
                if (typeof window.updateSelectedAreasList === 'function') {
                    window.updateSelectedAreasList();
                }
                updateUnifiedContentList();
            }, 500);
        });
        return;
    }
    
    popup.style.display = 'block';
    
    const colorPicker = document.getElementById('popup-color-picker');
    const hexInput = document.getElementById('popup-color-hex-input');
    const areaNameDisplay = popup.querySelector('.popup-area-name');
    
    if (colorPicker) colorPicker.value = currentColor;
    if (hexInput) hexInput.value = currentColor;
    if (areaNameDisplay) areaNameDisplay.textContent = areaName;
    
    const applyBtn = document.getElementById('apply-color-btn');
    const cancelBtn = document.getElementById('cancel-color-btn');
    
    const updatePreview = () => {
        const selectedColor = colorPicker?.value || hexInput?.value || currentColor;
        if (appState.map.getLayer(previewLayerId)) {
            const layer = appState.map.getLayer(previewLayerId);
            if (layer.type === 'fill') {
                appState.map.setPaintProperty(previewLayerId, 'fill-color', selectedColor);
            } else if (layer.type === 'line') {
                appState.map.setPaintProperty(previewLayerId, 'line-color', selectedColor);
            }
        }
    };
    
    if (colorPicker) {
        colorPicker.removeEventListener('input', updatePreview);
        colorPicker.addEventListener('input', updatePreview);
    }
    if (hexInput) {
        hexInput.removeEventListener('input', updatePreview);
        hexInput.addEventListener('input', updatePreview);
    }
    
    const applyHandler = async () => {
        const selectedColor = colorPicker?.value || hexInput?.value || currentColor;
        
        if (appState.map.getLayer(previewLayerId)) {
            appState.map.removeLayer(previewLayerId);
        }
        const previewSourceId = `preview-source-${previewLayerId}`;
        try {
            if (appState.map.getSource(previewSourceId)) {
                appState.map.removeSource(previewSourceId);
            }
        } catch (e) {}
        
        await applyColorToArea(areaId, areaName, areaType, selectedColor);
        
        if (typeof hideColorPickerPopup === 'function') {
            hideColorPickerPopup();
        } else {
            popup.style.display = 'none';
        }
        
        setTimeout(() => {
            if (typeof window.updateSelectedAreasList === 'function') {
                window.updateSelectedAreasList();
            }
            updateUnifiedContentList();
        }, 500);
    };
    
    const cancelHandler = () => {
        if (appState.map.getLayer(previewLayerId)) {
            appState.map.removeLayer(previewLayerId);
        }
        const previewSourceId = `preview-source-${previewLayerId}`;
        try {
            if (appState.map.getSource(previewSourceId)) {
                appState.map.removeSource(previewSourceId);
            }
        } catch (e) {}
        
        if (typeof hideColorPickerPopup === 'function') {
            hideColorPickerPopup();
        } else {
            popup.style.display = 'none';
        }
    };
    
    if (applyBtn) {
        const newApplyBtn = applyBtn.cloneNode(true);
        applyBtn.parentNode.replaceChild(newApplyBtn, applyBtn);
        document.getElementById('apply-color-btn').addEventListener('click', applyHandler);
    }
    
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        document.getElementById('cancel-color-btn').addEventListener('click', cancelHandler);
    }
    
    // Setup color preset buttons in popup
    const popupPresets = popup.querySelectorAll('.popup-color-presets .color-preset');
    if (popupPresets && popupPresets.length > 0) {
        // Remove old event listeners by cloning
        const presetContainer = popup.querySelector('.popup-color-presets');
        if (presetContainer) {
            const newPresetContainer = presetContainer.cloneNode(true);
            presetContainer.parentNode.replaceChild(newPresetContainer, presetContainer);
            
            // Setup new event listeners for preset buttons
            const newPresets = newPresetContainer.querySelectorAll('.color-preset');
            newPresets.forEach(preset => {
                preset.addEventListener('click', function() {
                    const presetColor = this.dataset.color;
                    if (presetColor) {
                        // Update color picker and hex input
                        if (colorPicker) colorPicker.value = presetColor;
                        if (hexInput) hexInput.value = presetColor.toUpperCase();
                        
                        // Update preview
                        updatePreview();
                        
                        // Update active state
                        newPresets.forEach(p => p.classList.remove('active'));
                        this.classList.add('active');
                    }
                });
            });
            
            // Set active preset based on current color
            newPresets.forEach(preset => {
                if (preset.dataset.color && preset.dataset.color.toLowerCase() === currentColor.toLowerCase()) {
                    preset.classList.add('active');
                } else {
                    preset.classList.remove('active');
                }
            });
        }
    }
}

/**
 * Setup work mode switching
 */
function setupWorkModeSwitching() {
    const modeButtons = document.querySelectorAll('.mode-btn[data-mode]');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-mode');
            switchToMode(mode);
        });
    });
}

function switchToMode(mode) {
    unifiedUI.currentMode = mode;
    
    // Update appState for text mode and marker mode
    if (mode === 'text') {
        appState.textMode = true;
        appState.markerMode = false;
        if (appState.map) {
            appState.map.getCanvas().style.cursor = 'crosshair';
        }
        if (typeof showToast === 'function') {
            showToast('文字模式已啟用：點擊地圖添加文字', 'info');
        }
    } else if (mode === 'marker') {
        appState.textMode = false;
        appState.markerMode = true;
        if (appState.map) {
            appState.map.getCanvas().style.cursor = 'crosshair';
        }
    } else {
        // area mode
        appState.textMode = false;
        appState.markerMode = false;
        if (appState.map) {
            appState.map.getCanvas().style.cursor = '';
        }
    }
    
    // Update button states
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll(`.mode-btn[data-mode="${mode}"]`).forEach(btn => {
        btn.classList.add('active');
    });
    
    // Show/hide mode options
    const areaOptions = document.getElementById('area-mode-options');
    const markerOptions = document.getElementById('marker-mode-options');
    
    if (mode === 'area') {
        if (areaOptions) areaOptions.style.display = 'block';
        if (markerOptions) markerOptions.style.display = 'none';
    } else if (mode === 'marker') {
        if (areaOptions) areaOptions.style.display = 'none';
        if (markerOptions) markerOptions.style.display = 'block';
    } else if (mode === 'text') {
        if (areaOptions) areaOptions.style.display = 'none';
        if (markerOptions) markerOptions.style.display = 'none';
    }
}

/**
 * Update area type button state (國家/行政區)
 * @param {string} areaType - 'country' or 'administration'
 */
function updateAreaTypeButton(areaType) {
    const areaTypeButtons = document.querySelectorAll('.btn-toggle[data-type]');
    areaTypeButtons.forEach(btn => {
        const btnType = btn.getAttribute('data-type');
        if (btnType === areaType) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    console.log(`✅ [Unified] Updated area type button to: ${areaType}`);
}

/**
 * Set admin level and update UI
 * @param {string} level - 'state' | 'city' | 'both'
 */
function setAdminLevel(level) {
    if (!['state', 'city', 'both'].includes(level)) {
        console.warn(`⚠️ [Unified] Invalid admin level: ${level}`);
        return;
    }
    
    // Update app state
    appState.preferredAdminLevel = level;
    
    // Update UI button state
    const adminLevelGroup = document.getElementById('admin-level-group');
    if (adminLevelGroup) {
        const buttons = adminLevelGroup.querySelectorAll('.btn-toggle[data-level]');
        buttons.forEach(btn => {
            if (btn.getAttribute('data-level') === level) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        console.log(`✅ [Unified] Updated admin level to: ${level}`);
    } else {
        console.warn(`⚠️ [Unified] Admin level group not found`);
    }
}

/**
 * Show toast notification (if available)
 */
function showToastIfAvailable(message, type = 'info', duration = 2000) {
    if (typeof showToast === 'function') {
        showToast(message, type, duration);
    } else {
        console.log(`ℹ️ [Unified] ${message}`);
    }
}

/**
 * Setup unified content list
 */
function setupUnifiedContentList() {
    // This will be populated by updateUnifiedContentList
    // Setup filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab[data-filter]');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const filter = tab.getAttribute('data-filter');
            unifiedUI.activeFilter = filter;
            
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            updateUnifiedContentList();
        });
    });
    
    // Setup clear buttons
    const clearAreasBtn = document.getElementById('clear-areas-btn');
    const clearMarkersBtn = document.getElementById('clear-markers-btn-unified');
    
    if (clearAreasBtn) {
        clearAreasBtn.addEventListener('click', () => {
            if (typeof clearAllAreas === 'function') {
                clearAllAreas();
                updateUnifiedContentList();
            }
        });
    }
    
    if (clearMarkersBtn) {
        clearMarkersBtn.addEventListener('click', () => {
            if (typeof clearAllMarkers === 'function') {
                clearAllMarkers();
                updateUnifiedContentList();
            }
        });
    }
}

function updateUnifiedContentList() {
    const listContainer = document.getElementById('unified-content-list');
    if (!listContainer) return;
    
    const filter = unifiedUI.activeFilter || 'all';
    const areas = appState.selectedAreas || [];
    const markers = appState.markers || [];
    
    let items = [];
    
    if (filter === 'all' || filter === 'area') {
        areas.forEach(area => {
            items.push({
                type: 'area',
                id: area.id,
                name: area.name,
                color: area.color,
                areaType: area.type
            });
        });
    }
    
    if (filter === 'all' || filter === 'marker') {
        markers.forEach(marker => {
            items.push({
                type: 'marker',
                id: marker.id,
                name: marker.name,
                color: marker.color,
                coordinates: marker.coordinates
            });
        });
    }
    
    if (items.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">點擊地圖或使用搜索添加內容</p>';
    } else {
        listContainer.innerHTML = items.map(item => {
            if (item.type === 'area') {
                return `
                    <div class="selected-area-item">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="material-icons" style="font-size: 18px;">map</span>
                            <span style="flex: 1;">${item.name}</span>
                            <input type="color" value="${item.color}" onchange="handleUnifiedColorChange('area', '${item.id}', this.value)" style="width: 30px; height: 30px; border: none; cursor: pointer;">
                            <button onclick="removeAreaFromUnifiedList('${item.id}')" class="icon-btn" title="删除">
                                <span class="material-icons">close</span>
                            </button>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="selected-marker-item">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="material-icons" style="font-size: 18px;">place</span>
                            <span style="flex: 1;">${item.name}</span>
                            <input type="color" value="${item.color}" onchange="handleUnifiedColorChange('marker', '${item.id}', this.value)" style="width: 30px; height: 30px; border: none; cursor: pointer;">
                            <button onclick="removeMarkerFromUnifiedList('${item.id}')" class="icon-btn" title="删除">
                                <span class="material-icons">close</span>
                            </button>
                        </div>
                    </div>
                `;
            }
        }).join('');
    }
    
    // Update counts
    const areasCount = document.getElementById('areas-count');
    const markersCount = document.getElementById('markers-count-unified');
    if (areasCount) areasCount.textContent = areas.length;
    if (markersCount) markersCount.textContent = markers.length;
    
    // Show/hide clear buttons
    const clearMarkersBtn = document.getElementById('clear-markers-btn-unified');
    if (clearMarkersBtn) {
        clearMarkersBtn.style.display = markers.length > 0 ? 'block' : 'none';
    }
}

window.handleUnifiedColorChange = function(type, id, color) {
    if (type === 'area') {
        if (typeof updateAreaLayer === 'function') {
            const area = appState.selectedAreas.find(a => a.id === id);
            if (area) {
                area.color = color;
                updateAreaLayer(`area-${area.type}-${id}`, color);
            }
        }
    } else if (type === 'marker') {
        if (typeof updateMarkerIcon === 'function') {
            updateMarkerIcon(id, color);
        }
    }
};

window.removeAreaFromUnifiedList = function(id) {
    if (typeof removeArea === 'function') {
        removeArea(id);
    } else if (typeof clearAllAreas === 'function') {
        // Fallback
        const area = appState.selectedAreas.find(a => a.id === id);
        if (area) {
            const layerId = `area-${area.type}-${id}`;
            if (appState.map.getLayer(layerId)) {
                appState.map.removeLayer(layerId);
            }
            appState.selectedAreas = appState.selectedAreas.filter(a => a.id !== id);
        }
    }
    updateUnifiedContentList();
    if (typeof window.updateSelectedAreasList === 'function') {
        window.updateSelectedAreasList();
    }
};

window.removeMarkerFromUnifiedList = function(id) {
    if (typeof removeMarker === 'function') {
        removeMarker(id);
    }
    updateUnifiedContentList();
    if (typeof window.updateMarkersList === 'function') {
        window.updateMarkersList();
    }
};

/**
 * Setup boundary style selector
 */
function setupBoundaryStyleSelector() {
    const fillBtn = document.getElementById('boundary-style-fill');
    const outlineBtn = document.getElementById('boundary-style-outline');
    
    if (!fillBtn || !outlineBtn) {
        console.warn('⚠️ Boundary style selector buttons not found');
        return;
    }
    
    if (!appState.boundaryMode) {
        appState.boundaryMode = 'fill';
    }
    
    if (appState.boundaryMode === 'fill') {
        fillBtn.classList.add('active');
        outlineBtn.classList.remove('active');
    } else {
        fillBtn.classList.remove('active');
        outlineBtn.classList.add('active');
    }
    
    fillBtn.addEventListener('click', function() {
        appState.boundaryMode = 'fill';
        fillBtn.classList.add('active');
        outlineBtn.classList.remove('active');
        updateAllAreaStyles('fill');
    });
    
    outlineBtn.addEventListener('click', function() {
        appState.boundaryMode = 'outline';
        fillBtn.classList.remove('active');
        outlineBtn.classList.add('active');
        updateAllAreaStyles('outline');
    });
}

function updateAllAreaStyles(newStyle) {
    if (!appState.selectedAreas || appState.selectedAreas.length === 0) return;
    
    // All fills should have transparency (0.5 = 50% opacity, 50% transparent)
    const fillOpacity = 0.5;
    
    appState.selectedAreas.forEach(area => {
        const layerId = `area-${area.type}-${area.id}`;
        if (appState.map && appState.map.getLayer(layerId)) {
            const color = area.color || appState.currentColor;
            
            if (newStyle === 'fill') {
                appState.map.setPaintProperty(layerId, 'fill-color', color);
                appState.map.setPaintProperty(layerId, 'fill-opacity', fillOpacity); // Always transparent
                if (appState.map.getLayoutProperty(layerId, 'visibility') !== 'none') {
                    appState.map.setPaintProperty(layerId, 'line-width', 0);
                }
            } else {
                appState.map.setPaintProperty(layerId, 'fill-opacity', 0); // Outline mode: no fill
                appState.map.setPaintProperty(layerId, 'line-color', color);
                appState.map.setPaintProperty(layerId, 'line-width', 2);
            }
        }
    });
}

/**
 * Sync with existing state
 */
function syncWithExistingState() {
    // Sync mode
    const areaModeBtn = document.querySelector('.mode-btn[data-mode="area"]');
    if (areaModeBtn && areaModeBtn.classList.contains('active')) {
        unifiedUI.currentMode = 'area';
    }
    
    // Update content list
    updateUnifiedContentList();
}

/**
 * Handle search result checkbox change
 */
window.handleSearchResultCheckboxChange = function(checkbox) {
    const selectedCount = document.querySelectorAll('.search-result-checkbox:checked').length;
    const countSpan = document.getElementById('selected-count');
    if (countSpan) {
        countSpan.textContent = selectedCount;
    }
};

/**
 * Handle batch add markers
 */
window.handleBatchAddMarkers = async function() {
    if (!window.currentSearchResults || !Array.isArray(window.currentSearchResults)) {
        console.warn('⚠️ [Unified] No search results available for batch add');
        if (typeof showToast === 'function') {
            showToast('沒有可用的搜索結果', 'info');
        }
        return;
    }
    
    const checkboxes = document.querySelectorAll('.search-result-checkbox:checked');
    if (checkboxes.length === 0) {
        if (typeof showToast === 'function') {
            showToast('請至少選擇一個結果', 'info');
        }
        return;
    }
    
    const selectedResults = [];
    checkboxes.forEach(checkbox => {
        const index = parseInt(checkbox.dataset.resultIndex);
        if (window.currentSearchResults[index]) {
            selectedResults.push(window.currentSearchResults[index]);
        }
    });
    
    // Filter to only marker type results
    const markerResults = selectedResults.filter(r => r.type === 'marker');
    
    if (markerResults.length === 0) {
        if (typeof showToast === 'function') {
            showToast('請選擇地點標記（不包括區域）', 'info');
        }
        return;
    }
    
    console.log(`📍 [Unified] Batch adding ${markerResults.length} markers...`);
    
    // Hide search results
    const resultsContainer = document.getElementById('unified-search-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
    
    const unifiedSearchInput = document.getElementById('unified-search');
    if (unifiedSearchInput) {
        unifiedSearchInput.value = '';
    }
    
    // Add all markers
    let addedCount = 0;
    for (const result of markerResults) {
        try {
            let coordinates;
            if (typeof result.center === 'string') {
                const [lng, lat] = result.center.split(',').map(Number);
                coordinates = [lng, lat];
            } else if (Array.isArray(result.center) && result.center.length === 2) {
                coordinates = result.center;
            } else {
                console.warn(`⚠️ [Unified] Invalid coordinates for ${result.name}:`, result.center);
                continue;
            }
            
            if (typeof addMarker === 'function') {
                addMarker(coordinates, result.name, appState.currentMarkerColor, appState.currentMarkerShape);
                addedCount++;
                
                // Small delay between markers to avoid overwhelming the system
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error) {
            console.error(`❌ [Unified] Error adding marker ${result.name}:`, error);
        }
    }
    
    // Update marker list
    setTimeout(() => {
        if (typeof window.updateMarkersList === 'function') {
            window.updateMarkersList();
        }
        updateUnifiedContentList();
    }, 200);
    
    // Fit bounds to show all markers (optional)
    if (markerResults.length > 0 && appState && appState.map && typeof mapboxgl !== 'undefined') {
        const bounds = new mapboxgl.LngLatBounds();
        markerResults.forEach(result => {
            if (result.center && Array.isArray(result.center) && result.center.length === 2) {
                bounds.extend(result.center);
            }
        });
        
        if (!bounds.isEmpty()) {
            appState.map.fitBounds(bounds, {
                padding: { top: 50, bottom: 50, left: 50, right: 50 },
                duration: 1000
            });
        }
    }
    
    if (typeof showToast === 'function') {
        showToast(`已添加 ${addedCount} 個標記`, 'success');
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUnifiedInterface);
} else {
    // DOM already loaded
    setTimeout(initializeUnifiedInterface, 500);
}

// Also initialize when map is ready
if (typeof appState !== 'undefined' && appState.map) {
    initializeUnifiedInterface();
} else {
    // Wait for map to be initialized
    const checkMapInterval = setInterval(() => {
        if (typeof appState !== 'undefined' && appState.map) {
            clearInterval(checkMapInterval);
            initializeUnifiedInterface();
        }
    }, 100);
    
    // Timeout after 10 seconds
    setTimeout(() => clearInterval(checkMapInterval), 10000);
}
