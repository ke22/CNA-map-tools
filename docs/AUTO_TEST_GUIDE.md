# 自动测试使用指南

## 🚀 快速开始

### 最简单的方法（推荐）

1. **打开地图应用**
   ```
   在浏览器中打开 index-enhanced.html
   ```

2. **打开浏览器控制台**
   - Mac: `Cmd + Option + I`
   - Windows/Linux: `F12` 或 `Ctrl + Shift + I`

3. **复制并运行以下代码**
   ```javascript
   // 加载测试脚本
   const script = document.createElement('script');
   script.src = 'test-countries-auto.js';
   document.body.appendChild(script);
   
   // 等待脚本加载后运行测试（约2秒后）
   setTimeout(async () => {
       await quickTest(); // 快速测试关键国家
       // 或
       // await testMainCountries(); // 测试所有国家
   }, 2000);
   ```

## 📋 测试命令

### 1. 快速测试（推荐）
只测试最关键的国家（台湾、中国、美国）：
```javascript
await quickTest()
```

### 2. 测试所有国家
测试 26 个主要国家：
```javascript
await testMainCountries()
```

### 3. 测试单个国家
```javascript
await testSingleCountry('Taiwan')
await testSingleCountry('China')
await testSingleCountry('USA')
```

### 4. 测试选项
```javascript
// 只测试优先级 1 的国家
await testMainCountries({ priority: 1 })

// 测试优先级 1-2 的国家
await testMainCountries({ priority: 2 })

// 自定义延迟时间（毫秒）
await testMainCountries({ delay: 2000 })

// 测试特定国家列表
await testMainCountries({ 
    countries: ['Taiwan', 'China', 'USA'] 
})
```

## 📊 查看测试报告

测试完成后会自动显示报告，也可以手动生成：
```javascript
generateTestReport()
```

## 🎯 测试的国家列表

### 优先级 1（最关键）
- 🇹🇼 Taiwan (台湾)
- 🇨🇳 China (中国)
- 🇺🇸 United States (美国)

### 优先级 2（重要国家）
- 🇮🇳 India (印度)
- 🇯🇵 Japan (日本)
- 🇰🇷 South Korea (韩国)
- 🇮🇩 Indonesia (印度尼西亚)
- 🇷🇺 Russia (俄罗斯)
- 🇩🇪 Germany (德国)
- 🇫🇷 France (法国)
- 🇬🇧 United Kingdom (英国)
- 🇨🇦 Canada (加拿大)
- 🇲🇽 Mexico (墨西哥)
- 🇧🇷 Brazil (巴西)
- 🇿🇦 South Africa (南非)
- 🇦🇺 Australia (澳大利亚)

### 优先级 3（其他主要国家）
- 🇹🇭 Thailand (泰国)
- 🇻🇳 Vietnam (越南)
- 🇸🇬 Singapore (新加坡)
- 🇲🇾 Malaysia (马来西亚)
- 🇮🇹 Italy (意大利)
- 🇪🇸 Spain (西班牙)
- 🇦🇷 Argentina (阿根廷)
- 🇪🇬 Egypt (埃及)
- 🇳🇬 Nigeria (尼日利亚)
- 🇳🇿 New Zealand (新西兰)

## 📝 测试报告示例

```
📊 测试报告
============================================================

总测试数: 26
✅ 通过: 24 (92.3%)
❌ 失败: 2 (7.7%)
⏭️  跳过: 0

✅ 通过的国家:
   - Taiwan
   - China
   - United States
   ...

❌ 失败的国家:
   - CountryName: 原因说明
   ...
```

## 🐛 故障排除

### 问题：测试脚本无法加载

**解决方案：**
1. 确保 `test-countries-auto.js` 文件在同一目录
2. 检查浏览器控制台是否有错误
3. 尝试直接在控制台粘贴脚本内容

### 问题：测试时地图没有响应

**解决方案：**
1. 确保地图已经完全加载
2. 确保在 "國家" (Country) 模式
3. 检查 `appState.map` 对象是否存在

### 问题：某些国家测试失败

**可能原因：**
- 地图边界数据未加载
- 坐标不准确（需要调整坐标）
- 网络问题导致数据加载失败

**解决方案：**
- 等待地图完全加载后再运行测试
- 手动测试失败的国家，检查坐标是否正确
- 查看控制台错误信息

## 💡 提示

1. **第一次运行建议使用快速测试**
   ```javascript
   await quickTest()
   ```

2. **测试前确保地图已加载**
   等待地图完全加载后再运行测试，通常需要 5-10 秒

3. **测试结果会自动保存在控制台**
   可以复制测试报告 JSON 数据用于后续分析

4. **可以随时中断测试**
   按 `Ctrl + C` 在控制台中断当前测试

## 📞 需要帮助？

如果遇到问题：
1. 检查浏览器控制台的错误信息
2. 确认所有依赖文件都已加载
3. 查看 `TEST_MAIN_COUNTRIES.md` 了解手动测试步骤

