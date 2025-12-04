# 标记功能开发计划

## 功能概述
在地图上添加标记，支持：
1. **基于坐标添加**：输入经纬度坐标
2. **基于名称搜索**：搜索地点名称并添加标记

## 实现计划

### 1. UI 界面
- 添加"标记"标签页或区域
- 坐标输入表单（经度、纬度）
- 名称搜索输入框
- 标记列表显示
- 标记管理（删除、编辑）

### 2. 功能实现
- 使用 Mapbox Marker API 添加标记
- 使用 Mapbox Geocoding API 进行地点搜索
- 标记存储和管理
- 标记自定义（颜色、图标、标签）

### 3. 集成点
- 在侧边栏添加"标记"区域
- 标记与现有边界选择功能共存
- 标记可以导出到地图图片中

## 技术要点
- Mapbox Marker: `new mapboxgl.Marker()`
- Mapbox Geocoding API: `mapboxgl.geocodingClient`
- 标记存储：`appState.markers = []`

