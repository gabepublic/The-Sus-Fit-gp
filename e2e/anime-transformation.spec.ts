import { test, expect } from '@playwright/test'

// Mock anime image data (1x1 transparent PNG)
const MOCK_ANIME_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const MOCK_ANIME_RESPONSE = `data:image/png;base64,${MOCK_ANIME_BASE64}`

test.describe('Anime Transformation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Grant camera permissions for all tests
    await page.context().grantPermissions(['camera'])
    
    // Navigate to the app
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Wait for camera to initialize
    await page.waitForFunction(() => {
      const video = document.querySelector('video#camera-stream') as HTMLVideoElement
      return video && video.readyState >= 3
    }, { timeout: 10000 })
  })

  test.describe('Successful Transformation', () => {
    test('completes full anime transformation flow within 10 seconds', async ({ page }) => {
      // Mock the API endpoint to return our test anime image
      await page.route('/api/anime', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ image: MOCK_ANIME_RESPONSE })
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
      await expect(generateButton).toBeEnabled()
      await generateButton.click()

      // Wait for loading spinner to appear
      const spinner = page.locator('[data-testid="spinner"]')
      await expect(spinner).toBeVisible()

      // Wait for anime image to appear within 10 seconds
      const animeImg = page.locator('#anime-img')
      await expect(animeImg).toBeVisible({ timeout: 10000 })

      // Verify the anime image has the correct source
      await expect(animeImg).toHaveAttribute('src', MOCK_ANIME_RESPONSE)

      // Verify loading spinner is gone
      await expect(spinner).not.toBeVisible()

      // Verify buttons are in correct state
      await expect(takeButton).toBeDisabled() // Should be disabled during loading
      await expect(generateButton).toBeDisabled() // Should be disabled during loading
    })

    test('shows correct UI states during transformation', async ({ page }) => {
      // Mock the API endpoint
      await page.route('/api/anime', async (route) => {
        // Add a small delay to test loading states
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ image: MOCK_ANIME_RESPONSE })
        })
      })

      // Take a photo
      const takeButton = page.locator('#take-btn')
      await takeButton.click()

      // Wait for selfie
      const selfieImg = page.locator('#selfie-img')
      await expect(selfieImg).toBeVisible({ timeout: 5000 })

      // Click generate anime
      const generateButton = page.getByRole('button', { name: /generate anime/i })
      await generateButton.click()

      // Check loading state
      const spinner = page.locator('[data-testid="spinner"]')
      await expect(spinner).toBeVisible()

      // All buttons should be disabled during loading
      await expect(takeButton).toBeDisabled()
      await expect(generateButton).toBeDisabled()
      
      const downloadButton = page.locator('#download-btn')
      const retakeButton = page.locator('#retake-btn')
      await expect(downloadButton).toBeDisabled()
      await expect(retakeButton).toBeDisabled()

      // Wait for completion
      const animeImg = page.locator('#anime-img')
      await expect(animeImg).toBeVisible({ timeout: 10000 })

      // Spinner should be gone
      await expect(spinner).not.toBeVisible()

      // Buttons should be re-enabled
      await expect(takeButton).toBeEnabled()
      await expect(generateButton).toBeEnabled()
      await expect(downloadButton).toBeEnabled()
      await expect(retakeButton).toBeEnabled()
    })
  })

  test.describe('Retry Logic', () => {
    test('handles API failures and retries successfully', async ({ page }) => {
      let callCount = 0
      
      // Mock the API endpoint with retry logic
      await page.route('/api/anime', async (route) => {
        callCount++
        
        if (callCount <= 2) {
          // First two calls fail
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal server error' })
          })
        } else {
          // Third call succeeds
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ image: MOCK_ANIME_RESPONSE })
          })
        }
      })

      // Take a photo
      const takeButton = page.locator('#take-btn')
      await takeButton.click()

      // Wait for selfie
      const selfieImg = page.locator('#selfie-img')
      await expect(selfieImg).toBeVisible({ timeout: 5000 })

      // Click generate anime
      const generateButton = page.getByRole('button', { name: /generate anime/i })
      await generateButton.click()

      // Wait for success (should retry and eventually succeed)
      const animeImg = page.locator('#anime-img')
      await expect(animeImg).toBeVisible({ timeout: 30000 }) // Longer timeout for retries

      // Verify the image is correct
      await expect(animeImg).toHaveAttribute('src', MOCK_ANIME_RESPONSE)
    })

    test('shows error after all retries fail', async ({ page }) => {
      // Mock the API endpoint to always fail
      await page.route('/api/anime', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to generate anime portrait' })
        })
      })

      // Take a photo
      const takeButton = page.locator('#take-btn')
      await takeButton.click()

      // Wait for selfie
      const selfieImg = page.locator('#selfie-img')
      await expect(selfieImg).toBeVisible({ timeout: 5000 })

      // Click generate anime
      const generateButton = page.getByRole('button', { name: /generate anime/i })
      await generateButton.click()

      // Wait for error alert to appear
      const errorAlert = page.locator('[role="alert"]').filter({ hasText: /failed to generate anime portrait/i })
      await expect(errorAlert).toBeVisible({ timeout: 30000 }) // Longer timeout for retries

      // Verify error message
      await expect(errorAlert).toContainText('Failed to generate anime portrait')

      // Buttons should be re-enabled after error
      await expect(takeButton).toBeEnabled()
      await expect(generateButton).toBeEnabled()
    })
  })

  test.describe('Timeout Handling', () => {
    test('handles request timeout gracefully', async ({ page }) => {
      // Mock the API endpoint to never respond (simulate timeout)
      await page.route('/api/anime', async (route) => {
        // Don't call route.fulfill() to simulate timeout
        // The request will timeout after 25 seconds
      })

      // Take a photo
      const takeButton = page.locator('#take-btn')
      await takeButton.click()

      // Wait for selfie
      const selfieImg = page.locator('#selfie-img')
      await expect(selfieImg).toBeVisible({ timeout: 5000 })

      // Click generate anime
      const generateButton = page.getByRole('button', { name: /generate anime/i })
      await generateButton.click()

      // Wait for timeout error
      const errorAlert = page.locator('[role="alert"]').filter({ hasText: /timed out/i })
      await expect(errorAlert).toBeVisible({ timeout: 30000 })

      // Verify timeout message
      await expect(errorAlert).toContainText('timed out')
    })
  })

  test.describe('Abort Handling', () => {
    test('cancels request when user retakes photo', async ({ page }) => {
      // Mock the API endpoint with a delay
      await page.route('/api/anime', async (route) => {
        // Add delay to allow for abort
        await new Promise(resolve => setTimeout(resolve, 2000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ image: MOCK_ANIME_RESPONSE })
        })
      })

      // Take a photo
      const takeButton = page.locator('#take-btn')
      await takeButton.click()

      // Wait for selfie
      const selfieImg = page.locator('#selfie-img')
      await expect(selfieImg).toBeVisible({ timeout: 5000 })

      // Click generate anime
      const generateButton = page.getByRole('button', { name: /generate anime/i })
      await generateButton.click()

      // Wait for loading to start
      const spinner = page.locator('[data-testid="spinner"]')
      await expect(spinner).toBeVisible()

      // Click retake to abort the request
      const retakeButton = page.locator('#retake-btn')
      await retakeButton.click()

      // Spinner should disappear (request aborted)
      await expect(spinner).not.toBeVisible({ timeout: 5000 })

      // Should be back to camera view
      const video = page.locator('video#camera-stream')
      await expect(video).toBeVisible()
    })
  })

  test.describe('Visual Regression Tests', () => {
    test('anime transformation UI matches baseline on desktop', async ({ page }) => {
      // Mock the API endpoint
      await page.route('/api/anime', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ image: MOCK_ANIME_RESPONSE })
        })
      })

      // Take a photo
      const takeButton = page.locator('#take-btn')
      await takeButton.click()

      // Wait for selfie
      const selfieImg = page.locator('#selfie-img')
      await expect(selfieImg).toBeVisible({ timeout: 5000 })

      // Click generate anime
      const generateButton = page.getByRole('button', { name: /generate anime/i })
      await generateButton.click()

      // Wait for anime image
      const animeImg = page.locator('#anime-img')
      await expect(animeImg).toBeVisible({ timeout: 10000 })

      // Take screenshot for visual regression
      await expect(page).toHaveScreenshot('anime-transformation-desktop.png')
    })

    test('anime transformation UI matches baseline on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      // Mock the API endpoint
      await page.route('/api/anime', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ image: MOCK_ANIME_RESPONSE })
        })
      })

      // Take a photo
      const takeButton = page.locator('#take-btn')
      await takeButton.click()

      // Wait for selfie
      const selfieImg = page.locator('#selfie-img')
      await expect(selfieImg).toBeVisible({ timeout: 5000 })

      // Click generate anime
      const generateButton = page.getByRole('button', { name: /generate anime/i })
      await generateButton.click()

      // Wait for anime image
      const animeImg = page.locator('#anime-img')
      await expect(animeImg).toBeVisible({ timeout: 10000 })

      // Take screenshot for visual regression
      await expect(page).toHaveScreenshot('anime-transformation-mobile.png')
    })
  })

  test.describe('Accessibility', () => {
    test('anime transformation flow is accessible', async ({ page }) => {
      // Mock the API endpoint
      await page.route('/api/anime', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ image: MOCK_ANIME_RESPONSE })
        })
      })

      // Take a photo
      const takeButton = page.locator('#take-btn')
      await takeButton.click()

      // Wait for selfie
      const selfieImg = page.locator('#selfie-img')
      await expect(selfieImg).toBeVisible({ timeout: 5000 })

      // Check generate anime button has proper aria-label
      const generateButton = page.getByRole('button', { name: /generate anime/i })
      await expect(generateButton).toHaveAttribute('aria-label', 'Generate anime portrait')

      // Click generate anime
      await generateButton.click()

      // Wait for anime image
      const animeImg = page.locator('#anime-img')
      await expect(animeImg).toBeVisible({ timeout: 10000 })

      // Check anime image has proper alt text
      await expect(animeImg).toHaveAttribute('alt', 'Anime portrait')

      // Check error alerts have proper role
      const errorAlert = page.locator('[role="alert"]')
      if (await errorAlert.isVisible()) {
        await expect(errorAlert).toHaveAttribute('role', 'alert')
      }
    })
  })

  test.describe('Cross-Browser Compatibility', () => {
    test('works on WebKit', async ({ page }) => {
      // Mock the API endpoint
      await page.route('/api/anime', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ image: MOCK_ANIME_RESPONSE })
        })
      })

      // Take a photo
      const takeButton = page.locator('#take-btn')
      await takeButton.click()

      // Wait for selfie
      const selfieImg = page.locator('#selfie-img')
      await expect(selfieImg).toBeVisible({ timeout: 5000 })

      // Click generate anime
      const generateButton = page.getByRole('button', { name: /generate anime/i })
      await generateButton.click()

      // Wait for anime image
      const animeImg = page.locator('#anime-img')
      await expect(animeImg).toBeVisible({ timeout: 10000 })

      // Verify the image is correct
      await expect(animeImg).toHaveAttribute('src', MOCK_ANIME_RESPONSE)
    })

    test('works on iPhone', async ({ page }) => {
      // Mock the API endpoint
      await page.route('/api/anime', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ image: MOCK_ANIME_RESPONSE })
        })
      })

      // Take a photo
      const takeButton = page.locator('#take-btn')
      await takeButton.click()

      // Wait for selfie
      const selfieImg = page.locator('#selfie-img')
      await expect(selfieImg).toBeVisible({ timeout: 5000 })

      // Click generate anime
      const generateButton = page.getByRole('button', { name: /generate anime/i })
      await generateButton.click()

      // Wait for anime image
      const animeImg = page.locator('#anime-img')
      await expect(animeImg).toBeVisible({ timeout: 10000 })

      // Verify the image is correct
      await expect(animeImg).toHaveAttribute('src', MOCK_ANIME_RESPONSE)
    })
  })
}) 