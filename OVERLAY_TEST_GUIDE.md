# Overlay 功能测试指南

## 📋 准备工作

### 1. 启动本地服务器

由于需要加载本地数据文件，必须通过 HTTP 服务器访问（不能直接用 `file://` 打开）。

#### 方法 A: 使用 Python（推荐）

```bash
cd /Users/yulincho/Documents/GitHub/map
python3 -m http.server 8000
```

然后访问：`http://localhost:8000/index-enhanced.html`

#### 方法 B: 使用提供的脚本

```bash
cd /Users/yulincho/Documents/GitHub/map
./start-server.sh
```

#### 方法 C: 使用 Node.js

如果有 `server.js`：
```bash
node server.js
```

---

## 🧪 测试步骤

### 测试 1: 基本 Overlay 功能

#### 步骤：

1. **打开页面**
   - 访问 `http://localhost:8000/index-enhanced.html`
   - 等待地图加载完成

2. **切换到行政區模式**
   - 在左侧面板，点击"行政區"按钮
   - 应该看到"疊加模式"开关出现

3. **启用疊加模式**
   - ✅ 勾选"疊加模式"复选框
   - ✅ 提示文字应变为："啟用後：先選國家（底層），再選行政區（疊加上層）"

4. **选择国家**
   - 点击地图上的台湾（或其他国家）
   - ✅ 国家应该被着色（例如：#6CA7A1）
   - ✅ 透明度应该较低（0.6，看起来较淡）
   - ✅ 控制台应显示：`✅ Created color layer: area-country-TWN`

5. **选择行政區**
   - 更改颜色（选择不同的颜色）
   - 点击台湾内的某个城市（例如：台北）
   - ✅ 行政区应该被着色
   - ✅ 透明度应该较高（0.85，看起来更明显）
   - ✅ 行政区颜色应该**疊加**在国家颜色之上

#### 预期结果：

- ✅ 国家图层在下方（较淡）
- ✅ 行政区图层在上方（较明显）
- ✅ 可以看到两种颜色叠加的效果
- ✅ 行政区区域比国家区域更不透明

---

### 测试 2: 图层顺序验证

#### 步骤：

