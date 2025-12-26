# 完整标记系统更新方案

## 用户需求
1. ✅ 移除 Quick Add
2. ⏳ 图标改为 Apple 风格，可以选择颜色
3. ⏳ 点击标记可以更改图标

## 完整实施步骤

这是一个完整的功能重构，需要以下改动：

### 1. 移除 Quick Add ✅
- HTML 已移除
- preset-markers.js 已删除
- ⏳ 移除 setupPresetMarkers 函数

### 2. Apple 风格图标系统
- ✅ marker-icons-apple.js 已创建
- ✅ setupMarkerIconSelector 已更新为颜色选择器
- ⏳ 更新 addMarker 使用 Apple 风格图标
- ⏳ 更新标记存储（color, shape）

### 3. 点击标记更改图标
- ⏳ 为标记添加点击事件（阻止 popup）
- ⏳ 创建图标/颜色选择弹窗
- ⏳ 实现更新标记图标/颜色的功能

## 关键改动点

### addMarker 函数
需要改为：
- 使用 createAppleMarker 创建图标
- 存储 color 和 shape
- 添加点击事件处理

### 标记点击处理
- 检测点击事件
- 显示选择弹窗
- 更新标记样式

这是一个较大的改动，需要仔细实施以确保不破坏现有功能。



