/**
 * Agent-Ready Map Tool - Data Schema Definitions
 * 
 * 核心數據結構：確保 Agent 和 Renderer 之間的契約一致
 */

// ============================================================================
// 1. GeoTarget Schema（候選地點/區域清單）
// ============================================================================

/**
 * @typedef {Object} GeoTarget
 * @property {string} id - 唯一識別碼（自動生成）
 * @property {'region'|'place'} type - 區域（國家/行政區）或地點（城市/地標）
 * @property {string} name - 原始名稱（從新聞稿抽取）
 * @property {number} confidence - 信心度 0-1
 * @property {string} evidence_span - 新聞稿中的證據片段
 * @property {number} evidence_start - 證據起始位置
 * @property {number} evidence_end - 證據結束位置
 * @property {Object} resolved - 解析後的標準化資訊
 * @property {string} [resolved.iso_code] - ISO 國家代碼（如果是國家）
 * @property {string} [resolved.admin_level] - admin0/admin1/admin2
 * @property {number} [resolved.lat] - 緯度（如果是地點）
 * @property {number} [resolved.lon] - 經度（如果是地點）
 * @property {Object} [resolved.gadm_id] - GADM ID（如果可用）
 * @property {boolean} [resolved.needs_review] - 是否需要人工審查
 * @property {string} [resolved.suggestion] - 建議訊息
 */

/**
 * @typedef {Object} GeoTargets
 * @property {string} source_text - 原始新聞稿
 * @property {string} source_url - 來源 URL（如果有）
 * @property {string} timestamp - 生成時間戳
 * @property {GeoTarget[]} candidates - 候選清單
 * @property {string[]} selected_ids - 使用者選中的 ID 列表
 */

// ============================================================================
// 2. Map Spec Schema（地圖規格）
// ============================================================================

/**
 * @typedef {Object} MapBounds
 * @property {number} west - 西經
 * @property {number} east - 東經
 * @property {number} south - 南緯
 * @property {number} north - 北緯
 */

/**
 * @typedef {Object} MapLayer
 * @property {string} id - 圖層 ID
 * @property {'boundary'|'choropleth'|'point'|'label'|'highlight'} type - 圖層類型
 * @property {Object} source - 資料來源配置
 * @property {string} source.type - 來源類型（mapbox|geojson）
 * @property {string} [source.source_id] - Mapbox source ID
 * @property {Object} [source.data] - GeoJSON 資料
 * @property {Object} style - 圖層樣式
 * @property {Object} [filter] - 過濾條件
 * @property {string} [filter.field] - 過濾欄位
 * @property {string} [filter.operator] - 操作符（in, ==, != 等）
 * @property {Array} [filter.values] - 過濾值
 */

/**
 * @typedef {Object} MapSpec
 * @property {string} version - Spec 版本
 * @property {string} map_id - 地圖唯一 ID
 * @property {MapBounds} bounds - 地圖邊界
 * @property {MapLayer[]} layers - 圖層配置
 * @property {StyleTokens} style - 風格設定
 * @property {Object} metadata - 元數據
 * @property {string} metadata.title - 地圖標題
 * @property {string} metadata.source - 資料來源
 * @property {string} metadata.date - 日期
 * @property {string} metadata.generated_at - 生成時間
 */

// ============================================================================
// 3. Style Tokens Schema（固定風格）
// ============================================================================

/**
 * @typedef {Object} StyleTokens
 * @property {Object} colors - 色票定義
 * @property {string[]} colors.palette - 主色板
 * @property {Object} colors.semantic - 語意顏色（primary, secondary, highlight, etc.）
 * @property {Object} typography - 字體設定
 * @property {string} typography.font_family - 字體家族
 * @property {number} typography.title_size - 標題大小
 * @property {number} typography.label_size - 標籤大小
 * @property {string} typography.text_color - 文字顏色
 * @property {Object} annotations - 標註樣式
 * @property {boolean} annotations.show_callout - 是否顯示引線
 * @property {string} annotations.callout_color - 引線顏色
 * @property {number} annotations.callout_width - 引線寬度
 * @property {Object} boundaries - 邊界樣式
 * @property {string} boundaries.stroke_color - 邊界顏色
 * @property {number} boundaries.stroke_width - 邊界寬度
 * @property {string} boundaries.fill_color - 填充顏色
 */

// ============================================================================
// 4. Gazetteer Schema（地名別名表）
// ============================================================================

/**
 * @typedef {Object} GazetteerEntry
 * @property {string} canonical_name - 標準名稱
 * @property {string[]} aliases - 別名列表（中英、縮寫等）
 * @property {string} type - 類型（country, state, city, landmark）
 * @property {Object} identifiers - 識別碼
 * @property {string} [identifiers.iso] - ISO 代碼
 * @property {string} [identifiers.gadm_id] - GADM ID
 * @property {number} [identifiers.lat] - 緯度
 * @property {number} [identifiers.lon] - 經度
 * @property {Object} [disambiguation] - 消歧義資訊
 * @property {string} [disambiguation.context] - 上下文提示
 */

// ============================================================================
// 5. Agent Task Schema（Agent 任務定義）
// ============================================================================

/**
 * @typedef {Object} AgentTask
 * @property {string} task_id - 任務 ID
 * @property {'extract'|'resolve'|'style'|'validate'} type - 任務類型
 * @property {Object} input - 輸入資料
 * @property {Object} output - 輸出資料
 * @property {string} status - 狀態（pending, processing, completed, failed）
 * @property {Object} [error] - 錯誤資訊
 */

// Export types for JSDoc (實際使用時 TypeScript 更佳)
if (typeof window !== 'undefined') {
    window.MapAgentSchemas = {
        GeoTarget: 'GeoTarget',
        GeoTargets: 'GeoTargets',
        MapSpec: 'MapSpec',
        MapLayer: 'MapLayer',
        MapBounds: 'MapBounds',
        StyleTokens: 'StyleTokens',
        GazetteerEntry: 'GazetteerEntry',
        AgentTask: 'AgentTask'
    };
}