1. **打开浏览器开发者工具**
   - 按 `F12` 或 `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)

2. **查看控制台日志**
   - 切换到 Console 标签
   - 观察图层创建的日志

3. **检查图层顺序**
   ```javascript
   // 在控制台运行：
   const map = appState.map;
   const layers = map.getStyle().layers;
   
   // 查找相关图层
   const countryLayer = layers.find(l => l.id.includes('area-country'));
   const adminLayer = layers.find(l => l.id.includes('area-state') || l.id.includes('area-city'));
   
   // 检查图层顺序
   const countryIndex = layers.indexOf(countryLayer);
   const adminIndex = layers.indexOf(adminLayer);
   
   console.log('Country layer index:', countryIndex);
   console.log('Admin layer index:', adminIndex);
   console.log('Admin should be AFTER country:', adminIndex > countryIndex);
   ```

#### 预期结果：

- ✅ Admin 图层的索引应该大于 Country 图层
- ✅ 控制台日志显示："inserted before ..."

---

### 测试 3: 透明度验证

#### 步骤：

1. **选择国家**
   - 选择台湾，使用颜色 #6CA7A1

2. **检查图层属性**
   ```javascript
   // 在控制台运行：
   const map = appState.map;
   const countryLayerId = 'area-country-TWN'; // 根据实际情况修改
   
   if (map.getLayer(countryLayerId)) {
       const opacity = map.getPaintProperty(countryLayerId, 'fill-opacity');
       console.log('Country opacity:', opacity);
       console.log('Expected: 0.6');
       console.log('Match:', opacity === 0.6);
   }
   ```

3. **选择行政區**
   - 选择台北市，使用颜色 #E05C5A

4. **检查行政區透明度**
   ```javascript
   // 在控制台运行：
   const adminLayerId = 'area-city-XXX'; // 根据实际情况修改
   
   if (map.getLayer(adminLayerId)) {
       const opacity = map.getPaintProperty(adminLayerId, 'fill-opacity');
       console.log('Admin opacity:', opacity);
       console.log('Expected: 0.85');
       console.log('Match:', opacity === 0.85);
   }
   ```

#### 预期结果：

- ✅ 国家透明度 = 0.6
- ✅ 行政区透明度 = 0.85

---

### 测试 4: 切换模式

#### 步骤：

1. **启用疊加模式**
   - 勾选"疊加模式"

2. **选择国家和行政区**

3. **关闭疊加模式**
   - 取消勾选"疊加模式"
   - ✅ 所有图层应该重新创建（控制台会显示日志）
   - ✅ 图层应该恢复标准模式

4. **切换回国家模式**
   - 点击"国家"按钮
   - ✅ "疊加模式"开关应该消失
   - ✅ overlayMode 应该自动重置为 false

#### 预期结果：

- ✅ 模式切换正常工作
- ✅ UI 正确显示/隐藏
- ✅ 状态正确重置

---

### 测试 5: 图层跟踪

#### 步骤：

1. **启用疊加模式**

2. **选择多个区域**
   - 选择一个国家
   - 选择多个行政区

3. **检查跟踪数组**
   ```javascript
   // 在控制台运行：
   console.log('Country layers:', appState.countryLayerIds);
   console.log('Admin layers:', appState.adminLayerIds);
   ```

#### 预期结果：

- ✅ countryLayerIds 包含所有国家图层 ID
- ✅ adminLayerIds 包含所有行政区图层 ID
- ✅ 没有重复的 ID

---

### 测试 6: 取消选择

#### 步骤：

1. **选择区域**
   - 选择国家和行政区

2. **取消选择国家**
   - 再次点击国家
   - ✅ 国家图层应该被移除
   - ✅ 从 countryLayerIds 中移除

3. **取消选择行政区**
   - 再次点击行政区
   - ✅ 行政区图层应该被移除
   - ✅ 从 adminLayerIds 中移除

#### 预期结果：

- ✅ 图层正确移除
- ✅ 跟踪数组正确更新

---

## 🔍 调试方法

### 1. 检查控制台日志

打开开发者工具，查看控制台输出：

```
✅ 正常日志：
- ✅ Created color layer: area-country-TWN (inserted before ...)
- ✅ Created color layer: area-city-XXX
- 🔄 Overlay mode: ON
- 📋 Using feature from source: gadm-country

❌ 错误日志：
- ❌ Error creating layer...
- ⚠️ Source not loaded...
```

### 2. 检查图层列表

```javascript
// 在控制台运行：
const map = appState.map;
const layers = map.getStyle().layers.map(l => ({
    id: l.id,
    type: l.type,
    source: l.source
}));

console.table(layers.filter(l => 
    l.id.includes('area-') || 
    l.id.includes('visible-boundaries')
));
```

### 3. 检查状态

```javascript
// 在控制台运行：
console.log('Current state:', {
    overlayMode: appState.overlayMode,
    currentAreaType: appState.currentAreaType,
    selectedCountry: appState.selectedCountry,
    countryLayerIds: appState.countryLayerIds,
    adminLayerIds: appState.adminLayerIds,
    selectedAreas: appState.selectedAreas
});
```

### 4. 可视化检查图层顺序

```javascript
// 在控制台运行此函数来可视化图层顺序：
function visualizeLayerOrder() {
    const map = appState.map;
    const layers = map.getStyle().layers;
    
    console.log('\n=== Layer Stack (Bottom to Top) ===\n');
    
    layers.forEach((layer, index) => {
        const isCountry = layer.id.includes('area-country');
        const isAdmin = layer.id.includes('area-state') || layer.id.includes('area-city');
        const isBoundary = layer.id.includes('visible-boundaries');
        const isLabel = appState.labelLayerIds.includes(layer.id);
        
        let marker = '';
        if (isCountry) marker = '🏛️  COUNTRY';
        else if (isAdmin) marker = '📍 ADMIN';
        else if (isBoundary) marker = '📐 BOUNDARY';
        else if (isLabel) marker = '🏷️  LABEL';
        
        if (isCountry || isAdmin || isBoundary || isLabel) {
            console.log(`${index.toString().padStart(3, ' ')}. ${marker} ${layer.id}`);
        }
    });
    
    console.log('\n=== Expected Order ===');
    console.log('1. Base Map');
    console.log('2. Visible Boundaries');
    console.log('3. Country Layers (if overlay mode)');
    console.log('4. Admin Layers (if overlay mode)');
    console.log('5. Labels');
}

