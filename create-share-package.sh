#!/bin/bash
# Create Share Package Script
# 创建分享包的脚本

echo "📦 创建分享包..."

# 创建临时目录
TEMP_DIR="map-tool-share-temp"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "📋 复制文件..."

# 复制核心文件
cp index-enhanced.html "$TEMP_DIR/"
cp config.js "$TEMP_DIR/"
cp server-combined.js "$TEMP_DIR/"
cp server-gemini-proxy.js "$TEMP_DIR/"

# 复制目录
cp -r js "$TEMP_DIR/"
cp -r css "$TEMP_DIR/"

# 复制脚本和文档
cp SETUP_API_KEY.sh "$TEMP_DIR/" 2>/dev/null || true
cp START_SERVER.sh "$TEMP_DIR/" 2>/dev/null || true
cp README.md "$TEMP_DIR/" 2>/dev/null || true
cp SHARING_OPTIONS.md "$TEMP_DIR/" 2>/dev/null || true
cp SHARE_README.md "$TEMP_DIR/" 2>/dev/null || true

# 创建 .env.example
cat > "$TEMP_DIR/.env.example" << 'EOF'
# Gemini API Key
# 获取方式：https://aistudio.google.com/app/apikey
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# Server Port (可选，默认 8000)
PORT=8000
EOF

# 创建快速开始文档
cat > "$TEMP_DIR/QUICK_START.md" << 'EOF'
# 快速开始指南

## 1. 设置 API 密钥

### Mapbox Token（必需）
1. 打开 `config.js`
2. 找到 `MAPBOX.TOKEN`
3. 替换为你的 Mapbox Token
   - 获取地址：https://account.mapbox.com/access-tokens/

### Gemini API Key（可选，AI 功能需要）
1. 复制 `.env.example` 为 `.env`
   ```bash
   cp .env.example .env
   ```
2. 编辑 `.env`，填入你的 Gemini API Key
   - 获取地址：https://aistudio.google.com/app/apikey

## 2. 启动服务器

```bash
chmod +x START_SERVER.sh
./START_SERVER.sh
```

或者直接运行：
```bash
node server-combined.js
```

## 3. 打开浏览器

访问：http://localhost:8000

## 功能说明

- ✅ 地图标注和上色
- ✅ 标记功能
- ✅ AI 分析功能（需要 Gemini API Key）
- ✅ 地图导出

## 需要帮助？

查看 `SHARING_OPTIONS.md` 了解更多分享方式。
EOF

# 创建 package.json（如果需要）
if [ ! -f package.json ]; then
    cat > "$TEMP_DIR/package.json" << 'EOF'
{
  "name": "cna-map-tools",
  "version": "1.0.0",
  "description": "Map tool for creating custom maps with territory and location markers",
  "main": "server-combined.js",
  "scripts": {
    "start": "node server-combined.js"
  },
  "dependencies": {}
}
EOF
fi

# 设置执行权限
chmod +x "$TEMP_DIR"/*.sh 2>/dev/null || true

echo "📦 创建 ZIP 包..."

# 创建 ZIP（排除大文件和敏感文件）
cd "$TEMP_DIR"
zip -r ../map-tool-share.zip . \
    -x "*.log" \
    -x "*.env" \
    -x "node_modules/*" \
    -x "data/gadm/*.geojson" \
    -x ".git/*"
cd ..

# 清理临时目录
rm -rf "$TEMP_DIR"

echo "✅ 分享包已创建：map-tool-share.zip"
echo ""
echo "📋 分享包包含："
echo "   - 所有必需的代码文件"
echo "   - 启动脚本"
echo "   - 使用说明"
echo "   - 配置模板"
echo ""
echo "📤 现在可以分享 map-tool-share.zip 文件了！"





