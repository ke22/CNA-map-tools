# 国家数量统计

## 📊 测试脚本中的国家（用于自动化测试）

### 总计：**26 个主要国家**

### 按地区分类：

#### 🌏 亚洲 (10 个)
1. Taiwan (台湾) - TWN
2. China (中国) - CHN
3. India (印度) - IND
4. Japan (日本) - JPN
5. South Korea (韩国) - KOR
6. Indonesia (印度尼西亚) - IDN
7. Thailand (泰国) - THA
8. Vietnam (越南) - VNM
9. Singapore (新加坡) - SGP
10. Malaysia (马来西亚) - MYS

#### 🇪🇺 欧洲 (6 个)
11. Russia (俄罗斯) - RUS
12. Germany (德国) - DEU
13. France (法国) - FRA
14. United Kingdom (英国) - GBR
15. Italy (意大利) - ITA
16. Spain (西班牙) - ESP

#### 🇺🇸 美洲 (5 个)
17. United States (美国) - USA
18. Canada (加拿大) - CAN
19. Mexico (墨西哥) - MEX
20. Brazil (巴西) - BRA
21. Argentina (阿根廷) - ARG

#### 🇦🇫 非洲 (3 个)
22. South Africa (南非) - ZAF
23. Egypt (埃及) - EGY
24. Nigeria (尼日利亚) - NGA

#### 🇦🇺 大洋洲 (2 个)
25. Australia (澳大利亚) - AUS
26. New Zealand (新西兰) - NZL

---

## 🌍 实际支持的国家数量

### 数据源：
- **Mapbox Boundaries** - 使用 Mapbox 的国家边界数据
- **GADM (Global Administrative Areas)** - 全球行政区域数据

### 支持数量：
地图应用理论上支持 **全球所有国家**，包括：

- ✅ **联合国成员国**: 193 个
- ✅ **观察员国**: 2 个（梵蒂冈、巴勒斯坦）
- ✅ **其他特殊地区**: 如台湾、库克群岛等

**总计约 195-200 个国家/地区**

### 所有国家都可以：
- ✅ 在地图上点击选择
- ✅ 应用颜色
- ✅ 查看名称（支持多语言）
- ✅ 使用行政区功能（如果数据可用）

---

## 📋 完整国家列表

由于数量众多，完整列表请参考：
- Mapbox Boundaries 数据源
- GADM 数据（level 0 = 国家级别）

### 查看方式：
1. 在地图上直接点击任何国家
2. 使用搜索功能搜索国家名称
3. 查看边界图层数据

---

## 🎯 测试覆盖

### 优先级分类：

#### 优先级 1（关键测试项）：
- Taiwan (台湾) ⭐⭐⭐
- China (中国) ⭐⭐
- United States (美国) ⭐⭐

#### 优先级 2（重要国家）：
- India, Japan, South Korea, Indonesia
- Russia, Germany, France, United Kingdom
- Canada, Mexico, Brazil
- South Africa, Australia

#### 优先级 3（其他主要国家）：
- 其余测试脚本中的国家

---

## 💡 说明

- **测试脚本**: 只包含 26 个主要国家（用于自动化测试）
- **实际应用**: 支持全球所有国家（195-200 个）
- **所有国家**都可以在地图上选择和着色，不仅仅是测试脚本中的 26 个

