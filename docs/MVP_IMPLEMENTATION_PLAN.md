# MVP Implementation Plan - Gen AI News Automation
## 阶段 1: 客户端概念验证 (1-2周)

## 📋 MVP 功能范围

### 核心功能
1. ✅ 新闻文本输入界面
2. ✅ Gemini API 集成（客户端，临时密钥）
3. ✅ 基础位置提取（国家/城市）
4. ✅ 结果预览面板
5. ✅ 手动应用到地图按钮

### 不包含的功能（Phase 2）
- ❌ 后端服务器
- ❌ 自动应用（保留手动审核）
- ❌ 智能颜色建议
- ❌ 结果编辑功能

## 🎯 实施步骤

### Step 1: UI 组件 (1-2小时)
**文件:** `index-enhanced.html`
- 在侧边栏添加新闻输入区域
- 添加"分析"按钮
- 添加加载指示器
- 添加结果预览面板

### Step 2: Gemini API 集成 (2-3小时)
**文件:** `js/services/gemini-service.js` (新建)
- 创建 Gemini API 调用函数
- 构建提示词模板
- JSON 响应解析

### Step 3: 位置提取逻辑 (1-2小时)
**文件:** `js/utils/ai-helpers.js` (新建)
- 解析 AI 返回的 JSON
- 验证位置数据
- 提取坐标信息

### Step 4: 应用到地图 (1-2小时)
**文件:** `js/app-enhanced.js`
- 创建 `applyAIResults()` 函数
- 调用现有的 `applyColorToArea()` 和 `addMarker()`
- 批量处理多个位置

### Step 5: 坐标解析 (1小时)
**文件:** `js/utils/location-resolver.js` (新建)
- 使用 Mapbox Geocoding API
- 将位置名称转换为坐标
- 处理未找到的位置

## 📁 文件结构

```
js/
  ├── app-enhanced.js (修改 - 添加 AI 功能)
  ├── services/
  │   └── gemini-service.js (新建)
  ├── utils/
  │   ├── ai-helpers.js (新建)
  │   └── location-resolver.js (新建)

index-enhanced.html (修改 - 添加 UI)
config.js (修改 - 添加 Gemini API key)
```

## 🔑 配置要求

### config.js 添加
```javascript
GEMINI: {
  API_KEY: 'YOUR_GEMINI_API_KEY', // 从 Google AI Studio 获取
  MODEL: 'gemini-pro',
  BASE_URL: 'https://generativelanguage.googleapis.com/v1beta'
}
```

## 📝 提示词模板

```javascript
const PROMPT_TEMPLATE = `
你是一个地理数据提取助手。分析新闻文本并提取：

1. 提到的地点（国家、城市、地区）
2. 如果提到明确的坐标，提取坐标
3. 每个地点的重要性（优先级 1-5）

返回 JSON 格式：
{
  "locations": [
    {
      "name": "台北",
      "type": "city",
      "country": "台湾",
      "coordinates": [121.5654, 25.0330],
      "priority": 1,
      "context": "主要事件发生地"
    }
  ],
  "areas": [
    {
      "name": "台湾",
      "type": "country",
      "priority": 1,
      "suggestedColor": "#007AFF"
    }
  ]
}

只返回 JSON，不要其他文字。
`;
```

## ✅ 测试清单

- [ ] UI 组件显示正常
- [ ] 可以粘贴新闻文本
- [ ] Gemini API 调用成功
- [ ] 位置提取准确
- [ ] 结果预览显示正确
- [ ] 可以手动应用到地图
- [ ] 坐标解析工作正常
- [ ] 错误处理正常

## 🚀 开始实施

让我开始实施 MVP 计划！



