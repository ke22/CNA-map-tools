/**
 * Convert GADM GeoPackage files to GeoJSON
 * 
 * This script converts .gpkg files to .geojson format for Mapbox
 * 
 * Usage:
 *   node convert-gpkg-to-geojson.js
 * 
 * Requirements:
 *   npm install @ngageoint/geopackage
 *   OR
 *   npm install gdal-async
 */

const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_DIR = './data/boundaries/gadm_worldwide';
const OUTPUT_DIR = './data/boundaries/gadm_worldwide';
const FILES = [
    { input: 'gadm_world_level1.gpkg', output: 'gadm_world_level1.geojson' },
    { input: 'gadm_world_level2.gpkg', output: 'gadm_world_level2.geojson' }
];

console.log('🔄 GADM GeoPackage to GeoJSON Converter');
console.log('==========================================\n');

// Check if files exist
let filesMissing = false;
FILES.forEach(file => {
    const inputPath = path.join(INPUT_DIR, file.input);
    if (!fs.existsSync(inputPath)) {
        console.error(`❌ File not found: ${inputPath}`);
        filesMissing = true;
    }
});

if (filesMissing) {
    console.log('\n⚠️  Please download the GADM worldwide files first:');
    console.log('   1. Visit: https://gadm.org/download_world.html');
    console.log('   2. Download Level 1 and Level 2 files');
    console.log('   3. Save to:', INPUT_DIR);
    console.log('   4. Run this script again\n');
    process.exit(1);
}

console.log('📋 Conversion Options:\n');
console.log('Option 1: Use GDAL (Recommended)');
console.log('   Install: brew install gdal  (macOS)');
console.log('   Then run:');
console.log('   ogr2ogr -f GeoJSON', path.join(OUTPUT_DIR, FILES[0].output), path.join(INPUT_DIR, FILES[0].input));
console.log('   ogr2ogr -f GeoJSON', path.join(OUTPUT_DIR, FILES[1].output), path.join(INPUT_DIR, FILES[1].input));
console.log('\nOption 2: Use Online Converter');
console.log('   Visit: https://mygeodata.cloud/converter/gpkg-to-geojson');
console.log('   Upload each .gpkg file and download .geojson');
console.log('\nOption 3: Install Node.js package');
console.log('   npm install @ngageoint/geopackage');
console.log('   Then update this script to use the library\n');

console.log('⚠️  Note: Automatic conversion requires additional libraries.');
console.log('   For now, use Option 1 (GDAL) or Option 2 (Online converter).\n');

// TODO: Add actual conversion logic once library is installed
// This would require installing a GeoPackage library like:
// - @ngageoint/geopackage
// - gdal-async
// Or using GDAL command line via child_process

console.log('💡 See CONVERSION_OPTIONS.md for detailed instructions.\n');


