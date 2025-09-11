import { test, expect } from '@playwright/test';
import { fixtures } from '../fixtures';
import { mockImageResizeAPI } from './helpers/image-resize-mock';

test.describe('Toast Error Handling', () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Mock the image resizing API to prevent server errors
    await mockImageResizeAPI(page)

    // Mobile Safari specific setup
    if (browserName === 'webkit' && page.viewportSize() && page.viewportSize()!.width < 768) {
      // Set a longer timeout for mobile browsers
      page.setDefaultTimeout(45000)
      console.log('Mobile Safari detected - using extended timeout')
      
      // Disable animations for more reliable testing on mobile
      await page.addInitScript(() => {
        // Disable CSS animations and transitions
        const style = document.createElement('style');
        style.textContent = `
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        `;
        document.head.appendChild(style);
      });
    }
  });

  test('shows error toast when API returns 500 status', async ({ page, browserName }) => {
    // Intercept the API call and force a 500 status
    await page.route('/api/tryon', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Navigate to the page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for the hero image to load completely
    await page.waitForFunction(() => {
      const heroImage = document.querySelector('img[src*="PolaroidCamera.png"]') as HTMLImageElement;
      return heroImage && heroImage.complete && heroImage.naturalHeight > 0;
    }, { timeout: 10000 });

    // Wait for the button to be rendered (it depends on image positioning calculations)
    await page.waitForSelector('button[data-test="generate-button"]', { timeout: 15000 });
    
    // Give additional time for button positioning calculations to complete
    await page.waitForTimeout(1000);

    // Upload model image
    await page.setInputFiles('input[data-test="model-upload"]', fixtures.model);
    
    // Wait for model image to be processed and state updated
    await page.waitForFunction(() => {
      const modelInput = document.querySelector('input[data-test="model-upload"]') as HTMLInputElement;
      const hasFile = modelInput && modelInput.files && modelInput.files.length > 0;
      return hasFile;
    }, { timeout: 5000 });
    
    // Upload apparel image  
    await page.setInputFiles('input[data-test="apparel-upload"]', fixtures.apparel);
    
    // Wait for apparel image to be processed and state updated
    await page.waitForFunction(() => {
      const apparelInput = document.querySelector('input[data-test="apparel-upload"]') as HTMLInputElement;
      const hasFile = apparelInput && apparelInput.files && apparelInput.files.length > 0;
      return hasFile;
    }, { timeout: 5000 });

    // Wait for the button to be ready and enabled
    // First wait for the button to exist in DOM
    await page.waitForSelector('button[data-test="generate-button"]', { timeout: 30000 });
    
    // Wait for button positioning calculations to complete
    await page.waitForTimeout(3000);
    
    // Wait for the button to be visible and enabled with more robust checks
    // This specifically waits for the button to not be in the "not ready" state
    await page.waitForFunction(() => {
      const button = document.querySelector('button[data-test="generate-button"]') as HTMLButtonElement;
      if (!button) {
        return false;
      }
      
      const isVisible = button.offsetParent !== null;
      const isDisabled = button.hasAttribute('disabled') || button.disabled;
      const hasOpacity = window.getComputedStyle(button).opacity !== '0.5';
      
      // Check if button is ready (not in cursor-not-allowed state and not opacity-50)
      const isNotReady = button.classList.contains('cursor-not-allowed') || 
                        button.classList.contains('opacity-50');
      
      return isVisible && !isDisabled && hasOpacity && !isNotReady;
    }, { timeout: 45000 });
    
    // Additional wait to ensure button is fully ready
    await page.waitForTimeout(1000);
    
    // Additional verification that the button is clickable
    const button = page.locator('button[data-test="generate-button"]');
    await expect(button).toBeEnabled();
    await expect(button).toBeVisible();
    
    // Wait for any animations to complete and ensure button is not intercepted
    await page.waitForTimeout(1000); // Give time for any animations to settle
    
    // Try to click with force option to bypass interception
    try {
      await page.click('button[data-test="generate-button"]', { force: true, timeout: 10000 });
    } catch (error) {
      console.log('Direct click failed, trying JavaScript click');
      // Alternative: Use JavaScript click to bypass DOM interception
      await page.evaluate(() => {
        const button = document.querySelector('button[data-test="generate-button"]') as HTMLButtonElement;
        if (button && !button.disabled) {
          button.click();
        } else {
          console.error('Button not found or disabled for JavaScript click');
        }
      });
    }

    // Wait for the error toast to appear
    await expect(page.locator('[data-state="open"]').filter({ hasText: 'Server error, please try again.' })).toBeVisible();

    // Wait for the toast to auto-dismiss (5 seconds)
    await expect(page.locator('[data-state="open"]').filter({ hasText: 'Server error, please try again.' })).not.toBeVisible({ timeout: 6000 });
  });

  test('shows rate limit toast when API returns 429 status', async ({ page, browserName }) => {
    // Intercept the API call and force a 429 status
    await page.route('/api/tryon', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Rate limit exceeded' })
      });
    });

    // Navigate to the page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for the hero image to load completely
    await page.waitForFunction(() => {
      const heroImage = document.querySelector('img[src*="PolaroidCamera.png"]') as HTMLImageElement;
      return heroImage && heroImage.complete && heroImage.naturalHeight > 0;
    }, { timeout: 10000 });

    // Upload model image
    await page.setInputFiles('input[data-test="model-upload"]', fixtures.model);
    
    // Wait for model image to be processed and state updated
    await page.waitForFunction(() => {
      const modelInput = document.querySelector('input[data-test="model-upload"]') as HTMLInputElement;
      const hasFile = modelInput && modelInput.files && modelInput.files.length > 0;
      return hasFile;
    }, { timeout: 5000 });
    
    // Upload apparel image  
    await page.setInputFiles('input[data-test="apparel-upload"]', fixtures.apparel);
    
    // Wait for apparel image to be processed and state updated
    await page.waitForFunction(() => {
      const apparelInput = document.querySelector('input[data-test="apparel-upload"]') as HTMLInputElement;
      const hasFile = apparelInput && apparelInput.files && apparelInput.files.length > 0;
      return hasFile;
    }, { timeout: 5000 });

    // Wait for the button to be ready and enabled
    await page.waitForSelector('button[data-test="generate-button"]', { timeout: 30000 });
    
    // Wait for button positioning calculations to complete
    await page.waitForTimeout(3000);
    
    // Wait for button to be ready with debugging
    await page.waitForFunction(() => {
      const button = document.querySelector('button[data-test="generate-button"]') as HTMLButtonElement;
      if (!button) {
        console.log('Button not found');
        return false;
      }
      
      const isVisible = button.offsetParent !== null;
      const isDisabled = button.hasAttribute('disabled') || button.disabled;
      const computedStyle = window.getComputedStyle(button);
      const hasOpacity = computedStyle.opacity !== '0.5';
      const hasNotReadyClasses = button.classList.contains('cursor-not-allowed') || 
                                button.classList.contains('opacity-50');
      
      console.log('Button state:', {
        isVisible,
        isDisabled,
        hasOpacity,
        opacity: computedStyle.opacity,
        hasNotReadyClasses,
        classList: Array.from(button.classList),
        disabled: button.disabled,
        hasDisabledAttr: button.hasAttribute('disabled')
      });
      
      return isVisible && !isDisabled && hasOpacity && !hasNotReadyClasses;
    }, { timeout: 45000 });
    
    const button = page.locator('button[data-test="generate-button"]');
    await expect(button).toBeEnabled();
    await expect(button).toBeVisible();
    
    await page.waitForTimeout(1000);
    
    // Try to click with force option to bypass interception
    try {
      await page.click('button[data-test="generate-button"]', { force: true, timeout: 10000 });
    } catch (error) {
      await page.evaluate(() => {
        const button = document.querySelector('button[data-test="generate-button"]') as HTMLButtonElement;
        if (button) {
          button.click();
        }
      });
    }

    // Wait for the rate limit toast to appear
    await expect(page.locator('[data-state="open"]').filter({ hasText: 'OpenAI rate limit reached, try later.' })).toBeVisible();

    // Wait for the toast to auto-dismiss
    await expect(page.locator('[data-state="open"]').filter({ hasText: 'OpenAI rate limit reached, try later.' })).not.toBeVisible({ timeout: 6000 });
  });

  test('shows validation error toast when API returns 400 status', async ({ page, browserName }) => {
    // Intercept the API call and force a 400 status
    await page.route('/api/tryon', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid request' })
      });
    });

    // Navigate to the page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for the hero image to load completely
    await page.waitForFunction(() => {
      const heroImage = document.querySelector('img[src*="PolaroidCamera.png"]') as HTMLImageElement;
      return heroImage && heroImage.complete && heroImage.naturalHeight > 0;
    }, { timeout: 10000 });

    // Upload model image
    await page.setInputFiles('input[data-test="model-upload"]', fixtures.model);
    
    // Wait for model image to be processed and state updated
    await page.waitForFunction(() => {
      const modelInput = document.querySelector('input[data-test="model-upload"]') as HTMLInputElement;
      const hasFile = modelInput && modelInput.files && modelInput.files.length > 0;
      return hasFile;
    }, { timeout: 5000 });
    
    // Upload apparel image  
    await page.setInputFiles('input[data-test="apparel-upload"]', fixtures.apparel);
    
    // Wait for apparel image to be processed and state updated
    await page.waitForFunction(() => {
      const apparelInput = document.querySelector('input[data-test="apparel-upload"]') as HTMLInputElement;
      const hasFile = apparelInput && apparelInput.files && apparelInput.files.length > 0;
      return hasFile;
    }, { timeout: 5000 });

    // Wait for the button to be ready and enabled
    await page.waitForSelector('button[data-test="generate-button"]', { timeout: 30000 });
    
    // Wait for button positioning calculations to complete
    await page.waitForTimeout(3000);
    
    await page.waitForFunction(() => {
      const button = document.querySelector('button[data-test="generate-button"]') as HTMLButtonElement;
      if (!button) return false;
      
      const isVisible = button.offsetParent !== null;
      const isDisabled = button.hasAttribute('disabled') || button.disabled;
      const hasOpacity = window.getComputedStyle(button).opacity !== '0.5';
      
      // Additional check: ensure the button is not in a "not ready" state
      // FIXED: Use && instead of || for proper logic
      const isReady = !button.classList.contains('cursor-not-allowed') && 
                     !button.classList.contains('opacity-50');
      
      return isVisible && !isDisabled && hasOpacity && isReady;
    }, { timeout: 45000 });
    
    const button = page.locator('button[data-test="generate-button"]');
    await expect(button).toBeEnabled();
    await expect(button).toBeVisible();
    
    await page.waitForTimeout(1000);
    
    // Try to click with force option to bypass interception
    try {
      await page.click('button[data-test="generate-button"]', { force: true, timeout: 10000 });
    } catch (error) {
      await page.evaluate(() => {
        const button = document.querySelector('button[data-test="generate-button"]') as HTMLButtonElement;
        if (button) {
          button.click();
        }
      });
    }

    // Wait for the validation error toast to appear
    await expect(page.locator('[data-state="open"]').filter({ hasText: 'Invalid images uploaded.' })).toBeVisible();

    // Wait for the toast to auto-dismiss
    await expect(page.locator('[data-state="open"]').filter({ hasText: 'Invalid images uploaded.' })).not.toBeVisible({ timeout: 6000 });
  });

  test('shows unexpected error toast for unknown status codes', async ({ page, browserName }) => {
    // Intercept the API call and force an unknown status
    await page.route('/api/tryon', async route => {
      await route.fulfill({
        status: 418, // I'm a teapot - unknown status
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unknown error' })
      });
    });

    // Navigate to the page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for the hero image to load completely
    await page.waitForFunction(() => {
      const heroImage = document.querySelector('img[src*="PolaroidCamera.png"]') as HTMLImageElement;
      return heroImage && heroImage.complete && heroImage.naturalHeight > 0;
    }, { timeout: 10000 });

    // Upload model image
    await page.setInputFiles('input[data-test="model-upload"]', fixtures.model);
    
    // Wait for model image to be processed and state updated
    await page.waitForFunction(() => {
      const modelInput = document.querySelector('input[data-test="model-upload"]') as HTMLInputElement;
      const hasFile = modelInput && modelInput.files && modelInput.files.length > 0;
      return hasFile;
    }, { timeout: 5000 });
    
    // Upload apparel image  
    await page.setInputFiles('input[data-test="apparel-upload"]', fixtures.apparel);
    
    // Wait for apparel image to be processed and state updated
    await page.waitForFunction(() => {
      const apparelInput = document.querySelector('input[data-test="apparel-upload"]') as HTMLInputElement;
      const hasFile = apparelInput && apparelInput.files && apparelInput.files.length > 0;
      return hasFile;
    }, { timeout: 5000 });

    // Wait for the button to be ready and enabled
    await page.waitForSelector('button[data-test="generate-button"]', { timeout: 30000 });
    
    // Wait for button positioning calculations to complete
    await page.waitForTimeout(3000);
    
    await page.waitForFunction(() => {
      const button = document.querySelector('button[data-test="generate-button"]') as HTMLButtonElement;
      if (!button) return false;
      
      const isVisible = button.offsetParent !== null;
      const isDisabled = button.hasAttribute('disabled') || button.disabled;
      const hasOpacity = window.getComputedStyle(button).opacity !== '0.5';
      
      // Additional check: ensure the button is not in a "not ready" state
      // FIXED: Use && instead of || for proper logic
      const isReady = !button.classList.contains('cursor-not-allowed') && 
                     !button.classList.contains('opacity-50');
      
      return isVisible && !isDisabled && hasOpacity && isReady;
    }, { timeout: 45000 });
    
    const button = page.locator('button[data-test="generate-button"]');
    await expect(button).toBeEnabled();
    await expect(button).toBeVisible();
    
    await page.waitForTimeout(1000);
    
    // Try to click with force option to bypass interception
    try {
      await page.click('button[data-test="generate-button"]', { force: true, timeout: 10000 });
    } catch (error) {
      await page.evaluate(() => {
        const button = document.querySelector('button[data-test="generate-button"]') as HTMLButtonElement;
        if (button) {
          button.click();
        }
      });
    }

    // Wait for the unexpected error toast to appear
    await expect(page.locator('[data-state="open"]').filter({ hasText: 'Unexpected error, please retry.' })).toBeVisible();

    // Wait for the toast to auto-dismiss
    await expect(page.locator('[data-state="open"]').filter({ hasText: 'Unexpected error, please retry.' })).not.toBeVisible({ timeout: 6000 });
  });
});
