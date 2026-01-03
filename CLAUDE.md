# CLAUDE.md - 项目开发规范

> 本文档是 AI 助手和开发团队的单一真相来源（Single Source of Truth）
> 每次新的工作阶段开始时会自动加载此文档

## 📋 项目概述

**项目名称**: Map Tool (Enhanced Version)  
**类型**: 基于 Mapbox GL JS 的客户端地图工具  
**主要功能**:
- 交互式地图浏览（支持多种地图样式）
- 国家/行政区选择和上色（使用 GADM 数据）
- 中文标签系统（三层格式：主要国家/邻近国/临海区域）
- AI 新闻分析（通过 Gemini API）
- 地图导出（PNG/JPG）
- 标记和标签拖拽功能

**技术栈**:
- Mapbox GL JS v2.15.0+
- Gemini API (通过代理服务器)
- Playwright (E2E 测试)
- Node.js (开发服务器)

---

## 🏗️ 架构决策 (ADR)

### 1. 使用 GADM 数据而非 Mapbox 默认边界
- **原因**: 更精确的行政边界，支持 Level 0 (国家) 和 Level 1 (州/省)
- **实现**: `data/gadm/optimized/` 目录存放优化后的 GeoJSON
- **注意**: 文件较大，需要优化处理（使用 mapshaper）

