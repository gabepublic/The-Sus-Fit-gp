import { test, expect } from '@playwright/test';

test.describe('Retake Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Grant camera permissions
    await page.context().grantPermissions(['camera']);
  });

  test('completes full retake workflow: Take → Retake → Take again with different images', async ({ page }) => {
    // Wait for the page to load and camera to initialize
    await page.waitForSelector('#camera-stream', { timeout: 10000 });
    
    // Wait for camera stream to be active
    await page.waitForFunction(() => {
      const video = document.querySelector('#camera-stream') as HTMLVideoElement;
      return video && video.srcObject && video.readyState >= 2;
    }, { timeout: 10000 });

    // Step 1: Take first selfie
    await page.click('#take-btn');
    
    // Wait for selfie preview to appear
    await page.waitForSelector('img[alt="Captured selfie preview"]', { timeout: 5000 });
    
    // Verify button states after capture
    await expect(page.locator('#take-btn')).toBeDisabled();
    await expect(page.locator('#download-btn')).not.toBeDisabled();
    await expect(page.locator('#retake-btn')).not.toBeDisabled();
    
    // Get the first image data for comparison
    const firstImageSrc = await page.locator('img[alt="Captured selfie preview"]').getAttribute('src');
    expect(firstImageSrc).toBeTruthy();
    
    // Step 2: Click retake
    await page.click('#retake-btn');
    
    // Wait for retake to complete - preview should disappear and video should be visible
    await page.waitForSelector('img[alt="Captured selfie preview"]', { state: 'hidden', timeout: 5000 });
    await page.waitForSelector('#camera-stream', { timeout: 5000 });
    
    // Verify button states are reset to initial
    await expect(page.locator('#take-btn')).not.toBeDisabled();
    await expect(page.locator('#download-btn')).toBeDisabled();
    await expect(page.locator('#retake-btn')).toBeDisabled();
    
    // Step 3: Take second selfie
    await page.click('#take-btn');
    
    // Wait for second selfie preview to appear
    await page.waitForSelector('img[alt="Captured selfie preview"]', { timeout: 5000 });
    
    // Get the second image data
    const secondImageSrc = await page.locator('img[alt="Captured selfie preview"]').getAttribute('src');
    expect(secondImageSrc).toBeTruthy();
    
    // Step 4: Verify the images are different (different blob URLs)
    expect(firstImageSrc).not.toBe(secondImageSrc);
    
    // Additional verification: check that both images are blob URLs
    expect(firstImageSrc).toMatch(/^blob:/);
    expect(secondImageSrc).toMatch(/^blob:/);
  });

  test('handles retake during loading state gracefully', async ({ page }) => {
    // Wait for camera to initialize
    await page.waitForSelector('#camera-stream', { timeout: 10000 });
    
    // Take a selfie
    await page.click('#take-btn');
    await page.waitForSelector('img[alt="Captured selfie preview"]', { timeout: 5000 });
    
    // Start generating anime (this sets loading state)
    await page.click('#generate-anime-btn');
    
    // Wait for loading spinner to appear
    await page.waitForSelector('[data-testid="spinner"]', { timeout: 5000 });
    
    // Click retake while in loading state
    await page.click('#retake-btn');
    
    // Verify retake completes successfully
    await page.waitForSelector('img[alt="Captured selfie preview"]', { state: 'hidden', timeout: 5000 });
    await page.waitForSelector('#camera-stream', { timeout: 5000 });
    
    // Verify loading state is cleared and buttons are reset
    await expect(page.locator('[data-testid="spinner"]')).not.toBeVisible();
    await expect(page.locator('#take-btn')).not.toBeDisabled();
    await expect(page.locator('#download-btn')).toBeDisabled();
    await expect(page.locator('#retake-btn')).toBeDisabled();
  });

  test('clears all image state and UI elements after retake', async ({ page }) => {
    // Wait for camera to initialize
    await page.waitForSelector('#camera-stream', { timeout: 10000 });
    
    // Take a selfie
    await page.click('#take-btn');
    await page.waitForSelector('img[alt="Captured selfie preview"]', { timeout: 5000 });
    
    // Verify original image is displayed in the grid
    await expect(page.locator('#selfie-img[src*="blob:"]')).toBeVisible();
    
    // Click retake
    await page.click('#retake-btn');
    
    // Verify all image elements are cleared
    await page.waitForSelector('img[alt="Captured selfie preview"]', { state: 'hidden', timeout: 5000 });
    
    // Verify the grid images are back to placeholder state
    await expect(page.locator('#selfie-img[src*="data:image/svg+xml"]')).toBeVisible();
    await expect(page.locator('#anime-img[src*="data:image/svg+xml"]')).toBeVisible();
    
    // Verify no blob URLs remain in the DOM
    const blobImages = await page.locator('img[src*="blob:"]').count();
    expect(blobImages).toBe(0);
  });

  test('restarts camera stream properly after retake', async ({ page }) => {
    // Wait for initial camera setup
    await page.waitForSelector('#camera-stream', { timeout: 10000 });
    
    // Get initial video state
    const initialVideoSrcObject = await page.evaluate(() => {
      const video = document.querySelector('#camera-stream') as HTMLVideoElement;
      return video.srcObject ? 'has-stream' : 'no-stream';
    });
    expect(initialVideoSrcObject).toBe('has-stream');
    
    // Take a selfie
    await page.click('#take-btn');
    await page.waitForSelector('img[alt="Captured selfie preview"]', { timeout: 5000 });
    
    // Click retake
    await page.click('#retake-btn');
    
    // Wait for camera to restart
    await page.waitForSelector('#camera-stream', { timeout: 5000 });
    
    // Verify camera stream is active again
    await page.waitForFunction(() => {
      const video = document.querySelector('#camera-stream') as HTMLVideoElement;
      return video && video.srcObject && video.readyState >= 2;
    }, { timeout: 10000 });
    
    // Verify video is playing
    const isVideoPlaying = await page.evaluate(() => {
      const video = document.querySelector('#camera-stream') as HTMLVideoElement;
      return !video.paused && !video.ended && video.currentTime > 0;
    });
    expect(isVideoPlaying).toBe(true);
  });

  test('handles multiple retake cycles without memory leaks', async ({ page }) => {
    // Wait for camera to initialize
    await page.waitForSelector('#camera-stream', { timeout: 10000 });
    
    // Perform multiple take/retake cycles
    for (let i = 0; i < 3; i++) {
      // Take selfie
      await page.click('#take-btn');
      await page.waitForSelector('img[alt="Captured selfie preview"]', { timeout: 5000 });
      
      // Verify selfie is captured
      await expect(page.locator('img[alt="Captured selfie preview"]')).toBeVisible();
      
      // Click retake
      await page.click('#retake-btn');
      await page.waitForSelector('img[alt="Captured selfie preview"]', { state: 'hidden', timeout: 5000 });
      
      // Verify camera is restored
      await page.waitForSelector('#camera-stream', { timeout: 5000 });
    }
    
    // Final verification: camera should still be working
    await page.waitForFunction(() => {
      const video = document.querySelector('#camera-stream') as HTMLVideoElement;
      return video && video.srcObject && video.readyState >= 2;
    }, { timeout: 10000 });
    
    // Verify no blob URLs remain (all should be cleaned up)
    const blobImages = await page.locator('img[src*="blob:"]').count();
    expect(blobImages).toBe(0);
  });
}); 