#!/bin/bash
# 辅助脚本：使用命令行参数创建 .env 文件

if [ -z "$1" ]; then
    echo "用法: $0 <YOUR_API_KEY>"
    echo ""
    echo "示例:"
    echo "  $0 AIzaSyYourKeyHere123"
    echo ""
    echo "或者运行交互式脚本："
    echo "  ./SETUP_API_KEY.sh"
    exit 1
fi

API_KEY="$1"

# 创建 .env 文件
cat > .env << EOF_ENV
# Gemini API Configuration
# 此文件包含敏感信息，不会提交到 Git
GEMINI_API_KEY=$API_KEY
EOF_ENV

echo "✅ .env 文件已创建！"
echo ""
echo "现在可以启动服务器："
echo "  node server-combined.js"
