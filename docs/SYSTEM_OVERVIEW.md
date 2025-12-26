# 地图系统功能与运作逻辑总结

## 系统概述

这是一个基于 Mapbox GL JS 的交互式地图应用，支持区域着色、标记放置、AI 分析等功能。系统采用统一的工作流程设计，提供直观的用户界面。

---

## 核心功能

### 1. 区域着色功能

#### 1.1 支持的区域类型
- **国家（Country）**：使用 Mapbox Boundaries 或 GADM 数据
- **行政区（Administration）**：
  - **州/省（State）**：第一级行政区
  - **市（City）**：第二级行政区

#### 1.2 着色方式
- **填充模式（Fill）**：填充整个区域（默认）
- **轮廓模式（Outline）**：仅显示区域边界线条

#### 1.3 数据源策略
- **优先使用 Mapbox Boundaries**（免费层，快速加载）
- **后备使用 GADM 数据**（GeoJSON 格式，用于详细行政区数据）
- **自动切换数据源**：根据选择的区域类型自动加载对应数据

### 2. 标记功能

#### 2.1 标记类型
- 支持多种标记形状（Pin、Circle、Square 等）
- 自定义标记颜色
- 标记名称显示

#### 2.2 标记定位
- **坐标锁定**：标记始终固定在指定地理坐标
- **自适应缩放**：标记大小随地图缩放级别自适应调整
- **位置稳定**：缩放、平移时标记位置不会偏移

### 3. 搜索功能

#### 3.1 统一搜索入口
- 单一搜索框支持多种输入类型
- **中文/英文地名搜索**
- **坐标搜索**（格式：`lat,lng` 或 `lng,lat`）
- **自动识别输入类型**

#### 3.2 搜索结果
- **区域结果**：国家、州/省、城市（用于着色）
- **标记结果**：地点、POI（用于放置标记）
- **智能排序**：根据当前工作模式优先显示相关结果
- **自动跳转**：选择结果后自动 flyTo 到目标位置

### 4. AI 分析功能

#### 4.1 新闻文本分析
- 使用 Gemini API 分析新闻文本
- **自动提取**：
  - 地理区域（国家、行政区、城市）
  - 地点坐标（用于标记）
- **批量应用**：一次性将分析结果应用到地图

#### 4.2 优化机制
- **缓存系统**：避免重复 API 调用
- **请求去重**：防止同时发送相同请求
- **速率限制**：控制 API 调用频率
- **错误处理**：友好的 429 错误提示

### 5. 工作模式

#### 5.1 区域模式（Area Mode）
- 用于选择和着色地理区域
- 子模式：
  - **国家模式**：选择和着色国家
  - **行政区模式**：选择和着色州/省或城市
- **边界样式选择**：填充或轮廓

#### 5.2 标记模式（Marker Mode）
- 用于在地图上放置标记
- **标记形状选择**
- **标记颜色选择**

---

## 系统架构

### 文件结构

```
js/
├── app-enhanced.js           # 核心地图逻辑（初始化、区域着色、标记管理）
├── ui/
│   └── unified-interface.js  # 统一界面逻辑（搜索、模式切换、内容列表）
├── features/
│   └── ai-assistant.js       # AI 分析功能
├── services/
│   ├── gemini-service.js     # Gemini API 服务
│   └── gemini-service-cache.js  # API 缓存管理
├── app-gadm.js              # GADM 数据加载
├── app-vector-tiles.js      # Mapbox 向量瓦片加载
└── utils/
    ├── country-codes.js     # 国家代码映射
    └── marker-icons-apple.js # 标记图标生成
```

### 核心组件

#### 1. 应用状态（appState）
```javascript
{
  map: MapboxGL.Map,              // Mapbox 地图实例
  currentAreaType: 'country',     // 当前区域类型（country/administration）
  currentColor: '#6CA7A1',        // 当前选择的颜色
  boundaryMode: 'fill',           // 边界样式（fill/outline）
  selectedAreas: [],              // 已选择的区域列表
  markers: [],                    // 标记列表
  sources: {},                    // 数据源状态
  markerMode: false,              // 标记模式开关
  overlayMode: false              // 叠加模式开关
}
```

