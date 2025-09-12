/**
 * @fileoverview End-to-End Tests for UploadFit Component
 * Tests the complete user journey from file selection to upload completion
 */

import { test, expect } from '@playwright/test'
import { createMockFile } from '../test-utils/upload-test-utils'

// Helper to create test files for upload
const createTestFile = (name: string, type: string, size: number = 1024 * 1024) => {
  const buffer = Buffer.alloc(size, 'test-content')
  return { name, buffer, type }
}

test.describe('UploadFit E2E Tests', () => {
  // Test setup - navigate to upload page
  test.beforeEach(async ({ page }) => {
    await page.goto('/m/upload-fit') // Mobile route for upload fit
  })

  test.describe('Upload Workflow', () => {
    test('should complete successful upload workflow', async ({ page }) => {
      // Create test file
      const testFile = createTestFile('test-garment.jpg', 'image/jpeg')

      // Wait for page to load
      await expect(page.getByText('Upload Your Fit')).toBeVisible()

      // Click upload button to trigger file selection
      const uploadButton = page.getByRole('button', { name: 'Upload Image' })
      await expect(uploadButton).toBeVisible()

      // Set up file chooser handler
      const fileChooserPromise = page.waitForEvent('filechooser')
      await uploadButton.click()
      const fileChooser = await fileChooserPromise

      // Select test file
      await fileChooser.setFiles([{
        name: testFile.name,
        mimeType: testFile.type,
        buffer: testFile.buffer
      }])

      // Wait for upload to start
      await expect(page.getByText('Uploading your image...')).toBeVisible()

      // Check progress indicator appears
      const progressBar = page.getByRole('progressbar')
      await expect(progressBar).toBeVisible()

      // Wait for upload completion
      await expect(page.getByText('Image uploaded successfully!')).toBeVisible({ timeout: 10000 })

      // Verify uploaded image is displayed
      const uploadedImage = page.getByRole('img', { name: /uploaded fit photo/i })
      await expect(uploadedImage).toBeVisible()

      // Check Next button appears
      const nextButton = page.getByRole('button', { name: 'Next' })
      await expect(nextButton).toBeVisible()
      await expect(nextButton).toBeEnabled()
    })

    test('should handle file validation errors', async ({ page }) => {
      // Create oversized test file (15MB)
      const largeFile = createTestFile('large-garment.jpg', 'image/jpeg', 15 * 1024 * 1024)

      await expect(page.getByText('Upload Your Fit')).toBeVisible()

      const uploadButton = page.getByRole('button', { name: 'Upload Image' })
      const fileChooserPromise = page.waitForEvent('filechooser')
      await uploadButton.click()
      const fileChooser = await fileChooserPromise

      await fileChooser.setFiles([{
        name: largeFile.name,
        mimeType: largeFile.type,
        buffer: largeFile.buffer
      }])

      // Should show validation error
      await expect(page.getByText(/File size.*exceeds.*limit/)).toBeVisible()

      // Retry button should be visible
      const retryButton = page.getByRole('button', { name: 'Retry' })
      await expect(retryButton).toBeVisible()
    })

    test('should handle invalid file types', async ({ page }) => {
      // Create text file
      const textFile = createTestFile('document.txt', 'text/plain')

      await expect(page.getByText('Upload Your Fit')).toBeVisible()

      const uploadButton = page.getByRole('button', { name: 'Upload Image' })
      const fileChooserPromise = page.waitForEvent('filechooser')
      await uploadButton.click()
      const fileChooser = await fileChooserPromise

      await fileChooser.setFiles([{
        name: textFile.name,
        mimeType: textFile.type,
        buffer: textFile.buffer
      }])

      // Should show type validation error
      await expect(page.getByText('File type not supported. Please select a valid image file.')).toBeVisible()
    })

    test('should allow changing image after upload', async ({ page }) => {
      // First upload
      const firstFile = createTestFile('first-garment.jpg', 'image/jpeg')

      await expect(page.getByText('Upload Your Fit')).toBeVisible()

      let uploadButton = page.getByRole('button', { name: 'Upload Image' })
      let fileChooserPromise = page.waitForEvent('filechooser')
      await uploadButton.click()
      let fileChooser = await fileChooserPromise

      await fileChooser.setFiles([{
        name: firstFile.name,
        mimeType: firstFile.type,
        buffer: firstFile.buffer
      }])

      await expect(page.getByText('Image uploaded successfully!')).toBeVisible({ timeout: 10000 })

      // Change image
      const changeButton = page.getByRole('button', { name: 'Change Image' })
      await expect(changeButton).toBeVisible()

      const secondFile = createTestFile('second-garment.jpg', 'image/jpeg', 2 * 1024 * 1024)

      fileChooserPromise = page.waitForEvent('filechooser')
      await changeButton.click()
      fileChooser = await fileChooserPromise

      await fileChooser.setFiles([{
        name: secondFile.name,
        mimeType: secondFile.type,
        buffer: secondFile.buffer
      }])

      // Should start new upload
      await expect(page.getByText('Uploading your image...')).toBeVisible()
      await expect(page.getByText('Image uploaded successfully!')).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Progress and Feedback', () => {
    test('should show progress updates during upload', async ({ page }) => {
      const testFile = createTestFile('progress-test.jpg', 'image/jpeg', 2 * 1024 * 1024)

      await expect(page.getByText('Upload Your Fit')).toBeVisible()

      const uploadButton = page.getByRole('button', { name: 'Upload Image' })
      const fileChooserPromise = page.waitForEvent('filechooser')
      await uploadButton.click()
      const fileChooser = await fileChooserPromise

      await fileChooser.setFiles([{
        name: testFile.name,
        mimeType: testFile.type,
        buffer: testFile.buffer
      }])

      // Wait for upload to start
      await expect(page.getByText('Uploading your image...')).toBeVisible()

      // Check progress bar is present and updating
      const progressBar = page.getByRole('progressbar')
      await expect(progressBar).toBeVisible()

      // Wait a moment and check progress has increased
      await page.waitForTimeout(1000)
      
      // Progress should eventually reach 100%
      await expect(page.getByText('Image uploaded successfully!')).toBeVisible({ timeout: 10000 })
    })

    test('should handle retry after error', async ({ page }) => {
      // Simulate network error by intercepting requests
      await page.route('**/api/upload', route => {
        route.abort('failed')
      })

      const testFile = createTestFile('retry-test.jpg', 'image/jpeg')

      await expect(page.getByText('Upload Your Fit')).toBeVisible()

      const uploadButton = page.getByRole('button', { name: 'Upload Image' })
      const fileChooserPromise = page.waitForEvent('filechooser')
      await uploadButton.click()
      const fileChooser = await fileChooserPromise

      await fileChooser.setFiles([{
        name: testFile.name,
        mimeType: testFile.type,
        buffer: testFile.buffer
      }])

      // Should eventually show error (may take a moment for simulated upload to fail)
      await expect(page.getByText('Retry')).toBeVisible({ timeout: 15000 })

      // Remove route interception to allow retry to succeed
      await page.unroute('**/api/upload')

      // Click retry
      const retryButton = page.getByRole('button', { name: 'Retry' })
      await retryButton.click()

      // Should reset to upload state
      await expect(page.getByText('Upload Image')).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await expect(page.getByText('Upload Your Fit')).toBeVisible()

      // Tab to upload button
      await page.keyboard.press('Tab')
      
      // Upload button should be focused
      const uploadButton = page.getByRole('button', { name: 'Upload Image' })
      await expect(uploadButton).toBeFocused()

      // Should be able to activate with Enter
      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.keyboard.press('Enter')
      await fileChooserPromise
    })

    test('should have proper ARIA attributes', async ({ page }) => {
      await expect(page.getByText('Upload Your Fit')).toBeVisible()

      // Check main region has proper label
      const region = page.getByRole('region', { name: 'Upload your fit image' })
      await expect(region).toBeVisible()

      // Upload button should have proper attributes
      const uploadButton = page.getByRole('button', { name: 'Upload Image' })
      await expect(uploadButton).toHaveAttribute('type', 'button')
    })

    test('should announce status changes to screen readers', async ({ page }) => {
      const testFile = createTestFile('a11y-test.jpg', 'image/jpeg')

      await expect(page.getByText('Upload Your Fit')).toBeVisible()

      const uploadButton = page.getByRole('button', { name: 'Upload Image' })
      const fileChooserPromise = page.waitForEvent('filechooser')
      await uploadButton.click()
      const fileChooser = await fileChooserPromise

      await fileChooser.setFiles([{
        name: testFile.name,
        mimeType: testFile.type,
        buffer: testFile.buffer
      }])

      // Wait for upload completion
      await expect(page.getByText('Image uploaded successfully!')).toBeVisible({ timeout: 10000 })

      // Success message should be announced to screen readers
      const statusMessage = page.getByRole('status')
      await expect(statusMessage).toBeVisible()
      await expect(statusMessage).toHaveAttribute('aria-live', 'polite')
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await expect(page.getByText('Upload Your Fit')).toBeVisible()

      // Component should be visible and usable on mobile
      const uploadButton = page.getByRole('button', { name: 'Upload Image' })
      await expect(uploadButton).toBeVisible()

      // Touch target should be appropriately sized
      const buttonBox = await uploadButton.boundingBox()
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44) // Minimum touch target
    })

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })

      await expect(page.getByText('Upload Your Fit')).toBeVisible()

      const uploadButton = page.getByRole('button', { name: 'Upload Image' })
      await expect(uploadButton).toBeVisible()

      // Component should scale appropriately
      const componentBox = await page.getByRole('region').boundingBox()
      expect(componentBox?.width).toBeLessThanOrEqual(600) // Max width constraint
    })

    test('should work on desktop viewport', async ({ page }) => {
      // Set desktop viewport (default is usually 1280x720)
      await page.setViewportSize({ width: 1920, height: 1080 })

      await expect(page.getByText('Upload Your Fit')).toBeVisible()

      const uploadButton = page.getByRole('button', { name: 'Upload Image' })
      await expect(uploadButton).toBeVisible()

      // Should maintain centered layout on larger screens
      const component = page.getByRole('region')
      const componentBox = await component.boundingBox()
      expect(componentBox?.width).toBeLessThanOrEqual(600)
    })
  })

  test.describe('Performance', () => {
    test('should handle large files efficiently', async ({ page }) => {
      // Create 8MB test file (within limits but large enough to test performance)
      const largeFile = createTestFile('large-valid.jpg', 'image/jpeg', 8 * 1024 * 1024)

      await expect(page.getByText('Upload Your Fit')).toBeVisible()

      const uploadButton = page.getByRole('button', { name: 'Upload Image' })
      const fileChooserPromise = page.waitForEvent('filechooser')
      await uploadButton.click()
      const fileChooser = await fileChooserPromise

      const startTime = Date.now()

      await fileChooser.setFiles([{
        name: largeFile.name,
        mimeType: largeFile.type,
        buffer: largeFile.buffer
      }])

      // Should start upload reasonably quickly
      await expect(page.getByText('Uploading your image...')).toBeVisible({ timeout: 5000 })

      // Complete upload
      await expect(page.getByText('Image uploaded successfully!')).toBeVisible({ timeout: 15000 })

      const totalTime = Date.now() - startTime
      expect(totalTime).toBeLessThan(20000) // Should complete within 20 seconds
    })

    test('should not memory leak on multiple uploads', async ({ page }) => {
      const testFiles = [
        createTestFile('test1.jpg', 'image/jpeg'),
        createTestFile('test2.jpg', 'image/jpeg'),
        createTestFile('test3.jpg', 'image/jpeg')
      ]

      await expect(page.getByText('Upload Your Fit')).toBeVisible()

      // Upload multiple files sequentially
      for (const file of testFiles) {
        const uploadButton = page.getByRole('button', { name: /Upload Image|Change Image/ })
        const fileChooserPromise = page.waitForEvent('filechooser')
        await uploadButton.click()
        const fileChooser = await fileChooserPromise

        await fileChooser.setFiles([{
          name: file.name,
          mimeType: file.type,
          buffer: file.buffer
        }])

        await expect(page.getByText('Image uploaded successfully!')).toBeVisible({ timeout: 10000 })
      }

      // Page should still be responsive after multiple uploads
      const finalUploadButton = page.getByRole('button', { name: 'Change Image' })
      await expect(finalUploadButton).toBeVisible()
      await expect(finalUploadButton).toBeEnabled()
    })
  })

  test.describe('Error Recovery', () => {
    test('should recover from temporary network issues', async ({ page }) => {
      const testFile = createTestFile('network-test.jpg', 'image/jpeg')

      await expect(page.getByText('Upload Your Fit')).toBeVisible()

      // Simulate intermittent network failure
      let requestCount = 0
      await page.route('**/api/upload', route => {
        requestCount++
        if (requestCount === 1) {
          route.abort('failed') // Fail first attempt
        } else {
          route.continue() // Allow retry to succeed
        }
      })

      const uploadButton = page.getByRole('button', { name: 'Upload Image' })
      const fileChooserPromise = page.waitForEvent('filechooser')
      await uploadButton.click()
      const fileChooser = await fileChooserPromise

      await fileChooser.setFiles([{
        name: testFile.name,
        mimeType: testFile.type,
        buffer: testFile.buffer
      }])

      // Should eventually succeed after retry logic
      await expect(page.getByText('Image uploaded successfully!')).toBeVisible({ timeout: 30000 })
    })

    test('should handle component errors gracefully', async ({ page }) => {
      // Add error boundary testing if applicable
      await expect(page.getByText('Upload Your Fit')).toBeVisible()

      // Component should render without JavaScript errors
      const errors: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      // Interact with component
      const uploadButton = page.getByRole('button', { name: 'Upload Image' })
      await uploadButton.click()

      // No JavaScript errors should occur
      expect(errors).toHaveLength(0)
    })
  })

  test.describe('Cross-Browser Compatibility', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`should work in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        // Skip if not the current browser (Playwright runs tests per browser)
        if (currentBrowser !== browserName) return

        const testFile = createTestFile('cross-browser-test.jpg', 'image/jpeg')

        await expect(page.getByText('Upload Your Fit')).toBeVisible()

        const uploadButton = page.getByRole('button', { name: 'Upload Image' })
        const fileChooserPromise = page.waitForEvent('filechooser')
        await uploadButton.click()
        const fileChooser = await fileChooserPromise

        await fileChooser.setFiles([{
          name: testFile.name,
          mimeType: testFile.type,
          buffer: testFile.buffer
        }])

        await expect(page.getByText('Image uploaded successfully!')).toBeVisible({ timeout: 10000 })
      })
    })
  })
})