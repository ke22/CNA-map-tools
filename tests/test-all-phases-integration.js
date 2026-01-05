(function () {
    /**
     * 完整集成测试 - 所有阶段
     * 
     * 测试覆盖：
     * - Phase 1: 基础功能
     * - Phase 2: 边界选择
     * - Phase 3: 标签功能
     * - Phase 4: 标记功能
     * - Phase 5: UI 控件
     * - Phase 6: 数据持久化
     * - Phase 7: AI 功能
     */

    console.log('\n' + '='.repeat(70));
    console.log('🧪 开始所有阶段集成测试');
    console.log('='.repeat(70) + '\n');

    // 测试结果统计
    const testResults = {
        total: 0,
        passed: 0,
        failed: 0,
        phases: {}
    };

    // 辅助函数：等待
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // 辅助函数：记录测试结果
    function recordTest(phase, testName, passed, message = '') {
        testResults.total++;
        if (passed) {
            testResults.passed++;
            console.log(`  ✅ ${testName}`);
        } else {
            testResults.failed++;
            console.log(`  ❌ ${testName}${message ? ': ' + message : ''}`);
        }

        if (!testResults.phases[phase]) {
            testResults.phases[phase] = { passed: 0, failed: 0 };
        }

        if (passed) {
            testResults.phases[phase].passed++;
        } else {
            testResults.phases[phase].failed++;
        }
    }

    // Phase 1: 基础功能测试
    async function testPhase1() {
        console.log('📋 Phase 1: 基础功能测试\n');

        // 测试 1.1: 地图初始化
        recordTest('phase1', '地图初始化',
            window.appState && window.appState.map,
            '地图对象不存在'
        );

        // 测试 1.2: 核心函数存在
        recordTest('phase1', '核心函数加载',
            typeof window.applyColorToArea === 'function' &&
            typeof window.handleMapClick === 'function'
        );

        // 测试 1.3: 地图样式加载
        const map = window.appState?.map;
        recordTest('phase1', '地图样式加载',
            map && map.getStyle() !== undefined
        );

        // 测试 1.4: 控件面板存在
        const controlPanel = document.querySelector('.control-panel') ||
            document.querySelector('#control-panel');
        recordTest('phase1', '控件面板存在', !!controlPanel);

        // 测试 1.5: appState 初始化
        recordTest('phase1', 'appState 初始化',
            window.appState &&
            Array.isArray(window.appState.selectedAreas) &&
            typeof window.appState.currentAreaType === 'string'
        );

        console.log('');
    }

    // Phase 2: 边界选择测试
    async function testPhase2() {
        console.log('📋 Phase 2: 边界选择测试\n');

        const map = window.appState?.map;
        if (!map) {
            recordTest('phase2', '边界选择测试', false, '地图未初始化');
            console.log('');
            return;
        }

        // 测试 2.1: 国家选择下拉菜单
        const countrySelect = document.querySelector('#country-select') ||
            document.querySelector('select[name="country"]');
        recordTest('phase2', '国家选择控件存在', !!countrySelect);

        // 测试 2.2: 边界图层存在
        const boundaryLayers = [
            'visible-boundaries-country',
            'visible-boundaries-state',
            'visible-boundaries-city'
        ];

        let layersFound = 0;
        boundaryLayers.forEach(layerId => {
            if (map.getLayer(layerId)) layersFound++;
        });

        recordTest('phase2', '边界图层加载',
            layersFound > 0,
            `找到 ${layersFound}/3 个边界图层`
        );

        // 测试 2.3: 区域类型切换
        recordTest('phase2', '区域类型设置',
            window.appState.currentAreaType &&
            ['country', 'administration', 'city'].includes(window.appState.currentAreaType)
        );

        // 测试 2.4: 选中区域数组
        recordTest('phase2', '选中区域数组',
            Array.isArray(window.appState.selectedAreas)
        );

        console.log('');
    }

    // Phase 3: 标签功能测试
    async function testPhase3() {
        console.log('📋 Phase 3: 标签功能测试\n');

        // 测试 3.1: 标签显示控件
        const labelCheckbox = document.querySelector('#show-labels') ||
            document.querySelector('input[type="checkbox"][name*="label"]');
        recordTest('phase3', '标签显示控件存在', !!labelCheckbox);

        // 测试 3.2: 标签管理器
        recordTest('phase3', '标签管理器存在',
            window.labelManager !== undefined ||
            window.appState?.labelManager !== undefined
        );

        // 测试 3.3: 中文标签支持
        recordTest('phase3', '中文标签支持',
            typeof window.getChineseLabel === 'function' ||
            typeof window.getAreaLabel === 'function'
        );

        // 测试 3.4: 标签拖拽功能
        const map = window.appState?.map;
        const hasLabelLayers = map && (
            map.getLayer('area-labels') ||
            map.getLayer('boundary-labels')
        );
        recordTest('phase3', '标签图层存在', !!hasLabelLayers);

        console.log('');
    }

    // Phase 4: 标记功能测试
    async function testPhase4() {
        console.log('📋 Phase 4: 标记功能测试\n');

        // 测试 4.1: 添加标记按钮
        const addMarkerBtn = document.querySelector('#add-marker-btn') ||
            document.querySelector('button[id*="marker"]') ||
            document.querySelector('button[class*="marker"]');
        recordTest('phase4', '添加标记按钮存在', !!addMarkerBtn);

        // 测试 4.2: 标记管理器
        recordTest('phase4', '标记管理器存在',
            window.markerManager !== undefined ||
            window.appState?.markers !== undefined
        );

        // 测试 4.3: 标记数组
        const hasMarkers = Array.isArray(window.appState?.markers) ||
            Array.isArray(window.markers);
        recordTest('phase4', '标记数组初始化', hasMarkers);

        console.log('');
    }

    // Phase 5: UI 控件测试
    async function testPhase5() {
        console.log('📋 Phase 5: UI 控件测试\n');

        // 测试 5.1: 颜色预设按钮
        const colorPresets = document.querySelectorAll('.color-preset') ||
            document.querySelectorAll('button[data-color]');
        recordTest('phase5', '颜色预设按钮',
            colorPresets.length > 0,
            `找到 ${colorPresets.length} 个颜色预设`
        );

        // 测试 5.2: 透明度滑块
        const opacitySlider = document.querySelector('#opacity-slider') ||
            document.querySelector('input[type="range"][name*="opacity"]');
        recordTest('phase5', '透明度滑块存在', !!opacitySlider);

        // 测试 5.3: 边界宽度滑块
        const borderWidthSlider = document.querySelector('#border-width-slider') ||
            document.querySelector('input[type="range"][name*="border"]') ||
            document.querySelector('input[type="range"][name*="width"]');
        recordTest('phase5', '边界宽度滑块存在', !!borderWidthSlider);

        // 测试 5.4: 当前颜色状态
        recordTest('phase5', '当前颜色状态',
            window.appState?.currentColor !== undefined
        );

        // 测试 5.5: 颜色应用函数
        recordTest('phase5', '颜色应用函数',
            typeof window.applyColorToArea === 'function'
        );

        console.log('');
    }

    // Phase 6: 数据持久化测试
    async function testPhase6() {
        console.log('📋 Phase 6: 数据持久化测试\n');

        // 测试 6.1: localStorage 可用
        let localStorageAvailable = false;
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            localStorageAvailable = true;
        } catch (e) {
            // localStorage 不可用
        }
        recordTest('phase6', 'localStorage 可用', localStorageAvailable);

        // 测试 6.2: 保存功能
        recordTest('phase6', '保存功能存在',
            typeof window.saveMapState === 'function' ||
            typeof window.saveState === 'function'
        );

        // 测试 6.3: 加载功能
        recordTest('phase6', '加载功能存在',
            typeof window.loadMapState === 'function' ||
            typeof window.loadState === 'function'
        );

        // 测试 6.4: 导出功能
        const exportBtn = document.querySelector('#export-btn') ||
            document.querySelector('button[id*="export"]');
        recordTest('phase6', '导出按钮存在', !!exportBtn);

        console.log('');
    }

    // Phase 7: AI 功能测试
    async function testPhase7() {
        console.log('📋 Phase 7: AI 功能测试\n');

        // 测试 7.1: AI 助手面板
        const aiPanel = document.querySelector('#ai-assistant-panel') ||
            document.querySelector('.ai-assistant') ||
            document.querySelector('[class*="ai-assistant"]');
        recordTest('phase7', 'AI 助手面板存在', !!aiPanel);

        // 测试 7.2: AI 助手函数
        recordTest('phase7', 'AI 助手函数存在',
            typeof window.initAIAssistant === 'function' ||
            typeof window.AIAssistant !== 'undefined'
        );

        // 测试 7.3: 新闻分析功能
        const newsInput = document.querySelector('#news-input') ||
            document.querySelector('textarea[placeholder*="新闻"]') ||
            document.querySelector('textarea[placeholder*="news"]');
        recordTest('phase7', '新闻输入框存在', !!newsInput);

        // 测试 7.4: AI 邻近标签功能
        recordTest('phase7', 'AI 邻近标签功能',
            typeof window.initAINeighborLabels === 'function' ||
            window.aiNeighborLabels !== undefined
        );

        // 测试 7.5: Gemini API 配置
        const hasGeminiConfig =
            window.GEMINI_API_KEY !== undefined ||
            window.appState?.geminiApiKey !== undefined ||
            localStorage.getItem('geminiApiKey') !== null;
        recordTest('phase7', 'Gemini API 配置',
            hasGeminiConfig,
            hasGeminiConfig ? '' : 'API Key 未配置'
        );

        console.log('');
    }

    // 运行所有测试
    async function runAllTests() {
        try {
            await testPhase1();
            await wait(500);

            await testPhase2();
            await wait(500);

            await testPhase3();
            await wait(500);

            await testPhase4();
            await wait(500);

            await testPhase5();
            await wait(500);

            await testPhase6();
            await wait(500);

            await testPhase7();

            // 打印总结
            console.log('='.repeat(70));
            console.log('📊 测试总结');
            console.log('='.repeat(70));
            console.log(`\n总计: ${testResults.total} 个测试`);
            console.log(`✅ 通过: ${testResults.passed} 个`);
            console.log(`❌ 失败: ${testResults.failed} 个`);
            console.log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%\n`);

            // 各阶段详情
            console.log('各阶段详情:');
            Object.keys(testResults.phases).forEach(phase => {
                const phaseResult = testResults.phases[phase];
                const total = phaseResult.passed + phaseResult.failed;
                const rate = ((phaseResult.passed / total) * 100).toFixed(0);
                console.log(`  ${phase}: ${phaseResult.passed}/${total} 通过 (${rate}%)`);
            });

            console.log('\n' + '='.repeat(70));

            if (testResults.failed === 0) {
                console.log('🎉 所有测试通过！');
            } else {
                console.log('⚠️  部分测试失败，请检查上述详情');
            }

            console.log('='.repeat(70) + '\n');

            return testResults;

        } catch (error) {
            console.error('❌ 测试执行出错:', error);
            throw error;
        }
    }

    // 自动运行
    runAllTests().catch(error => {
        console.error('测试失败:', error);
    });

})();
