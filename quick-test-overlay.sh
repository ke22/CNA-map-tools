#!/bin/bash

# Quick Test Script for Overlay Feature

echo "🚀 Starting test server..."
echo ""
echo "📝 Test Steps:"
echo "1. Open browser: http://localhost:8000/index-enhanced.html"
echo "2. Switch to '行政區' mode"
echo "3. Enable '疊加模式'"
echo "4. Click a country (e.g., Taiwan)"
echo "5. Change color, click an admin area (e.g., Taipei)"
echo "6. Check overlay effect!"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 -m http.server 8000
