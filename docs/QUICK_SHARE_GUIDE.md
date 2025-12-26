# 快速分享指南 🚀

## 最快的方式（3 步）

### 🌐 方式 A: 分享 GitHub 链接（推荐）

**步骤**：
1. 分享仓库链接：`https://github.com/ke22/CNA-map-tools`
2. 告诉他们分支：`feature/genai`
3. 提供快速开始说明（见下方）

**适合**：开发者、需要完整功能

---

### 🎁 方式 B: 使用 ngrok（5 分钟）

**步骤**：
```bash
# 1. 安装 ngrok（如果还没有）
brew install ngrok  # Mac
# 或从 https://ngrok.com/download 下载

# 2. 启动你的服务器
node server-combined.js

# 3. 在另一个终端运行
ngrok http 8000

# 4. 分享生成的 URL（例如：https://abc123.ngrok.io）
```

**适合**：快速演示、需要完整功能

---

### 📦 方式 C: 创建分享包

```bash
# 运行脚本创建分享包
./create-share-package.sh

# 分享生成的 map-tool-share.zip 文件
```

**适合**：给开发者、离线使用

---

## 给使用者的快速开始说明

### 如果分享 GitHub 链接：

```markdown
# 快速开始

1. 克隆仓库：
   git clone https://github.com/ke22/CNA-map-tools.git
   cd CNA-map-tools
   git checkout feature/genai

2. 设置 Mapbox Token：
   - 打开 `config.js`
   - 替换 `MAPBOX.TOKEN` 为你的 Token
   - 获取地址：https://account.mapbox.com/access-tokens/

3. 启动服务器（如果需要 AI 功能）：
   ./SETUP_API_KEY.sh  # 设置 Gemini API Key
   ./START_SERVER.sh    # 启动服务器
   
   或者直接打开 index-enhanced.html 使用前端功能
```

---

## 不同场景的推荐

| 场景 | 推荐方式 | 原因 |
|------|---------|------|
| 快速演示给老板 | ngrok | 5分钟搞定，功能完整 |
| 给开发者同事 | GitHub 链接 | 版本控制，便于协作 |
| 给非技术人员 | GitHub Pages | 点击链接就能用 |
| 团队长期使用 | 部署到服务器 | 稳定、可控制 |
| 离线演示 | 打包分享 | 不依赖网络 |

---

## 一键创建分享包

我已经创建了脚本，运行：

```bash
chmod +x create-share-package.sh
./create-share-package.sh
```

这会创建一个 `map-tool-share.zip` 文件，包含：
- 所有代码文件
- 启动脚本
- 使用说明
- 配置模板

直接分享这个 ZIP 文件即可！

---

## 需要帮助？

查看详细文档：
- `SHARING_GUIDE.md` - 完整分享指南
- `SHARING_OPTIONS.md` - 分享方式对比



