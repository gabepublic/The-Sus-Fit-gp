import { test, expect } from '@playwright/test'
import { setupOpenAIStub } from './helpers/openai-stub'
import { fixtures } from '../fixtures'
import { AdvancedWait } from './utils/advanced-wait'

test.describe('Try-On Happy Path Flow', () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Setup OpenAI stubbing before any navigation
    await setupOpenAIStub(page)
    
    // Disable animations globally for more reliable testing
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
    });
    
    // Intercept API route with realistic timing
    await page.route('/api/tryon', async route => {
      console.log('Intercepting /api/tryon request')
      await new Promise(resolve => setTimeout(resolve, 100))
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          img_generated: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        })
      })
    })
  })

  test('should complete try-on flow successfully', async ({ page, browserName }) => {
    // Step 1: Navigate and wait for basic page load
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Step 2: Wait for main app components to be present using modern locator approach
    const heroImage = page.locator('img[src*="PolaroidCamera.png"]')
    await expect(heroImage).toBeVisible({ timeout: 15000 })
    
    // Step 3: Upload model image via the hidden input (files can be set even when hidden)
    const modelInput = page.locator('input[data-test="model-upload"]')
    await modelInput.setInputFiles(fixtures.model)
    await expect(modelInput).toHaveJSProperty('files.length', 1)
    
    // Step 4: Upload apparel image via the hidden input
    const apparelInput = page.locator('input[data-test="apparel-upload"]')
    await apparelInput.setInputFiles(fixtures.apparel)
    await expect(apparelInput).toHaveJSProperty('files.length', 1)
    
    // Step 5: Wait for generate button to be clickable
    const generateButton = page.locator('button[data-test="generate-button"]')
    await expect(generateButton).toBeVisible({ timeout: 10000 })
    await expect(generateButton).toBeEnabled({ timeout: 10000 })
    
    // Step 6: Click generate button (force click for mobile to avoid interception)
    const isMobile = browserName === 'chromium' && page.viewportSize() && page.viewportSize()!.width < 768
    if (isMobile) {
      await generateButton.click({ force: true })
    } else {
      await generateButton.click()
    }
    
    // Step 7: Wait for polaroid to appear using modern expect approach
    const polaroidLocator = page.locator('[data-testid="polaroid-generator"]')
    await expect(polaroidLocator).toBeVisible({ timeout: 20000 })
    
    // Step 8: Wait for generated image to appear
    const generatedImageLocator = page.locator('[data-test="generated-image"]')
    await expect(generatedImageLocator).toBeVisible({ timeout: 25000 })
    
    // Step 9: Verify image has valid base64 src
    await expect(generatedImageLocator).toHaveAttribute('src', /data:image\/png;base64,[A-Za-z0-9+/]+=*/)
  })
})
