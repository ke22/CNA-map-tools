# 服務器啟動問題排查

## 錯誤：ERR_EMPTY_RESPONSE

這個錯誤表示瀏覽器無法連接到服務器。

### 解決方案

#### 方案 1: 使用提供的啟動腳本（推薦）

```bash
./start-server.sh
```

這個腳本會自動選擇可用的服務器（Python、Node.js 或 PHP）。

#### 方案 2: 手動啟動 Python 服務器

```bash
cd /Users/yulincho/Documents/GitHub/map
python3 -m http.server 8000
```

#### 方案 3: 使用 Node.js 服務器

```bash
cd /Users/yulincho/Documents/GitHub/map
node server.js
```

或者使用 npx：
```bash
npx http-server -p 8000
```

---

## 常見問題

### Q: 端口 8000 已被占用

**解決方案：**

```bash
# 查看占用端口的進程
lsof -ti:8000

# 停止占用端口的進程
lsof -ti:8000 | xargs kill -9

# 或使用其他端口
python3 -m http.server 8080
```

然後訪問：`http://localhost:8080/index-enhanced.html`

---

### Q: 服務器啟動但無法訪問

**檢查清單：**

1. ✅ 確認服務器正在運行：
   ```bash
   lsof -ti:8000
   ```

2. ✅ 確認文件存在：
   ```bash
   ls -la index-enhanced.html
   ```

3. ✅ 測試服務器響應：
   ```bash
   curl http://localhost:8000/index-enhanced.html
   ```

---

### Q: 瀏覽器顯示連接被拒絕

**可能原因：**

- 服務器未啟動
- 端口被防火牆阻止
- 使用了錯誤的端口號

**解決方案：**

1. 重新啟動服務器
2. 檢查防火牆設置
3. 嘗試其他端口（8080、3000 等）

---

## 快速修復

### 完全重置並重新啟動

```bash
# 1. 停止所有可能的服務器
lsof -ti:8000 | xargs kill -9 2>/dev/null

# 2. 等待 1 秒
sleep 1

# 3. 重新啟動
cd /Users/yulincho/Documents/GitHub/map
python3 -m http.server 8000
```

---

## 驗證服務器運行

打開新的終端窗口，運行：

```bash
curl http://localhost:8000/index-enhanced.html | head -20
```

如果看到 HTML 內容，說明服務器正常工作。

---

## 替代方案：直接打開文件

如果服務器問題持續，可以嘗試：

1. 在 Finder 中找到 `index-enhanced.html`
2. 右鍵 → 打開方式 → 瀏覽器

**注意**：直接打開文件可能會遇到 CORS 限制，建議使用本地服務器。


