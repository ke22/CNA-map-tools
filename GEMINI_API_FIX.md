# Gemini API 模型名称修复

## 问题
错误：`404 - models/gemini-pro is not found for API version v1beta`

## 原因
`gemini-pro` 模型在 v1beta API 中已经不再可用。

## 解决方案
已更新为新的模型名称：

### 推荐模型：
1. **gemini-1.5-flash** (已设置)
   - 快速响应
   - 适合实时应用
   - 成本较低

2. **gemini-1.5-pro** (可选)
   - 更高质量
   - 响应稍慢
   - 适合复杂任务

## 更改内容

### config.js
```javascript
MODEL: 'gemini-1.5-flash', // 从 'gemini-pro' 更新
```

### js/services/gemini-service.js
```javascript
const model = CONFIG.GEMINI.MODEL || 'gemini-1.5-flash';
```

## 如何切换到其他模型

如需使用 `gemini-1.5-pro`，只需修改 `config.js`:

```javascript
MODEL: 'gemini-1.5-pro',
```

## 验证
刷新页面后，API 调用应该正常工作。

