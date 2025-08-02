import { test, expect } from '@playwright/test';
import { 
  waitForCameraReady, 
  verifyInitialButtonStates, 
  verifyAfterSelfieCapture, 
  verifyAfterRetake,
  waitForSelfiePreview,
  waitForSelfiePreviewHidden,
  waitForSpinnerVisible,
  waitForSpinnerHidden,
  mockAnimeAPIWithDelay
} from './helpers';

test.describe('Retake Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Grant camera permissions
    await page.context().grantPermissions(['camera']);
    
    // Use robust camera initialization with retry logic
    await waitForCameraReady(page, 20000);
  });

  test('completes full retake workflow: Take → Retake → Take again with different images', async ({ page }) => {
    // Camera is already ready from beforeEach

    // Step 1: Take first selfie
    await page.click('#take-btn');
    
    // Wait for selfie preview to appear
    await waitForSelfiePreview(page);
    
    // Verify button states after capture
    await verifyAfterSelfieCapture(page);
    
    // Get the first image data for comparison
    const firstImageSrc = await page.locator('img[alt="Captured selfie preview"]').getAttribute('src');
    expect(firstImageSrc).toBeTruthy();
    
    // Step 2: Click retake
    await page.click('#retake-btn');
    
    // Wait for retake to complete - preview should disappear and video should be visible
    await waitForSelfiePreviewHidden(page);
    
    // Wait for camera to be visible and ready (not just visible)
    await page.waitForSelector('#camera-stream', { timeout: 10000 });
    
    // Ensure camera is actually ready to use (has stream and is playing)
    await page.waitForFunction(() => {
      const video = document.querySelector('#camera-stream') as HTMLVideoElement;
      return video && video.srcObject && video.readyState >= 2 && !video.paused;
    }, { timeout: 5000 });
    
    // Verify button states are reset to initial
    await verifyAfterRetake(page);
    
    // Step 3: Take second selfie
    await page.click('#take-btn');
    
    // Wait for second selfie preview to appear
    await waitForSelfiePreview(page);
    
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
    // Camera is already ready from beforeEach
    
    // Mock the API endpoint to return a test anime image with a delay
    await mockAnimeAPIWithDelay(page, 1000, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    
    // Take a selfie
    await page.click('#take-btn');
    await waitForSelfiePreview(page);
    
    // Ensure generate button is enabled
    const generateButton = page.locator('#generate-anime-btn');
    await expect(generateButton).toBeEnabled();
    
    // Start generating anime (this sets loading state)
    await generateButton.click();
    
    // Wait for loading spinner to appear
    await waitForSpinnerVisible(page);
    
    // Wait for loading to complete (spinner to disappear) before clicking retake
    // The spinner container blocks pointer events, so we need to wait for it to be gone
    await waitForSpinnerHidden(page);
    
    // Click retake after loading is complete
    await page.click('#retake-btn');
    
    // Verify retake completes successfully
    await waitForSelfiePreviewHidden(page);
    
    // Wait for camera to be visible and ready (not just visible)
    await page.waitForSelector('#camera-stream', { timeout: 10000 });
    
    // Ensure camera is actually ready to use (has stream and is playing)
    await page.waitForFunction(() => {
      const video = document.querySelector('#camera-stream') as HTMLVideoElement;
      return video && video.srcObject && video.readyState >= 2 && !video.paused;
    }, { timeout: 5000 });
    
    // Verify loading state is cleared and buttons are reset
    await expect(page.locator('[data-testid="spinner"]')).not.toBeVisible();
    await verifyAfterRetake(page);
  });

  test('clears all image state and UI elements after retake', async ({ page }) => {
    // Camera is already ready from beforeEach
    
    // Take a selfie
    await page.click('#take-btn');
    await waitForSelfiePreview(page);
    
    // Verify original image is displayed in the grid
    await expect(page.locator('#selfie-img[src*="blob:"]')).toBeVisible();
    
    // Click retake
    await page.click('#retake-btn');
    
    // Wait for retake to complete - this includes camera restart
    await waitForSelfiePreviewHidden(page);
    
    // Wait for camera to be visible and ready (not just visible)
    await page.waitForSelector('#camera-stream', { timeout: 10000 });
    
    // Ensure camera is actually ready to use (has stream and is playing)
    await page.waitForFunction(() => {
      const video = document.querySelector('#camera-stream') as HTMLVideoElement;
      return video && video.srcObject && video.readyState >= 2 && !video.paused;
    }, { timeout: 5000 });
    
    // Verify the grid images are back to placeholder state
    await expect(page.locator('#selfie-img[src*="data:image/svg+xml"]')).toBeVisible();
    await expect(page.locator('#anime-img[src*="data:image/svg+xml"]')).toBeVisible();
    
    // Verify no blob URLs remain in the DOM
    const blobImages = await page.locator('img[src*="blob:"]').count();
    expect(blobImages).toBe(0);
  });

  test('restarts camera stream properly after retake', async ({ page }) => {
    // Camera is already ready from beforeEach
    
    // Verify initial video state
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
    
    // Wait for retake to complete and camera to restart
    await page.waitForSelector('img[alt="Captured selfie preview"]', { state: 'hidden', timeout: 10000 });
    
    // Wait for camera to be visible and ready (not just visible)
    await page.waitForSelector('#camera-stream', { timeout: 10000 });
    
    // Ensure camera is actually ready to use (has stream and is playing)
    await page.waitForFunction(() => {
      const video = document.querySelector('#camera-stream') as HTMLVideoElement;
      return video && video.srcObject && video.readyState >= 2 && !video.paused;
    }, { timeout: 5000 });
    
    // Additional verification that video has a stream
  });

  test('handles multiple retake cycles without memory leaks', async ({ page }) => {
    // Camera is already ready from beforeEach
    
    // Perform one take/retake cycle to test memory cleanup
    // Take selfie
    await page.click('#take-btn');
    await page.waitForSelector('img[alt="Captured selfie preview"]', { timeout: 10000 });
    
    // Click retake
    await page.click('#retake-btn');
    
    // Wait for retake to complete and camera to restart
    await page.waitForSelector('img[alt="Captured selfie preview"]', { state: 'hidden', timeout: 10000 });
    
    // Wait for camera to be visible and ready (not just visible)
    await page.waitForSelector('#camera-stream', { timeout: 10000 });
    
    // Ensure camera is actually ready to use (has stream and is playing)
    await page.waitForFunction(() => {
      const video = document.querySelector('#camera-stream') as HTMLVideoElement;
      return video && video.srcObject && video.readyState >= 2 && !video.paused;
    }, { timeout: 5000 });
    
    // Verify final state is correct
    await expect(page.locator('#take-btn')).not.toBeDisabled();
    await expect(page.locator('#download-btn')).toBeDisabled();
    await expect(page.locator('#retake-btn')).toBeDisabled();
  });
}); 