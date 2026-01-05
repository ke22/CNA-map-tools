/**
 * Chinese Labels Data - 中文标签数据
 * 
 * 提供常用地区的中文翻译
 */

// 中文标签数据
const CHINESE_LABELS = {
    // 中国省份
    'Anhui': '安徽',
    'Beijing': '北京',
    'Chongqing': '重庆',
    'Fujian': '福建',
    'Gansu': '甘肃',
    'Guangdong': '广东',
    'Guangxi': '广西',
    'Guizhou': '贵州',
    'Hainan': '海南',
    'Hebei': '河北',
    'Heilongjiang': '黑龙江',
    'Henan': '河南',
    'Hubei': '湖北',
    'Hunan': '湖南',
    'Inner Mongolia': '内蒙古',
    'Jiangsu': '江苏',
    'Jiangxi': '江西',
    'Jilin': '吉林',
    'Liaoning': '辽宁',
    'Ningxia': '宁夏',
    'Qinghai': '青海',
    'Shaanxi': '陕西',
    'Shandong': '山东',
    'Shanghai': '上海',
    'Shanxi': '山西',
    'Sichuan': '四川',
    'Taiwan': '台湾',
    'Tianjin': '天津',
    'Tibet': '西藏',
    'Xinjiang': '新疆',
    'Yunnan': '云南',
    'Zhejiang': '浙江',

    // 香港、澳门
    'Hong Kong': '香港',
    'Macao': '澳门',
    'Macau': '澳门',

    // 主要国家
    'China': '中国',
    'United States': '美国',
    'United Kingdom': '英国',
    'Japan': '日本',
    'South Korea': '韩国',
    'North Korea': '朝鲜',
    'Vietnam': '越南',
    'Thailand': '泰国',
    'Singapore': '新加坡',
    'Malaysia': '马来西亚',
    'Indonesia': '印度尼西亚',
    'Philippines': '菲律宾',
    'India': '印度',
    'Pakistan': '巴基斯坦',
    'Bangladesh': '孟加拉国',
    'Myanmar': '缅甸',
    'Cambodia': '柬埔寨',
    'Laos': '老挝',
    'Mongolia': '蒙古',
    'Russia': '俄罗斯',
    'Kazakhstan': '哈萨克斯坦',
    'Uzbekistan': '乌兹别克斯坦',
    'Turkmenistan': '土库曼斯坦',
    'Kyrgyzstan': '吉尔吉斯斯坦',
    'Tajikistan': '塔吉克斯坦',
    'Afghanistan': '阿富汗',
    'Iran': '伊朗',
    'Iraq': '伊拉克',
    'Saudi Arabia': '沙特阿拉伯',
    'Turkey': '土耳其',
    'Israel': '以色列',
    'Egypt': '埃及',
    'South Africa': '南非',
    'Nigeria': '尼日利亚',
    'Kenya': '肯尼亚',
    'Ethiopia': '埃塞俄比亚',
    'Germany': '德国',
    'France': '法国',
    'Italy': '意大利',
    'Spain': '西班牙',
    'Portugal': '葡萄牙',
    'Netherlands': '荷兰',
    'Belgium': '比利时',
    'Switzerland': '瑞士',
    'Austria': '奥地利',
    'Poland': '波兰',
    'Ukraine': '乌克兰',
    'Sweden': '瑞典',
    'Norway': '挪威',
    'Denmark': '丹麦',
    'Finland': '芬兰',
    'Greece': '希腊',
    'Canada': '加拿大',
    'Mexico': '墨西哥',
    'Brazil': '巴西',
    'Argentina': '阿根廷',
    'Chile': '智利',
    'Peru': '秘鲁',
    'Colombia': '哥伦比亚',
    'Venezuela': '委内瑞拉',
    'Australia': '澳大利亚',
    'New Zealand': '新西兰',

    // 美国主要州
    'California': '加利福尼亚',
    'Texas': '德克萨斯',
    'Florida': '佛罗里达',
    'New York': '纽约',
    'Pennsylvania': '宾夕法尼亚',
    'Illinois': '伊利诺伊',
    'Ohio': '俄亥俄',
    'Georgia': '佐治亚',
    'North Carolina': '北卡罗来纳',
    'Michigan': '密歇根',
    'New Jersey': '新泽西',
    'Virginia': '弗吉尼亚',
    'Washington': '华盛顿',
    'Arizona': '亚利桑那',
    'Massachusetts': '马萨诸塞',
    'Tennessee': '田纳西',
    'Indiana': '印第安纳',
    'Missouri': '密苏里',
    'Maryland': '马里兰',
    'Wisconsin': '威斯康星',
    'Colorado': '科罗拉多',
    'Minnesota': '明尼苏达',
    'South Carolina': '南卡罗来纳',
    'Alabama': '阿拉巴马',
    'Louisiana': '路易斯安那',
    'Kentucky': '肯塔基',
    'Oregon': '俄勒冈',
    'Oklahoma': '俄克拉荷马',
    'Connecticut': '康涅狄格',
    'Utah': '犹他',
    'Iowa': '爱荷华',
    'Nevada': '内华达',
    'Arkansas': '阿肯色',
    'Mississippi': '密西西比',
    'Kansas': '堪萨斯',
    'New Mexico': '新墨西哥',
    'Nebraska': '内布拉斯加',
    'West Virginia': '西弗吉尼亚',
    'Idaho': '爱达荷',
    'Hawaii': '夏威夷',
    'New Hampshire': '新罕布什尔',
    'Maine': '缅因',
    'Montana': '蒙大拿',
    'Rhode Island': '罗德岛',
    'Delaware': '特拉华',
    'South Dakota': '南达科他',
    'North Dakota': '北达科他',
    'Alaska': '阿拉斯加',
    'Vermont': '佛蒙特',
    'Wyoming': '怀俄明',

    // 主要城市
    'Beijing': '北京',
    'Shanghai': '上海',
    'Guangzhou': '广州',
    'Shenzhen': '深圳',
    'Chengdu': '成都',
    'Chongqing': '重庆',
    'Tianjin': '天津',
    'Wuhan': '武汉',
    'Hangzhou': '杭州',
    'Nanjing': '南京',
    'Xi\'an': '西安',
    'Suzhou': '苏州',
    'Qingdao': '青岛',
    'Dalian': '大连',
    'Xiamen': '厦门',
    'Ningbo': '宁波',
    'Changsha': '长沙',
    'Zhengzhou': '郑州',
    'Jinan': '济南',
    'Harbin': '哈尔滨',
    'Shenyang': '沈阳',
    'Changchun': '长春',
    'Kunming': '昆明',
    'Fuzhou': '福州',
    'Hefei': '合肥',
    'Nanchang': '南昌',
    'Taiyuan': '太原',
    'Shijiazhuang': '石家庄',
    'Nanning': '南宁',
    'Guiyang': '贵阳',
    'Lanzhou': '兰州',
    'Urumqi': '乌鲁木齐',
    'Hohhot': '呼和浩特',
    'Yinchuan': '银川',
    'Xining': '西宁',
    'Lhasa': '拉萨',
    'Haikou': '海口',
    'Taipei': '台北',
    'Kaohsiung': '高雄',
    'Taichung': '台中',
    'Tainan': '台南',

    // 其他常用地名
    'East China Sea': '东海',
    'South China Sea': '南海',
    'Yellow Sea': '黄海',
    'Bohai Sea': '渤海',
    'Yangtze River': '长江',
    'Yellow River': '黄河',
    'Pearl River': '珠江',
    'Mekong River': '湄公河',
    'Himalaya': '喜马拉雅',
    'Tibetan Plateau': '青藏高原'
};

