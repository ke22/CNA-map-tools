#!/bin/bash

# Extract administrative boundaries for a specific country from GADM data
# Usage: ./extract-country.sh <COUNTRY_CODE> [LEVEL]
# Example: ./extract-country.sh TWN 1  (extract level 1 for Taiwan)

COUNTRY_CODE=${1:-TWN}
LEVEL=${2:-"1,2"}  # Default: extract both level 1 and 2
OUTPUT_DIR="data/countries/${COUNTRY_CODE}"

echo "🌍 Extracting administrative boundaries for country: ${COUNTRY_CODE}"
echo "   Levels: ${LEVEL}"
echo "   Output directory: ${OUTPUT_DIR}"
echo ""

# Create output directory
mkdir -p "${OUTPUT_DIR}"

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not found. Please install Python 3."
    exit 1
fi

# Extract using Python
python3 << EOF
import json
import sys
import os

country_code = "${COUNTRY_CODE}"
levels = "${LEVEL}".split(',')
output_dir = "${OUTPUT_DIR}"

# Level names
level_names = {
    '1': 'states',
    '2': 'cities'
}

def extract_level(level_num):
    level_key = f'level{level_num}'
    input_file = f'data/gadm/optimized/gadm_{level_key}_optimized.geojson'
    output_name = level_names.get(level_num, f'level{level_num}')
    output_file = f'{output_dir}/{output_name}.geojson'
    
    if not os.path.exists(input_file):
        print(f"⚠️  File not found: {input_file}")
        return False
    
    print(f"📂 Processing {input_file}...")
    
    try:
        with open(input_file, 'rb') as f:
            data = json.load(f)
        
        # Filter features by country code
        filtered_features = [
            f for f in data['features']
            if f.get('properties', {}).get('GID_0') == country_code
        ]
        
        if not filtered_features:
            print(f"❌ No features found for country code: {country_code}")
            return False
        
        # Create new GeoJSON
        output_data = {
            'type': 'FeatureCollection',
            'features': filtered_features
        }
        
        # Write output
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        file_size = os.path.getsize(output_file) / 1024  # KB
        print(f"✅ Extracted {len(filtered_features)} features to {output_file}")
        print(f"   File size: {file_size:.1f} KB")
        return True
        
    except Exception as e:
        print(f"❌ Error processing {input_file}: {e}")
        return False

# Extract each level
success_count = 0
for level in levels:
    level = level.strip()
    if extract_level(level):
        success_count += 1

print("")
if success_count > 0:
    print(f"✅ Successfully extracted {success_count} level(s)")
    print(f"📁 Output directory: {output_dir}")
else:
    print("❌ No files were extracted")
    sys.exit(1)
EOF

echo ""
echo "✅ Extraction complete!"
echo ""
echo "📁 Extracted files:"
ls -lh "${OUTPUT_DIR}" | grep -E "states|cities|level" || echo "   (No files found)"






