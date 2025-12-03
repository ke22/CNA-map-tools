// 防止脚本被重复加载（避免重复声明错误）
if (window.MAIN_COUNTRIES_LOADED) {
    console.log('⚠️ test-countries-auto.js 已经加载过，跳过重复加载。');
} else {
    window.MAIN_COUNTRIES_LOADED = true;

/**
 * 自动测试主要国家的选择和着色功能
 * 
 * 使用方法：
 * 1. 打开浏览器控制台 (F12)
 * 2. 在控制台中粘贴并运行此脚本
 * 3. 运行: testMainCountries()
 * 
 * 或者打开测试页面: test-countries.html
 */

// 主要国家测试数据
const MAIN_COUNTRIES = [
    // 亚洲
    { name: 'Taiwan', coord: [121.533, 25.057], code: 'TWN', priority: 1, description: '台湾（最重要测试项）' },
    { name: 'China', coord: [104.066, 35.0], code: 'CHN', priority: 1, description: '中国（不含台湾）' },
    { name: 'India', coord: [77.0, 20.0], code: 'IND', priority: 2, description: '印度' },
    { name: 'Japan', coord: [138.0, 36.0], code: 'JPN', priority: 2, description: '日本' },
    { name: 'South Korea', coord: [127.5, 37.5], code: 'KOR', priority: 2, description: '韩国' },
    { name: 'Indonesia', coord: [113.0, -2.0], code: 'IDN', priority: 2, description: '印度尼西亚' },
    { name: 'Thailand', coord: [100.0, 15.0], code: 'THA', priority: 3, description: '泰国' },
    { name: 'Vietnam', coord: [105.8, 21.0], code: 'VNM', priority: 3, description: '越南' }, // 河内附近，确保在越南境内
    { name: 'Singapore', coord: [103.8, 1.3], code: 'SGP', priority: 3, description: '新加坡' },
    { name: 'Malaysia', coord: [102.0, 4.0], code: 'MYS', priority: 3, description: '马来西亚' },
    
    // 欧洲
    { name: 'Russia', coord: [100.0, 60.0], code: 'RUS', priority: 2, description: '俄罗斯' },
    { name: 'Germany', coord: [10.0, 51.0], code: 'DEU', priority: 2, description: '德国' },
    { name: 'France', coord: [2.0, 46.0], code: 'FRA', priority: 2, description: '法国' },
    { name: 'United Kingdom', coord: [-2.0, 52.0], code: 'GBR', priority: 2, description: '英国' },
    { name: 'Italy', coord: [12.0, 42.0], code: 'ITA', priority: 3, description: '意大利' },
    { name: 'Spain', coord: [-3.0, 40.0], code: 'ESP', priority: 3, description: '西班牙' },
    
    // 美洲
    { name: 'United States', coord: [-100.0, 40.0], code: 'USA', priority: 1, description: '美国' },
    { name: 'Canada', coord: [-100.0, 60.0], code: 'CAN', priority: 2, description: '加拿大' },
    { name: 'Mexico', coord: [-100.0, 23.0], code: 'MEX', priority: 2, description: '墨西哥' },
    { name: 'Brazil', coord: [-55.0, -15.0], code: 'BRA', priority: 2, description: '巴西' },
    { name: 'Argentina', coord: [-65.0, -35.0], code: 'ARG', priority: 3, description: '阿根廷' },
    
    // 非洲
    { name: 'South Africa', coord: [26.0, -29.0], code: 'ZAF', priority: 2, description: '南非' },
    { name: 'Egypt', coord: [31.0, 26.0], code: 'EGY', priority: 3, description: '埃及' },
    { name: 'Nigeria', coord: [8.0, 10.0], code: 'NGA', priority: 3, description: '尼日利亚' },
    
    // 大洋洲
    { name: 'Australia', coord: [133.0, -25.0], code: 'AUS', priority: 2, description: '澳大利亚' },
    { name: 'New Zealand', coord: [175.0, -41.0], code: 'NZL', priority: 3, description: '新西兰' },
];

// 测试结果
const testResults = {
    passed: [],
    failed: [],
    skipped: []
};

// 测试统计
const testStats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    startTime: null,
    endTime: null
};

