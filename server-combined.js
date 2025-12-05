/**
 * Combined Server: Static File Server + Gemini API Proxy
 * 
 * This server combines:
 * 1. Static file serving (HTML, JS, CSS, GeoJSON, etc.)
 * 2. Gemini API proxy (secure backend for API calls)
 * 
 * Usage:
 *   1. Set GEMINI_API_KEY environment variable
 *   2. node server-combined.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load environment variables from .env file if it exists
try {
    const envFile = path.join(__dirname, '.env');
    if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
                    process.env[key.trim()] = value.trim();
                }
            }
        });
        console.log('✅ Loaded .env file');
    }
} catch (error) {
    console.warn('⚠️  Could not load .env file:', error.message);
}

// Import Gemini proxy functionality
const geminiProxy = require('./server-gemini-proxy.js');

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

// Create combined server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // Add CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request (CORS preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Handle Gemini API proxy
    if (parsedUrl.pathname === geminiProxy.PROXY_PATH) {
        // Handle OPTIONS request (CORS preflight)
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        // Handle POST request - delegate to proxy handler
        if (req.method === 'POST') {
            geminiProxy.handleGeminiProxy(req, res);
            return;
        }
        
        // Other methods not allowed
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    // Handle static file serving
    // Parse URL to get pathname (strip query parameters)
    const urlPath = parsedUrl.pathname;
    let filePath = '.' + urlPath;
    
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
    console.log('🚀 Combined Server Running!');
    console.log('='.repeat(50));
    console.log('');
    console.log(`📍 Server: http://localhost:${PORT}/`);
    console.log('');
    console.log('📁 Static Files:');
    console.log(`   Main: http://localhost:${PORT}/index-enhanced.html`);
    console.log('');
    console.log('🔒 Gemini API Proxy:');
    console.log(`   Endpoint: http://localhost:${PORT}${geminiProxy.PROXY_PATH}`);
    
    if (geminiProxy.GEMINI_API_KEY) {
        console.log('   ✅ API Key: Set (hidden)');
    } else {
        console.log('   ⚠️  API Key: Not set!');
        console.log('   Set GEMINI_API_KEY environment variable to enable proxy.');
    }
    
    console.log('');
    console.log('⏹️  Stop server: Press Ctrl+C');
    console.log('='.repeat(50));
});

