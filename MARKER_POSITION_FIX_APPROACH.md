# 标记位置修复方案

## 问题
标记在缩放时位置不准确（same problem）

## 当前状态

✅ 已完成：
- Anchor 点设置（pin = bottom）
- 位置修复代码
- 缩放功能（已暂时禁用）

## 诊断步骤

请告诉我：
1. **标记是否在缩放后位置偏移？**
   - 如果是，偏移多少？
   - 偏移方向（上/下/左/右）？

2. **不同缩放级别的问题：**
   - Zoom out（缩小）时是否偏移更多？
   - Zoom in（放大）时是否偏移更多？

3. **不同标记形状的问题：**
   - Pin 形状是否比其他形状更明显？
   - Circle/Square/Star 是否有同样问题？

## 可能的修复方案

### 方案 1: 调整 Anchor 点
如果标记向下偏移，可能 anchor 应该用 'center'
如果标记向上偏移，可能需要使用 offset

### 方案 2: 使用 Offset
```javascript
new mapboxgl.Marker({
    element: el,
    anchor: 'bottom',
    offset: [0, -10] // 微调位置
})
```

### 方案 3: 重新计算 Pin 形状
Pin 旋转 -45 度后，尖点的实际位置可能需要特殊处理

请提供具体信息以便精确修复！
