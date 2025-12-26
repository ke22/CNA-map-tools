/**
 * Image Overlay Feature
 * Allows users to upload or paste images as map overlays
 */

/**
 * Setup image overlay functionality
 */
function setupImageOverlay() {
    const uploadBtn = document.getElementById('upload-image-btn');
    const pasteBtn = document.getElementById('paste-image-btn');
    const fileInput = document.getElementById('image-overlay-input');

    if (!uploadBtn || !pasteBtn || !fileInput) {
        console.warn('⚠️ Image overlay elements not found');
        return;
    }

    // Upload button click
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageFile(file);
        } else {
            showToast('請選擇有效的圖片文件', 'error');
        }
        // Reset input
        fileInput.value = '';
    });

    // Paste button click - setup paste handler
    pasteBtn.addEventListener('click', () => {
        showToast('請按 Ctrl+V (Cmd+V) 貼上圖片', 'info');
        
        // Setup paste event listener (one-time)
        const pasteHandler = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                    e.preventDefault();
                    const file = items[i].getAsFile();
                    handleImageFile(file);
                    document.removeEventListener('paste', pasteHandler);
                    return;
                }
            }
        };

        document.addEventListener('paste', pasteHandler);
    });

    // Global paste handler (when focused on document)
    document.addEventListener('paste', (e) => {
        // Only handle if user clicked paste button recently
        if (pasteBtn.dataset.listening === 'true') {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                    e.preventDefault();
                    const file = items[i].getAsFile();
                    handleImageFile(file);
                    pasteBtn.dataset.listening = 'false';
                    return;
                }
            }
        }
    });
}

/**
 * Handle image file (upload or paste)
 */
function handleImageFile(file) {
    if (!appState.map || !file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const imageUrl = e.target.result;
        const img = new Image();
        
        img.onload = () => {
            // Show dialog to select position
            showImagePositionDialog(img, imageUrl, file.name);
        };
        
        img.onerror = () => {
            showToast('圖片載入失敗', 'error');
        };
        
        img.src = imageUrl;
    };
    
    reader.onerror = () => {
        showToast('讀取圖片失敗', 'error');
    };
    
    reader.readAsDataURL(file);
}

/**
 * Show dialog to select image position on map
 */
function showImagePositionDialog(img, imageUrl, fileName) {
    // Create a simple overlay dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 400px;
        width: 90%;
    `;
    
    dialog.innerHTML = `
        <h3 style="margin: 0 0 16px 0; font-size: 16px;">放置圖片</h3>
        <p style="margin: 0 0 16px 0; color: #666; font-size: 14px;">
            點擊地圖選擇圖片位置，或輸入座標範圍
        </p>
        <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-size: 13px;">西南角座標 (lat, lng)</label>
            <input type="text" id="sw-coords-input" placeholder="例如: 24.8, 121.0" 
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-size: 13px;">東北角座標 (lat, lng)</label>
            <input type="text" id="ne-coords-input" placeholder="例如: 25.2, 121.6" 
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div style="display: flex; gap: 8px;">
            <button id="cancel-image-btn" class="btn-secondary" style="flex: 1;">取消</button>
            <button id="click-map-btn" class="btn-primary" style="flex: 1;">點擊地圖選擇</button>
        </div>
        <div style="margin-top: 12px;">
            <button id="add-image-btn" class="btn-primary" style="width: 100%; display: none;">確認添加</button>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    let swCoords = null;
    let neCoords = null;
    let mapClickHandler = null;
    
    // Cancel button
    document.getElementById('cancel-image-btn').addEventListener('click', () => {
        if (mapClickHandler) {
            appState.map.off('click', mapClickHandler);
        }
        document.body.removeChild(dialog);
    });
    
    // Click map button
    document.getElementById('click-map-btn').addEventListener('click', () => {
        showToast('請在地圖上點擊兩次：第一次選擇西南角，第二次選擇東北角', 'info');
        
        let clickCount = 0;
        
        mapClickHandler = (e) => {
            const coords = [e.lngLat.lng, e.lngLat.lat];
            
            if (clickCount === 0) {
                swCoords = coords;
                document.getElementById('sw-coords-input').value = `${coords[1]}, ${coords[0]}`;
                showToast('已選擇西南角，請點擊選擇東北角', 'info');
                clickCount++;
            } else {
                neCoords = coords;
                document.getElementById('ne-coords-input').value = `${coords[1]}, ${coords[0]}`;
                document.getElementById('add-image-btn').style.display = 'block';
                appState.map.off('click', mapClickHandler);
                showToast('已選擇位置，點擊「確認添加」', 'success');
                mapClickHandler = null;
            }
        };
        
        appState.map.once('click', mapClickHandler);
        
        // Also allow multiple clicks
        setTimeout(() => {
            if (clickCount === 1) {
                appState.map.once('click', mapClickHandler);
            }
        }, 100);
    });
    
    // Add image button
    document.getElementById('add-image-btn').addEventListener('click', () => {
        // Get coordinates from inputs or use selected
        const swInput = document.getElementById('sw-coords-input').value.trim();
        const neInput = document.getElementById('ne-coords-input').value.trim();
        
        if (swInput && neInput) {
            const swParts = swInput.split(',').map(s => parseFloat(s.trim()));
            const neParts = neInput.split(',').map(s => parseFloat(s.trim()));
            
            if (swParts.length === 2 && neParts.length === 2) {
                swCoords = [swParts[1], swParts[0]]; // Convert lat,lng to lng,lat
                neCoords = [neParts[1], neParts[0]];
            }
        }
        
        if (!swCoords || !neCoords) {
            showToast('請選擇圖片位置', 'error');
            return;
        }
        
        // Add image overlay
        addImageOverlay(img, imageUrl, swCoords, neCoords, fileName);
        
        // Cleanup
        if (mapClickHandler) {
            appState.map.off('click', mapClickHandler);
        }
        document.body.removeChild(dialog);
    });
    
    // Also allow direct coordinate input
    const swInput = document.getElementById('sw-coords-input');
    const neInput = document.getElementById('ne-coords-input');
    
    [swInput, neInput].forEach((input, index) => {
        input.addEventListener('blur', () => {
            const value = input.value.trim();
            if (value) {
                const parts = value.split(',').map(s => parseFloat(s.trim()));
                if (parts.length === 2) {
                    if (index === 0) {
                        swCoords = [parts[1], parts[0]];
                    } else {
                        neCoords = [parts[1], parts[0]];
                    }
                    if (swCoords && neCoords) {
                        document.getElementById('add-image-btn').style.display = 'block';
                    }
                }
            }
        });
    });
}

