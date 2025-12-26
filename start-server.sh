#!/bin/bash

# Quick Start Local Server
# Starts a local server for testing GADM files

echo "🚀 Starting Local Server..."
echo ""

# Check what's available
if command -v python3 &> /dev/null; then
    echo "✅ Using Python HTTP Server"
    echo "📍 Server will be at: http://localhost:8000"
    echo ""
    echo "📁 GADM files will be at:"
    echo "   http://localhost:8000/data/gadm/optimized/gadm_level0_optimized.geojson"
    echo "   http://localhost:8000/data/gadm/optimized/gadm_level1_optimized.geojson"
    echo "   http://localhost:8000/data/gadm/optimized/gadm_level2_optimized.geojson"
    echo ""
    echo "⏹️  Stop server: Press Ctrl+C"
    echo ""
    python3 -m http.server 8000
    
elif command -v node &> /dev/null; then
    echo "✅ Using Node.js Server"
    echo ""
    node server.js
    
elif command -v php &> /dev/null; then
    echo "✅ Using PHP Server"
    echo "📍 Server will be at: http://localhost:8000"
    echo ""
    php -S localhost:8000
    
else
    echo "❌ No server found!"
    echo ""
    echo "Please install one of:"
    echo "  • Python 3: brew install python3 (Mac)"
    echo "  • Node.js: https://nodejs.org/"
    echo "  • PHP: brew install php (Mac)"
    exit 1
fi





