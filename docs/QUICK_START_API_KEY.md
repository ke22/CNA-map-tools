# 🚀 快速开始：设置 API 密钥

## 步骤 1：获取 API 密钥

访问 Google AI Studio 获取密钥：
👉 https://aistudio.google.com/app/apikey

## 步骤 2：设置密钥（选择一种方式）

### 方式 A：使用设置脚本（最简单）✨

```bash
cd /Users/yulincho/Documents/GitHub/map
./SETUP_API_KEY.sh
```

然后按提示输入你的 API 密钥。

### 方式 B：手动创建 .env 文件

```bash
cd /Users/yulincho/Documents/GitHub/map
echo 'GEMINI_API_KEY=你的实际密钥' > .env
```

### 方式 C：临时设置环境变量

```bash
export GEMINI_API_KEY="你的实际密钥"
```

## 步骤 3：启动服务器

```bash
node server-combined.js
```

## 步骤 4：验证

启动后应该看到：
```
🚀 Combined Server Running!
📍 Server: http://localhost:8000/
🔒 Gemini API Proxy: http://localhost:8000/api/gemini/generateContent
   ✅ API Key: Set (hidden)
```

## 步骤 5：打开浏览器

访问：http://localhost:8000/

然后测试 AI 助手功能！

---

## 快速命令（一键设置）

如果你已经有 API 密钥，可以运行：

```bash
# 替换 YOUR_API_KEY_HERE 为你的实际密钥
cd /Users/yulincho/Documents/GitHub/map
echo 'GEMINI_API_KEY=YOUR_API_KEY_HERE' > .env
node server-combined.js
```

或者使用脚本：

```bash
cd /Users/yulincho/Documents/GitHub/map
./SETUP_API_KEY.sh
```
