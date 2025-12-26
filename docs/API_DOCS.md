# API Documentation

This document describes all APIs used by the Map Download Tool, including external APIs (Mapbox) and internal API structures.

## Mapbox APIs

### Mapbox GL JS API

#### Map Initialization

```javascript
const map = new mapboxgl.Map({
  container: 'map-container',        // HTML element ID
  style: 'mapbox://styles/mapbox/light-v11',  // Map style
  center: [lng, lat],                // Initial center [longitude, latitude]
  zoom: zoomLevel,                   // Initial zoom level
  accessToken: MAPBOX_TOKEN          // Your access token
});
```

**Parameters:**
- `container` (string, required): HTML element ID or DOM element
- `style` (string, required): Mapbox style URL
- `center` (array, required): `[longitude, latitude]`
- `zoom` (number, required): Zoom level (0-22)
- `accessToken` (string, required): Mapbox access token

**Response:** Mapbox Map instance

#### Adding Source

```javascript
map.addSource('source-id', {
  type: 'geojson',
  data: geoJsonData
});
```

#### Adding Layer

```javascript
map.addLayer({
  id: 'layer-id',
  type: 'fill',
  source: 'source-id',
  paint: {
    'fill-color': '#3B82F6',
    'fill-opacity': 0.5
  }
});
```

#### Adding Marker

```javascript
const marker = new mapboxgl.Marker()
  .setLngLat([lng, lat])
  .addTo(map);
```

#### Removing Layer

```javascript
map.removeLayer('layer-id');
map.removeSource('source-id');
```

### Mapbox Geocoding API

#### Forward Geocoding (Name → Coordinates)

**Endpoint:**
```
https://api.mapbox.com/geocoding/v5/mapbox.places/{search_text}.json
```

**Method:** GET

**Query Parameters:**
- `access_token` (required): Your Mapbox access token
- `country` (optional): Limit to country codes (e.g., `TW` for Taiwan)
- `types` (optional): Feature types (e.g., `region,district`)
- `limit` (optional): Number of results (default: 5)

**Example Request:**
```javascript
const query = encodeURIComponent('Taipei');
const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&country=TW&limit=1`;

fetch(url)
  .then(response => response.json())
  .then(data => {
    const coordinates = data.features[0].center; // [lng, lat]
    const placeName = data.features[0].place_name;
  });
```

**Example Response:**
```json
{
  "type": "FeatureCollection",
  "query": ["taipei"],
  "features": [
    {
      "id": "place.123456",
      "type": "Feature",
      "place_type": ["place"],
      "relevance": 1,
      "properties": {
        "wikidata": "Q1867"
      },
      "text": "Taipei",
      "place_name": "Taipei, Taiwan",
      "center": [121.5654, 25.0330],
      "geometry": {
        "type": "Point",
        "coordinates": [121.5654, 25.0330]
      }
    }
  ]
}
```

**Rate Limits:**
- Free tier: 100,000 requests/month
- Rate: Not explicitly limited, but reasonable use expected

#### Reverse Geocoding (Coordinates → Name)

**Endpoint:**
```
https://api.mapbox.com/geocoding/v5/mapbox.places/{longitude},{latitude}.json
```

**Method:** GET

**Query Parameters:**
- `access_token` (required): Your Mapbox access token
- `types` (optional): Feature types
- `limit` (optional): Number of results

**Example Request:**
```javascript
const lng = 121.5654;
const lat = 25.0330;
const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`;

fetch(url)
  .then(response => response.json())
  .then(data => {
    const placeName = data.features[0].place_name;
    const region = data.features[0].context.find(c => c.id.startsWith('region'));
  });
```

**Example Response:**
```json
{
  "type": "FeatureCollection",
  "query": [121.5654, 25.0330],
  "features": [
    {
      "id": "place.123456",
      "type": "Feature",
      "place_type": ["place"],
      "relevance": 1,
      "properties": {
        "accuracy": "point"
      },
      "text": "Taipei",
      "place_name": "Taipei, Taiwan",
      "center": [121.5654, 25.0330],
      "geometry": {
        "type": "Point",
        "coordinates": [121.5654, 25.0330]
      },
      "context": [
        {
          "id": "region.123",
          "text": "Taipei"
        }
      ]
    }
  ]
}
```

#### Error Responses

**401 Unauthorized:**
```json
{
  "message": "Not Authorized - Invalid Token"
}
```

**429 Too Many Requests:**
```json
{
  "message": "Rate limit exceeded"
}
```

**Response Codes:**
- `200`: Success
- `401`: Invalid token
- `429`: Rate limit exceeded
- `500`: Server error

### Mapbox Static Images API (Optional for Phase 2)

**Endpoint:**
```
https://api.mapbox.com/styles/v1/{username}/{style_id}/static/{overlay}/{lon},{lat},{zoom},{bearing},{pitch}|{width}x{height}{@2x}
```

