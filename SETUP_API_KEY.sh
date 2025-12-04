#!/bin/bash
# 快速设置 Gemini API 密钥的脚本

echo "🔑 Gemini API 密钥设置向导"
echo "================================"
echo ""

# 检查是否已有 .env 文件
if [ -f .env ]; then
    echo "⚠️  .env 文件已存在"
    read -p "是否要覆盖？(y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 已取消"
        exit 1
    fi
fi

# 获取 API 密钥
echo "请输入你的 Gemini API 密钥："
echo "（从 https://aistudio.google.com/app/apikey 获取）"
read -p "API Key: " api_key

if [ -z "$api_key" ]; then
    echo "❌ API 密钥不能为空"
    exit 1
fi

# 创建 .env 文件
cat > .env << EOF_ENV
# Gemini API Configuration
# 此文件包含敏感信息，不会提交到 Git
GEMINI_API_KEY=$api_key
EOF_ENV

echo ""
echo "✅ .env 文件已创建！"
echo ""
echo "现在可以启动服务器："
echo "  node server-combined.js"
echo ""
echo "或者在当前终端设置环境变量："
echo "  export GEMINI_API_KEY=\"$api_key\""
echo "  node server-combined.js"
