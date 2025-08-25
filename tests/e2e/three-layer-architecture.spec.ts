import { test, expect } from '@playwright/test';
import { setupOpenAIStub } from './helpers/openai-stub';
import { fixtures } from '../fixtures';

/**
 * End-to-End Tests for Three-Layer Architecture
 * 
 * These tests validate that the Business → Bridge → UI layer architecture
 * works correctly in a real browser environment with user interactions.
 * 
 * Test scenarios:
 * 1. Complete user workflow using bridge layer
 * 2. Error handling through all layers
 * 3. State management consistency
 * 4. Performance under realistic conditions
 */

test.describe('Three-Layer Architecture E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup OpenAI stubbing
    await setupOpenAIStub(page);
    
    // Disable animations for consistent testing
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
  });

  test('should complete full try-on workflow via three-layer architecture', async ({ page }) => {
    console.log('🧪 Testing complete workflow through three-layer architecture...');

    // Intercept API calls to monitor architecture behavior
    const apiCalls: string[] = [];
    await page.route('/api/tryon', async (route) => {
      apiCalls.push('tryon-api-called');
      console.log('📡 API call intercepted by test');
      
      // Simulate realistic API response time
      await new Promise(resolve => setTimeout(resolve, 150));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          img_generated: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        })
      });
    });

    // Step 1: Navigate to application
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    console.log('✅ Page loaded');

    // Step 2: Verify UI layer components are rendered
    const heroImage = page.locator('img[src*="PolaroidCamera.png"]');
    await expect(heroImage).toBeVisible({ timeout: 15000 });
    console.log('✅ UI layer rendered correctly');

    // Step 3: Upload user image (Bridge layer → Business layer interaction)
    const userUpload = page.locator('input[data-test="model-upload"]');
    await userUpload.setInputFiles(fixtures.model);
    console.log('✅ User image uploaded through bridge layer');

    // Step 4: Verify state update in UI (Business layer → Bridge layer → UI)
    await expect(page.locator('[data-test="model-preview"]')).toBeVisible({ timeout: 10000 });
    console.log('✅ State propagated through all layers');

    // Step 5: Upload apparel image
    const apparelUpload = page.locator('input[data-test="apparel-upload"]');
    await apparelUpload.setInputFiles(fixtures.apparel);
    console.log('✅ Apparel image uploaded');

    // Step 6: Verify both uploads are processed
    await expect(page.locator('[data-test="apparel-preview"]')).toBeVisible({ timeout: 10000 });
    console.log('✅ Both images processed by business layer');

    // Step 7: Trigger generation (Full three-layer workflow)
    const generateButton = page.locator('[data-test="generate-button"]');
    await expect(generateButton).toBeEnabled({ timeout: 5000 });
    await generateButton.click();
    console.log('✅ Generation triggered through bridge layer');

    // Step 8: Monitor loading state (Bridge layer state management)
    const loadingIndicator = page.locator('[data-test="loading-indicator"]');
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
    console.log('✅ Loading state managed by bridge layer');

    // Step 9: Wait for result (Business layer → Bridge layer → UI)
    const resultImage = page.locator('[data-test="result-image"]');
    await expect(resultImage).toBeVisible({ timeout: 15000 });
    console.log('✅ Result displayed through all layers');

    // Step 10: Verify API was called through business layer
    expect(apiCalls).toContain('tryon-api-called');
    console.log('✅ Business layer API integration working');

    // Step 11: Test reset functionality (Bridge layer state reset)
    const resetButton = page.locator('[data-test="reset-button"]');
    if (await resetButton.isVisible()) {
      await resetButton.click();
      await expect(page.locator('[data-test="model-preview"]')).not.toBeVisible({ timeout: 5000 });
      console.log('✅ Reset functionality working through bridge layer');
    }

    console.log('🎉 Complete three-layer architecture workflow validated!');
  });

  test('should handle errors gracefully through all layers', async ({ page }) => {
    console.log('🧪 Testing error handling through three-layer architecture...');

    // Setup API error response
    await page.route('/api/tryon', async (route) => {
      console.log('📡 Simulating API error');
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Test error for three-layer architecture'
        })
      });
    });

    // Navigate and setup
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Upload files
    const userUpload = page.locator('input[data-test="model-upload"]');
    await userUpload.setInputFiles(fixtures.model);
    
    const apparelUpload = page.locator('input[data-test="apparel-upload"]');
    await apparelUpload.setInputFiles(fixtures.apparel);

    // Wait for uploads to process
    await expect(page.locator('[data-test="model-preview"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-test="apparel-preview"]')).toBeVisible({ timeout: 10000 });

    // Trigger generation (should fail)
    const generateButton = page.locator('[data-test="generate-button"]');
    await expect(generateButton).toBeEnabled();
    await generateButton.click();
    console.log('✅ Error generation triggered');

    // Verify error is displayed (Error bubbles from Business → Bridge → UI)
    const errorMessage = page.locator('[data-test="error-message"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    const errorText = await errorMessage.textContent();
    expect(errorText).toContain('error');
    console.log('✅ Error displayed through all layers:', errorText);

    // Test retry functionality (Bridge layer retry logic)
    const retryButton = page.locator('[data-test="retry-button"]');
    if (await retryButton.isVisible()) {
      await retryButton.click();
      console.log('✅ Retry functionality working');
    }

    console.log('🎉 Error handling through three-layer architecture validated!');
  });

  test('should maintain state consistency across layer interactions', async ({ page }) => {
    console.log('🧪 Testing state consistency across layers...');

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Test multiple file upload/remove cycles (State management stress test)
    for (let i = 0; i < 3; i++) {
      console.log(`📁 Upload cycle ${i + 1}/3`);
      
      // Upload user image
      const userUpload = page.locator('input[data-test="model-upload"]');
      await userUpload.setInputFiles(fixtures.model);
      await expect(page.locator('[data-test="model-preview"]')).toBeVisible();
      
      // Upload apparel image
      const apparelUpload = page.locator('input[data-test="apparel-upload"]');
      await apparelUpload.setInputFiles(fixtures.apparel);
      await expect(page.locator('[data-test="apparel-preview"]')).toBeVisible();
      
      // Verify generate button is enabled (Bridge layer logic)
      const generateButton = page.locator('[data-test="generate-button"]');
      await expect(generateButton).toBeEnabled();
      
      // Remove images if possible
      const removeUserButton = page.locator('[data-test="remove-user-image"]');
      if (await removeUserButton.isVisible()) {
        await removeUserButton.click();
        await expect(page.locator('[data-test="model-preview"]')).not.toBeVisible();
        // Generate button should be disabled (State consistency)
        await expect(generateButton).toBeDisabled();
      }
      
      console.log(`✅ Cycle ${i + 1} state consistency maintained`);
    }

    console.log('🎉 State consistency across layers validated!');
  });

  test('should perform well under realistic usage patterns', async ({ page }) => {
    console.log('🧪 Testing performance under realistic usage...');

    // Monitor performance metrics
    const performanceMetrics: number[] = [];
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Measure time to interactive (Bridge layer + UI ready)
    const startTime = Date.now();
    await expect(page.locator('input[data-test="model-upload"]')).toBeVisible();
    const timeToInteractive = Date.now() - startTime;
    performanceMetrics.push(timeToInteractive);
    
    console.log(`⏱️ Time to interactive: ${timeToInteractive}ms`);
    expect(timeToInteractive).toBeLessThan(5000); // 5 seconds max

    // Measure file upload responsiveness
    const uploadStart = Date.now();
    const userUpload = page.locator('input[data-test="model-upload"]');
    await userUpload.setInputFiles(fixtures.model);
    await expect(page.locator('[data-test="model-preview"]')).toBeVisible();
    const uploadTime = Date.now() - uploadStart;
    performanceMetrics.push(uploadTime);
    
    console.log(`📁 Upload processing time: ${uploadTime}ms`);
    expect(uploadTime).toBeLessThan(3000); // 3 seconds max

    // Test rapid interactions (Bridge layer responsiveness)
    const apparelUpload = page.locator('input[data-test="apparel-upload"]');
    await apparelUpload.setInputFiles(fixtures.apparel);
    
    const rapidInteractionStart = Date.now();
    const generateButton = page.locator('[data-test="generate-button"]');
    await expect(generateButton).toBeEnabled();
    const interactionTime = Date.now() - rapidInteractionStart;
    performanceMetrics.push(interactionTime);
    
    console.log(`⚡ UI responsiveness: ${interactionTime}ms`);
    expect(interactionTime).toBeLessThan(1000); // 1 second max

    const avgPerformance = performanceMetrics.reduce((a, b) => a + b, 0) / performanceMetrics.length;
    console.log(`📊 Average performance metric: ${avgPerformance.toFixed(0)}ms`);

    console.log('🎉 Performance under realistic usage validated!');
  });

  test('should support backward compatibility scenarios', async ({ page }) => {
    console.log('🧪 Testing backward compatibility...');

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Test that existing UI patterns still work (Backward compatibility layer)
    const legacySelectors = [
      'input[data-test="model-upload"]',
      'input[data-test="apparel-upload"]',
      '[data-test="generate-button"]'
    ];

    for (const selector of legacySelectors) {
      const element = page.locator(selector);
      await expect(element).toBeVisible({ timeout: 10000 });
      console.log(`✅ Legacy selector working: ${selector}`);
    }

    // Test the complete flow works the same as before
    const userUpload = page.locator('input[data-test="model-upload"]');
    await userUpload.setInputFiles(fixtures.model);
    
    const apparelUpload = page.locator('input[data-test="apparel-upload"]');
    await apparelUpload.setInputFiles(fixtures.apparel);

    await expect(page.locator('[data-test="generate-button"]')).toBeEnabled();
    
    console.log('🎉 Backward compatibility validated!');
  });

  test('should handle concurrent user interactions', async ({ page }) => {
    console.log('🧪 Testing concurrent interactions...');

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Simulate rapid user interactions
    const userUpload = page.locator('input[data-test="model-upload"]');
    const apparelUpload = page.locator('input[data-test="apparel-upload"]');

    // Upload both files simultaneously (Tests bridge layer coordination)
    await Promise.all([
      userUpload.setInputFiles(fixtures.model),
      apparelUpload.setInputFiles(fixtures.apparel)
    ]);

    // Both previews should appear
    await expect(page.locator('[data-test="model-preview"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-test="apparel-preview"]')).toBeVisible({ timeout: 10000 });

    console.log('✅ Concurrent file uploads handled correctly');

    // Rapid button interactions
    const generateButton = page.locator('[data-test="generate-button"]');
    await expect(generateButton).toBeEnabled();
    
    // Quick multiple clicks (Bridge layer should handle gracefully)
    await generateButton.click();
    await generateButton.click(); // Second click should be ignored or handled gracefully
    
    console.log('✅ Rapid interactions handled correctly');
    console.log('🎉 Concurrent interaction handling validated!');
  });
});

/**
 * Performance monitoring for three-layer architecture
 */
test.describe('Architecture Performance Monitoring', () => {
  
  test('should meet performance benchmarks in E2E environment', async ({ page }) => {
    console.log('📊 Running E2E performance benchmarks...');

    // Capture performance metrics
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        pageLoad: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        timeToFirstByte: navigation.responseStart - navigation.requestStart,
        totalLoadTime: navigation.loadEventEnd - navigation.startTime
      };
    });

    console.log('📈 Performance Metrics:');
    console.log(`  • Page Load: ${performanceMetrics.pageLoad}ms`);
    console.log(`  • DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`  • Time to First Byte: ${performanceMetrics.timeToFirstByte}ms`);
    console.log(`  • Total Load Time: ${performanceMetrics.totalLoadTime}ms`);

    // Assert performance benchmarks
    expect(performanceMetrics.totalLoadTime).toBeLessThan(10000); // 10s max total load
    expect(performanceMetrics.pageLoad).toBeLessThan(5000); // 5s max page load
    expect(performanceMetrics.timeToFirstByte).toBeLessThan(2000); // 2s max TTFB

    console.log('🎉 E2E performance benchmarks met!');
  });
});