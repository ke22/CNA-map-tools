/**
 * Simple Local Server with CORS Support
 * For hosting GADM GeoJSON files locally
 * 
 * Usage:
 *   node server.js
 * 
 * Then access files at:
 *   http://localhost:8000/data/gadm/optimized/gadm_level0_optimized.geojson
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.geojson': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Create server
const server = http.createServer((req, res) => {
    // Add CORS headers (allows browser to load files)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS request (CORS preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Get file path
    let filePath = '.' + req.url;
    
    // Default to index.html if root
    if (filePath === './') {
        filePath = './index-enhanced.html';
    }
    
    // Get file extension
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Read file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <h1>404 - File Not Found</h1>
                    <p>Requested: ${req.url}</p>
                    <p>Make sure the file exists at: ${filePath}</p>
                `, 'utf-8');
            } else {
                // Server error
                res.writeHead(500);
                res.end('Server Error: ' + error.code + ' ..\n');
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Start server
server.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 Local Server Running!');
    console.log('='.repeat(50));
    console.log('');
    console.log(`📍 Server: http://localhost:${PORT}/`);
    console.log('');
    console.log('📁 GADM Files:');
    console.log(`   Level 0: http://localhost:${PORT}/data/gadm/optimized/gadm_level0_optimized.geojson`);
    console.log(`   Level 1: http://localhost:${PORT}/data/gadm/optimized/gadm_level1_optimized.geojson`);
    console.log(`   Level 2: http://localhost:${PORT}/data/gadm/optimized/gadm_level2_optimized.geojson`);
    console.log('');
    console.log('🗺️  Map Tool:');
    console.log(`   http://localhost:${PORT}/index-enhanced.html`);
    console.log('');
    console.log('⏹️  Stop server: Press Ctrl+C');
    console.log('='.repeat(50));
});


