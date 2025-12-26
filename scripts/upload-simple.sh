#!/bin/bash

# 簡化的 Mapbox 上傳腳本
# 直接使用 Mapbox Uploads API

set -e

echo "☁️  Mapbox API 上傳 - 免費帳號大文件上傳"
echo ""

# 從 config.js 自動讀取 Token
if [ -f "config.js" ]; then
    AUTO_TOKEN=$(grep -o "TOKEN: 'pk\.[^']*'" config.js 2>/dev/null | cut -d"'" -f2)
    if [ -n "$AUTO_TOKEN" ]; then
        export MAPBOX_ACCESS_TOKEN="$AUTO_TOKEN"
        echo "✅ 自動從 config.js 讀取 Token"
    fi
fi

# 檢查 Token
if [ -z "$MAPBOX_ACCESS_TOKEN" ]; then
    echo "⚠️  Token 未設置"
    read -p "請輸入 Mapbox Access Token: " token
    export MAPBOX_ACCESS_TOKEN="$token"
fi

# 用戶名
USERNAME="cnagraphicdesign"
echo "✅ 用戶名: $USERNAME"
echo "✅ Token: ${MAPBOX_ACCESS_TOKEN:0:30}..."
echo ""

# API 端點
API_BASE="https://api.mapbox.com/uploads/v1/${USERNAME}"

echo "════════════════════════════════════════════════════════"
echo "  準備上傳以下文件："
echo "════════════════════════════════════════════════════════"
ls -lh data/gadm/tiles/*.mbtiles 2>/dev/null | awk '{printf "  📁 %-45s %6s\n", $9, $5}'
echo "════════════════════════════════════════════════════════"
echo ""

read -p "是否開始上傳？(y/n): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "已取消"
    exit 0
fi

# 上傳函數（簡化版本）
upload_file() {
    local file_path=$1
    local tileset_id=$2
    local level_name=$3
    
    echo ""
    echo "────────────────────────────────────────────────────────"
    echo "📤 上傳 ${level_name}"
    echo "────────────────────────────────────────────────────────"
    echo "文件: $(basename $file_path)"
    echo "大小: $(du -h "$file_path" | cut -f1)"
    echo ""
    
    # 檢查文件
    if [ ! -f "$file_path" ]; then
        echo "❌ 文件不存在"
        return 1
    fi
    
    FILE_SIZE=$(stat -f%z "$file_path" 2>/dev/null || stat -c%s "$file_path" 2>/dev/null)
    
    echo "🔄 步驟 1: 創建上傳任務..."
    
    # 創建上傳任務
    CREATE_RESPONSE=$(curl -s -X POST "${API_BASE}?access_token=${MAPBOX_ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"tileset\": \"${USERNAME}.${tileset_id}\",
            \"url\": \"mapbox://datasets/${USERNAME}/${tileset_id}\"
        }" 2>&1)
    
    # 檢查錯誤
    if echo "$CREATE_RESPONSE" | grep -qi "error\|unauthorized\|forbidden"; then
        echo "❌ 錯誤: $CREATE_RESPONSE"
        return 1
    fi
    
    # 提取 Upload ID
    UPLOAD_ID=$(echo "$CREATE_RESPONSE" | grep -oE '"id"\s*:\s*"[^"]+"' | head -1 | grep -oE '"[^"]+"' | tr -d '"')
    
    if [ -z "$UPLOAD_ID" ]; then
        echo "❌ 無法解析 Upload ID"
        echo "響應: $CREATE_RESPONSE"
        return 1
    fi
    
    echo "✅ Upload ID: $UPLOAD_ID"
    echo ""
    echo "🔄 步驟 2: 獲取上傳 URL..."
    
    # 獲取 S3 上傳 URL
    URL_RESPONSE=$(curl -s -X POST "${API_BASE}/${UPLOAD_ID}?access_token=${MAPBOX_ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"file_size\": $FILE_SIZE}" 2>&1)
    
    S3_URL=$(echo "$URL_RESPONSE" | grep -oE '"url"\s*:\s*"[^"]+"' | head -1 | grep -oE '"[^"]+"' | tr -d '"')
    
    if [ -z "$S3_URL" ]; then
        echo "❌ 無法獲取上傳 URL"
        echo "響應: $URL_RESPONSE"
        return 1
    fi
    
    echo "✅ 獲得上傳 URL"
    echo ""
    echo "🔄 步驟 3: 上傳文件..."
    echo "   這可能需要 30-60 分鐘，請耐心等待..."
    echo ""
    
    # 上傳到 S3
    UPLOAD_RESULT=$(curl -X PUT "$S3_URL" \
        -H "Content-Type: application/x-sqlite3" \
        --upload-file "$file_path" \
        -w "\nHTTP_CODE:%{http_code}" \
        --progress-bar 2>&1)
    
    HTTP_CODE=$(echo "$UPLOAD_RESULT" | grep "HTTP_CODE:" | cut -d: -f2)
    
    if [ "$HTTP_CODE" != "200" ]; then
        echo ""
        echo "❌ 上傳失敗 (HTTP $HTTP_CODE)"
        return 1
    fi
    
    echo ""
    echo "✅ 文件上傳成功！"
    echo ""
    echo "🔄 步驟 4: 通知 Mapbox 開始處理..."
    
    # 完成上傳
    curl -s -X POST "${API_BASE}/${UPLOAD_ID}/complete?access_token=${MAPBOX_ACCESS_TOKEN}" > /dev/null
    
    echo "✅ 處理請求已提交"
    echo ""
    echo "📋 Tileset ID: ${USERNAME}.${tileset_id}"
    echo "💡 查看狀態: https://studio.mapbox.com/tilesets/"
    echo "⏱️  處理時間: 2-6 小時（免費帳號）"
}

# 開始上傳
upload_file "data/gadm/tiles/gadm_level0.mbtiles" "gadm-level0" "Level 0 (國家邊界)"
upload_file "data/gadm/tiles/gadm_level1.mbtiles" "gadm-level1" "Level 1 (州/省邊界)"
upload_file "data/gadm/tiles/gadm_level2.mbtiles" "gadm-level2" "Level 2 (城市/縣邊界)"

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ 所有上傳任務已提交！"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📋 記錄以下 Tileset ID："
echo "  - ${USERNAME}.gadm-level0"
echo "  - ${USERNAME}.gadm-level1"
echo "  - ${USERNAME}.gadm-level2"
echo ""
echo "💡 查看處理狀態：https://studio.mapbox.com/tilesets/"






