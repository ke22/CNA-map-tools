# Map Download Tool - Technical Specification

## Overview

The Map Download Tool is a client-side web application that allows users to create custom maps with territory and location markers, then export them as images. Built using Mapbox GL JS, it operates entirely in the browser with no backend requirements.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────┐
│           Web Browser (Client)          │
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │   UI     │  │   Map    │  │ Export ││
│  │ Controls │→ │ Renderer │→ │ Handler││
│  └──────────┘  └──────────┘  └────────┘│
│       ↓             ↓            ↓      │
│  ┌─────────────────────────────────────┐│
│  │      State Management Object        ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
       ↓                    ↓
┌──────────────┐   ┌──────────────┐
│   Mapbox     │   │  html2canvas │
│   APIs       │   │   Library    │
└──────────────┘   └──────────────┘
```

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Map Rendering | Mapbox GL JS | v2.15.0+ | Interactive map display |
| Geocoding | Mapbox Geocoding API | v5 | Name/coordinate lookup |
| Image Export | html2canvas | v1.4.1+ | Map screenshot |
| Language | JavaScript (ES6+) | - | Core logic |
| Styling | CSS3 | - | UI styling |
| Markup | HTML5 | - | Structure |

## Data Flow

### Territory Marking Flow

```
User Input (Name/Coords)
    ↓
Input Validation
    ↓
Geocoding API Call
    ↓
Get Territory Boundary
    ↓
Load Boundary GeoJSON
    ↓
Add Colored Layer to Map
    ↓
Update State Object
```

### Location Marking Flow

```
User Input (Name/Coords)
    ↓
Input Validation
    ↓
Geocoding (if name)
    ↓
Get Coordinates
    ↓
Create Marker
    ↓
Add Marker to Map
    ↓
Update State Object
```

### Export Flow

```
User Clicks Download
    ↓
Capture Map Container
    ↓
Render to Canvas (html2canvas)
    ↓
Convert to Blob
    ↓
Create Download Link
    ↓
Trigger Download
```

## State Management

### State Object Structure

```javascript
const mapState = {
  // Map configuration
  mapInstance: null,           // Mapbox map object
  currentMapType: 'county',    // Selected map type
  center: [121, 23.5],         // Map center [lng, lat]
  zoom: 7,                     // Zoom level
  
  // Territories
  territories: [               // Array of marked territories
    {
      id: 'territory_1',
      name: 'Taipei',
      coordinates: [121.5654, 25.0330],
      color: '#3B82F6',
      boundary: {...}          // GeoJSON feature
    }
  ],
  
  // Locations
  locations: [                 // Array of marked locations
    {
      id: 'location_1',
      name: 'City Hall',
      coordinates: [121.5654, 25.0330],
      marker: {...}            // Mapbox marker object
    }
  ],
  
  // UI State
  selectedColor: '#3B82F6',    // Currently selected color
  isLoading: false,            // Loading state
  error: null                  // Error message
};
```

## Map Types

### 1. Country Boundary Version (國界版)
- **Purpose**: Show country-level boundaries
- **Data Source**: Natural Earth (naturalearthdata.com)
- **Scale**: 1:10m or 1:50m
- **Use Case**: International maps, country-level analysis
- **File**: `data/boundaries/countries.geojson`

### 2. State/City Boundary Version (省州界版)
- **Purpose**: Show state/province/city boundaries
- **Data Source**: GADM (gadm.org) or custom
- **Scale**: Varies by region
- **Use Case**: Regional maps, state-level analysis
- **File**: `data/boundaries/states.geojson`

### 3. County/City Boundary Version (縣市界版)
- **Purpose**: Show county/city-level boundaries
- **Data Source**: Taiwan government open data or custom
- **Scale**: Detailed local boundaries
- **Use Case**: Local maps, detailed regional analysis
- **File**: `data/boundaries/counties.geojson`

### 4. World Map Version (小地圖用)
- **Purpose**: Global view with country boundaries
- **Data Source**: Natural Earth (simplified)
- **Scale**: 1:110m (low detail)
- **Use Case**: Overview maps, global context
- **File**: `data/boundaries/world.geojson`

## Coordinate Systems

### Supported Formats

1. **Decimal Degrees**
   - Format: `latitude,longitude`
   - Example: `25.0330,121.5654`
   - Precision: Up to 6 decimal places

2. **Alternative Format**
   - Format: `longitude,latitude` (also accepted)
   - Example: `121.5654,25.0330`

3. **Google Maps Format**
   - Accepts coordinates copied from Google Maps
   - Auto-detects format

### Coordinate Validation

- Latitude: -90 to 90
- Longitude: -180 to 180
- Decimal point required
- Comma separator required

## Color System

### Available Colors

| Color Name | Hex Code | RGB | Use Case |
|------------|----------|-----|----------|
| Blue (藍) | `#3B82F6` | rgb(59, 130, 246) | Default, primary territories |
| Red (紅) | `#EF4444` | rgb(239, 68, 68) | Important, highlighted |
| Orange (橙) | `#F97316` | rgb(249, 115, 22) | Secondary territories |
| Dark Gray (深灰) | `#4B5563` | rgb(75, 85, 99) | Neutral, background |
| Light Gray (淺灰) | `#9CA3AF` | rgb(156, 163, 175) | Subtle, less important |

