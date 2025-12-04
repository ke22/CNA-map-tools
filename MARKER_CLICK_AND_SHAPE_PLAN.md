# Marker Click-to-Add and Shape Selection Implementation Plan

## User Requirements
1. Click on map to add marker at clicked location
2. Choose marker shape/graph (pin, circle, square, star)

## Implementation Plan

### Feature 1: Click on Map to Add Marker

**Approach:** When clicking on map, if no boundary is detected, add a marker at that location. Also add a "Marker Mode" toggle to always add markers regardless of boundary detection.

**Implementation Steps:**

1. **Add Marker Mode Toggle to appState**
   - Add `markerMode: false` to control marker placement mode
   - When enabled, clicking map always adds marker (even if boundary detected)

2. **Update handleMapClick Function**
   - When no boundary detected → Add marker at click location
   - When markerMode is true → Add marker even if boundary detected (prioritize marker)
   - Generate marker name from coordinates

3. **Add Marker Mode Toggle UI**
   - Add toggle button/checkbox in sidebar
   - Enable/disable marker placement mode

4. **Update handleMapClick Logic**
   ```javascript
   if (appState.markerMode) {
       // Always add marker in marker mode
       addMarkerAtLocation(e);
   } else if (!detected) {
       // No boundary detected, add marker
       addMarkerAtLocation(e);
   } else {
       // Boundary detected, show area selection (existing behavior)
   }
   ```

### Feature 2: Marker Shape Selection

**Approach:** Add shape selector UI in sidebar (pin, circle, square, star) alongside color selector.

**Implementation Steps:**

1. **Add Shape Selector UI**
   - Update `setupMarkerIconSelector()` to include shape buttons
   - Display shape previews alongside colors
   - Store selected shape in `appState.currentMarkerShape`

2. **Update Marker Creation**
   - Use `appState.currentMarkerShape` when creating markers
   - Pass shape parameter to `addMarker()`

3. **Update Color Picker Popups**
   - Add shape selector to `showMarkerColorPickerOnAdd()` popup
   - Add shape selector to marker edit popup

4. **Shape Preview Icons**
   - Create visual previews for each shape
   - Show selected shape with border/highlight

## Files to Modify

### 1. `js/app-enhanced.js`
- Add `markerMode` to appState (line ~67)
- Update `handleMapClick()` function (line ~467)
- Add `addMarkerAtLocation(e)` helper function
- Update `setupMarkerIconSelector()` to include shapes (line ~3270)
- Update marker creation functions to use selected shape
- Update color picker popups to include shape selector

### 2. `index-enhanced.html`
- Add marker mode toggle UI (near marker controls)
- Update marker icon selector section to show shapes

### 3. `css/styles-enhanced.css`
- Add styles for shape selector buttons
- Style marker mode toggle

## Detailed Changes

### Change 1: Add Marker Mode to appState
```javascript
markerMode: false,  // When true, clicking map always adds marker
```

### Change 2: Create addMarkerAtLocation Helper
```javascript
function addMarkerAtLocation(e) {
    const coordinates = [e.lngLat.lng, e.lngLat.lat];
    const name = `Marker (${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)})`;
    
    if (appState.showColorPickerOnAdd) {
        showMarkerColorPickerOnAdd(coordinates, name);
    } else {
        addMarker(coordinates, name);
    }
}
```

### Change 3: Update handleMapClick
- Check markerMode first
- If no boundary detected, call addMarkerAtLocation
- Keep existing boundary detection logic

### Change 4: Add Shape Selector
- Create shape buttons with previews
- Update `setupMarkerIconSelector()` to show both colors and shapes
- Store selected shape in appState

## User Experience

### Click to Add Marker
1. **Normal Mode:** Click on map (no boundary) → Marker added
2. **Marker Mode:** Toggle enabled → All clicks add markers
3. **Boundary Mode:** Toggle disabled → Click boundaries to select areas (existing)

### Shape Selection
1. Select shape in sidebar → Next markers use this shape
2. Select shape in popup → This marker uses selected shape
3. Visual previews show what each shape looks like

## Benefits
- Intuitive: Click anywhere to add marker
- Flexible: Choose marker shapes for different purposes
- Consistent: Shape selector works in sidebar and popups

