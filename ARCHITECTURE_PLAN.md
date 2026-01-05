# 模块化架构重构计划

## 当前架构分析

### 现有文件结构
```
js/
├── app-enhanced.js          # 主应用文件（8570+ 行，包含所有功能）
├── app-gadm.js              # GADM 数据加载
├── features/
│   ├── ai-assistant.js      # AI 助手功能
│   └── image-overlay.js     # 图片覆盖层
├── services/
│   ├── gemini-service.js    # Gemini API 服务
│   └── gemini-service-cache.js
├── agent/                   # AI Agent 架构
├── ui/
│   └── unified-interface.js # UI 接口
└── utils/                   # 工具函数
```

### 问题
- `app-enhanced.js` 过于庞大（8570+ 行），包含所有功能
- 职责不清晰，难以维护
- 模块间耦合度高
- 难以测试和复用

## 目标架构

### 模块化设计原则
1. **单一职责原则**：每个模块只负责一个功能
2. **依赖注入**：通过接口而非直接依赖
3. **事件驱动**：使用事件系统解耦模块
4. **可测试性**：每个模块可独立测试

## 建议的模块结构

```
js/
├── core/                    # 核心模块
│   ├── MapCore.js          # 地图核心功能
│   ├── StateManager.js     # 状态管理
│   └── EventBus.js         # 事件总线
│
├── modules/                 # 功能模块
│   ├── boundary/            # 边界相关
│   │   ├── BoundaryLoader.js
│   │   ├── BoundaryRenderer.js
│   │   └── BoundarySelector.js
│   │
│   ├── labels/              # 标签相关
│   │   ├── LabelManager.js
│   │   └── LabelRenderer.js
│   │
│   ├── markers/             # 标记相关
│   │   ├── MarkerManager.js
│   │   └── MarkerRenderer.js
│   │
│   ├── ai/                  # AI 相关
│   │   ├── AIService.js
│   │   └── AIResultProcessor.js
│   │
│   └── data/                # 数据相关
│       ├── GADMLoader.js
│       ├── MapboxLoader.js
│       └── DataValidator.js
│
├── services/                # 外部服务
│   ├── GeminiService.js
│   └── MapboxService.js
│
├── ui/                      # UI 组件
│   ├── ControlPanel.js
│   ├── Toolbar.js
│   └── Dialog.js
│
├── utils/                   # 工具函数
│   ├── logger.js
│   ├── validators.js
│   └── helpers.js
│
└── app.js                   # 应用入口（组装所有模块）
```

## 重构步骤

### Phase 0: 创建目录结构 ✅
- [x] 创建核心模块目录 (`js/core/`)
- [x] 创建功能模块目录 (`js/modules/`)
- [x] 创建 UI 组件目录 (`js/ui/components/`)

### Phase 1: 核心基础设施
- [ ] 创建 EventBus（事件总线）
- [ ] 创建 StateManager（状态管理）
- [ ] 创建 MapCore（地图核心）

### Phase 2: 数据层模块化
- [ ] 提取 GADM 加载逻辑 → `modules/data/GADMLoader.js`
- [ ] 提取 Mapbox 加载逻辑 → `modules/data/MapboxLoader.js`
- [ ] 创建数据加载器接口

### Phase 3: 边界模块化
- [ ] 提取边界加载逻辑 → `modules/boundary/BoundaryLoader.js`
- [ ] 提取边界渲染逻辑 → `modules/boundary/BoundaryRenderer.js`
- [ ] 提取边界选择逻辑 → `modules/boundary/BoundarySelector.js`

### Phase 4: 标签模块化
- [ ] 提取标签管理逻辑 → `modules/labels/LabelManager.js`
- [ ] 提取标签渲染逻辑 → `modules/labels/LabelRenderer.js`

### Phase 5: 标记模块化
- [ ] 提取标记管理逻辑 → `modules/markers/MarkerManager.js`
- [ ] 提取标记渲染逻辑 → `modules/markers/MarkerRenderer.js`

### Phase 6: AI 模块化
- [ ] 重构 AI 服务 → `modules/ai/AIService.js`
- [ ] 提取结果处理逻辑 → `modules/ai/AIResultProcessor.js`

### Phase 7: UI 模块化
- [ ] 提取控制面板 → `ui/ControlPanel.js`
- [ ] 提取工具栏 → `ui/Toolbar.js`

### Phase 8: 应用组装
- [ ] 创建新的 `app.js` 入口文件
- [ ] 组装所有模块
- [ ] 迁移现有功能

## 模块接口设计

### EventBus（事件总线）
```javascript
class EventBus {
  on(event, callback)
  off(event, callback)
  emit(event, data)
  once(event, callback)
}
```

### StateManager（状态管理）
```javascript
class StateManager {
  getState()
  setState(updates)
  subscribe(callback)
  unsubscribe(callback)
}
```

### BoundaryLoader（边界加载器）
```javascript
class BoundaryLoader {
  async load(type, options)
  async loadGADM(type)
  async loadMapbox(type)
  on(event, callback)
}
```

### LabelManager（标签管理）
```javascript
class LabelManager {
  addLabel(config)
  updateLabel(id, config)
  removeLabel(id)
  updateAllLabels()
  on(event, callback)
}
```

## 迁移策略

1. **渐进式重构**：逐步提取模块，保持现有功能可用
2. **向后兼容**：在重构过程中保持 API 兼容
3. **测试驱动**：为每个模块编写测试
4. **文档先行**：先定义接口，再实现

## 下一步行动

1. 创建核心基础设施（EventBus, StateManager）
2. 从最简单的模块开始（如 Logger）
3. 逐步迁移功能模块
4. 保持现有功能可用

