/**
 * Gemini API Backend Proxy Server
 * Securely handles Gemini API calls with API key stored in environment variables
 * 
 * Usage:
 *   1. Set GEMINI_API_KEY environment variable
 *   2. node server-gemini-proxy.js
 * 
 * Or use with the combined server:
 *   node server.js (includes this proxy)
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;
const PROXY_PATH = '/api/gemini/generateContent';

// Get API key from environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';

// Check if API key is set
if (!GEMINI_API_KEY) {
    console.warn('⚠️  WARNING: GEMINI_API_KEY environment variable is not set!');
    console.warn('   Set it before starting the server:');
    console.warn('   export GEMINI_API_KEY="your-api-key-here"');
    console.warn('   Or create a .env file (see .env.example)');
}

/**
 * Proxy Gemini API request
 */
function proxyGeminiRequest(req, res, requestBody) {
    if (!GEMINI_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Server configuration error: GEMINI_API_KEY not set'
        }));
        return;
    }

    const apiUrl = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent`;
    const parsedUrl = url.parse(apiUrl);

    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': GEMINI_API_KEY,
            'Content-Length': Buffer.byteLength(requestBody)
        }
    };

    console.log(`🤖 Proxying Gemini API request to: ${apiUrl}`);

    const proxyReq = https.request(options, (proxyRes) => {
        // Forward status code
        res.writeHead(proxyRes.statusCode, {
            'Content-Type': proxyRes.headers['content-type'] || 'application/json',
            'Access-Control-Allow-Origin': '*'
        });

        // Forward response
        proxyRes.on('data', (chunk) => {
            res.write(chunk);
        });

        proxyRes.on('end', () => {
            res.end();
            console.log(`✅ Gemini API response: ${proxyRes.statusCode}`);
        });
    });

    proxyReq.on('error', (error) => {
        console.error('❌ Proxy error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Proxy error',
            message: error.message
        }));
    });

    // Send request body
    proxyReq.write(requestBody);
    proxyReq.end();
}

/**
 * Handle Gemini proxy request
 */
function handleGeminiProxy(req, res) {
    let body = '';

    req.on('data', (chunk) => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            // Validate request body
            const requestData = JSON.parse(body);
            
            if (!requestData.contents || !Array.isArray(requestData.contents)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'Invalid request format. Expected {contents: [...]}'
                }));
                return;
            }

            // Proxy the request
            proxyGeminiRequest(req, res, body);
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Invalid JSON in request body',
                message: error.message
            }));
        }
    });
}

/**
 * Create server
 */
function createServer() {
    return http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url, true);

        // Handle Gemini API proxy
        if (req.method === 'POST' && parsedUrl.pathname === PROXY_PATH) {
            // Add CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            // Handle OPTIONS request (CORS preflight)
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            handleGeminiProxy(req, res);
            return;
        }

        // For other requests, return 404
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Not found',
            message: `Path ${parsedUrl.pathname} not found. Use ${PROXY_PATH} for Gemini API proxy.`
        }));
    });
}

// Export for use in combined server
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createServer,
        handleGeminiProxy,  // Export handler for use in combined server
        PROXY_PATH,
        GEMINI_API_KEY
    };
}

// If run directly, start server
if (require.main === module) {
    const server = createServer();
    
    server.listen(PORT, () => {
        console.log('='.repeat(50));
        console.log('🔒 Gemini API Proxy Server Running!');
        console.log('='.repeat(50));
        console.log('');
        console.log(`📍 Server: http://localhost:${PORT}/`);
        console.log(`🔗 Proxy Endpoint: http://localhost:${PORT}${PROXY_PATH}`);
        console.log('');
        
        if (GEMINI_API_KEY) {
            console.log('✅ GEMINI_API_KEY: Set (hidden)');
        } else {
            console.log('❌ GEMINI_API_KEY: Not set!');
        }
        
        console.log(`📝 Model: ${GEMINI_MODEL}`);
        console.log(`🌐 Base URL: ${GEMINI_BASE_URL}`);
        console.log('');
        console.log('⏹️  Stop server: Press Ctrl+C');
        console.log('='.repeat(50));
    });
}

