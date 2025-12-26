# 🔧 清除浏览器缓存 - 解决 Gemini API 404 错误

## 问题描述
错误信息显示仍然在使用已弃用的 `gemini-pro` 模型，这是因为浏览器缓存了旧的 JavaScript 文件。

## 快速解决方案

### ⚡ 方法 1：硬刷新（最快）
- **Windows/Linux**: `Ctrl + Shift + R` 或 `Ctrl + F5`
- **Mac**: `Cmd + Shift + R` 或 `Cmd + Option + R`

### 🔍 方法 2：清除缓存并硬性重新加载
1. 打开开发者工具 (按 `F12` 或右键点击页面 → 检查)
2. 右键点击浏览器工具栏上的刷新按钮
3. 选择 **"清空缓存并硬性重新加载"** 或 **"Empty Cache and Hard Reload"**

### 🛠️ 方法 3：禁用缓存（开发时推荐）
1. 打开开发者工具 (按 `F12`)
2. 切换到 **Network** (网络) 标签
3. 勾选 **"Disable cache"** (禁用缓存)
4. **保持开发者工具打开**
5. 刷新页面 (`F5` 或点击刷新按钮)

### 🗑️ 方法 4：完全清除浏览器缓存
1. 打开浏览器设置
2. 找到隐私/清除数据选项
3. 选择清除缓存和 Cookie
4. 刷新页面

## 验证修复

刷新后，打开浏览器控制台 (F12 → Console)，你应该看到：

```
🤖 Calling Gemini API with model: gemini-1.5-flash
📡 API URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
```

如果仍然看到 `gemini-pro`，说明缓存还没有清除，请重复上述步骤。

## 已添加的保护措施

代码已经更新为：
1. ✅ 自动检测并替换 `gemini-pro` 为 `gemini-1.5-flash`
2. ✅ 添加版本号到 script 标签以强制刷新 (`?v=2`)
3. ✅ 显示明确的错误和警告信息

但浏览器缓存可能会阻止新代码加载，所以**必须清除缓存**！
