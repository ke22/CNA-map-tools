# 标记位置修复 - Zoom/Pan 时位置不准确问题

## 问题描述

当缩放（zoom）或平移（pan）地图时，标记位置变得不准确，标记会偏移实际坐标位置。

## 根本原因

1. **缺少 Anchor 设置**：Mapbox Marker 需要知道标记的哪个点应该对应地理坐标
2. **自定义元素样式**：自定义 HTML 元素的 CSS 可能干扰 Mapbox 的定位
3. **Transform 原点**：旋转和缩放的 transform-origin 设置不正确

## 修复内容

### 1. 添加 Anchor 点设置

**文件：** `js/app-enhanced.js`

为不同类型的标记形状设置正确的锚点：
- **Pin 形状**：使用 `'bottom'` anchor（尖点指向坐标）
- **其他形状**（circle, square, star）：使用 `'center'` anchor

```javascript
const anchor = getMarkerAnchor(markerShape);

const mapboxMarker = new mapboxgl.Marker({
    element: el,
    draggable: false,
    anchor: anchor  // 关键修复：设置锚点
})
```

### 2. 改进标记元素样式

**文件：** `js/utils/marker-icons-apple.js`

- 添加 `box-sizing: border-box`
- 设置明确的 `margin: 0` 和 `padding: 0`
- 确保 `display: block`
- 设置 `transform-origin: center center`

### 3. 添加 CSS 规则

**文件：** `css/styles-enhanced.css`

添加了 `.apple-marker` 样式规则，确保：
- 定位准确
- 不影响 Mapbox 的坐标计算
- 缩放时保持稳定

### 4. 创建 Anchor 辅助函数

**文件：** `js/utils/marker-icons-apple.js`

新增 `getMarkerAnchor()` 函数，根据标记形状返回正确的锚点：
- Pin: `'bottom'`
- Circle/Square/Star: `'center'`

## 测试建议

1. **添加标记**：在不同位置添加标记
2. **缩放测试**：大幅缩放地图（放大和缩小）
3. **平移测试**：拖动地图，观察标记是否保持在同一位置
4. **多种形状**：测试不同形状的标记（pin, circle, square, star）
5. **坐标验证**：点击标记查看坐标是否正确

## 预期结果

- ✅ 标记在任何缩放级别都保持准确位置
- ✅ 平移地图时标记位置不变
- ✅ 不同形状的标记都准确定位
- ✅ Pin 形状的尖点精确指向坐标位置

## 修复文件清单

- ✅ `js/app-enhanced.js` - 添加 anchor 设置（2处）
- ✅ `js/utils/marker-icons-apple.js` - 改进样式和添加 anchor 函数
- ✅ `css/styles-enhanced.css` - 添加标记样式规则

## 验证步骤

1. 打开地图
2. 添加一个标记
3. 记住标记的位置
4. 大幅缩放地图
5. 验证标记是否还在同一坐标位置
6. 平移地图
7. 验证标记是否跟随地图移动且保持准确

**修复完成！** ✅

