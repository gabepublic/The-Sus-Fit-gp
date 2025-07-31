import { test, expect } from '@playwright/test'

test.describe('Baseline Tests', () => {
  test('homepage loads with blank canvas', async ({ page }) => {
    // Navigate to the root path
    await page.goto('/')
    
    // Wait for network to be idle
    await page.waitForLoadState('networkidle')
    
    // Verify the page title is set (from layout.tsx metadata)
    await expect(page).toHaveTitle(/The Sus Fit/)
    
    // Verify no visible content elements
    await expect(page.locator('h1, h2, h3, h4, h5, h6')).toHaveCount(0)
    await expect(page.locator('p')).toHaveCount(0)
    
    // Verify the page loads successfully
    await expect(page).toHaveURL('http://localhost:3000/')
  })

  test('page renders identically across viewports', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Take a screenshot to verify visual consistency
    // This will create a baseline screenshot on first run
    await expect(page).toHaveScreenshot('blank-canvas-baseline.png')
  })
}) 