(function () {
    /**
     * Phase 7 专项集成测试
     * 
     * 专注测试：
     * - AI 助手功能
     * - 新闻分析功能
     * - AI 邻近标签功能
     * - 中文标签显示
     * - 标签拖拽功能
     */

    console.log('\n' + '='.repeat(70));
    console.log('🤖 Phase 7 集成测试 - AI 功能与标签系统');
    console.log('='.repeat(70) + '\n');

    // 测试结果统计
    const testResults = {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        categories: {}
    };

    // 辅助函数
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    function recordTest(category, testName, passed, message = '', isWarning = false) {
        testResults.total++;

        if (isWarning) {
            testResults.warnings++;
            console.log(`  ⚠️  ${testName}${message ? ': ' + message : ''}`);
        } else if (passed) {
            testResults.passed++;
            console.log(`  ✅ ${testName}`);
        } else {
            testResults.failed++;
            console.log(`  ❌ ${testName}${message ? ': ' + message : ''}`);
        }

        if (!testResults.categories[category]) {
            testResults.categories[category] = { passed: 0, failed: 0, warnings: 0 };
        }

        if (isWarning) {
            testResults.categories[category].warnings++;
        } else if (passed) {
            testResults.categories[category].passed++;
        } else {
            testResults.categories[category].failed++;
        }
    }

    // 测试 AI 助手界面
    async function testAIAssistantUI() {
        console.log('🎨 测试 AI 助手界面\n');

        // 测试 AI 助手面板
        const aiPanel = document.querySelector('#ai-assistant-panel') ||
            document.querySelector('.ai-assistant') ||
            document.querySelector('[class*="ai-assistant"]');
        recordTest('ai-ui', 'AI 助手面板存在', !!aiPanel);

        if (aiPanel) {
            // 检查面板可见性
            const isVisible = aiPanel.offsetParent !== null;
            recordTest('ai-ui', 'AI 助手面板可见', isVisible);

            // 检查面板内容
            const hasContent = aiPanel.textContent.trim().length > 0;
            recordTest('ai-ui', 'AI 助手面板有内容', hasContent);
        }

        // 测试新闻输入框
        const newsInput = document.querySelector('#news-input') ||
            document.querySelector('textarea[placeholder*="新闻"]') ||
            document.querySelector('textarea[placeholder*="news"]') ||
            document.querySelector('textarea[id*="news"]');
        recordTest('ai-ui', '新闻输入框存在', !!newsInput);

        if (newsInput) {
            recordTest('ai-ui', '新闻输入框可编辑', !newsInput.disabled);
        }

        // 测试分析按钮
        const analyzeBtn = document.querySelector('#analyze-news-btn') ||
            document.querySelector('button[id*="analyze"]') ||
            document.querySelector('button[class*="analyze"]');
        recordTest('ai-ui', '分析按钮存在', !!analyzeBtn);

        // 测试结果显示区域
        const resultArea = document.querySelector('#ai-result') ||
            document.querySelector('.ai-result') ||
            document.querySelector('[id*="result"]');
        recordTest('ai-ui', '结果显示区域存在', !!resultArea);

        console.log('');
    }

    // 测试 AI 助手功能
    async function testAIAssistantFunctions() {
        console.log('⚙️  测试 AI 助手功能\n');

        // 测试 AI 助手初始化函数
        const hasInitFunction = typeof window.initAIAssistant === 'function';
        recordTest('ai-functions', 'AI 助手初始化函数', hasInitFunction);

        // 测试 AI 助手对象
        const hasAIObject = window.AIAssistant !== undefined ||
            window.aiAssistant !== undefined ||
            window.appState?.aiAssistant !== undefined;
        recordTest('ai-functions', 'AI 助手对象存在', hasAIObject);

        // 测试新闻分析函数
        const hasAnalyzeFunction =
            typeof window.analyzeNews === 'function' ||
            typeof window.analyzeNewsWithAI === 'function' ||
            (window.AIAssistant && typeof window.AIAssistant.analyzeNews === 'function');
        recordTest('ai-functions', '新闻分析函数存在', hasAnalyzeFunction);

        // 测试地理提取函数
        const hasGeoExtractor =
            typeof window.extractGeographicInfo === 'function' ||
            typeof window.GeoExtractorAgent !== 'undefined' ||
            window.geoExtractor !== undefined;
        recordTest('ai-functions', '地理信息提取功能', hasGeoExtractor);

        console.log('');
    }

    // 测试 AI 邻近标签功能
    async function testAINeighborLabels() {
        console.log('🏷️  测试 AI 邻近标签功能\n');

        // 测试初始化函数
        const hasInitFunction = typeof window.initAINeighborLabels === 'function';
        recordTest('ai-labels', 'AI 邻近标签初始化函数', hasInitFunction);

        // 测试邻近标签对象
        const hasLabelObject =
            window.aiNeighborLabels !== undefined ||
            window.AINeighborLabels !== undefined ||
            window.appState?.aiNeighborLabels !== undefined;
        recordTest('ai-labels', 'AI 邻近标签对象存在', hasLabelObject);

        // 测试邻近区域查找函数
        const hasNeighborFunction =
            typeof window.findNeighborAreas === 'function' ||
            typeof window.getNeighborAreas === 'function' ||
            (window.aiNeighborLabels && typeof window.aiNeighborLabels.findNeighbors === 'function');
        recordTest('ai-labels', '邻近区域查找功能', hasNeighborFunction);

        // 测试自动标签功能
        const hasAutoLabelFunction =
            typeof window.autoLabelNeighbors === 'function' ||
            (window.aiNeighborLabels && typeof window.aiNeighborLabels.autoLabel === 'function');
        recordTest('ai-labels', '自动标签功能', hasAutoLabelFunction);

        console.log('');
    }

    // 测试标签系统
    async function testLabelSystem() {
        console.log('📝 测试标签系统\n');

        // 测试标签管理器
        const hasLabelManager =
            window.labelManager !== undefined ||
            window.appState?.labelManager !== undefined;
        recordTest('labels', '标签管理器存在', hasLabelManager);

        // 测试标签显示控件
        const labelCheckbox = document.querySelector('#show-labels') ||
            document.querySelector('input[type="checkbox"][name*="label"]') ||
            document.querySelector('input[id*="label"]');
        recordTest('labels', '标签显示控件存在', !!labelCheckbox);

        // 测试标签图层
        const map = window.appState?.map;
        if (map) {
            const labelLayers = [
                'area-labels',
                'boundary-labels',
                'custom-labels'
            ];

            let foundLayers = 0;
            labelLayers.forEach(layerId => {
                if (map.getLayer(layerId)) foundLayers++;
            });

            recordTest('labels', '标签图层加载',
                foundLayers > 0,
                `找到 ${foundLayers}/${labelLayers.length} 个标签图层`
            );
        } else {
            recordTest('labels', '标签图层加载', false, '地图未初始化');
        }

        // 测试标签创建函数
        const hasCreateFunction =
            typeof window.createLabel === 'function' ||
            typeof window.addLabel === 'function' ||
            (window.labelManager && typeof window.labelManager.create === 'function');
        recordTest('labels', '标签创建函数', hasCreateFunction);

        console.log('');
    }

    // 测试中文标签支持
    async function testChineseLabels() {
        console.log('🇨🇳 测试中文标签支持\n');

        // 测试中文标签获取函数
        const hasChineseFunction =
            typeof window.getChineseLabel === 'function' ||
            typeof window.getAreaLabel === 'function' ||
            typeof window.translateToChines === 'function';
        recordTest('chinese', '中文标签函数存在', hasChineseFunction);

        // 测试中文标签数据
        const hasChineseData =
            window.chineseLabels !== undefined ||
            window.CHINESE_LABELS !== undefined ||
            window.labelTranslations !== undefined;
        recordTest('chinese', '中文标签数据存在', hasChineseData);

        // 测试示例中文标签
        if (hasChineseFunction) {
            let testPassed = false;
            let testResult = '';

            try {
                // 尝试获取一些常见地区的中文标签
                const testAreas = ['Guangdong', 'Beijing', 'Shanghai', 'Taiwan'];
                const results = [];

                for (const area of testAreas) {
                    let label = '';
                    if (typeof window.getChineseLabel === 'function') {
                        label = window.getChineseLabel(area);
                    } else if (typeof window.getAreaLabel === 'function') {
                        label = window.getAreaLabel(area);
                    }

                    if (label && label !== area) {
                        results.push(`${area} → ${label}`);
                    }
                }

                testPassed = results.length > 0;
                testResult = results.length > 0 ?
                    `成功获取 ${results.length} 个中文标签` :
                    '未能获取中文标签';

            } catch (error) {
                testResult = `错误: ${error.message}`;
            }

            recordTest('chinese', '中文标签转换测试', testPassed, testResult);
        }

        console.log('');
    }

    // 测试标签拖拽功能
    async function testLabelDragging() {
        console.log('🖱️  测试标签拖拽功能\n');

        // 测试拖拽初始化
        const hasDragInit =
            typeof window.initLabelDragging === 'function' ||
            typeof window.enableLabelDrag === 'function' ||
            (window.labelManager && typeof window.labelManager.enableDrag === 'function');
        recordTest('dragging', '拖拽功能初始化', hasDragInit);

        // 测试拖拽状态
        const hasDragState =
            window.labelDraggingEnabled !== undefined ||
            window.appState?.labelDraggingEnabled !== undefined ||
            (window.labelManager && window.labelManager.draggingEnabled !== undefined);
        recordTest('dragging', '拖拽状态管理', hasDragState);

        // 测试拖拽事件处理
        const hasDragHandlers =
            typeof window.onLabelDragStart === 'function' ||
            typeof window.onLabelDrag === 'function' ||
            typeof window.onLabelDragEnd === 'function';
        recordTest('dragging', '拖拽事件处理器', hasDragHandlers);

        // 测试位置保存
        const hasPositionSave =
            typeof window.saveLabelPosition === 'function' ||
            (window.labelManager && typeof window.labelManager.savePosition === 'function');
        recordTest('dragging', '标签位置保存功能', hasPositionSave);

        console.log('');
    }

    // 测试 Gemini API 配置
    async function testGeminiAPI() {
        console.log('🔑 测试 Gemini API 配置\n');

        // 测试 API Key 存在
        const hasApiKey =
            window.GEMINI_API_KEY !== undefined ||
            window.appState?.geminiApiKey !== undefined ||
            localStorage.getItem('geminiApiKey') !== null;

        if (hasApiKey) {
            recordTest('api', 'Gemini API Key 已配置', true);

            // 检查 API Key 格式
            let apiKey = window.GEMINI_API_KEY ||
                window.appState?.geminiApiKey ||
                localStorage.getItem('geminiApiKey');

            const isValidFormat = apiKey && apiKey.length > 20;
            recordTest('api', 'API Key 格式有效', isValidFormat);

        } else {
            recordTest('api', 'Gemini API Key 已配置', false,
                'API Key 未配置，AI 功能将无法使用', true);
        }

        // 测试 API 调用函数
        const hasApiFunction =
            typeof window.callGeminiAPI === 'function' ||
            typeof window.geminiAPI === 'function' ||
            window.gemini !== undefined;
        recordTest('api', 'API 调用函数存在', hasApiFunction);

        console.log('');
    }

    // 测试集成场景
    async function testIntegrationScenarios() {
        console.log('🔄 测试集成场景\n');

        // 场景 1: 新闻分析 → 区域选择 → 标签显示
        const scenario1Ready =
            (typeof window.analyzeNews === 'function' ||
                typeof window.analyzeNewsWithAI === 'function') &&
            typeof window.applyColorToArea === 'function' &&
            (window.labelManager !== undefined ||
                typeof window.createLabel === 'function');

        recordTest('integration', '新闻分析完整流程', scenario1Ready,
            scenario1Ready ? '所有必需功能就绪' : '部分功能缺失'
        );

        // 场景 2: 区域选择 → AI 邻近标签 → 自动标注
        const scenario2Ready =
            typeof window.applyColorToArea === 'function' &&
            (typeof window.findNeighborAreas === 'function' ||
                window.aiNeighborLabels !== undefined) &&
            (typeof window.autoLabelNeighbors === 'function' ||
                typeof window.createLabel === 'function');

        recordTest('integration', 'AI 邻近标签流程', scenario2Ready,
            scenario2Ready ? '所有必需功能就绪' : '部分功能缺失'
        );

        // 场景 3: 标签显示 → 拖拽调整 → 位置保存
        const scenario3Ready =
            (window.labelManager !== undefined ||
                typeof window.createLabel === 'function') &&
            (typeof window.initLabelDragging === 'function' ||
                typeof window.enableLabelDrag === 'function') &&
            (typeof window.saveLabelPosition === 'function' ||
                typeof window.saveMapState === 'function');

        recordTest('integration', '标签拖拽保存流程', scenario3Ready,
            scenario3Ready ? '所有必需功能就绪' : '部分功能缺失'
        );

        console.log('');
    }

    // 运行所有测试
    async function runAllTests() {
        try {
            await testAIAssistantUI();
            await wait(300);

            await testAIAssistantFunctions();
            await wait(300);

            await testAINeighborLabels();
            await wait(300);

            await testLabelSystem();
            await wait(300);

            await testChineseLabels();
            await wait(300);

            await testLabelDragging();
            await wait(300);

            await testGeminiAPI();
            await wait(300);

            await testIntegrationScenarios();

            // 打印总结
            console.log('='.repeat(70));
            console.log('📊 Phase 7 测试总结');
            console.log('='.repeat(70));
            console.log(`\n总计: ${testResults.total} 个测试`);
            console.log(`✅ 通过: ${testResults.passed} 个`);
            console.log(`❌ 失败: ${testResults.failed} 个`);
            console.log(`⚠️  警告: ${testResults.warnings} 个`);

            const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
            console.log(`成功率: ${successRate}%\n`);

            // 各类别详情
            console.log('各功能类别详情:');
            Object.keys(testResults.categories).forEach(category => {
                const cat = testResults.categories[category];
                const total = cat.passed + cat.failed + cat.warnings;
                const rate = ((cat.passed / total) * 100).toFixed(0);

                let status = '✅';
                if (cat.failed > 0) status = '❌';
                else if (cat.warnings > 0) status = '⚠️';

                console.log(`  ${status} ${category}: ${cat.passed}/${total} 通过 (${rate}%)`);
                if (cat.warnings > 0) {
                    console.log(`     └─ ${cat.warnings} 个警告`);
                }
            });

            console.log('\n' + '='.repeat(70));

            if (testResults.failed === 0 && testResults.warnings === 0) {
                console.log('🎉 所有 Phase 7 测试通过！AI 功能完全就绪！');
            } else if (testResults.failed === 0) {
                console.log('✅ 核心功能测试通过，但有一些警告需要注意');
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
        console.error('Phase 7 测试失败:', error);
    });

})();