// 运行函数
visualizeLayerOrder();
```

---

## ✅ 测试检查清单

- [ ] 可以切换到"行政區"模式
- [ ] "疊加模式"开关显示/隐藏正确
- [ ] 可以启用/关闭疊加模式
- [ ] 选择国家时，图层创建成功
- [ ] 国家图层透明度为 0.6
- [ ] 选择行政区时，图层创建成功
- [ ] 行政区图层透明度为 0.85
- [ ] 行政区图层在国家图层之上
- [ ] 可以看到叠加效果（两种颜色）
- [ ] 图层 ID 正确跟踪
- [ ] 取消选择时，图层正确移除
- [ ] 切换模式时，状态正确重置
- [ ] 控制台没有错误信息

---

## 🐛 常见问题

### 问题 1: "疊加模式"开关不显示

**可能原因**：
- 没有切换到"行政區"模式
- HTML 元素 ID 不匹配

**解决方法**：
```javascript
// 检查元素是否存在
console.log(document.getElementById('overlay-toggle-group'));
console.log(appState.currentAreaType); // 应该是 'administration'
```

### 问题 2: 图层顺序不正确

**可能原因**：
- labelLayerIds 没有正确缓存
- getInsertionPoint 函数返回 undefined

**解决方法**：
```javascript
// 检查 labelLayerIds
console.log('Label layers:', appState.labelLayerIds);

// 手动测试 getInsertionPoint
console.log('Country insertion point:', getInsertionPoint('country'));
console.log('Admin insertion point:', getInsertionPoint('admin'));
```

### 问题 3: 透明度不正确

**可能原因**：
- overlayMode 状态没有正确设置
- createAreaLayer 函数逻辑错误

**解决方法**：
```javascript
// 检查状态
console.log('Overlay mode:', appState.overlayMode);

// 检查图层属性
const layerId = 'area-country-TWN'; // 修改为实际图层 ID
const opacity = appState.map.getPaintProperty(layerId, 'fill-opacity');
console.log('Layer opacity:', opacity);
```

### 问题 4: 图层没有叠加效果

**可能原因**：
- 图层顺序错误
- 透明度设置不当
- 数据源问题

**解决方法**：
1. 检查图层顺序（使用上面的 visualizeLayerOrder 函数）
2. 检查透明度设置
3. 确保选择了正确的国家和行政区

---

## 📸 预期视觉效果

### 标准模式（overlayMode = false）
- 所有区域使用相同的透明度（0.6）
- 图层顺序按选择顺序

### 疊加模式（overlayMode = true）
- 国家：较淡的颜色（opacity 0.6）
- 行政区：较深的颜色（opacity 0.85）
- 清晰的分层效果

---

## 🎯 测试场景建议

### 场景 1: 台湾 + 台北
1. 选择台湾（国家）
2. 选择台北（城市）
3. 检查叠加效果

### 场景 2: 日本 + 东京都
1. 选择日本（国家）
2. 选择东京都（一级行政区）
3. 检查叠加效果

### 场景 3: 多个行政区
1. 选择国家
2. 选择多个行政区（使用不同颜色）
3. 检查所有行政区都在国家上方

---

## 📝 测试报告模板

```
测试日期: ___________
测试人员: ___________

测试结果:
- [ ] 基本功能: 通过 / 失败
- [ ] 图层顺序: 通过 / 失败
- [ ] 透明度: 通过 / 失败
- [ ] 模式切换: 通过 / 失败
- [ ] 图层跟踪: 通过 / 失败
- [ ] 取消选择: 通过 / 失败

发现问题:
1. _________________________________
2. _________________________________

控制台错误:
_________________________________

截图: (如果有)
```

---

**祝测试顺利！** 🎉

