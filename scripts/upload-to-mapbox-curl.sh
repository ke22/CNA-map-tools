#!/bin/bash

# 使用 curl 上傳 MBTiles 到 Mapbox
# 無需安裝額外工具

set -e

echo "☁️  使用 curl 上傳矢量瓦片到 Mapbox..."
echo ""

# 檢查 Mapbox Token
if [ -z "$MAPBOX_ACCESS_TOKEN" ]; then
    echo "⚠️  MAPBOX_ACCESS_TOKEN 環境變量未設置"
    echo ""
    read -p "請輸入 Mapbox Access Token: " token
    export MAPBOX_ACCESS_TOKEN="$token"
fi

echo "✅ 使用 Mapbox Token: ${MAPBOX_ACCESS_TOKEN:0:20}..."
echo ""

# 讀取用戶名
read -p "請輸入 Mapbox 用戶名: " username
if [ -z "$username" ]; then
    echo "❌ 用戶名不能為空"
    exit 1
fi

echo ""

# Mapbox Upload API 端點
UPLOAD_URL="https://api.mapbox.com/uploads/v1/${username}"

# 上傳函數
upload_tileset() {
    local tileset_id=$1
    local file_path=$2
    local level_name=$3
    
    echo "📤 上傳 ${level_name}..."
    
    # 檢查文件是否存在
    if [ ! -f "$file_path" ]; then
        echo "  ⚠️  文件不存在: $file_path"
        return 1
    fi
    
    # 獲取文件大小
    FILE_SIZE=$(stat -f%z "$file_path" 2>/dev/null || stat -c%s "$file_path" 2>/dev/null)
    
    # 步驟 1: 創建上傳
    echo "  🔄 創建上傳任務..."
    RESPONSE=$(curl -X POST "${UPLOAD_URL}?access_token=${MAPBOX_ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"url\": \"mapbox://datasets/${username}/${tileset_id}\",
            \"tileset\": \"${username}.${tileset_id}\",
            \"name\": \"${tileset_id}\"
        }" 2>/dev/null)
    
    UPLOAD_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -z "$UPLOAD_ID" ]; then
        echo "  ❌ 創建上傳任務失敗"
        echo "  $RESPONSE"
        return 1
    fi
    
    echo "  ✅ 上傳任務已創建: $UPLOAD_ID"
    
    # 步驟 2: 上傳文件
    echo "  🔄 上傳文件 ($(du -h "$file_path" | cut -f1))..."
    
    # 獲取上傳 URL
    UPLOAD_DATA=$(curl -X POST "${UPLOAD_URL}/${UPLOAD_ID}?access_token=${MAPBOX_ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"file_size\": ${FILE_SIZE}
        }" 2>/dev/null)
    
    AWS_URL=$(echo "$UPLOAD_DATA" | grep -o '"url":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -z "$AWS_URL" ]; then
        echo "  ❌ 獲取上傳 URL 失敗"
        echo "  $UPLOAD_DATA"
        return 1
    fi
    
    # 上傳到 S3
    UPLOAD_RESULT=$(curl -X PUT "$AWS_URL" \
        -H "Content-Type: application/x-sqlite3" \
        --upload-file "$file_path" \
        --write-out "%{http_code}" \
        --silent \
        --output /dev/null)
    
    if [ "$UPLOAD_RESULT" != "200" ]; then
        echo "  ❌ 文件上傳失敗 (HTTP $UPLOAD_RESULT)"
        return 1
    fi
    
    echo "  ✅ 文件上傳成功"
    
    # 步驟 3: 開始處理
    echo "  🔄 開始處理瓦片集..."
    PROCESS_RESULT=$(curl -X POST "${UPLOAD_URL}/${UPLOAD_ID}/complete?access_token=${MAPBOX_ACCESS_TOKEN}" \
        --write-out "%{http_code}" \
        --silent \
        --output /dev/null)
    
    if [ "$PROCESS_RESULT" != "200" ]; then
        echo "  ⚠️  處理請求已發送 (HTTP $PROCESS_RESULT)"
        echo "  ℹ️  處理可能需要幾分鐘，請在 Mapbox 控制台查看狀態"
    else
        echo "  ✅ 處理已開始"
    fi
    
    echo "  📋 Tileset ID: ${username}.${tileset_id}"
    echo "  💡 查看狀態: https://studio.mapbox.com/tilesets/"
    echo ""
}

# Level 0
if [ -f "data/gadm/tiles/gadm_level0.mbtiles" ]; then
    upload_tileset "gadm-level0" "data/gadm/tiles/gadm_level0.mbtiles" "Level 0 (國家)"
else
    echo "  ⚠️  跳過 Level 0 (文件不存在)"
fi

# Level 1
if [ -f "data/gadm/tiles/gadm_level1.mbtiles" ]; then
    upload_tileset "gadm-level1" "data/gadm/tiles/gadm_level1.mbtiles" "Level 1 (州/省)"
else
    echo "  ⚠️  跳過 Level 1 (文件不存在)"
fi

# Level 2
if [ -f "data/gadm/tiles/gadm_level2.mbtiles" ]; then
    upload_tileset "gadm-level2" "data/gadm/tiles/gadm_level2.mbtiles" "Level 2 (城市/縣)"
else
    echo "  ⚠️  跳過 Level 2 (文件不存在)"
fi

echo ""
echo "✅ 上傳完成！"
echo ""
echo "📋 下一步："
echo "  1. 等待 Mapbox 處理完成（幾分鐘到幾小時）"
echo "  2. 在 Mapbox Studio 查看狀態: https://studio.mapbox.com/tilesets/"
echo "  3. 處理完成後，在應用中使用這些 Tileset ID"
echo "  4. 例如：mapbox://${username}.gadm-level0"
echo ""






