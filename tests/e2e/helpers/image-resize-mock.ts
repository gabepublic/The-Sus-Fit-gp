import { Page } from '@playwright/test'

/**
 * Mock the image resizing API to prevent server errors during tests
 * This prevents the actual image processing from running and causing timeouts
 */
export async function mockImageResizeAPI(page: Page) {
  await page.route('/api/resize', async route => {
    console.log('Intercepting /api/resize request')
    await new Promise(resolve => setTimeout(resolve, 50))
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Image resized successfully',
        resizedB64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        metadata: {
          original: { size: 1000, type: 'image/jpeg', width: 100, height: 100, format: 'jpeg' },
          resized: { size: 500, type: 'image/png', width: 832, height: 1248, format: 'png' }
        },
        resizeInfo: { options: {}, compressionRatio: 0.5 }
      })
    })
  })
}
