# Map Tool Enhancement Plan - Version 2.0

## Overview

Upgrade the map tool with advanced features, Google Material Design, and improved UX for institutional use.

---

## Feature Requirements

### 1. Text Labels Toggle
**Requirement:** Turn on/off text labels on map

**Implementation:**
- Add toggle button/switch in UI
- Toggle `text-field` visibility in map layers
- Control via Mapbox layer properties
- Save state in user preferences

**UI Element:**
```
[Toggle Switch] Show Labels
```

---

### 2. Map Style Switcher
**Requirement:** Switch between:
- Satellite view
- Gray/Grayscale view  
- Basic/Standard map
- Global view (worldwide overview)

**Implementation:**
- Style selector dropdown or button group
- Switch Mapbox map style dynamically
- Preserve boundary layers when switching
- Store current style in state

**Map Styles:**
- `mapbox://styles/mapbox/satellite-v9` - Satellite
- `mapbox://styles/mapbox/light-v11` - Gray/Basic
- `mapbox://styles/mapbox/streets-v12` - Standard
- Custom minimal style - Global view

**UI Element:**
```
Map Style: [Satellite] [Gray] [Standard] [Global]
```

---

### 3. Boundary Type Selection
**Requirement:** Select which boundaries to show:
- Country boundaries
- State/Province boundaries
- County/City boundaries

**Current State:** Has 4 map types but switches entire map
**Enhancement:** Overlay boundaries on any map style

**Implementation:**
- Add boundary layers as overlays (not separate map types)
- Toggle boundaries on/off independently
- Support multiple boundary types at once
- Use Mapbox vector tiles for each boundary type

**UI Element:**
```
Boundaries:
☑ Country    ☑ State/Province    ☑ County/City
```

---

### 4. Fill vs Line Mode for Boundaries
**Requirement:** 
- Choose fill (colored area) OR line (outline only)
- Click directly on map to select/color boundaries

**Implementation:**
- Mode selector: "Fill" or "Line Only"
- Click detection on map features
- Reverse geocoding to identify clicked boundary
- Color picker for selected boundary
- Visual feedback on hover

**UI Element:**
```
Boundary Style: [Fill] [Line Only]
Click on map to select boundary
```

**Click Interaction:**
```
User clicks map → 
  Detect which feature clicked →
    Show boundary name →
      User selects color →
        Apply to that boundary
```

---

### 5. River Layer
**Requirement:**
- Toggle river layer on/off
- Change river color

**Implementation:**
- Add Mapbox water/river vector layer
- Toggle visibility
- Color picker for river styling
- Layer order: rivers below boundaries

**UI Element:**
```
Rivers: [Toggle ON/OFF]
River Color: [Color Picker]
```

---

### 6. Multi-Country Selection with Colors
**Requirement:**
- Search and choose multiple countries at once
- Assign different color to each country

**Implementation:**
- Multi-select dropdown with search
- Color assignment interface
  - Option 1: Table view (Country | Color picker)
  - Option 2: Chip/badge view with color dots
- Batch add countries with colors
- Visual color legend

**UI Element:**
```
Countries:
[Search box with autocomplete]
┌─────────────────────────┐
│ Taiwan          [🔵] ❌ │
│ USA             [🔴] ❌ │
│ Japan           [🟠] ❌ │
└─────────────────────────┘
```

---

### 7. Multiple Location Markers
**Requirement:**
- Add multiple markers at specific locations
- Choose marker color
- Choose marker icon (basic map icons)

**Implementation:**
- Marker management system
- Icon library (Material Icons or Mapbox markers)
- Color picker for markers
- Marker list/panel showing all markers
- Click map to add marker
- Click marker to edit/delete

**UI Element:**
```
Markers:
[Add Marker] [Clear All]

Marker 1: Taipei (25.0330, 121.5654) [🔴 Pin] [Edit] [Delete]
Marker 2: Tokyo (35.6762, 139.6503)  [🔵 Pin] [Edit] [Delete]
```

**Icon Options:**
- Pin (default)
- Circle
- Star
- Flag
- Custom Material Icons

