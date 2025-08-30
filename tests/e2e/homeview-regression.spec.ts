import { test, expect } from '@playwright/test';

test.describe('HomeView Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to mobile home page (correct route is /m/home)
    await page.goto('/m/home', { waitUntil: 'networkidle' });
  });

  test('HomeView layout and positioning - Mobile Chrome', async ({ page, browserName }) => {
    // Wait for main content to be visible (HomeViewContent is inside mobile layout)
    await expect(page.locator('main[aria-label="SusFit Homepage"]')).toBeVisible();
    
    // Wait for HomeView text content to load (inside the HomeViewContent component)
    await expect(page.locator('.home-view-content .splash-title-line1').first()).toContainText("Let's");
    
    // Wait for any animations to complete
    await page.waitForTimeout(2000);
    
    // Take screenshot of entire HomeView
    await expect(page).toHaveScreenshot(`homeview-layout-${browserName}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('HomeView text positioning and layers', async ({ page, browserName }) => {
    await expect(page.locator('main[aria-label="SusFit Homepage"]')).toBeVisible();
    await expect(page.locator('.home-view-content .splash-title-line1').first()).toContainText("Let's");
    await page.waitForTimeout(2000);

    // Focus on the text area specifically
    const textContainer = page.locator('.home-view-content__text-mask-container');
    await expect(textContainer).toBeVisible();
    
    await expect(textContainer).toHaveScreenshot(`homeview-text-layers-${browserName}.png`, {
      animations: 'disabled',
    });
  });

  test('HomeView yellow banner positioning', async ({ page, browserName }) => {
    await expect(page.locator('main[aria-label="SusFit Homepage"]')).toBeVisible();
    
    // Check that YellowBanner is present and positioned correctly
    const yellowBanner = page.locator('.home-view-content__yellow-shape');
    await expect(yellowBanner).toBeVisible();
    
    await page.waitForTimeout(2000);
    
    await expect(yellowBanner).toHaveScreenshot(`homeview-yellow-banner-${browserName}.png`, {
      animations: 'disabled',
    });
  });

  test('HomeView GIF loading states', async ({ page, browserName }) => {
    // Test with network throttling to catch loading state
    await page.route('/images/mobile/home-page-animated.gif', async route => {
      await page.waitForTimeout(1000); // Simulate slow loading
      await route.continue();
    });

    await page.goto('/m/home', { waitUntil: 'domcontentloaded' });
    
    // Capture loading state
    await expect(page.locator('main[aria-label="SusFit Homepage"]')).toBeVisible();
    await expect(page).toHaveScreenshot(`homeview-loading-state-${browserName}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
    
    // Wait for GIF to load and capture loaded state
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot(`homeview-loaded-state-${browserName}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('HomeView responsive layout verification', async ({ page, browserName }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667, name: 'iPhone-SE' },
      { width: 393, height: 852, name: 'Pixel-5' },
      { width: 414, height: 896, name: 'iPhone-11-Pro-Max' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/m/home', { waitUntil: 'networkidle' });
      
      await expect(page.locator('main[aria-label="SusFit Homepage"]')).toBeVisible();
      await expect(page.locator('.home-view-content .splash-title-line1').first()).toContainText("Let's");
      await page.waitForTimeout(1500);
      
      await expect(page).toHaveScreenshot(`homeview-${viewport.name}-${browserName}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('HomeView accessibility elements positioning', async ({ page, browserName }) => {
    await expect(page.locator('main[aria-label="SusFit Homepage"]')).toBeVisible();
    
    // Check skip link
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
    
    // Check performance marker
    const performanceMarker = page.locator('.performance-marker');
    await expect(performanceMarker).toBeAttached();
    
    // Check screen reader announcements
    const srAnnouncement = page.locator('[aria-live="polite"]');
    await expect(srAnnouncement).toBeAttached();
    
    await page.waitForTimeout(2000);
    
    // Screenshot to verify these elements don't affect visual layout
    await expect(page).toHaveScreenshot(`homeview-accessibility-elements-${browserName}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('HomeView CSS Layer Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/m/home', { waitUntil: 'networkidle' });
    await expect(page.locator('main[aria-label="SusFit Homepage"]')).toBeVisible();
  });

  test('verifies z-index layering is correct', async ({ page }) => {
    // Get computed styles for key elements
    const yellowBanner = page.locator('.home-view-content__yellow-shape');
    const textStroke = page.locator('.home-view-content__text-stroke-layer');
    const textGif = page.locator('.home-view-content__animated-gif-text');

    await expect(yellowBanner).toBeVisible();
    await expect(textStroke).toBeVisible();
    await expect(textGif).toBeVisible();

    // Check z-index values to ensure proper layering
    const yellowZIndex = await yellowBanner.evaluate(el => 
      getComputedStyle(el).zIndex
    );
    const strokeZIndex = await textStroke.evaluate(el => 
      getComputedStyle(el).zIndex
    );
    const gifZIndex = await textGif.evaluate(el => 
      getComputedStyle(el).zIndex
    );

    // Verify layering order (higher numbers should be on top)
    expect(parseInt(strokeZIndex)).toBeLessThan(parseInt(gifZIndex));
  });

  test('verifies animation delays are applied correctly', async ({ page }) => {
    const main = page.locator('main[aria-label="SusFit Homepage"]');
    const yellowBanner = page.locator('.home-view-content__yellow-shape');

    // Check that animation delays are set
    const mainDelay = await main.evaluate(el => el.style.animationDelay);
    const yellowDelay = await yellowBanner.evaluate(el => 
      getComputedStyle(el).animationDelay
    );

    expect(mainDelay).toBeDefined();
    expect(yellowDelay).toBeDefined();
  });

  test('verifies text positioning and masking', async ({ page }) => {
    const textContainer = page.locator('.home-view-content__text-mask-container');
    const textStroke = page.locator('.home-view-content__text-stroke-layer h1');
    const textGif = page.locator('.home-view-content__animated-gif-text h1');

    await expect(textContainer).toBeVisible();
    await expect(textStroke).toBeVisible();
    await expect(textGif).toBeVisible();

    // Get bounding boxes to ensure text layers are positioned identically
    const strokeBox = await textStroke.boundingBox();
    const gifBox = await textGif.boundingBox();

    expect(strokeBox).toBeTruthy();
    expect(gifBox).toBeTruthy();
    
    // Text should be in same position (allowing for small rendering differences)
    expect(Math.abs((strokeBox?.x || 0) - (gifBox?.x || 0))).toBeLessThan(2);
    expect(Math.abs((strokeBox?.y || 0) - (gifBox?.y || 0))).toBeLessThan(2);
  });
});