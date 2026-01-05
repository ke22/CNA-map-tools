import { defineConfig, devices } from '@playwright/test';

/**
 * Map Tool E2E Testing Configuration
 * Tests the enhanced map application with label movement, area selection, etc.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false, // Sequential for map tests to avoid conflicts
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry failed tests */
  retries: 2,
  /* Single worker for consistent map state */
  workers: 1,
  /* Reporter to use */
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  /* Global timeout */
  timeout: 90000,
  /* Shared settings for all the projects below */
  use: {
    /* Base URL for the local dev server */
    baseURL: 'http://localhost:8000',
    /* Collect trace on failure */
    trace: 'on-first-retry',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    /* Video on failure */
    video: 'on-first-retry',
    /* Viewport size for map testing */
    viewport: { width: 1400, height: 900 },
  },

  /* Only test on Chromium for speed - map features work the same across browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Use existing server on port 8000 (server-combined.js with GADM support) */
  webServer: {
<<<<<<< HEAD
    command: 'node server-combined.js',
    url: 'http://localhost:8000',
    reuseExistingServer: true,
    timeout: 30000,
=======
    command: process.platform === 'win32' 
      ? 'set PORT=8000 && node server-combined.js'
      : 'PORT=8000 node server-combined.js',
    url: 'http://localhost:8000',
    reuseExistingServer: !process.env.CI,
    timeout: 60000, // Increased timeout for server startup
>>>>>>> 8a6bc0a (feat: 优化中文标签定位和行政区域配置)
  },
});
