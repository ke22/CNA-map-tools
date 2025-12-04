# 标记缩放位置修复

## 问题
使用 CSS transform scale 可能导致标记位置在缩放时偏移。

## 解决方案
改为直接修改元素的实际尺寸（width/height），而不是使用 transform scale。

### 关键改进
1. **直接尺寸修改**：使用 `element.style.width/height` 而不是 `transform: scale()`
2. **保持锚点准确**：直接尺寸修改不会影响 Mapbox 的锚点计算
3. **重新应用坐标**：在尺寸改变后重新设置坐标，确保位置准确

### 为什么这样更好？
- Mapbox Marker 的锚点计算基于元素的实际尺寸
- 使用 transform scale 可能导致锚点偏移
- 直接修改尺寸保持锚点计算准确

