/**
 * 中文标签拖曳功能 - 控制台快速测试
 * 在浏览器控制台中运行此脚本进行快速测试
 * 
 * 使用方法:
 * 1. 打开浏览器控制台 (F12)
 * 2. 复制粘贴此脚本并运行
 * 3. 查看测试结果
 */

(function() {
    console.log('%c🧪 中文标签拖曳功能 - 快速测试', 'font-size: 16px; font-weight: bold; color: #007bff;');
    console.log('='.repeat(60));
    
    // 检查是否在主页面上下文中
    if (typeof window.appState === 'undefined') {
        console.error('%c❌ 错误: appState 未定义', 'color: red; font-weight: bold;');
        console.log('');
        console.log('%c📋 解决方案:', 'font-weight: bold;');
        console.log('   此测试脚本必须在主页面 (index-enhanced.html) 的控制台中运行');
        console.log('');
        console.log('%c💡 使用步骤:', 'font-weight: bold;');
        console.log('   1. 确保已打开主页面: http://localhost:8000/index-enhanced.html');
        console.log('   2. 打开浏览器控制台 (F12)');
        console.log('   3. 复制此脚本的内容并粘贴到控制台运行');
        console.log('');
        return {
            passed: 0,
            failed: 1,
            warned: 0,
            total: 1,
            success: false,
            error: 'appState 未定义 - 请在主页面控制台中运行此测试'
        };
    }
    
    const tests = [];
    let passed = 0;
    let failed = 0;
    let warned = 0;
    
    // 测试 1: appState
    tests.push(() => {
        if (!window.appState) {
            console.error('❌ appState 未定义');
            return 'fail';
        }
        console.log('✅ appState 存在');
        return 'pass';
    });
    
    // 测试 2: 地图
    tests.push(() => {
        if (!window.appState || !window.appState.map) {
            console.error('❌ 地图未初始化');
            return 'fail';
        }
        if (!window.appState.map.loaded()) {
            console.warn('⚠️ 地图正在加载中');
            return 'warn';
        }
        console.log('✅ 地图已加载');
        return 'pass';
    });
    
    // 测试 3: 标签数据源
    tests.push(() => {
        if (!window.appState || !window.appState.map) {
            console.error('❌ 地图未初始化');
            return 'fail';
        }
        const source = window.appState.map.getSource('custom-chinese-labels');
        if (!source) {
            console.warn('⚠️ 标签数据源不存在（可能还没有选中区域）');
            return 'warn';
        }
        const featureCount = source._data?.features?.length || 0;
        console.log(`✅ 标签数据源存在 (${featureCount} 个标签)`);
        return 'pass';
    });
    
    // 测试 4: 标签图层
    tests.push(() => {
        if (!window.appState || !window.appState.map) {
            console.error('❌ 地图未初始化');
            return 'fail';
        }
        const layer = window.appState.map.getLayer('custom-chinese-labels');
        if (!layer) {
            console.warn('⚠️ 标签图层不存在（可能还没有选中区域）');
            return 'warn';
        }
        console.log('✅ 标签图层存在');
        return 'pass';
    });
    
    // 测试 5: Hit-area 图层
    tests.push(() => {
        if (!window.appState || !window.appState.map) {
            console.error('❌ 地图未初始化');
            return 'fail';
        }
        const layer = window.appState.map.getLayer('custom-chinese-labels-hit-area');
        if (!layer) {
            console.warn('⚠️ Hit-area 图层不存在（可能还没有选中区域）');
            return 'warn';
        }
        console.log('✅ Hit-area 图层存在');
        return 'pass';
    });
    
    // 测试 6: 拖曳状态
    tests.push(() => {
        if (!window.appState || !window.appState.labelDragState) {
            console.error('❌ 拖曳状态对象不存在');
            return 'fail';
        }
        const dragState = window.appState.labelDragState;
        const requiredProps = ['isDragging', 'draggedFeatureId', 'dragStartPoint', 'hasMoved'];
        const missingProps = requiredProps.filter(prop => !(prop in dragState));
        if (missingProps.length > 0) {
            console.error(`❌ 缺少属性: ${missingProps.join(', ')}`);
            return 'fail';
        }
        console.log('✅ 拖曳状态对象结构正确');
        console.log('   当前状态:', {
            isDragging: dragState.isDragging,
            draggedFeatureId: dragState.draggedFeatureId,
            hasMoved: dragState.hasMoved
        });
        return 'pass';
    });
    
    // 测试 7: 事件处理器
    tests.push(() => {
        if (!window.appState || !window.appState.map) {
            console.error('❌ 地图未初始化');
            return 'fail';
        }
        // 检查标签图层是否存在（如果不存在，事件处理器也不会存在）
        const labelLayer = window.appState.map.getLayer('custom-chinese-labels');
        if (!labelLayer) {
            console.warn('⚠️ 事件处理器未注册（可能还没有选中区域，标签图层不存在）');
            return 'warn';
        }
        if (!window.appState.map._labelDragHandlers) {
            console.error('❌ 事件处理器未注册（标签图层存在但处理器未注册）');
            return 'fail';
        }
        const handlers = window.appState.map._labelDragHandlers;
        const requiredHandlers = ['mousedown', 'mousemove', 'mouseup', 'mouseenter', 'mouseleave'];
        const missingHandlers = requiredHandlers.filter(handler => !(handler in handlers));
        if (missingHandlers.length > 0) {
            console.error(`❌ 缺少处理器: ${missingHandlers.join(', ')}`);
            return 'fail';
        }
        console.log('✅ 所有事件处理器已注册');
        console.log('   处理器列表:', Object.keys(handlers));
        return 'pass';
    });
    
    // 测试 8: labelPositions
    tests.push(() => {
        if (!window.appState || !window.appState.labelPositions) {
            console.warn('⚠️ labelPositions 对象不存在（将在首次拖曳时创建）');
            return 'warn';
        }
        const positionCount = Object.keys(window.appState.labelPositions).length;
        console.log(`✅ labelPositions 对象存在 (${positionCount} 个位置)`);
        return 'pass';
    });
    
    // 运行所有测试
    tests.forEach((test, index) => {
        try {
            const result = test();
            if (result === 'pass') {
                passed++;
            } else if (result === 'fail') {
                failed++;
            } else {
                warned++;
            }
        } catch (error) {
            console.error(`${index + 1}. 测试执行失败:`, error);
            failed++;
        }
    });
    
    // 输出总结
    console.log('='.repeat(60));
    console.log('%c📊 测试总结', 'font-size: 14px; font-weight: bold;');
    console.log(`   ✅ 通过: ${passed}`);
    console.log(`   ❌ 失败: ${failed}`);
    console.log(`   ⚠️ 警告: ${warned}`);
    
    if (failed === 0) {
        console.log('%c🎉 所有关键测试通过！中文标签拖曳功能应该可以正常工作。', 'color: green; font-weight: bold;');
    } else {
        console.log('%c⚠️ 部分测试失败，请检查上述错误信息。', 'color: red; font-weight: bold;');
    }
    
    // 提供手动测试指引
    console.log('\n📝 手动测试指引:');
    console.log('  1. 使用 AI 分析功能添加一些区域（点击"测试"按钮）');
    console.log('  2. 等待中文标签出现');
    console.log('  3. 尝试点击并拖曳中文标签');
    console.log('  4. 验证标签是否独立移动（地图不应移动）');
    console.log('  5. 检查浏览器控制台是否有错误信息');
    
    // 返回测试结果对象
    return {
        passed,
        failed,
        warned,
        total: tests.length,
        success: failed === 0
    };
})();

