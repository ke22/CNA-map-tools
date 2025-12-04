# 标记跑位问题深度分析

## 问题描述
标记在缩放时会跑位，不再锁定在原始坐标上。

## 根本原因分析

### 1. Mapbox Marker 定位机制
- Mapbox Marker 使用 `anchor` 点（如 'bottom', 'center'）来定位
- `anchor` 点定义了标记的哪个部分应该对准坐标点
- 例如：`anchor: 'bottom'` 表示标记的底部中心点应该对准坐标

### 2. CSS Transform Scale 的影响
- 我们使用 `transform: scale()` 来缩放标记
- `transform-origin` 设置为 `'center center'`
- 缩放会改变元素的可视尺寸，但不改变元素的布局尺寸

### 3. 冲突机制
问题在于：
1. Mapbox 在**初始创建时**计算 anchor 点位置（基于原始元素尺寸）
2. 当应用 CSS `transform: scale()` 时，元素的**可视尺寸**改变了
3. 但 Mapbox **不知道**元素被缩放了，它仍然使用原始的 anchor 点位置
4. 如果 `transform-origin` 是 `'center center'`，缩放从中心向外扩展
5. 如果 `anchor` 是 `'bottom'`，Mapbox 期望底部中心点在坐标上
6. **但缩放后，视觉上的底部中心点可能偏移了**

### 4. 具体问题场景

#### Pin 形状标记（anchor: 'bottom'）
- 原始元素：24px × 24px 的正方形，旋转 -45deg
- Anchor: 'bottom' - Mapbox 将底部中心点（12px, 24px）对准坐标
- 缩放 2x 后：
  - 元素可视尺寸：48px × 48px
  - 但布局尺寸仍然是：24px × 24px
  - Mapbox 仍然认为 anchor 点在 (12px, 24px)
  - 但视觉上，底部中心点已经移到了 (24px, 48px) 的位置
  - **结果：标记向上偏移了**

#### 其他形状（anchor: 'center'）
- Anchor: 'center' - Mapbox 将中心点对准坐标
- 缩放后，中心点位置**理论上**应该不变（如果 transform-origin 是 center）
- **但实际中仍然可能偏移**，因为：
  - 缩放计算可能有精度误差
  - 浏览器的渲染机制
  - Mapbox 的位置更新时机

## 解决方案

### 方案 1：不使用 Transform Scale，改用实际尺寸（推荐）
优点：
- 标记的实际尺寸改变，Mapbox 可以正确计算 anchor 点
- 不会产生位置偏移

缺点：
- 需要重新创建标记元素
- 性能可能稍差

### 方案 2：调整 Transform Origin 匹配 Anchor 点
- 如果 anchor 是 'bottom'，transform-origin 也应该是 'bottom center'
- 这样缩放时，anchor 点位置保持不变

缺点：
- 只对 'bottom' 和 'center' 有效
- 对于旋转后的元素，计算更复杂

### 方案 3：缩放后重新计算并调整位置
- 计算缩放导致的偏移量
- 调整坐标补偿偏移

缺点：
- 计算复杂
- 可能有精度误差

### 方案 4：禁用缩放（最简单）
- 标记保持固定尺寸
- 最简单可靠

## 推荐实现：方案 1 + 方案 4 结合
1. **不缩放标记尺寸**（保持固定尺寸）
2. 或者**改用实际尺寸缩放**（不使用 transform）

