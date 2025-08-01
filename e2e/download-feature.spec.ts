import { test, expect } from '@playwright/test';

test.describe('Download Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Chromium Browser', () => {
    test('should download original image when available', async ({ page }) => {
      // Mock camera access
      await page.addInitScript(() => {
        Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
          value: async () => {
            return new MediaStream();
          },
          configurable: true
        });
      });

      // Take a selfie (mock the canvas to draw an image)
      await page.addInitScript(() => {
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type) {
          const context = originalGetContext.call(this, type);
          if (type === '2d') {
            // Mock canvas drawing
            context.drawImage = () => {};
            context.toBlob = (callback) => {
              const blob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
              callback(blob);
            };
          }
          return context;
        };
      });

      // Click take photo button
      await page.click('button[aria-label="Take Photo"]');
      
      // Wait for selfie to be available
      await page.waitForSelector('button[aria-label="Download"]:not([disabled])');
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      
      // Open dropdown and click download original
      await page.click('button[aria-label="Download"]');
      await page.click('[aria-label="download-original"]');
      
      // Verify download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('original-selfie.png');
    });

    test('should download anime image after generation', async ({ page }) => {
      // Mock camera access
      await page.addInitScript(() => {
        Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
          value: async () => {
            return new MediaStream();
          },
          configurable: true
        });
      });

      // Mock canvas for selfie
      await page.addInitScript(() => {
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type) {
          const context = originalGetContext.call(this, type);
          if (type === '2d') {
            context.drawImage = () => {};
            context.toBlob = (callback) => {
              const blob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
              callback(blob);
            };
          }
          return context;
        };
      });

      // Mock anime API response
      await page.route('/api/anime', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            url: 'data:image/png;base64,fake-anime-image-data'
          })
        });
      });

      // Take photo and generate anime
      await page.click('button[aria-label="Take Photo"]');
      await page.waitForSelector('button[aria-label="Generate Anime"]:not([disabled])');
      await page.click('button[aria-label="Generate Anime"]');
      
      // Wait for anime generation to complete (within 10 seconds)
      await page.waitForSelector('button[aria-label="Download"]:not([disabled])', { timeout: 10000 });
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      
      // Open dropdown and click download anime
      await page.click('button[aria-label="Download"]');
      await page.click('[aria-label="download-anime"]');
      
      // Verify download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('anime-selfie.png');
    });

    test('should show toast when trying to download unavailable images', async ({ page }) => {
      // Open dropdown without taking photo
      await page.click('button[aria-label="Download"]');
      
      // Try to download original (should be disabled)
      const originalOption = page.locator('[aria-label="download-original"]');
      await expect(originalOption).toHaveAttribute('aria-disabled', 'true');
      
      // Try to download anime (should be disabled)
      const animeOption = page.locator('[aria-label="download-anime"]');
      await expect(animeOption).toHaveAttribute('aria-disabled', 'true');
    });
  });

  test.describe('WebKit (iOS Safari) Emulation', () => {
    test.use({ 
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    });

    test('should open new tab for download on iOS Safari', async ({ page, context }) => {
      // Mock camera access
      await page.addInitScript(() => {
        Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
          value: async () => {
            return new MediaStream();
          },
          configurable: true
        });
      });

      // Mock canvas for selfie
      await page.addInitScript(() => {
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type) {
          const context = originalGetContext.call(this, type);
          if (type === '2d') {
            context.drawImage = () => {};
            context.toBlob = (callback) => {
              const blob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
              callback(blob);
            };
          }
          return context;
        };
      });

      // Take a selfie
      await page.click('button[aria-label="Take Photo"]');
      await page.waitForSelector('button[aria-label="Download"]:not([disabled])');
      
      // Listen for new page/tab opening
      const pagePromise = context.waitForEvent('page');
      
      // Open dropdown and click download original
      await page.click('button[aria-label="Download"]');
      await page.click('[aria-label="download-original"]');
      
      // Verify new page/tab opened
      const newPage = await pagePromise;
      expect(newPage.url()).toContain('blob:');
      await newPage.close();
    });

    test('should handle window.open being blocked on iOS Safari', async ({ page }) => {
      // Mock camera access
      await page.addInitScript(() => {
        Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
          value: async () => {
            return new MediaStream();
          },
          configurable: true
        });
      });

      // Mock canvas for selfie
      await page.addInitScript(() => {
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type) {
          const context = originalGetContext.call(this, type);
          if (type === '2d') {
            context.drawImage = () => {};
            context.toBlob = (callback) => {
              const blob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
              callback(blob);
            };
          }
          return context;
        };
      });

      // Mock window.open to throw error (blocked by browser)
      await page.addInitScript(() => {
        const originalWindowOpen = window.open;
        window.open = () => {
          throw new Error('Popup blocked');
        };
      });

      // Take a selfie
      await page.click('button[aria-label="Take Photo"]');
      await page.waitForSelector('button[aria-label="Download"]:not([disabled])');
      
      // Listen for console warning
      const consolePromise = page.waitForEvent('console', msg => 
        msg.type() === 'warning' && msg.text().includes('Download blocked by browser')
      );
      
      // Open dropdown and click download original
      await page.click('button[aria-label="Download"]');
      await page.click('[aria-label="download-original"]');
      
      // Verify console warning was logged
      const consoleMsg = await consolePromise;
      expect(consoleMsg.text()).toContain('Download blocked by browser. Press and hold image to save.');
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work on Firefox', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'This test is for Firefox only');
      
      // Mock camera access
      await page.addInitScript(() => {
        Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
          value: async () => {
            return new MediaStream();
          },
          configurable: true
        });
      });

      // Mock canvas for selfie
      await page.addInitScript(() => {
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type) {
          const context = originalGetContext.call(this, type);
          if (type === '2d') {
            context.drawImage = () => {};
            context.toBlob = (callback) => {
              const blob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
              callback(blob);
            };
          }
          return context;
        };
      });

      // Take a selfie
      await page.click('button[aria-label="Take Photo"]');
      await page.waitForSelector('button[aria-label="Download"]:not([disabled])');
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      
      // Open dropdown and click download original
      await page.click('button[aria-label="Download"]');
      await page.click('[aria-label="download-original"]');
      
      // Verify download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('original-selfie.png');
    });

    test('should work on Safari', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'This test is for Safari only');
      
      // Mock camera access
      await page.addInitScript(() => {
        Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
          value: async () => {
            return new MediaStream();
          },
          configurable: true
        });
      });

      // Mock canvas for selfie
      await page.addInitScript(() => {
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type) {
          const context = originalGetContext.call(this, type);
          if (type === '2d') {
            context.drawImage = () => {};
            context.toBlob = (callback) => {
              const blob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
              callback(blob);
            };
          }
          return context;
        };
      });

      // Take a selfie
      await page.click('button[aria-label="Take Photo"]');
      await page.waitForSelector('button[aria-label="Download"]:not([disabled])');
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      
      // Open dropdown and click download original
      await page.click('button[aria-label="Download"]');
      await page.click('[aria-label="download-original"]');
      
      // Verify download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('original-selfie.png');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle anime generation timeout gracefully', async ({ page }) => {
      // Mock camera access
      await page.addInitScript(() => {
        Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
          value: async () => {
            return new MediaStream();
          },
          configurable: true
        });
      });

      // Mock canvas for selfie
      await page.addInitScript(() => {
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type) {
          const context = originalGetContext.call(this, type);
          if (type === '2d') {
            context.drawImage = () => {};
            context.toBlob = (callback) => {
              const blob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
              callback(blob);
            };
          }
          return context;
        };
      });

      // Mock anime API to timeout
      await page.route('/api/anime', async route => {
        // Simulate timeout by not fulfilling the request
        // The request will timeout after the configured timeout period
      });

      // Take photo and try to generate anime
      await page.click('button[aria-label="Take Photo"]');
      await page.waitForSelector('button[aria-label="Generate Anime"]:not([disabled])');
      await page.click('button[aria-label="Generate Anime"]');
      
      // Wait for error state (timeout after 10 seconds)
      await page.waitForSelector('button[aria-label="Generate Anime"]:not([disabled])', { timeout: 15000 });
      
      // Verify anime download is still disabled
      await page.click('button[aria-label="Download"]');
      const animeOption = page.locator('[aria-label="download-anime"]');
      await expect(animeOption).toHaveAttribute('aria-disabled', 'true');
    });

    test('should handle network errors during anime generation', async ({ page }) => {
      // Mock camera access
      await page.addInitScript(() => {
        Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
          value: async () => {
            return new MediaStream();
          },
          configurable: true
        });
      });

      // Mock canvas for selfie
      await page.addInitScript(() => {
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type) {
          const context = originalGetContext.call(this, type);
          if (type === '2d') {
            context.drawImage = () => {};
            context.toBlob = (callback) => {
              const blob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
              callback(blob);
            };
          }
          return context;
        };
      });

      // Mock anime API to return error
      await page.route('/api/anime', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      // Take photo and try to generate anime
      await page.click('button[aria-label="Take Photo"]');
      await page.waitForSelector('button[aria-label="Generate Anime"]:not([disabled])');
      await page.click('button[aria-label="Generate Anime"]');
      
      // Wait for error state
      await page.waitForSelector('button[aria-label="Generate Anime"]:not([disabled])', { timeout: 10000 });
      
      // Verify anime download is still disabled
      await page.click('button[aria-label="Download"]');
      const animeOption = page.locator('[aria-label="download-anime"]');
      await expect(animeOption).toHaveAttribute('aria-disabled', 'true');
    });
  });
}); 