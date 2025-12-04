# Apple 风格标记系统实施计划

## 用户需求
1. ✅ 移除 Quick Add 预设标记列表
2. ✅ 图标改为 Apple 风格，可以选择颜色
3. ✅ 点击标记可以更改图标

## 实施方案

### 1. 移除 Quick Add
- ✅ HTML 中已移除
- ⏳ 移除 setupPresetMarkers 函数调用
- ⏳ 移除 preset-markers.js 引用

### 2. Apple 风格图标系统
- ✅ 创建 marker-icons-apple.js
- ⏳ 更新图标选择器 UI（颜色和形状选择）
- ⏳ 更新 addMarker 函数使用 Apple 风格

### 3. 点击标记更改图标
- ⏳ 添加标记点击事件处理
- ⏳ 创建图标选择弹窗
- ⏳ 实现图标/颜色更改逻辑

## 实施步骤

### 步骤 1: 移除 Quick Add 相关代码
1. 移除 setupPresetMarkers 调用
2. 移除 preset-markers.js 引用

### 步骤 2: 创建 Apple 风格图标选择器
1. 颜色选择器（Apple 标准颜色）
2. 形状选择器（Pin, Circle）
3. 更新侧边栏 UI

### 步骤 3: 实现点击标记更改功能
1. 为标记添加点击事件
2. 显示图标/颜色选择弹窗
3. 更新标记样式

### 步骤 4: 更新标记创建逻辑
1. 使用 Apple 风格图标
2. 支持颜色和形状参数
3. 保存图标信息

## Apple 颜色方案

```javascript
const APPLE_COLORS = {
    red: '#FF3B30',
    orange: '#FF9500',
    yellow: '#FFCC00',
    green: '#34C759',
    teal: '#5AC8FA',
    blue: '#007AFF',      // 默认
    indigo: '#5856D6',
    purple: '#AF52DE',
    pink: '#FF2D55',
    gray: '#8E8E93'
};
```

## 标记形状

- Pin（图钉）- 默认
- Circle（圆形）

