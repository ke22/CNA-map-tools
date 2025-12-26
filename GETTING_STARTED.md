# 快速开始指南

## 🎯 3 步快速开始

### 步骤 1: 克隆仓库

```bash
git clone https://github.com/ke22/CNA-map-tools.git
cd CNA-map-tools
git checkout feature/genai
```

### 步骤 2: 配置 Mapbox Token

1. 访问 https://account.mapbox.com/access-tokens/
2. 登录或注册账号（免费）
3. 复制你的 **Default public token**
4. 打开 `config.js`，找到 `MAPBOX.TOKEN`，替换为你的 Token

### 步骤 3: 启动应用

**选项 A：使用服务器（AI 功能可用）**
```bash
./SETUP_API_KEY.sh    # 设置 Gemini API Key（可选）
./START_SERVER.sh      # 启动服务器
```
然后打开：http://localhost:8000

**选项 B：直接打开 HTML（仅前端）**
直接用浏览器打开 `index-enhanced.html`

---

## ✅ 完成！

现在你可以开始使用地图工具了！

- 🗺️ 点击地图选择区域
- 📍 添加标记
- 🤖 使用 AI 分析新闻（如果配置了 API Key）
- 📥 导出地图

---

## 📚 需要更多帮助？

- 查看 `SETUP_GUIDE.md` 了解详细配置
- 查看 `README_FOR_SHARING.md` 了解完整功能
- 查看 `GENAI_USAGE.md` 了解 AI 功能

