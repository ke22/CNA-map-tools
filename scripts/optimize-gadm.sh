#!/bin/bash

# GADM 文件優化腳本
# 使用 mapshaper 簡化 GeoJSON 文件

set -e  # 遇到錯誤立即退出

echo "🗜️  開始優化 GADM 文件..."
echo ""

# 檢查 mapshaper 是否安裝
if ! command -v mapshaper &> /dev/null; then
    echo "❌ mapshaper 未安裝"
    echo "📦 安裝方法："
    echo "   npm install -g mapshaper"
    echo "   或使用：npx mapshaper (在命令前加 npx)"
    echo ""
    read -p "是否使用 npx 運行？(y/n): " use_npx
    if [ "$use_npx" = "y" ] || [ "$use_npx" = "Y" ]; then
        MAPSHAPER="npx mapshaper"
    else
        exit 1
    fi
else
    MAPSHAPER="mapshaper"
fi

# 確保目錄存在
mkdir -p data/gadm/optimized

# 顯示原始文件大小
echo "📊 原始文件大小："
du -h data/gadm/gadm_level*.geojson 2>/dev/null | awk '{print "  " $2 ": " $1}' || echo "  未找到原始文件"
echo ""

# Level 0 (國家) - 簡化 15%
if [ -f "data/gadm/gadm_level0.geojson" ]; then
    echo "📦 優化 Level 0 (國家邊界，簡化 15%)..."
    $MAPSHAPER data/gadm/gadm_level0.geojson \
      -simplify 15% \
      -o data/gadm/optimized/gadm_level0_optimized.geojson format=geojson
    echo "  ✅ Level 0 優化完成"
else
    echo "  ⚠️  跳過 Level 0 (文件不存在)"
fi

# Level 1 (州/省) - 簡化 8%
if [ -f "data/gadm/gadm_level1.geojson" ]; then
    echo "📦 優化 Level 1 (州/省邊界，簡化 8%)..."
    $MAPSHAPER data/gadm/gadm_level1.geojson \
      -simplify 8% \
      -o data/gadm/optimized/gadm_level1_optimized.geojson format=geojson
    echo "  ✅ Level 1 優化完成"
else
    echo "  ⚠️  跳過 Level 1 (文件不存在)"
fi

# Level 2 (城市/縣) - 簡化 3%
if [ -f "data/gadm/gadm_level2.geojson" ]; then
    echo "📦 優化 Level 2 (城市/縣邊界，簡化 3%)..."
    $MAPSHAPER data/gadm/gadm_level2.geojson \
      -simplify 3% \
      -o data/gadm/optimized/gadm_level2_optimized.geojson format=geojson
    echo "  ✅ Level 2 優化完成"
else
    echo "  ⚠️  跳過 Level 2 (文件不存在)"
fi

echo ""
echo "✅ 優化完成！"
echo ""
echo "📊 優化後文件大小："
ls -lh data/gadm/optimized/*.geojson 2>/dev/null | awk '{print "  " $9 ": " $5}' || echo "  未找到優化文件"
echo ""
echo "💡 提示："
echo "  - 如果文件還是太大，可以增加簡化比例"
echo "  - 編輯腳本中的 -simplify 參數（例如：20%、10%、5%）"
echo "  - 優化後的文件已保存在 data/gadm/optimized/ 目錄"
