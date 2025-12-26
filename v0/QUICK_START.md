# Quick Start Guide - Phase 1

## ✅ What's Been Built

Phase 1 is complete with all features matching the old tool:

### Features Implemented:

1. **4 Map Types** - Country, State, County, World boundaries
   - Switch between map types via links
   - Each map type has its own style

2. **Country Selection** - ISO 3166-1 alpha-3 codes
   - Complete country list with Chinese/English names
   - Datalist for easy selection
   - Toggle countries on/off

3. **Color Selection** - 5 preset colors
   - Blue (#004e98)
   - Red (#980000)
   - Orange (#FF6B00)
   - Dark Gray (#000000)
   - Light Gray (#777777)

4. **Location Markers** - Coordinate input
   - Accepts "latitude,longitude" format
   - Auto-centers map on coordinates
   - Clear marker button

5. **Map Export** - Canvas-based download
   - PNG format
   - Includes markers
   - Timestamp in filename

6. **UI Controls**
   - Clear territory colors
   - Clear location markers
   - Google Maps link
   - Google Drive link

### Technical Implementation:

- ✅ Mapbox Vector Tiles (not GeoJSON)
- ✅ Worldview filtering for disputed territories
- ✅ Canvas export method
- ✅ Responsive design
- ✅ Clean code structure

## 🚀 Getting Started

### 1. Configure Mapbox Token

Edit `config.js` and replace:
```javascript
TOKEN: 'YOUR_MAPBOX_ACCESS_TOKEN',
```

With your actual Mapbox token:
```javascript
TOKEN: 'pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNs...',
```

### 2. Open in Browser

**Option 1: Direct file**
- Open `index.html` in your browser
- Note: Some browsers block local files from loading scripts

**Option 2: Local server (recommended)**
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve

# Then open: http://localhost:8000
```

### 3. Use the Tool

1. Select a map type (國界版, 省州界版, 縣市界版, 小地圖用)
2. Select a color
3. Enter a country code (e.g., "TWN" for Taiwan) or select from dropdown
4. Enter coordinates to mark a location (e.g., "25.0330,121.5654")
5. Click "下載圖檔" to download the map

## 📁 File Structure

```
map/
├── index.html              # Main HTML file
├── config.js               # Configuration (UPDATE YOUR TOKEN HERE!)
├── css/
│   └── styles.css         # Styling
└── js/
    ├── app.js             # Main application logic
    └── utils/
        └── country-codes.js  # Country code mappings
```

## 🎯 Features Matching Old Tool

| Feature | Old Tool | New Tool | Status |
|---------|----------|----------|--------|
| 4 Map Types | ✅ | ✅ | ✅ |
| Country Selection | ✅ | ✅ | ✅ |
| Color Selection | ✅ | ✅ | ✅ |
| Location Markers | ✅ | ✅ | ✅ |
| Export/Download | ✅ | ✅ | ✅ |
| Vector Tiles | ✅ | ✅ | ✅ |
| Worldview Filter | ✅ | ✅ | ✅ |
| Canvas Export | ✅ | ✅ | ✅ |

## 🐛 Known Issues / Limitations

1. **Mapbox Token Required** - Must be set in config.js
2. **Custom Map Styles** - Uses custom Mapbox styles from old tool (may need update if they don't exist)
3. **No Name Search Yet** - Only ISO codes (Phase 2 feature)

## 🔜 Next Steps (Phase 2)

- Name-based territory search
- Save/load configurations
- Template system
- Backend integration

## 📝 Notes

- All colors match old tool exactly
- Export method uses same canvas approach as old tool
- Responsive design added (old tool was fixed size)
- Cleaner code structure with separation of concerns

