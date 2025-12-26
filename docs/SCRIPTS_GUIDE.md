# 测试脚本使用指南

## 📁 所有测试脚本列表

### 1. **test-countries-auto.js** - 主要自动测试脚本
- **功能**: 自动测试主要国家的选择和着色功能
- **测试内容**: 26 个主要国家
- **使用方法**:
  ```javascript
  // 加载脚本
  const script = document.createElement('script');
  script.src = 'test-countries-auto.js';
  document.body.appendChild(script);
  
  // 等待加载后运行
  setTimeout(async () => {
      await quickTest();              // 快速测试（关键国家）
      // 或
      await testMainCountries();      // 完整测试（所有国家）
  }, 2000);
  ```

### 2. **test-all-areas.js** - 全面测试脚本
- **功能**: 测试所有国家和行政区功能
- **测试内容**: 国家 + 行政区
- **使用方法**:
  ```javascript
  const script = document.createElement('script');
  script.src = 'test-all-areas.js';
  script.onload = () => setTimeout(async () => await testAllAreas(), 500);
  document.body.appendChild(script);
  ```

### 3. **test-quick-start.js** - 一键启动脚本
- **功能**: 自动加载诊断和测试脚本
- **使用方法**:
  ```javascript
  const script = document.createElement('script');
  script.src = 'test-quick-start.js';
  document.body.appendChild(script);
  ```
- **自动执行**: 
  - 加载诊断脚本
  - 运行环境检查
  - 如果通过，自动加载测试脚本

### 4. **test-diagnose.js** - 环境诊断脚本
- **功能**: 检查测试环境是否就绪
- **使用方法**:
  ```javascript
  const script = document.createElement('script');
  script.src = 'test-diagnose.js';
  script.onload = () => diagnoseTestEnvironment();
  document.body.appendChild(script);
  ```

### 5. **quick-check.js** - 快速检查脚本
- **功能**: 快速查看所有已选择的区域
- **使用方法**:
  ```javascript
  const script = document.createElement('script');
  script.src = 'quick-check.js';
  script.onload = () => checkAllSelected();
  document.body.appendChild(script);
  ```

---

## 🚀 推荐使用流程

### 方式 1: 一键启动（最简单）

```javascript
const script = document.createElement('script');
script.src = 'test-quick-start.js';
document.body.appendChild(script);
```

这会自动：
1. 加载诊断脚本
2. 检查环境
3. 如果通过，加载测试脚本
4. 显示可用的测试命令

### 方式 2: 手动步骤

#### 步骤 1: 诊断环境
```javascript
const script1 = document.createElement('script');
script1.src = 'test-diagnose.js';
script1.onload = () => diagnoseTestEnvironment();
document.body.appendChild(script1);
```

#### 步骤 2: 如果环境正常，加载测试脚本
```javascript
const script2 = document.createElement('script');
script2.src = 'test-countries-auto.js';
document.body.appendChild(script2);
```

#### 步骤 3: 运行测试
```javascript
await quickTest()           // 快速测试
// 或
await testMainCountries()   // 完整测试
```

---

## 📋 可用的测试命令

### 测试命令

```javascript
// 快速测试（只测试关键国家：Taiwan, China, USA）
await quickTest()

// 完整测试（测试所有 26 个国家）
await testMainCountries()

// 测试单个国家
await testSingleCountry('Taiwan')
await testSingleCountry('Vietnam')
```

### 检查命令

```javascript
// 检查所有已选择的区域
checkAllSelected()

// 诊断单个国家
diagnoseCountry('Taiwan', 'TWN')
diagnoseCountry('Vietnam', 'VNM')

// 诊断环境
diagnoseTestEnvironment()
```

### 报告命令

```javascript
// 生成测试报告
generateTestReport()
```

---

## 🎯 脚本功能对比

| 脚本 | 主要功能 | 自动运行 | 测试内容 |
|------|---------|---------|---------|
| `test-countries-auto.js` | 自动测试国家 | 否 | 26 个主要国家 |
| `test-all-areas.js` | 全面测试 | 否 | 国家 + 行政区 |
| `test-quick-start.js` | 一键启动 | 是 | 加载其他脚本 |
| `test-diagnose.js` | 环境诊断 | 是 | 环境检查 |
| `quick-check.js` | 快速查看 | 是 | 显示已选区域 |

---

## 💡 使用建议

### 第一次使用
1. 使用 `test-quick-start.js` 一键启动
2. 查看诊断结果
3. 如果通过，运行 `await quickTest()`

### 调试问题
1. 使用 `test-diagnose.js` 诊断环境
2. 使用 `quick-check.js` 查看当前状态
3. 使用 `diagnoseCountry()` 诊断特定国家

### 完整测试
1. 加载 `test-countries-auto.js`
2. 运行 `await testMainCountries()`
3. 查看测试报告

---

## ⚠️ 重要提示

1. **使用本地服务器**: 不能直接用 `file://` 协议
   ```bash
   python3 -m http.server 8000
   ```

2. **等待地图加载**: 确保地图完全加载后再运行测试

3. **查看控制台**: 所有日志都在浏览器控制台

4. **刷新页面**: 修改脚本后需要刷新页面

---

## 📝 脚本位置

所有脚本都在项目根目录：
- `/Users/yulincho/Documents/GitHub/map/test-countries-auto.js`
- `/Users/yulincho/Documents/GitHub/map/test-all-areas.js`
- `/Users/yulincho/Documents/GitHub/map/test-quick-start.js`
- `/Users/yulincho/Documents/GitHub/map/test-diagnose.js`
- `/Users/yulincho/Documents/GitHub/map/quick-check.js`

