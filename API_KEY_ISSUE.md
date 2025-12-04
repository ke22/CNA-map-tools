# ⚠️ API 密钥问题 - 需要生成新密钥

## 问题

错误信息显示：
```
403 Forbidden - Your API key was reported as leaked. Please use another API key.
```

这说明当前的 API 密钥已被标记为泄露，Google 已禁用它。

## 解决方案

### 步骤 1：生成新的 Gemini API 密钥

1. 访问 Google AI Studio：
   https://aistudio.google.com/app/apikey

2. 登录你的 Google 账号

3. 点击 "Create API Key"（创建 API 密钥）

4. 选择或创建 Google Cloud 项目

5. 复制生成的新 API 密钥

### 步骤 2：更新配置文件

打开 `config.js`，找到以下部分：

```javascript
GEMINI: {
    API_KEY: 'YOUR_NEW_API_KEY_HERE', // 替换为新的 API 密钥
    ...
}
```

将 `YOUR_NEW_API_KEY_HERE` 替换为你刚才生成的新 API 密钥。

### 步骤 3：清除浏览器缓存

由于仍有旧代码在使用（gemini-pro），需要清除缓存：

1. 打开开发者工具 (F12)
2. 右键点击刷新按钮
3. 选择「清空缓存并硬性重新加载」

或使用快捷键：
- Mac: Cmd + Shift + R
- Windows: Ctrl + Shift + R

### 步骤 4：测试新密钥

1. 刷新页面
2. 尝试使用 AI 分析功能
3. 检查控制台是否还有错误

## 安全提示

⚠️ **重要：不要在代码中直接暴露 API 密钥**

当前配置将密钥存储在 `config.js` 中，这对于开发/测试是可以的，但在生产环境中：

1. 使用后端代理 API 调用
2. 将密钥存储在环境变量中
3. 使用服务器端代码调用 Gemini API

## 当前配置位置

文件：`config.js`（第 354 行）

```javascript
API_KEY: 'AIzaSyCndAts3vwZ_OayaWbDDstzEjXtjJupulk', // 需要替换
```

替换为新的 API 密钥后即可正常使用。
