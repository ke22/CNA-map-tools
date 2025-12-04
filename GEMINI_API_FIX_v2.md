# Gemini API 端点修复

## 问题
错误：`404 - models/gemini-1.5-flash is not found for API version v1beta`

## 解决方案

### 更改 1: 使用 v1 API 端点
- 从 `v1beta` 改为 `v1`（更稳定的端点）

### 更改 2: 使用完整模型名称
- 从 `gemini-1.5-flash` 改为 `gemini-1.5-flash-latest`
- 或者使用具体版本号如 `gemini-1.5-flash-002`

## 更新的配置

### config.js
```javascript
MODEL: 'gemini-1.5-flash-latest',
BASE_URL: 'https://generativelanguage.googleapis.com/v1',
```

### API URL 格式
- 旧格式: `v1beta/models/gemini-1.5-flash:generateContent`
- 新格式: `v1/models/gemini-1.5-flash-latest:generateContent`

## 其他可用的模型名称

如果 `gemini-1.5-flash-latest` 仍然不行，可以尝试：
- `gemini-1.5-flash-002`
- `gemini-1.5-pro-latest`
- `gemini-1.5-pro-002`

## 验证
刷新页面后，API 调用应该使用新的端点。
