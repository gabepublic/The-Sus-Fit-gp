import { Page, expect, type Locator } from '@playwright/test';

// Mobile-specific user agents for testing
export const MOBILE_USER_AGENTS = {
  iPhoneSE: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  iPhone12: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1',
  iPhone13Pro: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  pixel5: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
  galaxyS21: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.72 Mobile Safari/537.36',
  
  // Tablet user agents (should NOT redirect)
  iPadPro: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
  galaxyTab: 'Mozilla/5.0 (Linux; Android 9; SM-T820) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
  
  // Desktop user agents (should NOT redirect)
  chrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
} as const;

// Mobile viewport configurations
export const MOBILE_VIEWPORTS = {
  iPhoneSE: { width: 375, height: 667 },
  iPhone12: { width: 390, height: 844 },
  iPhone12ProMax: { width: 428, height: 926 },
  pixel5: { width: 393, height: 851 },
  galaxyS20: { width: 360, height: 800 },
  iPadMini: { width: 768, height: 1024 },
  iPadPro: { width: 1024, height: 1366 },
} as const;

// Mobile routes for testing
export const MOBILE_ROUTES = [
  { path: '/m/home', name: 'Home', icon: '🏠' },
  { path: '/m/upload-angle', name: 'Upload Your Angle', icon: '📸' },
  { path: '/m/upload-fit', name: 'Upload Your Fit', icon: '👕' },
  { path: '/m/tryon', name: 'Try It On', icon: '✨' },
  { path: '/m/share', name: 'Share', icon: '📱' },
] as const;

/**
 * Helper class for mobile device simulation and testing
 */
export class MobileTestHelper {
  constructor(private page: Page) {}

  /**
   * Set up mobile device simulation with user agent and viewport
   */
  async setupMobileDevice(deviceName: keyof typeof MOBILE_USER_AGENTS) {
    const userAgent = MOBILE_USER_AGENTS[deviceName];
    await this.page.setExtraHTTPHeaders({ 'User-Agent': userAgent });
    
    // Set appropriate viewport if available
    const viewportName = deviceName as keyof typeof MOBILE_VIEWPORTS;
    if (MOBILE_VIEWPORTS[viewportName]) {
      await this.page.setViewportSize(MOBILE_VIEWPORTS[viewportName]);
    }
  }

  /**
   * Test device detection and redirect behavior
   */
  async testDeviceRedirect(shouldRedirect: boolean, expectedPath: string = '/m/home') {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
    
    if (shouldRedirect) {
      await expect(this.page).toHaveURL(expectedPath);
    } else {
      await expect(this.page).toHaveURL('/');
    }
  }

  /**
   * Simulate touch interactions for mobile testing
   */
  async touchTap(selector: string) {
    const element = this.page.locator(selector);
    await element.tap();
  }

  /**
   * Simulate touch swipe gesture
   */
  async touchSwipe(
    startSelector: string, 
    direction: 'left' | 'right' | 'up' | 'down',
    distance: number = 100
  ) {
    const element = this.page.locator(startSelector);
    const box = await element.boundingBox();
    
    if (!box) throw new Error(`Element ${startSelector} not found or not visible`);
    
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    
    let endX = startX;
    let endY = startY;
    
    switch (direction) {
      case 'left':
        endX -= distance;
        break;
      case 'right':
        endX += distance;
        break;
      case 'up':
        endY -= distance;
        break;
      case 'down':
        endY += distance;
        break;
    }
    
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(endX, endY);
    await this.page.mouse.up();
  }