---

### 8. Google Material Design
**Requirement:** Use Material Design principles

**Implementation:**
- Material Design Components (MDC Web)
- Material Icons (already included)
- Material Design color palette
- Material Design typography
- Material Design spacing/shadows
- Material Design animations

**Key Principles:**
- Elevation (shadows for depth)
- Motion (smooth transitions)
- Color (primary/secondary/accent)
- Typography (Roboto-like fonts)
- Layout (8dp grid system)

---

### 9. Dynamic Design References
**References:**
- Google Maps interface
- Mapbox Studio interface
- ArcGIS Online
- Tableau mapping tools

**Design Patterns:**
- Collapsible side panels
- Floating action buttons
- Card-based layouts
- Bottom sheets for options
- Tooltips and help text

---

### 10. Institutional Use Requirements
**Requirements:**
- Easy to use
- Clean interface
- Professional appearance
- Intuitive workflow

**Design Approach:**
- Clear visual hierarchy
- Logical grouping of controls
- Helpful tooltips
- Keyboard shortcuts
- Undo/redo functionality
- Export with metadata

---

## Technical Architecture Plan

### File Structure
```
map-tool-v2/
├── index.html
├── config.js
├── css/
│   ├── material-components.css  # MDC Web
│   ├── material-icons.css
│   └── styles.css               # Custom styles
├── js/
│   ├── app.js                   # Main app
│   ├── ui/
│   │   ├── material-ui.js       # Material components
│   │   ├── side-panel.js        # Side control panel
│   │   └── color-picker.js      # Color selection
│   ├── map/
│   │   ├── map-init.js          # Map initialization
│   │   ├── style-switcher.js    # Style switching
│   │   ├── boundary-handler.js  # Boundary management
│   │   └── layer-manager.js     # Layer control
│   ├── features/
│   │   ├── text-labels.js       # Label toggle
│   │   ├── river-layer.js       # River management
│   │   ├── country-selector.js  # Multi-country selection
│   │   └── marker-manager.js    # Marker management
│   ├── interaction/
│   │   ├── map-click.js         # Click to select
│   │   └── boundary-selector.js # Boundary selection
│   └── utils/
│       ├── country-codes.js
│       └── helpers.js
└── assets/
    └── icons/                   # Custom icons
```

---

## UI Layout Plan

### Layout Structure (Material Design)
```
┌─────────────────────────────────────────────┐
│  Header Bar (Material Design)               │
│  [Menu] Title                    [Settings] │
└─────────────────────────────────────────────┘
┌──────┬──────────────────────────────────────┐
│      │                                      │
│ Side │          Map Area                    │
│ Panel│                                      │
│      │                                      │
│ [Collapsible]│                              │
│              │                              │
│ Controls:    │                              │
│ • Map Style  │                              │
│ • Boundaries │                              │
│ • Rivers     │                              │
│ • Countries  │                              │
│ • Markers    │                              │
│              │                              │
└──────┴──────────────────────────────────────┘
```

### Side Panel Sections
1. **Map Style** - Style switcher
2. **Labels** - Text label toggle
3. **Boundaries** - Boundary type selection, fill/line mode
4. **Rivers** - River toggle and color
5. **Countries** - Multi-country selector with colors
6. **Markers** - Marker management
7. **Export** - Download options

---

## Implementation Phases

### Phase 1: UI Redesign (Material Design)
**Tasks:**
1. Install Material Design Components (MDC Web)
2. Create side panel layout
3. Redesign header with Material Design
4. Update button styles (Material Design)
5. Add Material Icons
6. Implement color picker component
7. Create card-based control sections

**Duration:** 2-3 days

---

### Phase 2: Map Style & Layer Controls
**Tasks:**
1. Map style switcher (Satellite, Gray, Standard, Global)
2. Text label toggle functionality
3. Boundary layer toggle (independent layers)
4. River layer implementation
5. Layer visibility management

**Duration:** 2-3 days

---

