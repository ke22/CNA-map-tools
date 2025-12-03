/**
 * 诊断脚本 - 检查测试环境
 * 
 * 使用方法：
 * 1. 打开浏览器控制台
 * 2. 粘贴并运行此脚本
 * 3. 查看诊断结果
 */

function diagnoseTestEnvironment() {
    console.log('🔍 开始诊断测试环境...\n');
    console.log('='.repeat(60));
    
    const issues = [];
    const warnings = [];
    
    // 检查 1: appState
    console.log('\n1️⃣  检查 appState 对象...');
    if (window.appState) {
        console.log('   ✅ appState 存在');
    } else {
        console.log('   ❌ appState 不存在');
        issues.push('appState 对象不存在 - 请确保地图应用已加载');
    }
    
    // 检查 2: map 对象
    console.log('\n2️⃣  检查 map 对象...');
    if (window.appState && window.appState.map) {
        console.log('   ✅ appState.map 存在');
        const map = window.appState.map;
        
        // 检查地图是否已加载
        console.log('\n3️⃣  检查地图加载状态...');
        try {
            const isLoaded = map.loaded();
            console.log(`   ${isLoaded ? '✅' : '⚠️ '} 地图加载状态: ${isLoaded}`);
            if (!isLoaded) {
                warnings.push('地图可能尚未完全加载 - 建议等待几秒');
            }
        } catch (error) {
            console.log(`   ❌ 无法检查地图加载状态: ${error.message}`);
            issues.push('无法检查地图加载状态');
        }
        
        // 检查地图样式
        console.log('\n4️⃣  检查地图样式...');
        try {
            const style = map.getStyle();
            if (style) {
                console.log('   ✅ 地图样式已加载');
                console.log(`   📋 样式名称: ${style.name || 'N/A'}`);
            } else {
                console.log('   ⚠️  地图样式未加载');
                warnings.push('地图样式未加载');
            }
        } catch (error) {
            console.log(`   ⚠️  无法获取地图样式: ${error.message}`);
            warnings.push('无法获取地图样式');
        }
        
    } else {
        console.log('   ❌ appState.map 不存在');
        issues.push('appState.map 不存在 - 请等待地图初始化完成');
    }
    
    // 检查 3: 必要的函数
    console.log('\n5️⃣  检查必要的函数...');
    const requiredFunctions = [
        'handleMapClick',
        'detectClickedBoundary',
        'getAreaName',
        'switchAreaType',
        'clearAllAreas'
    ];
    
    requiredFunctions.forEach(funcName => {
        const exists = typeof window[funcName] === 'function';
        console.log(`   ${exists ? '✅' : '❌'} ${funcName}: ${exists ? '存在' : '不存在'}`);
        if (!exists) {
            warnings.push(`函数 ${funcName} 不可用 - 可能需要从模块作用域访问`);
        }
    });
    
    // 检查 4: currentAreaType
    console.log('\n6️⃣  检查当前区域类型...');
    if (window.appState && window.appState.currentAreaType) {
        console.log(`   ✅ 当前区域类型: ${window.appState.currentAreaType}`);
        if (window.appState.currentAreaType !== 'country') {
            warnings.push(`当前不在 country 模式（当前: ${window.appState.currentAreaType}）`);
        }
    } else {
        console.log('   ⚠️  无法确定当前区域类型');
        warnings.push('无法确定当前区域类型');
    }
    
    // 检查 5: selectedAreas
    console.log('\n7️⃣  检查已选择区域...');
    if (window.appState && Array.isArray(window.appState.selectedAreas)) {
        console.log(`   ✅ selectedAreas 数组存在 (${window.appState.selectedAreas.length} 个区域)`);
        if (window.appState.selectedAreas.length > 0) {
            console.log('   📋 已选择的区域:');
            window.appState.selectedAreas.forEach((area, index) => {
                console.log(`      ${index + 1}. ${area.name || 'N/A'} (${area.type || 'N/A'})`);
            });
        }
    } else {
        console.log('   ⚠️  selectedAreas 不存在或不是数组');
        warnings.push('selectedAreas 不存在或不是数组');
    }
    
    // 总结
    console.log('\n' + '='.repeat(60));
    console.log('📊 诊断总结');
    console.log('='.repeat(60));
    
    if (issues.length === 0 && warnings.length === 0) {
        console.log('\n✅ 环境检查通过！所有必要组件都已就绪。');
        console.log('💡 可以运行测试：await quickTest()');
    } else {
        if (issues.length > 0) {
            console.log('\n❌ 发现关键问题：');
            issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }
        
        if (warnings.length > 0) {
            console.log('\n⚠️  警告：');
            warnings.forEach((warning, index) => {
                console.log(`   ${index + 1}. ${warning}`);
            });
        }
        
        console.log('\n💡 建议：');
        console.log('   1. 等待地图完全加载（通常需要 5-10 秒）');
        console.log('   2. 刷新页面并重新加载');
        console.log('   3. 检查浏览器控制台是否有其他错误');
    }
    
    console.log('\n' + '='.repeat(60));
    
    return {
        issues: issues,
        warnings: warnings,
        canRunTests: issues.length === 0
    };
}

// 自动运行诊断
console.log(`
╔═══════════════════════════════════════════════════════════╗
║                   测试环境诊断工具                          ║
╚═══════════════════════════════════════════════════════════╝
`);

// 导出到全局
window.diagnoseTestEnvironment = diagnoseTestEnvironment;

// 自动运行
const result = diagnoseTestEnvironment();

// 如果环境正常，提供快速测试链接
if (result.canRunTests) {
    console.log('\n✨ 提示：运行以下命令开始测试：');
    console.log('   await quickTest()  // 快速测试');
    console.log('   或');
    console.log('   await testMainCountries()  // 完整测试');
}

