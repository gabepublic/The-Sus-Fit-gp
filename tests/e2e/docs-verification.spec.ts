import { test, expect } from '@playwright/test';

test.describe('TypeDoc Documentation Verification', () => {
  test('should load documentation correctly with all assets', async ({ page }) => {
    // Start the server manually first with: pnpm docs:serve
    const baseUrl = 'http://localhost:8080';
    
    // Navigate to docs
    await page.goto(baseUrl);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Check that the title is correct
    await expect(page).toHaveTitle(/Sus Fit API Documentation/);
    
    // Check that the main heading is visible
    const mainHeading = page.locator('h1').first();
    await expect(mainHeading).toBeVisible();
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/docs-verification.png', fullPage: true });
    
    // Check that CSS is loaded by verifying styles are applied
    const bodyStyles = await page.locator('body').evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        fontFamily: computed.fontFamily,
        backgroundColor: computed.backgroundColor,
        margin: computed.margin
      };
    });
    
    console.log('Body styles:', bodyStyles);
    expect(bodyStyles.fontFamily).not.toBe('');
    
    // Check that JavaScript is working by testing the search functionality
    const searchTrigger = page.locator('#tsd-search-trigger');
    await expect(searchTrigger).toBeVisible();
    
    await searchTrigger.click();
    const searchDialog = page.locator('#tsd-search');
    await expect(searchDialog).toBeVisible();
    
    // Test search functionality
    const searchInput = page.locator('#tsd-search-input');
    await searchInput.fill('useTryonMutation');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    const searchResults = page.locator('#tsd-search-results li');
    const resultCount = await searchResults.count();
    console.log('Search results count:', resultCount);
    
    expect(resultCount).toBeGreaterThan(0);
    
    // Click on first search result to test navigation
    if (resultCount > 0) {
      await searchResults.first().click();
      await page.waitForLoadState('networkidle');
      
      // Verify we navigated to a function page
      const functionTitle = page.locator('h1, h2, h3').filter({ hasText: /useTryonMutation|Function/ });
      const titleVisible = await functionTitle.count() > 0;
      console.log('Function page loaded successfully:', titleVisible);
      
      await page.screenshot({ path: 'test-results/docs-function-page.png' });
    }
    
    // Test navigation menu
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    
    // Check for navigation sections
    const navSections = [
      'functions',
      'classes',
      'interfaces',
      'enums'
    ];
    
    for (const section of navSections) {
      const sectionLink = page.locator(`a[href*="${section}"]`).first();
      if (await sectionLink.isVisible()) {
        console.log(`${section} section link found`);
        await sectionLink.click();
        await page.waitForTimeout(500);
        
        const pageContent = await page.locator('body').textContent();
        const hasContent = pageContent && pageContent.length > 100;
        console.log(`${section} page has content:`, hasContent);
        
        await page.screenshot({ path: `test-results/docs-${section}-page.png` });
        await page.goBack();
        await page.waitForTimeout(500);
      }
    }
    
    console.log('✅ Documentation verification completed successfully');
  });
});