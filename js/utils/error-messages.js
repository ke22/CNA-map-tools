/**
 * Unified Error Message System
 * Provides user-friendly error messages with actionable solutions
 */

/**
 * Error message templates
 */
const ERROR_MESSAGES = {
    // Map/Data Loading Errors
    'MAP_LOAD_FAILED': {
        title: '地图加载失败',
        message: '无法加载地图。请检查网络连接或刷新页面。',
        action: '刷新页面',
        type: 'error'
    },
    'BOUNDARY_LOAD_FAILED': {
        title: '边界数据加载失败',
        message: '无法加载边界数据。数据文件可能不存在或损坏。',
        action: '检查数据文件',
        type: 'error'
    },
    'GADM_LOAD_FAILED': {
        title: 'GADM数据加载失败',
        message: '无法加载GADM边界数据。请检查数据文件是否存在。',
        action: '检查 data/gadm/optimized/ 目录',
        type: 'error'
    },
    
    // Search/Selection Errors
    'AREA_NOT_FOUND': {
        title: '区域未找到',
        message: '无法找到指定的区域。请尝试使用不同的搜索词。',
        action: '尝试其他搜索词',
        type: 'warning'
    },
    'INVALID_COORDINATES': {
        title: '坐标格式错误',
        message: '坐标格式不正确。请使用格式：25.0330,121.5654 (纬度,经度)',
        action: '检查坐标格式',
        type: 'error'
    },
    'SEARCH_FAILED': {
        title: '搜索失败',
        message: '搜索时出现错误。请检查网络连接后重试。',
        action: '重试搜索',
        type: 'error'
    },
    
    // API Errors
    'MAPBOX_TOKEN_INVALID': {
        title: 'Mapbox Token无效',
        message: 'Mapbox访问令牌无效或已过期。请在 config.js 中配置有效的令牌。',
        action: '检查 config.js 配置',
        type: 'error'
    },
    'GEMINI_API_ERROR': {
        title: 'AI分析失败',
        message: 'AI分析服务暂时不可用。请稍后再试或检查API配置。',
        action: '检查 .env 文件中的 GEMINI_API_KEY',
        type: 'error'
    },
    'GEOCODING_FAILED': {
        title: '地理编码失败',
        message: '无法获取位置信息。请检查网络连接或使用坐标输入。',
        action: '使用坐标输入 (纬度,经度)',
        type: 'warning'
    },
    
    // Export Errors
    'EXPORT_FAILED': {
        title: '导出失败',
        message: '无法导出地图。请检查浏览器是否支持Canvas API。',
        action: '使用现代浏览器重试',
        type: 'error'
    },
    'EXPORT_TIMEOUT': {
        title: '导出超时',
        message: '导出操作超时。请尝试降低分辨率或缩小地图范围。',
        action: '降低DPI或缩小地图',
        type: 'warning'
    },
    
    // General Errors
    'UNKNOWN_ERROR': {
        title: '发生错误',
        message: '操作时出现未知错误。请刷新页面后重试。',
        action: '刷新页面',
        type: 'error'
    },
    'NETWORK_ERROR': {
        title: '网络错误',
        message: '网络连接失败。请检查网络连接后重试。',
        action: '检查网络连接',
        type: 'error'
    }
};

/**
 * Get user-friendly error message
 * @param {string} errorKey - Error key from ERROR_MESSAGES
 * @param {Object} context - Additional context (e.g., {areaType: 'country', fileName: '...'})
 * @returns {Object} Error message object with title, message, action, and type
 */
function getErrorMessage(errorKey, context = {}) {
    const template = ERROR_MESSAGES[errorKey] || ERROR_MESSAGES.UNKNOWN_ERROR;
    
    // Replace placeholders in message
    let message = template.message;
    if (context.areaType) {
        const areaTypeNames = {
            'country': '國家',
            'state': '州/省',
            'city': '城市'
        };
        message = message.replace('{areaType}', areaTypeNames[context.areaType] || context.areaType);
    }
    if (context.fileName) {
        message = message.replace('{fileName}', context.fileName);
    }
    if (context.details) {
        message = `${message} ${context.details}`;
    }
    
    return {
        title: template.title,
        message: message,
        action: template.action,
        type: template.type
    };
}

/**
 * Show user-friendly error message using toast notification
 * @param {string} errorKey - Error key from ERROR_MESSAGES
 * @param {Object} context - Additional context
 * @param {number} duration - Toast duration in milliseconds (default: 5000)
 */
function showErrorToast(errorKey, context = {}, duration = 5000) {
    const error = getErrorMessage(errorKey, context);
    
    if (typeof showToast === 'function') {
        showToast(`${error.title}: ${error.message} (${error.action})`, error.type, duration);
    } else {
        console.error(`[${error.type.toUpperCase()}] ${error.title}: ${error.message}`);
        console.log(`建议操作: ${error.action}`);
    }
}

/**
 * Show user-friendly error message in console (for debugging)
 * @param {string} errorKey - Error key from ERROR_MESSAGES
 * @param {Object} context - Additional context
 * @param {Error} originalError - Original error object (optional)
 */
function logError(errorKey, context = {}, originalError = null) {
    const error = getErrorMessage(errorKey, context);
    
    console.error(`[${error.type.toUpperCase()}] ${error.title}: ${error.message}`);
    console.log(`建议操作: ${error.action}`);
    
    if (originalError) {
        console.error('原始错误:', originalError);
    }
}

/**
 * Show user-friendly success message
 * @param {string} message - Success message
 * @param {number} duration - Toast duration in milliseconds (default: 3000)
 */
function showSuccessToast(message, duration = 3000) {
    if (typeof showToast === 'function') {
        showToast(message, 'success', duration);
    } else {
        console.log(`[SUCCESS] ${message}`);
    }
}

/**
 * Show user-friendly info message
 * @param {string} message - Info message
 * @param {number} duration - Toast duration in milliseconds (default: 3000)
 */
function showInfoToast(message, duration = 3000) {
    if (typeof showToast === 'function') {
        showToast(message, 'info', duration);
    } else {
        console.log(`[INFO] ${message}`);
    }
}

// Export functions
if (typeof window !== 'undefined') {
    window.ErrorMessages = {
        getErrorMessage,
        showErrorToast,
        logError,
        showSuccessToast,
        showInfoToast,
        ERROR_MESSAGES
    };
}

// Export for Node.js (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getErrorMessage,
        showErrorToast,
        logError,
        showSuccessToast,
        showInfoToast,
        ERROR_MESSAGES
    };
}

