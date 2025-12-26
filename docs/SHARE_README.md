# 如何分享这个地图工具

## 快速分享方式

### 🌐 方式 1: GitHub Pages（最简单）

**适合场景**：快速演示、不需要后端功能

**步骤**：
1. 在 GitHub 仓库设置 → Pages
2. 选择分支：`main` 或 `feature/genai`
3. 选择目录：`/ (root)`
4. 分享生成的 URL：`https://ke22.github.io/CNA-map-tools/`

**注意**：
- ✅ 前端功能完整（地图、标注、标记）
- ❌ AI 功能不可用（需要后端代理）

---

### 🚀 方式 2: 使用 ngrok（临时公共链接）

**适合场景**：快速演示、需要完整功能

**步骤**：
```bash
# 1. 安装 ngrok
brew install ngrok  # Mac
# 或从 https://ngrok.com/download 下载

# 2. 启动本地服务器
node server-combined.js

# 3. 在另一个终端运行
ngrok http 8000

# 4. 分享生成的公共 URL（如：https://xxxxx.ngrok.io）
```

**优点**：
- ✅ 功能完整（包括 AI 功能）
- ✅ 可以分享给任何人

**限制**：
- ⏰ 免费版链接会过期
- 🔄 每次启动 URL 都会变化

---

### 🏠 方式 3: 局域网分享

**适合场景**：同一 Wi-Fi 网络下分享

**步骤**：
```bash
# 1. 启动服务器
node server-combined.js

# 2. 查看你的 IP 地址
# Mac/Linux: ifconfig | grep "inet "
# Windows: ipconfig

# 3. 分享给你的 IP 和端口
# 例如：http://192.168.1.100:8000
```

**优点**：
- ✅ 功能完整
- ✅ 局域网内快速访问

---

### 📦 方式 4: 打包分享代码

**适合场景**：给开发者分享、需要自定义

**步骤**：
```bash
# 1. 创建分享包
zip -r map-tool-share.zip \
  index-enhanced.html \
  js/ css/ config.js \
  server-combined.js server-gemini-proxy.js \
  SETUP_API_KEY.sh START_SERVER.sh \
  README.md SHARING_GUIDE.md \
  .env.example \
  -x "*.log" "node_modules/*" "data/gadm/*.geojson"

# 2. 分享 ZIP 文件
```

**使用者步骤**：
```bash
# 1. 解压文件
unzip map-tool-share.zip
cd map-tool-share

# 2. 设置 API 密钥
cp .env.example .env
# 编辑 .env 填入 GEMINI_API_KEY

# 3. 启动服务器
chmod +x START_SERVER.sh
./START_SERVER.sh
```

---

## 需要的配置信息

### 必需的 API 密钥：

1. **Mapbox Token**
   - 位置：`config.js`
   - 获取：https://account.mapbox.com/access-tokens/
   - 需要分享给使用者，让他们自己配置

2. **Gemini API Key**（AI 功能需要）
   - 位置：`.env` 文件
   - 获取：https://aistudio.google.com/app/apikey
   - 如果使用后端代理，只需要服务器端配置

---

## 推荐的分享流程

### 对于开发者：
1. 分享 GitHub 仓库链接
2. 提供设置说明
3. 让他们自己配置 API 密钥

### 对于普通用户：
1. 使用 GitHub Pages（简单演示）
2. 或使用 ngrok（完整功能演示）
3. 提供操作指南

### 对于团队：
1. 部署到内部服务器
2. 使用固定 IP 或域名
3. 配置好所有 API 密钥

---

## 快速启动脚本

### 一键启动（带检查）

```bash
#!/bin/bash
# START_SERVER.sh

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在"
    echo "正在创建 .env.example 副本..."
    cp .env.example .env
    echo "请编辑 .env 文件填入 GEMINI_API_KEY"
    exit 1
fi

# 加载环境变量
export $(grep -v '^#' .env | xargs)

# 检查 API 密钥
if [ -z "$GEMINI_API_KEY" ] || [ "$GEMINI_API_KEY" == "YOUR_GEMINI_API_KEY_HERE" ]; then
    echo "⚠️  请先在 .env 文件中设置 GEMINI_API_KEY"
    exit 1
fi

# 启动服务器
echo "🚀 启动服务器..."
node server-combined.js
```

---

## 分享检查清单

在分享前，请确认：

- [ ] 已配置 Mapbox Token（在 config.js 中）
- [ ] 已创建 .env.example 模板文件
- [ ] 已添加 .gitignore 防止泄露密钥
- [ ] 已创建 README.md 说明文档
- [ ] 已测试所有功能是否正常
- [ ] 已移除敏感信息（如真实 API 密钥）

---

## 常见问题

**Q: 可以分享给没有技术背景的人吗？**
A: 可以，使用 GitHub Pages 最简单，他们只需要打开链接即可。

**Q: AI 功能可以分享吗？**
A: 可以，但需要：
- 使用后端代理（API 密钥在服务器端）
- 或让使用者自己配置 API 密钥

**Q: 大文件（GADM 数据）怎么办？**
A: 
- 可以选择性分享（如果不需要行政区功能）
- 或提供下载链接
- 或使用 Git LFS

---

## 下一步

1. 选择适合的分享方式
2. 创建必要的配置文件
3. 测试分享流程
4. 提供使用说明



