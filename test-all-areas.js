/**
 * 全面测试脚本 - 检查所有国家和行政区功能
 * 
 * 使用方法：
 * 1. 打开浏览器控制台
 * 2. 加载此脚本
 * 3. 运行: testAllAreas()
 */

console.log('🔍 全面测试工具已加载\n');

/**
 * 检查所有国家和行政区的配置和功能
 */
async function testAllAreas() {
    console.log('='.repeat(60));
    console.log('📋 全面测试 - 所有国家和行政区功能');
    console.log('='.repeat(60));
    
    // 1. 检查基础环境
    console.log('\n1️⃣  检查基础环境...');
    const envCheck = checkEnvironment();
    if (!envCheck.success) {
        console.error('\n❌ 环境检查失败，无法继续测试');
        console.log('问题:', envCheck.issues.join(', '));
        return;
    }
    console.log('✅ 基础环境正常\n');
    
    // 2. 测试国家选择和着色
    console.log('2️⃣  测试国家选择和着色功能...\n');
    await testCountrySelection();
    
    // 3. 测试行政区选择和着色
    console.log('\n3️⃣  测试行政区选择和着色功能...\n');
    await testAdministrativeSelection();
    
    // 4. 生成完整报告
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试报告');
    console.log('='.repeat(60));
    generateFullReport();
}

/**
 * 检查环境
 */
function checkEnvironment() {
    const issues = [];
    
    if (!window.appState) {
        issues.push('appState 不存在');
    }
    
    if (!window.appState?.map) {
        issues.push('appState.map 不存在');
    }
    
    if (typeof window.applyColorToArea !== 'function') {
        issues.push('applyColorToArea 函数不可用');
    }
    
    if (typeof window.handleMapClick !== 'function') {
        issues.push('handleMapClick 函数不可用');
    }
    
    return {
        success: issues.length === 0,
        issues: issues
    };
}

/**
 * 测试国家选择功能
 */
