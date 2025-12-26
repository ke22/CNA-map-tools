/**
 * Geographic Synonym Mapping
 * 
 * 語義映射表：處理地區別名和同義詞
 * 支持多對多映射（一個別名可能對應多個實體）
 */

const SYNONYM_MAP = {
    // 納卡地區相關（涉及多個國家）
    "納卡區": {
        canonical: "Nagorno-Karabakh",
        entities: ["ARM", "AZE"],  // 涉及亞美尼亞和亞塞拜然
        type: "region",
        description: "納戈爾諾-卡拉巴赫地區"
    },
    "納戈爾諾-卡拉巴赫": {
        canonical: "Nagorno-Karabakh",
        entities: ["ARM", "AZE"],
        type: "region",
        aliases: ["納卡區", "Artsakh", "阿爾察赫"]
    },
    "納戈爾諾卡拉巴赫": {
        canonical: "Nagorno-Karabakh",
        entities: ["ARM", "AZE"],
        type: "region",
        aliases: ["納卡區", "Artsakh", "阿爾察赫"]
    },
    "阿爾察赫": {
        canonical: "Artsakh",
        entities: ["ARM"],
        type: "region",
        aliases: ["納卡區", "Nagorno-Karabakh", "納戈爾諾-卡拉巴赫"]
    },
    "Artsakh": {
        canonical: "Artsakh",
        entities: ["ARM"],
        type: "region",
        aliases: ["納卡區", "Nagorno-Karabakh", "阿爾察赫"]
    },
    "Nagorno-Karabakh": {
        canonical: "Nagorno-Karabakh",
        entities: ["ARM", "AZE"],
        type: "region",
        aliases: ["納卡區", "Artsakh", "阿爾察赫"]
    },
    
    // 國家別名擴展（補充現有的 countryMap）
    "亞塞拜然": {
        canonical: "Azerbaijan",
        entities: ["AZE"],
        type: "country",
        aliases: ["阿塞拜疆", "Azerbaijan"]
    },
    "阿塞拜疆": {
        canonical: "Azerbaijan",
        entities: ["AZE"],
        type: "country",
        aliases: ["亞塞拜然", "Azerbaijan"]
    },
    "Azerbaijan": {
        canonical: "Azerbaijan",
        entities: ["AZE"],
        type: "country",
        aliases: ["亞塞拜然", "阿塞拜疆"]
    },
    "亞美尼亞": {
        canonical: "Armenia",
        entities: ["ARM"],
        type: "country",
        aliases: ["Armenia"]
    },
    "Armenia": {
        canonical: "Armenia",
        entities: ["ARM"],
        type: "country",
        aliases: ["亞美尼亞"]
    },
    "土耳其": {
        canonical: "Turkey",
        entities: ["TUR"],
        type: "country",
        aliases: ["Turkey"]
    },
    "Turkey": {
        canonical: "Turkey",
        entities: ["TUR"],
        type: "country",
        aliases: ["土耳其"]
    },
    "伊朗": {
        canonical: "Iran",
        entities: ["IRN"],
        type: "country",
        aliases: ["Iran", "Islamic Republic of Iran", "伊朗伊斯蘭共和國"]
    },
    "Iran": {
        canonical: "Iran",
        entities: ["IRN"],
        type: "country",
        aliases: ["伊朗", "Islamic Republic of Iran"]
    },
    "喬治亞": {
        canonical: "Georgia",
        entities: ["GEO"],
        type: "country",
        aliases: ["Georgia", "格鲁吉亚", "格魯吉亞"]
    },
    "Georgia": {
        canonical: "Georgia",
        entities: ["GEO"],
        type: "country",
        aliases: ["喬治亞", "格鲁吉亚", "格魯吉亞"]
    },
    "台灣": {
        canonical: "Taiwan",
        entities: ["TWN"],
        type: "country",
        aliases: ["臺灣", "Republic of China", "ROC"]
    },
    "臺灣": {
        canonical: "Taiwan",
        entities: ["TWN"],
        type: "country",
        aliases: ["台灣", "Republic of China", "ROC"]
    },
    "Taiwan": {
        canonical: "Taiwan",
        entities: ["TWN"],
        type: "country",
        aliases: ["台灣", "臺灣", "Republic of China", "ROC"]
    },
    "ROC": {
        canonical: "Taiwan",
        entities: ["TWN"],
        type: "country",
        aliases: ["台灣", "臺灣", "Taiwan", "Republic of China"]
    },
    
    "中國": {
        canonical: "China",
        entities: ["CHN"],
        type: "country",
        aliases: ["中华人民共和国", "PRC", "People's Republic of China"]
    },
    "China": {
        canonical: "China",
        entities: ["CHN"],
        type: "country",
        aliases: ["中國", "中华人民共和国", "PRC"]
    },
    "PRC": {
        canonical: "China",
        entities: ["CHN"],
        type: "country",
        aliases: ["中國", "China", "中华人民共和国"]
    },
    
    "美國": {
        canonical: "United States",
        entities: ["USA"],
        type: "country",
        aliases: ["United States of America", "US", "U.S.", "U.S.A."]
    },
    "United States": {
        canonical: "United States",
        entities: ["USA"],
        type: "country",
        aliases: ["美國", "United States of America", "US", "U.S.A."]
    },
    "US": {
        canonical: "United States",
        entities: ["USA"],
        type: "country",
        aliases: ["美國", "United States", "United States of America", "U.S."]
    },
    
    "英國": {
        canonical: "United Kingdom",
        entities: ["GBR"],
        type: "country",
        aliases: ["United Kingdom of Great Britain and Northern Ireland", "UK", "U.K.", "Britain", "Great Britain"]
    },
    "United Kingdom": {
        canonical: "United Kingdom",
        entities: ["GBR"],
        type: "country",
        aliases: ["英國", "UK", "Britain", "Great Britain"]
    },
    "UK": {
        canonical: "United Kingdom",
        entities: ["GBR"],
        type: "country",
        aliases: ["英國", "United Kingdom", "Britain", "Great Britain"]
    },
    
    "俄羅斯": {
        canonical: "Russia",
        entities: ["RUS"],
        type: "country",
        aliases: ["Russian Federation", "Russian", "Россия"]
    },
    "Russia": {
        canonical: "Russia",
        entities: ["RUS"],
        type: "country",
        aliases: ["俄羅斯", "Russian Federation", "Russian"]
    },
    "Russian Federation": {
        canonical: "Russia",
        entities: ["RUS"],
        type: "country",
        aliases: ["俄羅斯", "Russia", "Russian"]
    },
    
    "韓國": {
        canonical: "South Korea",
        entities: ["KOR"],
        type: "country",
        aliases: ["Republic of Korea", "ROK", "South Korea", "大韓民國"]
    },
    "South Korea": {
        canonical: "South Korea",
        entities: ["KOR"],
        type: "country",
        aliases: ["韓國", "Republic of Korea", "ROK", "Korea"]
    },
    "Korea": {
        canonical: "South Korea",
        entities: ["KOR"],
        type: "country",
        aliases: ["韓國", "South Korea", "Republic of Korea", "ROK"]
    },
    
    // 地區別名（非國家）
    "南高加索地區": {
        canonical: "South Caucasus",
        entities: ["ARM", "AZE", "GEO"],  // 涉及多個國家
        type: "region",
        description: "包括亞美尼亞、亞塞拜然、喬治亞",
        aliases: ["South Caucasus", "外高加索"]
    },
    "South Caucasus": {
        canonical: "South Caucasus",
        entities: ["ARM", "AZE", "GEO"],
        type: "region",
        aliases: ["南高加索地區", "外高加索"]
    },
    "外高加索": {
        canonical: "South Caucasus",
        entities: ["ARM", "AZE", "GEO"],
        type: "region",
        aliases: ["南高加索地區", "South Caucasus"]
    },
    
    "中東地區": {
        canonical: "Middle East",
        entities: ["SAU", "IRN", "IRQ", "ISR", "ARE", "KWT", "QAT", "BHR", "OMN", "YEM", "JOR", "LBN", "SYR"],  // 中東多個國家
        type: "region",
        description: "中東地區包括多個國家",
        aliases: ["Middle East", "中東"]
    },
    "Middle East": {
        canonical: "Middle East",
        entities: ["SAU", "IRN", "IRQ", "ISR", "ARE", "KWT", "QAT", "BHR", "OMN", "YEM", "JOR", "LBN", "SYR"],
        type: "region",
        aliases: ["中東地區", "中東"]
    }
};

