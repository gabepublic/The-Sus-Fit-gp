import { test, expect } from '@playwright/test'

test.describe('Baseline Tests', () => {
  test('homepage loads with camera interface', async ({ page }) => {
    // Navigate to the root path with retry logic for Firefox
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    
    // Wait for network to be idle with extended timeout for Firefox
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Verify the page title is set (from layout.tsx metadata)
    await expect(page).toHaveTitle(/The Sus Fit/)
    
    // Verify the page loads successfully
    await expect(page).toHaveURL('http://localhost:3000/')
    
    // Verify camera interface elements are present
    await expect(page.locator('video#camera-stream')).toBeVisible()
    await expect(page.locator('#take-btn')).toBeVisible()
    await expect(page.locator('#download-btn')).toBeVisible()
    await expect(page.locator('#retake-btn')).toBeVisible()
  })

  test('page has correct structure and elements', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Wait for camera interface to be stable
    await expect(page.locator('video#camera-stream')).toBeVisible()
    
    // Verify all expected elements are present (they exist but may not be visible)
    await expect(page.locator('#result-wrapper')).toBeAttached()
    await expect(page.locator('#selfie-img')).toBeAttached()
    await expect(page.locator('#anime-img')).toBeAttached()
    
    // Verify button states
    const takeButton = page.locator('#take-btn')
    const downloadButton = page.locator('#download-btn')
    const retakeButton = page.locator('#retake-btn')
    
    await expect(takeButton).toBeEnabled()
    await expect(downloadButton).toBeDisabled()
    await expect(retakeButton).toBeDisabled()
  })
}) 