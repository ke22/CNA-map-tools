/**
 * 快速启动脚本 - 一键加载所有测试工具
 * 
 * 使用方法：
 * 1. 打开浏览器控制台
 * 2. 复制并运行以下代码，或者直接运行此脚本
 */

console.log('🚀 快速启动测试工具...\n');

// 加载诊断脚本
function loadDiagnoseScript() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'test-diagnose.js';
        script.onload = () => {
            console.log('✅ 诊断脚本已加载\n');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ 无法加载诊断脚本');
            reject(new Error('Failed to load diagnose script'));
        };
        document.body.appendChild(script);
    });
}

// 加载测试脚本
function loadTestScript() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'test-countries-auto.js';
        script.onload = () => {
            console.log('✅ 测试脚本已加载\n');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ 无法加载测试脚本');
            reject(new Error('Failed to load test script'));
        };
        document.body.appendChild(script);
    });
}

// 主函数
async function quickStart() {
    try {
        console.log('📥 加载诊断脚本...');
        await loadDiagnoseScript();
        
        // 等待一下确保脚本完全加载
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('🔍 运行诊断...\n');
        
        // 检查诊断函数是否存在
        if (typeof window.diagnoseTestEnvironment === 'function') {
            const result = diagnoseTestEnvironment();
            
            if (result && result.canRunTests) {
                console.log('\n✨ 诊断通过！准备加载测试脚本...\n');
                
                await loadTestScript();
                
                // 等待测试脚本加载
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                console.log('\n' + '='.repeat(60));
                console.log('✅ 所有工具已加载！');
                console.log('='.repeat(60));
                console.log('\n💡 可用的测试命令：');
                console.log('   • await quickTest()              - 快速测试关键国家');
                console.log('   • await testMainCountries()      - 测试所有国家');
                console.log('   • await testSingleCountry("Taiwan") - 测试单个国家');
                console.log('   • diagnoseTestEnvironment()      - 重新运行诊断');
                console.log('\n🚀 开始测试：');
                console.log('   await quickTest()\n');
            } else {
                console.log('\n⚠️  环境检查未通过，请先解决上述问题');
                console.log('💡 修复后重新运行此脚本\n');
            }
        } else {
            console.error('❌ 诊断脚本未正确加载');
            console.log('💡 请检查 test-diagnose.js 文件是否存在\n');
        }
    } catch (error) {
        console.error('❌ 加载失败:', error);
        console.log('\n💡 请确保：');
        console.log('   1. 文件路径正确');
        console.log('   2. 使用本地服务器运行（不能直接用 file:// 协议）');
        console.log('   3. 检查浏览器控制台的网络错误\n');
    }
}

// 自动运行
quickStart();

// 导出到全局
window.quickStart = quickStart;
window.loadDiagnoseScript = loadDiagnoseScript;
window.loadTestScript = loadTestScript;

console.log('\n💡 提示：也可以手动运行 quickStart() 来重新加载所有工具\n');

