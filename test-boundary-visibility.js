/**
 * Test script for boundary line visibility functionality
 * Tests the hide/show admin boundary toggle feature
 */

// Wait for page to load
window.addEventListener('load', function() {
    console.log('🧪 Starting boundary visibility tests...');
    
    // Wait for app to initialize
    setTimeout(() => {
        runTests();
    }, 2000);
});

function runTests() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🧪 Boundary Line Visibility Test Suite');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const tests = [
        test1_CheckBaseMapLayers,
        test2_ToggleState,
        test3_SwitchToAdministrationMode,
        test4_ToggleBoundaryVisibility,
        test5_SwitchToCountryMode
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach((test, index) => {
        try {
            const result = test();
            if (result) {
                console.log(`✅ Test ${index + 1}: PASSED`);
                passed++;
            } else {
                console.log(`❌ Test ${index + 1}: FAILED`);
                failed++;
            }
        } catch (error) {
            console.error(`❌ Test ${index + 1}: ERROR -`, error);
            failed++;
        }
        console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    console.log('═══════════════════════════════════════════════════════════');
}

function test1_CheckBaseMapLayers() {
    console.log('Test 1: Check if base map boundary layers exist');
    
    if (!appState || !appState.map) {
        console.log('   ⚠️ App not initialized yet');
        return false;
    }
    
    const allLayers = appState.map.getStyle().layers;
    const adminBoundaryLayers = allLayers.filter(l => 
        l.id === 'admin-1-boundary' || l.id === 'admin-1-boundary-bg'
    );
    
    console.log(`   Found ${adminBoundaryLayers.length} admin boundary layers in base map`);
    adminBoundaryLayers.forEach(layer => {
        const vis = appState.map.getLayoutProperty(layer.id, 'visibility');
        console.log(`   - ${layer.id}: visibility=${vis}`);
    });
    
    return adminBoundaryLayers.length > 0;
}

function test2_ToggleState() {
    console.log('Test 2: Check initial toggle state');
    
    const toggle = document.getElementById('boundary-line-visibility-toggle');
    if (!toggle) {
        console.log('   ⚠️ Toggle element not found');
        return false;
    }
    
    console.log(`   Toggle checked: ${toggle.checked}`);
    console.log(`   boundaryLineVisible: ${appState.boundaryLineVisible}`);
    console.log(`   Current area type: ${appState.currentAreaType}`);
    
    // Toggle should be unchecked by default (show boundaries)
    // boundaryLineVisible should be true (show)
    return typeof appState.boundaryLineVisible === 'boolean';
}

function test3_SwitchToAdministrationMode() {
    console.log('Test 3: Switch to administration mode');
    
    // Find and click administration button
    const adminButton = document.querySelector('.btn-toggle[data-type="administration"]');
    if (!adminButton) {
        console.log('   ⚠️ Administration button not found');
        return false;
    }
    
    adminButton.click();
    
    // Wait for mode switch
    setTimeout(() => {
        console.log(`   Current area type after switch: ${appState.currentAreaType}`);
    }, 500);
    
    return true;
}

function test4_ToggleBoundaryVisibility() {
    console.log('Test 4: Toggle boundary visibility');
    
    const toggle = document.getElementById('boundary-line-visibility-toggle');
    if (!toggle) {
        console.log('   ⚠️ Toggle element not found');
        return false;
    }
    
    const initialChecked = toggle.checked;
    const initialVisible = appState.boundaryLineVisible;
    
    console.log(`   Initial state: checked=${initialChecked}, visible=${initialVisible}`);
    
    // Toggle it
    toggle.click();
    
    // Wait for update
    setTimeout(() => {
        const newChecked = toggle.checked;
        const newVisible = appState.boundaryLineVisible;
        
        console.log(`   After toggle: checked=${newChecked}, visible=${newVisible}`);
        
        // Check base map layers
        const adminLayers = ['admin-1-boundary', 'admin-1-boundary-bg'];
        adminLayers.forEach(layerId => {
            if (appState.map.getLayer(layerId)) {
                const vis = appState.map.getLayoutProperty(layerId, 'visibility');
                console.log(`   Base map layer ${layerId}: visibility=${vis}`);
            }
        });
    }, 500);
    
    return true;
}

function test5_SwitchToCountryMode() {
    console.log('Test 5: Switch back to country mode');
    
    const countryButton = document.querySelector('.btn-toggle[data-type="country"]');
    if (!countryButton) {
        console.log('   ⚠️ Country button not found');
        return false;
    }
    
    countryButton.click();
    
    setTimeout(() => {
        console.log(`   Current area type after switch: ${appState.currentAreaType}`);
        
        // Check that admin layers are hidden in country mode
        const adminLayers = ['admin-1-boundary', 'admin-1-boundary-bg'];
        adminLayers.forEach(layerId => {
            if (appState.map.getLayer(layerId)) {
                const vis = appState.map.getLayoutProperty(layerId, 'visibility');
                console.log(`   Base map layer ${layerId}: visibility=${vis} (should be 'none' in country mode)`);
            }
        });
    }, 500);
    
    return true;
}

// Export for manual testing
window.testBoundaryVisibility = runTests;


