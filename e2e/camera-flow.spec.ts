import { test, expect } from '@playwright/test'

test.describe('Camera Flow Tests', () => {
  test.describe('Camera Permission Granted', () => {
    test('successfully initializes camera and displays live preview', async ({ page }) => {
      // Grant camera permissions
      await page.context().grantPermissions(['camera']);
      
      // Navigate to the app with Firefox-optimized settings
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      
      // Wait for video element to be present
      const video = page.locator('video#camera-stream');
      await expect(video).toBeVisible();
      
      // Wait for video to be ready (readyState >= 3 means HAVE_FUTURE_DATA)
      await page.waitForFunction(() => {
        const video = document.querySelector('video#camera-stream') as HTMLVideoElement;
        return video && video.readyState >= 3;
      }, { timeout: 10000 });
      
      // Verify video has correct attributes
      await expect(video).toHaveAttribute('playsinline');
      await expect(video).toHaveAttribute('muted');
      
      // Verify video is playing
      await expect(video).toHaveJSProperty('paused', false);
    });

    test('video element has correct responsive styling', async ({ page }) => {
      await page.context().grantPermissions(['camera']);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load', { timeout: 10000 });
      
      const video = page.locator('video#camera-stream');
      await expect(video).toBeVisible();
      
      // Check responsive classes
      await expect(video).toHaveClass(/rounded-lg/);
      await expect(video).toHaveClass(/w-full/);
      await expect(video).toHaveClass(/h-auto/);
      await expect(video).toHaveClass(/max-w-sm/);
      await expect(video).toHaveClass(/md:max-w-md/);
      await expect(video).toHaveClass(/bg-black/);
    });

    test('buttons are in correct initial state when camera is active', async ({ page }) => {
      await page.context().grantPermissions(['camera']);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load', { timeout: 10000 });
      
      // Wait for camera to initialize
      await page.waitForFunction(() => {
        const video = document.querySelector('video#camera-stream') as HTMLVideoElement;
        return video && video.readyState >= 3;
      }, { timeout: 10000 });
      
      // Check button states
      const takeButton = page.locator('#take-btn');
      const downloadButton = page.locator('#download-btn');
      const retakeButton = page.locator('#retake-btn');
      
      await expect(takeButton).toBeEnabled();
      await expect(downloadButton).toBeDisabled();
      await expect(retakeButton).toBeDisabled();
      
      // Check aria-labels
      await expect(takeButton).toHaveAttribute('aria-label', 'Take photo');
      await expect(downloadButton).toHaveAttribute('aria-label', 'Download');
      await expect(retakeButton).toHaveAttribute('aria-label', 'Retake');
    });
  });

  test.describe('Camera Permission Denied', () => {
    test('shows error alert when camera permission is denied', async ({ page }) => {
      // Mock getUserMedia to simulate permission denied
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'mediaDevices', {
          value: {
            getUserMedia: () => Promise.reject(new DOMException('Camera access denied', 'NotAllowedError'))
          }
        });
      });
      
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load', { timeout: 10000 });
      
      // Wait for error alert to appear - look for alert with camera error content
      const alert = page.locator('[role="alert"]').filter({ hasText: /camera access denied/i });
      await expect(alert).toBeVisible({ timeout: 10000 });
      
      // Check error message - the component shows a more descriptive message
      await expect(alert).toContainText('Camera access denied');
      await expect(alert).toContainText('Please allow camera permissions');
      
      // Check retry button is present
      const retryButton = page.getByRole('button', { name: /retry camera access/i });
      await expect(retryButton).toBeVisible();
    });

    test('retry button attempts to request camera access again', async ({ page }) => {
      // Mock getUserMedia to simulate permission denied initially
      await page.addInitScript(() => {
        let callCount = 0;
        Object.defineProperty(navigator, 'mediaDevices', {
          value: {
            getUserMedia: () => {
              callCount++;
              if (callCount === 1) {
                // First call fails
                return Promise.reject(new DOMException('Camera access denied', 'NotAllowedError'));
              } else {
                // Subsequent calls succeed
                return Promise.resolve({
                  getTracks: () => [{
                    stop: () => {},
                    kind: 'video'
                  }]
                });
              }
            }
          }
        });
      });
      
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load', { timeout: 10000 });
      
      // Wait for initial error - look for alert with camera error content
      const alert = page.locator('[role="alert"]').filter({ hasText: /camera access denied/i });
      await expect(alert).toBeVisible({ timeout: 10000 });
      
      // Click retry button
      const retryButton = page.getByRole('button', { name: /retry camera access/i });
      await retryButton.click();
      
      // Error should disappear and camera should work
      await expect(alert).not.toBeVisible({ timeout: 5000 });
      
      // Video should now be visible
      const video = page.locator('video#camera-stream');
      await expect(video).toBeVisible();
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('works on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.context().grantPermissions(['camera']);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load', { timeout: 10000 });
      
      // Wait for camera to initialize
      await page.waitForFunction(() => {
        const video = document.querySelector('video#camera-stream') as HTMLVideoElement;
        return video && video.readyState >= 3;
      }, { timeout: 10000 });
      
      // Verify responsive layout
      const resultWrapper = page.locator('#result-wrapper');
      await expect(resultWrapper).toHaveClass(/grid-cols-1/);
      
      // Verify video is visible and playing
      const video = page.locator('video#camera-stream');
      await expect(video).toBeVisible();
      await expect(video).toHaveJSProperty('paused', false);
    });

    test('responsive grid switches to two columns on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 800 });
      
      await page.context().grantPermissions(['camera']);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load', { timeout: 10000 });
      
      // Wait for camera to initialize
      await page.waitForFunction(() => {
        const video = document.querySelector('video#camera-stream') as HTMLVideoElement;
        return video && video.readyState >= 3;
      }, { timeout: 10000 });
      
      // Verify desktop layout
      const resultWrapper = page.locator('#result-wrapper');
      await expect(resultWrapper).toHaveClass(/md:grid-cols-2/);
      
      // Verify video is visible and playing
      const video = page.locator('video#camera-stream');
      await expect(video).toBeVisible();
      await expect(video).toHaveJSProperty('paused', false);
    });
  });

  test.describe('Error Handling', () => {
    test('handles camera already in use error gracefully', async ({ page }) => {
      // Mock getUserMedia to simulate camera in use
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'mediaDevices', {
          value: {
            getUserMedia: () => Promise.reject(new DOMException('Camera is already in use', 'NotReadableError'))
          }
        });
      });
      
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load', { timeout: 10000 });
      
      // Wait for error alert - look for alert with camera in use content
      const alert = page.locator('[role="alert"]').filter({ hasText: /camera is already in use/i });
      await expect(alert).toBeVisible({ timeout: 10000 });
      await expect(alert).toContainText('Camera is already in use');
    });

    test('handles no camera found error gracefully', async ({ page }) => {
      // Mock getUserMedia to simulate no camera
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'mediaDevices', {
          value: {
            getUserMedia: () => Promise.reject(new DOMException('No camera found', 'NotFoundError'))
          }
        });
      });
      
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load', { timeout: 10000 });
      
      // Wait for error alert - look for alert with no camera content
      const alert = page.locator('[role="alert"]').filter({ hasText: /no camera found/i });
      await expect(alert).toBeVisible({ timeout: 10000 });
      await expect(alert).toContainText('No camera found');
    });
  });

  test.describe('Accessibility', () => {
    test('has proper ARIA attributes and labels', async ({ page }) => {
      await page.context().grantPermissions(['camera']);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load', { timeout: 10000 });
      
      // Check video element has proper ID
      const video = page.locator('video#camera-stream');
      await expect(video).toBeVisible();
      
      // Check buttons have proper aria-labels
      const takeButton = page.locator('#take-btn');
      const downloadButton = page.locator('#download-btn');
      const retakeButton = page.locator('#retake-btn');
      
      await expect(takeButton).toHaveAttribute('aria-label', 'Take photo');
      await expect(downloadButton).toHaveAttribute('aria-label', 'Download');
      await expect(retakeButton).toHaveAttribute('aria-label', 'Retake');
      
      // Check aria-live attributes
      await expect(takeButton).toHaveAttribute('aria-live', 'polite');
      await expect(downloadButton).toHaveAttribute('aria-live', 'polite');
      await expect(retakeButton).toHaveAttribute('aria-live', 'polite');
    });

    test('error alert is accessible', async ({ page }) => {
      // Mock getUserMedia to simulate permission denied
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'mediaDevices', {
          value: {
            getUserMedia: () => Promise.reject(new DOMException('Camera access denied', 'NotAllowedError'))
          }
        });
      });
      
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load', { timeout: 10000 });
      
      // Wait for error alert - look for alert with camera error content
      const alert = page.locator('[role="alert"]').filter({ hasText: /camera access denied/i });
      await expect(alert).toBeVisible({ timeout: 10000 });
      
      // Check alert has proper role and content
      await expect(alert).toHaveAttribute('role', 'alert');
      await expect(alert).toContainText('Camera access denied');
      
      // Check retry button is accessible
      const retryButton = page.getByRole('button', { name: /retry camera access/i });
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toBeEnabled();
    });
  });
}); 