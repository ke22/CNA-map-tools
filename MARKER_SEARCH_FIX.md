# Marker Name Search Fix

## Issues Fixed

1. **Results container display**: Added `resultsDiv.style.display = 'block'` to ensure search results are visible
2. **Input ID**: Fixed incorrect reference from `marker-search-input` to `marker-smart-search`
3. **Coordinate display**: Fixed coordinate order display (now shows lat, lng format)
4. **Error handling**: Added better error handling and response validation
5. **Results container visibility**: Ensured container is hidden after marker is added

## How it works

1. User types a name (e.g., "Taipei") in the marker search input
2. After 500ms debounce, `searchLocationForMarker()` is called
3. Mapbox Geocoding API is queried
4. Results are displayed in the search results container
5. User clicks on a result to add a marker

## Testing

Try searching for:
- "Taipei" 
- "New York"
- "Tokyo"
- Any location name

The search should now work correctly!
