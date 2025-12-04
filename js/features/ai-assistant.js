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
                areas: validatedResults.areas
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
        applyBtn.addEventListener('click', function() {
            if (!aiExtractionResults) {
                showToast('No results to apply', 'error');
                return;
            }

            applyAIResultsToMap(aiExtractionResults);
            resultsPreview.style.display = 'none';
            newsInput.value = '';
            aiExtractionResults = null;
            showToast('Results applied to map!', 'success');
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

    // Display areas (countries/regions)
    if (results.areas && results.areas.length > 0) {
        html += '<div style="margin-bottom: 16px;">';
        html += '<strong style="font-size: 12px; color: #757575;">Areas to Color:</strong>';
        html += '<ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px;">';
        const sortedAreas = sortByPriority(results.areas);
        sortedAreas.forEach(area => {
            const colorSquare = `<span style="display: inline-block; width: 12px; height: 12px; background: ${area.suggestedColor}; border: 1px solid #ccc; margin-right: 6px; vertical-align: middle;"></span>`;
            html += `<li style="margin-bottom: 4px;">${colorSquare}${area.name} (${area.type})</li>`;
        });
        html += '</ul>';
        html += '</div>';
    }

    // Display locations (markers)
    if (results.locations && results.locations.length > 0) {
        html += '<div>';
        html += '<strong style="font-size: 12px; color: #757575;">Locations to Mark:</strong>';
        html += '<ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px;">';
        const sortedLocations = sortByPriority(results.locations);
        sortedLocations.forEach(loc => {
            const coordText = loc.coords 
                ? ` [${loc.coords[1].toFixed(4)}, ${loc.coords[0].toFixed(4)}]`
                : ' (coordinates resolving...)';
            const statusIcon = loc.coords ? '✓' : '⏳';
            html += `<li style="margin-bottom: 4px;">${statusIcon} ${formatLocationForDisplay(loc)}${coordText}</li>`;
        });
        html += '</ul>';
        html += '</div>';
    }

    if (!html) {
        html = '<p style="color: #757575; font-size: 13px;">No locations found in the news text.</p>';
    }

    container.innerHTML = html;
}

/**
 * Apply AI extraction results to the map
 */
async function applyAIResultsToMap(results) {
    if (!results || !appState || !appState.map) {
        showToast('Map not ready', 'error');
        return;
    }

    let areasApplied = 0;
    let markersApplied = 0;

    // Apply areas (countries/regions)
    if (results.areas && results.areas.length > 0) {
        for (const area of sortByPriority(results.areas)) {
            try {
                // Find area ID by name
                const areaId = await findAreaIdByName(area.name, area.type);
                if (areaId) {
                    applyColorToArea(areaId, area.name, area.type, area.suggestedColor);
                    areasApplied++;
                } else {
                    console.warn(`Could not find area: ${area.name} (${area.type})`);
                }
            } catch (error) {
                console.error(`Failed to apply area ${area.name}:`, error);
            }
        }
    }

    // Apply locations (markers)
    if (results.locations && results.locations.length > 0) {
        for (const location of sortByPriority(results.locations)) {
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
                    addMarker(coords, name, appState.currentMarkerColor, appState.currentMarkerShape);
                    markersApplied++;

                    // Fly to first (highest priority) location
                    if (location.priority === 1 && markersApplied === 1) {
                        appState.map.flyTo({
                            center: coords,
                            zoom: 10,
                            duration: 2000
                        });
                    }
                } else {
                    console.warn(`Could not resolve coordinates for: ${location.name}`);
                }
            } catch (error) {
                console.error(`Failed to add marker for ${location.name}:`, error);
            }
        }
    }

    console.log(`✅ Applied ${areasApplied} areas and ${markersApplied} markers to map`);
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

