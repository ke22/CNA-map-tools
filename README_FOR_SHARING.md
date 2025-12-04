# CNA Map Tools - 地图工具

一个基于 Mapbox 的网页地图工具，支持国家/行政区标注、标记添加、AI 辅助分析和地图导出功能。

## ✨ 主要功能

- 🗺️ **多地图样式**：Light、Dark、Standard、Satellite
- 🎨 **区域标注**：国家、省/州、城市选择和自定义颜色
- 📍 **标记功能**：添加位置标记，支持名称或坐标搜索
- 🤖 **AI 辅助**：新闻文章分析，自动提取地理位置和地图设计建议
- 📥 **地图导出**：支持 PNG/JPG 格式，自定义分辨率
- 🌍 **全球数据**：支持全球所有国家和行政区

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/ke22/CNA-map-tools.git
cd CNA-map-tools
git checkout feature/genai
```

### 2. 配置 Mapbox Token（必需）

1. **获取 Token**：
   - 访问：https://account.mapbox.com/access-tokens/
   - 登录或注册账号（免费）
   - 复制 **Default public token**

2. **配置 Token**：
   - 打开 `config.js`
   - 找到 `MAPBOX.TOKEN`
   - 替换为你的 Token：
   ```javascript
   MAPBOX: {
     TOKEN: 'pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNs...'  // 你的 Token
   }
   ```

### 3. 启动应用

**方式 A：使用本地服务器（推荐，AI 功能可用）**

```bash
# 设置 Gemini API Key（可选，AI 功能需要）
./SETUP_API_KEY.sh

# 启动服务器
./START_SERVER.sh

# 打开浏览器访问：http://localhost:8000
```

**方式 B：直接打开 HTML（仅前端功能）**

直接用浏览器打开 `index-enhanced.html` 文件。

---

## 📋 前置要求

- **Node.js** (v14+) - 仅后端服务器需要
- **Mapbox Token** - 免费注册获取
- **Gemini API Key** - 可选，AI 功能需要

---

## 🔧 详细配置

### Mapbox Token

**免费额度**：每月 50,000 次地图加载（足够个人和小团队使用）

**获取步骤**：
1. 访问 https://account.mapbox.com/
2. 注册/登录账号
3. 进入 Account → Access tokens
4. 复制 Default public token（以 `pk.` 开头）

### Gemini API Key（可选）

**仅在使用 AI 功能时需要**

1. 访问：https://aistudio.google.com/app/apikey
2. 登录 Google 账号
3. 创建 API Key
4. 运行设置脚本：
   ```bash
   ./SETUP_API_KEY.sh
   ```
   或手动创建 `.env` 文件：
   ```bash
   GEMINI_API_KEY=your-api-key-here
   PORT=8000
   ```

---

## 📖 使用说明

### 基础功能

1. **选择地图样式**：点击顶部的样式按钮切换
2. **标注区域**：点击地图上的国家/行政区，选择颜色
3. **添加标记**：搜索位置名称或输入坐标，添加标记
4. **导出地图**：点击导出按钮，选择格式和分辨率

### AI 功能

1. 在「AI Assistant」区域粘贴新闻文章
2. 点击「分析文章」按钮
3. 查看提取的区域和位置
4. 选择要应用的区域和标记
5. 点击「应用到地图」

---

## 📁 项目结构

```
CNA-map-tools/
├── index-enhanced.html      # 主 HTML 文件
├── config.js                # 配置文件（Mapbox Token）
├── server-combined.js       # 服务器（AI 功能）
├── .env.example             # 环境变量模板
├── js/                      # JavaScript 文件
│   ├── app-enhanced.js      # 主应用逻辑
│   ├── features/            # 功能模块
│   └── services/            # 服务（Gemini API）
├── css/                     # 样式文件
└── data/                    # 数据文件
```

---

## 🔍 常见问题

### Q: 地图显示空白？
**A**: 检查：
1. Mapbox Token 是否正确配置在 `config.js`
2. Token 是否有效（在 Mapbox 账号页面查看）
3. 浏览器控制台是否有错误

### Q: AI 功能不可用？
**A**: 检查：
1. 是否配置了 Gemini API Key（`.env` 文件）
2. 服务器是否正在运行（`node server-combined.js`）
3. 服务器日志是否有错误

### Q: 如何切换到其他分支？
**A**: 
```bash
git checkout main          # 切换到 main 分支
git checkout feature/genai # 切换到 genai 分支
```

---

## 📚 更多文档

- `SETUP_GUIDE.md` - 详细设置指南
- `QUICK_SHARE_GUIDE.md` - 分享指南
- `GENAI_USAGE.md` - AI 功能使用说明
- `ISSUES_AND_FIXES.md` - 问题和修复记录

---

## 🛠️ 开发说明

### 修改配置

- **Mapbox 样式**：在 `config.js` 中修改 `MAPBOX.STYLES`
- **端口设置**：在 `.env` 文件中设置 `PORT=8000`
- **功能开关**：在 `config.js` 中配置

### 更新代码

```bash
git pull origin feature/genai
```

---

## 🐛 遇到问题？

1. 查看浏览器控制台错误信息
2. 查看服务器日志（如果运行了服务器）
3. 检查配置文件是否正确
4. 查看 `ISSUES_AND_FIXES.md` 文档
5. 在 GitHub 提交 Issue

---

## 📝 分支说明

- **main** - 主分支（稳定版）
- **feature/genai** - AI 功能分支（当前）
- **feature/add-markers** - 标记功能分支

---

## 📄 License

[添加你的许可证信息]

---

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📧 联系方式

如有问题或建议，请通过 GitHub Issues 联系。

