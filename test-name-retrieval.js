/**
 * 🔍 測試名稱獲取功能
 * 
 * 在控制台運行此腳本來測試名稱獲取
 */

(function() {
    console.log('═══════════════════════════════════════════');
    console.log('🔍 測試名稱獲取功能');
    console.log('═══════════════════════════════════════════');
    
    // 1. 檢查數據
    const source = appState.map.getSource('gadm-country');
    if (!source || !source._data) {
        console.error('❌ GADM 源數據不存在');
        return;
    }
    
    const features = source._data.features || [];
    console.log(`\n📊 總共 ${features.length} 個國家特徵`);
    
    // 2. 查找台灣特徵
    const taiwan = features.find(f => f.properties?.GID_0 === 'TWN');
    if (!taiwan) {
        console.error('❌ 找不到台灣特徵');
        return;
    }
    
    console.log('\n✅ 找到台灣特徵:');
    console.log('  屬性:', taiwan.properties);
    
    // 3. 測試名稱獲取
    console.log('\n🔍 測試名稱獲取:');
    
    // 測試 getAreaName
    if (typeof getAreaName === 'function') {
        const name1 = getAreaName(taiwan, 'country');
        console.log(`   getAreaName(): "${name1}"`);
    } else {
        console.warn('   ⚠️ getAreaName 函數不存在');
    }
    
    // 測試 GADM_LOADER.getAreaName
    if (window.GADM_LOADER && window.GADM_LOADER.getAreaName) {
        const name2 = window.GADM_LOADER.getAreaName(taiwan, 'country');
        console.log(`   GADM_LOADER.getAreaName(): "${name2}"`);
    } else {
        console.warn('   ⚠️ GADM_LOADER.getAreaName 不存在');
    }
    
    // 測試 COUNTRY_CODES 映射
    if (typeof COUNTRY_CODES !== 'undefined') {
        const countryInfo = COUNTRY_CODES['TWN'];
        if (countryInfo) {
            console.log(`   COUNTRY_CODES['TWN']:`, countryInfo);
            console.log(`   名稱 (nameEn): "${countryInfo.nameEn}"`);
            console.log(`   名稱 (name): "${countryInfo.name}"`);
        } else {
            console.warn('   ⚠️ COUNTRY_CODES 中沒有 TWN');
        }
    }
    
    // 4. 測試查詢功能
    console.log('\n🔍 測試查詢功能:');
    console.log('   請點擊地圖上的台灣，然後查看控制台輸出...');
    console.log('   或者運行以下命令手動測試:');
    console.log('');
    console.log('   // 在地圖中心點測試查詢');
    console.log('   const center = appState.map.getCenter();');
    console.log('   const point = appState.map.project(center);');
    console.log('   const features = queryFeaturesAtPoint(point, "country");');
    console.log('   console.log("查詢結果:", features);');
    
    console.log('\n═══════════════════════════════════════════');
    console.log('✅ 測試完成');
    console.log('═══════════════════════════════════════════');
})();

