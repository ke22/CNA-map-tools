# 🔒 后端代理设置指南 - 生产环境

## 概述

此方案将 Gemini API 密钥安全地存储在服务器端环境变量中，而不是暴露在前端代码中。

## 架构说明

```
前端 (浏览器)
    ↓ HTTP POST
后端代理服务器 (Node.js)
    ↓ HTTPS + API Key (环境变量)
Google Gemini API
```

## 快速开始

### 步骤 1: 设置环境变量

创建 `.env` 文件（复制 `.env.example`）：

```bash
cp .env.example .env
```

编辑 `.env` 文件，添加你的 Gemini API 密钥：

```env
GEMINI_API_KEY=your-actual-api-key-here
```

### 步骤 2: 启动后端服务器

使用组合服务器（推荐）：

```bash
node server-combined.js
```

或者单独使用 Gemini 代理服务器：

```bash
node server-gemini-proxy.js
```

### 步骤 3: 配置前端

确保 `config.js` 中设置：

```javascript
GEMINI: {
    USE_BACKEND_PROXY: true,  // 使用后端代理
    PROXY_ENDPOINT: '/api/gemini/generateContent',
    ENABLED: true
}
```

### 步骤 4: 访问应用

打开浏览器访问：`http://localhost:8000/index-enhanced.html`

## 文件说明

### 后端文件

1. **`server-gemini-proxy.js`**
   - 独立的 Gemini API 代理服务器
   - 处理 `/api/gemini/generateContent` 端点
   - API 密钥从环境变量读取

2. **`server-combined.js`**
   - 组合服务器（静态文件 + API 代理）
   - 一个服务器处理所有请求
   - 推荐用于生产环境

3. **`.env.example`**
   - 环境变量配置模板
   - 复制为 `.env` 并填写实际值

### 前端文件

1. **`js/services/gemini-service.js`**
   - 已更新为支持后端代理
   - 自动检测 `USE_BACKEND_PROXY` 配置
   - 如果启用代理，API 密钥不会发送到前端

2. **`config.js`**
   - `USE_BACKEND_PROXY: true` - 使用后端代理（生产）
   - `USE_BACKEND_PROXY: false` - 直接调用 API（开发）

## 开发 vs 生产

### 开发模式（USE_BACKEND_PROXY = false）

```javascript
// config.js
USE_BACKEND_PROXY: false,
API_KEY: 'your-api-key',  // 密钥在前端（仅开发用）
```

- ✅ 简单快速
- ❌ API 密钥暴露在前端代码
- ⚠️ 仅用于本地开发

### 生产模式（USE_BACKEND_PROXY = true）

```javascript
// config.js
USE_BACKEND_PROXY: true,
PROXY_ENDPOINT: '/api/gemini/generateContent',
```

- ✅ API 密钥安全存储在服务器
- ✅ 可以添加速率限制
- ✅ 可以添加身份验证
- ✅ 符合安全最佳实践

## 部署到生产环境

### 使用环境变量

设置服务器环境变量：

```bash
export GEMINI_API_KEY="your-api-key-here"
```

或使用 `.env` 文件（需要安装 `dotenv` 包）：

```bash
npm install dotenv
```

然后在服务器代码开头添加：

```javascript
require('dotenv').config();
```

### 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动服务器
pm2 start server-combined.js --name "map-server"

# 设置环境变量
pm2 start server-combined.js --name "map-server" --env production
```

在 `ecosystem.config.js` 中：

```javascript
module.exports = {
  apps: [{
    name: 'map-server',
    script: 'server-combined.js',
    env: {
      GEMINI_API_KEY: 'your-api-key-here'
    }
  }]
};
```

### 使用 Docker

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
EXPOSE 8000
ENV GEMINI_API_KEY=""
CMD ["node", "server-combined.js"]
```

运行：

```bash
docker build -t map-server .
docker run -p 8000:8000 -e GEMINI_API_KEY="your-key" map-server
```

## 安全最佳实践

1. ✅ **永远不要**在前端代码中暴露 API 密钥
2. ✅ **永远不要**将 `.env` 文件提交到 Git
3. ✅ 使用环境变量存储敏感信息
4. ✅ 在生产环境中使用 HTTPS
5. ✅ 添加速率限制防止滥用
6. ✅ 考虑添加身份验证（如 API token）

## 故障排除

### 错误：GEMINI_API_KEY not set

- 检查环境变量是否设置：`echo $GEMINI_API_KEY`
- 检查 `.env` 文件是否存在且格式正确
- 确保服务器重启后环境变量仍然存在

### 错误：403 Forbidden

- 检查 API 密钥是否正确
- 检查 API 密钥是否有权限访问 Gemini API
- 验证 API 密钥是否被禁用或泄露

### 代理端点不工作

- 检查服务器是否在运行
- 检查 `PROXY_ENDPOINT` 配置是否正确
- 查看服务器日志中的错误信息

## 下一步

- [ ] 添加速率限制
- [ ] 添加请求日志
- [ ] 添加身份验证
- [ ] 添加错误监控
- [ ] 添加缓存机制

## 相关文档

- [API_KEY_ISSUE.md](./API_KEY_ISSUE.md) - API 密钥问题解决
- [GENAI_USAGE.md](./GENAI_USAGE.md) - GenAI 功能使用指南
- [API_KEYS_AND_PERMISSIONS.md](./API_KEYS_AND_PERMISSIONS.md) - API 密钥和权限说明

