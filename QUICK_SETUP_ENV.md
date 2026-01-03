# 🔑 快速设置 .env 文件

## 当前状态

❌ `.env` 文件不存在，AI 功能将无法使用。

## 🚀 快速设置（3 步）

### 步骤 1: 获取 Gemini API Key

访问：https://aistudio.google.com/app/apikey

1. 使用 Google 账号登录
2. 点击 "Create API Key"
3. 选择或创建项目
4. 复制生成的 API Key

### 步骤 2: 运行设置脚本

```bash
cd /Users/yulincho/.cursor/worktrees/map/hkn
./SETUP_API_KEY.sh
```

然后输入你的 API Key。

### 步骤 3: 验证设置

```bash
# 检查 .env 文件是否创建
ls -la .env

# 启动服务器测试
npm start
```

## 📝 手动设置（可选）

如果不想使用脚本，可以手动创建：

```bash
cd /Users/yulincho/.cursor/worktrees/map/hkn
echo 'GEMINI_API_KEY=你的API密钥' > .env
```

## ✅ 验证

设置完成后，session hook 将不再显示警告信息。

## 🔒 安全提示

- ✅ `.env` 文件已在 `.gitignore` 中，不会被提交到 Git
- ✅ API Key 只存储在本地
- ✅ 使用后端代理模式，API Key 不会暴露在前端代码中

---

**需要帮助？** 查看 `GEMINI_API_USAGE.md` 获取详细说明。