### Phase 3: Interactive Boundary Selection
**Tasks:**
1. Fill vs Line mode toggle
2. Map click detection
3. Feature identification on click
4. Boundary selection by clicking
5. Color picker integration
6. Visual feedback (hover, selection)

**Duration:** 2-3 days

---

### Phase 4: Multi-Country Selection
**Tasks:**
1. Searchable multi-select dropdown
2. Country list management UI
3. Individual color assignment
4. Batch operations
5. Visual color legend
6. Export country list

**Duration:** 2-3 days

---

### Phase 5: Marker System
**Tasks:**
1. Multiple marker support
2. Marker icon selection
3. Marker color customization
4. Marker management panel
5. Click-to-add-marker
6. Marker editing/deletion
7. Marker export in image

**Duration:** 2-3 days

---

### Phase 6: Polish & Testing
**Tasks:**
1. Keyboard shortcuts
2. Tooltips and help text
3. Undo/redo functionality
4. Performance optimization
5. Mobile responsiveness
6. Cross-browser testing
7. User testing and feedback

**Duration:** 2-3 days

---

## Technology Stack

### Libraries Needed
- **Material Design Components (MDC Web)** - UI components
- **Mapbox GL JS** - Map rendering (already have)
- **Material Icons** - Icons (already have)
- **Color Picker Library** - e.g., `@simonwep/pickr` or Material Design color picker

### Mapbox APIs Needed
- Vector tiles for boundaries (already have)
- Water/river layers from Mapbox
- Geocoding API (already using)

---

## UI Components (Material Design)

### Components to Implement
1. **Cards** - For each control section
2. **Switches** - Toggle on/off
3. **Select Menus** - Dropdowns
4. **Chips** - Country/marker tags
5. **Buttons** - Material Design buttons
6. **Dialogs** - For color picker, confirmation
7. **Bottom Sheets** - For mobile options
8. **Tooltips** - Help text
9. **Text Fields** - Input with Material Design
10. **Lists** - Country/marker lists

---

## User Workflow Examples

### Workflow 1: Create Map with Multiple Countries
```
1. Select map style (e.g., Gray)
2. Toggle boundaries (Country boundaries ON)
3. Search and select multiple countries
4. Assign different color to each
5. Turn on rivers (optional)
6. Add location markers
7. Export map
```

### Workflow 2: Click-to-Select Boundary
```
1. Select "Fill" or "Line" mode
2. Click on map boundary
3. Boundary highlights
4. Color picker appears
5. Select color
6. Boundary changes color
```

### Workflow 3: Add Multiple Markers
```
1. Click "Add Marker" button
2. Click on map location
3. Marker appears
4. Edit marker: change icon/color/label
5. Repeat for more markers
6. All markers visible in side panel
```

---

## Configuration Updates

### New Config Options
```javascript
MAP_STYLES: {
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  gray: 'mapbox://styles/mapbox/light-v11',
  standard: 'mapbox://styles/mapbox/streets-v12',
  global: 'mapbox://styles/mapbox/light-v10'
},

BOUNDARIES: {
  country: { source: '...', toggle: true },
  state: { source: '...', toggle: true },
  county: { source: '...', toggle: true }
},

RIVERS: {
  enabled: false,
  color: '#4A90E2',
  source: 'mapbox://mapbox.water'
},

MARKERS: {
  defaultIcon: 'pin',
  defaultColor: '#FF0000',
  icons: ['pin', 'circle', 'star', 'flag']
}
```

---

## Design Mockup Structure

### Side Panel Layout
```
┌─────────────────────────────┐
│  Map Controls               │
├─────────────────────────────┤
│                             │
│ ▼ Map Style                │
│   [Satellite] [Gray] [Basic]│
│                             │
│ ▼ Labels                   │
│   [Toggle: ON]              │
│                             │
│ ▼ Boundaries               │
│   ☑ Country                │
│   ☑ State/Province         │
│   ☐ County/City            │
│   Mode: [Fill] [Line]      │
│                             │
│ ▼ Rivers                   │
│   [Toggle: OFF]            │
│   Color: [🔵]               │
│                             │
│ ▼ Countries                │
│   [Search countries...]     │
│   ┌─────────────────────┐  │
│   │ Taiwan    [🔵] [×]  │  │
│   │ USA       [🔴] [×]  │  │
│   └─────────────────────┘  │
│                             │
│ ▼ Markers                  │
│   [+ Add Marker]           │
│   ┌─────────────────────┐  │
│   │ Marker 1 [🔴 Pin]   │  │
│   │ Marker 2 [🔵 Star]  │  │
│   └─────────────────────┘  │
│                             │
│ ▼ Export                   │
│   [Download PNG]           │
│   [Download SVG]           │
│                             │
└─────────────────────────────┘
```

