/**
 * 边界数据加载诊断工具
 * Boundary Data Loading Diagnostic Tool
 */

(function () {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 边界数据加载诊断');
    console.log('='.repeat(70) + '\n');

    // 检查 GADM_LOADER
    console.log('1️⃣ 检查 GADM_LOADER:');
    if (window.GADM_LOADER) {
        console.log('  ✅ GADM_LOADER 已加载');
        console.log('  📋 配置:', window.GADM_LOADER.config);
        console.log('  📋 BASE_URL:', window.GADM_LOADER.config.BASE_URL);
    } else {
        console.log('  ❌ GADM_LOADER 未加载');
    }

    // 检查 appState.sources
    console.log('\n2️⃣ 检查 appState.sources:');
    if (window.appState && window.appState.sources) {
        console.log('  📊 Sources 状态:');
        for (const [key, value] of Object.entries(window.appState.sources)) {
            console.log(`    - ${key}:`, value);
        }
    } else {
        console.log('  ❌ appState.sources 不存在');
    }

    // 检查地图 sources
    console.log('\n3️⃣ 检查地图 sources:');
    if (window.appState && window.appState.map) {
        const style = window.appState.map.getStyle();
        if (style && style.sources) {
            console.log('  📊 地图 sources:');
            for (const [key, value] of Object.entries(style.sources)) {
                if (key.includes('gadm') || key.includes('boundary') || key.includes('boundaries')) {
                    console.log(`    - ${key}:`, value.type);
                }
            }
        }
    } else {
        console.log('  ❌ 地图未初始化');
    }

    // 检查边界图层
    console.log('\n4️⃣ 检查边界图层:');
    if (window.appState && window.appState.map) {
        const layers = [
            'visible-boundaries-country',
            'visible-boundaries-state',
            'visible-boundaries-city'
        ];

        layers.forEach(layerId => {
            const layer = window.appState.map.getLayer(layerId);
            if (layer) {
                console.log(`  ✅ ${layerId} 存在`);
                console.log(`     - source: ${layer.source}`);
                console.log(`     - type: ${layer.type}`);
                const visibility = window.appState.map.getLayoutProperty(layerId, 'visibility');
                console.log(`     - visibility: ${visibility}`);
            } else {
                console.log(`  ❌ ${layerId} 不存在`);
            }
        });
    }

    // 尝试手动加载测试
    console.log('\n5️⃣ 尝试手动加载测试:');

    async function testLoad() {
        const testUrl = './data/gadm/optimized/gadm_level0_optimized.geojson';
        console.log(`  📥 测试加载: ${testUrl}`);

        try {
            const response = await fetch(testUrl);
            console.log(`  📊 响应状态: ${response.status} ${response.statusText}`);
            console.log(`  📊 Content-Type: ${response.headers.get('content-type')}`);
            console.log(`  📊 Content-Length: ${response.headers.get('content-length')} bytes`);

            if (response.ok) {
                const contentLength = response.headers.get('content-length');
                if (contentLength) {
                    const sizeMB = (parseInt(contentLength) / (1024 * 1024)).toFixed(2);
                    console.log(`  📊 文件大小: ${sizeMB} MB`);
                }

                console.log('  ⏳ 开始读取数据...');
                const text = await response.text();
                console.log(`  ✅ 成功读取 ${(text.length / (1024 * 1024)).toFixed(2)} MB 数据`);

                console.log('  ⏳ 解析 JSON...');
                const json = JSON.parse(text);
                console.log(`  ✅ 成功解析 JSON`);
                console.log(`  📊 Features 数量: ${json.features ? json.features.length : 0}`);

                return true;
            } else {
                console.log(`  ❌ 加载失败: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.error('  ❌ 错误:', error.message);
            return false;
        }
    }

    testLoad().then(success => {
        console.log('\n' + '='.repeat(70));
        if (success) {
            console.log('✅ 诊断完成：GADM 数据文件可以正常加载');
            console.log('💡 建议：检查 GADM_LOADER 是否在地图加载时被正确调用');
        } else {
            console.log('❌ 诊断完成：GADM 数据文件加载失败');
            console.log('💡 建议：');
            console.log('   1. 检查文件路径是否正确');
            console.log('   2. 确认文件是否存在');
            console.log('   3. 检查浏览器控制台的网络请求');
        }
        console.log('='.repeat(70) + '\n');
    });

})();
