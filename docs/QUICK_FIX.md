# 快速解決 GADM 文件過大問題

## 🚀 最簡單的方法（5分鐘）

### 步驟 1: 運行優化腳本

```bash
./scripts/optimize-gadm.sh
```

**如果沒有安裝 mapshaper**，腳本會提示使用 `npx`，或先安裝：
```bash
npm install -g mapshaper
```

### 步驟 2: 等待完成

優化過程可能需要 10-30 分鐘，取決於文件大小。

### 步驟 3: 檢查結果

```bash
ls -lh data/gadm/optimized/
```

應該看到三個優化後的文件，大小約為：
- `gadm_level0_optimized.geojson`: 50-100 MB
- `gadm_level1_optimized.geojson`: 100-200 MB  
- `gadm_level2_optimized.geojson`: 200-400 MB

### 步驟 4: 刷新頁面

應用程序會自動使用優化後的文件（如果存在）。

---

## 📝 調整簡化比例

如果優化後的文件還是太大，可以編輯 `scripts/optimize-gadm.sh`：

```bash
# 打開腳本
nano scripts/optimize-gadm.sh

# 修改簡化比例：
# Level 0: -simplify 15%  →  -simplify 20%
# Level 1: -simplify 8%   →  -simplify 10%
# Level 2: -simplify 3%   →  -simplify 5%
```

數字越大，文件越小，但精度越低。

---

## ❓ 常見問題

**Q: 優化會影響精度嗎？**
A: 會有輕微影響，但對於大多數應用場景（地圖顯示、區域選擇）影響很小。

**Q: 可以還原嗎？**
A: 可以，原始文件還在 `data/gadm/` 目錄中。

**Q: 優化需要多長時間？**
A: 根據文件大小，通常 10-30 分鐘。

**Q: 如果還是不行怎麼辦？**
A: 查看 `SOLUTION_LARGE_FILES.md` 了解其他方案。


