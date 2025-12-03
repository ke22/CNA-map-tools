# Local Server Guide - Host GADM Files Locally

## 🎯 Why Use Local Server?

For **testing and development**, you can host GADM files on your computer instead of uploading to GitHub Pages. This is faster for testing!

---

## 🚀 Method 1: Python HTTP Server (Easiest)

### Step 1: Check if Python is installed

```bash
python3 --version
```

**If you see a version number** → Python is installed! ✅  
**If you see "command not found"** → Install Python first (see below)

### Step 2: Start the server

**In your project folder:**
```bash
cd /Users/yulincho/Documents/GitHub/map
python3 -m http.server 8000
```

**That's it!** 🎉

### Step 3: Access your files

Your files are now available at:
```
http://localhost:8000/data/gadm/optimized/gadm_level0_optimized.geojson
http://localhost:8000/data/gadm/optimized/gadm_level1_optimized.geojson
http://localhost:8000/data/gadm/optimized/gadm_level2_optimized.geojson
```

**Test it:** Open in browser:
```
http://localhost:8000/data/gadm/optimized/gadm_level0_optimized.geojson
```

### Step 4: Update config.js

In `config.js` or `js/app-gadm.js`, set:
```javascript
BASE_URL: 'http://localhost:8000/data/gadm/optimized/'
```

### Step 5: Stop the server

Press `Ctrl + C` in the terminal to stop the server.

---

## 🚀 Method 2: Node.js HTTP Server

### Step 1: Check if Node.js is installed

```bash
node --version
npm --version
```

**If you see version numbers** → Node.js is installed! ✅  
**If you see "command not found"** → Install Node.js first (see below)

### Step 2: Install http-server (one time)

```bash
npm install -g http-server
```

### Step 3: Start the server

**In your project folder:**
```bash
cd /Users/yulincho/Documents/GitHub/map
http-server -p 8000
```

**That's it!** 🎉

### Step 4: Access your files

Same as Method 1 - files available at:
```
http://localhost:8000/data/gadm/optimized/gadm_level0_optimized.geojson
```

### Step 5: Stop the server

Press `Ctrl + C` in the terminal.

---

## 🚀 Method 3: PHP Built-in Server

If you have PHP installed:

```bash
cd /Users/yulincho/Documents/GitHub/map
php -S localhost:8000
```

---

## 📋 Quick Comparison

| Method | Command | Best For |
|--------|---------|----------|
| **Python** | `python3 -m http.server 8000` | ✅ Most common, usually pre-installed |
| **Node.js** | `http-server -p 8000` | If you already use Node.js |
| **PHP** | `php -S localhost:8000` | If you have PHP installed |

**Recommendation:** Try Python first (Method 1) - it's usually already installed on Mac!

---

## 🔧 Troubleshooting

### Problem: "python3: command not found"

**Solution for Mac:**
- Python should be pre-installed on Mac
- If not, install Homebrew first: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- Then: `brew install python3`

**Solution for Windows:**
- Download from: https://www.python.org/downloads/
- Make sure to check "Add Python to PATH" during installation

**Solution for Linux:**
```bash
sudo apt-get update
sudo apt-get install python3
```

### Problem: "Port 8000 already in use"

**Solution:** Use a different port:
```bash
python3 -m http.server 8080  # Use port 8080 instead
```

Then update your URLs to use port 8080:
```
http://localhost:8080/data/gadm/optimized/...
```

### Problem: "CORS error" in browser

**Solution:** Local servers sometimes have CORS issues. Use a browser extension like "CORS Unblock" for testing, or use Method 4 below.

---

## 🚀 Method 4: Simple CORS-Friendly Server

Create a simple server script with CORS headers:

**Create file:** `server.js`
```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8000;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.geojson': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
};

http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const filePath = '.' + req.url;
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}).listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
    console.log(`GADM files available at:`);
    console.log(`  http://localhost:${port}/data/gadm/optimized/gadm_level0_optimized.geojson`);
    console.log(`  http://localhost:${port}/data/gadm/optimized/gadm_level1_optimized.geojson`);
    console.log(`  http://localhost:${port}/data/gadm/optimized/gadm_level2_optimized.geojson`);
});
```

**Run it:**
```bash
node server.js
```

---

## ✅ Quick Start (Recommended)

**Easiest method - just run this:**

```bash
cd /Users/yulincho/Documents/GitHub/map
python3 -m http.server 8000
```

Then open your browser and test:
```
http://localhost:8000/data/gadm/optimized/gadm_level0_optimized.geojson
```

If you see JSON data → ✅ Server is working!

---

## 📝 Next Steps

1. ✅ Start local server
2. ✅ Test file URLs in browser
3. ✅ Update `js/app-gadm.js` with local URL:
   ```javascript
   BASE_URL: 'http://localhost:8000/data/gadm/optimized/'
   ```
4. ✅ Test the map tool

**That's it!** Your files are now accessible locally. 🎉


