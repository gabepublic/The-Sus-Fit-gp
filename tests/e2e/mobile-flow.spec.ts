import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForPageReady, waitForComponent, waitForStability } from './utils/test-helpers';

// Mobile Page Object Models
class MobileHomePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/m/home');
    await this.page.waitForLoadState('networkidle');
  }

  async getHeader() {
    return await waitForComponent(this.page, 'header.mobile-header');
  }

  async getHamburgerButton() {
    return this.page.getByRole('button', { name: /navigation menu/i });
  }

  async getLogo() {
    return this.page.getByRole('link', { name: /the sus fit - home/i });
  }

  async openMenu() {
    const hamburger = await this.getHamburgerButton();
    await hamburger.click();
    await this.waitForMenuToOpen();
  }

  async waitForMenuToOpen() {
    await expect(this.page.getByRole('dialog', { name: /navigation menu/i })).toBeVisible();
    await expect(this.page.getByRole('navigation', { name: /mobile navigation/i })).toBeVisible();
  }
}

class MobileMenu {
  constructor(private page: Page) {}

  async getCloseButton() {
    return this.page.getByRole('button', { name: /close navigation menu/i });
  }

  async getMenuDialog() {
    return this.page.getByRole('dialog', { name: /navigation menu/i });
  }

  async getNavigationLinks() {
    return this.page.getByRole('navigation', { name: /mobile navigation/i }).getByRole('link');
  }

  async clickRoute(routeName: string) {
    const link = this.page.getByRole('link', { name: new RegExp(routeName, 'i') });
    await expect(link).toBeVisible();
    await link.click();
    await this.waitForMenuToClose();
  }

  async waitForMenuToClose() {
    await expect(this.page.getByRole('dialog', { name: /navigation menu/i })).not.toBeVisible();
  }

  async closeWithEscape() {
    await this.page.keyboard.press('Escape');
    await this.waitForMenuToClose();
  }

  async closeWithBackdrop() {
    // Click on backdrop (first child of dialog)
    const dialog = await this.getMenuDialog();
    const backdrop = dialog.locator('> div').first();
    await backdrop.click({ position: { x: 10, y: 10 } }); // Click in a safe area
    await this.waitForMenuToClose();
  }
}

class DeviceRedirectHelper {
  constructor(private page: Page) {}

  async setMobileUserAgent() {
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });
  }

  async setTabletUserAgent() {
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15'
    });
  }

  async setDesktopUserAgent() {
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
  }

  async visitRootAndExpectRedirect(expectedPath: string) {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
    await expect(this.page).toHaveURL(expectedPath);
  }

  async visitRootAndExpectNoRedirect() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
    await expect(this.page).toHaveURL('/');
  }
}

// Test configurations for different mobile viewports
const MOBILE_VIEWPORTS = {
  'iPhone SE': { width: 375, height: 667 },
  'iPhone 12': { width: 390, height: 844 },
  'Pixel 5': { width: 393, height: 851 },
  'iPad Mini': { width: 768, height: 1024 },
} as const;

const MOBILE_ROUTES = [
  { path: '/m/home', name: 'Home' },
  { path: '/m/upload-angle', name: 'Upload Your Angle' },
  { path: '/m/upload-fit', name: 'Upload Your Fit' },  
  { path: '/m/tryon', name: 'Try It On' },
  { path: '/m/share', name: 'Share' },
] as const;

// Test Suite: Device Detection and Redirect
test.describe('Mobile Device Detection and Redirect', () => {
  test('phone device should redirect from / to /m/home', async ({ page }) => {
    const redirectHelper = new DeviceRedirectHelper(page);
    
    await redirectHelper.setMobileUserAgent();
    await redirectHelper.visitRootAndExpectRedirect('/m/home');
  });

  test('tablet device should stay on main version', async ({ page }) => {
    const redirectHelper = new DeviceRedirectHelper(page);
    
    await redirectHelper.setTabletUserAgent(); 
    await redirectHelper.visitRootAndExpectNoRedirect();
  });

  test('desktop device should stay on main version', async ({ page }) => {
    const redirectHelper = new DeviceRedirectHelper(page);
    
    await redirectHelper.setDesktopUserAgent();
    await redirectHelper.visitRootAndExpectNoRedirect();
  });

  test('mobile redirect preserves query parameters', async ({ page }) => {
    const redirectHelper = new DeviceRedirectHelper(page);
    
    await redirectHelper.setMobileUserAgent();
    await page.goto('/?test=123&foo=bar');
    await waitForPageReady(page);
    await expect(page).toHaveURL('/m/home?test=123&foo=bar');
  });

  test('view=mobile query param forces mobile redirect', async ({ page }) => {
    await page.goto('/?view=mobile');
    await waitForPageReady(page);
    await expect(page).toHaveURL('/m/home');
  });

  test('view=main query param prevents mobile redirect', async ({ page }) => {
    const redirectHelper = new DeviceRedirectHelper(page);
    
    await redirectHelper.setMobileUserAgent();
    await page.goto('/?view=main');  
    await waitForPageReady(page);
    await expect(page).toHaveURL('/?view=main');
  });
});

