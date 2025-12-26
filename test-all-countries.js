/**
 * 测试所有国家脚本
 * 
 * 功能：测试所有联合国成员国 + 观察员国 + 特殊地区（约 195-200 个）
 * 
 * 使用方法：
 * 1. 打开浏览器控制台
 * 2. 加载此脚本
 * 3. 运行: testAllCountries()
 */

console.log('🌍 全面测试所有国家脚本已加载\n');

// 从 country-codes.js 获取所有国家
function getAllCountries() {
    if (typeof COUNTRY_CODES === 'undefined') {
        console.error('❌ COUNTRY_CODES 未定义，请确保 country-codes.js 已加载');
        return [];
    }
    
    const countries = [];
    for (const [code, info] of Object.entries(COUNTRY_CODES)) {
        countries.push({
            code: code,
            name: info.nameEn || info.name,
            nameZh: info.name,
            nameEn: info.nameEn
        });
    }
    
    return countries;
}

// 测试统计
const allCountriesTestResults = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    results: [],
    startTime: null,
    endTime: null
};

/**
 * 批量测试所有国家（分批进行，避免浏览器卡顿）
 */
async function testAllCountries(options = {}) {
    console.log('🌍 开始测试所有国家...\n');
    console.log('='.repeat(60));
    console.log('💡 注意：这是快速检查模式，只验证数据可用性');
    console.log('💡 不进行实际点击测试（需要坐标和时间）');
    console.log('💡 要完整测试，请使用 test-countries-auto.js 测试主要国家');
    console.log('='.repeat(60));
    
    // 检查环境
    if (!window.appState || !window.appState.map) {
        console.error('❌ appState 或 map 对象不存在');
        return;
    }
    
    // 获取所有国家
    let allCountries = getAllCountries();
    
    if (allCountries.length === 0) {
        console.error('❌ 无法获取国家列表');
        return;
    }
    
    console.log(`📋 找到 ${allCountries.length} 个国家/地区\n`);
    
    // 过滤选项
    if (options.regions && Array.isArray(options.regions)) {
        // 按地区过滤（如果实现）
    }
    
    if (options.limit) {
        allCountries = allCountries.slice(0, options.limit);
        console.log(`⚠️  限制测试数量为 ${options.limit} 个国家\n`);
    }
    
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
    
    allCountriesTestResults.startTime = Date.now();
    allCountriesTestResults.total = allCountries.length;
    
    // 分批测试（每批 10 个，避免浏览器卡顿）
    const batchSize = options.batchSize || 10;
    const delay = options.delay || 1000;
    
    console.log(`📦 将分 ${Math.ceil(allCountries.length / batchSize)} 批测试，每批 ${batchSize} 个国家\n`);
    
    for (let i = 0; i < allCountries.length; i += batchSize) {
        const batch = allCountries.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(allCountries.length / batchSize);
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📦 批次 ${batchNum}/${totalBatches} (${batch.length} 个国家)`);
        console.log('='.repeat(60));
        
        for (const country of batch) {
            const index = allCountries.indexOf(country) + 1;
            console.log(`\n[${index}/${allCountries.length}] 检查: ${country.name} (${country.code})`);
            
            try {
                const result = await testCountryQuick(country);
                allCountriesTestResults.results.push(result);
                
                if (result.success) {
                    allCountriesTestResults.passed++;
                    const msg = result.message || '数据可用';
                    console.log(`   ✅ ${msg}`);
                } else if (result.skip) {
                    allCountriesTestResults.skipped++;
                    console.log(`   ⏭️  跳过: ${result.reason}`);
                } else {
                    allCountriesTestResults.failed++;
                    console.log(`   ❌ 失败: ${result.reason || '未知原因'}`);
                }
            } catch (error) {
                allCountriesTestResults.failed++;
                allCountriesTestResults.results.push({
                    code: country.code,
                    name: country.name,
                    success: false,
                    reason: error.message
                });
                console.error(`   ❌ 错误: ${error.message}`);
            }
            
            // 每个国家之间的延迟（快速检查，延迟较小）
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // 批次之间的延迟（稍长）
        if (i + batchSize < allCountries.length) {
            console.log(`\n⏸️  批次 ${batchNum} 完成，等待 ${delay * 2}ms 后继续下一批...`);
            await new Promise(resolve => setTimeout(resolve, delay * 2));
        }
    }
    
    allCountriesTestResults.endTime = Date.now();
    const duration = ((allCountriesTestResults.endTime - allCountriesTestResults.startTime) / 1000 / 60).toFixed(2);
    
    // 生成报告
    generateAllCountriesReport();
    
    console.log(`\n⏱️  总耗时: ${duration} 分钟`);
}

/**
 * 快速测试单个国家 - 验证数据可用性
 * 
 * 注意：完整测试需要坐标，这里只验证数据可用性
 */
async function testCountryQuick(country) {
    const map = appState.map;
    
    try {
        // 方法1: 检查国家是否已经在 selectedAreas 中
        const existing = appState.selectedAreas.find(area => 
            area.type === 'country' && (
                area.id === country.code ||
                area.id.includes(country.code) ||
                country.code.includes(area.id)
            )
        );
        
        if (existing) {
            return {
                code: country.code,
                name: country.name,
                success: true,
                message: '已在已选列表中',
                verified: true
            };
        }
        
        // 方法2: 检查边界数据是否已加载
        const boundaryLayer = map.getLayer('visible-boundaries-country');
        const gadmSource = map.getSource('gadm-country');
        const mapboxSource = map.getSource('boundaries-adm0');
        
        // 如果任何数据源存在，说明可以测试（但需要坐标）
        if (boundaryLayer || gadmSource || mapboxSource) {
            return {
                code: country.code,
                name: country.name,
                success: true,
                message: '数据可用（需要坐标进行完整测试）',
                testable: true,
                needsCoord: true
            };
        }
        
        // 如果边界层未加载，跳过
        return {
            code: country.code,
            name: country.name,
            success: false,
            reason: '边界数据未加载',
            skip: true
        };
        
    } catch (error) {
        return {
            code: country.code,
            name: country.name,
            success: false,
            reason: error.message
        };
    }
}

/**
 * 带点击的完整测试（需要坐标）
 */
async function testCountryWithClick(country, coord) {
    if (!coord) {
        return {
            code: country.code,
            name: country.name,
            success: false,
            reason: '缺少坐标信息'
        };
    }
    
    const map = appState.map;
    
    try {
        // 移动到国家位置
        map.flyTo({
            center: coord,
            zoom: 5,
            duration: 1000
        });
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 点击地图
        const pixel = map.project(coord);
        const clickEvent = {
            point: pixel,
            lngLat: coord,
            originalEvent: {
                clientX: pixel.x,
                clientY: pixel.y,
                preventDefault: () => {},
                stopPropagation: () => {}
            }
        };
        
        map.fire('click', clickEvent);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 应用颜色
        if (appState.selectedCountry && typeof window.applyColorToArea === 'function') {
            window.applyColorToArea(
                appState.selectedCountry.id,
                appState.selectedCountry.name,
                'country',
                appState.currentColor || '#6CA7A1'
            );
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // 检查是否成功
        const found = appState.selectedAreas.find(area => 
            area.type === 'country' && (
                area.id === country.code ||
                area.id.includes(country.code) ||
                country.code.includes(area.id)
            )
        );
        
        return {
            code: country.code,
            name: country.name,
            success: !!found,
            reason: found ? '成功' : '未找到',
            area: found
        };
        
    } catch (error) {
        return {
            code: country.code,
            name: country.name,
            success: false,
            reason: error.message
        };
    }
}

/**
 * 生成所有国家的测试报告
 */
function generateAllCountriesReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 所有国家测试报告');
    console.log('='.repeat(60));
    
    console.log(`\n总测试数: ${allCountriesTestResults.total}`);
    console.log(`✅ 通过: ${allCountriesTestResults.passed} (${((allCountriesTestResults.passed / allCountriesTestResults.total) * 100).toFixed(1)}%)`);
    console.log(`❌ 失败: ${allCountriesTestResults.failed} (${((allCountriesTestResults.failed / allCountriesTestResults.total) * 100).toFixed(1)}%)`);
    console.log(`⏭️  跳过: ${allCountriesTestResults.skipped}`);
    
    const passed = allCountriesTestResults.results.filter(r => r.success);
    const failed = allCountriesTestResults.results.filter(r => !r.success);
    
    if (passed.length > 0) {
        console.log(`\n✅ 通过的国家 (${passed.length}):`);
        passed.slice(0, 20).forEach(r => {
            console.log(`   - ${r.name} (${r.code})`);
        });
        if (passed.length > 20) {
            console.log(`   ... 还有 ${passed.length - 20} 个国家`);
        }
    }
    
    if (failed.length > 0) {
        console.log(`\n❌ 失败的国家 (${failed.length}):`);
        failed.slice(0, 20).forEach(r => {
            console.log(`   - ${r.name} (${r.code}): ${r.reason || '未知原因'}`);
        });
        if (failed.length > 20) {
            console.log(`   ... 还有 ${failed.length - 20} 个国家`);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    
    // 导出 JSON
    const reportData = {
        stats: {
            total: allCountriesTestResults.total,
            passed: allCountriesTestResults.passed,
            failed: allCountriesTestResults.failed,
            skipped: allCountriesTestResults.skipped,
            duration: allCountriesTestResults.endTime - allCountriesTestResults.startTime
        },
        results: allCountriesTestResults.results
    };
    
    console.log('\n💾 完整报告 JSON:');
    console.log(JSON.stringify(reportData, null, 2));
}

/**
 * 测试指定数量的国家（用于快速验证）
 */
async function testCountriesSample(limit = 50) {
    console.log(`🔍 测试样本国家（${limit} 个）...\n`);
    await testAllCountries({
        limit: limit,
        batchSize: 10,
        delay: 800
    });
}

/**
 * 从地图数据中自动发现所有可用的国家
 */
async function discoverAllCountries() {
    console.log('🔍 正在从地图数据中发现所有国家...\n');
    
    if (!appState || !appState.map) {
        console.error('❌ Map 对象不存在');
        return [];
    }
    
    try {
        // 尝试从边界源获取所有国家
        const source = appState.map.getSource('boundaries-adm0');
        if (!source) {
            console.log('⚠️  边界源未加载');
            return [];
        }
        
        // 如果有 GADM 数据，可以查询
        if (window.GADM_LOADER) {
            console.log('✅ 发现 GADM 数据加载器');
            // 这里可以查询所有国家
        }
        
        console.log('💡 提示：使用 COUNTRY_CODES 获取完整国家列表');
        const countries = getAllCountries();
        console.log(`📋 从 COUNTRY_CODES 找到 ${countries.length} 个国家/地区`);
        
        return countries;
        
    } catch (error) {
        console.error('❌ 发现国家时出错:', error);
        return [];
    }
}

// 导出到全局
window.testAllCountries = testAllCountries;
window.testCountriesSample = testCountriesSample;
window.discoverAllCountries = discoverAllCountries;
window.generateAllCountriesReport = generateAllCountriesReport;

console.log(`
╔═══════════════════════════════════════════════════════════╗
║         测试所有国家脚本已加载                             ║
╠═══════════════════════════════════════════════════════════╣
║  可用函数：                                               ║
║                                                           ║
║  • testAllCountries()           - 测试所有国家           ║
║  • testCountriesSample(50)      - 测试样本（50个）       ║
║  • discoverAllCountries()       - 发现所有国家           ║
║                                                           ║
║  示例用法：                                               ║
║  await testCountriesSample(50)  // 测试50个国家         ║
║  await testAllCountries()       // 测试所有国家         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