  /**
   * Check if element is in mobile viewport
   */
  async isElementInViewport(selector: string): Promise<boolean> {
    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return false;
      
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
      );
    }, selector);
  }

  /**
   * Test mobile menu functionality
   */
  async testMobileMenuFlow() {
    // Check if hamburger button is visible
    const hamburger = this.page.getByRole('button', { name: /navigation menu/i });
    await expect(hamburger).toBeVisible();
    
    // Open menu
    await hamburger.click();
    await expect(this.page.getByRole('dialog', { name: /navigation menu/i })).toBeVisible();
    
    // Check all navigation links are present
    for (const route of MOBILE_ROUTES) {
      const link = this.page.getByRole('link', { name: new RegExp(route.name, 'i') });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', route.path);
    }
    
    // Close menu with escape
    await this.page.keyboard.press('Escape');
    await expect(this.page.getByRole('dialog', { name: /navigation menu/i })).not.toBeVisible();
  }

  /**
   * Navigate through all mobile routes and verify each loads correctly
   */
  async testMobileNavigation() {
    for (const route of MOBILE_ROUTES) {
      await this.page.goto(route.path);
      await this.page.waitForLoadState('networkidle');
      
      // Verify URL
      await expect(this.page).toHaveURL(route.path);
      
      // Verify mobile header is present
      await expect(this.page.locator('header.mobile-header')).toBeVisible();
      
      // Verify main content area exists
      const main = this.page.locator('main, [role="main"], body > div:first-child');
      await expect(main).toBeVisible();
    }
  }

  /**
   * Test mobile accessibility features
   */
  async testMobileAccessibility() {
    // Check touch target sizes (minimum 44px)
    const touchTargets = await this.page.locator('button, a, input, [role="button"]').all();
    
    for (const target of touchTargets) {
      const box = await target.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
    
    // Check for proper ARIA labels on interactive elements
    const interactiveElements = await this.page.locator('button, [role="button"]').all();
    for (const element of interactiveElements) {
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledby = await element.getAttribute('aria-labelledby');
      const textContent = await element.textContent();
      
      expect(
        ariaLabel || ariaLabelledby || (textContent && textContent.trim().length > 0)
      ).toBeTruthy();
    }
  }

  /**
   * Simulate device orientation change
   */
  async changeOrientation(orientation: 'portrait' | 'landscape') {
    const currentViewport = this.page.viewportSize();
    if (!currentViewport) return;
    
    if (orientation === 'landscape') {
      await this.page.setViewportSize({
        width: Math.max(currentViewport.width, currentViewport.height),
        height: Math.min(currentViewport.width, currentViewport.height),
      });
    } else {
      await this.page.setViewportSize({
        width: Math.min(currentViewport.width, currentViewport.height),
        height: Math.max(currentViewport.width, currentViewport.height),
      });
    }
    
    // Wait for layout to settle
    await this.page.waitForTimeout(500);
  }

  /**
   * Check mobile performance metrics
   */
  async getMobilePerformanceMetrics() {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });
  }

  /**
   * Test mobile-specific CSS and styling
   */
  async testMobileStyling() {
    // Check that mobile-specific CSS is applied
    const isMobileQuery = await this.page.evaluate(() => {
      return window.matchMedia('(max-width: 768px)').matches;
    });
    
    if (isMobileQuery) {
      // Mobile styles should be active
      const header = this.page.locator('header.mobile-header');
      await expect(header).toBeVisible();
      
      // Check mobile navigation is hidden initially
      const mobileMenu = this.page.getByRole('dialog', { name: /navigation menu/i });
      await expect(mobileMenu).not.toBeVisible();
    }
  }

  /**
   * Test focus management in mobile context
   */
  async testMobileFocusManagement() {
    // Test keyboard navigation
    await this.page.keyboard.press('Tab');
    
    // First focusable element should be logo or skip link
    const activeElement = await this.page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON']).toContain(activeElement);
    
    // Tab to hamburger menu
    let attempts = 0;
    while (attempts < 10) {
      await this.page.keyboard.press('Tab');
      const focused = await this.page.evaluate(() => {
        const el = document.activeElement;
        return el?.getAttribute('aria-label')?.includes('navigation menu') || false;
      });
      
      if (focused) break;
      attempts++;
    }
    
    expect(attempts).toBeLessThan(10); // Should find hamburger within reasonable tab presses
  }
}

/**
 * Assertion helpers for mobile testing
 */
export const mobileAssertions = {
  /**
   * Assert that element has appropriate touch target size
   */
  async toHaveValidTouchTarget(locator: Locator) {
    const box = await locator.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  },

  /**
   * Assert that mobile menu is properly structured
   */
  async toHaveProperMobileMenu(page: Page) {
    await expect(page.getByRole('dialog', { name: /navigation menu/i })).toBeVisible();
    await expect(page.getByRole('navigation', { name: /mobile navigation/i })).toBeVisible();
    
    // Check all required navigation items
    for (const route of MOBILE_ROUTES) {
      await expect(page.getByRole('link', { name: new RegExp(route.name, 'i') })).toBeVisible();
    }
  },

  /**
   * Assert that mobile header is properly positioned
   */
  async toHaveFixedMobileHeader(page: Page) {
    const header = page.locator('header.mobile-header');
    await expect(header).toBeVisible();
    
    const headerBox = await header.boundingBox();
    expect(headerBox?.y).toBe(0); // Should be at top of viewport
    
    const computedStyle = await page.evaluate(() => {
      const header = document.querySelector('header.mobile-header') as HTMLElement;
      return window.getComputedStyle(header).position;
    });
    
    expect(computedStyle).toBe('fixed');
  },
};

/**
 * Mobile test data generators
 */
export const mobileTestData = {
  /**
   * Generate test scenarios for different mobile devices
   */
  deviceScenarios: () => {
    return Object.keys(MOBILE_USER_AGENTS).map(device => ({
      device: device as keyof typeof MOBILE_USER_AGENTS,
      userAgent: MOBILE_USER_AGENTS[device as keyof typeof MOBILE_USER_AGENTS],
      viewport: MOBILE_VIEWPORTS[device as keyof typeof MOBILE_VIEWPORTS] || { width: 390, height: 844 },
      shouldRedirect: ['iPhoneSE', 'iPhone12', 'iPhone13Pro', 'pixel5', 'galaxyS21'].includes(device),
    }));
  },

  /**
   * Generate mobile route test data
   */
  routeScenarios: () => {
    return MOBILE_ROUTES.map(route => ({
      ...route,
      testId: route.path.replace('/m/', '').replace('/', '_'),
    }));
  },

  /**
   * Generate accessibility test scenarios
   */
  a11yScenarios: () => {
    return [
      { name: 'keyboard-only', description: 'Test with keyboard navigation only' },
      { name: 'screen-reader', description: 'Test screen reader compatibility' },
      { name: 'high-contrast', description: 'Test high contrast mode' },
      { name: 'reduced-motion', description: 'Test with reduced motion preference' },
    ];
  },
};