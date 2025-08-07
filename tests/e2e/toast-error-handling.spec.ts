import { test, expect } from '@playwright/test';
import { fixtures } from '../fixtures';

test.describe('Toast Error Handling', () => {
  test('shows error toast when API returns 500 status', async ({ page }) => {
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

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Upload model image
    await page.setInputFiles('input[data-test="model-upload"]', fixtures.model);
    
    // Upload apparel image  
    await page.setInputFiles('input[data-test="apparel-upload"]', fixtures.apparel);

    // Wait for and click the generate button
    await page.waitForSelector('button[data-test="generate-button"]', { state: 'visible' });
    await page.click('button[data-test="generate-button"]');

    // Wait for the error toast to appear
    await expect(page.locator('li[role="status"][data-state="open"]').filter({ hasText: 'Server error, please try again.' })).toBeVisible();

    // Wait for the toast to auto-dismiss (5 seconds)
    await expect(page.locator('li[role="status"][data-state="open"]').filter({ hasText: 'Server error, please try again.' })).not.toBeVisible({ timeout: 6000 });
  });

  test('shows rate limit toast when API returns 429 status', async ({ page }) => {
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

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Upload model image
    await page.setInputFiles('input[data-test="model-upload"]', fixtures.model);
    
    // Upload apparel image  
    await page.setInputFiles('input[data-test="apparel-upload"]', fixtures.apparel);

    // Wait for and click the generate button
    await page.waitForSelector('button[data-test="generate-button"]', { state: 'visible' });
    await page.click('button[data-test="generate-button"]');

    // Wait for the rate limit toast to appear
    await expect(page.locator('li[role="status"][data-state="open"]').filter({ hasText: 'OpenAI rate limit reached, try later.' })).toBeVisible();

    // Wait for the toast to auto-dismiss
    await expect(page.locator('li[role="status"][data-state="open"]').filter({ hasText: 'OpenAI rate limit reached, try later.' })).not.toBeVisible({ timeout: 6000 });
  });

  test('shows validation error toast when API returns 400 status', async ({ page }) => {
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

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Upload model image
    await page.setInputFiles('input[data-test="model-upload"]', fixtures.model);
    
    // Upload apparel image  
    await page.setInputFiles('input[data-test="apparel-upload"]', fixtures.apparel);

    // Wait for and click the generate button
    await page.waitForSelector('button[data-test="generate-button"]', { state: 'visible' });
    await page.click('button[data-test="generate-button"]');

    // Wait for the validation error toast to appear
    await expect(page.locator('li[role="status"][data-state="open"]').filter({ hasText: 'Invalid images uploaded.' })).toBeVisible();

    // Wait for the toast to auto-dismiss
    await expect(page.locator('li[role="status"][data-state="open"]').filter({ hasText: 'Invalid images uploaded.' })).not.toBeVisible({ timeout: 6000 });
  });

  test('shows unexpected error toast for unknown status codes', async ({ page }) => {
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

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Upload model image
    await page.setInputFiles('input[data-test="model-upload"]', fixtures.model);
    
    // Upload apparel image  
    await page.setInputFiles('input[data-test="apparel-upload"]', fixtures.apparel);

    // Wait for and click the generate button
    await page.waitForSelector('button[data-test="generate-button"]', { state: 'visible' });
    await page.click('button[data-test="generate-button"]');

    // Wait for the unexpected error toast to appear
    await expect(page.locator('li[role="status"][data-state="open"]').filter({ hasText: 'Unexpected error, please retry.' })).toBeVisible();

    // Wait for the toast to auto-dismiss
    await expect(page.locator('li[role="status"][data-state="open"]').filter({ hasText: 'Unexpected error, please retry.' })).not.toBeVisible({ timeout: 6000 });
  });
});
