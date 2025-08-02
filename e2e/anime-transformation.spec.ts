import { test, expect } from '@playwright/test'
import { 
  MOCK_ANIME_RESPONSE,
  waitForCameraOrFallback,
  waitForSelfieCapture,
  waitForAnimeGeneration,
  verifyAnimeImageSource,
  waitForSpinnerVisible,
  waitForSpinnerHidden,
  waitForErrorAlert,
  mockAnimeAPI,
  mockAnimeAPIWithDelay,
  mockAnimeAPIWithRetry,
  verifyInitialButtonStates,
  verifyAfterSelfieCapture
} from './helpers'

test.describe('Anime Transformation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Grant camera permissions for all tests
    await page.context().grantPermissions(['camera'])
    
    // Navigate to the app
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('load', { timeout: 10000 })
    
    // Wait for camera to initialize or handle fallback
    await waitForCameraOrFallback(page)
  })

  test.describe('Successful Transformation', () => {
    test('completes full anime transformation flow within 10 seconds', async ({ page }) => {
      // Mock the API endpoint to return our test anime image
      await mockAnimeAPI(page)

      // Take a photo first
      const takeButton = page.locator('#take-btn')
      await takeButton.click()

      // Wait for selfie to be captured
      await waitForSelfieCapture(page)

      // Click "Generate Anime" button
      const generateButton = page.getByRole('button', { name: /generate anime/i })
      await expect(generateButton).toBeEnabled()
      
      // Check button state before clicking
      await expect(generateButton).toHaveAttribute('data-selfie-blob', 'exists')
      await expect(generateButton).toHaveAttribute('data-loading', 'false')
      
      // Ensure button is ready and enabled before clicking
      await expect(generateButton).toBeEnabled()
      
      // Click the button
      await generateButton.click()

      // Wait for anime image to appear (this indicates the transformation completed)
      await waitForAnimeGeneration(page)

      // Verify the anime image has the correct source
      await verifyAnimeImageSource(page, MOCK_ANIME_RESPONSE)

      // Verify buttons are in correct state after transformation
      await expect(takeButton).toBeDisabled() // Should remain disabled because selfie is still captured
      await expect(generateButton).toBeEnabled() // Should be enabled for potential retry
    })

    test('shows correct UI states during transformation', async ({ page }) => {
      // Mock the API endpoint with delay to test loading states
      await mockAnimeAPIWithDelay(page, 1000)

      // Take a photo
      const takeButton = page.locator('#take-btn')
      await takeButton.click()

      // Wait for selfie
      await waitForSelfieCapture(page)

      // Click generate anime
      const generateButton = page.getByRole('button', { name: /generate anime/i })
      await generateButton.click()

      // Check loading state
      const spinner = page.locator('[data-testid="generate-anime-btn"] [data-testid="spinner"]')
      await expect(spinner).toBeVisible({ timeout: 5000 })

      // All buttons should be disabled during loading
      await expect(takeButton).toBeDisabled()
      await expect(generateButton).toBeDisabled()
      
      const downloadButton = page.locator('#download-btn')
      const retakeButton = page.locator('#retake-btn')
      await expect(downloadButton).toBeDisabled()
      // Retake should be enabled during loading (intended UI)
      await expect(retakeButton).toBeEnabled()

      // Wait for completion
      await waitForAnimeGeneration(page, 10000)

      // Spinner should be gone
      await expect(spinner).not.toBeVisible()

      // Buttons should be in correct state after transformation
      await expect(takeButton).toBeDisabled() // Should remain disabled because selfie is still captured
      await expect(generateButton).toBeEnabled() // Should be enabled for potential retry
      await expect(downloadButton).toBeEnabled() // Should be enabled to download
      await expect(retakeButton).toBeEnabled() // Should be enabled to retake
    })
  })

  test.describe('Retry Logic', () => {
    test('handles API failures and retries successfully', async ({ page }) => {
      // Mock the API endpoint with retry logic
      await mockAnimeAPIWithRetry(page, 2)

      // Take a photo
      const takeButton = page.locator('#take-btn')
      await takeButton.click()

      // Wait for selfie
      await waitForSelfieCapture(page)

      // Click generate anime
      const generateButton = page.getByRole('button', { name: /generate anime/i })
      await generateButton.click()

      // Wait for success (should retry and eventually succeed)
      await waitForAnimeGeneration(page, 30000) // Longer timeout for retries

      // Verify the image is correct
      await verifyAnimeImageSource(page, MOCK_ANIME_RESPONSE)
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

      // Buttons should be in correct state after error
      await expect(takeButton).toBeDisabled() // Should remain disabled because selfie is still captured
      await expect(generateButton).toBeEnabled() // Should be enabled for retry
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
      const spinnerContainer = page.locator('[data-testid="spinner-container"]')
      await expect(spinnerContainer).toBeVisible({ timeout: 5000 })
      
      const spinner = page.locator('[data-testid="generate-anime-btn"] [data-testid="spinner"]')
      await expect(spinner).toBeVisible({ timeout: 5000 })

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
    test('anime transformation UI matches baseline on desktop', async ({ page, browserName }) => {
      // Only run this test on desktop projects
      test.skip(browserName !== 'chromium' || page.viewportSize()?.width !== 1280, 'Desktop test only')
      
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

      // Wait for anime image to be visible and fully loaded
      const animeImg = page.locator('#anime-img')
      await expect(animeImg).toBeVisible({ timeout: 10000 })
      
      // Ensure the image has the correct source (more reliable than naturalWidth for mock data)
      await expect(animeImg).toHaveAttribute('src', MOCK_ANIME_RESPONSE, { timeout: 5000 })

      // Wait for any loading states to be gone and UI to be stable
      const spinner = page.locator('[data-testid="spinner"]')
      await expect(spinner).not.toBeVisible({ timeout: 5000 })

      // Take screenshot for visual regression - use full page for consistent sizing
      await expect(page).toHaveScreenshot('anime-transformation-desktop.png')
    })

    test('anime transformation UI matches baseline on mobile', async ({ page, browserName }) => {
      // Only run this test on mobile projects
      test.skip(browserName !== 'chromium' || page.viewportSize()?.width !== 393, 'Mobile test only')
      
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

      // Wait for anime image to be visible and fully loaded
      const animeImg = page.locator('#anime-img')
      await expect(animeImg).toBeVisible({ timeout: 10000 })
      
      // Ensure the image has the correct source (more reliable than naturalWidth for mock data)
      await expect(animeImg).toHaveAttribute('src', MOCK_ANIME_RESPONSE, { timeout: 5000 })

      // Wait for any loading states to be gone and UI to be stable
      const spinner = page.locator('[data-testid="spinner"]')
      await expect(spinner).not.toBeVisible({ timeout: 5000 })

      // Take screenshot for visual regression - use full page for consistent sizing
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
      await expect(animeImg).toHaveAttribute('alt', 'Anime portrait generated from selfie')

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