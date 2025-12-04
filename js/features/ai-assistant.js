/**
 * AI Assistant Feature
 * Integrates Gemini AI for automatic news analysis and map annotation
 */

// Store AI results temporarily
let aiExtractionResults = null;

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

    // Analyze button click handler
    analyzeBtn.addEventListener('click', async function() {
        const newsText = newsInput.value.trim();

        if (!newsText) {
            showToast('Please paste news text first', 'error');
            return;
        }

        // Check if Gemini is enabled
        if (!CONFIG?.GEMINI?.ENABLED) {
            showToast('AI Assistant is not enabled. Please configure Gemini API key in config.js', 'error');
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
    });

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
                // Apply results to map (this is async)
                await applyAIResultsToMap(aiExtractionResults);
                
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

    // Display areas (countries/regions)
    if (results.areas && results.areas.length > 0) {
        html += '<div style="margin-bottom: 16px;">';
        html += '<strong style="font-size: 13px; color: #333; display: block; margin-bottom: 8px;">🎨 主要标注地区 (' + results.areas.length + ' 个)</strong>';
        html += '<div style="max-height: 200px; overflow-y: auto;">';
        const sortedAreas = sortByPriority(results.areas);
        sortedAreas.forEach((area, index) => {
            const priorityBadge = area.priority <= 2 
                ? `<span style="background: #ff5722; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-right: 6px;">重要</span>`
                : '';
            const colorSquare = `<span style="display: inline-block; width: 16px; height: 16px; background: ${area.suggestedColor}; border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.2); margin-right: 8px; vertical-align: middle; border-radius: 3px;"></span>`;
            const reasonText = area.reason ? `<div style="font-size: 11px; color: #757575; margin-left: 26px; margin-top: 2px;">${area.reason}</div>` : '';
            html += `<div style="padding: 8px; margin-bottom: 6px; background: #f9f9f9; border-radius: 4px; border-left: 3px solid ${area.suggestedColor};">`;
            html += `<div style="display: flex; align-items: center;">${colorSquare}<span style="font-weight: 500; font-size: 13px;">${area.name}</span><span style="font-size: 11px; color: #757575; margin-left: 8px;">(${area.type})</span>${priorityBadge}</div>`;
            html += reasonText;
            html += '</div>';
        });
        html += '</div>';
        html += '</div>';
    }

    // Display locations (markers)
    if (results.locations && results.locations.length > 0) {
        html += '<div>';
        html += '<strong style="font-size: 13px; color: #333; display: block; margin-bottom: 8px;">📍 地点标记 (' + results.locations.length + ' 个)</strong>';
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
                ? `<div style="font-size: 11px; color: #757575; margin-top: 2px;">坐标: ${loc.coords[1].toFixed(4)}, ${loc.coords[0].toFixed(4)}</div>`
                : '<div style="font-size: 11px; color: #ff9800; margin-top: 2px;">正在解析坐标...</div>';
            const contextText = loc.context ? `<div style="font-size: 11px; color: #555; margin-top: 2px; font-style: italic;">${loc.context}</div>` : '';
            
            html += `<div style="padding: 8px; margin-bottom: 6px; background: #f9f9f9; border-radius: 4px; border-left: 3px solid #007AFF;">`;
            html += `<div style="display: flex; align-items: center;">${statusIcon}<span style="font-weight: 500; font-size: 13px;">${formatLocationForDisplay(loc)}</span>${priorityBadge}</div>`;
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
            if (results.mapDesign.suggestedCenter && results.mapDesign.suggestedZoom) {
                await new Promise(resolve => setTimeout(resolve, 500)); // Wait for style to load
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
        const sortedAreas = sortByPriority(results.areas);
        for (const area of sortedAreas) {
            try {
                // Find area ID by name
                const areaId = await findAreaIdByName(area.name, area.type);
                if (areaId) {
                    applyColorToArea(areaId, area.name, area.type, area.suggestedColor || '#007AFF');
                    areasApplied++;
                    // Small delay between area applications
                    await new Promise(resolve => setTimeout(resolve, 300));
                } else {
                    errors.push(`无法找到区域: ${area.name} (${area.type})`);
                    console.warn(`Could not find area: ${area.name} (${area.type})`);
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
 * Find area ID by name (simplified - may need enhancement)
 */
async function findAreaIdByName(areaName, areaType) {
    // This is a simplified implementation
    // For MVP, we'll try to match against known country codes
    // In production, this should use a proper geocoding/lookup service

    // Check if it's a country
    if (areaType === 'country') {
        // Try to find in country codes mapping
        if (typeof COUNTRY_CODES !== 'undefined') {
            const code = Object.keys(COUNTRY_CODES).find(
                key => COUNTRY_CODES[key] === areaName || key === areaName
            );
            if (code) return code;
        }

        // Try common country names
        const countryMap = {
            'Taiwan': 'TWN',
            'China': 'CHN',
            'United States': 'USA',
            'USA': 'USA',
            'Japan': 'JPN',
            'Korea': 'KOR',
            'South Korea': 'KOR',
        };

        return countryMap[areaName] || areaName.toUpperCase().substring(0, 3);
    }

    // For states/cities, we'll need to use geocoding or search
    // For MVP, return the name as ID (may not work perfectly)
    return areaName;
}

// Initialize when script loads
setupAIAssistant();