async function testCountrySelection() {
    console.log('🧪 测试国家选择和着色...\n');
    
    const testCountries = [
        { name: 'Taiwan', code: 'TWN', coord: [121.533, 25.057], priority: '高' },
        { name: 'China', code: 'CHN', coord: [104.066, 35.0], priority: '高' },
        { name: 'United States', code: 'USA', coord: [-100.0, 40.0], priority: '高' },
        { name: 'Vietnam', code: 'VNM', coord: [105.8, 21.0], priority: '中' }, // 河内附近
        { name: 'Nigeria', code: 'NGA', coord: [8.0, 10.0], priority: '中' },
    ];
    
    const results = {
        total: 0,
        passed: 0,
        failed: [],
        details: []
    };
    
    // 确保在 country 模式
    if (appState.currentAreaType !== 'country') {
        console.log('⚠️  切换到 country 模式...');
        if (typeof switchAreaType === 'function') {
            switchAreaType('country');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // 清空已选择区域
    if (typeof clearAllAreas === 'function') {
        clearAllAreas();
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    for (const country of testCountries) {
        results.total++;
        console.log(`\n[${results.total}/${testCountries.length}] 测试: ${country.name} (${country.code})`);
        
        try {
            const result = await testSingleCountryDetailed(country);
            results.details.push(result);
            
            if (result.success) {
                results.passed++;
                console.log(`   ✅ ${country.name} 测试通过`);
            } else {
                results.failed.push({
                    country: country.name,
                    reason: result.reason
                });
                console.log(`   ❌ ${country.name} 测试失败: ${result.reason}`);
            }
        } catch (error) {
            results.failed.push({
                country: country.name,
                reason: error.message
            });
            console.error(`   ❌ ${country.name} 测试出错:`, error);
        }
        
        // 测试间隔
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    console.log(`\n📊 国家测试结果: ${results.passed}/${results.total} 通过`);
    if (results.failed.length > 0) {
        console.log('❌ 失败的国家:');
        results.failed.forEach(f => {
            console.log(`   - ${f.country}: ${f.reason}`);
        });
    }
    
    return results;
}

/**
 * 详细测试单个国家
 */
async function testSingleCountryDetailed(country) {
    const map = appState.map;
    
    try {
        // 1. 移动到国家位置
        map.flyTo({
            center: country.coord,
            zoom: 5,
            duration: 1000
        });
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 2. 点击地图
        const pixel = map.project(country.coord);
        const clickEvent = {
            point: pixel,
            lngLat: country.coord,
            originalEvent: {
                clientX: pixel.x,
                clientY: pixel.y,
                preventDefault: () => {},
                stopPropagation: () => {}
            }
        };
        
        map.fire('click', clickEvent);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. 检查 selectedCountry
        if (!appState.selectedCountry) {
            return {
                success: false,
                reason: 'selectedCountry 未设置'
            };
        }
        
        // 4. 应用颜色
        const color = appState.currentColor || '#6CA7A1';
        if (typeof window.applyColorToArea === 'function') {
            window.applyColorToArea(
                appState.selectedCountry.id,
                appState.selectedCountry.name,
                'country',
                color
            );
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 5. 验证是否添加到 selectedAreas
        const found = appState.selectedAreas.find(area => {
            if (area.type !== 'country') return false;
            return (area.id && area.id.includes(country.code)) ||
                   (area.name && area.name.toLowerCase().includes(country.name.toLowerCase()));
        });
        
        if (found) {
            return {
                success: true,
                area: found,
                message: `成功添加到 selectedAreas: ${found.name}`
            };
        } else {
            // 详细诊断
            const diagnostic = {
                selectedCountry: appState.selectedCountry,
                selectedAreas: appState.selectedAreas.map(a => ({
                    name: a.name,
                    id: a.id,
                    type: a.type
                })),
                expectedCode: country.code,
                expectedName: country.name
            };
            
            return {
                success: false,
                reason: '未添加到 selectedAreas',
                diagnostic: diagnostic
            };
        }
        
    } catch (error) {
        return {
            success: false,
            reason: error.message,
            error: error
        };
    }
}

/**
 * 测试行政区选择功能
 */
async function testAdministrativeSelection() {
    console.log('🧪 测试行政区选择和着色...\n');
    
    // 切换到 administration 模式
    if (appState.currentAreaType !== 'administration') {
        console.log('⚠️  切换到 administration 模式...');
        if (typeof switchAreaType === 'function') {
            switchAreaType('administration');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('✅ Administration 模式已启用');
    console.log('💡 提示：手动点击地图上的州/省或城市来测试行政区功能');
    
    // 检查行政区边界是否已加载
    const stateLayer = appState.map.getLayer('visible-boundaries-state');
    const cityLayer = appState.map.getLayer('visible-boundaries-city');
    
    console.log(`\n边界图层状态:`);
    console.log(`  - State 边界: ${stateLayer ? '✅ 已加载' : '❌ 未加载'}`);
    console.log(`  - City 边界: ${cityLayer ? '✅ 已加载' : '❌ 未加载'}`);
    
    if (!stateLayer && !cityLayer) {
        console.log('\n⚠️  警告：行政区边界未加载');
        console.log('💡 提示：需要先选择一个国家来加载该国家的行政区边界');
    }
}

/**
 * 生成完整报告
 */
function generateFullReport() {
    console.log('\n📋 系统状态:');
    console.log(`  - 当前模式: ${appState.currentAreaType}`);
    console.log(`  - 已选择区域数: ${appState.selectedAreas.length}`);
    console.log(`  - 已选择国家: ${appState.selectedCountry ? appState.selectedCountry.name : '无'}`);
    
    if (appState.selectedAreas.length > 0) {
        console.log('\n已选择的区域:');
        appState.selectedAreas.forEach((area, idx) => {
            console.log(`  ${idx + 1}. ${area.name} (${area.type}) - ID: ${area.id}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
}

/**
 * 诊断单个国家问题
 */
function diagnoseCountry(countryName, countryCode) {
    console.log(`\n🔍 诊断国家: ${countryName} (${countryCode})\n`);
    
    console.log('1. 检查 selectedAreas:');
    if (appState.selectedAreas.length === 0) {
        console.log('   ❌ selectedAreas 为空');
    } else {
        console.log(`   ✅ selectedAreas 有 ${appState.selectedAreas.length} 个区域`);
        appState.selectedAreas.forEach((area, idx) => {
            const match = (area.id && area.id.includes(countryCode)) ||
                         (area.name && area.name.toLowerCase().includes(countryName.toLowerCase()));
            console.log(`   ${idx + 1}. ${area.name} (${area.type}) - ID: ${area.id} ${match ? '✅ 匹配' : ''}`);
        });
    }
    
    console.log('\n2. 检查 selectedCountry:');
    if (appState.selectedCountry) {
        console.log(`   ✅ selectedCountry: ${appState.selectedCountry.name} (${appState.selectedCountry.id})`);
        const match = appState.selectedCountry.id.includes(countryCode);
        console.log(`   ${match ? '✅ ID 匹配' : '❌ ID 不匹配'}`);
    } else {
        console.log('   ❌ selectedCountry 不存在');
    }
    
    console.log('\n3. 检查颜色图层:');
    const layerId = `area-country-${countryCode}`;
    const layer = appState.map.getLayer(layerId);
    console.log(`   ${layer ? '✅' : '❌'} 图层 ${layerId}: ${layer ? '存在' : '不存在'}`);
}

// 导出到全局
window.testAllAreas = testAllAreas;
window.testSingleCountryDetailed = testSingleCountryDetailed;
window.diagnoseCountry = diagnoseCountry;

console.log(`
╔═══════════════════════════════════════════════════════════╗
║             全面测试工具已加载                              ║
╠═══════════════════════════════════════════════════════════╣
║  可用函数：                                               ║
║                                                           ║
║  • testAllAreas()              - 全面测试所有功能         ║
║  • diagnoseCountry('Taiwan', 'TWN') - 诊断单个国家        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

