import { test, expect } from '@playwright/test'
import { setupOpenAIStub } from './helpers/openai-stub'
import { mockImageResizeAPI } from './helpers/image-resize-mock'
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
    
    // Mock the image resizing API to prevent server errors
    await mockImageResizeAPI(page)
    
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
    
    // Wait for model image processing to complete - reduced since we're mocking
    await page.waitForTimeout(500)
    
    // Step 4: Upload apparel image via the hidden input
    const apparelInput = page.locator('input[data-test="apparel-upload"]')
    await apparelInput.setInputFiles(fixtures.apparel)
    await expect(apparelInput).toHaveJSProperty('files.length', 1)
    
    // Wait for apparel image processing to complete - reduced since we're mocking
    await page.waitForTimeout(500)
    
    // Wait for both images to be processed by checking the debug info (if available)
    // This ensures the state is actually updated before proceeding
    await page.waitForFunction(() => {
      const debugInfo = document.querySelector('.fixed.bottom-4.right-4');
      if (debugInfo) {
        const text = debugInfo.textContent || '';
        const leftImageReady = text.includes('Left Image: ✅');
        const rightImageReady = text.includes('Right Image: ✅');
        console.log('Debug info check:', { leftImageReady, rightImageReady, text });
        return leftImageReady && rightImageReady;
      }
      // If no debug info, assume images are ready after our timeout
      return true;
    }, { timeout: 10000 });
    
    // Step 5: Wait for generate button to be clickable
    const generateButton = page.locator('button[data-test="generate-button"]')
    await expect(generateButton).toBeVisible({ timeout: 10000 })
    
    // Wait for both images to be processed and button to be ready
    // The button is disabled when either images aren't uploaded or button isn't ready
    // We need to wait for both the image processing AND the button positioning to complete
    await page.waitForFunction(() => {
      const button = document.querySelector('button[data-test="generate-button"]') as HTMLButtonElement;
      if (!button) {
        console.log('Button not found');
        return false;
      }
      
      // Check if button is disabled due to missing images or not being ready
      const isDisabled = button.disabled;
      const hasDisabledClass = button.classList.contains('cursor-not-allowed') || button.classList.contains('opacity-50');
      
      // Debug logging
      console.log('Button state:', {
        disabled: isDisabled,
        hasDisabledClass,
        classes: button.className,
        ready: !isDisabled && !hasDisabledClass
      });
      
      // Button should be enabled (not disabled and not have disabled styling)
      return !isDisabled && !hasDisabledClass;
    }, { timeout: 20000 });
    
    // Additional verification that button is actually enabled
    await expect(generateButton).toBeEnabled({ timeout: 5000 })
    
    // Step 6: Click generate button (force click for mobile to avoid interception)
    const isMobile = page.viewportSize() && page.viewportSize()!.width < 768
    try {
      if (isMobile) {
        await generateButton.click({ force: true })
      } else {
        await generateButton.click()
      }
    } catch (error) {
      // Fallback: Use JavaScript click to bypass DOM interception
      await page.evaluate(() => {
        const button = document.querySelector('button[data-test="generate-button"]') as HTMLButtonElement;
        if (button) {
          button.click();
        }
      });
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
