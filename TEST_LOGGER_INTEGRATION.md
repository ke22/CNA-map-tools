# Logger 集成测试指南

## 测试步骤

### 1. 基本功能测试

1. 打开主应用：`http://localhost:3000/index-enhanced.html`
2. 打开浏览器开发者工具（F12 或 Cmd+Option+I）
3. 切换到 Console 标签

### 2. 检查 Logger 是否加载

在控制台中输入：
```javascript
// 检查 Logger 是否可用
typeof Logger
// 应该返回: "object"

// 检查 Logger 方法
typeof Logger.info
// 应该返回: "function"

// 测试 Logger
Logger.info('测试 Logger 是否正常工作');
Logger.success('✅ Logger 工作正常！');
```

### 3. 验证日志输出格式

打开应用后，检查控制台中的日志：
- 应该看到格式化的日志（带 emoji 前缀和级别标签）
- 例如：`ℹ️ [INFO] Using GADM data for country`
- 例如：`✅ [SUCCESS] Successfully loaded GADM data for country`
- 例如：`⚠️ [WARN] GADM_LOADER not available...`
- 例如：`❌ [ERROR] Map error ...`

### 4. 功能测试

测试以下功能，确保替换 Logger 后功能正常：

#### 4.1 地图加载
- [ ] 地图是否正常加载？
- [ ] 是否看到地图初始化相关的日志？

#### 4.2 边界数据加载
- [ ] GADM 数据是否正常加载？
- [ ] 如果 GADM 不可用，是否正常 fallback 到 Mapbox？
- [ ] 是否看到相关的加载日志？

#### 4.3 错误处理
- [ ] 如果有错误发生，是否看到格式化的错误日志？
- [ ] 错误信息是否清晰？

#### 4.4 AI 分析（如果使用）
- [ ] AI 分析功能是否正常？
- [ ] 是否有相关的日志输出？

### 5. 检查向后兼容性

测试如果 Logger 不存在时的行为：
1. 在控制台中临时禁用 Logger：
   ```javascript
   delete window.Logger;
   ```
2. 刷新页面
3. 检查应用是否仍然正常工作（应该 fallback 到 console）

### 6. 性能测试

1. 检查日志输出是否影响性能
2. 检查是否有过多的日志输出
3. 测试日志级别控制：
   ```javascript
   Logger.setLevel('error'); // 只显示错误
   Logger.setLevel('warn');  // 显示警告和错误
   Logger.setLevel('info');  // 显示信息、警告和错误
   ```

## 预期结果

✅ **通过标准：**
- Logger 对象可用
- 所有日志方法正常工作
- 日志格式正确（带 emoji 和级别标签）
- 应用功能正常
- 向后兼容性正常
- 性能无明显影响

❌ **失败标准：**
- Logger 未定义或不可用
- 日志格式不正确
- 应用功能异常
- JavaScript 错误

## 已知问题

- 无

## 测试结果

- [ ] 基本功能测试：通过 / 失败
- [ ] Logger 加载测试：通过 / 失败
- [ ] 日志格式测试：通过 / 失败
- [ ] 功能测试：通过 / 失败
- [ ] 向后兼容性测试：通过 / 失败
- [ ] 性能测试：通过 / 失败

## 备注

记录任何发现的问题或异常行为。

