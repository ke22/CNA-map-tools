#!/bin/bash

# GADM GeoJSON 轉換為矢量瓦片 (MBTiles)
# 使用 Tippecanoe 工具

set -e  # 遇到錯誤立即退出

echo "🗺️  開始創建矢量瓦片..."
echo ""

# 檢查 Tippecanoe 是否安裝
if ! command -v tippecanoe &> /dev/null; then
    echo "❌ Tippecanoe 未安裝"
    echo ""
    echo "📦 安裝方法："
    echo ""
    echo "  macOS:"
    echo "    brew install tippecanoe"
    echo ""
    echo "  Linux (Ubuntu/Debian):"
    echo "    sudo apt-get install tippecanoe"
    echo ""
    echo "  Linux (從源代碼):"
    echo "    git clone https://github.com/felt/tippecanoe.git"
    echo "    cd tippecanoe"
    echo "    make -j"
    echo "    sudo make install"
    echo ""
    exit 1
fi

echo "✅ Tippecanoe 已安裝: $(tippecanoe --version)"
echo ""

# 創建輸出目錄
mkdir -p data/gadm/tiles

# 顯示原始文件大小
echo "📊 原始文件大小："
du -h data/gadm/gadm_level*.geojson 2>/dev/null | awk '{print "  " $2 ": " $1}' || echo "  未找到原始文件"
echo ""

# 設置 Tippecanoe 參數
# 可以根據需要調整這些參數
MIN_ZOOM=0
MAX_ZOOM=14
TIPPECANOE_OPTS="--drop-densest-as-needed --extend-zooms-if-still-dropping --force"

# Level 0 (國家)
if [ -f "data/gadm/gadm_level0.geojson" ]; then
    echo "📦 轉換 Level 0 (國家邊界)..."
    echo "   這可能需要 10-30 分鐘，請耐心等待..."
    
    tippecanoe \
      -o data/gadm/tiles/gadm_level0.mbtiles \
      -L country:data/gadm/gadm_level0.geojson \
      -z${MAX_ZOOM} -Z${MIN_ZOOM} \
      ${TIPPECANOE_OPTS} \
      --name="GADM Level 0 (Countries)" \
      --description="Country boundaries from GADM"
    
    if [ -f "data/gadm/tiles/gadm_level0.mbtiles" ]; then
        SIZE=$(du -h data/gadm/tiles/gadm_level0.mbtiles | cut -f1)
        echo "  ✅ Level 0 轉換完成 ($SIZE)"
    else
        echo "  ❌ Level 0 轉換失敗"
    fi
else
    echo "  ⚠️  跳過 Level 0 (文件不存在)"
fi

echo ""

# Level 1 (州/省)
if [ -f "data/gadm/gadm_level1.geojson" ]; then
    echo "📦 轉換 Level 1 (州/省邊界)..."
    echo "   這可能需要 15-40 分鐘，請耐心等待..."
    
    tippecanoe \
      -o data/gadm/tiles/gadm_level1.mbtiles \
      -L state:data/gadm/gadm_level1.geojson \
      -z${MAX_ZOOM} -Z${MIN_ZOOM} \
      ${TIPPECANOE_OPTS} \
      --name="GADM Level 1 (States/Provinces)" \
      --description="State and province boundaries from GADM"
    
    if [ -f "data/gadm/tiles/gadm_level1.mbtiles" ]; then
        SIZE=$(du -h data/gadm/tiles/gadm_level1.mbtiles | cut -f1)
        echo "  ✅ Level 1 轉換完成 ($SIZE)"
    else
        echo "  ❌ Level 1 轉換失敗"
    fi
else
    echo "  ⚠️  跳過 Level 1 (文件不存在)"
fi

echo ""

# Level 2 (城市/縣)
if [ -f "data/gadm/gadm_level2.geojson" ]; then
    echo "📦 轉換 Level 2 (城市/縣邊界)..."
    echo "   這可能需要 20-60 分鐘，請耐心等待..."
    
    tippecanoe \
      -o data/gadm/tiles/gadm_level2.mbtiles \
      -L city:data/gadm/gadm_level2.geojson \
      -z${MAX_ZOOM} -Z${MIN_ZOOM} \
      ${TIPPECANOE_OPTS} \
      --name="GADM Level 2 (Cities/Counties)" \
      --description="City and county boundaries from GADM"
    
    if [ -f "data/gadm/tiles/gadm_level2.mbtiles" ]; then
        SIZE=$(du -h data/gadm/tiles/gadm_level2.mbtiles | cut -f1)
        echo "  ✅ Level 2 轉換完成 ($SIZE)"
    else
        echo "  ❌ Level 2 轉換失敗"
    fi
else
    echo "  ⚠️  跳過 Level 2 (文件不存在)"
fi

echo ""
echo "✅ 轉換完成！"
echo ""
echo "📊 生成的瓦片文件："
ls -lh data/gadm/tiles/*.mbtiles 2>/dev/null | awk '{print "  " $9 ": " $5}' || echo "  未找到瓦片文件"
echo ""
echo "📋 下一步："
echo "  1. 上傳到 Mapbox（使用 upload-to-mapbox.sh）"
echo "  2. 或部署到自己的瓦片服務器"
echo "  3. 更新應用代碼以使用矢量瓦片"
echo ""
echo "💡 提示："
echo "  - MBTiles 文件可以用 TileServer GL 本地測試"
echo "  - 詳細說明請查看 SOLUTION_VECTOR_TILES.md"
echo ""






