#!/bin/bash
# Live Preview Server with Auto-Reload
# Serves static files AND handles API routes
# Auto-restarts server when files change (browser refresh needed)

echo "🚀 Starting Combined Server (Static Files + API)..."
echo ""
echo "📍 Server will be at: http://localhost:8000"
echo "📁 Main page: http://localhost:8000/index-enhanced.html"
echo "🔒 API endpoint: http://localhost:8000/api/gemini/generateContent"
echo "🔄 Auto-restart enabled - server will restart on file changes"
echo "   (Refresh browser after server restarts)"
echo ""
echo "⏹️  Stop server: Press Ctrl+C"
echo ""

npm run dev

