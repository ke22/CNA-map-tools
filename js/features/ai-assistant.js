/**
 * AI Assistant Feature
 * Integrates Gemini AI for automatic news analysis and map annotation
 */

// Store AI results temporarily
let aiExtractionResults = null;

// Preset colors for areas (matching app-enhanced.js color presets)
const PRESET_COLORS = ['#6CA7A1', '#496F96', '#E05C5A', '#EDBD76', '#E8DFCF', '#B5CBCD'];

/**
 * Initialize AI Assistant UI and event handlers
 */
function setupAIAssistant() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupAIAssistant);
        return;
    }

    const newsInput = document.getElementById('news-input');
    const analyzeBtn = document.getElementById('analyze-news-btn');
    const loadingDiv = document.getElementById('ai-loading');
    const resultsPreview = document.getElementById('ai-results-preview');
    const resultsContent = document.getElementById('ai-results-content');
    const applyBtn = document.getElementById('apply-ai-results-btn');
    const discardBtn = document.getElementById('discard-ai-results-btn');

    if (!newsInput || !analyzeBtn) {
        console.warn('AI Assistant UI elements not found');
        return;
    }

    // Helper function to fetch article content from URL
    async function fetchArticleFromURL(url) {
        try {
            // Try to fetch the URL - this will work for some APIs or CORS-enabled sites
            // For most news sites, you'll need a backend proxy due to CORS
            const response = await fetch(url, {
                mode: 'cors',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            
            // Simple extraction - try to get main content
            // This is a basic implementation - for production, use a proper article extraction library
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Try common article selectors
            const articleSelectors = [
                'article',
                '[role="article"]',
                '.article-content',
                '.post-content',
                '.entry-content',
                'main',
                '.content'
            ];
            
            let articleText = '';
            for (const selector of articleSelectors) {
                const element = doc.querySelector(selector);
                if (element) {
                    articleText = element.innerText || element.textContent;
                    if (articleText.length > 200) break; // Got substantial content
                }
            }
            
            // Fallback: get body text
            if (!articleText || articleText.length < 200) {
                articleText = doc.body.innerText || doc.body.textContent;
            }
            
            return articleText.trim();
        } catch (error) {
            console.error('Failed to fetch article from URL:', error);
            throw new Error(`无法获取文章内容: ${error.message}。请直接粘贴文章文本。`);
        }
    }
    
    // Helper function to detect if input is a URL
    function isURL(str) {
        try {
            const url = new URL(str);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    }
    
    // Analyze function (shared by button click and Enter key)
    async function performAnalysis() {
        let newsText = newsInput.value.trim();

        if (!newsText) {
            showToast('请先粘贴新闻文章内容或链接', 'error');
            return;
        }
        
        // Check if input is a URL
        if (isURL(newsText)) {
            showToast('正在获取文章内容...', 'info');
            analyzeBtn.disabled = true;
            loadingDiv.style.display = 'block';
            
            try {
                newsText = await fetchArticleFromURL(newsText);
                newsInput.value = newsText; // Update input with fetched content
                showToast('文章内容已获取，正在分析...', 'success');
            } catch (error) {
                showToast(error.message || '无法获取文章内容，请直接粘贴文本', 'error');
                analyzeBtn.disabled = false;
                loadingDiv.style.display = 'none';
                return;
            }
        }

        // Check if Gemini is enabled
        if (!CONFIG?.GEMINI?.ENABLED) {
            showToast('AI Assistant is not enabled. Please configure Gemini API key in config.js', 'error');
            analyzeBtn.disabled = false;
            loadingDiv.style.display = 'none';
            return;
        }

        // Show loading
        analyzeBtn.disabled = true;
        loadingDiv.style.display = 'block';
        resultsPreview.style.display = 'none';
        aiExtractionResults = null;

        try {
            // Call Gemini API
            const rawResults = await analyzeNewsWithGemini(newsText);

            // Validate and normalize results
            const validatedResults = validateAIResults(rawResults);

            // Resolve coordinates for locations without coordinates
            const locationsWithCoords = await resolveLocationsBatch(validatedResults.locations);

            // Store results
            aiExtractionResults = {
                locations: locationsWithCoords,
                areas: validatedResults.areas,
                mapDesign: validatedResults.mapDesign || null
            };

            // Display results preview
            displayResultsPreview(aiExtractionResults, resultsContent);
            resultsPreview.style.display = 'block';

            showToast('News analyzed successfully! Review and apply to map.', 'success');

        } catch (error) {
            console.error('AI analysis error:', error);
            showToast(`Analysis failed: ${error.message}`, 'error');
        } finally {
            analyzeBtn.disabled = false;
            loadingDiv.style.display = 'none';
        }
    }
    
    // Analyze button click handler
    analyzeBtn.addEventListener('click', performAnalysis);
    
    // Enter key support for textarea
    if (newsInput) {
        newsInput.addEventListener('keydown', function(e) {
            // Enter key (but allow Shift+Enter for new lines)
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                performAnalysis();
            }
        });
    }

    // Apply results button
    if (applyBtn) {
        applyBtn.addEventListener('click', async function() {
            if (!aiExtractionResults) {
                showToast('没有可应用的结果', 'error');
                return;
            }

            // Disable button during application
            applyBtn.disabled = true;
            applyBtn.textContent = '正在应用...';

            try {
                // Get selected items from checkboxes
                const selectedAreas = [];
                const selectedLocations = [];
                
                // Get selected areas
                document.querySelectorAll('.ai-result-checkbox[data-type="area"]:checked').forEach(checkbox => {
                    const index = parseInt(checkbox.dataset.index);
                    const colorSelector = document.querySelector(`.ai-area-color-selector[data-index="${index}"]`);
                    const presetColor = colorSelector ? colorSelector.value : PRESET_COLORS[index % PRESET_COLORS.length];
                    const area = aiExtractionResults.areas[index];
                    if (area) {
                        selectedAreas.push({
                            ...area,
                            presetColor: presetColor // Use preset color instead of AI suggested color
                        });
                    }
                });
                
                // Get selected locations
                document.querySelectorAll('.ai-result-checkbox[data-type="location"]:checked').forEach(checkbox => {
                    const index = parseInt(checkbox.dataset.index);
                    const location = aiExtractionResults.locations[index];
                    if (location) {
                        selectedLocations.push(location);
                    }
                });
                
                // Create filtered results with selected items
                const filteredResults = {
                    areas: selectedAreas,
                    locations: selectedLocations,
                    mapDesign: aiExtractionResults.mapDesign
                };
                
                // Apply results to map (this is async)
                await applyAIResultsToMap(filteredResults);
                
                // Hide preview and clear input after successful application
                resultsPreview.style.display = 'none';
                newsInput.value = '';
                aiExtractionResults = null;
                
            } catch (error) {
                console.error('Error applying results:', error);
                showToast(`应用失败: ${error.message}`, 'error');
            } finally {
                // Re-enable button
                applyBtn.disabled = false;
                applyBtn.innerHTML = '<span class="material-icons" style="font-size: 18px; vertical-align: middle;">check</span>应用到地图';
            }
        });
    }

    // Discard results button
    if (discardBtn) {
        discardBtn.addEventListener('click', function() {
            resultsPreview.style.display = 'none';
            aiExtractionResults = null;
        });
    }
}

/**
 * Display extracted results in preview panel
 */
function displayResultsPreview(results, container) {
    if (!container || !results) return;

    let html = '';

    // Display map design suggestions if available
    if (results.mapDesign) {
        html += '<div style="margin-bottom: 16px; padding: 12px; background: #e3f2fd; border-radius: 4px; border-left: 3px solid #2196F3;">';
        html += '<strong style="font-size: 13px; color: #1976D2; display: block; margin-bottom: 8px;">🗺️ 地图设计建议</strong>';
        
        if (results.mapDesign.title) {
            html += `<div style="font-size: 12px; margin-bottom: 4px;"><strong>标题:</strong> ${results.mapDesign.title}</div>`;
        }
        if (results.mapDesign.description) {
            html += `<div style="font-size: 12px; margin-bottom: 4px; color: #555;"><strong>说明:</strong> ${results.mapDesign.description}</div>`;
        }
        if (results.mapDesign.suggestedStyle) {
            html += `<div style="font-size: 12px; margin-bottom: 4px;"><strong>建议样式:</strong> ${results.mapDesign.suggestedStyle}</div>`;
        }
        if (results.mapDesign.suggestedZoom) {
            html += `<div style="font-size: 12px;"><strong>建议缩放级别:</strong> ${results.mapDesign.suggestedZoom}</div>`;
        }
        html += '</div>';
    }

    // Preset colors for areas (from app-enhanced.js color presets)
    const PRESET_COLORS = ['#6CA7A1', '#496F96', '#E05C5A', '#EDBD76', '#E8DFCF', '#B5CBCD'];
    
    // Display areas (countries/regions) with checkboxes and preset color selector
    if (results.areas && results.areas.length > 0) {
        html += '<div style="margin-bottom: 16px;">';
        html += '<strong style="font-size: 13px; color: #333; display: block; margin-bottom: 8px;">🎨 主要标注地区 (' + results.areas.length + ' 个) - 选择要应用的项目</strong>';
        html += '<div style="max-height: 200px; overflow-y: auto;">';
        const sortedAreas = sortByPriority(results.areas);
        sortedAreas.forEach((area, index) => {
            const areaId = `area-${index}`;
            const priorityBadge = area.priority <= 2 
                ? `<span style="background: #ff5722; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-right: 6px;">重要</span>`
                : '';
            const reasonText = area.reason ? `<div style="font-size: 11px; color: #757575; margin-left: 56px; margin-top: 2px;">${area.reason}</div>` : '';
            
            // Use preset color (rotate through presets based on index)
            const presetColor = PRESET_COLORS[index % PRESET_COLORS.length];
            
            html += `<div style="padding: 8px; margin-bottom: 6px; background: #f9f9f9; border-radius: 4px; border-left: 3px solid ${presetColor};">`;
            html += `<div style="display: flex; align-items: center;">`;
            html += `<input type="checkbox" class="ai-result-checkbox" data-type="area" data-index="${index}" checked style="margin-right: 8px; cursor: pointer;">`;
            html += `<div style="display: inline-flex; align-items: center; margin-right: 8px;">`;
            html += `<select class="ai-area-color-selector" data-index="${index}" style="width: 60px; height: 24px; border: 1px solid #ddd; border-radius: 3px; cursor: pointer; margin-right: 8px;">`;
            PRESET_COLORS.forEach(color => {
                const selected = color === presetColor ? 'selected' : '';
                html += `<option value="${color}" ${selected} style="background: ${color};">${color}</option>`;
            });
            html += `</select>`;
            html += `</div>`;
            html += `<span style="font-weight: 500; font-size: 13px;">${area.name}</span>`;
            html += `<span style="font-size: 11px; color: #757575; margin-left: 8px;">(${area.type})</span>${priorityBadge}`;
            html += `</div>`;
            html += reasonText;
            html += '</div>';
        });
        html += '</div>';
        html += '</div>';
    }

    // Display locations (markers) with checkboxes
    if (results.locations && results.locations.length > 0) {
        html += '<div>';
        html += '<strong style="font-size: 13px; color: #333; display: block; margin-bottom: 8px;">📍 地点标记 (' + results.locations.length + ' 个) - 选择要应用的项目</strong>';
        html += '<div style="max-height: 200px; overflow-y: auto;">';
        const sortedLocations = sortByPriority(results.locations);
        sortedLocations.forEach((loc, index) => {
            const priorityBadge = loc.priority <= 2 
                ? `<span style="background: #ff5722; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-right: 6px;">重要</span>`
                : '';
            const statusIcon = loc.coords 
                ? `<span style="color: #4caf50; font-size: 16px; margin-right: 6px;">✓</span>`
                : `<span style="color: #ff9800; font-size: 16px; margin-right: 6px; animation: pulse 1.5s infinite;">⏳</span>`;
            const coordText = loc.coords 
                ? `<div style="font-size: 11px; color: #757575; margin-top: 2px; margin-left: 32px;">坐标: ${loc.coords[1].toFixed(4)}, ${loc.coords[0].toFixed(4)}</div>`
                : '<div style="font-size: 11px; color: #ff9800; margin-top: 2px; margin-left: 32px;">正在解析坐标...</div>';
            const contextText = loc.context ? `<div style="font-size: 11px; color: #555; margin-top: 2px; margin-left: 32px; font-style: italic;">${loc.context}</div>` : '';
            
            html += `<div style="padding: 8px; margin-bottom: 6px; background: #f9f9f9; border-radius: 4px; border-left: 3px solid #007AFF;">`;
            html += `<div style="display: flex; align-items: center;">`;
            html += `<input type="checkbox" class="ai-result-checkbox" data-type="location" data-index="${index}" checked style="margin-right: 8px; cursor: pointer;">`;
            html += `${statusIcon}<span style="font-weight: 500; font-size: 13px;">${formatLocationForDisplay(loc)}</span>${priorityBadge}`;
            html += `</div>`;
            html += coordText;
            html += contextText;
            html += '</div>';
        });
        html += '</div>';
        html += '</div>';
    }

    if (!html) {
        html = '<p style="color: #757575; font-size: 13px; padding: 16px; text-align: center;">未在新闻文本中找到地点信息。请检查文本是否包含地理位置相关内容。</p>';
    }

    // Add summary stats
    if (results.areas && results.areas.length > 0 || results.locations && results.locations.length > 0) {
        const totalAreas = results.areas ? results.areas.length : 0;
        const totalLocations = results.locations ? results.locations.length : 0;
        html += `<div style="margin-top: 16px; padding: 8px; background: #f0f0f0; border-radius: 4px; font-size: 12px; color: #555; text-align: center;">`;
        html += `📊 提取总结: ${totalAreas} 个标注地区, ${totalLocations} 个地点标记`;
        html += `</div>`;
    }

    container.innerHTML = html;
}

/**
 * Apply AI extraction results to the map
 */
async function applyAIResultsToMap(results) {
    console.log('🚀 Starting to apply AI results to map:', results);
    
    if (!results) {
        console.error('❌ No results provided');
        showToast('没有可应用的结果', 'error');
        return;
    }
    
    if (!appState) {
        console.error('❌ appState not available');
        showToast('应用状态未就绪', 'error');
        return;
    }
    
    if (!appState.map) {
        console.error('❌ Map not available');
        showToast('地图未就绪，请等待地图加载完成', 'error');
        return;
    }

    // Show loading toast
    showToast('正在应用结果到地图...', 'info');
    console.log('📋 Results to apply:', {
        areas: results.areas?.length || 0,
        locations: results.locations?.length || 0,
        mapDesign: !!results.mapDesign
    });

    let areasApplied = 0;
    let markersApplied = 0;
    const errors = [];

    // Apply map design suggestions first
    if (results.mapDesign) {
        try {
            // Apply suggested map style
            if (results.mapDesign.suggestedStyle && typeof switchMapStyle === 'function') {
                switchMapStyle(results.mapDesign.suggestedStyle);
            }

            // Fly to suggested center and zoom
            // Wait for style to fully load before flying
            if (results.mapDesign.suggestedCenter && results.mapDesign.suggestedZoom) {
                // Wait for style to load - check if already loaded or wait for event
                await new Promise((resolve) => {
                    // Check if style is already loaded
                    if (appState.map && appState.map.isStyleLoaded()) {
                        setTimeout(resolve, 1000); // Still wait a bit for everything to be ready
                        return;
                    }
                    
                    // Wait for style.load event
                    if (appState.map) {
                        appState.map.once('style.load', () => {
                            // Additional delay to ensure everything is ready
                            setTimeout(resolve, 1000);
                        });
                        
                        // Timeout after 15 seconds
                        setTimeout(resolve, 15000);
                    } else {
                        resolve(); // No map, just continue
                    }
                });
                
                appState.map.flyTo({
                    center: results.mapDesign.suggestedCenter,
                    zoom: results.mapDesign.suggestedZoom,
                    duration: 2000
                });
            }
        } catch (error) {
            console.warn('Failed to apply map design suggestions:', error);
        }
    }

    // Apply areas (countries/regions) - sorted by priority
    if (results.areas && results.areas.length > 0) {
        // Trigger boundary sources loading (don't wait - let createAreaLayer handle it)
        console.log('⏳ Triggering boundary sources loading...');
        if (typeof loadBoundarySources === 'function') {
            loadBoundarySources();
        }
        
        // Wait a short time for initial setup, but don't block
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const sortedAreas = sortByPriority(results.areas);
        for (const area of sortedAreas) {
            try {
                // Try to find area ID by name using geocoding first
                let areaId = await findAreaIdByName(area.name, area.type);
                
                // If not found, try to find by coordinates from locations
                if (!areaId && results.locations && results.locations.length > 0) {
                    // Look for locations in this area to get coordinates
                    const areaLocation = results.locations.find(loc => 
                        loc.name.toLowerCase().includes(area.name.toLowerCase()) ||
                        area.name.toLowerCase().includes(loc.name.toLowerCase())
                    );
                    
                    if (areaLocation && areaLocation.coords) {
                        // Try to detect boundary at that location
                        areaId = await findAreaIdByCoordinates(areaLocation.coords, area.type);
                    }
                }
                
                if (areaId) {
                    console.log(`✅ Applying color to area: ${area.name} (${area.type}) -> ${areaId}`);
                    // Use preset color if available, otherwise fall back to suggested color or default
                    const colorToUse = area.presetColor || area.suggestedColor || '#6CA7A1';
                    
                    try {
                        // Try to apply color - createAreaLayer will handle source loading internally
                        // No need to wait for source to load first
                        await applyColorToArea(areaId, area.name, area.type, colorToUse);
                        areasApplied++;
                        // Small delay between area applications to allow processing
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (applyError) {
                        // Handle application errors gracefully
                        const errorMsg = applyError.message || String(applyError);
                        errors.push(`应用区域失败: ${area.name} (${area.type}) - ${errorMsg}`);
                        console.error(`Failed to apply color to ${area.name}:`, applyError);
                        // Continue with next area even if this one fails
                    }
                } else {
                    errors.push(`无法找到区域: ${area.name} (${area.type}) - 请手动点击地图选择`);
                    console.warn(`Could not find area: ${area.name} (${area.type}) - User may need to click manually`);
                    // Only show first error to avoid spam
                    if (errors.filter(e => e.includes('无法找到区域')).length === 1) {
                        showToast(`部分区域无法自动定位，请手动点击地图选择`, 'warning');
                    }
                }
            } catch (error) {
                errors.push(`应用区域失败: ${area.name}`);
                console.error(`Failed to apply area ${area.name}:`, error);
            }
        }
    }

    // Apply locations (markers) - sorted by priority
    if (results.locations && results.locations.length > 0) {
        const sortedLocations = sortByPriority(results.locations);
        let firstMarkerApplied = false;

        for (const location of sortedLocations) {
            try {
                // Use resolved coordinates or try to resolve again
                let coords = location.coords;
                if (!coords) {
                    coords = await resolveLocationCoordinates(location.name, location.country);
                }

                if (coords && coords.length >= 2) {
                    const name = location.context 
                        ? `${location.name} - ${location.context}`
                        : location.name;
                    
                    // Use priority-based marker color
                    const markerColor = getMarkerColorByPriority(location.priority);
                    addMarker(coords, name, markerColor, appState.currentMarkerShape || 'pin');
                    markersApplied++;

                    // Fly to first (highest priority) location
                    if (!firstMarkerApplied && location.priority === 1) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        appState.map.flyTo({
                            center: coords,
                            zoom: results.mapDesign?.suggestedZoom || 10,
                            duration: 2000
                        });
                        firstMarkerApplied = true;
                    }
                } else {
                    errors.push(`无法解析坐标: ${location.name}`);
                    console.warn(`Could not resolve coordinates for: ${location.name}`);
                }
            } catch (error) {
                errors.push(`添加标记失败: ${location.name}`);
                console.error(`Failed to add marker for ${location.name}:`, error);
            }
        }
    }

    // Show completion message
    const message = `✅ 已应用 ${areasApplied} 个标注地区, ${markersApplied} 个地点标记${errors.length > 0 ? ` (${errors.length} 个错误)` : ''}`;
    showToast(message, errors.length > 0 ? 'warning' : 'success');
    
    if (errors.length > 0) {
        console.warn('Errors during application:', errors);
    }

    console.log(`✅ Applied ${areasApplied} areas and ${markersApplied} markers to map`);
}

/**
 * Get marker color based on priority
 */
function getMarkerColorByPriority(priority) {
    const colors = {
        1: '#FF3B30', // Red - highest priority
        2: '#FF9500', // Orange - high priority
        3: '#FFCC00', // Yellow - medium-high priority
        4: '#34C759', // Green - medium priority
        5: '#007AFF'  // Blue - normal priority
    };
    return colors[priority] || colors[5];
}

/**
 * Find area ID by name (enhanced with geocoding)
 */
async function findAreaIdByName(areaName, areaType) {
    // Try to find in country codes mapping first
    if (areaType === 'country') {
        // First, try to find in COUNTRY_CODES using full mapping
        if (typeof COUNTRY_CODES !== 'undefined') {
            // Try exact match by code
            if (COUNTRY_CODES[areaName.toUpperCase()]) {
                return areaName.toUpperCase();
            }
            
            // Try to find by Chinese name
            const codeByChineseName = Object.keys(COUNTRY_CODES).find(
                code => COUNTRY_CODES[code].name === areaName
            );
            if (codeByChineseName) return codeByChineseName;
            
            // Try to find by English name (exact match)
            const codeByEnglishName = Object.keys(COUNTRY_CODES).find(
                code => COUNTRY_CODES[code].nameEn === areaName || 
                        COUNTRY_CODES[code].nameEn.toLowerCase() === areaName.toLowerCase()
            );
            if (codeByEnglishName) return codeByEnglishName;
            
            // Try partial match (contains)
            const normalizedName = areaName.toLowerCase();
            const codeByPartialMatch = Object.keys(COUNTRY_CODES).find(code => {
                const country = COUNTRY_CODES[code];
                return country.name.toLowerCase().includes(normalizedName) ||
                       country.nameEn.toLowerCase().includes(normalizedName) ||
                       normalizedName.includes(country.name.toLowerCase()) ||
                       normalizedName.includes(country.nameEn.toLowerCase());
            });
            if (codeByPartialMatch) return codeByPartialMatch;
        }

        // Fallback: Try common variations for special cases
        const specialCases = {
            'Taiwan': 'TWN', '台灣': 'TWN', '臺灣': 'TWN', 'Taiwan, Province of China': 'TWN',
            'China': 'CHN', '中国': 'CHN', '中國': 'CHN', 'People\'s Republic of China': 'CHN',
            'United States': 'USA', 'USA': 'USA', 'US': 'USA', '美国': 'USA', '美國': 'USA', 'United States of America': 'USA',
            'Japan': 'JPN', '日本': 'JPN',
            'Korea': 'KOR', 'South Korea': 'KOR', '韩国': 'KOR', '韓國': 'KOR', 'Republic of Korea': 'KOR',
            'Poland': 'POL', '波兰': 'POL', '波蘭': 'POL',
            'Romania': 'ROU', '罗马尼亚': 'ROU', '羅馬尼亞': 'ROU',
            'Ukraine': 'UKR', '乌克兰': 'UKR', '烏克蘭': 'UKR',
            'Germany': 'DEU', '德国': 'DEU', '德國': 'DEU', 'Federal Republic of Germany': 'DEU',
        };
        
        // Check exact match in special cases
        if (specialCases[areaName]) return specialCases[areaName];
        
        // Check case-insensitive match in special cases
        const normalizedName = areaName.toLowerCase();
        for (const [key, value] of Object.entries(specialCases)) {
            if (key.toLowerCase() === normalizedName) return value;
        }

        // Last resort: Try first 3 letters as country code (might work for some)
        const threeLetterCode = areaName.toUpperCase().substring(0, 3);
        if (threeLetterCode.length === 3 && COUNTRY_CODES && COUNTRY_CODES[threeLetterCode]) {
            return threeLetterCode;
        }
        
        // Return null if not found (will trigger error handling)
        console.warn(`Could not find country code for: ${areaName}`);
        return null;
    }

    // For states/cities, try to use geocoding to find coordinates first
    // Then we can try to detect the boundary at those coordinates
    if (CONFIG && CONFIG.MAPBOX && CONFIG.MAPBOX.TOKEN) {
        try {
            const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(areaName)}.json?access_token=${CONFIG.MAPBOX.TOKEN}&types=region,place&limit=1`;
            const response = await fetch(geocodeUrl);
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                // Extract area code from context or properties
                const context = feature.context || [];
                const countryContext = context.find(c => c.id && c.id.startsWith('country'));
                if (countryContext && countryContext.short_code) {
                    // Return country code + area name for now
                    return countryContext.short_code.toUpperCase();
                }
            }
        } catch (error) {
            console.warn(`Geocoding failed for ${areaName}:`, error);
        }
    }

    // Fallback: return name as ID (will try to match by name in detectClickedBoundary)
    return areaName;
}

/**
 * Find area ID by coordinates (by detecting boundary at that location)
 */
async function findAreaIdByCoordinates(coords, areaType) {
    if (!appState || !appState.map || !coords || coords.length < 2) {
        return null;
    }
    
    try {
        // Simulate a click at those coordinates to detect boundary
        // This is a workaround - in production, should query the map directly
        const point = appState.map.project(coords);
        
        // Query rendered features at that point
        const features = appState.map.queryRenderedFeatures(point, {
            layers: ['visible-boundaries-country', 'visible-boundaries-state', 'visible-boundaries-city']
        });
        
        if (features && features.length > 0) {
            const feature = features[0];
            const props = feature.properties;
            
            // Extract area ID based on type
            if (areaType === 'country') {
                return props.GID_0 || props.COUNTRY || props.ISO_A3;
            } else if (areaType === 'state') {
                return props.GID_1 || props.NAME_1;
            } else if (areaType === 'city') {
                return props.GID_2 || props.NAME_2;
            }
        }
    } catch (error) {
        console.warn(`Failed to find area by coordinates:`, error);
    }
    
    return null;
}

/**
 * Wait for boundary sources to load
 */
async function waitForBoundarySourcesToLoad(maxWait = 15000) {
    if (!appState || !appState.map) {
        console.warn('⚠️ Map not ready, skipping boundary source wait');
        return false;
    }
    
    // First, ensure loading is triggered
    if (typeof loadBoundarySources === 'function') {
        loadBoundarySources();
    }
    
    // Check if source is already loaded (check actual Mapbox source, not just state flag)
    const boundariesSourceId = 'boundaries-adm0';
    const sourceExists = appState.map.getSource(boundariesSourceId);
    
    if (sourceExists) {
        console.log('✅ Boundary source already exists');
        return true;
    }
    
    // Check state flag as backup
    if (appState.sources && appState.sources.adm0 && appState.sources.adm0.loaded) {
        console.log('✅ Boundary source marked as loaded');
        return true;
    }
    
    // Wait for source to load using Promise-based event listener
    return new Promise((resolve) => {
        const startTime = Date.now();
        const checkInterval = 200;
        let timeoutId;
        
        // Set up event listener for source loading
        const onData = (e) => {
            if (e.sourceId === boundariesSourceId && e.isSourceLoaded) {
                console.log('✅ Boundary source loaded via event');
                cleanup();
                resolve(true);
            }
        };
        
        const cleanup = () => {
            if (timeoutId) clearInterval(timeoutId);
            appState.map.off('data', onData);
        };
        
        // Listen for data events
        appState.map.on('data', onData);
        
        // Also poll as backup
        timeoutId = setInterval(() => {
            // Check actual source
            const source = appState.map.getSource(boundariesSourceId);
            if (source) {
                console.log('✅ Boundary source found via polling');
                cleanup();
                resolve(true);
                return;
            }
            
            // Check state flag
            if (appState.sources && appState.sources.adm0 && appState.sources.adm0.loaded) {
                console.log('✅ Boundary source marked as loaded via polling');
                cleanup();
                resolve(true);
                return;
            }
            
            // Check timeout
            if (Date.now() - startTime > maxWait) {
                console.warn(`⚠️ Boundary sources did not load within ${maxWait}ms timeout, proceeding anyway...`);
                cleanup();
                resolve(false);
            }
        }, checkInterval);
    });
}

/**
 * Ensure boundary source is loaded for a specific area type
 */
async function ensureBoundarySourceLoaded(areaType) {
    if (!appState || !appState.map) return false;
    
    // Map area type to source key
    const sourceKeyMap = {
        'country': 'adm0',
        'state': 'adm1',
        'city': 'adm2'
    };
    
    const sourceKey = sourceKeyMap[areaType] || 'adm0';
    
    // Check if source is already loaded
    if (appState.sources && appState.sources[sourceKey] && appState.sources[sourceKey].loaded) {
        return true;
    }
    
    // Check if GADM source exists (might be faster)
    const gadmSourceId = `gadm-${areaType}`;
    const hasGADMSource = appState.map.getSource(gadmSourceId);
    if (hasGADMSource) {
        console.log(`✅ GADM source for ${areaType} already exists`);
        return true;
    }
    
    // Try to load the source
    console.log(`⏳ Loading boundary source for ${areaType}...`);
    
    // Check if loadBoundarySourceForType function exists and call it
    if (typeof loadBoundarySourceForType === 'function') {
        try {
            // Trigger loading
            await loadBoundarySourceForType(areaType, false);
        } catch (error) {
            console.warn(`Failed to trigger load for ${areaType}:`, error);
        }
        
        // Wait for source to load - longer timeout for large files (city data can be 80+ MB)
        const maxWait = areaType === 'city' ? 30000 : areaType === 'state' ? 15000 : 10000; // 30s for city, 15s for state, 10s for country
        const startTime = Date.now();
        const checkInterval = 200;
        
        while (Date.now() - startTime < maxWait) {
            // Check both regular source and GADM source
            const regularSourceLoaded = appState.sources && appState.sources[sourceKey] && appState.sources[sourceKey].loaded;
            const gadmSourceLoaded = appState.map.getSource(gadmSourceId);
            
            if (regularSourceLoaded || gadmSourceLoaded) {
                console.log(`✅ Boundary source for ${areaType} loaded (${regularSourceLoaded ? 'regular' : 'GADM'})`);
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
    }
    
    console.warn(`⚠️ Boundary source for ${areaType} did not load within timeout (may still be loading in background)`);
    // Return false but don't block - the source might still load
    return false;
}

// Initialize when script loads
setupAIAssistant();

