import React, { useState, useEffect, useRef } from 'react';

// Demo component showing the concept of country + admin area overlay
export default function MapOverlayDemo() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryColor, setCountryColor] = useState('#6CA7A1');
  const [adminAreas, setAdminAreas] = useState([]);
  const [adminColor, setAdminColor] = useState('#E07B53');
  const [overlayMode, setOverlayMode] = useState(false);

  // Sample countries and their admin areas for demo
  const countries = {
    taiwan: {
      name: '台灣',
      color: '#6CA7A1',
      admins: ['台北市', '新北市', '桃園市', '台中市', '高雄市', '台南市']
    },
    japan: {
      name: '日本',
      color: '#7B9ED0',
      admins: ['東京都', '大阪府', '京都府', '北海道', '福岡縣', '沖繩縣']
    },
    korea: {
      name: '韓國',
      color: '#D4A574',
      admins: ['首爾', '釜山', '仁川', '大邱', '濟州']
    }
  };

  const handleCountrySelect = (countryId) => {
    setSelectedCountry(countryId);
    setAdminAreas([]);
    setOverlayMode(false);
  };

  const handleAdminToggle = (admin) => {
    if (adminAreas.includes(admin)) {
      setAdminAreas(adminAreas.filter(a => a !== admin));
    } else {
      setAdminAreas([...adminAreas, admin]);
    }
  };

  const colorPresets = ['#6CA7A1', '#E07B53', '#7B9ED0', '#D4A574', '#9B7EBD', '#5DAE8B'];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Map Overlay Demo
        </h1>
        <p className="text-gray-600 mb-6">
          Color a country, then overlay administrative areas on top
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Control Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              Step 1: Select Country
            </h2>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(countries).map(([id, country]) => (
                <button
                  key={id}
                  onClick={() => handleCountrySelect(id)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    selectedCountry === id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {country.name}
                </button>
              ))}
            </div>

            {selectedCountry && (
              <>
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Country Color
                </h3>
                <div className="flex gap-2 mb-6">
                  {colorPresets.map(color => (
                    <button
                      key={color}
                      onClick={() => setCountryColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        countryColor === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-700">
                    Step 2: Overlay Admin Areas
                  </h2>
                  <button
                    onClick={() => setOverlayMode(!overlayMode)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      overlayMode
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {overlayMode ? 'Overlay ON' : 'Overlay OFF'}
                  </button>
                </div>

                {overlayMode && (
                  <>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">
                      Admin Area Color
                    </h3>
                    <div className="flex gap-2 mb-4">
                      {colorPresets.map(color => (
                        <button
                          key={color}
                          onClick={() => setAdminColor(color)}
                          className={`w-8 h-8 rounded-full transition-transform ${
                            adminColor === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {countries[selectedCountry].admins.map(admin => (
                        <button
                          key={admin}
                          onClick={() => handleAdminToggle(admin)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            adminAreas.includes(admin)
                              ? 'text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          style={adminAreas.includes(admin) ? { backgroundColor: adminColor } : {}}
                        >
                          {admin}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Preview Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              Preview (Layer Stack)
            </h2>
            
            <div className="relative h-64 bg-gray-50 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
              {/* Base map representation */}
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                Base Map
              </div>
              
              {/* Country layer */}
              {selectedCountry && (
                <div
                  className="absolute inset-4 rounded-lg flex items-center justify-center text-white font-medium transition-all"
                  style={{ 
                    backgroundColor: countryColor,
                    opacity: 0.7
                  }}
                >
                  {countries[selectedCountry].name}
                </div>
              )}
              
              {/* Admin areas overlay */}
              {overlayMode && adminAreas.length > 0 && (
                <div className="absolute inset-8 grid grid-cols-2 gap-2">
                  {adminAreas.map((admin, i) => (
                    <div
                      key={admin}
                      className="rounded flex items-center justify-center text-white text-xs font-medium shadow-md transition-all"
                      style={{ 
                        backgroundColor: adminColor,
                        opacity: 0.9
                      }}
                    >
                      {admin}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Layer stack visualization */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-600 mb-3">
                Layer Stack (Top → Bottom)
              </h3>
              <div className="space-y-2">
                {overlayMode && adminAreas.length > 0 && (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: adminColor }}
                    />
                    <span className="text-sm text-gray-700">
                      Admin Areas ({adminAreas.length} selected)
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      z-index: 3
                    </span>
                  </div>
                )}
                {selectedCountry && (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: countryColor }}
                    />
                    <span className="text-sm text-gray-700">
                      {countries[selectedCountry].name} (Country)
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      z-index: 2
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-4 h-4 rounded bg-gray-300" />
                  <span className="text-sm text-gray-700">Base Map</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    z-index: 1
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Guide */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Implementation in Your Mapbox System
          </h2>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-100">
{`// Key modification for app-enhanced.js

// 1. Add state to track overlay mode
appState.overlayMode = false;  // Allow admin areas on top of colored country

// 2. Modify applyColorToArea to support overlay
function applyColorToArea(areaId, areaType, color, isOverlay = false) {
  const layerId = \`colored-\${areaType}-\${areaId}\`;
  
  // Set z-index based on layer type
  const beforeLayerId = isOverlay 
    ? null  // Admin areas go on top
    : 'admin-areas-layer';  // Country goes below admin areas
  
  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: 'fill',
      source: getSourceForAreaType(areaType),
      'source-layer': getSourceLayerForAreaType(areaType),
      filter: createFilterForArea(areaId, areaType),
      paint: {
        'fill-color': color,
        'fill-opacity': isOverlay ? 0.85 : 0.6  // Higher opacity for overlay
      }
    }, beforeLayerId);
  }
}

// 3. Enable overlay when selecting admin areas
function handleAdminAreaSelection(feature, color) {
  if (appState.selectedCountry) {
    // Country is already colored, add admin area as overlay
    applyColorToArea(feature.id, 'admin', color, true);
  }
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
