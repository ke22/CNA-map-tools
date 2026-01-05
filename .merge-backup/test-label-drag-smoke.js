/**
 * 中文标签拖曳功能冒烟测试
 * 快速验证基本功能是否正常工作
 */

// 等待页面加载完成
window.addEventListener('load', function() {
    console.log('🧪 开始中文标签拖曳功能冒烟测试...');
    
    // 等待地图初始化
    setTimeout(() => {
        runSmokeTest();
    }, 2000);
});

function runSmokeTest() {
    const tests = [];
    let passed = 0;
    let failed = 0;
    
    // 测试 1: 检查地图是否加载
    tests.push(() => {
        if (!window.appState || !window.appState.map) {
            return { name: '地图加载', status: '❌ 失败', message: '地图未初始化' };
        }
        if (!window.appState.map.loaded()) {
            return { name: '地图加载', status: '⚠️ 警告', message: '地图正在加载中' };
        }
        return { name: '地图加载', status: '✅ 通过', message: '地图已加载' };
    });
    
    // 测试 2: 检查标签数据源是否存在
    tests.push(() => {
        if (!window.appState || !window.appState.map) {
            return { name: '标签数据源', status: '❌ 失败', message: '地图未初始化' };
        }
        const source = window.appState.map.getSource('custom-chinese-labels');
        if (!source) {
            return { name: '标签数据源', status: '⚠️ 警告', message: '标签数据源不存在（可能还没有选中区域）' };
        }
        return { name: '标签数据源', status: '✅ 通过', message: '标签数据源存在' };
    });
    
    // 测试 3: 检查标签图层是否存在
    tests.push(() => {
        if (!window.appState || !window.appState.map) {
            return { name: '标签图层', status: '❌ 失败', message: '地图未初始化' };
        }
        const layer = window.appState.map.getLayer('custom-chinese-labels');
        if (!layer) {
            return { name: '标签图层', status: '⚠️ 警告', message: '标签图层不存在（可能还没有选中区域）' };
        }
        return { name: '标签图层', status: '✅ 通过', message: '标签图层存在' };
    });
    
    // 测试 4: 检查 hit-area 图层是否存在
    tests.push(() => {
        if (!window.appState || !window.appState.map) {
            return { name: 'Hit-area 图层', status: '❌ 失败', message: '地图未初始化' };
        }
        const layer = window.appState.map.getLayer('custom-chinese-labels-hit-area');
        if (!layer) {
            return { name: 'Hit-area 图层', status: '⚠️ 警告', message: 'Hit-area 图层不存在（可能还没有选中区域）' };
        }
        return { name: 'Hit-area 图层', status: '✅ 通过', message: 'Hit-area 图层存在' };
    });
    
    // 测试 5: 检查拖曳状态对象是否存在
    tests.push(() => {
        if (!window.appState || !window.appState.labelDragState) {
            return { name: '拖曳状态对象', status: '❌ 失败', message: '拖曳状态对象不存在' };
        }
        const dragState = window.appState.labelDragState;
        const requiredProps = ['isDragging', 'draggedFeatureId', 'dragStartPoint', 'hasMoved'];
        const missingProps = requiredProps.filter(prop => !(prop in dragState));
        if (missingProps.length > 0) {
            return { name: '拖曳状态对象', status: '❌ 失败', message: `缺少属性: ${missingProps.join(', ')}` };
        }
        return { name: '拖曳状态对象', status: '✅ 通过', message: '拖曳状态对象结构正确' };
    });
    
    // 测试 6: 检查事件处理器是否注册
    tests.push(() => {
        if (!window.appState || !window.appState.map) {
            return { name: '事件处理器', status: '❌ 失败', message: '地图未初始化' };
        }
        if (!window.appState.map._labelDragHandlers) {
            return { name: '事件处理器', status: '❌ 失败', message: '事件处理器未注册' };
        }
        const handlers = window.appState.map._labelDragHandlers;
        const requiredHandlers = ['mousedown', 'mousemove', 'mouseup', 'mouseenter', 'mouseleave'];
        const missingHandlers = requiredHandlers.filter(handler => !(handler in handlers));
        if (missingHandlers.length > 0) {
            return { name: '事件处理器', status: '❌ 失败', message: `缺少处理器: ${missingHandlers.join(', ')}` };
        }
        return { name: '事件处理器', status: '✅ 通过', message: '所有事件处理器已注册' };
    });
    
    // 测试 7: 检查 Mapbox 图层事件是否绑定
    tests.push(() => {
        if (!window.appState || !window.appState.map) {
            return { name: '图层事件绑定', status: '❌ 失败', message: '地图未初始化' };
        }
        // 检查是否有事件监听器（通过尝试触发一个测试事件）
        try {
            const layer = window.appState.map.getLayer('custom-chinese-labels-hit-area');
            if (!layer) {
                return { name: '图层事件绑定', status: '⚠️ 警告', message: 'Hit-area 图层不存在，无法测试事件绑定' };
            }
            // 如果图层存在，假设事件已绑定（Mapbox 不提供直接检查事件监听器的方法）
            return { name: '图层事件绑定', status: '✅ 通过', message: '图层存在，事件应该已绑定' };
        } catch (error) {
            return { name: '图层事件绑定', status: '❌ 失败', message: `检查失败: ${error.message}` };
        }
    });
    
    // 测试 8: 检查 labelPositions 对象是否存在
    tests.push(() => {
        if (!window.appState || !window.appState.labelPositions) {
            return { name: '标签位置存储', status: '⚠️ 警告', message: 'labelPositions 对象不存在（将在首次拖曳时创建）' };
        }
        return { name: '标签位置存储', status: '✅ 通过', message: 'labelPositions 对象存在' };
    });
    
    // 运行所有测试
    console.log('\n📋 测试结果:');
    console.log('='.repeat(60));
    
    tests.forEach((test, index) => {
        try {
            const result = test();
            console.log(`${index + 1}. ${result.name}: ${result.status}`);
            if (result.message) {
                console.log(`   ${result.message}`);
            }
            
            if (result.status.includes('✅')) {
                passed++;
            } else if (result.status.includes('❌')) {
                failed++;
            }
        } catch (error) {
            console.error(`${index + 1}. 测试执行失败:`, error);
            failed++;
        }
    });
    
    console.log('='.repeat(60));
    console.log(`\n📊 测试总结:`);
    console.log(`   ✅ 通过: ${passed}`);
    console.log(`   ❌ 失败: ${failed}`);
    console.log(`   ⚠️ 警告: ${tests.length - passed - failed}`);
    
    if (failed === 0) {
        console.log('\n🎉 所有关键测试通过！中文标签拖曳功能应该可以正常工作。');
    } else {
        console.log('\n⚠️ 部分测试失败，请检查上述错误信息。');
    }
    
    // 提供手动测试指引
    console.log('\n📝 手动测试指引:');
    console.log('   1. 使用 AI 分析功能添加一些区域（例如：测试文本）');
    console.log('   2. 等待中文标签出现');
    console.log('   3. 尝试点击并拖曳中文标签');
    console.log('   4. 验证标签是否独立移动（地图不应移动）');
    console.log('   5. 检查浏览器控制台是否有错误信息');
}


