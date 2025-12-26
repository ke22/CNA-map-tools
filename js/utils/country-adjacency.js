/**
 * Country Adjacency Data
 * 
 * Stores which countries share borders
 * Used for assigning different colors to adjacent countries
 */

// 已知的相邻国家关系（ISO 3166-1 alpha-3 代码）
// 格式: 'ISO1-ISO2': true (无方向，对称关系)
const COUNTRY_ADJACENCY = {
    // 南高加索地区
    'ARM-AZE': true,  // 亚美尼亚 - 亚塞拜然
    'ARM-GEO': true,  // 亚美尼亚 - 乔治亚
    'ARM-IRN': true,  // 亚美尼亚 - 伊朗
    'ARM-TUR': true,  // 亚美尼亚 - 土耳其
    'AZE-GEO': true,  // 亚塞拜然 - 乔治亚
    'AZE-IRN': true,  // 亚塞拜然 - 伊朗
    'AZE-RUS': true,  // 亚塞拜然 - 俄罗斯
    'AZE-TUR': true,  // 亚塞拜然 - 土耳其
    'GEO-RUS': true,  // 乔治亚 - 俄罗斯
    'GEO-TUR': true,  // 乔治亚 - 土耳其
    'IRN-TUR': true,  // 伊朗 - 土耳其
    'IRN-IRQ': true,  // 伊朗 - 伊拉克
    'IRN-AFG': true,  // 伊朗 - 阿富汗
    'IRN-PAK': true,  // 伊朗 - 巴基斯坦
    
    // 东亚地区
    'CHN-TWN': true,  // 中国 - 台湾（海峡分隔，视为相邻以区分颜色）
    'CHN-HKG': true,  // 中国 - 香港
    'CHN-MAC': true,  // 中国 - 澳门
    'CHN-JPN': true,  // 中国 - 日本（海域分隔）
    'CHN-KOR': true,  // 中国 - 韩国（海域分隔）
    'CHN-PRK': true,  // 中国 - 朝鲜
    'CHN-RUS': true,  // 中国 - 俄罗斯
    'CHN-MNG': true,  // 中国 - 蒙古
    'CHN-KAZ': true,  // 中国 - 哈萨克斯坦
    'CHN-KGZ': true,  // 中国 - 吉尔吉斯斯坦
    'CHN-TJK': true,  // 中国 - 塔吉克斯坦
    'CHN-AFG': true,  // 中国 - 阿富汗
    'CHN-PAK': true,  // 中国 - 巴基斯坦
    'CHN-IND': true,  // 中国 - 印度
    'CHN-NPL': true,  // 中国 - 尼泊尔
    'CHN-BTN': true,  // 中国 - 不丹
    'CHN-MMR': true,  // 中国 - 缅甸
    'CHN-LAO': true,  // 中国 - 老挝
    'CHN-VNM': true,  // 中国 - 越南
    
    // 欧洲
    'FRA-DEU': true,  // 法国 - 德国
    'FRA-ESP': true,  // 法国 - 西班牙
    'FRA-ITA': true,  // 法国 - 意大利
    'DEU-POL': true,  // 德国 - 波兰
    'DEU-CZE': true,  // 德国 - 捷克
    'DEU-AUT': true,  // 德国 - 奥地利
    'UKR-RUS': true,  // 乌克兰 - 俄罗斯
    'UKR-POL': true,  // 乌克兰 - 波兰
    'UKR-SVK': true,  // 乌克兰 - 斯洛伐克
    'UKR-HUN': true,  // 乌克兰 - 匈牙利
    'UKR-ROU': true,  // 乌克兰 - 罗马尼亚
    'UKR-MDA': true,  // 乌克兰 - 摩尔多瓦
    
    // 中东
    'ISR-PSE': true,  // 以色列 - 巴勒斯坦
    'ISR-JOR': true,  // 以色列 - 约旦
    'ISR-LBN': true,  // 以色列 - 黎巴嫩
    'ISR-SYR': true,  // 以色列 - 叙利亚
    'SAU-IRQ': true,  // 沙特阿拉伯 - 伊拉克
    'SAU-YEM': true,  // 沙特阿拉伯 - 也门
    
    // 更多相邻关系可以根据需要添加...
};

/**
 * 检查两个国家是否相邻
 * @param {string} iso1 - 第一个国家的 ISO 3166-1 alpha-3 代码
 * @param {string} iso2 - 第二个国家的 ISO 3166-1 alpha-3 代码
 * @returns {boolean} - 如果两个国家相邻，返回 true
 */
function areCountriesAdjacent(iso1, iso2) {
    if (!iso1 || !iso2) return false;
    
    const code1 = iso1.toUpperCase();
    const code2 = iso2.toUpperCase();
    
    if (code1 === code2) return false; // 同一国家不算相邻
    
    // 检查两个方向的组合
    const key1 = `${code1}-${code2}`;
    const key2 = `${code2}-${code1}`;
    
    return COUNTRY_ADJACENCY[key1] === true || COUNTRY_ADJACENCY[key2] === true;
}

/**
 * 为区域列表分配颜色，确保相邻国家使用不同颜色
 * @param {Array} areas - 区域列表，每个区域需要有 iso_code 字段
 * @param {Array} presetColors - 预设颜色数组
 * @returns {Array} - 分配了颜色的区域列表
 */
function assignColorsToAdjacentCountries(areas, presetColors = ['#6CA7A1', '#496F96', '#E05C5A', '#EDBD76', '#E8DFCF', '#B5CBCD']) {
    if (!areas || areas.length === 0) return areas;
    
    // 创建颜色分配映射
    const colorAssignments = new Map(); // key: ISO code, value: color index
    
    // 为每个区域分配颜色
    areas.forEach((area, index) => {
        const isoCode = area.iso_code;
        if (!isoCode) {
            // 如果没有 ISO 代码，使用索引分配
            area.presetColor = presetColors[index % presetColors.length];
            return;
        }
        
        // 查找已分配颜色的相邻国家
        const usedColorIndices = new Set();
        areas.slice(0, index).forEach(prevArea => {
            if (prevArea.iso_code && areCountriesAdjacent(isoCode, prevArea.iso_code)) {
                const prevColorIndex = colorAssignments.get(prevArea.iso_code);
                if (prevColorIndex !== undefined) {
                    usedColorIndices.add(prevColorIndex);
                }
            }
        });
        
        // 选择未使用的颜色索引
        let colorIndex = 0;
        for (let i = 0; i < presetColors.length; i++) {
            if (!usedColorIndices.has(i)) {
                colorIndex = i;
                break;
            }
        }
        // 如果所有颜色都被相邻国家使用，使用第一个颜色（回退）
        
        colorAssignments.set(isoCode, colorIndex);
        area.presetColor = presetColors[colorIndex];
    });
    
    return areas;
}

// Export
if (typeof window !== 'undefined') {
    window.areCountriesAdjacent = areCountriesAdjacent;
    window.assignColorsToAdjacentCountries = assignColorsToAdjacentCountries;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        areCountriesAdjacent,
        assignColorsToAdjacentCountries,
        COUNTRY_ADJACENCY
    };
}
