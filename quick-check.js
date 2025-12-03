/**
 * 快速检查脚本 - 查看所有已选择的国家和行政区
 * 
 * 直接运行：checkAllSelected()
 */

function checkAllSelected() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 当前已选择的所有区域');
    console.log('='.repeat(60));
    
    if (!window.appState) {
        console.error('❌ appState 不存在');
        return;
    }
    
    // 基本信息
    console.log(`\n当前模式: ${appState.currentAreaType}`);
    console.log(`总区域数: ${appState.selectedAreas.length}`);
    
    // 已选择的国家
    const countries = appState.selectedAreas.filter(a => a.type === 'country');
    console.log(`\n🌍 已选择的国家 (${countries.length}):`);
    if (countries.length === 0) {
        console.log('   (无)');
    } else {
        countries.forEach((country, idx) => {
            console.log(`   ${idx + 1}. ${country.name || 'N/A'} (${country.id || 'N/A'}) - 颜色: ${country.color || 'N/A'}`);
        });
    }
    
    // 已选择的行政区
    const states = appState.selectedAreas.filter(a => a.type === 'state');
    const cities = appState.selectedAreas.filter(a => a.type === 'city');
    
    console.log(`\n🏛️  已选择的州/省 (${states.length}):`);
    if (states.length === 0) {
        console.log('   (无)');
    } else {
        states.forEach((state, idx) => {
            console.log(`   ${idx + 1}. ${state.name || 'N/A'} (${state.id || 'N/A'}) - 颜色: ${state.color || 'N/A'}`);
        });
    }
    
    console.log(`\n🏙️  已选择的城市 (${cities.length}):`);
    if (cities.length === 0) {
        console.log('   (无)');
    } else {
        cities.forEach((city, idx) => {
            console.log(`   ${idx + 1}. ${city.name || 'N/A'} (${city.id || 'N/A'}) - 颜色: ${city.color || 'N/A'}`);
        });
    }
    
    // selectedCountry
    if (appState.selectedCountry) {
        console.log(`\n📍 当前选定的国家: ${appState.selectedCountry.name} (${appState.selectedCountry.id})`);
    } else {
        console.log(`\n📍 当前选定的国家: (无)`);
    }
    
    // 检查颜色图层
    console.log(`\n🎨 颜色图层检查:`);
    appState.selectedAreas.forEach(area => {
        const layerId = area.layerId || `area-${area.type}-${area.id}`;
        const layer = appState.map.getLayer(layerId);
        console.log(`   ${layer ? '✅' : '❌'} ${layerId}: ${layer ? '存在' : '不存在'}`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    // 导出为 JSON（方便复制）
    const summary = {
        mode: appState.currentAreaType,
        total: appState.selectedAreas.length,
        countries: countries.map(c => ({ name: c.name, id: c.id, color: c.color })),
        states: states.map(s => ({ name: s.name, id: s.id, color: s.color })),
        cities: cities.map(c => ({ name: c.name, id: c.id, color: c.color })),
        selectedCountry: appState.selectedCountry
    };
    
    console.log('\n💾 JSON 格式（可复制）:');
    console.log(JSON.stringify(summary, null, 2));
    console.log('\n');
    
    return summary;
}

// 导出到全局
window.checkAllSelected = checkAllSelected;

// 自动运行
console.log('✅ 快速检查工具已加载！');
console.log('💡 运行 checkAllSelected() 查看所有已选择的区域\n');

