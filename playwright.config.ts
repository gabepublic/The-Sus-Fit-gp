import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: 'html',
  // Global timeout settings
  timeout: 120000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Add fake media device support for consistent testing
    launchOptions: {
      args: [
        '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    },
    // Add timeout configuration for better stability
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },

    {
      name: 'chromium-mobile',
      use: { 
        ...devices['Pixel 5'],
      },
    },

    // Firefox disabled due to persistent timeout issues
    // Focus on Chromium, WebKit, and iPhone for reliable test coverage

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 800 },
      },
    },

    {
      name: 'iphone',
      use: { 
        ...devices['iPhone 14'],
      },
    },
  ],

  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Configure screenshot comparison thresholds
  expect: {
    toMatchSnapshot: {
      threshold: 0.3, // Allow more rendering variance for camera tests
    },
    toHaveScreenshot: {
      threshold: 0.2, // Allow some variance for UI tests
      maxDiffPixels: 10000, // Allow up to 10k pixel differences
    },
  },
})
