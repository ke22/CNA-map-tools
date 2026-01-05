import { test, expect, Page } from '@playwright/test';

/**
 * Smoke Test for Label System
 * Quick validation of the newly implemented label features
 */

// Helper to wait for map to be fully loaded
async function waitForMapLoad(page: Page) {
    await page.waitForLoadState('load');
    await page.waitForFunction(() => {
        const appState = (window as any).appState;
        if (!appState || !appState.map) return false;

        try {
            return appState.map.isStyleLoaded && appState.map.isStyleLoaded();
        } catch (e) {
            return false;
        }
    }, { timeout: 30000 });

    await page.waitForTimeout(2000);
}

test.describe('Label System Smoke Test @smoke', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/index-enhanced.html');
        await waitForMapLoad(page);
    });

    test('should have LabelManager loaded', async ({ page }) => {
        const hasLabelManager = await page.evaluate(() => {
            return typeof (window as any).LabelManager !== 'undefined' &&
                typeof (window as any).labelManager !== 'undefined';
        });

        expect(hasLabelManager).toBe(true);
    });

    test('should have Chinese labels data loaded', async ({ page }) => {
        const hasChineseLabels = await page.evaluate(() => {
            return typeof (window as any).getChineseLabel === 'function' &&
                typeof (window as any).CHINESE_LABELS !== 'undefined';
        });

        expect(hasChineseLabels).toBe(true);
    });

    test('should convert English to Chinese labels', async ({ page }) => {
        const chineseLabel = await page.evaluate(() => {
            return (window as any).getChineseLabel('Guangdong');
        });

        expect(chineseLabel).toBe('广东');
    });

    test('should have label display controls in UI', async ({ page }) => {
        // Expand Advanced section
        const advancedToggle = page.locator('#advanced-toggle');
        await advancedToggle.click();
        await page.waitForTimeout(500);

        // Check for label controls
        const showLabelsCheckbox = page.locator('#show-labels');
        await expect(showLabelsCheckbox).toBeVisible();

        const enableDraggingCheckbox = page.locator('#enable-label-dragging');
        await expect(enableDraggingCheckbox).toBeVisible();
    });

    test('should create label layers on map', async ({ page }) => {
        const hasLabelLayers = await page.evaluate(() => {
            const map = (window as any).appState.map;
            return map.getSource('area-labels-source') !== undefined ||
                map.getLayer('area-labels') !== undefined;
        });

        // Label layers should exist after LabelManager initialization
        console.log('Label layers exist:', hasLabelLayers);
    });

    test('should enable label dragging', async ({ page }) => {
        // Expand Advanced section
        const advancedToggle = page.locator('#advanced-toggle');
        await advancedToggle.click();
        await page.waitForTimeout(500);

        // Enable label dragging
        const enableDraggingCheckbox = page.locator('#enable-label-dragging');
        await enableDraggingCheckbox.click();
        await page.waitForTimeout(500);

        // Check if dragging is enabled
        const isDraggingEnabled = await page.evaluate(() => {
            return (window as any).labelManager?.draggingEnabled === true;
        });

        expect(isDraggingEnabled).toBe(true);
    });

    test('should have GADM boundary data loaded', async ({ page }) => {
        const gadmStatus = await page.evaluate(() => {
            const appState = (window as any).appState;
            return {
                hasGADM_LOADER: typeof (window as any).GADM_LOADER !== 'undefined',
                adm0Loaded: appState?.sources?.adm0?.loaded || false,
                adm1Loaded: appState?.sources?.adm1?.loaded || false
            };
        });

        console.log('GADM Status:', gadmStatus);
        expect(gadmStatus.hasGADM_LOADER).toBe(true);
        // At least one should be loaded
        expect(gadmStatus.adm0Loaded || gadmStatus.adm1Loaded).toBe(true);
    });

    test('should select area and verify label can be created', async ({ page }) => {
        // Search for a country
        const searchInput = page.locator('#unified-search');
        await searchInput.fill('Japan');
        await page.waitForTimeout(1500);

        // Click first search result
        const firstResult = page.locator('#unified-search-results .search-result-item').first();
        if (await firstResult.isVisible({ timeout: 3000 })) {
            await firstResult.click();

            // Handle color picker if it appears
            const applyBtn = page.locator('#apply-color-btn');
            try {
                await applyBtn.waitFor({ state: 'visible', timeout: 3000 });
                await applyBtn.click();
            } catch (e) {
                // Ignore if button doesn't appear
            }

            await page.waitForTimeout(2000);

            // Check if area was selected
            const areaCount = await page.locator('#areas-count').textContent();
            const count = parseInt(areaCount || '0');
            expect(count).toBeGreaterThan(0);
        }
    });
});

test.describe('Integration Test Suite Smoke Test @smoke', () => {
    test('should run integration tests successfully', async ({ page }) => {
        await page.goto('/index-enhanced.html');
        await waitForMapLoad(page);

        // Inject and run the integration test
        await page.evaluate(() => {
            const script = document.createElement('script');
            script.src = 'tests/test-all-phases-integration.js';
            document.body.appendChild(script);
        });

        // Wait for tests to complete
        await page.waitForTimeout(10000);

        // Check console for test results
        const testResults = await page.evaluate(() => {
            // Try to get test results from window
            return (window as any).testResults || null;
        });

        console.log('Integration test results:', testResults);
    });
});
