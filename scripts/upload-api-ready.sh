#!/bin/bash

# Mapbox Uploads API 上傳腳本
# 使用 API 上傳大文件（支持免費帳號，最大 25 GB）

set -e

echo "☁️  使用 Mapbox Uploads API 上傳矢量瓦片..."
echo ""

# 從 config.js 讀取 Token（如果存在）
if [ -f "config.js" ]; then
    AUTO_TOKEN=$(grep -o "TOKEN: 'pk\.[^']*'" config.js 2>/dev/null | cut -d"'" -f2)
    if [ -n "$AUTO_TOKEN" ]; then
        echo "✅ 從 config.js 自動讀取 Token"
        export MAPBOX_ACCESS_TOKEN="$AUTO_TOKEN"
    fi
fi

# 檢查 Access Token
if [ -z "$MAPBOX_ACCESS_TOKEN" ]; then
    echo "⚠️  MAPBOX_ACCESS_TOKEN 環境變量未設置"
    echo ""
    read -p "請輸入 Mapbox Access Token: " token
    export MAPBOX_ACCESS_TOKEN="$token"
fi

TOKEN_PREFIX="${MAPBOX_ACCESS_TOKEN:0:30}..."
echo "✅ 使用 Token: $TOKEN_PREFIX"
echo ""

# Mapbox 用戶名（從文件或輸入）
USERNAME="cnagraphicdesign"  # 默認值

if [ -z "$USERNAME" ]; then
    read -p "請輸入 Mapbox 用戶名: " username
    USERNAME="$username"
fi

if [ -z "$USERNAME" ]; then
    echo "❌ 用戶名不能為空"
    exit 1
fi

echo "✅ 使用用戶名: $USERNAME"
echo ""

# Mapbox Uploads API 端點
API_BASE="https://api.mapbox.com/uploads/v1/${USERNAME}"

