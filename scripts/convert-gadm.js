#!/usr/bin/env node

/**
 * GADM Conversion Script
 * Converts GeoPackage (.gpkg) files to optimized GeoJSON
 * 
 * Requirements:
 * - GDAL installed (ogr2ogr command)
 * - Node.js
 * 
 * Usage:
 *   node scripts/convert-gadm.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'gadm');
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'gadm', 'optimized');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Check if GDAL is installed
 */
function checkGDAL() {
    try {
        execSync('ogr2ogr --version', { stdio: 'ignore' });
        console.log('✅ GDAL is installed');
        return true;
    } catch (error) {
        console.error('❌ GDAL not found!');
        console.error('\nPlease install GDAL:');
        console.error('  Mac:    brew install gdal');
        console.error('  Linux:  sudo apt-get install gdal-bin');
        console.error('  Windows: Download from https://www.lfd.uci.edu/~gohlke/pythonlibs/#gdal');
        return false;
    }
}

/**
 * Check if mapshaper is installed
 */
function checkMapshaper() {
    try {
        execSync('mapshaper --version', { stdio: 'ignore' });
        console.log('✅ mapshaper is installed');
        return true;
    } catch (error) {
        console.log('⚠️  mapshaper not found (optional, but recommended)');
        console.log('  Install: npm install -g mapshaper');
        return false;
    }
}

/**
 * Convert GeoPackage to GeoJSON
 */
function convertToGeoJSON(level) {
    const inputFile = path.join(DATA_DIR, `gadm_level${level}.gpkg`);
    const outputFile = path.join(DATA_DIR, `gadm_level${level}.geojson`);
    
    if (!fs.existsSync(inputFile)) {
        console.error(`❌ Input file not found: ${inputFile}`);
        console.error(`   Please download GADM Level ${level} from: https://gadm.org/download_world.html`);
        return false;
    }
    
    console.log(`\n🔄 Converting Level ${level}...`);
    console.log(`   Input:  ${inputFile}`);
    console.log(`   Output: ${outputFile}`);
    
    try {
        execSync(`ogr2ogr -f GeoJSON "${outputFile}" "${inputFile}"`, {
            stdio: 'inherit'
        });
        
        const stats = fs.statSync(outputFile);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`✅ Converted! Size: ${sizeMB} MB`);
        
        return true;
    } catch (error) {
        console.error(`❌ Conversion failed:`, error.message);
        return false;
    }
}

/**
 * Optimize GeoJSON with mapshaper
 */
function optimizeGeoJSON(level) {
    const inputFile = path.join(DATA_DIR, `gadm_level${level}.geojson`);
    const outputFile = path.join(OUTPUT_DIR, `gadm_level${level}_optimized.geojson`);
    
    if (!fs.existsSync(inputFile)) {
        console.error(`❌ Input file not found: ${inputFile}`);
        return false;
    }
    
    // Simplify percentages (higher number = less detail = smaller file)
    const simplify = {
        0: '50%',  // Countries - keep more detail
        1: '30%',  // States - medium detail
        2: '20%'   // Cities - can reduce more
    };
    
    console.log(`\n🔄 Optimizing Level ${level}...`);
    console.log(`   Simplifying to ${simplify[level]} detail`);
    
    try {
        execSync(`mapshaper "${inputFile}" -simplify ${simplify[level]} -o "${outputFile}"`, {
            stdio: 'inherit'
        });
        
        const inputStats = fs.statSync(inputFile);
        const outputStats = fs.statSync(outputFile);
        const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
        
        console.log(`✅ Optimized!`);
        console.log(`   Original: ${(inputStats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Optimized: ${(outputStats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Reduction: ${reduction}%`);
        
        return true;
    } catch (error) {
        console.error(`❌ Optimization failed:`, error.message);
        console.error(`   Skipping optimization - will use original file`);
        return false;
    }
}

/**
 * Main conversion process
 */
function main() {
    console.log('🚀 GADM Conversion Script\n');
    console.log('='.repeat(50));
    
    // Check tools
    const hasGDAL = checkGDAL();
    if (!hasGDAL) {
        process.exit(1);
    }
    
    const hasMapshaper = checkMapshaper();
    
    console.log('\n' + '='.repeat(50));
    console.log('📋 Conversion Steps:\n');
    
    // Convert all levels
    const levels = [0, 1, 2];
    const converted = [];
    
    for (const level of levels) {
        if (convertToGeoJSON(level)) {
            converted.push(level);
        }
    }
    
    // Optimize if mapshaper is available
    if (hasMapshaper && converted.length > 0) {
        console.log('\n' + '='.repeat(50));
        console.log('🎨 Optimization:\n');
        
        for (const level of converted) {
            optimizeGeoJSON(level);
        }
    } else if (converted.length > 0) {
        console.log('\n⚠️  Skipping optimization (mapshaper not installed)');
        console.log('   Files are ready but not optimized.');
        console.log('   Install mapshaper for smaller file sizes: npm install -g mapshaper');
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Conversion Complete!\n');
    console.log('📁 Files created:');
    converted.forEach(level => {
        const geojson = path.join(DATA_DIR, `gadm_level${level}.geojson`);
        const optimized = path.join(OUTPUT_DIR, `gadm_level${level}_optimized.geojson`);
        
        if (fs.existsSync(optimized)) {
            const stats = fs.statSync(optimized);
            console.log(`   Level ${level}: ${(stats.size / 1024 / 1024).toFixed(2)} MB (optimized)`);
        } else if (fs.existsSync(geojson)) {
            const stats = fs.statSync(geojson);
            console.log(`   Level ${level}: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        }
    });
    
    console.log('\n📝 Next steps:');
    console.log('   1. Host files (GitHub Pages, Netlify, or local server)');
    console.log('   2. Update code to use GADM data');
    console.log('   3. Test state/city selection');
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { convertToGeoJSON, optimizeGeoJSON };






