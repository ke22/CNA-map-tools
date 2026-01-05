# 端口配置说明

> 本文档记录项目中所有服务的端口分配和使用情况

## 📋 端口分配总览

| 项目/服务 | 端口 | 配置文件位置 | 用途 | 状态 |
|-----------|------|--------------|------|------|
| **Map Tool v1** (当前项目) | **8000** | `server-combined.js`<br>`start-preview.sh`<br>`playwright.config.ts` | 主开发服务器 | ✅ 使用中 |
| **Map Tool v2** (新项目) | **8001** | `server-combined.js` (v2)<br>`.env` (v2) | 新工作流项目 | 🚧 规划中 |

---

## 🔧 Map Tool v1 (当前项目)

### 端口配置

- **默认端口**: 3000 (在 `server-combined.js` 中定义)
- **实际使用端口**: 8000 (通过环境变量或脚本设置)

### 配置文件

1. **`server-combined.js`**
   ```javascript
   const PORT = process.env.PORT || 3000;
   ```

2. **`start-preview.sh`**
   ```bash
   # 脚本中使用端口 8000
   if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
   ```

3. **`playwright.config.ts`**
   ```typescript
   baseURL: 'http://localhost:8000',
   webServer: {
     command: 'PORT=8000 node server-combined.js',
     url: 'http://localhost:8000',
   }
   ```

4. **`.env` 文件** (建议)
   ```bash
   PORT=8000
   GEMINI_API_KEY=your-api-key-here
   MAPBOX_TOKEN=your-token-here
   ```

### 启动方式

```bash
# 方式 1: 使用启动脚本（推荐）
./start-preview.sh

# 方式 2: 直接运行（使用环境变量）
PORT=8000 node server-combined.js

# 方式 3: 使用 npm（需要在 package.json 中配置）
npm start
```

### 访问地址

- 主页面: http://localhost:8000/index-enhanced.html
- API 代理: http://localhost:8000/api/gemini/generateContent

---

## 🚀 Map Tool v2 (新项目)

### 端口配置

- **默认端口**: 8001
- **位置**: `/Users/yulincho/Documents/01_Github/map/map-tool-v2/`

### 配置文件（待创建）

1. **`map-tool-v2/.env`**
   ```bash
   PORT=8001
   GEMINI_API_KEY=your-api-key-here
   MAPBOX_TOKEN=your-token-here
   ```

2. **`map-tool-v2/server-combined.js`** (如果复用)
   ```javascript
   const PORT = process.env.PORT || 8001; // 默认 8001
   ```

3. **`map-tool-v2/playwright.config.ts`** (如果使用)
   ```typescript
   baseURL: 'http://localhost:8001',
   webServer: {
     command: 'PORT=8001 node server-combined.js',
     url: 'http://localhost:8001',
   }
   ```

### 启动方式

```bash
cd /Users/yulincho/Documents/01_Github/map/map-tool-v2
PORT=8001 node server-combined.js
```

---

## 🔍 端口检查命令

### 检查端口占用

```bash
# 检查端口 8000
lsof -ti:8000

# 检查端口 8001
lsof -ti:8001

# 查看所有监听端口
lsof -i -P -n | grep LISTEN

# 查看特定端口详情
lsof -i:8000
```

### 释放端口

```bash
# 方式 1: 正常停止（推荐）
# 找到进程 ID
PID=$(lsof -ti:8000)
# 停止进程
kill $PID

# 方式 2: 强制停止
kill -9 $(lsof -ti:8000)
```

---

## ⚠️ 注意事项

### 1. 端口冲突

- ✅ **v1 使用 8000**，**v2 使用 8001**，避免冲突
- ⚠️ 如果端口被占用，检查是否有其他服务在使用
- 💡 可以使用 `lsof -ti:PORT` 检查端口占用情况

### 2. 环境变量优先级

环境变量 `PORT` 的优先级高于代码中的默认值：

```javascript
// server-combined.js
const PORT = process.env.PORT || 3000; // 如果设置 PORT=8000，则使用 8000
```

### 3. 同时运行两个项目

```bash
# 终端 1: 启动 v1 (端口 8000)
cd /Users/yulincho/Documents/01_Github/map
PORT=8000 node server-combined.js

# 终端 2: 启动 v2 (端口 8001)
cd /Users/yulincho/Documents/01_Github/map/map-tool-v2
PORT=8001 node server-combined.js
```

访问：
- v1: http://localhost:8000/index-enhanced.html
- v2: http://localhost:8001/index.html

### 4. Playwright 测试配置

- v1 测试使用端口 8000
- v2 测试应使用端口 8001
- 确保测试配置中的端口与服务器端口一致

---

## 📝 更新记录

- **2024-12-19**: 创建端口配置文档
- **2024-12-19**: 定义 v1 使用 8000，v2 使用 8001

---

## 🔗 相关文档

- `CLAUDE.md` - 项目开发规范
- `SETUP_GUIDE.md` - 设置指南
- `.shared-context/known-issues.md` - 已知问题

