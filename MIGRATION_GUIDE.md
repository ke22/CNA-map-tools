# 模块化迁移指南

## Phase 0: 目录结构 ✅

已完成目录结构创建：
- `js/core/` - 核心模块
- `js/modules/` - 功能模块
- `js/ui/components/` - UI 组件

## Phase 1: 统一 Logger 使用

### 当前状态
- 已有 `js/utils/debug.js` 提供 Logger 功能
- `app-enhanced.js` 中有 351 处 `console.log` 调用
- 需要统一使用新的 `js/core/Logger.js`

### 迁移步骤

1. **使用新的 Logger 模块**
   ```javascript
   // 旧方式
   console.log('Message');
   console.warn('Warning');
   console.error('Error');
   
   // 新方式
   import { Logger } from './core/Logger.js';
   Logger.info('Message');
   Logger.warn('Warning');
   Logger.error('Error');
   ```

2. **替换优先级**
   - 高优先级：错误和警告（`console.error`, `console.warn`）
   - 中优先级：信息日志（`console.log`）
   - 低优先级：调试日志（可保留 `console.log` 用于临时调试）

3. **迁移策略**
   - 逐步替换，不一次性全部替换
   - 先替换关键路径的日志
   - 保持向后兼容

### 替换示例

```javascript
// 替换前
console.log('✅ Map loaded successfully');
console.warn('⚠️ Warning: Data not available');
console.error('❌ Error loading data:', error);

// 替换后
Logger.success('Map loaded successfully');
Logger.warn('Warning: Data not available');
Logger.error('Error loading data', error);
```

## Phase 2: 模块化简单功能

### 候选功能
1. **标记图标管理** (`js/utils/marker-icons-apple.js`)
   - 相对独立
   - 功能明确
   - 易于测试

2. **工具函数** (`js/utils/`)
   - 已相对模块化
   - 只需整理和优化

## Phase 3: 建立核心基础设施

### EventBus
事件总线，用于模块间通信。

### StateManager
状态管理器，统一管理应用状态。

### MapCore
地图核心功能封装。

## 注意事项

1. **向后兼容**：保持现有 API 可用
2. **渐进式迁移**：逐步迁移，不破坏现有功能
3. **测试**：为每个模块编写测试
4. **文档**：更新相关文档

