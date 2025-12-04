# 设置指南 - 开发者快速开始

## 📋 前置要求

- Node.js (v14 或更高版本)
- Git
- Mapbox 账号（免费）
- Gemini API Key（可选，用于 AI 功能）

---

## 🚀 快速开始（3 步）

### 步骤 1: 克隆仓库

```bash
git clone https://github.com/ke22/CNA-map-tools.git
cd CNA-map-tools
git checkout feature/genai
```

### 步骤 2: 配置 Mapbox Token

1. **获取 Mapbox Token**：
   - 访问：https://account.mapbox.com/access-tokens/
   - 登录或注册账号（免费）
   - 复制你的 **Default public token**

2. **配置 Token**：
   - 打开 `config.js`
   - 找到 `MAPBOX.TOKEN`
   - 替换为你的 Token：
   ```javascript
   MAPBOX: {
     TOKEN: 'pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNs...'  // 你的 Token
   }
   ```

### 步骤 3: 启动应用

**选项 A: 使用本地服务器（推荐，AI 功能可用）**

```bash
# 设置 Gemini API Key（可选，AI 功能需要）
./SETUP_API_KEY.sh

# 启动服务器
./START_SERVER.sh

# 或直接运行
node server-combined.js
```

然后打开浏览器访问：`http://localhost:8000`

**选项 B: 直接打开 HTML（仅前端功能）**

直接用浏览器打开 `index-enhanced.html` 文件即可。

---

## 🔧 详细配置

### Mapbox Token 配置

**位置**：`config.js`

```javascript
const CONFIG = {
  MAPBOX: {
    TOKEN: 'your-mapbox-token-here',  // 替换这里
    STYLE: 'mapbox://styles/mapbox/light-v11'
  }
}
```

**如何获取 Token**：
1. 访问 https://account.mapbox.com/
2. 注册/登录（免费账号即可）
3. 进入 Account → Access tokens
4. 复制 **Default public token**（以 `pk.` 开头）

**免费额度**：
- 每月 50,000 次地图加载
- 足够个人和小团队使用

---

### Gemini API Key 配置（可选）

**位置**：`.env` 文件

**步骤**：
```bash
# 1. 复制模板文件
cp .env.example .env

# 2. 编辑 .env 文件
# 或使用提供的脚本
./SETUP_API_KEY.sh
```

**如何获取 API Key**：
1. 访问：https://aistudio.google.com/app/apikey
2. 登录 Google 账号
3. 创建新的 API Key
4. 复制并保存

**在 .env 文件中设置**：
```bash
GEMINI_API_KEY=your-api-key-here
PORT=8000
```

**注意**：
- `.env` 文件已添加到 `.gitignore`，不会提交到 Git
- AI 功能需要这个 API Key
- 如果没有配置，前端功能仍然可用

---

## 📁 项目结构

```
CNA-map-tools/
├── index-enhanced.html      # 主 HTML 文件
├── config.js                # 配置文件（Mapbox Token 在这里）
├── server-combined.js       # 服务器（AI 功能需要）
├── server-gemini-proxy.js   # Gemini API 代理
├── .env.example             # 环境变量模板
├── .env                     # 环境变量（本地，不提交到 Git）
├── js/                      # JavaScript 文件
│   ├── app-enhanced.js      # 主应用逻辑
│   ├── features/            # 功能模块
│   ├── services/            # 服务（如 Gemini）
│   └── utils/               # 工具函数
├── css/                     # 样式文件
├── data/                    # 数据文件（GADM 等）
├── SETUP_API_KEY.sh         # API Key 设置脚本
├── START_SERVER.sh          # 启动脚本
└── README.md                # 项目说明
```

---

## 🎯 功能说明

### ✅ 基础功能（无需后端）
- 地图浏览和切换样式
- 国家/行政区选择和上色
- 标记添加和管理
- 地图导出（PNG/JPG）

### 🤖 AI 功能（需要后端服务器）
- 新闻文章分析
- 自动提取地理位置
- 自动标注地图区域
- 地图设计建议

---

## 🔍 常见问题

### Q: 为什么地图显示空白？
**A**: 检查：
1. Mapbox Token 是否正确配置
2. Token 是否有效（可以在 Mapbox 账号页面查看）
3. 浏览器控制台是否有错误信息

### Q: AI 功能不可用？
**A**: 检查：
1. 是否配置了 Gemini API Key（`.env` 文件）
2. 服务器是否正在运行（`node server-combined.js`）
3. 服务器日志是否有错误

### Q: 如何切换分支？
**A**:
```bash
git checkout main          # 切换到 main 分支
git checkout feature/genai # 切换到 genai 分支
```

### Q: 如何更新代码？
**A**:
```bash
git pull origin feature/genai
```

### Q: 数据文件很大怎么办？
**A**: GADM 数据文件（在 `data/gadm/` 目录）已经添加到 `.gitignore`。
- 如果需要完整功能，需要单独下载数据文件
- 或使用 Mapbox 边界数据（已包含）

---

## 🛠️ 开发说明

### 修改配置

**Mapbox 样式**：
在 `config.js` 中修改 `MAPBOX.STYLES` 对象

**端口设置**：
在 `.env` 文件中设置 `PORT=8000`

**功能开关**：
在 `config.js` 中可以配置各个功能的开关

---

## 📚 更多文档

- `QUICK_SHARE_GUIDE.md` - 快速分享指南
- `SHARING_OPTIONS.md` - 分享方式对比
- `GENAI_USAGE.md` - AI 功能使用说明
- `ISSUES_AND_FIXES.md` - 问题和修复记录

---

## 🐛 遇到问题？

1. 查看浏览器控制台错误信息
2. 查看服务器日志
3. 检查配置文件是否正确
4. 查看 `ISSUES_AND_FIXES.md` 文档

---

## 📝 下一步

1. ✅ 配置 Mapbox Token
2. ✅ 启动服务器（可选，AI 功能需要）
3. ✅ 开始使用地图工具！

**需要帮助？** 查看 `README.md` 或提交 Issue。

