import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Simple mobile E2E tests for core functionality
test.describe('Basic Mobile Flow Tests', () => {
  test('mobile device redirects to mobile version', async ({ page }) => {
    // Set mobile user agent
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to mobile home
    await expect(page).toHaveURL('/m/home');
    
    // Should see mobile header
    await expect(page.locator('header.mobile-header')).toBeVisible();
  });

  test('mobile navigation works', async ({ page }) => {
    // Set mobile user agent
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });
    
    await page.goto('/m/home');
    await page.waitForLoadState('networkidle');
    
    // Open hamburger menu
    const hamburger = page.getByRole('button', { name: /navigation menu/i });
    await expect(hamburger).toBeVisible();
    await hamburger.click();
    
    // Menu should be visible
    await expect(page.getByRole('dialog', { name: /navigation menu/i })).toBeVisible();
    
    // Navigate to another page
    const shareLink = page.getByRole('link', { name: /share/i });
    await shareLink.click();
    
    // Should navigate to share page
    await expect(page).toHaveURL('/m/share');
  });

  test('tablet stays on desktop version', async ({ page }) => {
    // Set tablet user agent (should NOT redirect)
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15'
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should stay on root
    await expect(page).toHaveURL('/');
    
    // Should NOT see mobile header
    await expect(page.locator('header.mobile-header')).not.toBeVisible();
  });

  test('mobile accessibility check', async ({ page }) => {
    // Set mobile user agent
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });
    
    await page.goto('/m/home');
    await page.waitForLoadState('networkidle');
    
    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('responsive viewport test', async ({ page }) => {
    // Set mobile user agent
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });
    
    // Test multiple viewports
    const viewports = [
      { width: 375, height: 667 }, // iPhone SE
      { width: 390, height: 844 }, // iPhone 12
      { width: 393, height: 851 }, // Pixel 5
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/m/home');
      await page.waitForLoadState('networkidle');
      
      // Mobile header should be visible and properly positioned
      const header = page.locator('header.mobile-header');
      await expect(header).toBeVisible();
      
      const headerBox = await header.boundingBox();
      expect(headerBox?.y).toBe(0); // Should be at top
    }
  });

  test('orientation change handling', async ({ page }) => {
    // Set mobile user agent
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });
    
    // Portrait
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/m/home');
    await page.waitForLoadState('networkidle');
    
    // Should work in portrait
    await expect(page.locator('header.mobile-header')).toBeVisible();
    
    // Landscape
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(500); // Allow layout to settle
    
    // Should still work in landscape
    await expect(page.locator('header.mobile-header')).toBeVisible();
  });
});

// Test mobile routes individually
const MOBILE_ROUTES = [
  '/m/home',
  '/m/upload-angle',
  '/m/upload-fit',
  '/m/tryon',
  '/m/share'
];

test.describe('Mobile Route Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile user agent for all tests
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });
  });

  MOBILE_ROUTES.forEach(route => {
    test(`${route} loads correctly`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Should be on correct URL
      await expect(page).toHaveURL(route);
      
      // Should have mobile header
      await expect(page.locator('header.mobile-header')).toBeVisible();
      
      // Should have main content
      const main = page.locator('main, [role="main"], body > div:first-child');
      await expect(main).toBeVisible();
    });

    test(`${route} passes accessibility audit`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });
});