/**
 * 等待指定时间
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 将经纬度坐标转换为屏幕像素坐标
 */
function lngLatToPixel(map, lngLat) {
    if (!map || !map.project) {
        console.error('❌ Map object is not available');
        return null;
    }
    try {
        return map.project(lngLat);
    } catch (error) {
        console.error('❌ Error projecting coordinates:', error);
        return null;
    }
}

/**
 * 模拟点击地图上的特定坐标
 */
async function clickOnMap(map, lngLat, description) {
    try {
        const pixel = lngLatToPixel(map, lngLat);
        if (!pixel) {
            console.error(`❌ Cannot project coordinates for ${description}`);
            return false;
        }
        
        // 确保地图已经加载边界数据
        await wait(1000);
        
        // 直接调用 handleMapClick 函数，如果可用
        if (typeof window.handleMapClick === 'function') {
            const clickEvent = {
                point: pixel,
                lngLat: lngLat,
                originalEvent: {
                    clientX: pixel.x,
                    clientY: pixel.y,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                }
            };
            window.handleMapClick(clickEvent);
            return true;
        }
        
        // 或者使用 map.fire 触发事件
        const clickEvent = {
            point: pixel,
            lngLat: lngLat,
            originalEvent: {
                clientX: pixel.x,
                clientY: pixel.y,
                preventDefault: () => {},
                stopPropagation: () => {}
            }
        };
        
        // 触发地图点击事件
        map.fire('click', clickEvent);
        return true;
    } catch (error) {
        console.error(`❌ Error clicking on map for ${description}:`, error);
        console.error('Error details:', error.stack);
        return false;
    }
}

/**
 * 自动应用颜色（如果颜色选择器已打开）
 */