### 2. 中文标签三层格式系统
- **主要国家** (`labelType: 'main'`): 深灰色，白色光晕
- **邻近国家** (`labelType: 'adjacent'`): 灰色 (#888888)，无光晕
- **临海区域** (`labelType: 'sea'`): 深蓝色 (#003366)，无光晕
- **实现**: 使用 Mapbox 数据驱动样式 (`get` 表达式)

### 3. AI 功能通过代理服务器
- **原因**: 保护 API Key，避免前端暴露
- **实现**: `server-gemini-proxy.js` 作为中间层
- **注意**: 需要 `.env` 文件配置 `GEMINI_API_KEY`

### 4. 协议检测和错误处理
- **禁止**: 不允许通过 `file://` 协议直接打开
- **原因**: CORS 限制，资源加载失败
- **实现**: `app-enhanced.js` 启动时检测协议，显示错误页面

### 5. 边界查询回退机制
- **主要方法**: `map.queryRenderedFeatures()` (Mapbox 原生)
- **回退方法**: 自定义 point-in-polygon 测试
- **原因**: 某些缩放级别下 Mapbox 查询不准确

---

## 💻 代码风格

### JavaScript 规范

#### 命名约定
- **变量/函数**: `camelCase` (例如: `handleMapClick`, `updateLabelHighlight`)
- **常量**: `UPPER_SNAKE_CASE` (例如: `IS_DEV_MODE`, `MAX_RETRIES`)
- **文件**: `kebab-case.js` (例如: `app-enhanced.js`, `geo-extractor-agent.js`)
- **类/构造函数**: `PascalCase` (例如: `MapAgentOrchestrator`)

#### 代码组织
```javascript
// 1. 常量定义
const IS_DEV_MODE = true;
const DEFAULT_COLOR = '#0066CC';

// 2. 状态对象
const appState = { map: null, ... };
const selectState = { selectedLabelId: null, ... };

// 3. 工具函数
function debounce(func, wait) { ... }

// 4. 事件处理
function handleMapClick(e) { ... }

// 5. 初始化
document.addEventListener('DOMContentLoaded', () => { ... });
```

#### 注释要求
- **必须注释**: 复杂算法、业务逻辑、非直观的代码
- **推荐注释**: 函数参数说明、返回值说明
- **禁止**: 显而易见的代码注释（如 `// 设置变量 x = 1`）

#### 示例
```javascript
/**
 * 移动中文标签到新位置
 * @param {Object} lngLat - 目标坐标 {lng, lat}
 * @param {string} lngLat.lng - 经度
 * @param {string} lngLat.lat - 纬度
 */
function moveLabelTo(lngLat) {
    // 保留原始 labelType，确保移动后样式不变
    const originalLabelType = feature.properties.labelType;
    // ... 实现
}
```

### CSS 规范
- 使用语义化类名（例如: `.map-container`, `.label-controls`）
- 避免内联样式（特殊情况除外，如动态样式）
- 响应式设计使用媒体查询

### HTML 规范
- 语义化标签 (`<header>`, `<main>`, `<section>`)
- 可访问性: 适当的 `aria-label` 和 `role` 属性

---

## 🚫 禁止事项

### 安全相关
- ❌ **禁止**在前端代码中硬编码 API Key
- ❌ **禁止**提交 `.env` 文件到 Git
- ❌ **禁止**在生产环境使用 `console.log`（使用 `IS_DEV_MODE` 条件）

### 架构相关
- ❌ **禁止**直接修改 Mapbox 基础图层（使用自定义图层覆盖）
- ❌ **禁止**在 `file://` 协议下运行（必须使用 HTTP 服务器）
- ❌ **禁止**绕过协议检测

### 数据相关
- ❌ **禁止**直接修改 GADM 原始数据文件
- ❌ **禁止**在未优化的情况下加载大型 GeoJSON（>50MB）

### 代码质量
- ❌ **禁止**使用 `var`（使用 `const` 或 `let`）
- ❌ **禁止**未处理的 Promise（必须使用 `.catch()` 或 `try/catch`）
- ❌ **禁止**全局变量污染（使用命名空间或模块）

---

## ✅ 必须事项

### 开发环境
- ✅ 必须通过 HTTP 服务器运行（`npm start` 或 `node server-combined.js`）
- ✅ 必须配置 `.env` 文件（AI 功能需要）
- ✅ 必须使用现代浏览器（Chrome 90+, Firefox 88+, Safari 14+）

### 测试要求
- ✅ 所有新功能必须添加 Playwright 测试
- ✅ 测试文件放在 `tests/` 目录
- ✅ 运行测试: `npx playwright test`
- ✅ CI 环境: 使用 `process.env.CI` 检测

### 错误处理
- ✅ 所有异步操作必须有错误处理
- ✅ 网络请求必须有超时和重试机制
- ✅ 用户操作必须有反馈（loading 状态、错误提示）

### 性能优化
- ✅ 大型数据文件必须优化（使用 mapshaper）
- ✅ 事件处理必须防抖（`mousemove` 等高频事件）
- ✅ 图片资源使用 SVG 或优化后的格式

---

## 📁 文件结构

```
hkn/
├── index-enhanced.html      # 主 HTML 文件
├── config.js                # 配置文件（Mapbox Token）
├── server-combined.js       # 开发服务器（包含 AI 代理）
├── server-gemini-proxy.js   # Gemini API 代理
├── .env                     # 环境变量（不提交到 Git）
│
├── js/
│   ├── app-enhanced.js      # 主应用逻辑（核心文件）
│   ├── app-gadm.js          # GADM 数据加载
│   ├── agent/               # AI Agent 模块
│   │   ├── geo-extractor-agent.js      # 地理位置提取
│   │   ├── geo-resolver-agent.js       # 地理位置解析
│   │   ├── map-agent-orchestrator.js   # Agent 编排
│   │   └── ...
│   ├── features/            # 功能模块
│   │   ├── ai-assistant.js  # AI 助手 UI
│   │   └── ...
│   ├── services/            # 服务层
│   │   ├── gemini-service.js           # Gemini API 封装
│   │   └── gemini-service-cache.js     # 缓存层
│   └── utils/               # 工具函数
│
├── data/
│   └── gadm/
│       ├── optimized/      # 优化后的 GeoJSON（Level 0, 1）
│       └── tiles/          # 瓦片数据（如需要）
│
├── scripts/                 # 自动化脚本
│   ├── convert-gadm-410.js # GADM 4.1.0 转换
│   ├── optimize-gadm.sh    # GeoJSON 优化
│   └── ...
│
├── tests/                   # Playwright 测试
│   └── map-tool.spec.ts    # 主测试文件
│
└── .shared-context/         # 跨工作阶段共享上下文
    └── known-issues.md      # 已知问题和待办事项
```

---

## 🔧 开发工作流

### 本地开发
```bash
# 1. 启动开发服务器
npm start
# 或
node server-combined.js

# 2. 访问应用
http://localhost:3000/index-enhanced.html

# 3. 运行测试
npx playwright test

# 4. 查看测试报告
npx playwright show-report
```

### GADM 数据处理
```bash
# 转换 GADM 4.1.0 文件
node scripts/convert-gadm-410.js /path/to/gadm_410-levels.gpkg

# 或使用便捷脚本
./scripts/run-gadm-convert.sh
```

### 代码检查
- 使用浏览器开发者工具检查控制台错误
- 运行 Playwright 测试确保功能正常
- 检查网络请求（避免不必要的 API 调用）

---

## 🧪 测试策略

### E2E 测试 (Playwright)
- **位置**: `tests/map-tool.spec.ts`
- **覆盖范围**:
  - 地图初始化
  - 区域选择（国家/州）
  - 中文标签拖拽
  - AI 分析功能
  - 主要国家选择（中国、美国、日本等）

### 手动测试清单
- [ ] 所有地图类型加载正确
- [ ] GADM 数据正确加载
- [ ] 中文标签三层格式正确显示
- [ ] 标签拖拽后颜色保持不变
- [ ] AI 分析功能正常
- [ ] 导出功能生成正确图片

---

## 🐛 常见问题和解决方案

### 问题 1: CORS 错误
**原因**: 使用 `file://` 协议  
**解决**: 使用 HTTP 服务器运行

### 问题 2: GADM 数据未加载
**原因**: 文件路径错误或文件过大  
**解决**: 检查 `data/gadm/optimized/` 目录，确保文件存在且已优化

### 问题 3: 中文标签颜色不正确
**原因**: `labelType` 属性未正确设置  
**解决**: 检查 `updateCustomChineseLabels()` 函数，确保数据驱动样式正确

### 问题 4: AI 功能不可用
**原因**: `.env` 文件未配置或 API Key 无效  
**解决**: 检查 `GEMINI_API_KEY` 环境变量

---

## 📝 当前开发重点

### 正在进行
- ✅ GADM 4.1.0 数据处理和转换
- ✅ 中文标签三层格式实现
- ✅ 标签拖拽后颜色保持
- ✅ AI 新闻分析优化

### 待完成
- [ ] 进一步优化 GADM 文件大小
- [ ] 完善 Playwright 测试覆盖
- [ ] 性能优化（大数据集加载）

---

## 🔗 相关文档

- `SPECIFICATION.md` - 技术规范详细说明
- `SETUP_GUIDE.md` - 设置指南
- `GADM_410_说明.md` - GADM 4.1.0 处理说明
- `TROUBLESHOOTING.md` - 故障排除指南

---

## 📌 重要提醒

1. **每次修改代码前**: 检查是否符合本规范
2. **提交代码前**: 运行测试确保通过
3. **遇到问题**: 先查看 `.shared-context/known-issues.md`
4. **添加新功能**: 更新相关文档和测试

---

**最后更新**: 2024-12-19  
**维护者**: 开发团队

