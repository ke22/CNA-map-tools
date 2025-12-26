#!/bin/bash

# 上傳 MBTiles 到 Mapbox
# 需要 Mapbox CLI 和 Access Token

set -e

echo "☁️  上傳矢量瓦片到 Mapbox..."
echo ""

# 檢查 Mapbox CLI 是否安裝
if ! command -v mapbox &> /dev/null; then
    echo "❌ Mapbox CLI 未安裝"
    echo ""
    echo "📦 安裝方法："
    echo "   npm install -g @mapbox/mapbox-cli-py"
    echo ""
    exit 1
fi

echo "✅ Mapbox CLI 已安裝"
echo ""

# 檢查 Access Token
if [ -z "$MAPBOX_ACCESS_TOKEN" ]; then
    echo "⚠️  MAPBOX_ACCESS_TOKEN 環境變量未設置"
    echo ""
    read -p "請輸入 Mapbox Access Token: " token
    export MAPBOX_ACCESS_TOKEN="$token"
fi

echo "✅ 使用 Mapbox Token: ${MAPBOX_ACCESS_TOKEN:0:20}..."
echo ""

# 讀取用戶名（從 token 解析或詢問）
read -p "請輸入 Mapbox 用戶名: " username
if [ -z "$username" ]; then
    echo "❌ 用戶名不能為空"
    exit 1
fi

echo ""

# Level 0
if [ -f "data/gadm/tiles/gadm_level0.mbtiles" ]; then
    echo "📤 上傳 Level 0 (國家)..."
    mapbox upload "$username.gadm-level0" data/gadm/tiles/gadm_level0.mbtiles
    echo "  ✅ Level 0 上傳完成"
    echo "   Tileset ID: $username.gadm-level0"
else
    echo "  ⚠️  跳過 Level 0 (文件不存在)"
fi

echo ""

# Level 1
if [ -f "data/gadm/tiles/gadm_level1.mbtiles" ]; then
    echo "📤 上傳 Level 1 (州/省)..."
    mapbox upload "$username.gadm-level1" data/gadm/tiles/gadm_level1.mbtiles
    echo "  ✅ Level 1 上傳完成"
    echo "   Tileset ID: $username.gadm-level1"
else
    echo "  ⚠️  跳過 Level 1 (文件不存在)"
fi

echo ""

# Level 2
if [ -f "data/gadm/tiles/gadm_level2.mbtiles" ]; then
    echo "📤 上傳 Level 2 (城市/縣)..."
    mapbox upload "$username.gadm-level2" data/gadm/tiles/gadm_level2.mbtiles
    echo "  ✅ Level 2 上傳完成"
    echo "   Tileset ID: $username.gadm-level2"
else
    echo "  ⚠️  跳過 Level 2 (文件不存在)"
fi

echo ""
echo "✅ 上傳完成！"
echo ""
echo "📋 下一步："
echo "  1. 在應用中使用這些 Tileset ID"
echo "  2. 例如：mapbox://$username.gadm-level0"
echo "  3. 查看 js/app-vector-tiles.js 了解如何使用"
echo ""