// Test Suite: Mobile Navigation Flow
test.describe('Mobile Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    const redirectHelper = new DeviceRedirectHelper(page);
    await redirectHelper.setMobileUserAgent();
  });

  test('complete mobile navigation journey', async ({ page }) => {
    const homePage = new MobileHomePage(page);
    const menu = new MobileMenu(page);

    // Start at mobile home
    await homePage.goto();
    await expect(page.getByText(/home/i)).toBeVisible();

    // Open mobile menu
    await homePage.openMenu();
    
    // Navigate through all mobile routes
    for (const route of MOBILE_ROUTES.slice(1)) { // Skip home since we're already there
      await menu.clickRoute(route.name);
      await expect(page).toHaveURL(route.path);
      await waitForStability(page);
      
      // Verify page content loaded
      await expect(page.locator('main, [role="main"], body')).not.toBeEmpty();
      
      // Open menu for next navigation
      if (route !== MOBILE_ROUTES[MOBILE_ROUTES.length - 1]) {
        await homePage.openMenu();
      }
    }
  });

  test('mobile header components render correctly', async ({ page }) => {
    const homePage = new MobileHomePage(page);
    
    await homePage.goto();
    
    // Check header structure
    const header = await homePage.getHeader();
    await expect(header).toBeVisible();
    await expect(header).toHaveClass(/mobile-header/);
    
    // Check logo
    const logo = await homePage.getLogo();
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('href', '/m/home');
    
    // Check hamburger button
    const hamburger = await homePage.getHamburgerButton();
    await expect(hamburger).toBeVisible();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  });
});

// Test Suite: Hamburger Menu Functionality  
test.describe('Hamburger Menu Functionality', () => {
  let homePage: MobileHomePage;
  let menu: MobileMenu;

  test.beforeEach(async ({ page }) => {
    const redirectHelper = new DeviceRedirectHelper(page);
    await redirectHelper.setMobileUserAgent();
    
    homePage = new MobileHomePage(page);
    menu = new MobileMenu(page);
    
    await homePage.goto();
  });

  test('hamburger button opens and closes menu', async ({ page }) => {
    // Initially closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // Open menu
    await homePage.openMenu();
    const hamburger = await homePage.getHamburgerButton();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    
    // Close menu with close button
    const closeButton = await menu.getCloseButton();
    await closeButton.click();
    await menu.waitForMenuToClose();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  });

  test('menu closes with Escape key', async () => {
    await homePage.openMenu();
    await menu.closeWithEscape();
  });

  test('menu closes when clicking backdrop', async () => {
    await homePage.openMenu();
    await menu.closeWithBackdrop();
  });

  test('menu shows all navigation routes', async ({ page }) => {
    await homePage.openMenu();
    
    const navigationLinks = await menu.getNavigationLinks();
    const linkCount = await navigationLinks.count();
    expect(linkCount).toBe(MOBILE_ROUTES.length);
    
    // Verify each route is present
    for (const route of MOBILE_ROUTES) {
      const link = page.getByRole('link', { name: new RegExp(route.name, 'i') });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', route.path);
    }
  });

  test('menu highlights current route', async ({ page }) => {
    // Start on home page
    await homePage.goto();
    await homePage.openMenu();
    
    const homeLink = page.getByRole('link', { name: /home/i });
    await expect(homeLink).toHaveAttribute('aria-current', 'page');
    
    // Navigate to different page
    await menu.clickRoute('Upload Your Angle');
    await homePage.openMenu();
    
    const angleLink = page.getByRole('link', { name: /upload your angle/i });
    await expect(angleLink).toHaveAttribute('aria-current', 'page');
    
    // Home should no longer be current
    const homeLink2 = page.getByRole('link', { name: /home/i });
    await expect(homeLink2).not.toHaveAttribute('aria-current', 'page');
  });

  test('body scroll is prevented when menu is open', async ({ page }) => {
    await homePage.openMenu();
    
    const bodyOverflow = await page.evaluate(() => {
      return window.getComputedStyle(document.body).overflow;
    });
    
    expect(bodyOverflow).toBe('hidden');
  });
});

