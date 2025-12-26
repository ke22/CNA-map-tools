/**
 * Gemini Service Cache
 * 
 * 緩存機制來減少 API 調用和配額消耗
 */

class GeminiServiceCache {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 50; // 最多緩存 50 個請求
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24小時過期
        this.lastRequestTime = 0;
        this.minRequestInterval = 2000; // 最小請求間隔 2 秒
        this.pendingRequests = new Map(); // 防止重複請求
    }

    /**
     * 生成緩存鍵（基於新聞文本的哈希）
     */
    generateCacheKey(text) {
        // 簡單的哈希函數（可以改進為更複雜的）
        let hash = 0;
        const normalizedText = text.trim().toLowerCase();
        for (let i = 0; i < normalizedText.length; i++) {
            const char = normalizedText.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return `gemini_${Math.abs(hash)}`;
    }

    /**
     * 獲取緩存的結果
     */
    get(text) {
        const key = this.generateCacheKey(text);
        const cached = this.cache.get(key);

        if (!cached) {
            return null;
        }

        // 檢查是否過期
        const now = Date.now();
        if (now - cached.timestamp > this.cacheExpiry) {
            this.cache.delete(key);
            return null;
        }

        console.log('💾 [Cache] 使用緩存結果（避免 API 調用）');
        return cached.data;
    }

    /**
     * 設置緩存
     */
    set(text, data) {
        const key = this.generateCacheKey(text);
        
        // 如果緩存已滿，刪除最舊的項
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });

        console.log('💾 [Cache] 結果已緩存', {
            cacheSize: this.cache.size,
            key: key.substring(0, 20) + '...'
        });
    }

    /**
     * 檢查是否應該等待（請求間隔控制）
     */
    async waitIfNeeded() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.minRequestInterval) {
            const waitTime = this.minRequestInterval - timeSinceLastRequest;
            console.log(`⏳ [Cache] 等待 ${waitTime}ms 以避免請求過快...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        this.lastRequestTime = Date.now();
    }

    /**
     * 檢查是否有正在進行的相同請求（防止重複請求）
     */
    isPending(text) {
        const key = this.generateCacheKey(text);
        return this.pendingRequests.has(key);
    }

    /**
     * 標記請求為進行中
     */
    markPending(text) {
        const key = this.generateCacheKey(text);
        return this.pendingRequests.set(key, Date.now());
    }

    /**
     * 移除進行中的標記
     */
    unmarkPending(text) {
        const key = this.generateCacheKey(text);
        this.pendingRequests.delete(key);
    }

    /**
     * 獲取或等待正在進行的請求結果
     */
    async waitForPending(text) {
        const key = this.generateCacheKey(text);
        const pendingStart = this.pendingRequests.get(key);
        
        if (!pendingStart) {
            return null;
        }

        // 等待最多 30 秒
        const maxWait = 30000;
        const startTime = Date.now();

        while (this.pendingRequests.has(key)) {
            if (Date.now() - startTime > maxWait) {
                console.warn('⚠️ [Cache] 等待請求超時');
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 檢查緩存是否有結果
        return this.get(text);
    }

    /**
     * 清除過期緩存
     */
    clearExpired() {
        const now = Date.now();
        let cleared = 0;

        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheExpiry) {
                this.cache.delete(key);
                cleared++;
            }
        }

        if (cleared > 0) {
            console.log(`🧹 [Cache] 已清除 ${cleared} 個過期緩存`);
        }
    }

    /**
     * 清除所有緩存
     */
    clear() {
        this.cache.clear();
        this.pendingRequests.clear();
        console.log('🧹 [Cache] 已清除所有緩存');
    }

    /**
     * 獲取緩存統計
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            pendingRequests: this.pendingRequests.size,
            lastRequestTime: this.lastRequestTime
        };
    }
}

// 創建全局實例
const geminiCache = new GeminiServiceCache();

// 定期清理過期緩存（每小時一次）
setInterval(() => {
    geminiCache.clearExpired();
}, 60 * 60 * 1000);

// Export
if (typeof window !== 'undefined') {
    window.GeminiServiceCache = GeminiServiceCache;
    window.geminiCache = geminiCache;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GeminiServiceCache, geminiCache };
}