/**
 * Add image overlay to map
 */
function addImageOverlay(img, imageUrl, swCoords, neCoords, name) {
    if (!appState.map) return;
    
    const overlayId = `image-overlay-${Date.now()}`;
    const sourceId = `image-source-${overlayId}`;
    const layerId = `image-layer-${overlayId}`;
    
    // Create bounds
    const bounds = [
        swCoords, // Southwest
        [neCoords[0], swCoords[1]], // Southeast
        neCoords, // Northeast
        [swCoords[0], neCoords[1]] // Northwest
    ];
    
    try {
        // Add image to map
        appState.map.addImage(overlayId, img);
        
        // Create GeoJSON source with image bounds
        const geoJsonSource = {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [bounds]
                }
            }
        };
        
        // For raster overlay, we'll use a raster source approach
        // Since Mapbox doesn't directly support image overlays with bounds,
        // we'll use a fill layer with pattern
        
        // Use Mapbox Image Source (coordinates order: top-left, top-right, bottom-right, bottom-left)
        // swCoords = [lng, lat] of southwest corner
        // neCoords = [lng, lat] of northeast corner
        appState.map.addSource(sourceId, {
            type: 'image',
            url: imageUrl,
            coordinates: [
                [swCoords[0], neCoords[1]],  // top-left (west, north)
                [neCoords[0], neCoords[1]],  // top-right (east, north)
                neCoords,                    // bottom-right (east, south)
                [swCoords[0], swCoords[1]]   // bottom-left (west, south)
            ]
        });
        
        // Add raster layer
        appState.map.addLayer({
            id: layerId,
            type: 'raster',
            source: sourceId,
            paint: {
                'raster-opacity': 0.8
            }
        });
        
        // Store overlay info
        appState.imageOverlays.push({
            id: overlayId,
            sourceId: sourceId,
            layerId: layerId,
            name: name || 'Image Overlay',
            bounds: bounds,
            imageUrl: imageUrl
        });
        
        showToast('圖片已添加到地圖', 'success');
        
        // Update UI if needed
        if (typeof updateUnifiedContentList === 'function') {
            updateUnifiedContentList();
        }
        
    } catch (error) {
        console.error('Error adding image overlay:', error);
        showToast('添加圖片失敗：' + error.message, 'error');
    }
}

/**
 * Remove image overlay
 */
function removeImageOverlay(overlayId) {
    const overlay = appState.imageOverlays.find(o => o.id === overlayId);
    if (!overlay) return;
    
    try {
        // Remove layer
        if (appState.map.getLayer(overlay.layerId)) {
            appState.map.removeLayer(overlay.layerId);
        }
        
        // Remove source
        if (appState.map.getSource(overlay.sourceId)) {
            appState.map.removeSource(overlay.sourceId);
        }
        
        // Remove from array
        appState.imageOverlays = appState.imageOverlays.filter(o => o.id !== overlayId);
        
        showToast('圖片已移除', 'success');
        
    } catch (error) {
        console.error('Error removing image overlay:', error);
        showToast('移除圖片失敗', 'error');
    }
}