// Test Suite: Accessibility Testing
test.describe('Mobile Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    const redirectHelper = new DeviceRedirectHelper(page);
    await redirectHelper.setMobileUserAgent();
  });

  test('mobile home page passes accessibility audit', async ({ page }) => {
    const homePage = new MobileHomePage(page);
    await homePage.goto();
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('mobile menu passes accessibility audit', async ({ page }) => {
    const homePage = new MobileHomePage(page);
    await homePage.goto();
    await homePage.openMenu();
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('all mobile routes pass accessibility audit', async ({ page }) => {
    for (const route of MOBILE_ROUTES) {
      await page.goto(route.path);
      await waitForPageReady(page);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('keyboard navigation works throughout mobile app', async ({ page }) => {
    const homePage = new MobileHomePage(page);
    const menu = new MobileMenu(page);
    await homePage.goto();
    
    // Tab through focusable elements
    await page.keyboard.press('Tab');
    
    // Should focus logo first
    const logo = await homePage.getLogo();
    await expect(logo).toBeFocused();
    
    // Tab to hamburger button
    await page.keyboard.press('Tab');
    const hamburger = await homePage.getHamburgerButton();
    await expect(hamburger).toBeFocused();
    
    // Activate hamburger with Enter
    await page.keyboard.press('Enter');
    await homePage.waitForMenuToOpen();
    
    // First focusable element in menu should be close button
    const closeButton = await menu.getCloseButton();
    await expect(closeButton).toBeFocused();
  });
});

// Test Suite: Multiple Viewport Sizes and Orientations
test.describe('Responsive Mobile Testing', () => {
  Object.entries(MOBILE_VIEWPORTS).forEach(([deviceName, viewport]) => {
    test(`mobile flow works on ${deviceName}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      
      const redirectHelper = new DeviceRedirectHelper(page);
      await redirectHelper.setMobileUserAgent();
      
      const homePage = new MobileHomePage(page);
      const menu = new MobileMenu(page);
      
      // Test basic flow on this viewport
      await homePage.goto();
      await expect(page).toHaveURL('/m/home');
      
      // Test menu functionality
      await homePage.openMenu();
      await menu.clickRoute('Upload Your Angle');
      await expect(page).toHaveURL('/m/upload-angle');
      
      // Verify header is still properly positioned
      const header = await homePage.getHeader();
      await expect(header).toBeVisible();
      
      const headerBox = await header.boundingBox();
      expect(headerBox?.y).toBe(0); // Should be at top
      expect(headerBox?.width).toBeGreaterThan(viewport.width * 0.9); // Should span most of viewport
    });
  });

  test('mobile layout adapts to orientation changes', async ({ page }) => {
    const redirectHelper = new DeviceRedirectHelper(page);
    await redirectHelper.setMobileUserAgent();
    
    const homePage = new MobileHomePage(page);
    
    // Portrait mode
    await page.setViewportSize({ width: 390, height: 844 });
    await homePage.goto();
    
    let header = await homePage.getHeader();
    let headerBox = await header.boundingBox();
    const portraitHeaderHeight = headerBox?.height || 0;
    
    // Landscape mode 
    await page.setViewportSize({ width: 844, height: 390 });
    await waitForStability(page);
    
    header = await homePage.getHeader();
    headerBox = await header.boundingBox();
    const landscapeHeaderHeight = headerBox?.height || 0;
    
    // Header should maintain proper dimensions in both orientations
    expect(portraitHeaderHeight).toBeGreaterThan(40);
    expect(landscapeHeaderHeight).toBeGreaterThan(40);
    
    // Menu should still work in landscape
    await homePage.openMenu();
    const menu = new MobileMenu(page);
    const menuDialog = await menu.getMenuDialog();
    await expect(menuDialog).toBeVisible();
  });
});

// Test Suite: Edge Cases and Error Scenarios
test.describe('Mobile Edge Cases', () => {
  test('handles rapid menu open/close', async ({ page }) => {
    const redirectHelper = new DeviceRedirectHelper(page);
    await redirectHelper.setMobileUserAgent();
    
    const homePage = new MobileHomePage(page);
    const menu = new MobileMenu(page);
    
    await homePage.goto();
    
    // Rapidly open and close menu
    const hamburger = await homePage.getHamburgerButton();
    
    for (let i = 0; i < 3; i++) {
      await hamburger.click();
      await homePage.waitForMenuToOpen();
      
      const closeButton = await menu.getCloseButton();
      await closeButton.click();
      await menu.waitForMenuToClose();
    }
    
    // Should still work normally after rapid clicks
    await hamburger.click();
    await homePage.waitForMenuToOpen();
  });

  test('menu state persists during route changes', async ({ page }) => {
    const redirectHelper = new DeviceRedirectHelper(page);
    await redirectHelper.setMobileUserAgent();
    
    const homePage = new MobileHomePage(page);
    const menu = new MobileMenu(page);
    
    await homePage.goto();
    await homePage.openMenu();
    
    // Navigate to different route - menu should close automatically
    await menu.clickRoute('Share');
    await expect(page).toHaveURL('/m/share');
    
    // Menu should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // Hamburger should reflect closed state
    const hamburger = await homePage.getHamburgerButton();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  });
});