**Use Case:** Higher quality map exports than html2canvas

**Rate Limits:**
- Free tier: 50,000 requests/month

## Internal APIs

### Territory Handler API

#### `markTerritoryByName(name, color)`

Marks a territory on the map by name.

**Parameters:**
- `name` (string, required): Territory name
- `color` (string, required): Hex color code

**Returns:** Promise that resolves with territory object

**Example:**
```javascript
await markTerritoryByName('Taipei', '#3B82F6');
```

**Errors:**
- `TerritoryNotFoundError`: Territory name not found
- `GeocodingError`: Geocoding API failed
- `BoundaryLoadError`: Boundary GeoJSON failed to load

#### `markTerritoryByCoordinates(lat, lng, color)`

Marks a territory on the map by coordinates using reverse geocoding.

**Parameters:**
- `lat` (number, required): Latitude (-90 to 90)
- `lng` (number, required): Longitude (-180 to 180)
- `color` (string, required): Hex color code

**Returns:** Promise that resolves with territory object

**Example:**
```javascript
await markTerritoryByCoordinates(25.0330, 121.5654, '#EF4444');
```

### Location Handler API

#### `markLocationByName(name)`

Adds a location marker by name.

**Parameters:**
- `name` (string, required): Location name

**Returns:** Promise that resolves with marker object

**Example:**
```javascript
await markLocationByName('Taipei City Hall');
```

#### `markLocationByCoordinates(lat, lng)`

Adds a location marker by coordinates.

**Parameters:**
- `lat` (number, required): Latitude
- `lng` (number, required): Longitude

**Returns:** Marker object

**Example:**
```javascript
markLocationByCoordinates(25.0330, 121.5654);
```

### Export Handler API

#### `exportMap(format, quality)`

Exports the current map view as an image.

**Parameters:**
- `format` (string, optional): 'png' or 'jpg' (default: 'png')
- `quality` (number, optional): 0-1 for JPG quality (default: 0.9)

**Returns:** Promise that resolves with Blob

**Example:**
```javascript
const blob = await exportMap('png');
// Trigger download
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'map.png';
link.click();
```

### State Management API

#### `getMapState()`

Returns current map state object.

**Returns:** State object

**Example:**
```javascript
const state = getMapState();
console.log(state.territories);
console.log(state.locations);
```

#### `clearTerritories()`

Removes all territory markings.

**Returns:** void

#### `clearLocations()`

Removes all location markers.

**Returns:** void

#### `clearAll()`

Removes all territories and locations.

**Returns:** void

## Error Handling

### Error Object Structure

```javascript
{
  type: 'GeocodingError',
  message: 'Territory not found',
  details: {...},
  timestamp: '2024-01-01T00:00:00Z'
}
```

### Error Types

- `GeocodingError`: Geocoding API failed
- `BoundaryLoadError`: Boundary file failed to load
- `ValidationError`: Input validation failed
- `ExportError`: Export operation failed
- `MapError`: Map operation failed

## Rate Limiting

### Mapbox Rate Limits

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Map Loads | 50,000/month | $5 per 1,000 |
| Geocoding | 100,000/month | $0.75 per 1,000 |
| Static Images | 50,000/month | $5 per 1,000 |

### Handling Rate Limits

```javascript
// Check usage before operations
async function checkRateLimit() {
  // Implement rate limit checking
  // Show warning at 80% usage
  // Show error at 100% usage
}
```

## Authentication

### Mapbox Token

- Stored in `config.js`
- Required for all Mapbox API calls
- Should have scoped permissions
- Never commit to public repositories

### Token Scope

- `styles:read`: Read map styles
- `fonts:read`: Read fonts
- `datasets:read`: Read datasets
- `geocoding:read`: Geocoding API access

## Best Practices

1. **Caching**: Cache geocoding results when possible
2. **Error Handling**: Always handle API errors gracefully
3. **Rate Limiting**: Monitor API usage
4. **Validation**: Validate inputs before API calls
5. **Loading States**: Show loading indicators during API calls
6. **Retry Logic**: Implement retry for failed requests

## Testing APIs

### Test Geocoding

```javascript
// Test forward geocoding
const result = await geocodeForward('Taipei');
console.log('Coordinates:', result.center);

// Test reverse geocoding
const result = await geocodeReverse(25.0330, 121.5654);
console.log('Place name:', result.place_name);
```

### Test Map Operations

```javascript
// Test map initialization
const map = await initializeMap();
console.log('Map initialized:', !!map);

// Test layer addition
await addTerritoryLayer('test-id', geoJsonData);
console.log('Layer added:', map.getLayer('test-id') !== undefined);
```

## Resources

- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/api/)
- [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding/)
- [Mapbox Static Images API](https://docs.mapbox.com/api/maps/static-images/)
- [Mapbox Pricing](https://www.mapbox.com/pricing/)

