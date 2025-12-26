# 🔑 Gemini API 使用方法

## 📋 概述

本系统支持两种方式使用 Gemini API：
1. **后端代理模式（推荐）**：API 密钥存储在服务器端，更安全
2. **前端直接调用（开发）**：API 密钥在前端代码中，仅用于开发测试

---

## 🚀 方法 1：后端代理模式（推荐，生产环境）

### 步骤 1: 获取 Gemini API Key

1. 访问：https://aistudio.google.com/app/apikey
2. 使用 Google 账号登录
3. 点击 "Create API Key"
4. 选择或创建项目
5. 复制生成的 API Key

### 步骤 2: 配置环境变量

**选项 A：使用设置脚本（推荐）**

```bash
./SETUP_API_KEY.sh
```

然后输入你的 API Key。

**选项 B：手动创建 .env 文件**

创建 `.env` 文件：

```bash
# Gemini API Configuration
GEMINI_API_KEY=你的API密钥
MAPBOX_TOKEN=你的Mapbox令牌
```

### 步骤 3: 确保配置正确

检查 `config.js` 中的设置：

```javascript
GEMINI: {
    USE_BACKEND_PROXY: true,  // ✅ 使用后端代理
    PROXY_ENDPOINT: '/api/gemini/generateContent',
    ENABLED: true,  // ✅ 启用 AI 功能
}
```

### 步骤 4: 启动服务器

```bash
node server-combined.js
```

或使用启动脚本：

```bash
./START_SERVER.sh
```

服务器会在 `http://localhost:8000` 启动。

### 步骤 5: 使用 AI 助手

1. 打开浏览器访问：`http://localhost:8000/index-enhanced.html`
2. 找到 "AI Assistant" 部分
3. 粘贴新闻文本或 URL
4. 点击 "Analyze with AI"
5. 等待分析完成

---

## 🔧 方法 2：前端直接调用（仅开发）

⚠️ **注意**：此方法会将 API Key 暴露在前端代码中，仅用于开发测试！

### 步骤 1: 获取 API Key

同上，从 https://aistudio.google.com/app/apikey 获取

### 步骤 2: 修改 config.js

```javascript
GEMINI: {
    USE_BACKEND_PROXY: false,  // ❌ 不使用后端代理
    API_KEY: '你的API密钥',     // 直接在前端设置
    ENABLED: true,
}
```

### 步骤 3: 直接打开 HTML

直接用浏览器打开 `index-enhanced.html` 即可（无需服务器）。

---

## ✅ 验证配置

### 检查后端代理是否工作

1. 启动服务器：`node server-combined.js`
2. 查看控制台输出，应该看到：
   ```
   ✅ GEMINI_API_KEY: 已设置
   ✅ Server running on http://localhost:8000
   ```
3. 如果看到 "❌ GEMINI_API_KEY: 未设置"，说明 `.env` 文件配置不正确

### 检查前端配置

1. 打开浏览器控制台（F12）
2. 查看是否有 `✅ geminiService 已載入` 消息
3. 尝试使用 AI 助手功能，查看是否有错误

---

## 📊 配额和限制

### Gemini 2.0 Flash 免费层

- **每分钟请求数**：15 次/分钟
- **每天请求数**：1,500 次/天
- **输入 token**：每 1 分钟有上限
- **成本**：免费

### 已实现的优化

✅ **自动缓存**：相同内容使用缓存，不消耗配额
✅ **请求间隔控制**：最小 2 秒间隔
✅ **文本截断**：自动截断超过 15,000 字符的文本
✅ **429 错误重试**：自动重试，指数退避
✅ **防重复请求**：防止并发和重复请求

---

## 🔍 故障排除

### 问题 1: "GEMINI_API_KEY 未设置"

**解决方案**：
1. 检查 `.env` 文件是否存在
2. 检查 `.env` 文件中的 `GEMINI_API_KEY` 是否正确
3. 确保没有多余的空格或引号
4. 重启服务器

### 问题 2: "429 Too Many Requests"

**原因**：配额限制

**解决方案**：
1. 等待配额重置（通常是每分钟或每天）
2. 检查是否有缓存可以使用
3. 减少请求频率
4. 查看配额使用情况：https://aistudio.google.com/app/apikey

### 问题 3: "API 密钥无效"

**解决方案**：
1. 检查 API Key 是否正确复制
2. 确保没有多余的空格
3. 访问 https://aistudio.google.com/app/apikey 验证 API Key 是否有效
4. 检查 API Key 是否被禁用

### 问题 4: CORS 错误（前端直接调用）

**解决方案**：
- 使用后端代理模式（推荐）
- 或确保浏览器允许跨域请求

---

## 💡 最佳实践

1. **使用后端代理**：生产环境必须使用后端代理模式
2. **保护 API Key**：不要将 `.env` 文件提交到 Git
3. **监控配额**：定期检查配额使用情况
4. **使用缓存**：相同内容会自动使用缓存
5. **控制文本长度**：系统会自动截断，但尽量使用较短的文本

---

## 📝 配置文件位置

- **环境变量**：`.env` 文件（根目录）
- **前端配置**：`config.js` 文件
- **后端服务器**：`server-combined.js` 或 `server-gemini-proxy.js`
- **API 服务**：`js/services/gemini-service.js`

---

## 🔗 相关链接

- **获取 API Key**：https://aistudio.google.com/app/apikey
- **配额监控**：https://aistudio.google.com/app/apikey
- **API 文档**：https://ai.google.dev/docs
- **配额限制**：https://ai.google.dev/gemini-api/docs/rate-limits

---

## 📞 获取帮助

如果遇到问题：

1. 检查浏览器控制台的错误信息
2. 检查服务器控制台的日志
3. 查看 `docs/` 目录下的相关文档
4. 检查 API Key 是否有效

---

**祝使用愉快！** 🎉