async function autoApplyColor() {
    try {
        // 等待颜色选择器弹出
        await wait(500);
        
        // 检查颜色选择器是否显示
        const popup = document.getElementById('color-picker-popup');
        const isPopupVisible = popup && 
                              popup.style.display !== 'none' && 
                              popup.style.display !== '';
        
        if (isPopupVisible) {
            console.log('   🎨 颜色选择器已打开，自动应用颜色...');
            
            // 方法1: 直接调用 applyColorToArea（如果可用）
            if (typeof window.applyColorToArea === 'function') {
                const selectedCountry = window.appState.selectedCountry;
                if (selectedCountry) {
                    window.applyColorToArea(
                        selectedCountry.id,
                        selectedCountry.name,
                        'country',
                        window.appState.currentColor || '#6CA7A1'
                    );
                    console.log('   ✅ 已自动应用颜色（直接调用）');
                    await wait(500);
                    return true;
                }
            }
            
            // 方法2: 点击应用按钮
            const buttons = popup.querySelectorAll('button');
            let applyBtn = null;
            
            // 查找应用按钮（通常是第一个按钮或包含"Apply"/"应用"的按钮）
            for (const btn of buttons) {
                const text = btn.textContent.toLowerCase();
                if (text.includes('apply') || text.includes('应用') || text.includes('确定')) {
                    applyBtn = btn;
                    break;
                }
            }
            
            // 如果没找到，使用第一个按钮（通常是应用按钮）
            if (!applyBtn && buttons.length > 0) {
                applyBtn = buttons[0];
            }
            
            if (applyBtn) {
                applyBtn.click();
                console.log('   ✅ 已点击应用按钮');
                await wait(500);
                return true;
            }
            
            console.log('   ⚠️  无法找到应用按钮');
        } else {
            // 如果颜色选择器没有显示，尝试直接应用颜色
            const selectedCountry = window.appState && window.appState.selectedCountry;
            if (selectedCountry && typeof window.applyColorToArea === 'function') {
                window.applyColorToArea(
                    selectedCountry.id,
                    selectedCountry.name,
                    'country',
                    window.appState.currentColor || '#6CA7A1'
                );
                console.log('   ✅ 直接应用颜色（颜色选择器未显示）');
                await wait(500);
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.log(`   ⚠️  自动应用颜色时出错: ${error.message}`);
        return false;
    }
}

/**
 * 检查国家是否被成功选中
 */
async function checkCountrySelected(countryName, countryCode, timeout = 8000) {
    const startTime = Date.now();
    let attemptCount = 0;
    
    // 创建名称变体列表（处理不同的命名格式）
    const nameVariants = [
        countryName,
        countryName.toLowerCase(),
        countryName.toUpperCase(),
        // 处理空格变体
        countryName.replace(/\s+/g, ' '),
        countryName.replace(/\s+/g, ''),
        // 处理特殊字符
        countryName.replace(/[^\w\s]/g, ''),
    ];
    
    // 特殊处理某些国家的常见变体
    if (countryName === 'Vietnam') {
        nameVariants.push('Viet Nam', 'Việt Nam', 'Vietnam');
    } else if (countryName === 'United States') {
        nameVariants.push('USA', 'United States of America', 'U.S.', 'US');
    } else if (countryName === 'United Kingdom') {
        nameVariants.push('UK', 'Britain', 'Great Britain');
    }
    
    while (Date.now() - startTime < timeout) {
        attemptCount++;
        
        // 检查 selectedAreas 列表中是否有这个国家
        if (appState && appState.selectedAreas) {
            // 先列出所有已选中的国家（用于调试）
            if (attemptCount === 1) {
                console.log(`   🔍 当前已选中的区域: ${appState.selectedAreas.map(a => `${a.name}(${a.type})`).join(', ') || '无'}`);
            }
            
            const selected = appState.selectedAreas.find(area => {
                if (!area || area.type !== 'country') return false;
                
                // 检查 ID 匹配
                if (area.id && area.id.includes && area.id.includes(countryCode)) {
                    return true;
                }
                
                // 检查名称匹配（使用变体列表）
                if (area.name) {
                    const areaNameLower = area.name.toLowerCase();
                    for (const variant of nameVariants) {
                        if (variant && areaNameLower.includes(variant.toLowerCase()) || 
                            variant && area.name.includes(variant)) {
                            return true;
                        }
                    }
                }
                
                return false;
            });
            
            if (selected) {
                return {
                    success: true,
                    area: selected,
                    message: `✅ 找到选中项: ${selected.name} (ID: ${selected.id})`
                };
            }
        }
        
        // 每隔几次检查输出一次调试信息
        if (attemptCount % 5 === 0) {
            console.log(`   ⏳ 等待中... (已尝试 ${attemptCount} 次，已选区域: ${appState?.selectedAreas?.length || 0})`);
        }
        
        await wait(300);
    }
    
    // 最终调试信息
    if (appState && appState.selectedAreas) {
        console.log(`   📋 最终已选区域列表:`);
        appState.selectedAreas.forEach((area, idx) => {
            console.log(`      ${idx + 1}. ${area.name || 'N/A'} (${area.type || 'N/A'}) - ID: ${area.id || 'N/A'}`);
        });
    }
    
    return {
        success: false,
        message: `❌ 超时：未找到 ${countryName} (代码: ${countryCode}) 在选中列表中`
    };
}

/**
 * 检查是否有错误名称（如 "Unknown Country"）
 */
function checkForUnknownCountry() {
    if (appState && appState.selectedAreas) {
        const hasUnknown = appState.selectedAreas.some(area => 
            area.name && (
                area.name.includes('Unknown') || 
                area.name.includes('未知')
            )
        );
        if (hasUnknown) {
            return {
                success: false,
                message: '❌ 检测到 "Unknown Country" 错误！'
            };
        }
    }
    return { success: true };
}

/**
 * 测试单个国家
 */
async function testCountry(country, map) {
    console.log(`\n🧪 开始测试: ${country.description} (${country.name})`);
    console.log(`   坐标: [${country.coord[0]}, ${country.coord[1]}]`);
    
    testStats.total++;
    
    try {
        // 1. 移动到该国家位置并放大
        map.flyTo({
            center: country.coord,
            zoom: 5,
            duration: 1000
        });
        
        await wait(1500); // 等待地图移动完成
        
        // 2. 点击地图
        const clicked = await clickOnMap(map, country.coord, country.description);
        if (!clicked) {
            testResults.failed.push({
                country: country.name,
                reason: '无法点击地图坐标',
                coord: country.coord
            });
            testStats.failed++;
            return false;
        }
        
        await wait(2000); // 等待选择处理完成
        
        // 2.3. 验证选中的国家是否正确
        if (appState && appState.selectedCountry) {
            const selectedCode = appState.selectedCountry.id;
            const selectedName = appState.selectedCountry.name;
            
            // 检查是否选对了国家
            const isCorrectCountry = selectedCode && (
                selectedCode.includes(country.code) ||
                selectedCode === country.code ||
                country.code.includes(selectedCode)
            );
            
            if (!isCorrectCountry) {
                console.log(`   ⚠️  警告：点击位置可能不准确`);
                console.log(`      期望: ${country.name} (${country.code})`);
                console.log(`      实际: ${selectedName} (${selectedCode})`);
                console.log(`      这可能是坐标问题，但会继续测试...`);
            } else {
                console.log(`   ✅ 确认选中了正确的国家: ${selectedName} (${selectedCode})`);
            }
        }
        
        // 2.5. 自动应用颜色
        console.log(`   🎨 检查是否需要应用颜色...`);
        
        // 检查 selectedCountry 是否存在，如果存在则直接应用颜色
        if (appState && appState.selectedCountry) {
            console.log(`   📍 检测到 selectedCountry: ${appState.selectedCountry.name} (${appState.selectedCountry.id})`);
            
            // 使用默认颜色或当前颜色
            const color = appState.currentColor || '#6CA7A1';
            
            // 直接调用 applyColorToArea
            if (typeof window.applyColorToArea === 'function') {
                console.log(`   🔧 调用 applyColorToArea(${appState.selectedCountry.id}, ${appState.selectedCountry.name}, country, ${color})...`);
                window.applyColorToArea(
                    appState.selectedCountry.id,
                    appState.selectedCountry.name,
                    'country',
                    color
                );
                console.log(`   ✅ 已调用 applyColorToArea`);
            } else {
                console.log(`   ⚠️  applyColorToArea 函数不可用，尝试点击应用按钮...`);
                await autoApplyColor();
            }
        } else {
            console.log(`   ⚠️  selectedCountry 不存在，检查颜色选择器...`);
            // 如果 selectedCountry 不存在，尝试从颜色选择器应用
            await autoApplyColor();
        }
        
        await wait(1500); // 等待颜色应用完成
        
        // 验证是否已添加到 selectedAreas
        if (appState && appState.selectedAreas) {
            const found = appState.selectedAreas.find(a => 
                (a.id && a.id.includes(country.code)) || 
                (a.name && a.name.toLowerCase().includes(country.name.toLowerCase()))
            );
            if (found) {
                console.log(`   ✅ 确认：${found.name} 已添加到 selectedAreas`);
            } else {
                console.log(`   ⚠️  警告：${country.name} 尚未出现在 selectedAreas 中`);
            }
        }
        
        // 3. 检查是否成功选中（使用更灵活的匹配）
        const checkResult = await checkCountrySelected(country.name, country.code);
        
        // 4. 检查是否有 Unknown Country 错误
        const unknownCheck = checkForUnknownCountry();
        
        // 5. 即使名称不完全匹配，如果 ID 匹配也算成功
        let finalSuccess = checkResult.success;
        
        if (!finalSuccess && appState && appState.selectedAreas) {
            // 尝试通过 ID 匹配
            const foundById = appState.selectedAreas.find(area => {
                if (area.type !== 'country') return false;
                return (area.id && (
                    area.id.includes(country.code) ||
                    country.code.includes(area.id) ||
                    area.id === country.code
                ));
            });
            
            if (foundById) {
                console.log(`   ✅ 通过 ID 匹配找到: ${foundById.name} (${foundById.id})`);
                finalSuccess = true;
                checkResult.success = true;
                checkResult.area = foundById;
                checkResult.message = `✅ 通过 ID 匹配: ${foundById.name}`;
            }
        }
        
        if (finalSuccess && unknownCheck.success) {
            console.log(`✅ ${country.description} 测试通过`);
            testResults.passed.push({
                country: country.name,
                area: checkResult.area
            });
            testStats.passed++;
            return true;
        } else {
            const reason = checkResult.message || unknownCheck.message || '未知错误';
            console.error(`❌ ${country.description} 测试失败: ${reason}`);
            testResults.failed.push({
                country: country.name,
                reason: reason,
                coord: country.coord,
                selectedCountry: appState?.selectedCountry,
                allSelectedAreas: appState?.selectedAreas?.map(a => `${a.name}(${a.id})`).join(', ')
            });
            testStats.failed++;
            return false;
        }
        
    } catch (error) {
        console.error(`❌ ${country.description} 测试出错:`, error);
        testResults.failed.push({
            country: country.name,
            reason: error.message,
            coord: country.coord
        });
        testStats.failed++;
        return false;
    }
}

/**
 * 主测试函数
 */
async function testMainCountries(options = {}) {
    console.log('🚀 开始自动测试主要国家选择和着色功能...\n');
    
    // 检查必要对象是否存在
    if (!window.appState) {
        console.error('❌ appState 对象不存在');
        console.log('💡 提示：请确保地图应用已完全加载');
        return;
    }
    
    if (!window.appState.map) {
        console.error('❌ appState.map 对象不存在');
        console.log('💡 提示：请等待地图加载完成后再运行测试');
        return;
    }
    
    const map = window.appState.map;
    
    // 检查地图是否已加载
    if (!map.loaded()) {
        console.log('⏳ 等待地图加载...');
        await new Promise((resolve) => {
            map.once('load', resolve);
            // 超时保护
            setTimeout(resolve, 10000);
        });
    }
    
    // 检查是否在 country 模式
    if (appState.currentAreaType !== 'country') {
        console.log('⚠️  切换到 country 模式...');
        if (typeof switchAreaType === 'function') {
            switchAreaType('country');
            await wait(2000);
        }
    }
    
    // 清空已选择区域
    console.log('🧹 清空已选择区域...');
    if (typeof clearAllAreas === 'function') {
        clearAllAreas();
        await wait(1000);
    }
    
    testStats.startTime = Date.now();
    
    // 过滤要测试的国家
    let countriesToTest = MAIN_COUNTRIES;
    
    if (options.priority) {
        countriesToTest = MAIN_COUNTRIES.filter(c => c.priority <= options.priority);
    }
    
    if (options.countries && Array.isArray(options.countries)) {
        countriesToTest = countriesToTest.filter(c => 
            options.countries.includes(c.name) || 
            options.countries.includes(c.code)
        );
    }
    
    console.log(`📋 将测试 ${countriesToTest.length} 个国家\n`);
    
    // 逐个测试国家
    for (let i = 0; i < countriesToTest.length; i++) {
        const country = countriesToTest[i];
        console.log(`\n[${i + 1}/${countriesToTest.length}]`);
        
        await testCountry(country, map);
        
        // 测试间隔
        if (i < countriesToTest.length - 1) {
            await wait(options.delay || 1500);
        }
    }
    
    testStats.endTime = Date.now();
    const duration = ((testStats.endTime - testStats.startTime) / 1000).toFixed(2);
    
    // 生成测试报告
    generateTestReport();
    
    console.log(`\n⏱️  总耗时: ${duration} 秒`);
}

/**
 * 生成测试报告
 */
function generateTestReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试报告');
    console.log('='.repeat(60));
    
    console.log(`\n总测试数: ${testStats.total}`);
    console.log(`✅ 通过: ${testStats.passed} (${((testStats.passed / testStats.total) * 100).toFixed(1)}%)`);
    console.log(`❌ 失败: ${testStats.failed} (${((testStats.failed / testStats.total) * 100).toFixed(1)}%)`);
    console.log(`⏭️  跳过: ${testStats.skipped}`);
    
    if (testResults.passed.length > 0) {
        console.log(`\n✅ 通过的国家:`);
        testResults.passed.forEach(result => {
            console.log(`   - ${result.country}`);
        });
    }
    
    if (testResults.failed.length > 0) {
        console.log(`\n❌ 失败的国家:`);
        testResults.failed.forEach(result => {
            console.log(`   - ${result.country}: ${result.reason}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
    
    // 复制结果到剪贴板（如果可能）
    try {
        const reportText = JSON.stringify({
            stats: testStats,
            results: {
                passed: testResults.passed,
                failed: testResults.failed
            }
        }, null, 2);
        
        console.log('\n💾 测试结果 JSON（可复制到剪贴板）:');
        console.log(reportText);
    } catch (error) {
        console.log('⚠️  无法生成 JSON 报告');
    }
}

/**
 * 检查测试环境
 */
function checkTestEnvironment() {
    console.log('🔍 检查测试环境...\n');
    
    const checks = {
        appState: !!window.appState,
        map: !!(window.appState && window.appState.map),
        mapLoaded: !!(window.appState && window.appState.map && window.appState.map.loaded()),
        currentAreaType: window.appState ? window.appState.currentAreaType : null,
        handleMapClick: typeof window.handleMapClick === 'function',
        detectClickedBoundary: typeof window.detectClickedBoundary === 'function'
    };
    
    console.log('环境检查结果:');
    Object.entries(checks).forEach(([key, value]) => {
        const status = value ? '✅' : '❌';
        console.log(`  ${status} ${key}: ${value}`);
    });
    
    if (!checks.appState || !checks.map) {
        console.error('\n❌ 测试环境不完整！');
        console.log('💡 请确保：');
        console.log('   1. 地图应用已完全加载');
        console.log('   2. 等待地图加载完成（通常需要 5-10 秒）');
        console.log('   3. 确保在正确的页面（index-enhanced.html）');
        return false;
    }
    
    if (!checks.mapLoaded) {
        console.warn('\n⚠️  地图可能尚未完全加载');
        console.log('💡 建议等待几秒后再运行测试');
    }
    
    console.log('\n✅ 环境检查完成\n');
    return true;
}

/**
 * 快速测试 - 只测试优先级最高的国家
 */
async function quickTest() {
    console.log('⚡ 快速测试模式 - 只测试关键国家\n');
    
    // 先检查环境
    if (!checkTestEnvironment()) {
        return;
    }
    
    await testMainCountries({
        priority: 1,
        delay: 1000
    });
}

/**
 * 测试单个国家
 */
async function testSingleCountry(countryName) {
    const country = MAIN_COUNTRIES.find(c => 
        c.name.toLowerCase() === countryName.toLowerCase() ||
        c.code.toLowerCase() === countryName.toLowerCase()
    );
    
    if (!country) {
        console.error(`❌ 找不到国家: ${countryName}`);
        console.log('可用国家:', MAIN_COUNTRIES.map(c => c.name).join(', '));
        return;
    }
    
    console.log(`🎯 单独测试: ${country.description}\n`);
    await testMainCountries({
        countries: [country.name],
        delay: 500
    });
}

// 导出到全局作用域
window.testMainCountries = testMainCountries;
window.quickTest = quickTest;
window.testSingleCountry = testSingleCountry;
window.generateTestReport = generateTestReport;

console.log(`
╔═══════════════════════════════════════════════════════════╗
║       自动测试脚本已加载                                   ║
╠═══════════════════════════════════════════════════════════╣
║  可用函数：                                               ║
║                                                           ║
║  • testMainCountries()          - 测试所有主要国家       ║
║  • quickTest()                   - 快速测试关键国家       ║
║  • testSingleCountry('Taiwan')  - 测试单个国家           ║
║  • generateTestReport()         - 生成测试报告           ║
║                                                           ║
║  示例用法：                                               ║
║  await testMainCountries()                               ║
║  await quickTest()                                        ║
║  await testSingleCountry('Taiwan')                       ║
╚═══════════════════════════════════════════════════════════╝
`);

} // END guard for duplicate loading

