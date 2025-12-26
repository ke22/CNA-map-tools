#!/bin/bash
# 启动服务器脚本

echo "🚀 启动 Map Tools 服务器..."
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "❌ .env 文件不存在！"
    echo "请先设置 API 密钥："
    echo "  ./SETUP_API_KEY.sh"
    exit 1
fi

# 检查 API 密钥是否设置
if ! grep -q "^GEMINI_API_KEY=" .env || [ -z "$(grep "^GEMINI_API_KEY=" .env | cut -d'=' -f2-)" ]; then
    echo "❌ API 密钥未设置或为空！"
    echo "请检查 .env 文件"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装！"
    echo "请安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ 环境检查通过"
echo ""
echo "正在启动服务器..."
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 加载 .env 文件中的环境变量
export $(grep -v '^#' .env | xargs)

# 启动服务器
node server-combined.js
