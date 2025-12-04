# 🔒 后端代理快速开始指南

## 为什么使用后端代理？

- ✅ **安全性**：API 密钥存储在服务器端，不会暴露在前端代码
- ✅ **生产就绪**：符合安全最佳实践
- ✅ **控制**：可以添加速率限制、日志、身份验证等

## 快速设置（5 分钟）

### 步骤 1：设置环境变量

**方法 A：直接设置（临时）**
```bash
export GEMINI_API_KEY="your-api-key-here"
node server-combined.js
```

**方法 B：使用 .env 文件（推荐）**
```bash
# 创建 .env 文件
echo 'GEMINI_API_KEY=your-api-key-here' > .env

# 然后启动服务器
node server-combined.js
```

### 步骤 2：启动服务器

```bash
node server-combined.js
```

你会看到：
```
🚀 Combined Server Running!
📍 Server: http://localhost:8000/
🔒 Gemini API Proxy: http://localhost:8000/api/gemini/generateContent
   ✅ API Key: Set (hidden)
```

### 步骤 3：配置前端

确保 `config.js` 中：

```javascript
GEMINI: {
    USE_BACKEND_PROXY: true,  // 启用后端代理
    PROXY_ENDPOINT: '/api/gemini/generateContent',
    ENABLED: true
}
```

### 步骤 4：测试

1. 打开浏览器：`http://localhost:8000/index-enhanced.html`
2. 使用 AI 助手功能
3. 检查控制台：应该看到 "🤖 Calling Gemini API via backend proxy"

## 架构图

```
浏览器 (前端)
    ↓ POST /api/gemini/generateContent
Node.js 服务器 (后端)
    ↓ HTTPS + API Key (环境变量)
Google Gemini API
    ↓ Response
Node.js 服务器 (后端)
    ↓ JSON Response
浏览器 (前端)
```

## 优势

### 开发模式（USE_BACKEND_PROXY = false）
- API 密钥在前端 config.js
- 简单快速
- ⚠️ 仅用于本地开发

### 生产模式（USE_BACKEND_PROXY = true）
- API 密钥在服务器环境变量
- ✅ 安全
- ✅ 可扩展
- ✅ 可添加速率限制

## 故障排除

### API 密钥未设置
```
⚠️  API Key: Not set!
```

**解决**：设置环境变量 `GEMINI_API_KEY`

### 代理端点 404
检查：
- 服务器是否在运行
- `PROXY_ENDPOINT` 配置是否正确
- URL 路径是否匹配

### CORS 错误
服务器已自动设置 CORS 头，如果仍有问题，检查浏览器控制台错误。

## 下一步

查看完整文档：`BACKEND_PROXY_SETUP.md`