# 上傳函數
upload_tileset() {
    local tileset_id=$1
    local file_path=$2
    local level_name=$3
    
    echo "📤 開始上傳 ${level_name}..."
    echo "   文件: $(basename $file_path)"
    echo "   大小: $(du -h "$file_path" | cut -f1)"
    echo ""
    
    # 檢查文件是否存在
    if [ ! -f "$file_path" ]; then
        echo "  ❌ 文件不存在: $file_path"
        return 1
    fi
    
    # 獲取文件大小（字節）
    if [[ "$OSTYPE" == "darwin"* ]]; then
        FILE_SIZE=$(stat -f%z "$file_path")
    else
        FILE_SIZE=$(stat -c%s "$file_path")
    fi
    
    echo "  🔄 步驟 1/3: 創建上傳任務..."
    
    # 步驟 1: 創建上傳任務
    # Mapbox Uploads API 需要先創建一個上傳任務
    CREATE_RESPONSE=$(curl -s -X POST "${API_BASE}?access_token=${MAPBOX_ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"tileset\": \"${USERNAME}.${tileset_id}\",
            \"url\": \"mapbox://datasets/${USERNAME}/${tileset_id}\",
            \"name\": \"${tileset_id}\"
        }" 2>&1)
    
    # 檢查是否有錯誤
    if echo "$CREATE_RESPONSE" | grep -q "error\|Error\|Unauthorized\|Forbidden"; then
        echo "  ❌ 創建上傳任務失敗"
        echo "  響應: $CREATE_RESPONSE" | head -5
        echo ""
        echo "  💡 提示："
        echo "    - 檢查 Token 是否正確"
        echo "    - 檢查用戶名是否正確"
        echo "    - 確認 Token 有上傳權限"
        return 1
    fi
    
    # 從響應中提取 upload ID（JSON 解析）
    UPLOAD_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -z "$UPLOAD_ID" ]; then
        # 嘗試另一種方式解析
        UPLOAD_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id": "[^"]*' | head -1 | cut -d'"' -f4)
    fi
    
    if [ -z "$UPLOAD_ID" ]; then
        echo "  ❌ 無法解析上傳 ID"
        echo "  響應: $CREATE_RESPONSE" | head -10
        return 1
    fi
    
    echo "  ✅ 上傳任務已創建: $UPLOAD_ID"
    echo ""
    
    # 步驟 2: 獲取上傳 URL
    echo "  🔄 步驟 2/3: 獲取上傳 URL..."
    
    UPLOAD_DATA=$(curl -s -X POST "${API_BASE}/${UPLOAD_ID}?access_token=${MAPBOX_ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"file_size\": ${FILE_SIZE}
        }" 2>&1)
    
    # 提取 AWS S3 URL
    AWS_URL=$(echo "$UPLOAD_DATA" | grep -o '"url":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -z "$AWS_URL" ]; then
        echo "  ❌ 無法獲取上傳 URL"
        echo "  響應: $UPLOAD_DATA" | head -10
        return 1
    fi
    
    echo "  ✅ 獲得上傳 URL"
    echo ""
    
    # 步驟 3: 上傳文件到 S3
    echo "  🔄 步驟 3/3: 上傳文件到 Mapbox..."
    echo "    這可能需要 30-60 分鐘，請耐心等待..."
    echo ""
    
    UPLOAD_PROGRESS=$(curl -X PUT "$AWS_URL" \
        -H "Content-Type: application/x-sqlite3" \
        --upload-file "$file_path" \
        --progress-bar \
        --write-out "\nHTTP_CODE:%{http_code}\nTIME_TOTAL:%{time_total}\n" 2>&1)
    
    HTTP_CODE=$(echo "$UPLOAD_PROGRESS" | grep "HTTP_CODE:" | cut -d: -f2)
    
    if [ "$HTTP_CODE" != "200" ]; then
        echo "  ❌ 文件上傳失敗 (HTTP $HTTP_CODE)"
        return 1
    fi
    
    echo ""
    echo "  ✅ 文件上傳成功"
    echo ""
    
    # 步驟 4: 通知 Mapbox 開始處理
    echo "  🔄 通知 Mapbox 開始處理..."
    
    COMPLETE_RESPONSE=$(curl -s -X POST "${API_BASE}/${UPLOAD_ID}/complete?access_token=${MAPBOX_ACCESS_TOKEN}" \
        -H "Content-Type: application/json" 2>&1)
    
    echo "  ✅ 處理請求已提交"
    echo ""
    echo "  📋 上傳完成！"
    echo "     Tileset ID: ${USERNAME}.${tileset_id}"
    echo "     Upload ID: ${UPLOAD_ID}"
    echo ""
    echo "  💡 查看狀態："
    echo "     https://studio.mapbox.com/tilesets/"
    echo ""
    echo "  ⏱️  處理時間預估：2-6 小時（免費帳號）"
    echo ""
}

# 顯示開始信息
echo "════════════════════════════════════════════════════════"
echo "  Mapbox Uploads API - 大文件上傳"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📊 將上傳以下文件："
echo ""
du -h data/gadm/tiles/*.mbtiles 2>/dev/null | awk '{printf "  📁 %-45s %6s\n", $2, $1}' || echo "  ⚠️  未找到文件"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""

# 確認開始
read -p "是否開始上傳？(y/n): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "已取消"
    exit 0
fi

echo ""
echo "🚀 開始上傳..."
echo ""

# Level 0
if [ -f "data/gadm/tiles/gadm_level0.mbtiles" ]; then
    upload_tileset "gadm-level0" "data/gadm/tiles/gadm_level0.mbtiles" "Level 0 (國家邊界)"
else
    echo "  ⚠️  跳過 Level 0 (文件不存在)"
fi

echo ""
echo "────────────────────────────────────────────────────────"
echo ""

# Level 1
if [ -f "data/gadm/tiles/gadm_level1.mbtiles" ]; then
    upload_tileset "gadm-level1" "data/gadm/tiles/gadm_level1.mbtiles" "Level 1 (州/省邊界)"
else
    echo "  ⚠️  跳過 Level 1 (文件不存在)"
fi

echo ""
echo "────────────────────────────────────────────────────────"
echo ""

# Level 2
if [ -f "data/gadm/tiles/gadm_level2.mbtiles" ]; then
    upload_tileset "gadm-level2" "data/gadm/tiles/gadm_level2.mbtiles" "Level 2 (城市/縣邊界)"
else
    echo "  ⚠️  跳過 Level 2 (文件不存在)"
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ 所有上傳任務已提交！"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📋 下一步："
echo "  1. 等待 Mapbox 處理完成（2-6 小時/文件）"
echo "  2. 在 Mapbox Studio 查看狀態："
echo "     https://studio.mapbox.com/tilesets/"
echo "  3. 處理完成後，記錄 Tileset ID："
echo "     - ${USERNAME}.gadm-level0"
echo "     - ${USERNAME}.gadm-level1"
echo "     - ${USERNAME}.gadm-level2"
echo "  4. 更新 js/app-vector-tiles.js 中的配置"
echo ""





