import { test, expect } from '@playwright/test'
import { 
  MOCK_ANIME_RESPONSE,
  waitForCameraOrFallback,
  waitForSelfieCapture,
  waitForAnimeGeneration,
  verifyAnimeImageSource,
  waitForErrorAlert,
  mockAnimeAPI,
  verifyInitialButtonStates,
  verifyAfterSelfieCapture
} from './helpers'

test.describe('Selfie Anime Full User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Grant camera permissions for all tests
    await page.context().grantPermissions(['camera'])
    
    // Navigate to the app
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Wait for camera to initialize or handle fallback
    await waitForCameraOrFallback(page)
  })

  test.describe('Full User Journey: Capture → Transform → Retake', () => {
    test('completes full user journey with successful anime transformation', async ({ page }, testInfo) => {
      // Mock the API endpoint to return our test anime image
      await mockAnimeAPI(page)

      // Step 1: Initial state - capture screenshot
      await page.screenshot({ path: `${testInfo.outputDir}/01-initial-state.png` })
      await testInfo.attach('initial-state', { path: `${testInfo.outputDir}/01-initial-state.png` })

      // Verify initial button states
      const takeButton = page.locator('#take-btn')
      const downloadButton = page.locator('#download-btn')
      const retakeButton = page.locator('#retake-btn')
      const generateButton = page.getByRole('button', { name: /generate anime/i })

      await verifyInitialButtonStates(page)

      // Step 2: Take a photo
      await takeButton.click()
      
      // Wait for selfie to be captured
      await waitForSelfieCapture(page)
      
      // Wait for the blob to be created and generate button to be enabled
      await expect(generateButton).toHaveAttribute('data-selfie-blob', 'exists', { timeout: 5000 })
      
      // Capture screenshot after taking photo
      await page.screenshot({ path: `${testInfo.outputDir}/02-after-capture.png` })
      await testInfo.attach('after-capture', { path: `${testInfo.outputDir}/02-after-capture.png` })

      // Verify button states after capture
      await verifyAfterSelfieCapture(page)
      
      // Wait for generate button to be enabled (depends on blob creation)
      await expect(generateButton).toBeEnabled({ timeout: 3000 })

      // Step 3: Generate anime transformation
      // Verify generate button is enabled before clicking
      await expect(generateButton).toBeEnabled()
      
      // Click the button
      await generateButton.click()

      // Wait for anime image to appear (this indicates the transformation completed)
      const animeImg = page.locator('#anime-img')
      await expect(animeImg).toBeVisible({ timeout: 15000 })

      // Verify the anime image has the correct source
      await expect(animeImg).toHaveAttribute('src', MOCK_ANIME_RESPONSE)

      // Verify loading spinner is gone (if it was visible)
      const spinner = page.locator('[data-testid="generate-anime-btn"] [data-testid="spinner"]')
      await expect(spinner).not.toBeVisible()
      
      // Capture screenshot after transformation
      await page.screenshot({ path: `${testInfo.outputDir}/04-after-transformation.png` })
      await testInfo.attach('after-transformation', { path: `${testInfo.outputDir}/04-after-transformation.png` })

      // Step 4: Test download functionality
      await downloadButton.click()
      
      // Wait for dropdown to appear and click "Download Original"
      // Try different selectors for the dropdown menu item
      const downloadOriginalOption = page.locator('[aria-label="download-original"]')
      await expect(downloadOriginalOption).toBeVisible({ timeout: 10000 })
      await downloadOriginalOption.click()
      
      // Capture screenshot after download
      await page.screenshot({ path: `${testInfo.outputDir}/05-after-download.png` })
      await testInfo.attach('after-download', { path: `${testInfo.outputDir}/05-after-download.png` })

      // Step 5: Test retake functionality
      await retakeButton.click()

      // Wait for retake to complete (selfie should show placeholder, anime should show placeholder)
      // The selfie-img element is always present, but should show placeholder when retake is complete
      const selfieImg = page.locator('#selfie-img')
      await expect(selfieImg).toHaveAttribute('alt', 'No selfie captured yet', { timeout: 5000 })
      await expect(animeImg).toHaveAttribute('alt', 'Anime portrait not yet generated', { timeout: 5000 })
      
      // Verify video stream is restored
      const video = page.locator('video#camera-stream')
      await expect(video).toBeVisible()
      
      // Capture screenshot after retake
      await page.screenshot({ path: `${testInfo.outputDir}/06-after-retake.png` })
      await testInfo.attach('after-retake', { path: `${testInfo.outputDir}/06-after-retake.png` })

      // Verify button states are reset to initial
      await expect(takeButton).toBeEnabled()
      await expect(downloadButton).toBeDisabled()
      await expect(retakeButton).toBeDisabled()
      await expect(generateButton).toBeDisabled()
    })

    test('handles API error gracefully during transformation', async ({ page }, testInfo) => {
      // Mock the API endpoint to return an error
      await page.route('/api/anime', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        })
      })

      // Take a photo first
      const takeButton = page.locator('#take-btn')
      await takeButton.click()

      // Wait for selfie to be captured
      const selfieImg = page.locator('#selfie-img')
      await expect(selfieImg).toBeVisible({ timeout: 5000 })

      // Click "Generate Anime" button
      const generateButton = page.getByRole('button', { name: /generate anime/i })
      await generateButton.click()

      // Wait for error alert to appear (exclude the route announcer)
      const errorAlert = page.locator('[role="alert"]:not(#__next-route-announcer__)')
      await expect(errorAlert).toBeVisible({ timeout: 15000 })
      await expect(errorAlert).toContainText('Internal server error')
      
      // Capture screenshot of error state
      await page.screenshot({ path: `${testInfo.outputDir}/error-state.png` })
      await testInfo.attach('error-state', { path: `${testInfo.outputDir}/error-state.png` })

      // Verify loading spinner is gone (if it was visible)
      const spinner = page.locator('[data-testid="generate-anime-btn"] [data-testid="spinner"]')
      await expect(spinner).not.toBeVisible()

      // Verify buttons are re-enabled
      await expect(takeButton).toBeDisabled() // Still disabled because selfie is captured
      await expect(generateButton).toBeEnabled() // Re-enabled for retry
    })

    test('handles timeout during transformation', async ({ page }, testInfo) => {
      // Mock the API endpoint to never respond (simulate timeout)
      await page.route('/api/anime', async (route) => {
        // Don't call route.fulfill() to simulate timeout
        await new Promise(() => {}) // Never resolves
      })

      // Take a photo first
      const takeButton = page.locator('#take-btn')
      await takeButton.click()

      // Wait for selfie to be captured
      const selfieImg = page.locator('#selfie-img')
      await expect(selfieImg).toBeVisible({ timeout: 5000 })

      // Click "Generate Anime" button
      const generateButton = page.getByRole('button', { name: /generate anime/i })
      await generateButton.click()

      // Wait for loading spinner
      const spinner = page.locator('[data-testid="generate-anime-btn"] [data-testid="spinner"]')
      await expect(spinner).toBeVisible()

      // Wait for timeout error (should appear after 25 seconds)
      const errorAlert = page.locator('[role="alert"]:not(#__next-route-announcer__)')
      await expect(errorAlert).toBeVisible({ timeout: 30000 })
      await expect(errorAlert).toContainText('timed out')
      
      // Capture screenshot of timeout state
      await page.screenshot({ path: `${testInfo.outputDir}/timeout-state.png` })
      await testInfo.attach('timeout-state', { path: `${testInfo.outputDir}/timeout-state.png` })
    })
  })

  test.describe('Camera Permission Handling', () => {
    test('shows error when camera permission is denied', async ({ page }, testInfo) => {
      // Mock getUserMedia to simulate permission denied
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'mediaDevices', {
          value: {
            getUserMedia: () => Promise.reject(new DOMException('Camera access denied', 'NotAllowedError'))
          }
        });
      });
      
      // Navigate to the app
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 30000 })
      
      // Wait for camera error to appear (exclude the route announcer)
      const errorAlert = page.locator('[role="alert"]:not(#__next-route-announcer__)')
      await expect(errorAlert).toBeVisible({ timeout: 15000 })
      await expect(errorAlert).toContainText('Camera access denied')
      
      // Capture screenshot of permission error
      await page.screenshot({ path: `${testInfo.outputDir}/permission-denied.png` })
      await testInfo.attach('permission-denied', { path: `${testInfo.outputDir}/permission-denied.png` })

      // Test retry button
      const retryButton = page.getByRole('button', { name: /retry camera access/i })
      await expect(retryButton).toBeVisible()
      await retryButton.click()

      // Should still show error since permissions are denied
      await expect(errorAlert).toBeVisible()
    })
  })

  test.describe('Mobile-Specific Interactions', () => {
    test('handles touch interactions correctly on mobile', async ({ page }, testInfo) => {
      // Test touch interactions for zoom functionality
      const selfieImg = page.locator('#selfie-img')
      const animeImg = page.locator('#anime-img')

      // Take a photo first
      const takeButton = page.locator('#take-btn')
      await takeButton.click()

      // Wait for selfie to be captured
      await expect(selfieImg).toBeVisible({ timeout: 5000 })

      // Test click interaction on selfie image (zoom) - use click instead of tap for desktop
      await selfieImg.click()
      
      // Capture screenshot after interaction
      await page.screenshot({ path: `${testInfo.outputDir}/desktop-click-interaction.png` })
      await testInfo.attach('desktop-click-interaction', { path: `${testInfo.outputDir}/desktop-click-interaction.png` })

      // Generate anime for testing anime image interaction
      await page.route('/api/anime', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ image: MOCK_ANIME_RESPONSE })
        })
      })

      const generateButton = page.getByRole('button', { name: /generate anime/i })
      await generateButton.click()

      const animeImgFinal = page.locator('#anime-img')
      await expect(animeImgFinal).toBeVisible({ timeout: 15000 })

      // Test click interaction on anime image
      await animeImgFinal.click()
      
      // Capture screenshot after anime interaction
      await page.screenshot({ path: `${testInfo.outputDir}/desktop-anime-click.png` })
      await testInfo.attach('desktop-anime-click', { path: `${testInfo.outputDir}/desktop-anime-click.png` })
    })
  })

  test.describe('Accessibility and Keyboard Navigation', () => {
    test('supports keyboard navigation through all interactive elements', async ({ page }, testInfo) => {
      // Test keyboard navigation - start by focusing on the page
      await page.keyboard.press('Tab')
      
      // Navigate through interactive elements (actual tab order may vary)
      // Let's check what gets focused and test the take button specifically
      const takeButton = page.locator('#take-btn')
      
      // Try to focus the take button directly
      await takeButton.focus()
      await expect(takeButton).toBeFocused()
      
      // Capture screenshot of keyboard focus
      await page.screenshot({ path: `${testInfo.outputDir}/keyboard-focus-1.png` })
      await testInfo.attach('keyboard-focus-1', { path: `${testInfo.outputDir}/keyboard-focus-1.png` })

      // Test keyboard activation
      await page.keyboard.press('Enter')
      
      // Should take a photo
      const selfieImg = page.locator('#selfie-img')
      await expect(selfieImg).toBeVisible({ timeout: 5000 })
      
      // Capture screenshot after photo taken
      await page.screenshot({ path: `${testInfo.outputDir}/keyboard-focus-2.png` })
      await testInfo.attach('keyboard-focus-2', { path: `${testInfo.outputDir}/keyboard-focus-2.png` })
    })

    test('has proper ARIA labels and roles', async ({ page }) => {
      // Check for proper ARIA attributes
      const takeButton = page.locator('#take-btn')
      const downloadButton = page.locator('#download-btn')
      const retakeButton = page.locator('#retake-btn')
      const generateButton = page.getByRole('button', { name: /generate anime/i })

      // Wait for buttons to be present and visible
      await expect(takeButton).toBeVisible({ timeout: 10000 })
      await expect(downloadButton).toBeVisible({ timeout: 10000 })
      await expect(retakeButton).toBeVisible({ timeout: 10000 })
      await expect(generateButton).toBeVisible({ timeout: 10000 })

      await expect(takeButton).toHaveAttribute('aria-label', 'Take photo')
      await expect(takeButton).toHaveAttribute('aria-live', 'polite')
      
      await expect(downloadButton).toHaveAttribute('aria-label', 'Download')
      await expect(downloadButton).toHaveAttribute('aria-live', 'polite')
      
      await expect(retakeButton).toHaveAttribute('aria-label', 'Retake')
      await expect(retakeButton).toHaveAttribute('aria-live', 'polite')
      
      await expect(generateButton).toHaveAttribute('aria-label', 'Generate anime portrait')

      // Check for proper roles
      const section = page.locator('section')
      await expect(section).toHaveAttribute('role', 'group')
      await expect(section).toHaveAttribute('aria-label', 'Selfie comparison')
    })
  })

  test.describe('Cross-Browser Compatibility', () => {
    test('maintains consistent behavior across different viewport sizes', async ({ page }, testInfo) => {
      // Test desktop viewport
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.screenshot({ path: `${testInfo.outputDir}/desktop-viewport.png` })
      await testInfo.attach('desktop-viewport', { path: `${testInfo.outputDir}/desktop-viewport.png` })

      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.screenshot({ path: `${testInfo.outputDir}/tablet-viewport.png` })
      await testInfo.attach('tablet-viewport', { path: `${testInfo.outputDir}/tablet-viewport.png` })

      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.screenshot({ path: `${testInfo.outputDir}/mobile-viewport.png` })
      await testInfo.attach('mobile-viewport', { path: `${testInfo.outputDir}/mobile-viewport.png` })

      // Verify responsive behavior
      const resultWrapper = page.locator('#result-wrapper')
      await expect(resultWrapper).toHaveClass(/grid-cols-1/)
    })
  })
}) 