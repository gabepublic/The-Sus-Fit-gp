// Simple Site Loading Diagnostic Script
// Uses Playwright to diagnose why the site doesn't load

import { test } from '@playwright/test';

test('diagnose homepage loading issues', async ({ page }) => {
  console.log('=== STARTING DIAGNOSTIC TEST ===');
  
  // Collect console errors
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const error = `Console Error: ${msg.text()}`;
      console.log(error);
      consoleErrors.push(error);
    } else if (msg.type() === 'warning') {
      console.log(`Console Warning: ${msg.text()}`);
    }
  });
  
  // Collect network failures
  page.on('response', response => {
    if (response.status() >= 400) {
      const error = `Network Error: ${response.status()} ${response.url()}`;
      console.log(error);
      networkErrors.push(error);
    }
  });
  
  // Collect request failures
  page.on('requestfailed', request => {
    const error = `Request Failed: ${request.url()} - ${request.failure()?.errorText}`;
    console.log(error);
    networkErrors.push(error);
  });
  
  console.log('Attempting to load http://localhost:3000...');
  
  try {
    // Navigate to the site with extended timeout
    await page.goto('http://localhost:3000', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait a bit for React to hydrate
    await page.waitForTimeout(3000);
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'diagnostic-screenshot.png', 
      fullPage: true 
    });
    console.log('Screenshot saved as diagnostic-screenshot.png');
    
    // Check if basic elements are present
    console.log('\n=== CHECKING PAGE CONTENT ===');
    
    const title = await page.title();
    console.log(`Page title: "${title}"`);
    
    const bodyText = await page.locator('body').textContent();
    console.log(`Body text length: ${bodyText?.length || 0} characters`);
    
    if (bodyText && bodyText.length > 0) {
      console.log(`First 200 chars: "${bodyText.substring(0, 200)}..."`);
    }
    
    // Check for React/Next.js specific elements
    const reactRoot = page.locator('#__next');
    const hasReactRoot = await reactRoot.count() > 0;
    console.log(`React root (#__next) present: ${hasReactRoot}`);
    
    // Check for error boundaries or error messages
    const errorBoundary = page.locator('[data-testid="error-boundary"], .error, .error-page');
    const hasErrorBoundary = await errorBoundary.count() > 0;
    console.log(`Error boundary/page present: ${hasErrorBoundary}`);
    
    if (hasErrorBoundary) {
      const errorText = await errorBoundary.textContent();
      console.log(`Error content: "${errorText}"`);
    }
    
    // Check for loading states
    const loadingElements = page.locator('[data-testid*="loading"], .loading, .spinner');
    const hasLoading = await loadingElements.count() > 0;
    console.log(`Loading elements present: ${hasLoading}`);
    
  } catch (error) {
    console.log(`\n=== NAVIGATION FAILED ===`);
    console.log(`Error: ${error}`);
    
    // Still try to take a screenshot to see what's shown
    try {
      await page.screenshot({ 
        path: 'diagnostic-screenshot-error.png', 
        fullPage: true 
      });
      console.log('Error screenshot saved as diagnostic-screenshot-error.png');
    } catch (screenshotError) {
      console.log(`Could not take screenshot: ${screenshotError}`);
    }
  }
  
  // Report collected errors
  console.log(`\n=== DIAGNOSTIC SUMMARY ===`);
  console.log(`Console errors: ${consoleErrors.length}`);
  consoleErrors.forEach((error, i) => {
    console.log(`  ${i + 1}. ${error}`);
  });
  
  console.log(`Network errors: ${networkErrors.length}`);
  networkErrors.forEach((error, i) => {
    console.log(`  ${i + 1}. ${error}`);
  });
  
  // Get current URL to see if redirects happened
  const currentUrl = page.url();
  console.log(`Final URL: ${currentUrl}`);
  
  console.log('=== DIAGNOSTIC COMPLETE ===');
});