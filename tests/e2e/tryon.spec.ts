import { test, expect } from '@playwright/test'
import { setupOpenAIStub } from './helpers/openai-stub'
import { fixtures } from '../fixtures'

test.describe('Try-On Happy Path Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup OpenAI stubbing before any navigation
    await setupOpenAIStub(page)
    
    // Also intercept the API route to return a mock response
    await page.route('/api/tryon', route => {
      console.log('Intercepting /api/tryon request')
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          img_generated: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        })
      })
    })
  })

  test('should complete try-on flow successfully', async ({ page }) => {
    // Step 1: Navigate to the app
    await page.goto('/')
    
    // Step 2: Upload model image
    await page.setInputFiles('input[data-test="model-upload"]', fixtures.model)
    
    // Step 3: Upload apparel image  
    await page.setInputFiles('input[data-test="apparel-upload"]', fixtures.apparel)
    
    // Step 4: Wait for and click camera/submit button
    await page.waitForSelector('button[data-test="generate-button"]', { state: 'visible' })
    await page.click('button[data-test="generate-button"]')
    
    // Step 5: Wait for network idle to ensure POST finishes
    await page.waitForLoadState('networkidle')
    
    // Additional verification: Check that the polaroid component appears
    await expect(page.locator('[data-test="polaroid-generator"]')).toBeVisible()
    
    // Verify that the generated image is displayed
    await expect(page.locator('[data-test="generated-image"]')).toBeVisible()
    
    // Assert the src is a base64 data URL
    const generatedImage = page.locator('[data-test="generated-image"]')
    await expect(generatedImage).toHaveAttribute('src', /data:image\/png;base64,[A-Za-z0-9+/]+=*/)
    
    // Optional: Take a snapshot for visual regression testing
    // Note: This will fail on first run as it creates the baseline snapshot
    // await expect(generatedImage).toHaveScreenshot('generated.png')
  })
})
