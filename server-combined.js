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

// Load environment variables from .env file (if dotenv is installed)
try {
    require('dotenv').config();
} catch (e) {
    // dotenv not installed, try manual .env loading
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                    process.env[key.trim()] = value;
                }
            }
        });
    }
}

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Import Gemini proxy functionality
const geminiProxy = require('./server-gemini-proxy.js');

const PORT = process.env.PORT || 3000;

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
    // Remove query string for file path lookup
    const urlPath = parsedUrl.pathname;
    let filePath = '.' + urlPath;
    
    // Default to index.html if root
    if (filePath === './' || filePath === '.') {
        filePath = './index-enhanced.html';
    }
    
    // Get file extension
    const extname = String(path.extname(filePath)).toLowerCase();
    let contentType = mimeTypes[extname] || 'application/octet-stream';

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
            // Inject Mapbox token into HTML files if MAPBOX_TOKEN is set
            let finalContent = content;
            const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;
            
            if (MAPBOX_TOKEN && filePath.endsWith('.html')) {
                // Inject script tag before config.js script tag
                const injectionScript = `    <!-- Injected Mapbox Token from environment variable -->
    <script>
        window.MAPBOX_TOKEN = '${MAPBOX_TOKEN.replace(/'/g, "\\'")}';
    </script>
`;
                
                const htmlContent = content.toString('utf-8');
                // Inject before config.js script tag
                if (htmlContent.includes('config.js')) {
                    finalContent = htmlContent.replace(
                        /(\s*)(<script[^>]*src=["']config\.js["'][^>]*>)/,
                        injectionScript + '$1$2'
                    );
                } else if (htmlContent.includes('</head>')) {
                    // Fallback: inject before </head>
                    finalContent = htmlContent.replace('</head>', injectionScript + '    </head>');
                } else {
                    // Last resort: inject at the beginning of body
                    finalContent = htmlContent.replace('<body', injectionScript + '<body');
                }
                finalContent = Buffer.from(finalContent, 'utf-8');
            }
            
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(finalContent, 'utf-8');
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
    
    // Check Mapbox token
    const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;
    if (MAPBOX_TOKEN) {
        console.log('   ✅ Mapbox Token: Set (hidden)');
    } else {
        console.log('   ⚠️  Mapbox Token: Not set in .env, using default from config.js');
    }
    
    console.log('');
    console.log('⏹️  Stop server: Press Ctrl+C');
    console.log('='.repeat(50));
});