### Color Application

- Territories: Fill color with 50% opacity
- Stroke: Black, 1px width
- Markers: Use full color, no opacity

## Boundary Data Format

### GeoJSON Structure

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Taipei",
        "name_en": "Taipei",
        "id": "TW-TPE"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[...]]]
      }
    }
  ]
}
```

### Required Properties

- `name`: Territory name (primary identifier)
- `name_en`: English name (optional but recommended)
- `id`: Unique identifier (optional)

### Data Optimization

- Simplify geometries for performance
- Remove unnecessary properties
- Compress GeoJSON if possible
- Consider TopoJSON for smaller files

## Error Handling

### Error Types

1. **Geocoding Errors**
   - Territory not found
   - Invalid coordinates
   - API rate limit exceeded
   - Network error

2. **Map Errors**
   - Mapbox token invalid
   - Boundary file not found
   - Map initialization failed

3. **Export Errors**
   - Canvas rendering failed
   - Browser not supported
   - Export timeout

### Error Handling Strategy

```javascript
try {
  // Operation
} catch (error) {
  // Log error
  Logger.error('Operation failed', error);
  
  // Show user-friendly message
  showError('User-friendly message');
  
  // Update state
  mapState.error = error.message;
  
  // Report to analytics (optional)
  if (CONFIG.ENABLE_ANALYTICS) {
    trackError(error);
  }
}
```

## Performance Considerations

### Optimization Strategies

1. **Boundary Data**
   - Simplify GeoJSON (reduce coordinates)
   - Use TopoJSON for smaller files
   - Lazy load boundaries per map type
   - Cache loaded boundaries

2. **Map Rendering**
   - Limit number of visible layers
   - Remove unused layers
   - Optimize layer filters
   - Use appropriate zoom levels

3. **Memory Management**
   - Dispose map instances properly
   - Remove event listeners
   - Clear unused markers/layers
   - Garbage collection friendly

### Performance Targets

- Initial load: < 3 seconds
- Map type switch: < 1 second
- Territory marking: < 2 seconds
- Export generation: < 5 seconds

## Security Considerations

### Mapbox Token Security

- ✅ Use scoped tokens with URL restrictions
- ✅ Never commit tokens to public repositories
- ✅ Rotate tokens regularly
- ⚠️ Token visible in client-side code (acceptable for public tool)

### Input Sanitization

- Validate all user inputs
- Sanitize coordinate inputs
- Escape territory names
- Prevent XSS attacks

### CORS Configuration

- Configure CORS headers if using external data
- Use trusted data sources only
- Validate GeoJSON structure

## Browser Compatibility

### Minimum Requirements

- ES6 JavaScript support
- Canvas API support
- Fetch API support
- WebGL support (for Mapbox)

### Tested Browsers

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Safari | 14+ | ✅ Full support |
| Edge | 90+ | ✅ Full support |
| IE 11 | - | ❌ Not supported |

## Limitations

### Current Limitations

1. **No Save/Load**: Map configurations cannot be saved (Phase 2 feature)
2. **No User Accounts**: No authentication or user management
3. **No Collaboration**: Single-user only
4. **Limited Customization**: Fixed color palette
5. **No Templates**: Cannot save common map configurations
6. **Export Quality**: Limited by html2canvas quality

### Mapbox Free Tier Limits

- 50,000 map loads/month
- 100,000 geocoding requests/month
- Exceeding limits requires paid plan

## Future Enhancements (Phase 2)

- User authentication
- Save/load map configurations
- Template system
- Collaboration features
- Custom color picker
- Advanced export options
- API integration
- Analytics dashboard

## Testing Strategy

### Unit Tests

- Input validation functions
- Coordinate conversion
- Color handling
- State management

### Integration Tests

- Map initialization
- Boundary loading
- Territory marking
- Location marking
- Export functionality

### Manual Testing Checklist

- [ ] All 4 map types load correctly
- [ ] Territory marking works by name
- [ ] Territory marking works by coordinates
- [ ] Location marking works by name
- [ ] Location marking works by coordinates
- [ ] All colors apply correctly
- [ ] Clear buttons work
- [ ] Export generates image
- [ ] Export image is correct size
- [ ] Error messages display properly
- [ ] Works on all supported browsers
- [ ] Responsive design works on mobile

## Deployment

### Static Hosting

- GitHub Pages
- Netlify
- Vercel
- Any static file server

### Requirements

- HTTPS recommended (for Mapbox token security)
- No server-side processing needed
- CDN for faster loading (optional)

## Version History

- **v1.0.0** (2024): Initial release - Phase 1 standalone tool
