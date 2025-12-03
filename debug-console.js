/**
 * 🐛 完整系統診斷腳本
 * 
 * 使用方法：
 * 1. 打開瀏覽器控制台（F12）
 * 2. 複製整個文件內容
 * 3. 貼到控制台並按 Enter
 */

(function() {
    console.log('═══════════════════════════════════════════');
    console.log('🔍 完整系統診斷');
    console.log('═══════════════════════════════════════════');
    
    let issues = [];
    let successes = [];
    
    // 1. 檢查 GADM 源
    console.log('\n1️⃣ GADM 源狀態:');
    try {
        const gadmSource = appState.map.getSource('gadm-country');
        if (gadmSource) {
            const data = gadmSource._data || gadmSource._geojson;
            const featureCount = data?.features?.length || 0;
            console.log(`  ✅ GADM 國家源已加載 (${featureCount} 個國家)`);
            successes.push('GADM 源已加載');
            
            if (featureCount > 0) {
                const taiwan = data.features.find(f => f.properties?.GID_0 === 'TWN');
                if (taiwan) {
                    console.log('  ✅ 台灣特徵存在');
                    console.log('  📊 台灣屬性:', taiwan.properties);
                    successes.push('台灣特徵存在');
                } else {
                    console.log('  ⚠️ 台灣特徵不存在');
                    issues.push('台灣特徵不存在於數據中');
                }
            } else {
                issues.push('GADM 數據沒有特徵');
            }
        } else {
            console.log('  ❌ GADM 國家源未加載');
            issues.push('GADM 國家源未加載');
        }
    } catch (e) {
        console.error('  ❌ 檢查 GADM 源時出錯:', e);
        issues.push('檢查 GADM 源時出錯');
    }
    
    // 2. 檢查圖層
    console.log('\n2️⃣ 圖層狀態:');
    try {
        const layerId = 'visible-boundaries-country';
        const layer = appState.map.getLayer(layerId);
        if (layer) {
            const visibility = appState.map.getLayoutProperty(layerId, 'visibility');
            console.log(`  ✅ 圖層存在: ${layerId}`);
            console.log(`  📊 可見性: ${visibility}`);
            console.log(`  📍 源: ${layer.source}`);
            successes.push('圖層存在');
            
            if (visibility !== 'visible') {
                console.log('  ⚠️ 圖層不可見！');
                issues.push(`圖層不可見 (當前: ${visibility})`);
            } else {
                successes.push('圖層可見');
            }
        } else {
            console.log(`  ❌ 圖層不存在: ${layerId}`);
            issues.push(`圖層不存在: ${layerId}`);
        }
    } catch (e) {
        console.error('  ❌ 檢查圖層時出錯:', e);
        issues.push('檢查圖層時出錯');
    }
    
    // 3. 檢查 COUNTRY_CODES
    console.log('\n3️⃣ COUNTRY_CODES 映射表:');
    try {
        if (typeof COUNTRY_CODES !== 'undefined') {
            const codeCount = Object.keys(COUNTRY_CODES).length;
            console.log(`  ✅ 映射表已加載 (${codeCount} 個國家)`);
            successes.push('COUNTRY_CODES 映射表已加載');
            
            if (COUNTRY_CODES['TWN']) {
                console.log('  ✅ 台灣映射存在:', COUNTRY_CODES['TWN']);
                successes.push('台灣映射存在');
            } else {
                console.log('  ⚠️ 台灣映射不存在');
                issues.push('台灣映射不存在');
            }
        } else {
            console.log('  ❌ 映射表未加載');
            issues.push('COUNTRY_CODES 映射表未加載');
        }
    } catch (e) {
        console.error('  ❌ 檢查映射表時出錯:', e);
        issues.push('檢查映射表時出錯');
    }
    
    // 4. 檢查 GADM_LOADER
    console.log('\n4️⃣ GADM_LOADER:');
    try {
        if (window.GADM_LOADER) {
            console.log('  ✅ GADM_LOADER 已加載');
            successes.push('GADM_LOADER 已加載');
            
            if (window.GADM_LOADER.getAreaName) {
                console.log('  ✅ getAreaName 方法存在');
                successes.push('getAreaName 方法存在');
                
                // 測試獲取名稱
                const testFeature = {
                    properties: { 
                        GID_0: 'TWN', 
                        COUNTRY: 'Taiwan'
                    }
                };
                const name = window.GADM_LOADER.getAreaName(testFeature, 'country');
                console.log(`  ✅ 測試獲取名稱: "${name}"`);
                
                if (name && name !== 'Unknown Country') {
                    successes.push(`名稱獲取正常: ${name}`);
                } else {
                    issues.push(`名稱獲取失敗: ${name}`);
                }
            } else {
                console.log('  ❌ getAreaName 方法不存在');
                issues.push('getAreaName 方法不存在');
            }
        } else {
            console.log('  ❌ GADM_LOADER 未加載');
            issues.push('GADM_LOADER 未加載');
        }
    } catch (e) {
        console.error('  ❌ 檢查 GADM_LOADER 時出錯:', e);
        issues.push('檢查 GADM_LOADER 時出錯');
    }
    
    // 5. 檢查應用狀態
    console.log('\n5️⃣ 應用狀態:');
    try {
        console.log(`  當前區域類型: ${appState.currentAreaType}`);
        console.log(`  選中的國家: ${appState.selectedCountry?.name || '無'} (${appState.selectedCountry?.id || '無'})`);
        console.log(`  已選區域數: ${appState.selectedAreas.length}`);
        console.log(`  當前顏色: ${appState.currentColor}`);
        
        if (appState.selectedAreas.length > 0) {
            console.log('  已選區域詳情:');
            appState.selectedAreas.forEach((area, i) => {
                console.log(`    ${i + 1}. ${area.name} (${area.type}) - ${area.color}`);
            });
        }
    } catch (e) {
        console.error('  ❌ 檢查應用狀態時出錯:', e);
    }
    
    // 6. 測試查詢功能
    console.log('\n6️⃣ 測試查詢功能:');
    try {
        // 使用地圖中心點進行測試
        const center = appState.map.getCenter();
        const point = appState.map.project(center);
        
        console.log(`  測試點: ${JSON.stringify(point)}`);
        
        const allFeatures = appState.map.queryRenderedFeatures(point, { radius: 50 });
        console.log(`  📊 找到 ${allFeatures.length} 個特徵`);
        
        const gadmFeatures = allFeatures.filter(f => 
            f.source === 'gadm-country' || 
            f.properties?.GID_0
        );
        console.log(`  📊 其中 ${gadmFeatures.length} 個是 GADM 特徵`);
        
        if (gadmFeatures.length > 0) {
            console.log('  ✅ 查詢功能正常');
            successes.push('查詢功能正常');
            
            // 測試名稱獲取
            const firstFeature = gadmFeatures[0];
            const testName = getAreaName(firstFeature, 'country');
            console.log(`  ✅ 測試名稱獲取: "${testName}"`);
        } else {
            console.log('  ⚠️ 未找到 GADM 特徵');
            issues.push('查詢時未找到 GADM 特徵');
        }
    } catch (e) {
        console.error('  ❌ 測試查詢時出錯:', e);
        issues.push('測試查詢時出錯');
    }
    
    // 總結
    console.log('\n═══════════════════════════════════════════');
    console.log('📊 診斷總結');
    console.log('═══════════════════════════════════════════');
    console.log(`✅ 正常項目: ${successes.length}`);
    successes.forEach(s => console.log(`   ✅ ${s}`));
    
    if (issues.length > 0) {
        console.log(`\n❌ 發現問題: ${issues.length}`);
        issues.forEach(issue => console.log(`   ❌ ${issue}`));
        console.log('\n💡 建議:');
        issues.forEach(issue => {
            if (issue.includes('未加載')) {
                console.log(`   - 檢查相關文件是否正確加載`);
            } else if (issue.includes('不可見')) {
                console.log(`   - 嘗試顯示圖層: appState.map.setLayoutProperty('visible-boundaries-country', 'visibility', 'visible')`);
            } else if (issue.includes('不存在')) {
                console.log(`   - 檢查數據文件是否存在`);
            }
        });
    } else {
        console.log('\n🎉 所有檢查都通過！');
    }
    
    console.log('\n═══════════════════════════════════════════');
    console.log('✅ 診斷完成');
    console.log('═══════════════════════════════════════════');
    
    return {
        successes,
        issues,
        summary: {
            total: successes.length + issues.length,
            passed: successes.length,
            failed: issues.length
        }
    };
})();


