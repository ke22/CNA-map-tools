# 四种样式的 Map Sky 背景信息

## Map Sky 说明
Map Sky 是指在 Globe 投影（地球球体视图）时，地球后面的背景区域。在 Mapbox GL JS 中，这通过 `background` 类型的图层来控制。

---

## 1. Streets (Standard) - `mapbox://styles/mapbox/streets-v12`

- **样式名称**: Streets / Standard
- **Mapbox 样式 ID**: `streets-v12`
- **Map Sky 背景色**: `#f5f5f5` (浅灰色)
- **描述**: 标准的浅灰色背景，适合大多数使用场景
- **背景类型**: Background Layer
- **适用场景**: 通用地图，需要清晰易读的场景

---

## 2. Light - `mapbox://styles/mapbox/light-v11`

- **样式名称**: Light
- **Mapbox 样式 ID**: `light-v11`
- **Map Sky 背景色**: `#ffffff` 或 `#f8f9fa` (白色/极浅灰色)
- **描述**: 非常浅的背景，适合需要清晰、简洁的地图
- **背景类型**: Background Layer
- **适用场景**: 需要明亮、干净外观的地图

---

## 3. Dark - `mapbox://styles/mapbox/dark-v11`

- **样式名称**: Dark
- **Mapbox 样式 ID**: `dark-v11`
- **Map Sky 背景色**: `#1a1a1a` 或 `#0a0a0a` (深灰色/接近黑色)
- **描述**: 深色背景，适合夜间模式或暗色主题
- **背景类型**: Background Layer
- **适用场景**: 夜间模式、暗色主题、减少眼睛疲劳的场景

---

## 4. Satellite - `mapbox://styles/mapbox/satellite-v9`

- **样式名称**: Satellite
- **Mapbox 样式 ID**: `satellite-v9`
- **Map Sky 背景色**: `#000000` 或 `#0a0a0a` (黑色/深色)
- **描述**: 黑色背景，模拟太空效果，适合卫星图像
- **背景类型**: Background Layer
- **适用场景**: 卫星图像、模拟太空效果、高对比度场景

---

## 技术实现

在代码中控制 Map Sky 背景的方式：

```javascript
// 添加背景图层
map.addLayer({
    id: 'background',
    type: 'background',
    paint: {
        'background-color': '#f5f5f5'  // 背景颜色
    }
});

// 更新背景颜色
map.setPaintProperty('background', 'background-color', '#f5f5f5');

// 获取当前背景颜色
const style = map.getStyle();
const bgLayer = style.layers.find(l => l.id === 'background');
const bgColor = bgLayer?.paint?.['background-color'];
```

---

## 当前配置状态

- ✅ **所有 4 种样式都模拟太空效果**
- ✅ 所有样式使用统一的深色太空背景 `#0a0a0a`
- ✅ Globe 投影启用，显示地球球体在太空中的效果
- ✅ 地球看起来像在太空中，无论切换到哪个样式

---

## 注意事项

1. **Globe 投影**: 只有在启用 Globe 投影时，Map Sky 背景才会明显可见
2. **缩放级别**: 在全球视图（zoom level 1-3）时，背景效果最明显
3. **样式切换**: 切换样式时，背景会自动跟随样式变化
4. **自定义背景**: 如果需要自定义，可以添加或修改 `background` 图层

