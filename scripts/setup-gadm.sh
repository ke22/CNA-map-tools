#!/bin/bash

# GADM Setup Script
# Automated setup for GADM data conversion

echo "🚀 GADM Setup Script"
echo "===================="
echo ""

# Check if running on Mac, Linux, or Windows (Git Bash)
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    MINGW*)     MACHINE=Windows;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "📱 Detected OS: $MACHINE"
echo ""

# Step 1: Check/Install GDAL
echo "🔍 Checking GDAL installation..."
if command -v ogr2ogr &> /dev/null; then
    echo "✅ GDAL is already installed"
    ogr2ogr --version
else
    echo "❌ GDAL not found"
    echo ""
    
    if [ "$MACHINE" = "Mac" ]; then
        echo "📦 Installing GDAL via Homebrew..."
        if command -v brew &> /dev/null; then
            brew install gdal
        else
            echo "❌ Homebrew not found. Please install Homebrew first:"
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    elif [ "$MACHINE" = "Linux" ]; then
        echo "📦 Installing GDAL via apt-get..."
        sudo apt-get update
        sudo apt-get install -y gdal-bin
    else
        echo "❌ Please install GDAL manually:"
        echo "   Windows: Download from https://www.lfd.uci.edu/~gohlke/pythonlibs/#gdal"
        exit 1
    fi
fi

echo ""

# Step 2: Check/Install mapshaper (optional but recommended)
echo "🔍 Checking mapshaper installation..."
if command -v mapshaper &> /dev/null; then
    echo "✅ mapshaper is already installed"
else
    echo "⚠️  mapshaper not found (optional, but recommended for optimization)"
    echo ""
    read -p "Install mapshaper now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Installing mapshaper via npm..."
        if command -v npm &> /dev/null; then
            npm install -g mapshaper
        else
            echo "❌ npm not found. Please install Node.js first."
        fi
    fi
fi

echo ""

# Step 3: Create directories
echo "📁 Creating directories..."
mkdir -p data/gadm
mkdir -p data/gadm/optimized
echo "✅ Directories created"

echo ""

# Step 4: Instructions
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Download GADM files from:"
echo "   https://gadm.org/download_world.html"
echo ""
echo "2. Save files to: data/gadm/"
echo "   - gadm_level0.gpkg (Countries)"
echo "   - gadm_level1.gpkg (States/Provinces)"
echo "   - gadm_level2.gpkg (Cities/Counties)"
echo ""
echo "3. Run conversion script:"
echo "   node scripts/convert-gadm.js"
echo ""
echo "4. Files will be converted and optimized in:"
echo "   data/gadm/optimized/"
echo ""

echo "✅ Setup complete! Download GADM files and run conversion script."





