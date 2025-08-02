import { test, expect } from '@playwright/test';

/**
 * Sample E2E test to verify Playwright setup
 * This test ensures Playwright is working correctly across all projects
 */

test.describe('Playwright Setup Verification', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Verify the page loads
    await expect(page).toHaveTitle(/The Sus Fit/);
    
    // Verify basic content is present
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have correct viewport dimensions', async ({ page }) => {
    await page.goto('/');
    
    // Get viewport size
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();
    expect(viewport!.width).toBeGreaterThan(0);
    expect(viewport!.height).toBeGreaterThan(0);
  });

  test('should handle basic navigation', async ({ page }) => {
    await page.goto('/');
    
    // Verify we can interact with the page
    await expect(page.locator('html')).toBeVisible();
    
    // Test basic page functionality
    const title = await page.title();
    expect(title).toBeTruthy();
  });
}); 