---

## Key Implementation Details

### 1. Material Design Integration
- Use MDC Web library
- Follow Material Design guidelines
- Consistent spacing (8dp grid)
- Proper elevation/shadows
- Smooth animations

### 2. State Management
```javascript
const appState = {
  mapStyle: 'gray',
  labelsVisible: true,
  boundaries: {
    country: { visible: true, mode: 'fill' },
    state: { visible: false, mode: 'fill' },
    county: { visible: false, mode: 'line' }
  },
  rivers: { visible: false, color: '#4A90E2' },
  countries: [
    { code: 'TWN', color: '#004e98' },
    { code: 'USA', color: '#980000' }
  ],
  markers: [
    { id: 1, lat: 25.0330, lng: 121.5654, icon: 'pin', color: '#FF0000' }
  ]
};
```

### 3. Click-to-Select Logic
```javascript
map.on('click', (e) => {
  const features = map.queryRenderedFeatures(e.point, {
    layers: ['country-boundaries', 'state-boundaries', ...]
  });
  
  if (features.length > 0) {
    const feature = features[0];
    const countryCode = feature.properties.iso_3166_1_alpha_3;
    showColorPicker(countryCode);
  }
});
```

### 4. Multi-Select Country Interface
- Search with autocomplete
- Selected countries shown as chips/badges
- Each chip has color indicator
- Click chip to change color
- Click X to remove

---

## Estimated Timeline

**Total Development Time: 15-18 days**

- Phase 1: UI Redesign (2-3 days)
- Phase 2: Map Style & Layers (2-3 days)
- Phase 3: Interactive Selection (2-3 days)
- Phase 4: Multi-Country (2-3 days)
- Phase 5: Markers (2-3 days)
- Phase 6: Polish (2-3 days)

---

## Dependencies to Add

```html
<!-- Material Design Components -->
<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
<link rel="stylesheet" href="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css">
<script src="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js"></script>

<!-- Color Picker -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@simonwep/pickr/dist/themes/nano.min.css"/>
<script src="https://cdn.jsdelivr.net/npm/@simonwep/pickr/dist/pickr.min.js"></script>
```

---

## Risk Assessment

### Potential Challenges
1. **Mapbox river layer availability** - May need alternative source
2. **Click detection accuracy** - Need precise feature detection
3. **Performance with many countries** - Need optimization
4. **Material Design learning curve** - Need to learn MDC Web

### Mitigation
1. Research alternative river data sources (OpenStreetMap)
2. Use Mapbox queryRenderedFeatures with proper layer filtering
3. Implement layer batching and simplification
4. Start with basic Material components, expand gradually

---

## Success Criteria

✅ All features work as specified
✅ Material Design principles followed
✅ Clean, intuitive interface
✅ Fast performance (< 3s load time)
✅ Works on modern browsers
✅ Mobile responsive
✅ Easy for institutional users
✅ Professional appearance

---

## Questions Before Implementation

1. **River layer source** - Use Mapbox water layers or alternative?
2. **Marker icons** - Material Icons or custom SVG?
3. **Color picker** - Prefer specific library?
4. **Side panel** - Always visible or collapsible?
5. **Mobile priority** - Mobile-first or desktop-first design?
6. **Language** - Keep Chinese or add English toggle?

---

## Next Steps

1. Review this plan
2. Confirm features and priorities
3. Approve technology choices
4. Decide on design details
5. Start implementation phase by phase

---

**Ready for your approval to proceed!** 🚀