/**
 * 查找別名對應的標準名稱和實體
 * @param {string} name - 輸入的名稱
 * @returns {Object|null} - 映射結果 {canonical, entities, type, aliases}
 */
function resolveSynonym(name) {
    if (!name || typeof name !== 'string') {
        return null;
    }
    
    const normalizedName = name.trim();
    
    // 直接匹配
    if (SYNONYM_MAP[normalizedName]) {
        return SYNONYM_MAP[normalizedName];
    }
    
    // 大小寫不敏感匹配
    const lowerName = normalizedName.toLowerCase();
    for (const [key, value] of Object.entries(SYNONYM_MAP)) {
        if (key.toLowerCase() === lowerName) {
            return value;
        }
    }
    
    // 檢查是否在別名列表中
    for (const [key, value] of Object.entries(SYNONYM_MAP)) {
        if (value.aliases && Array.isArray(value.aliases)) {
            if (value.aliases.some(alias => 
                alias.toLowerCase() === lowerName || alias === normalizedName
            )) {
                return value;
            }
        }
    }
    
    return null;
}

/**
 * 獲取所有相關的別名
 * @param {string} canonical - 標準名稱
 * @returns {string[]} - 別名列表
 */
function getAliases(canonical) {
    const result = [];
    for (const [key, value] of Object.entries(SYNONYM_MAP)) {
        if (value.canonical === canonical || key === canonical) {
            result.push(key);
            if (value.aliases) {
                result.push(...value.aliases);
            }
        }
    }
    return [...new Set(result)]; // 去重
}

/**
 * 檢查名稱是否需要分解為多個實體（如納卡區 → ARM + AZE）
 * @param {string} name - 輸入的名稱
 * @returns {string[]|null} - ISO 代碼列表，如果不需要分解則返回 null
 */
function getDecomposedEntities(name) {
    const synonym = resolveSynonym(name);
    if (synonym && synonym.entities && synonym.entities.length > 1) {
        return synonym.entities;
    }
    return null;
}

// Export
if (typeof window !== 'undefined') {
    window.SYNONYM_MAP = SYNONYM_MAP;
    window.resolveSynonym = resolveSynonym;
    window.getAliases = getAliases;
    window.getDecomposedEntities = getDecomposedEntities;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SYNONYM_MAP,
        resolveSynonym,
        getAliases,
        getDecomposedEntities
    };
}