/**
 * 获取中文标签
 * @param {string} name - 英文名称
 * @returns {string} - 中文名称（如果存在）或原名称
 */
function getChineseLabel(name) {
    if (!name) return name;

    // 直接查找
    if (CHINESE_LABELS[name]) {
        return CHINESE_LABELS[name];
    }

    // 尝试不区分大小写查找
    const lowerName = name.toLowerCase();
    for (const [key, value] of Object.entries(CHINESE_LABELS)) {
        if (key.toLowerCase() === lowerName) {
            return value;
        }
    }

    // 尝试部分匹配（例如 "Guangdong Province" -> "广东"）
    for (const [key, value] of Object.entries(CHINESE_LABELS)) {
        if (name.includes(key) || key.includes(name)) {
            return value;
        }
    }

    // 如果没有找到，返回原名称
    return name;
}

/**
 * 获取区域标签（别名）
 * @param {string} name - 区域名称
 * @returns {string} - 标签文本
 */
function getAreaLabel(name) {
    return getChineseLabel(name);
}

/**
 * 翻译为中文（别名）
 * @param {string} name - 英文名称
 * @returns {string} - 中文名称
 */
function translateToChinese(name) {
    return getChineseLabel(name);
}

/**
 * 批量获取中文标签
 * @param {Array<string>} names - 英文名称数组
 * @returns {Object} - { 英文名: 中文名 }
 */
function getChineseLabels(names) {
    const result = {};
    for (const name of names) {
        result[name] = getChineseLabel(name);
    }
    return result;
}

/**
 * 添加自定义中文标签
 * @param {string} englishName - 英文名称
 * @param {string} chineseName - 中文名称
 */
function addChineseLabel(englishName, chineseName) {
    CHINESE_LABELS[englishName] = chineseName;
    console.log(`✅ Added Chinese label: ${englishName} -> ${chineseName}`);
}

/**
 * 检查是否有中文标签
 * @param {string} name - 名称
 * @returns {boolean}
 */
function hasChineseLabel(name) {
    return CHINESE_LABELS[name] !== undefined;
}

// 导出到全局
window.CHINESE_LABELS = CHINESE_LABELS;
window.getChineseLabel = getChineseLabel;
window.getAreaLabel = getAreaLabel;
window.translateToChinese = translateToChinese;
window.getChineseLabels = getChineseLabels;
window.addChineseLabel = addChineseLabel;
window.hasChineseLabel = hasChineseLabel;

// 也保存到 window.chineseLabels（小写，用于兼容性）
window.chineseLabels = CHINESE_LABELS;
window.labelTranslations = CHINESE_LABELS;

console.log('✅ Chinese labels data loaded:', Object.keys(CHINESE_LABELS).length, 'entries');
