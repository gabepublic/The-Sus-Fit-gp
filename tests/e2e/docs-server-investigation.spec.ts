import { test, expect } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

// Test to investigate docs server rendering issues
test.describe('TypeDoc Documentation Server Investigation', () => {
  let serverProcess: ChildProcess;
  const serverPort = 8081; // Use different port to avoid conflicts
  const baseUrl = `http://localhost:${serverPort}`;

  test.beforeAll(async () => {
    // Start the http-server for docs
    console.log('Starting http-server for docs investigation...');
    serverProcess = spawn('npx', ['http-server', 'docs', '-p', serverPort.toString(), '-c-1'], {
      stdio: 'pipe',
      shell: true
    });

    // Wait for server to start
    await sleep(3000);
    
    if (serverProcess.stdout) {
      serverProcess.stdout.on('data', (data) => {
        console.log(`Server stdout: ${data}`);
      });
    }
    
    if (serverProcess.stderr) {
      serverProcess.stderr.on('data', (data) => {
        console.log(`Server stderr: ${data}`);
      });
    }
  });

  test.afterAll(async () => {
    if (serverProcess) {
      console.log('Stopping http-server...');
      serverProcess.kill();
      await sleep(1000);
    }
  });

  test('should load index.html and verify content', async ({ page }) => {
    // Navigate to the docs index page
    await page.goto(baseUrl);
    
    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'test-results/docs-index-full.png', fullPage: true });
    
    // Check basic page structure
    await expect(page).toHaveTitle(/Sus Fit API Documentation/);
    
    // Check if the main heading is visible
    const mainHeading = page.locator('h1').first();
    await expect(mainHeading).toBeVisible();
    const headingText = await mainHeading.textContent();
    console.log('Main heading text:', headingText);
    
    // Check if README content is loaded
    const readmeSection = page.locator('.tsd-typography');
    await expect(readmeSection).toBeVisible();
    
    // Look for specific README content
    const prerequisites = page.locator('text=Prerequisites');
    const nodeRequirement = page.locator('text=Node.js');
    const pnpmRequirement = page.locator('text=pnpm');
    
    console.log('Prerequisites visible:', await prerequisites.isVisible());
    console.log('Node.js requirement visible:', await nodeRequirement.isVisible());
    console.log('pnpm requirement visible:', await pnpmRequirement.isVisible());
    
    // Check for API documentation sections
    const apiSections = await page.locator('.tsd-panel').count();
    console.log('Number of documentation panels:', apiSections);
    
    // Check navigation menu
    const navMenu = page.locator('.tsd-widget.menu');
    if (await navMenu.isVisible()) {
      await navMenu.click();
      await sleep(500); // Wait for menu to open
      await page.screenshot({ path: 'test-results/docs-menu-open.png' });
    }
  });

  test('should verify JavaScript assets are loading', async ({ page }) => {
    const jsErrors: string[] = [];
    const networkErrors: string[] = [];
    
    // Capture JavaScript errors
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
      console.log('JavaScript error:', error.message);
    });
    
    // Capture network failures
    page.on('requestfailed', (request) => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
      console.log('Network error:', request.url(), request.failure()?.errorText);
    });
    
    await page.goto(baseUrl);
    
    // Wait for all async scripts to load
    await page.waitForLoadState('networkidle');
    await sleep(2000); // Additional wait for async scripts
    
    // Check if main.js loaded and executed
    const appExists = await page.evaluate(() => {
      return typeof (window as any).app !== 'undefined';
    });
    console.log('TypeDoc app object exists:', appExists);
    
    // Check if search functionality works
    const searchTrigger = page.locator('#tsd-search-trigger');
    if (await searchTrigger.isVisible()) {
      await searchTrigger.click();
      const searchDialog = page.locator('#tsd-search');
      const searchDialogVisible = await searchDialog.isVisible();
      console.log('Search dialog opens:', searchDialogVisible);
      
      if (searchDialogVisible) {
        const searchInput = page.locator('#tsd-search-input');
        await searchInput.fill('useTryonMutation');
        await sleep(1000); // Wait for search results
        
        const searchResults = page.locator('#tsd-search-results li');
        const resultCount = await searchResults.count();
        console.log('Search results for "useTryonMutation":', resultCount);
        
        await page.screenshot({ path: 'test-results/docs-search-results.png' });
      }
    }
    
    // Report any errors found
    if (jsErrors.length > 0) {
      console.log('JavaScript errors found:');
      jsErrors.forEach(error => console.log('  -', error));
    }
    
    if (networkErrors.length > 0) {
      console.log('Network errors found:');
      networkErrors.forEach(error => console.log('  -', error));
    }
    
    // Verify critical assets loaded
    const criticalAssets = [
      '/assets/style.css',
      '/assets/main.js',
      '/assets/icons.js',
      '/assets/search.js',
      '/assets/navigation.js'
    ];
    
    for (const asset of criticalAssets) {
      const response = await page.goto(`${baseUrl}${asset}`);
      const status = response?.status();
      console.log(`Asset ${asset}: status ${status}`);
      expect(status).toBe(200);
    }
  });

  test('should check navigation and module structure', async ({ page }) => {
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    
    // Check if modules are listed
    const modulesLink = page.locator('text=Modules');
    if (await modulesLink.isVisible()) {
      console.log('Modules link found');
      await modulesLink.click();
      await sleep(1000);
      await page.screenshot({ path: 'test-results/docs-modules.png' });
    }
    
    // Check specific documentation sections
    const sections = [
      'functions',
      'classes', 
      'interfaces',
      'enums',
      'types'
    ];
    
    for (const section of sections) {
      const sectionExists = await page.locator(`a[href="${section}/"]`).count() > 0;
      console.log(`${section} section exists:`, sectionExists);
      
      if (sectionExists) {
        await page.goto(`${baseUrl}/${section}/`);
        await sleep(1000);
        
        const pageContent = await page.locator('body').textContent();
        const hasContent = pageContent && pageContent.length > 100;
        console.log(`${section} page has content:`, hasContent);
        
        await page.screenshot({ path: `test-results/docs-${section}.png` });
      }
    }
  });

  test('should verify specific API documentation', async ({ page }) => {
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    
    // Check for specific functions we know should be documented
    const expectedFunctions = [
      'useTryonMutation',
      'useTryonHistory', 
      'useFeatureFlag',
      'processImageForTryon'
    ];
    
    for (const functionName of expectedFunctions) {
      // Try to find the function in the documentation
      const functionLink = page.locator(`a[href*="${functionName}"]`);
      const functionExists = await functionLink.count() > 0;
      console.log(`Function ${functionName} documented:`, functionExists);
      
      if (functionExists) {
        await functionLink.first().click();
        await sleep(1000);
        
        // Check if the function page loads properly
        const functionTitle = page.locator('h1, h2, h3').filter({ hasText: functionName });
        const titleVisible = await functionTitle.isVisible();
        console.log(`Function ${functionName} page loads:`, titleVisible);
        
        // Check for function signature/documentation content
        const signature = page.locator('.tsd-signature, .tsd-panel-content');
        const hasSignature = await signature.count() > 0;
        console.log(`Function ${functionName} has signature:`, hasSignature);
        
        await page.screenshot({ path: `test-results/docs-${functionName}.png` });
        
        // Go back to main page for next iteration
        await page.goto(baseUrl);
        await sleep(500);
      }
    }
  });

  test('should check for rendering performance issues', async ({ page }) => {
    // Monitor performance
    const startTime = Date.now();
    
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Page load time: ${loadTime}ms`);
    
    // Check if content is visible within reasonable time
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
    
    // Check for layout shifts or rendering issues
    const bodyHeight = await page.locator('body').evaluate(el => el.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    
    console.log(`Page height: ${bodyHeight}px, Viewport height: ${viewportHeight}px`);
    
    // Scroll to bottom to trigger any lazy loading
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(1000);
    
    const finalHeight = await page.locator('body').evaluate(el => el.scrollHeight);
    console.log(`Final page height after scroll: ${finalHeight}px`);
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/docs-final-state.png', fullPage: true });
    
    // Check if all expected content sections are present
    const contentSections = await page.locator('.tsd-panel, .tsd-typography, .tsd-navigation').count();
    console.log(`Total content sections found: ${contentSections}`);
    
    expect(contentSections).toBeGreaterThan(0);
  });
});