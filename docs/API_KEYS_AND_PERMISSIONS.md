# API 密钥与权限配置指南

## 📋 需要的权限信息

要完整使用地图工具的所有功能，你需要配置以下 API 密钥：

---

## 1. 🔴 必需：Mapbox API Token

### 用途
- 地图显示
- 地理编码（位置名称转坐标）
- 地图样式加载

### 如何获取

1. **访问 Mapbox 网站**
   - 网址：https://account.mapbox.com/

2. **注册/登录账号**
   - 创建免费账号或登录现有账号

3. **获取 Access Token**
   - 登录后，进入 "Tokens" 页面
   - 找到 "Default public token" 或创建新 token
   - 复制 token（格式：`pk.eyJ...`）

4. **配置位置**
   ```javascript
   // config.js
   MAPBOX: {
     TOKEN: 'pk.eyJ...',  // 粘贴你的 Mapbox token
   }
   ```

### 当前状态
✅ **已配置** - 在 `config.js` 第 18 行已有 token

---

## 2. 🟡 可选：Gemini API Key（AI 助手功能）

### 用途
- AI 新闻文本分析
- 自动提取位置信息
- 智能标记建议

### 如何获取

1. **访问 Google AI Studio**
   - 网址：https://makersuite.google.com/app/apikey

2. **登录 Google 账号**
   - 使用你的 Google 账号登录

3. **创建 API Key**
   - 点击 "Create API Key"
   - 选择项目或创建新项目
   - 复制生成的 API Key

4. **配置位置**
   ```javascript
   // config.js
   GEMINI: {
     API_KEY: 'YOUR_GEMINI_API_KEY',  // 替换为你的 API Key
     ENABLED: true,  // 设置为 true 启用功能
   }
   ```

### 当前状态
⚠️ **未配置** - 需要设置 API Key 并启用

### 成本
- 免费层：15 请求/分钟
- 付费：约 $0.002 每篇新闻（2000 字符）

---

## 📝 配置检查清单

### 必需配置

- [ ] **Mapbox Token** 
  - 位置：`config.js` 第 18 行
  - 状态：✅ 已配置（请验证是否有效）

### 可选配置

- [ ] **Gemini API Key**（AI 助手功能）
  - 位置：`config.js` 第 354 行
  - 状态：⚠️ 需要配置
  - 步骤：
    1. 获取 API Key
    2. 设置 `API_KEY`
    3. 设置 `ENABLED: true`

---

## 🔧 完整配置示例

### config.js 关键部分

```javascript
const CONFIG = {
  // 1. Mapbox 配置（必需）
  MAPBOX: {
    TOKEN: 'pk.eyJ1IjoiY25hZ3JhcGhpY2Rlc2lnbiIsImEiOiJjbHRxbXlnc28wODF6Mmltb2Rjb3g5a25kIn0.x73wo3gKurL6CivFUOjVeg',
    // ... 其他配置
  },

  // 2. Gemini AI 配置（可选 - AI 助手功能）
  GEMINI: {
    API_KEY: 'YOUR_GEMINI_API_KEY',  // ⬅️ 需要替换
    MODEL: 'gemini-pro',
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
    TIMEOUT: 30000,
    ENABLED: false,  // ⬅️ 设置为 true 启用
  },
};
```

---

## 🔐 安全建议

### ⚠️ 重要安全提示

1. **不要提交 API Key 到公开仓库**
   - `config.js` 已包含在 `.gitignore`
   - 检查 `.gitignore` 是否包含 `config.js`

2. **API Key 类型**
   - **Mapbox**: Public token（前端使用安全）
   - **Gemini**: API Key（MVP 在前端，生产环境应移至后端）

3. **生产环境**
   - Mapbox token: 可在前端使用（公开 token）
   - Gemini API Key: 建议移到后端服务器

---

## 🎯 快速开始

### 最小配置（基本地图功能）

只需要：
- ✅ Mapbox Token（已配置）

### 完整功能（包含 AI 助手）

需要：
- ✅ Mapbox Token（已配置）
- ⬅️ Gemini API Key（需要配置）

---

## 🔍 验证配置

### 检查 Mapbox Token

1. 打开浏览器控制台（F12）
2. 查看是否有 Mapbox 相关错误
3. 地图应该正常显示

### 检查 Gemini API Key

1. 打开页面
2. 找到 "AI Assistant" 部分
3. 粘贴新闻文本
4. 点击 "Analyze with AI"
5. 查看是否有错误提示

---

## 📞 获取帮助

### Mapbox 问题
- 文档：https://docs.mapbox.com/
- 支持：https://support.mapbox.com/

### Gemini 问题
- 文档：https://ai.google.dev/docs
- 支持：通过 Google Cloud Console

---

## ✅ 配置完成检查

### 基本功能（地图 + 标记）
- [x] Mapbox Token 已配置
- [ ] 地图正常显示？
- [ ] 可以添加标记？
- [ ] 可以选择区域？

### AI 功能（新闻分析）
- [ ] Gemini API Key 已配置
- [ ] `ENABLED: true` 已设置
- [ ] AI Assistant 界面显示正常？
- [ ] 可以分析新闻文本？

---

## 📊 成本估算

### Mapbox
- **免费层**: 50,000 map loads/月
- **超出后**: $5/1000 loads
- **当前使用**: 基本地图功能免费层足够

### Gemini
- **免费层**: 15 请求/分钟
- **付费**: $0.002/请求（2000 字符）
- **预估**: 1000 篇文章 ≈ $2

---

## 🚀 下一步

1. **验证当前配置**
   - 检查 Mapbox token 是否有效
   - 测试基本地图功能

2. **（可选）配置 AI 功能**
   - 获取 Gemini API Key
   - 在 `config.js` 中配置
   - 启用 AI Assistant 功能

3. **开始使用**
   - 基本功能立即可用
   - AI 功能配置后可用

---

**当前状态：Mapbox 已配置，可以立即使用基本功能！** ✅