#### 2. 统一界面状态（unifiedUI）
```javascript
{
  currentMode: 'area',            // 当前模式（area/marker）
  initialized: false,             // 初始化状态
  activeFilter: 'all'             // 内容列表过滤器（all/area/marker）
}
```

---

## 运作流程

### 区域着色流程

1. **用户输入搜索** → `handleUnifiedTextSearch()`
2. **调用搜索 API** → `searchAreasUnified()` 或 Mapbox Geocoding
3. **显示搜索结果** → 显示区域结果（国家/州/市）
4. **用户选择结果** → `handleUnifiedSearchResult(type='city'/'state'/'country')`
5. **切换数据源**（如需要）→ `switchAreaType('administration'/'country')`
6. **加载边界数据** → `loadBoundarySourceForType()`
7. **转换区域 ID** → Mapbox ID → GADM GID（如需要）
8. **flyTo 到位置** → 自动跳转到区域中心
9. **应用颜色** → `applyColorToArea()` → `createAreaLayer()`
10. **更新列表** → `updateUnifiedContentList()`

### 标记放置流程

1. **用户输入搜索** → `handleUnifiedTextSearch()` 或坐标输入
2. **调用搜索 API** → `searchPlacesForMarkers()` 或坐标解析
3. **显示搜索结果** → 显示标记结果（地点/POI）
4. **用户选择结果** → `handleUnifiedSearchResult(type='marker')`
5. **解析坐标** → 字符串或数组格式 → `[lng, lat]`
6. **flyTo 到位置** → 自动跳转到坐标（zoom: 12）
7. **添加标记** → `addMarker(coordinates, name, color, shape)`
8. **更新列表** → `updateUnifiedContentList()`

### 标记缩放自适应流程

1. **地图缩放事件** → `map.on('zoom')` 触发
2. **计算缩放比例** → `scaleFactor = 2^((zoom - 10) / 3)`
3. **更新标记大小** → 直接修改 `element.style.width/height`（不使用 transform: scale）
4. **锁定位置** → `marker.setLngLat(coordinates)` 在 `requestAnimationFrame` 中调用
5. **zoomend 事件** → 再次确保位置锁定

**关键设计**：
- **不使用 `transform: scale()`**：因为它不会改变元素的 layout 大小，导致 Mapbox anchor 计算错误
- **直接修改 width/height**：让 Mapbox 基于新的元素尺寸重新计算 anchor 位置
- **多时机锁定**：在 `zoom` 和 `zoomend` 事件中都调用 `setLngLat`

### ID 转换逻辑

#### 国家 ID 转换
1. **Mapbox 格式**：`country.8935` → 通过名称查找 → ISO 3166-1 alpha-3（如 `TWN`）
2. **查找策略**：
   - 直接匹配 `COUNTRY_CODES` 中的名称（中文/英文）
   - 简繁中文转换（"台湾" → "台灣"）
   - 调用 `findAreaIdByName()` 异步查找

#### 行政区 ID 转换（GADM）
1. **Mapbox 格式**：`TW_place.3057895` 或 `TW_region.58599`
2. **转换方法**：
   - flyTo 到坐标
   - 使用 `queryRenderedFeatures()` 在 `visible-boundaries` 图层查询
   - 提取 GADM GID（`GID_1` 用于 state，`GID_2` 用于 city）
3. **Fallback 机制**：
   - 如果图层不存在 → 使用 `querySourceFeatures()` 直接查询 source
   - 计算距离找到最近的 feature

---

## 用户界面设计

### 统一工作流程

#### 搜索区域
- 单个搜索框支持所有类型的搜索
- 根据当前模式智能排序结果
- 选择结果后直接执行操作（着色/标记）

