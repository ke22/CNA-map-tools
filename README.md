# Map Download Tool

A Mapbox-based web tool for creating custom maps with territory and location markers. Works entirely in the browser - no backend required. Perfect for small teams (0-10 users) creating maps for news, reports, or presentations.

## Features

- **4 Map Types**: Country boundaries, State/City boundaries, County/City boundaries, and World map
- **Territory Marking**: Mark countries/regions by name or coordinates with custom colors
- **Location Marking**: Add point markers by name or coordinates
- **Color Customization**: Choose from 5 preset colors (Blue, Red, Orange, Dark Gray, Light Gray)
- **Export/Download**: Download maps as PNG or JPG images
- **Zero Cost**: Uses Mapbox free tier (50k loads/month) - perfect for small teams
- **No Backend**: Works entirely client-side, accessible via URL

## Quick Start

### Prerequisites

- Web browser (Chrome, Firefox, Safari, Edge - modern versions)
- Mapbox access token (free at [mapbox.com](https://account.mapbox.com/))

### Installation

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd map-tool
   ```

2. **Get Mapbox Access Token**
   - Sign up at [mapbox.com](https://account.mapbox.com/)
   - Go to Account → Tokens
   - Copy your default public token

3. **Configure the Tool**
   - Open `config.js`
   - Replace `YOUR_MAPBOX_ACCESS_TOKEN` with your token:
   ```javascript
   MAPBOX_TOKEN: 'pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNs...'
   ```

4. **Open in Browser**
   - Option 1: Open `index.html` directly in your browser
   - Option 2: Use a local server:
     ```bash
     # Python
     python -m http.server 8000
     
     # Node.js
     npx serve
     
     # Then open http://localhost:8000
     ```

5. **Deploy (Optional)**
   - **GitHub Pages**: Push to GitHub, enable Pages in settings
   - **Netlify**: Drag & drop the folder to netlify.com
   - **Vercel**: Use Vercel CLI or dashboard

## Usage

### Basic Workflow

1. **Select Map Type**
   - Click on one of the 4 map type buttons
   - Map will reload with appropriate boundaries

2. **Mark Territories**
   - **By Name**: Enter territory name in coordinate input field
   - **By Coordinates**: Enter coordinates as "latitude,longitude" (e.g., "25.0330,121.5654")
   - Press Enter or click outside the field
   - Territory will be highlighted with selected color

3. **Mark Locations**
   - Enter location name or coordinates
   - Click "Mark Location" or press Enter
   - Marker will appear on map

4. **Download Map**
   - Click "Download Image File" button
   - Map will be exported as PNG image
   - Image will match current map view

### Coordinate Formats

- **Decimal Degrees**: `25.0330,121.5654` (latitude,longitude)
- **Google Maps**: Paste coordinates copied from Google Maps
- **Reverse Format**: The tool also accepts `longitude,latitude` format

### Tips

- Right-click on Google Maps → "What's here?" to get coordinates
- Use "Clear Map" buttons to remove all markings
- Switch map types at any time without losing markers
- Export at different zoom levels for different detail levels

## File Structure

```
map-tool/
├── index.html              # Main HTML file
├── config.js               # Configuration file
├── README.md               # This file
├── SPECIFICATION.md        # Technical specifications
├── API_DOCS.md            # API documentation
├── css/
│   └── styles.css         # Styling
├── js/
│   ├── utils/             # Utility functions
│   ├── map/               # Map initialization
│   ├── features/          # Feature handlers
│   ├── export/            # Export functionality
│   └── ui/                # UI controls
└── data/
    └── boundaries/        # GeoJSON boundary data
```

## Configuration

See `config.js` for all configuration options including:
- Mapbox token
- Default map settings (center, zoom)
- Color palette
- Export settings
- Feature flags

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Cost

**$0/month** - Uses free tiers:
- Mapbox: 50,000 map loads/month (free)
- Geocoding: 100,000 requests/month (free)
- Hosting: GitHub Pages/Netlify (free)

For teams of 0-10 users, this is typically more than enough.

## Troubleshooting

### Map not loading
- Check Mapbox token is correct in `config.js`
- Check browser console for errors
- Verify internet connection (Mapbox requires internet)

### Territories not marking
- Verify territory name is correct
- Try using coordinates instead
- Check browser console for geocoding errors

### Export not working
- Ensure html2canvas library loaded correctly
- Try different browser
- Check browser console for errors

### Slow performance
- Large boundary files may take time to load
- Try simplifying GeoJSON files
- Check browser console for warnings

## Development

See `SPECIFICATION.md` for detailed technical documentation.

## License

[Add your license here]

## Contributing

[Add contribution guidelines if open source]

## Support

For issues or questions:
- Check `SPECIFICATION.md` for technical details
- Check `API_DOCS.md` for API usage
- Open an issue on GitHub (if applicable)

## Version

- **Current Version**: 1.0.0
- **Last Updated**: 2024
- **Phase**: 1 (Standalone Tool)

