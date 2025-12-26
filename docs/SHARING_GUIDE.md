# 分享地图工具指南

## 分享方式

### 方式 1: GitHub 仓库分享（推荐）

**优点**：
- 代码版本控制
- 可以协作开发
- 易于更新和维护

**步骤**：
1. 确保代码已推送到 GitHub
2. 分享仓库链接：`https://github.com/ke22/CNA-map-tools`
3. 提供分支信息：`feature/genai` 或 `main`

**使用者需要**：
- 克隆仓库：`git clone https://github.com/ke22/CNA-map-tools.git`
- 切换到分支：`git checkout feature/genai`
- 按照 README 说明设置

---

### 方式 2: GitHub Pages 在线部署（最简单）

**优点**：
- 无需安装，直接在浏览器访问
- 免费托管
- 自动更新

**步骤**：
1. 在 GitHub 仓库设置中启用 GitHub Pages
2. 选择分支和目录（如 `main` 或 `feature/genai`）
3. 分享生成的 URL：`https://ke22.github.io/CNA-map-tools/`

**限制**：
- 需要处理 API 密钥（不能暴露）
- 后端代理功能需要单独部署

---

### 方式 3: 本地服务器分享

**优点**：
- 功能完整（包括后端代理）
- 可控制访问

**步骤**：
1. 启动本地服务器：`npm start` 或 `node server-combined.js`
2. 确保防火墙允许访问
3. 分享你的 IP 地址和端口（如：`http://192.168.1.100:8000`）

**局域网分享**：
- 同一 Wi-Fi 网络下的设备可以访问
- 需要知道你的本地 IP 地址

**互联网分享**：
- 需要配置端口转发或使用 ngrok 等工具
- 需要静态 IP 或 DDNS

---

### 方式 4: 打包为静态文件分享

**优点**：
- 可以离线使用
- 易于分发

**步骤**：
1. 打包所有文件（HTML, CSS, JS）
2. 创建说明文档
3. 打包为 ZIP 文件

**注意**：
- 需要使用者配置 Mapbox Token
- 后端功能无法使用（除非单独部署）
- 大文件（如 GADM 数据）可能需要单独下载

---

### 方式 5: 使用 ngrok 临时分享

**优点**：
- 快速创建公共访问链接
- 适合演示和测试

**步骤**：
1. 安装 ngrok：`brew install ngrok`（Mac）或从官网下载
2. 启动本地服务器：`node server-combined.js`
3. 运行：`ngrok http 8000`
4. 分享生成的公共 URL（如：`https://xxxxx.ngrok.io`）

**限制**：
- 免费版有时间限制
- URL 每次启动都会变化

---

## 推荐方案组合

### 方案 A：完整功能分享（适合开发者和完整使用）

1. **GitHub 仓库** - 分享代码
2. **README.md** - 详细安装说明
3. **环境变量模板** - `.env.example` 文件
4. **启动脚本** - 一键启动脚本

**使用者步骤**：
```bash
git clone https://github.com/ke22/CNA-map-tools.git
cd CNA-map-tools
git checkout feature/genai
npm install
cp .env.example .env
# 编辑 .env 填入 API 密钥
npm start
```

---

### 方案 B：快速演示分享（适合展示和测试）

1. **GitHub Pages** - 在线访问（仅前端）
2. **或 ngrok** - 临时公共链接（完整功能）

**优点**：
- 无需安装
- 立即可以访问

**限制**：
- GitHub Pages 无法使用后端代理
- ngrok 链接会过期

---

### 方案 C：内部网络分享（适合团队协作）

1. **本地服务器** + **固定 IP 或域名**
2. **或内网服务器部署**

**优点**：
- 功能完整
- 可控制访问权限

---

## 需要分享的配置信息

### 必需的配置：

1. **Mapbox Token**
   - 位置：`config.js` 或环境变量
   - 如何获取：https://account.mapbox.com/access-tokens/

2. **Gemini API Key**（如果使用 AI 功能）
   - 位置：`.env` 文件
   - 如何获取：https://aistudio.google.com/app/apikey

### 可选的配置：

3. **服务器端口**（默认 8000）
4. **数据文件路径**（GADM 数据等）

---

## 创建分享包

### 快速分享包内容：

```
分享包/
├── README.md              # 使用说明
├── QUICK_START.md         # 快速开始
├── SETUP_API_KEY.sh       # API 密钥设置脚本
├── START_SERVER.sh        # 启动脚本
├── .env.example           # 环境变量模板
├── index-enhanced.html    # 主文件
├── js/                    # JavaScript 文件
├── css/                   # CSS 文件
└── config.js              # 配置文件
```

---

## 下一步建议

1. 创建详细的 README.md
2. 创建 .env.example 模板文件
3. 创建一键启动脚本
4. 考虑使用 GitHub Actions 自动部署
5. 创建演示版本（去除敏感信息）



