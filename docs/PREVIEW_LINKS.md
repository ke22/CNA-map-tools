# 🔗 预览链接 - 完整列表

## 🌐 GitHub Pages 预览（推荐）

### 设置步骤：

1. **在 GitHub 仓库中启用 Pages**
   - 进入仓库：https://github.com/ke22/CNA-map-tools
   - 点击 `Settings` → `Pages`
   - Source: `Deploy from a branch`
   - Branch: `feature/genai` 或 `main`
   - Folder: `/ (root)`
   - 点击 `Save`

2. **等待部署完成**（通常 1-2 分钟）

3. **访问预览链接**
   ```
   https://ke22.github.io/CNA-map-tools/
   ```

### 注意事项：
- ⚠️ AI 功能不可用（需要后端服务器）
- ✅ 地图和标注功能可用
- ✅ 需要配置 Mapbox Token（在 config.js 中）

---

## 🚀 本地预览链接

### 方式 1: 直接打开 HTML（基础功能）

```bash
# 在浏览器中打开
file:///Users/yulincho/Documents/GitHub/map/index-enhanced.html
```

**限制：**
- ❌ AI 功能不可用
- ❌ 某些功能可能受限

---

### 方式 2: 本地服务器（完整功能）

**启动服务器：**
```bash
cd /Users/yulincho/Documents/GitHub/map
node server-combined.js
```

**访问链接：**
```
http://localhost:8000
```

**功能：**
- ✅ 所有功能可用
- ✅ AI 功能可用
- ✅ 仅本地访问

---

## 🌍 公共预览链接（临时）

### 方式 1: ngrok（推荐用于演示）

**1. 安装 ngrok**
```bash
# Mac
brew install ngrok

# 或从官网下载
# https://ngrok.com/download
```

**2. 启动本地服务器**
```bash
cd /Users/yulincho/Documents/GitHub/map
node server-combined.js
```

**3. 创建公共链接**
```bash
ngrok http 8000
```

**4. 获取预览链接**
```
例如：https://abc123.ngrok.io
```

**特点：**
- ✅ 功能完整（包括 AI）
- ✅ 可以分享给任何人
- ⏰ 免费版链接会过期
- 🔄 每次启动 URL 都变化

---

### 方式 2: 局域网预览

**1. 查找你的 IP 地址**
```bash
# Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# 或使用
ipconfig getifaddr en0
```

**2. 启动服务器**
```bash
node server-combined.js
```

**3. 分享链接**
```
http://你的IP:8000
例如：http://192.168.1.100:8000
```

**特点：**
- ✅ 功能完整
- ✅ 同一 Wi-Fi 网络可访问
- ❌ 只能局域网访问

---

## 📋 所有预览链接汇总

### GitHub Pages（如果已启用）
```
https://ke22.github.io/CNA-map-tools/
```

### 本地服务器
```
http://localhost:8000
```

### ngrok 临时链接（需要运行 ngrok）
```
https://[随机ID].ngrok.io
```

### 局域网链接（需要知道 IP）
```
http://[你的IP]:8000
```

---

## 🎯 快速预览指南

### 场景 1: 快速演示（不需要 AI）
1. 启用 GitHub Pages
2. 分享链接：`https://ke22.github.io/CNA-map-tools/`

### 场景 2: 完整功能演示（需要 AI）
1. 启动本地服务器：`node server-combined.js`
2. 启动 ngrok：`ngrok http 8000`
3. 分享 ngrok 链接

### 场景 3: 团队内部分享
1. 启动本地服务器：`node server-combined.js`
2. 查找 IP：`ifconfig | grep "inet "`
3. 分享局域网链接：`http://[IP]:8000`

---

## ⚙️ 设置 GitHub Pages（详细步骤）

### 步骤 1: 进入仓库设置
1. 打开：https://github.com/ke22/CNA-map-tools
2. 点击右上角 `Settings`

### 步骤 2: 配置 Pages
1. 左侧菜单找到 `Pages`
2. 在 `Source` 部分：
   - 选择 `Deploy from a branch`
   - Branch: 选择 `feature/genai`
   - Folder: 选择 `/ (root)`
3. 点击 `Save`

### 步骤 3: 等待部署
- 通常需要 1-2 分钟
- 页面会显示部署状态
- 部署完成后会显示预览链接

### 步骤 4: 访问预览
```
https://ke22.github.io/CNA-map-tools/
```

---

## 🔧 一键启动预览脚本

我可以帮你创建一个脚本，自动：
1. 检查服务器是否运行
2. 启动服务器（如果未运行）
3. 显示所有可用的预览链接

需要我创建这个脚本吗？

---

## 📝 预览链接检查清单

### GitHub Pages
- [ ] 已在 GitHub 仓库中启用 Pages
- [ ] 选择了正确的分支（feature/genai）
- [ ] 部署状态显示成功
- [ ] 预览链接可以访问

### 本地服务器
- [ ] 已安装 Node.js
- [ ] 已设置 API 密钥（.env 文件）
- [ ] 服务器可以正常启动
- [ ] 可以访问 http://localhost:8000

### ngrok（如果需要）
- [ ] 已安装 ngrok
- [ ] 本地服务器正在运行
- [ ] ngrok 已启动并显示链接
- [ ] 链接可以正常访问

---

## 🎁 推荐的预览方式

**给他人快速演示：**
→ GitHub Pages: `https://ke22.github.io/CNA-map-tools/`

**完整功能演示：**
→ ngrok: `https://[ID].ngrok.io`

**本地开发测试：**
→ 本地服务器: `http://localhost:8000`

---

**最后更新**: 刚刚创建 ✅


