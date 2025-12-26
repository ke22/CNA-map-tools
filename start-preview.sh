#!/bin/bash

# 一键启动预览服务器并显示所有链接

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 启动预览服务器"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件"
    echo "   运行 ./SETUP_API_KEY.sh 设置 API 密钥"
    echo ""
fi

# 检查服务器是否已运行
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ 服务器已在运行 (端口 8000)"
    EXISTING_PID=$(lsof -ti :8000)
    echo "   PID: $EXISTING_PID"
else
    # 检查端口是否被其他进程占用
    PORT_USER=$(lsof -ti :8000 2>/dev/null)
    if [ ! -z "$PORT_USER" ]; then
        echo "⚠️  端口 8000 被其他进程占用 (PID: $PORT_USER)"
        echo "   正在停止该进程..."
        kill $PORT_USER 2>/dev/null
        sleep 2
    fi
    
    echo "📦 启动服务器..."
    export $(grep -v '^#' .env | xargs) 2>/dev/null
    nohup node server-combined.js > server.log 2>&1 &
    SERVER_PID=$!
    sleep 3
    
    # 检查服务器是否成功启动
    if ps -p $SERVER_PID > /dev/null 2>&1 && lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
        echo "✅ 服务器已启动 (PID: $SERVER_PID)"
    else
        echo "❌ 服务器启动失败，查看错误："
        tail -10 server.log 2>/dev/null || echo "无法读取日志"
        exit 1
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🔗 预览链接："
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "1. 本地访问："
echo "   http://localhost:8000"
echo ""

# 获取局域网 IP
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
if [ ! -z "$LOCAL_IP" ]; then
    echo "2. 局域网访问（同一 Wi-Fi）："
    echo "   http://$LOCAL_IP:8000"
    echo ""
fi

echo "3. GitHub Pages（如果已启用）："
echo "   https://ke22.github.io/CNA-map-tools/"
echo ""

echo "4. ngrok 公共链接（需要运行 ngrok）："
echo "   运行: ngrok http 8000"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "💡 提示："
echo "   - 按 Ctrl+C 停止服务器"
echo "   - 查看 PREVIEW_LINKS.md 获取更多信息"
echo "═══════════════════════════════════════════════════════════════"

