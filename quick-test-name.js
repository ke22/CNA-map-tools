/**
 * ⚡ 快速測試名稱獲取
 * 在控制台運行此腳本快速測試
 */

// 1. 獲取台灣特徵
const source = appState.map.getSource('gadm-country');
const taiwan = source._data.features.find(f => f.properties?.GID_0 === 'TWN');

console.log('=== 台灣特徵屬性 ===');
console.log(taiwan.properties);

// 2. 測試名稱獲取
console.log('\n=== 測試名稱獲取 ===');

// 測試 getAreaName
if (typeof getAreaName === 'function') {
    const name = getAreaName(taiwan, 'country');
    console.log('getAreaName() 結果:', name);
}

// 測試 GADM_LOADER
if (window.GADM_LOADER && window.GADM_LOADER.getAreaName) {
    const name2 = window.GADM_LOADER.getAreaName(taiwan, 'country');
    console.log('GADM_LOADER.getAreaName() 結果:', name2);
}

// 測試 COUNTRY_CODES
if (typeof COUNTRY_CODES !== 'undefined' && COUNTRY_CODES['TWN']) {
    console.log('COUNTRY_CODES["TWN"]:', COUNTRY_CODES['TWN']);
}