#### 模式切换
- **区域模式** ↔ **标记模式**
- 切换时保留已添加的内容（区域和标记同时显示）

#### 内容列表
- 统一显示所有内容（区域 + 标记）
- 过滤器：全部 / 仅区域 / 仅标记
- 支持修改颜色、删除操作

### 样式工具

#### 颜色选择器
- 颜色输入框（Hex 格式）
- 预设颜色板
- 实时预览

#### 边界样式
- 填充按钮 / 轮廓按钮
- 切换时自动更新所有已着色区域

#### 标记形状
- 多种形状选择（Pin、Circle、Square 等）
- 仅在标记模式下显示

---

## 技术特点

### 1. 数据源管理
- **混合策略**：Mapbox Boundaries（快速） + GADM（详细）
- **按需加载**：仅在需要时加载数据源
- **状态缓存**：避免重复加载相同数据源
- **错误处理**：优雅处理"Source already exists"错误

### 2. 性能优化
- **图层管理**：按需创建和移除图层
- **事件节流**：缩放事件使用合适的更新频率
- **缓存机制**：API 响应缓存、请求去重

### 3. 用户体验
- **即时反馈**：操作后立即显示结果
- **自动跳转**：搜索后自动 flyTo 到位置
- **智能识别**：自动识别坐标、地名输入
- **模式感知**：根据模式调整搜索结果优先级

### 4. 错误处理
- **ID 转换失败**：多层 fallback 机制
- **数据源加载失败**：提示用户并提供备选方案
- **API 限制**：友好的 429 错误提示和重试建议

---

## 数据流

### 区域数据流
```
用户搜索 → Mapbox Geocoding API / COUNTRY_CODES
    ↓
搜索结果（Mapbox ID）
    ↓
ID 转换（如需要）→ ISO 3166-1 alpha-3 / GADM GID
    ↓
加载数据源 → Mapbox Boundaries / GADM GeoJSON
    ↓
创建图层 → Mapbox GL Layer (fill/line)
    ↓
应用颜色 → Paint Properties
```

### 标记数据流
```
用户搜索 → Mapbox Geocoding API / 坐标解析
    ↓
提取坐标 → [lng, lat]
    ↓
创建标记元素 → HTML Element
    ↓
创建 Mapbox Marker → Marker.setLngLat(coordinates)
    ↓
添加到地图 → Marker.addTo(map)
```

---

## 关键设计决策

### 1. 不使用 transform: scale() 缩放标记
**原因**：CSS transform 不改变元素的 layout 大小，导致 Mapbox anchor 计算错误

**解决方案**：直接修改 `width` 和 `height`，让 Mapbox 基于新尺寸重新计算位置

### 2. 统一搜索入口
**原因**：简化用户界面，减少认知负担

**实现**：单一搜索框 + 智能结果排序 + 自动执行操作

### 3. 静默切换数据源
**原因**：搜索不同类型区域时需要不同数据源，但不希望频繁切换 UI 状态

**实现**：搜索时自动切换 `appState.currentAreaType`，必要时调用 `switchAreaType()`

### 4. 多层 ID 转换 Fallback
**原因**：不同数据源使用不同的 ID 格式，需要可靠转换

**实现**：`queryRenderedFeatures` → `querySourceFeatures` → 距离计算

---

## 未来扩展方向

1. **导出功能**：导出地图为图片或 GeoJSON
2. **分享功能**：生成分享链接，包含当前地图状态
3. **历史记录**：保存和恢复地图状态
4. **批量操作**：批量修改区域颜色、删除标记等
5. **自定义样式**：更多边界样式选项
6. **数据导入**：支持导入 CSV/GeoJSON 数据

---

## 依赖项

- **Mapbox GL JS**：地图渲染
- **Mapbox Geocoding API**：地点搜索
- **Gemini API**：AI 文本分析
- **GADM Data**：详细行政区数据（可选）

---

*最后更新：2024年*


